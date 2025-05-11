import axios from 'axios'

// Point to your backend proxy
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api'

// Interface for the final result returned by the backend
interface SubmissionResult {
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  status: {
    id: number
    description: string
  }
  time: string | null
  memory: number | null
  message?: string | null // Optional message field
  token?: string // Backend might still include the token
}

// Interface for the response when running tests
interface TestRunResult {
  status: string; // e.g., 'Accepted', 'Wrong Answer', 'Compilation Error'
  time: string | null;
  memory: number | null;
  passedTests: number;
  totalTests: number;
  output?: string; // Overall message, e.g., "Accepted: Passed 5/5 test cases."
  error?: string; // Concise error message, e.g., "Failed on Test Case 1: Wrong Answer"
  details?: any; // Detailed error information (input, expected, got, etc.)
}

export const judge0Service = {
  // Updated to accept stdin and return the full SubmissionResult
  async submitCode(
    code: string,
    languageId: number,
    stdin: string | null // Add stdin parameter
  ): Promise<SubmissionResult> { // Returns the final result directly
    const response = await axios.post<SubmissionResult>(
      `${BACKEND_API_URL}/submit`, // Call backend endpoint
      {
        source_code: code,
        language_id: languageId,
        stdin: stdin, // Pass the provided stdin
      },
      {
        headers: {
          'Content-Type': 'application/json',
          // No RapidAPI keys needed here - backend handles it
        },
      }
    )
    // The backend now handles polling and returns the final result
    return response.data
  },

  // Submits code to run against predefined test cases for a specific problem
  async runTests(problem_slug: string, language_id: number, user_code: string): Promise<TestRunResult> {
    try {
      const response = await axios.post<TestRunResult>(
        `${BACKEND_API_URL}/run-tests`,
        {
          problem_slug,
          language_id,
          user_code
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error running tests for ${problem_slug} via backend proxy:`, error);
      throw error;
    }
  },
}
