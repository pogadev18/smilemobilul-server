import { z } from 'zod';

export type ServiceDay = {
  service_day_id: number;
  campaign_id: number;
  dates: string[];
  created_at: string;
  updated_at: string;
};

export const serviceDaySchema = z.object({
  campaign_id: z
    .number()
    .int()
    .positive('Campaign ID must be a positive number'),
  dates: z.array(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
  ),
});
