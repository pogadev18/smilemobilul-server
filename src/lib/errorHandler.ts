import { Response } from 'express';
import { ZodError } from 'zod';

export function handleApiError(error: unknown, res: Response) {
  let errorMessage = 'Something went wrong';

  // Checking for ZodError for validation errors
  if (error instanceof ZodError) {
    errorMessage = 'Validation failed';
    console.error('Validation Error:', error.errors);
    return res.status(400).json({ error: errorMessage, details: error.errors });
  }

  // Check if error is a standard Error
  if (error instanceof Error) {
    errorMessage = error.message;
  }

  console.error('API Error:', error);
  res.status(500).json({ error: errorMessage });
}
