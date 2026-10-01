import { createPricingResolver } from '../../hosted/pricing.mjs';
// Deterministic, network-free pricing snapshot. Never reaches a real provider.
export const testPricing = createPricingResolver({
  refresh: false,
  now: () => Date.parse('2026-09-30T23:59:00Z'),
});
