import { z } from 'zod';

const accessRequestSchema = z
  .object({
    event_id: z.string().min(8).max(64),
    type: z.enum(['ENTRY', 'EXIT']),
    reservation_code: z.string().min(6).max(20),
  })
  .strict();

const telemetrySchema = z
  .object({
    state: z.enum([
      'INICIALIZANDO',
      'PRONTO',
      'VALIDANDO',
      'ACESSO_LIBERADO',
      'ACESSO_NEGADO',
      'FALHA_REDE',
      'MANUTENCAO',
    ]),
    rssi: z.number().int().min(-120).max(0),
    uptime_s: z.number().int().nonnegative(),
    firmware_version: z.string().min(1).max(32),
  })
  .strict();

export const iotSchema = {
  accessRequestSchema,
  telemetrySchema,
};
