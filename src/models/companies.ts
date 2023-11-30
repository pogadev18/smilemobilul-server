import { z } from 'zod';

export type Company = {
  company_name: string;
};

export const createCompanySchema = z.object({
  company_name: z
    .string()
    .min(5, 'Name is required and must have at least 5 characters'),
});
