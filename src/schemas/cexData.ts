import { z } from 'astro:schema';

// Runtime validation schemas (Zod)
const TradingPairSchema = z.object({
  pair: z.string(),
  url: z.string().url().optional(),
});

const LinkSchema = z.object({
  text: z.string(),
  url: z.string().url(),
});

const ExchangeBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string().optional(),
  notes: z.string().optional(),
  delistingDate: z.string().optional(),
  closureDate: z.string().optional(),
});

const ConfirmedSchema = ExchangeBaseSchema.extend({
  status: z.literal('confirmed'),
  tradingPairs: z.array(TradingPairSchema),
});

const AnnouncedSchema = ExchangeBaseSchema.extend({
  status: z.literal('announced'),
  tradingPairs: z.array(TradingPairSchema),
  links: z.array(LinkSchema),
});

const AcknowledgedSchema = ExchangeBaseSchema.extend({
  status: z.literal('acknowledged'),
  tradingPairs: z.array(TradingPairSchema).optional().default([]),
});

const ClosedSchema = ExchangeBaseSchema.extend({
  status: z.literal('closed'),
  tradingPairs: z.array(TradingPairSchema).optional().default([]),
});

export const ExchangeSchema = z.discriminatedUnion('status', [
  ConfirmedSchema,
  AnnouncedSchema,
  AcknowledgedSchema,
  ClosedSchema,
]);

export const CEXDataSchema = z.object({
  exchanges: z.array(ExchangeSchema),
});
