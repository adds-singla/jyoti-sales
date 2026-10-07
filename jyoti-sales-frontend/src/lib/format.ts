export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export function estimateEmi(amount: number, months = 9): number {
  // Simple flat-rate estimate for display purposes only (not a loan offer).
  const rate = 0.13 // ~13% p.a. flat, illustrative
  const total = amount * (1 + rate * (months / 12))
  return Math.round(total / months)
}
