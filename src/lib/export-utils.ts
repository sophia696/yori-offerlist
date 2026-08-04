import { Offer } from "./validations"

export function exportOffersToCSV(offers: Offer[], filename = "bidrunner_offers.csv") {
  if (!offers || offers.length === 0) return

  const headers = [
    "Campaign",
    "Model",
    "Geo",
    "Status",
    "Payout",
    "Billing",
    "OS",
    "PO Event",
    "Flow",
    "Preview URL",
  ]

  const escapeCSV = (str?: string) => {
    if (!str) return '""'
    const cleanStr = str.replace(/"/g, '""')
    return `"${cleanStr}"`
  }

  const rows = offers.map((o) => [
    escapeCSV(o.campaign),
    escapeCSV(o.model),
    escapeCSV(o.geo),
    escapeCSV(o.status),
    escapeCSV(o.po),
    escapeCSV(o.billing),
    escapeCSV(o.os),
    escapeCSV(o.poEvent),
    escapeCSV(o.flow),
    escapeCSV(o.previewUrl),
  ])

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function copyOffersToJSON(offers: Offer[]): Promise<void> {
  const jsonText = JSON.stringify(offers, null, 2)
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(jsonText)
  }
  return new Promise((resolve, reject) => {
    try {
      const el = document.createElement("textarea")
      el.value = jsonText
      el.style.cssText = "position:fixed;opacity:0"
      document.body.appendChild(el)
      el.focus()
      el.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(el)
      ok ? resolve() : reject(new Error("Copy failed"))
    } catch (e) {
      reject(e)
    }
  })
}
