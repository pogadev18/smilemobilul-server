import { z } from 'zod';

export type Campaign = {
  company_id: number;
  start_date: Date;
  end_date: Date;
  registration_process_start_date: Date;
  registration_process_end_date: Date;
};

export const campaignSchema = z.object({
  company_id: z.number().int(),
  start_date: z.date(),
  end_date: z.date(),
  registration_process_start_date: z.date(),
  registration_process_end_date: z.date(),
});
