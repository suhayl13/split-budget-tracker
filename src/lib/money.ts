export const toCents = (n: number) => Math.round(n * 100);
export const fromCents = (c: number) => Number((c / 100).toFixed(2));
export const nowIso = () => new Date().toISOString();

// Even split. If odd cent, give the extra cent to the non-payer (documented).
export function splitEven(totalCents: number) {
  const a = Math.floor(totalCents / 2);
  const b = totalCents - a;
  return [a, b] as const;
}
