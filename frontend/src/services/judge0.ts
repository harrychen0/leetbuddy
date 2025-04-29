import axios from 'axios'

const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com'

interface SubmissionResponse {
  token: string
}

interface SubmissionResult {
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  status: {
    id: number
    description: string
  }
}

export const judge0Service = {
  async submitCode(code: string, languageId: number = 63): Promise<string> {
    const response = await axios.post<SubmissionResponse>(
      `${JUDGE0_API_URL}/submissions`,
      {
        source_code: code,
        language_id: languageId,
        stdin: JSON.stringify([2, 7, 11, 15]) + '\n' + '9',
      },
      {
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
      }
    )
    return response.data.token
  },

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
} 