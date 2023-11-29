import express from 'express';
import type { QueryResult } from 'pg';

import type { Campaign } from '../models/campaigns';

import pool from '../db';

const router = express.Router();

router.get('/', async (req, res) => {
  const campaigns: QueryResult<Campaign> = await pool.query(
    'SELECT * FROM campaigns WHERE campaign_id = $1',
    []
  );

  res.status(200).json(campaigns.rows);
});

export default router;
