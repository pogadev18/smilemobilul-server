import express from 'express';
import type { QueryResult } from 'pg';

import type {
  ServiceDay,
  ServiceDayUpdate,
  ServiceDayDelete,
} from '../models/serviceDays';
import {
  serviceDayDeleteSchema,
  serviceDaySchema,
  serviceDayUpdateSchema,
} from '../models/serviceDays';

import pool from '../db';
import { asyncMiddleware } from '../middleware/asyncMiddleware';
import { authenticateToken } from '../middleware/authMiddleware';

import type { Campaign } from '../models/campaigns';

const router = express.Router();

async function checkIfCampaignExists(campaignId: number): Promise<boolean> {
  const campaignExists: QueryResult = await pool.query(
    'SELECT * FROM campaigns WHERE campaign_id = $1',
    [campaignId]
  );

  return campaignExists.rowCount !== 0;
}

type ValidationResult = {
  isValid: boolean;
  error?: string;
};

async function validateServiceDayDate(
  campaign_id: number,
  serviceDate: string
): Promise<ValidationResult> {
  // Retrieve the campaign's date range
  const campaignQueryResult: QueryResult<Campaign> = await pool.query(
    'SELECT start_date, end_date, registration_process_start_date, registration_process_end_date FROM campaigns WHERE campaign_id = $1',
    [campaign_id]
  );

  if (campaignQueryResult.rowCount === 0) {
    return { isValid: false, error: 'Campaign not found' };
  }

  const {
    start_date: campaignStart,
    end_date: campaignEnd,
    registration_process_start_date: registrationStart,
    registration_process_end_date: registrationEnd,
  } = campaignQueryResult.rows[0];

  // Convert the campaign and registration dates to Date objects for comparison
  const campaignStartDate = new Date(campaignStart);
  const campaignEndDate = new Date(campaignEnd);
  const registrationStartDate = new Date(registrationStart);
  const registrationEndDate = new Date(registrationEnd);
  const newServiceDate = new Date(serviceDate);

  // Check the service date against the campaign and registration dates
  if (newServiceDate.getTime() === campaignStartDate.getTime()) {
    return {
      isValid: false,
      error: `Service date ${serviceDate} cannot be the same as the campaign start date.`,
    };
  }

  if (
    newServiceDate >= registrationStartDate &&
    newServiceDate <= registrationEndDate
  ) {
    return {
      isValid: false,
      error: `Service date ${serviceDate} cannot be during the registration process (${registrationStart} to ${registrationEnd}).`,
    };
  }

  if (newServiceDate < campaignStartDate || newServiceDate > campaignEndDate) {
    return {
      isValid: false,
      error: `Service date ${serviceDate} is not within the campaign date range (${campaignStart} to ${campaignEnd}).`,
    };
  }

  return { isValid: true };
}

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

    // Validate each service day
    for (const date of serviceDates) {
      const { error, isValid } = await validateServiceDayDate(
        campaign_id,
        date
      );
      // todo: check from the client side when sending dates, there's an edge case for the last day (it sees it as not in the range).
      // todo: double check date formatting on the client side and on the server as well.
      if (!isValid) {
        return res.status(400).json({ error });
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

router.get(
  '/:campaign_id',
  authenticateToken,
  asyncMiddleware(async (req, res) => {
    const campaign_id = Number(req.params.campaign_id);
    const campaignExists = await checkIfCampaignExists(campaign_id);

    if (!campaignExists) {
      return res
        .status(404)
        .json({ error: `Campaign with ID ${campaign_id} not found` });
    }

    const serviceDays: QueryResult = await pool.query(
      'SELECT * FROM ServiceDays WHERE campaign_id = $1 ORDER BY date',
      [campaign_id]
    );

    res.status(200).json(serviceDays.rows);
  })
);

router.patch(
  '/:service_day_id',
  authenticateToken,
  asyncMiddleware(async (req, res) => {
    const service_day_id = Number(req.params.campaign_id);
    serviceDayUpdateSchema.parse(req.body);
    const reqBody: ServiceDayUpdate = req.body;
    const { date: newDate, campaign_id } = reqBody;

    const serviceDayQueryResult: QueryResult<ServiceDay> = await pool.query(
      'SELECT * FROM ServiceDays WHERE service_day_id = $1',
      [service_day_id]
    );

    if (serviceDayQueryResult.rowCount === 0) {
      return res
        .status(404)
        .json({ message: `Service day with id: ${service_day_id} not found` });
    }

    const { error, isValid } = await validateServiceDayDate(
      campaign_id,
      newDate
    );

    if (!isValid) {
      return res.status(400).json({ error });
    }

    const updatedServiceDay: QueryResult = await pool.query(
      'UPDATE ServiceDays SET date = $1 WHERE service_day_id = $2 RETURNING *',
      [newDate, service_day_id]
    );

    if (updatedServiceDay.rows.length === 0) {
      return res.status(404).json({ message: 'Service day not found' });
    }

    res.status(200).json(updatedServiceDay.rows[0]);
  })
);

router.delete(
  '/',
  authenticateToken,
  asyncMiddleware(async (req, res) => {
    serviceDayDeleteSchema.parse(req.body);
    const reqBody: ServiceDayDelete = req.body;
    const { campaign_id, service_day_ids } = reqBody;

    const campaignExists = await checkIfCampaignExists(campaign_id);

    if (!campaignExists) {
      return res
        .status(404)
        .json({ error: `Campaign with ID ${campaign_id} not found` });
    }

    const deleteQuery =
      'DELETE FROM ServiceDays WHERE campaign_id = $1 AND service_day_id = ANY($2::int[]) RETURNING *';

    const deleteOp: QueryResult<ServiceDay> = await pool.query(deleteQuery, [
      campaign_id,
      service_day_ids,
    ]);

    if (deleteOp.rowCount === 0) {
      return res.status(404).json({ message: 'Service days not found' });
    }

    res.status(200).json({
      message: 'Service days deleted successfully',
      deletedRecords: deleteOp.rows,
    });
  })
);

export default router;
