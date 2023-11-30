import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError } from 'zod';

/*
"fn" is a function that takes Request, Response, and NextFunction as parameters and returns a Promise.
This matches the typical signature of an async route handler in Express.

"asyncMiddleware" itself is a function that returns an Express RequestHandler. This makes it compatible
with the way Express route handlers are typically defined.
*/

// purpose: avoid try-catch block boilerplate in route handlers
export const asyncMiddleware =
  (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any> // todo: improve type
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // if there's an error in the routes that's not handled, it will be caught here
      let errorMessage = 'Something went wrong';

      // Checking for ZodError for validation errors
      if (error instanceof ZodError) {
        errorMessage = 'Validation failed';
        console.error('Validation Error:', error.errors);
        return res
          .status(400)
          .json({ error: errorMessage, details: error.errors });
      }

      // Check if error is a standard Error
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error('API Error:', error);
      res.status(500).json({ error: errorMessage });
    });
  };
