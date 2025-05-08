import axios from 'axios'

// Point to your backend proxy
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api'

// interface SubmissionResponse { // No longer just returns token
//   token: string
// }

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

// Interface for individual problem details (when fetching one problem)
export interface ProblemDetails {
  id: number;
  slug: string;
  title: string;
  difficulty: string;
  description: string;
  function_signature: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
  // testCases are handled by the backend now
}

// NEW: Interface for items in the problem list
export interface ProblemListItem {
  id: number;
  slug: string;
  title: string;
  difficulty: string;
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
  // Fetches the list of all available problems
  async getProblems(): Promise<ProblemListItem[]> {
    try {
      const response = await axios.get<ProblemListItem[]>(`${BACKEND_API_URL}/problems`)
      return response.data
    } catch (error) {
      console.error('Error fetching problems:', error)
      throw error // Re-throw to be handled by the component
    }
  },

  // Fetches details for a single problem by its slug
  async getProblemDetails(slug: string): Promise<ProblemDetails> {
    try {
      const response = await axios.get<ProblemDetails>(`${BACKEND_API_URL}/problems/${slug}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching problem details for ${slug}:`, error);
      throw error;
    }
  },

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

  // getSubmissionResult is no longer needed as the backend handles polling.
  // You can remove this function or keep it commented out.
  /*
  async getSubmissionResult(token: string): Promise<SubmissionResult> {
    const response = await axios.get<SubmissionResult>(
      `${JUDGE0_API_URL}/submissions/${token}`,
      {
        headers: {
          'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
      }
    )
    return response.data
  },
  */
}
