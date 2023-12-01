import express from 'express';
import type { QueryResult } from 'pg';

import type { Campaign } from '../models/campaigns';
import { campaignSchema, partialCampaignSchema } from '../models/campaigns';

import pool from '../db';
import { asyncMiddleware } from '../middleware/asyncMiddleware';
import { authenticateToken } from '../middleware/authMiddleware';

import { formatDatesToRomanianTime } from '../lib/dateUtils';

const router = express.Router();

// TODO: combine these 2 queries into one to avoid 2 round trips to the database
async function checkIfCompanyExists(companyId: number): Promise<boolean> {
  const companyExists: QueryResult = await pool.query(
    'SELECT 1 FROM Companies WHERE company_id = $1',
    [companyId]
  );

  return companyExists.rowCount !== 0;
}

async function checkForOverlappingCampaigns(
  campaignDetails: Campaign
): Promise<boolean> {
  const existingCampaign: QueryResult = await pool.query(
    'SELECT 1 FROM campaigns WHERE company_id = $1 AND ((start_date, end_date) OVERLAPS ($2::DATE, $3::DATE) OR (registration_process_start_date, registration_process_end_date) OVERLAPS ($4::DATE, $5::DATE))',
    [
      campaignDetails.company_id,
      campaignDetails.start_date,
      campaignDetails.end_date,
      campaignDetails.registration_process_start_date,
      campaignDetails.registration_process_end_date,
    ]
  );

  return existingCampaign.rowCount !== null && existingCampaign.rowCount > 0;
}

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

    const companyExists = await checkIfCompanyExists(company_id);

    if (!companyExists) {
      return res
        .status(404)
        .json({ error: `Company with ID ${company_id} not found` });
    }

    const hasOverlappingCampaigns = await checkForOverlappingCampaigns({
      campaign_name,
      company_id,
      start_date,
      end_date,
      registration_process_start_date,
      registration_process_end_date,
    });

    if (hasOverlappingCampaigns) {
      return res.status(409).json({
        error:
          'A similar campaign for this company already exists within the specified date range',
      });
    }

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
    partialCampaignSchema.parse(req.body);

    const campaignId = req.params.id;
    const updateFields = req.body as Partial<Campaign>;

    // Construct the SET part of the SQL query dynamically
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateFields)) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    const setClause = setClauses.join(', ');
    const query = `UPDATE campaigns SET ${setClause} WHERE campaign_id = $${paramIndex} RETURNING *`;
    values.push(campaignId);

    // Execute the query
    const updatedCampaign: QueryResult<Campaign> = await pool.query(
      query,
      values
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
