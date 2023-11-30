import express from 'express';
import type { QueryResult } from 'pg';
import { ZodError } from 'zod';

import type { Company } from '../models/companies';
import { createCompanySchema } from '../models/companies';

import pool from '../db';
import { handleApiError } from '../lib/errorHandler';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    createCompanySchema.parse(req.body);
    const { company_name } = req.body as Company;

    const newCompany: QueryResult<Company> = await pool.query(
      'INSERT INTO companies (name) VALUES ($1) RETURNING *',
      [company_name]
    );

    res.status(201).json(newCompany.rows[0]);
  } catch (error) {
    handleApiError(error, res);
  }
});

// get all companies
router.get('/', async (req, res) => {
  try {
    const allCompanies: QueryResult<Company> = await pool.query(
      'SELECT * FROM companies'
    );
    res.status(200).json(allCompanies.rows);
  } catch (error) {
    handleApiError(error, res);
  }
});

// get a single company
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const company: QueryResult<Company> = await pool.query(
      'SELECT * FROM companies WHERE company_id = $1',
      [id]
    );

    if (company.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json(company.rows[0]);
  } catch (error) {
    handleApiError(error, res);
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name } = req.body as Company;

    const updatedCompany: QueryResult<Company> = await pool.query(
      'UPDATE companies SET name = $1 WHERE company_id = $2 RETURNING *',
      [company_name, id]
    );

    if (updatedCompany.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json(updatedCompany.rows[0]);
  } catch (error) {
    handleApiError(error, res);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteOp: QueryResult<Company> = await pool.query(
      'DELETE FROM companies WHERE company_id = $1 RETURNING *',
      [id]
    );

    if (deleteOp.rowCount === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json({ message: 'Company deleted successfully' });
  } catch (error) {
    handleApiError(error, res);
  }
});

export default router;
