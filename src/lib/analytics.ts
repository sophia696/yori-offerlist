import { Offer } from "./validations"

export interface AnalyticsData {
  totalOffers: number
  activeOffers: number
  uniqueGeos: number
  averagePayout: number
  modelDistribution: { name: string; value: number }[]
  geoDistribution: { name: string; value: number }[]
  statusBreakdown: { name: string; value: number }[]
  payoutRanges: { range: string; count: number }[]
}

// Helper to extract 2-letter country codes from messy Geo strings
function extractGeos(geoString: string): string[] {
  if (!geoString) return []
  // Matches 2-letter uppercase codes usually representing GEOs (US, UK, DE, etc.)
  const matches = geoString.match(/\b[A-Z]{2}\b/g)
  if (!matches) {
    // If no 2-letter codes, just split by comma and trim
    return geoString.split(",").map((s) => s.trim().substring(0, 10)).filter(Boolean)
  }
  return matches
}

// Helper to extract numeric value from payout string like "$4.50" or "4.5 USD"
function extractPayout(poString: string): number {
  if (!poString) return 0
  const match = poString.match(/[\d.]+/)
  if (match && match[0]) {
    const val = parseFloat(match[0])
    return isNaN(val) ? 0 : val
  }
  return 0
}

export function computeAnalytics(offers: Offer[]): AnalyticsData {
  let totalPayouts = 0
  let payoutCount = 0
  let activeCount = 0

  const modelCounts: Record<string, number> = {}
  const geoCounts: Record<string, number> = {}
  const statusCounts: Record<string, number> = {}
  const payoutRangeCounts: Record<string, number> = {
    "$0": 0,
    "$1–$5": 0,
    "$5–$10": 0,
    "$10–$20": 0,
    "$20+": 0,
  }

  offers.forEach((offer) => {
    // 1. Status
    const status = offer.status || "Unknown"
    statusCounts[status] = (statusCounts[status] || 0) + 1
    if (status.toLowerCase().includes("active")) {
      activeCount++
    }

    // 2. Payouts
    const po = extractPayout(offer.po || "")
    if (po > 0) {
      totalPayouts += po
      payoutCount++
    }
    if (po === 0) payoutRangeCounts["$0"]++
    else if (po <= 5) payoutRangeCounts["$1–$5"]++
    else if (po <= 10) payoutRangeCounts["$5–$10"]++
    else if (po <= 20) payoutRangeCounts["$10–$20"]++
    else payoutRangeCounts["$20+"]++

    // 3. Models — split combined models like "CPA, CPL"
    const model = offer.model || "Unknown"
    model.split(",").forEach((m) => {
      const cleanM = m.trim().toUpperCase()
      if (cleanM) {
        modelCounts[cleanM] = (modelCounts[cleanM] || 0) + 1
      }
    })

    // 4. Geos
    const geos = extractGeos(offer.geo || "")
    geos.forEach((g) => {
      geoCounts[g] = (geoCounts[g] || 0) + 1
    })
  })

  // Format and sort distribution arrays for Recharts
  const modelDistribution = Object.entries(modelCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) // Top 5

  const geoDistribution = Object.entries(geoCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7) // Top 7

  const statusBreakdown = Object.entries(statusCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const payoutRanges = Object.entries(payoutRangeCounts).map(([range, count]) => ({
    range,
    count,
  }))

  return {
    totalOffers: offers.length,
    activeOffers: activeCount,
    uniqueGeos: Object.keys(geoCounts).length,
    averagePayout: payoutCount > 0 ? Number((totalPayouts / payoutCount).toFixed(2)) : 0,
    modelDistribution,
    geoDistribution,
    statusBreakdown,
    payoutRanges,
  }
}
