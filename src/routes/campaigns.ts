import express from 'express';
import type { QueryResult } from 'pg';

import type { Campaign } from '../models/campaigns';
import { campaignSchema } from '../models/campaigns';

import pool from '../db';
import { asyncMiddleware } from '../middleware/asyncMiddleware';
import { authenticateToken } from '../middleware/authMiddleware';

import { formatDatesToRomanianTime } from '../lib/dateUtils';

const router = express.Router();

/*
 expected dates format: YYYY-MM-DD
 i.e: 2021-01-01
*/

router.post(
  '/',
  authenticateToken,
  asyncMiddleware(async (req, res) => {
    campaignSchema.parse(req.body);
    const {
      campaign_name,
      company_id,
      start_date,
      end_date,
      registration_process_start_date,
      registration_process_end_date,
    } = req.body as Campaign;

    // Check if the company_id exists in the database
    const companyExists: QueryResult = await pool.query(
      'SELECT 1 FROM Companies WHERE company_id = $1',
      [company_id]
    );

    if (companyExists.rowCount === 0) {
      return res
        .status(404)
        .json({ error: `Company with ID ${company_id} not found` });
    }

    // "f_" stands for "formatted"
    const formattedDates = formatDatesToRomanianTime({
      start_date,
      end_date,
      registration_process_start_date,
      registration_process_end_date,
    });

    const newCampaign: QueryResult<Campaign> = await pool.query(
      'INSERT INTO campaigns (campaign_name, company_id, start_date, end_date, registration_process_start_date, registration_process_end_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        campaign_name,
        company_id,
        formattedDates.start_date,
        formattedDates.end_date,
        formattedDates.registration_process_start_date,
        formattedDates.registration_process_end_date,
      ]
    );

    res.status(201).json(newCampaign.rows[0]);
  })
);
router.get(
  '/',
  authenticateToken,
  asyncMiddleware(async (req, res) => {
    const allCampaigns: QueryResult<Campaign> = await pool.query(
      'SELECT * FROM campaigns'
    );
    res.status(200).json(allCampaigns.rows);
  })
);
router.get(
  '/:id',
  authenticateToken,
  asyncMiddleware(async (req, res) => {
    const { id } = req.params;
    const campaign: QueryResult<Campaign> = await pool.query(
      'SELECT * FROM campaigns WHERE campaign_id = $1',
      [id]
    );

    if (campaign.rows.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.status(200).json(campaign.rows[0]);
  })
);
router.patch(
  '/:id',
  authenticateToken,
  asyncMiddleware(async (req, res) => {
    campaignSchema.parse(req.body);
    const { id: campaignId } = req.params;
    const {
      company_id,
      start_date,
      end_date,
      registration_process_start_date,
      registration_process_end_date,
    } = req.body as Campaign;

    const updatedCampaign: QueryResult<Campaign> = await pool.query(
      'UPDATE campaigns SET company_id = $1, start_date = $2, end_date = $3, registration_process_start_date = $4, registration_process_end_date = $5 WHERE campaign_id = $6 RETURNING *',
      [
        company_id,
        start_date,
        end_date,
        registration_process_start_date,
        registration_process_end_date,
        campaignId,
      ]
    );

    if (updatedCampaign.rows.length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.status(200).json(updatedCampaign.rows[0]);
  })
);
router.delete(
  '/:id',
  authenticateToken,
  asyncMiddleware(async (req, res) => {
    const { id } = req.params;
    const deleteOp: QueryResult<Campaign> = await pool.query(
      'DELETE FROM campaigns WHERE campaign_id = $1 RETURNING *',
      [id]
    );

    if (deleteOp.rowCount === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.status(200).json({ message: 'Campaign deleted successfully' });
  })
);

export default router;
