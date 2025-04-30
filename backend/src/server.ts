// backend/src/server.ts
import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
// Make sure the .env file is in the root of the *project*, not the backend directory
dotenv.config({ path: '../.env' });

const app = express();
const port = process.env.BACKEND_PORT || 3000;

const rapidApiKey = process.env.RAPIDAPI_JUDGE0_KEY;
const rapidApiHost = process.env.RAPIDAPI_JUDGE0_HOST;

if (!rapidApiKey || !rapidApiHost) {
  console.error("Error: RAPIDAPI_JUDGE0_KEY or RAPIDAPI_JUDGE0_HOST not found in .env file.");
  process.exit(1);
}

const JUDGE0_API_BASE_URL = `https://${rapidApiHost}`;

app.use(cors());
app.use(express.json());

const rapidApiHeaders = {
  'X-RapidAPI-Key': rapidApiKey,
  'X-RapidAPI-Host': rapidApiHost,
  'Content-Type': 'application/json',
};

// --- Python Boilerplate Code --- (Can be moved to a separate file/config later)
const pythonBoilerplateTop = `
import sys
import json
from typing import List, Any

`;

const pythonBoilerplateBottom = `

# --- Boilerplate I/O --- (Do not modify below this line)

def main():
    lines = sys.stdin.readlines()
    if len(lines) >= 2:
        try:
            # Assuming first line is JSON list, second line is integer target
            nums_list = json.loads(lines[0])
            target_val = int(lines[1])
            # Call the user's function
            result = two_sum(nums_list, target_val)
            # Output the result as JSON
            print(json.dumps(result))
        except (json.JSONDecodeError, ValueError, IndexError) as e:
            print(f"Error processing input: {e}", file=sys.stderr)
        except Exception as e:
            print(f"Error during execution: {e}", file=sys.stderr)
    else:
      print("Input requires at least two lines: a JSON list of nums and the target integer.", file=sys.stderr)

if __name__ == "__main__":
    main()
`;
// --- End of Boilerplate ---

const pollForResult = async (token: string): Promise<any> => {
  const maxAttempts = 15;
  const interval = 1500;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(
        `${JUDGE0_API_BASE_URL}/submissions/${token}?base64_encoded=false&fields=status,stdout,stderr,compile_output,time,memory,message`,
        { headers: rapidApiHeaders }
      );
      const statusId = response.data?.status?.id;
      if (statusId && statusId >= 3) {
        console.log(`Submission ${token} finished with status: ${response.data.status.description}`);
        return response.data;
      }
      console.log(`Submission ${token} status: ${response.data?.status?.description || 'Polling...'}`);
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error: any) {
      console.error(`Error polling submission ${token}:`, error.response?.data || error.message);
      throw new Error(`Failed to poll Judge0 RapidAPI for token ${token}`);
    }
  }
  throw new Error(`Polling timed out for submission ${token}`);
};

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

app.post('/api/submit', asyncHandler(async (req: Request, res: Response) => {
  const { source_code: userCode, language_id, stdin } = req.body;

  if (!userCode || !language_id) {
    res.status(400).json({ error: 'Missing source_code or language_id' });
    return;
  }

  console.log(`Received submission for RapidAPI: lang=${language_id}, stdin=${stdin ? 'yes' : 'no'}`);

  let finalSourceCode = userCode;

  // --- Wrap user code with boilerplate if it's Python --- (Adjust lang ID if needed)
  if (language_id === 71) { // 71 is Python (3.8.1) in Judge0 CE
    finalSourceCode = `${pythonBoilerplateTop}\n${userCode}\n${pythonBoilerplateBottom}`;
    console.log('>>> Wrapped Python code for submission.');
  } else {
    console.log(`>>> Language ID ${language_id} is not Python, submitting code as-is.`);
  }
  // --- End of Wrapping Logic ---

  const judge0Response = await axios.post(`${JUDGE0_API_BASE_URL}/submissions?base64_encoded=false`, {
    source_code: finalSourceCode, // Send the wrapped code
    language_id: language_id,
    stdin: stdin || null,
  }, { headers: rapidApiHeaders });

  const token = judge0Response.data.token;
  if (!token) {
    throw new Error('Judge0 RapidAPI did not return a submission token.');
  }
  console.log(`Judge0 RapidAPI submission created with token: ${token}`);

  const result = await pollForResult(token);
  res.json(result);
}));

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err.message);
  res.status(500).json({ error: 'An unexpected error occurred', details: err.message });
});

app.listen(port, () => {
  console.log(`Leetbuddy backend proxy listening on http://localhost:${port}`);
  console.log(`Configured to use Judge0 Host: ${rapidApiHost}`);
}); 