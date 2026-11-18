import { z } from 'zod';

const idParamSchema = z.object({
  id: z.string().min(1).max(64),
});

export const commonSchema = {
  idParamSchema,
};
