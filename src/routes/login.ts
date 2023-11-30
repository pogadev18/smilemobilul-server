import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import express from 'express';
import { QueryResult } from 'pg';
import { z } from 'zod';

import pool from '../db';
import { asyncMiddleware } from '../middleware/asyncMiddleware';

const router = express.Router();

export type User = {
  user_id?: string;
  username: string;
  password: string;
  role: string;
};

export const userSchema = z.object({
  username: z.string().min(5, 'Username must have at least 5 characters'),
  password: z.string().min(8, 'Password must have at least 8 characters'),
});

router.post(
  '/',
  asyncMiddleware(async (req, res) => {
    const user: { username: string; password: string } = req.body;
    userSchema.parse(user);
    const { username, password: clientPassword } = user;

    const userQuery: QueryResult<User> = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (userQuery.rows.length > 0) {
      const user = userQuery.rows[0];

      const isPasswordValid = await bcrypt.compare(
        clientPassword,
        user.password
      );

      if (isPasswordValid) {
        const token = jwt.sign(
          { userId: user.user_id, username: user.username },
          process.env.JWT_SECRET!,
          {
            expiresIn: process.env.JWT_EXPIRES_IN!,
          }
        );

        // TODO: switch to cookies
        // res.cookie('access_token', token, {
        //   httpOnly: true,
        //   secure: process.env.NODE_ENV === 'production',
        //   sameSite: 'strict',
        //   maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        // });
        res.json({ token, username: user.username, role: user.role });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  })
);

export default router;
