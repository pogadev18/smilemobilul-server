import 'express';

declare global {
  namespace Express {
    interface Request {
      user: any; // todo: fix type if necessary
    }
  }
}
