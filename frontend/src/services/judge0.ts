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
