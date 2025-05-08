# LeetBuddy - Online Code Execution Platform

A web application that allows users to write and execute code using the Judge0 API through RapidAPI. It includes a backend service, a frontend interface, and a PostgreSQL database, all containerized using Docker.

## Features

- Code execution in multiple programming languages via Judge0.
- Real-time compilation and execution results.
- Clean and intuitive user interface.
- Secure API handling with environment variables.
- Dockerized for easy setup and deployment.

## Prerequisites

- Docker and Docker Compose installed.
- A RapidAPI account with a subscription to the Judge0 API.

## Setup with Docker (Recommended)

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd leetbuddy # Or your project directory name
    ```

2.  **Create Environment File:**
    Copy the `.env_example` file to a new file named `.env` in the root directory of the project.

    ```bash
    cp .env_example .env
    ```

    Update the `.env` file with your specific credentials and configurations.

3.  **Build and Run Containers:**
    Use Docker Compose to build the images and start the services in detached mode:

    ```bash
    docker compose up -d --build
    ```

    If working in dev environment (default), access the application at

    - Frontend: `http://localhost:5173`
    - Backend API: `http://localhost:3000`
    - Database (if needed for direct access, e.g., with pgAdmin): `localhost:5432`

    To switch to prod environment, delete the override.yml file and acces the applicaiton at `http://localhost:8080`

4.  **Stopping the Application:**
    To stop the services:
    ```bash
    docker compose down
    ```
    To stop and remove volumes (including database data):
    ```bash
    docker compose down -v
    ```
