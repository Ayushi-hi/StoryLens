export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(n)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)
}

export function formatPercent(n: number, digits = 2): string {
  return `${n.toFixed(digits)}%`
}

export function formatDateShort(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

// "electronics.smartphone" -> "Smartphone"
export function categoryLabel(code: string): string {
  const last = code.split(".").pop() ?? code
  const spaced = last.replace(/_/g, " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}