# LeetBuddy - Online Code Execution Platform

A web application that allows users to write and execute code using the Judge0 API through RapidAPI. Currently in development, goal is to add AI features for code analysis.

## Features

- Code execution in multiple programming languages
- Real-time compilation and execution results
- Clean and intuitive user interface
- Secure API handling with environment variables

## Setup

1. Clone the repository
2. Create a `.env` file in the root directory using `.env_example` as a template:

   ```
   RAPIDAPI_JUDGE0_KEY="your_rapidapi_key"
   RAPIDAPI_JUDGE0_HOST="your_rapidapi_host"
   ```

3. Install dependencies:

   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

4. Start the development servers:

   ```bash
   # Start backend server (from backend directory)
   npm run dev

   # Start frontend server (from frontend directory)
   npm run dev
   ```

5. Access the application at `http://localhost:5173` (or the port shown in your terminal)

## Environment Variables

The following environment variables need to be set in your `.env` file:

- `RAPIDAPI_JUDGE0_KEY`: Your RapidAPI key for Judge0 API
- `RAPIDAPI_JUDGE0_HOST`: The RapidAPI host for Judge0 API

You can obtain these credentials by:

1. Creating an account on RapidAPI
2. Subscribing to the Judge0 API
3. Copying your API key and host from the RapidAPI dashboard
