import { z } from "zod";

/**
 * Core domain schemas
 */

export const UserId = z.string().uuid();
export const ProjectId = z.string().uuid();

export const User = z.object({
  id: UserId,
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["admin", "client"]),
  createdAt: z.string().datetime(),
});

export const Project = z.object({
  id: ProjectId,
  name: z.string().min(1),
  status: z.enum(["draft", "active", "archived"]),
  createdAt: z.string().datetime(),
});

export const Account = z.object({
  id: z.string().uuid(),
  broker: z.enum(["tos", "fidelity", "robinhood"]),
  brokerAccountId: z.string(),
  name: z.string(),
  accountType: z.enum(["IND", "IRA", "ROTH_IRA", "CASH", "MARGIN"]),
  baseCurrency: z.literal("USD"),
  marginEnabled: z.boolean(),
  optionsLevel: z.number().nullable(),
  closeOnly: z.boolean(),
  pdtTracked: z.boolean(),
  iraRestricted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const BalanceSnapshot = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  timestamp: z.string().datetime(),
  netLiq: z.number(),
  cash: z.number(),
  settledCash: z.number().nullable(),
  buyingPower: z.number().nullable(),
  optionBuyingPower: z.number().nullable(),
  maintenanceExcess: z.number().nullable(),
  marginUsed: z.number().nullable(),
});

export const Instrument = z.object({
  id: z.string().uuid(),
  symbol: z.string(),
  assetType: z.enum(["equity", "option", "etf"]),
  underlyingSymbol: z.string().nullable(),
  optionType: z.enum(["call", "put"]).nullable(),
  strike: z.number().nullable(),
  expiry: z.string().nullable(),
  multiplier: z.number().nullable(),
});

export const PositionSnapshot = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  instrumentId: z.string().uuid(),
  timestamp: z.string().datetime(),
  quantity: z.number(),
  avgOpenPrice: z.number(),
  markPrice: z.number().nullable(),
  marketValue: z.number().nullable(),
  unrealizedPnL: z.number().nullable(),
  realizedPnL: z.number().nullable(),
  dayPnL: z.number().nullable(),
  costBasis: z.number().nullable(),
});

export const OptionSnapshot = z.object({
  id: z.string().uuid(),
  instrumentId: z.string().uuid(),
  timestamp: z.string().datetime(),
  bid: z.number().nullable(),
  ask: z.number().nullable(),
  mid: z.number().nullable(),
  last: z.number().nullable(),
  iv: z.number().nullable(),
  delta: z.number().nullable(),
  gamma: z.number().nullable(),
  theta: z.number().nullable(),
  vega: z.number().nullable(),
  openInterest: z.number().nullable(),
  volume: z.number().nullable(),
});

export const Order = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  brokerOrderId: z.string().nullable(),
  status: z.enum(["new", "queued", "partial", "filled", "cancelled", "rejected"]),
  symbol: z.string(),
  side: z.enum(["buy", "sell"]),
  effect: z.enum(["open", "close"]),
  orderType: z.enum(["market", "limit", "stop", "stop_limit"]),
  tif: z.enum(["day", "gtc"]),
  quantity: z.number(),
  limitPrice: z.number().nullable(),
  stopPrice: z.number().nullable(),
  submittedAt: z.string().datetime().nullable(),
  filledAt: z.string().datetime().nullable(),
});

export const Fill = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  accountId: z.string().uuid(),
  timestamp: z.string().datetime(),
  quantity: z.number(),
  price: z.number(),
  fees: z.number().nullable(),
});

export const TaxLot = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  instrumentId: z.string().uuid(),
  openedAt: z.string().datetime(),
  quantityOpen: z.number(),
  quantityRemaining: z.number(),
  price: z.number(),
});

export const AccountRestriction = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  timestamp: z.string().datetime(),
  closeOnly: z.boolean(),
  noNakedOptions: z.boolean(),
  noMarginExpansion: z.boolean(),
  settledCashOnly: z.boolean(),
  pdtRemainingTrades: z.number().nullable(),
  notes: z.string().nullable(),
});

export const ResearchDocument = z.object({
  id: z.string().uuid(),
  symbol: z.string(),
  source: z.string(),
  title: z.string(),
  publishedAt: z.string().datetime().nullable(),
  rating: z.string().nullable(),
  targetPrice: z.number().nullable(),
  summary: z.string().nullable(),
  fileUrl: z.string().url().nullable(),
});

export const Signal = z.object({
  id: z.string().uuid(),
  symbol: z.string(),
  strategy: z.string(),
  timeframe: z.string(),
  direction: z.enum(["bullish", "bearish", "neutral"]),
  confidence: z.number(),
  thesis: z.string(),
  invalidation: z.string(),
  createdAt: z.string().datetime(),
});

export const ExecutionPlan = z.object({
  id: z.string().uuid(),
  signalId: z.string().uuid().nullable(),
  accountId: z.string().uuid(),
  action: z.enum(["buy_stock", "sell_stock", "sell_call", "sell_put", "close_position"]),
  allowed: z.boolean(),
  blockedReason: z.string().nullable(),
  proposedQuantity: z.number(),
  limitPrice: z.number().nullable(),
  notes: z.string().nullable(),
});

export type User = z.infer<typeof User>;
export type Project = z.infer<typeof Project>;
export type Account = z.infer<typeof Account>;
export type BalanceSnapshot = z.infer<typeof BalanceSnapshot>;
export type Instrument = z.infer<typeof Instrument>;
export type PositionSnapshot = z.infer<typeof PositionSnapshot>;
export type OptionSnapshot = z.infer<typeof OptionSnapshot>;
export type Order = z.infer<typeof Order>;
export type Fill = z.infer<typeof Fill>;
export type TaxLot = z.infer<typeof TaxLot>;
export type AccountRestriction = z.infer<typeof AccountRestriction>;
export type ResearchDocument = z.infer<typeof ResearchDocument>;
export type Signal = z.infer<typeof Signal>;
export type ExecutionPlan = z.infer<typeof ExecutionPlan>;
