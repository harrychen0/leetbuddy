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

// --- Test Case Storage (Move to DB or separate file later) ---
interface TestCase {
  input: { [key: string]: any };
  expected: any;
}

const problemTestCases: { [key: string]: TestCase[] } = {
  'two-sum': [
    { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
    { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
    { input: { nums: [3, 3], target: 6 }, expected: [0, 1] },
    { input: { nums: [1, 5, 8, 12, 20], target: 28 }, expected: [2, 4] }, // Corrected expected index
    { input: { nums: [-1, -2, -3, -4, -5], target: -8 }, expected: [2, 4] },
    { input: { nums: [0, 4, 3, 0], target: 0 }, expected: [0, 3] },
    { input: { nums: [5, 75, 25], target: 100 }, expected: [1, 2] }
  ]
  // Add other problems here...
};
// --- End of Test Case Storage ---


// --- Judge0 Polling Logic ---
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
      // Statuses: 1=In Queue, 2=Processing, 3=Accepted, 4=Wrong Answer, 5=Time Limit Exceeded,
      // 6=Compilation Error, 7=Runtime Error (SIGSEGV), ..., 13=Internal Error, 14=Exec Format Error
      if (statusId && statusId >= 3) {
        console.log(`Submission ${token} finished with status: ${response.data.status.description} (ID: ${statusId})`);
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
// --- End of Polling Logic ---

// --- Async Handler Wrapper ---
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
// --- End of Async Handler ---

// --- Helper: Submit Code to Judge0 (No wrapper here) ---
async function submitToJudge0(languageId: number, sourceCode: string, stdin: string | null): Promise<string> {
    const judge0Response = await axios.post(`${JUDGE0_API_BASE_URL}/submissions?base64_encoded=false`, {
        source_code: sourceCode,
        language_id: languageId,
        stdin: stdin,
        // Add resource limits if needed
        // cpu_time_limit: 1, // seconds
        // memory_limit: 128000, // KB
    }, { headers: rapidApiHeaders });

    const token = judge0Response.data.token;
    if (!token) {
        throw new Error('Judge0 RapidAPI did not return a submission token.');
    }
    console.log(`Judge0 RapidAPI submission created with token: ${token}`);
    return token;
}
// --- End of Helper ---

// --- Python Boilerplate for Custom Input (/api/submit) ---
const pythonCustomInputBoilerplate = `
import sys
import json
from typing import List, Any

# --- User's code will be inserted above ---

# --- Boilerplate I/O for Custom Input --- 
def execute_custom_input():
    lines = sys.stdin.readlines()
    if len(lines) >= 2:
        nums_str = lines[0].strip()
        target_str = lines[1].strip()
        try:
            # Attempt to parse nums_str as JSON list
            nums_list = json.loads(nums_str)
            if not isinstance(nums_list, list):
                raise ValueError("Input nums is not a valid JSON list.")
            # Attempt to parse target_str as integer
            target_val = int(target_str)

            # Call the user's function (assuming it's named two_sum)
            # TODO: Make function name dynamic if supporting other problems
            result = two_sum(nums_list, target_val)

            # Sort list result for consistent output if needed
            if isinstance(result, list):
                result.sort()

            # Output the result as JSON
            print(json.dumps(result))

        except json.JSONDecodeError as e:
            print(f"Input Error: Could not parse Nums input as JSON list. Ensure format is like [1, 2, 3]. Error: {e}", file=sys.stderr)
            sys.exit(1)
        except ValueError as e:
            print(f"Input Error: {e}", file=sys.stderr)
            sys.exit(1)
        except NameError as e:
            # Catch if the user didn't define the expected function
            if "two_sum" in str(e):
                print(f"Runtime Error: Function 'two_sum(nums, target)' not defined or named incorrectly.", file=sys.stderr)
            else:
                print(f"Runtime Error: {e}", file=sys.stderr)
            sys.exit(1)
        except Exception as e:
            print(f"Runtime Error during execution: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        print("Input Error: Custom input requires two lines: a JSON list for Nums and an integer for Target.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    execute_custom_input()
# --- End of Boilerplate ---
`;
// --- End of Custom Input Boilerplate ---


// --- MODIFIED /api/submit endpoint for Custom Input Execution ---
app.post('/api/submit', asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { language_id, source_code, stdin } = req.body;

  if (!language_id || !source_code) {
    res.status(400).json({ status: 'Error', error: 'Missing language_id or source_code.' });
    return;
  }

  // Currently, only Python custom input is supported with boilerplate
  if (language_id !== 71) {
      res.status(400).json({ status: 'Error', error: `Language ID ${language_id} not supported for custom input execution via this endpoint.` });
      return;
  }

  console.log(`Received custom input submission: lang=${language_id}, stdin provided: ${stdin ? 'yes' : 'no'}`);

  // Wrap user code with the specific custom input boilerplate
  const finalSourceCode = `${source_code}\n\n${pythonCustomInputBoilerplate}`;

  try {
    const token = await submitToJudge0(language_id, finalSourceCode, stdin || null);
    const result = await pollForResult(token);
    // Return the raw result from Judge0 for the frontend to display
    res.json(result);
  } catch (error) {
    // Let the global error handler deal with submission/polling errors
    next(error);
  }
}));
// --- End of Modified Endpoint ---

// --- Endpoint: /api/run-tests (No changes needed here) ---
app.post('/api/run-tests', asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { problem_id, language_id, user_code } = req.body;

  if (!problem_id || !language_id || !user_code) {
     res.status(400).json({ status: 'Error', error: 'Missing problem_id, language_id, or user_code.' });
     return; // Exit after sending response
  }

  if (language_id !== 71) { // Currently only supports Python
     res.status(400).json({ status: 'Error', error: `Language ID ${language_id} not supported for testing.` });
     return; // Exit after sending response
  }

  const tests = problemTestCases[problem_id];
  if (!tests) {
    res.status(404).json({ status: 'Error', error: `Problem '${problem_id}' not found or has no test cases.` });
    return; // Exit after sending response
  }

  let overallStatus = 'Accepted';
  let aggregatedTime = 0;
  let aggregatedMemory = 0;
  let firstFailureOutput = null;
  let firstFailureDetails: any = null;
  let passedTests = 0; // Keep track of passed tests

  console.log(`Running ${tests.length} tests for problem '${problem_id}'...`);

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const testInput = test.input;

    // Construct the specific Python code for this test case
    // This assumes the user code provides a function named 'two_sum'
    const testExecutionCode = `
${user_code}

# --- Test Runner --- (Internal)
import json
import sys

try:
    nums_input = ${JSON.stringify(testInput.nums)}
    target_input = ${testInput.target}
    result = two_sum(nums_input, target_input)
    if isinstance(result, list):
        result.sort()
    print(json.dumps(result))
except Exception as e:
    print(f"Runtime Error during test: {e}", file=sys.stderr)
    sys.exit(1) # Indicate failure
`;

    let token: string | null = null;
    try {
      // Submit this specific test case execution code to Judge0
      token = await submitToJudge0(language_id, testExecutionCode, null); // No stdin needed here
      const result = await pollForResult(token);

      // Aggregate time and memory (max)
      aggregatedTime = Math.max(aggregatedTime, parseFloat(result.time || 0));
      aggregatedMemory = Math.max(aggregatedMemory, parseInt(result.memory || 0));

      // Check Judge0 status
      if (result.status.id > 3) { // 3 is 'Accepted'
        overallStatus = result.status.description;
        // More informative failure message
        firstFailureOutput = `Failed on Test Case ${i + 1}: ${result.status.description}`;
        firstFailureDetails = {
            testCase: i + 1,
            input: testInput,
            error: result.stderr || result.compile_output || result.message || 'Execution error',
        };
        console.error(`Test ${i+1} failed (${overallStatus}) for token ${token}:`, firstFailureDetails.error);
        break; // Stop on first error (Compilation, Runtime, TLE, etc.)
      }

      // Validate stdout if Judge0 status is 'Accepted'
      let actualOutput;
      try {
        actualOutput = JSON.parse(result.stdout?.trim() || 'null');
      } catch (parseError) {
        overallStatus = 'Wrong Answer';
        firstFailureOutput = `Failed on Test Case ${i + 1}: Output Format Error`;
        firstFailureDetails = {
            testCase: i + 1,
            input: testInput,
            expected: test.expected,
            gotRaw: result.stdout || '(No output)',
            error: `Could not parse output as JSON: ${parseError}`
        };
        console.error(`Test ${i+1} failed (Wrong Answer - Format) for token ${token}. Raw Output:`, result.stdout);
        break; // Stop on first failure
      }

      // Sort expected result for comparison
      let expectedOutput = [...test.expected]; // Create a copy
      if (Array.isArray(expectedOutput)) {
          expectedOutput.sort();
      }

      // Compare (assuming simple array/JSON comparison is sufficient)
      // Actual output is already sorted if it was a list in the runner code
      if (JSON.stringify(actualOutput) !== JSON.stringify(expectedOutput)) {
        overallStatus = 'Wrong Answer';
        firstFailureOutput = `Failed on Test Case ${i + 1}: Wrong Answer`;
        firstFailureDetails = {
            testCase: i + 1,
            input: testInput,
            expected: expectedOutput,
            got: actualOutput,
        };
        console.error(`Test ${i+1} failed (Wrong Answer) for token ${token}. Expected: ${JSON.stringify(expectedOutput)}, Got: ${JSON.stringify(actualOutput)}`);
        break; // Stop on first wrong answer
      }

      // If we reach here, the test case passed
      passedTests++;
      console.log(`Test Case ${i + 1} Passed (Token: ${token})`);

    } catch (error: any) {
      // Handle errors during submission or polling for this specific test case
      console.error(`System error during test case ${i + 1} (Token: ${token}):`, error.message);
      overallStatus = 'System Error'; // Set status before passing to error handler
      firstFailureOutput = `System Error during Test Case ${i + 1}`;
      firstFailureDetails = { testCase: i + 1, error: error.message };
      // Use next to pass the error to the global error handler, but we've already captured the state
      return next(error);
    }
  }

  // --- Format and Send Response --- 
  const totalTests = tests.length;
  const responsePayload: { [key: string]: any } = {
    status: overallStatus,
    time: aggregatedTime > 0 ? aggregatedTime.toFixed(3) : null,
    memory: aggregatedMemory > 0 ? aggregatedMemory : null,
    passedTests: passedTests, // Number of tests passed before failure/completion
    totalTests: totalTests,
  };

  if (overallStatus === 'Accepted') {
    responsePayload.output = `Accepted: Passed ${passedTests}/${totalTests} test cases.`;
    console.log(`Problem '${problem_id}' Passed All Tests.`);
  } else {
    // Keep the summary error message concise
    responsePayload.error = firstFailureOutput || `Failed after passing ${passedTests} tests.`; 
    responsePayload.details = firstFailureDetails; // More detailed object about the failure
    console.log(`Problem '${problem_id}' Failed. Status: ${overallStatus}. Passed ${passedTests}/${totalTests} tests.`);
  }

  res.json(responsePayload); // Send the final response
  // No return here, implicitly returns void
}));
// --- End of /api/run-tests ---

// --- Global Error Handler ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  // Avoid leaking stack traces in production
  const message = process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message;
  res.status(500).json({ status: 'Server Error', error: message, details: process.env.NODE_ENV !== 'production' ? err.stack : undefined });
});
// --- End of Global Error Handler ---

app.listen(port, () => {
  console.log(`Leetbuddy backend proxy listening on http://localhost:${port}`);
  console.log(`Configured to use Judge0 Host: ${rapidApiHost}`);
}); 