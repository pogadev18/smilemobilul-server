import express from 'express';
import type { QueryResult } from 'pg';

import type { Company } from '../models/companies';
import { companySchema } from '../models/companies';

import pool from '../db';
import { asyncMiddleware } from '../middleware/asyncMiddleware';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post(
  '/',
  authenticateToken,
  asyncMiddleware(async (req, res) => {
    companySchema.parse(req.body);
    const { company_name } = req.body as Company;

    const newCompany: QueryResult<Company> = await pool.query(
      'INSERT INTO companies (company_name) VALUES ($1) RETURNING *',
      [company_name]
    );

    res.status(201).json(newCompany.rows[0]);
  })
);

// TODO: add pagination
router.get(
  '/',
  authenticateToken,
  asyncMiddleware(async (req, res) => {
    const allCompanies: QueryResult<Company> = await pool.query(
      'SELECT * FROM companies'
    );
    res.status(200).json(allCompanies.rows);
  })
);
router.get(
  '/:id',
  authenticateToken,
  asyncMiddleware(async (req, res) => {
    const { id } = req.params;
    const company: QueryResult<Company> = await pool.query(
      'SELECT * FROM companies WHERE company_id = $1',
      [id]
    );

    if (company.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json(company.rows[0]);
  })
);
router.patch(
  '/:id',
  authenticateToken,
  asyncMiddleware(async (req, res) => {
    companySchema.parse(req.body);
    const { id } = req.params;
    const { company_name } = req.body as Company;

    const updatedCompany: QueryResult<Company> = await pool.query(
      'UPDATE companies SET company_name = $1 WHERE company_id = $2 RETURNING *',
      [company_name, id]
    );

    if (updatedCompany.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json(updatedCompany.rows[0]);
  })
);
router.delete(
  '/:id',
  authenticateToken,
  asyncMiddleware(async (req, res) => {
    const { id } = req.params;
    const deleteOp: QueryResult<Company> = await pool.query(
      'DELETE FROM companies WHERE company_id = $1 RETURNING *',
      [id]
    );

    if (deleteOp.rowCount === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json({ message: 'Company deleted successfully' });
  })
);

export default router;
