-- database/init.sql
-- Schema Definition Only

-- Drop existing types/tables if they exist (for easier re-running)
DROP TABLE IF EXISTS problem_test_cases CASCADE;
DROP TABLE IF EXISTS problem_constraints CASCADE;
DROP TABLE IF EXISTS problem_examples CASCADE;
DROP TABLE IF EXISTS problems CASCADE;
DROP TYPE IF EXISTS problem_difficulty CASCADE;
DROP FUNCTION IF EXISTS trigger_set_timestamp() CASCADE;

-- Enum type for problem difficulty
CREATE TYPE problem_difficulty AS ENUM ('Easy', 'Medium', 'Hard');

-- Main table for storing problem details
CREATE TABLE problems (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    difficulty problem_difficulty NOT NULL,
    description TEXT NOT NULL,
    function_signature TEXT NOT NULL, -- Stores the function signature stub
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on problems table update
CREATE TRIGGER set_timestamp_problems
BEFORE UPDATE ON problems
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Table for storing illustrative examples
CREATE TABLE problem_examples (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input_description TEXT NOT NULL,
    output_description TEXT NOT NULL,
    explanation TEXT,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- Table for storing constraints
CREATE TABLE problem_constraints (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- Table for storing test cases used for judging
CREATE TABLE problem_test_cases (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input_data JSONB NOT NULL,
    expected_output JSONB NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- Add indexes
CREATE INDEX idx_problems_slug ON problems(slug);
CREATE INDEX idx_problem_examples_problem_id ON problem_examples(problem_id);
CREATE INDEX idx_problem_constraints_problem_id ON problem_constraints(problem_id);
CREATE INDEX idx_problem_test_cases_problem_id ON problem_test_cases(problem_id);

-- Data will be seeded by the backend application on startup. 