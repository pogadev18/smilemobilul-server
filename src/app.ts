import express from 'express';
import dotenv from 'dotenv';

dotenv.config(); // load env vars

import campaignsRouter from './routes/campaigns';

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use('/campaigns', campaignsRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
