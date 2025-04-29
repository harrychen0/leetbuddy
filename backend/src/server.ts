// backend/src/server.ts
import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '../.env' });

const app = express();
const port = process.env.BACKEND_PORT || 3000; // Port for your backend proxy

// Ensure RapidAPI credentials are loaded
const rapidApiKey = process.env.RAPIDAPI_JUDGE0_KEY;
const rapidApiHost = process.env.RAPIDAPI_JUDGE0_HOST;

if (!rapidApiKey || !rapidApiHost) {
  console.error("Error: RAPIDAPI_JUDGE0_KEY or RAPIDAPI_JUDGE0_HOST not found in .env file.");
  process.exit(1); // Exit if keys are missing
}

const JUDGE0_API_BASE_URL = `https://${rapidApiHost}`; // Construct base URL

app.use(cors()); // Allow requests from your frontend (running on a different port)
app.use(express.json()); // Parse JSON request bodies

// Common headers for RapidAPI
const rapidApiHeaders = {
  'X-RapidAPI-Key': rapidApiKey,
  'X-RapidAPI-Host': rapidApiHost,
  'Content-Type': 'application/json',
};

// Polling function updated for RapidAPI
const pollForResult = async (token: string): Promise<any> => {
  const maxAttempts = 15; // Increased attempts for potential cloud latency
  const interval = 1500; // Slightly longer interval

  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Request specific fields for efficiency
      const response = await axios.get(
        `${JUDGE0_API_BASE_URL}/submissions/${token}?base64_encoded=false&fields=status,stdout,stderr,compile_output,time,memory,message`,
        { headers: rapidApiHeaders } // Use RapidAPI headers
      );

      const statusId = response.data?.status?.id;

      // Status IDs: 1=In Queue, 2=Processing, 3+=Finished
      if (statusId && statusId >= 3) {
        console.log(`Submission ${token} finished with status: ${response.data.status.description}`);
        return response.data; // Return the final result
      }
      // If still processing, wait and poll again
      console.log(`Submission ${token} status: ${response.data?.status?.description || 'Polling...'}`);
      await new Promise(resolve => setTimeout(resolve, interval));

    } catch (error: any) {
      console.error(`Error polling submission ${token}:`, error.response?.data || error.message);
      // Consider specific error handling (e.g., 404 might mean token expired/invalid)
      throw new Error(`Failed to poll Judge0 RapidAPI for token ${token}`);
    }
  }
  throw new Error(`Polling timed out for submission ${token}`);
};


// Define an async middleware wrapper to handle errors properly
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Endpoint to receive code from frontend and send to Judge0 RapidAPI
app.post('/api/submit', asyncHandler(async (req: Request, res: Response) => {
  const { source_code, language_id, stdin } = req.body;

  if (!source_code || !language_id) {
    res.status(400).json({ error: 'Missing source_code or language_id' });
    return; // Explicitly return after sending response
  }

  console.log(`Received submission for RapidAPI: lang=${language_id}, stdin=${stdin ? 'yes' : 'no'}`);
  console.log(`>>> Received stdin value: ${JSON.stringify(stdin)}`); // Log the actual stdin value

  // Send submission to Judge0 RapidAPI (POST does not use 'wait' or 'fields' params)
  const judge0Response = await axios.post(`${JUDGE0_API_BASE_URL}/submissions?base64_encoded=false`, {
    source_code: source_code,
    language_id: language_id,
    stdin: stdin || null, // Send null if stdin is empty/undefined
    // Add expected_output, resource limits etc. here if needed (check RapidAPI docs)
  }, { headers: rapidApiHeaders }); // Use RapidAPI headers

  const token = judge0Response.data.token;
  if (!token) {
    throw new Error('Judge0 RapidAPI did not return a submission token.');
  }
  console.log(`Judge0 RapidAPI submission created with token: ${token}`);

  // Poll Judge0 RapidAPI for the result using the token
  const result = await pollForResult(token);
  res.json(result); // Send the final result back to the frontend
}));

// Basic Error Handler Middleware (Add at the end)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err.message);
  // Avoid sending detailed error messages in production
  res.status(500).json({ error: 'An unexpected error occurred', details: err.message });
});

app.listen(port, () => {
  console.log(`Leetbuddy backend proxy listening on http://localhost:${port}`);
  console.log(`Configured to use Judge0 Host: ${rapidApiHost}`);
}); 