import express from 'express';
import type { QueryResult } from 'pg';

import type { ServiceDay } from '../models/serviceDays';
import { serviceDaySchema } from '../models/serviceDays';

import pool from '../db';
import { asyncMiddleware } from '../middleware/asyncMiddleware';
import { authenticateToken } from '../middleware/authMiddleware';

import type { Campaign } from '../models/campaigns';

const router = express.Router();

router.post(
  '/',
  authenticateToken,
  asyncMiddleware(async (req, res) => {
    serviceDaySchema.parse(req.body);
    const { campaign_id, dates: serviceDates } = req.body as ServiceDay;

    // Retrieve the campaign's date range
    const campaignQueryResult: QueryResult<Campaign> = await pool.query(
      'SELECT start_date, end_date, registration_process_start_date, registration_process_end_date FROM campaigns WHERE campaign_id = $1',
      [campaign_id]
    );

    if (campaignQueryResult.rowCount === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const {
      start_date: campaignStart,
      end_date: campaignEnd,
      registration_process_start_date: registrationStart,
      registration_process_end_date: registrationEnd,
    } = campaignQueryResult.rows[0];

    // Convert the campaign dates to Date objects for comparison
    const campaignStartDate = new Date(campaignStart);
    const campaignEndDate = new Date(campaignEnd);
    const registrationStartDate = new Date(registrationStart);
    const registrationEndDate = new Date(registrationEnd);

    // Validate each service day
    for (const date of serviceDates) {
      const serviceDate = new Date(date);

      // Check if the service date is the same as the campaign start date
      if (serviceDate.getTime() === campaignStartDate.getTime()) {
        return res.status(400).json({
          error: `Service date ${date} cannot be the same as the campaign start date.`,
        });
      }

      // Check if the service date is within the registration process date range
      // todo: check from the client side when sending dates, there's an edge case for the last day (it sees it as not in the range).
      // todo: double check date formatting on the client side and on the server as well.
      if (
        serviceDate >= registrationStartDate &&
        serviceDate <= registrationEndDate
      ) {
        return res.status(400).json({
          error: `Service date ${date} cannot be during the registration process (${registrationStart} to ${registrationEnd}).`,
        });
      }

      // Check if the service date is within the campaign's date range
      if (serviceDate < campaignStartDate || serviceDate > campaignEndDate) {
        return res.status(400).json({
          error: `Service date ${date} is not within the campaign date range (${campaignStart} to ${campaignEnd}).`,
        });
      }
    }

    // Prepare the values for bulk insertion
    const serviceDaysValues = serviceDates
      .map((date) => `(${campaign_id}, '${date}')`)
      .join(',');

    /* 
      Concern??: Constructing SQL queries like this by concatenating strings can make your application vulnerable
      to SQL injection attacks. It’s essential to use parameterized queries or a library that safely
      handles SQL query construction.
      */

    // clause to gracefully handle attempts to insert duplicate service days
    // needs PostgreSQL 9.5 or later
    const insertQuery = `
        INSERT INTO ServiceDays (campaign_id, date)
        VALUES ${serviceDaysValues}
        ON CONFLICT (campaign_id, date) DO NOTHING
        RETURNING *;
    `;

    const newServiceDays: QueryResult<ServiceDay> = await pool.query(
      insertQuery
    );

    res.status(201).json(newServiceDays.rows);
  })
);

export default router;
