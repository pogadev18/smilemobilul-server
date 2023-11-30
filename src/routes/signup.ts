import express from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';

import pool from '../db';
import { QueryResult } from 'pg';
import type { User } from './login';
import { userSchema } from './login';
import { asyncMiddleware } from '../middleware/asyncMiddleware';

const router = express.Router();

const signupUserSchema = userSchema.extend({
  role: z.string().refine((role) => role === 'admin' || role === 'user'),
});

type SignupUser = {
  role: string;
} & User;

router.post(
  '/',
  asyncMiddleware(async (req, res) => {
    const user: SignupUser = req.body;
    signupUserSchema.parse(user);
    const { username, password, role } = user;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result: QueryResult<User> = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING user_id, username, role;',
      [username, hashedPassword, role]
    );

    res.status(201).json(result.rows[0]);
  })
);

export default router;
