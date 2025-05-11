import axios from 'axios';

// Point to your backend proxy
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

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

export const problemService = {
  // Fetches the list of all available problems
  async getProblems(): Promise<ProblemListItem[]> {
    try {
      const response = await axios.get<ProblemListItem[]>(`${BACKEND_API_URL}/problems`);
      return response.data;
    } catch (error) {
      console.error('Error fetching problems:', error);
      throw error; // Re-throw to be handled by the component
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
};
