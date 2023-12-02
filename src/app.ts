import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { swaggerDocs } from './lib/swagger';

dotenv.config(); // load env vars

// routes
import companiesRouter from './routes/companies';
import loginRouter from './routes/login';
import signupRouter from './routes/signup';
import campaignsRouter from './routes/campaigns';
import seriveDaysRouter from './routes/serviceDays';

const app = express();
const port = process.env.PORT;

if (!process.env.PORT) {
  console.error('Error: PORT environment variable is not set.');
  process.exit(1);
}

app.use(cors()); // Enable CORS for all routes
app.use(helmet()); // Set security-related HTTP headers
app.use(morgan('combined')); // Logging HTTP requests
app.use(express.json());

app.use('/companies', companiesRouter);
app.use('/campaigns', campaignsRouter);
app.use('/service-days', seriveDaysRouter);
app.use('/login', loginRouter);
app.use('/signup', signupRouter); // TODO: remove this route. It won't be used in production. Just for development purposes.

swaggerDocs(app, port);

// Route not found (404)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found.' });
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown logic
process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
