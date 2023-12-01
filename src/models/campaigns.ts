import { z } from 'zod';

export type Campaign = {
  campaign_name: string;
  company_id: number;
  start_date: string;
  end_date: string;
  registration_process_start_date: string;
  registration_process_end_date: string;
};

export const campaignSchema = z.object({
  campaign_name: z
    .string()
    .min(3, 'Campaign name must be at least 3 characters'),
  company_id: z.number().int(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  registration_process_start_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Registration process start date must be in YYYY-MM-DD format'
    ),
  registration_process_end_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Registration process end date must be in YYYY-MM-DD format'
    ),
});
