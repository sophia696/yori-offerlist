"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Copy,
  Download,
  FileJson,
  Filter,
  RefreshCw,
  Search,
  Star,
  X,
  SlidersHorizontal,
  Sparkles,
  Zap,
  Lightbulb,
  Target,
  Flame,
} from "lucide-react"
import { useOffers } from "@/hooks/use-offers"
import { useFavorites } from "@/hooks/use-favorites"
import { exportOffersToCSV, copyOffersToJSON } from "@/lib/export-utils"
import { useState, useCallback, useMemo, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { computeAnalytics } from "@/lib/analytics"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { OfferTableSkeleton } from "@/components/dashboard/offer-table-skeleton"
import { Offer } from "@/lib/validations"
import { motion, AnimatePresence } from "framer-motion"
import { AiCopilotDrawer } from "@/components/dashboard/ai-copilot-drawer"
import { OfferFormModal } from "@/components/dashboard/offer-form-modal"


// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE_DEFAULT = 25
const PAGE_SIZE_COMPACT = 40

type SortKey = keyof Offer
type SortConfig = { key: SortKey; dir: "asc" | "desc" } | null
type Filters = { status: string; model: string; billing: string; os: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 60) return "Just now"
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

function SortIcon({ active, dir }: { active: boolean; dir?: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30 shrink-0" />
  return dir === "asc"
    ? <ArrowUp className="h-3 w-3 ml-1 text-primary shrink-0" />
    : <ArrowDown className="h-3 w-3 ml-1 text-primary shrink-0" />
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toLowerCase()
  const cls = s.includes("active")
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : s.includes("paused")
    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
    : "bg-muted/20 text-muted-foreground border-border/30"
  return (
    <Badge variant="outline" className={`text-[10px] uppercase font-mono px-1.5 py-0.5 ${cls}`}>
      {status ?? "Unknown"}
    </Badge>
  )
}

function PayoutCell({ po }: { po?: string }) {
  const m = po?.match(/[\d.]+/)
  if (!m) return <span className="text-xs text-muted-foreground/40">—</span>
  const val = parseFloat(m[0])
  if (isNaN(val)) return <span className="text-xs text-muted-foreground/40">—</span>
  return <span className="text-xs font-mono font-semibold text-emerald-400">${val.toFixed(2)}</span>
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  const ALL = "__all__"
  return (
    <div className="flex items-center bg-muted/40 border border-border/50 rounded-md overflow-hidden transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
      <span className="text-[10px] font-bold px-2.5 py-2 text-muted-foreground bg-muted/20 border-r border-border/50 uppercase tracking-wider min-w-[62px] shrink-0">
        {label}
      </span>
      <Select
        value={value || ALL}
        onValueChange={(v: string | null) => onChange(!v || v === ALL ? "" : v)}
      >
        <SelectTrigger className="flex-1 border-0 rounded-none bg-transparent shadow-none focus:ring-0 text-sm h-auto py-2">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        {label}
      </h3>
      {children}
    </div>
  )
}

// ─── Dashboard Content Component (reads SearchParams) ─────────────────────────

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: offersData, isLoading, isFetching, refetch, addOffer, updateOffer, deleteOffer } = useOffers()
  const { favorites, toggleFavorite, isFavorite } = useFavorites()


  const offers = offersData?.data ?? []

  // Read initial values from URL params
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "")
  const [filters, setFilters] = useState<Filters>(() => ({
    status: searchParams.get("status") || "",
    model: searchParams.get("model") || "",
    billing: searchParams.get("billing") || "",
    os: searchParams.get("os") || "",
  }))
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [jsonCopied, setJsonCopied] = useState(false)
  const [isCopilotOpen, setIsCopilotOpen] = useState(false)
  const [aiStrategy, setAiStrategy] = useState<any>(null)
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false)

  // Reset AI strategy when selected campaign changes
  useEffect(() => {
    setAiStrategy(null)
  }, [selectedCampaign])

  // Keyboard shortcut: Ctrl + K for AI Copilot & Custom Event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setIsCopilotOpen((prev) => !prev)
      }
    }
    const handleOpenCopilot = () => setIsCopilotOpen(true)
    const handleAiOfferAdded = () => refetch()

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("open-ai-copilot", handleOpenCopilot)
    window.addEventListener("offer-added-by-ai", handleAiOfferAdded)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("open-ai-copilot", handleOpenCopilot)
      window.removeEventListener("offer-added-by-ai", handleAiOfferAdded)
    }
  }, [refetch])


  const analyticsData = computeAnalytics(offers)
  const pageSize = compactMode ? PAGE_SIZE_COMPACT : PAGE_SIZE_DEFAULT

  // Sync states to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("search", searchQuery)
    if (filters.status) params.set("status", filters.status)
    if (filters.model) params.set("model", filters.model)
    if (filters.billing) params.set("billing", filters.billing)
    if (filters.os) params.set("os", filters.os)

    const queryString = params.toString()
    router.replace(queryString ? `/?${queryString}` : "/", { scroll: false })
  }, [searchQuery, filters, router])

  // Dynamic filter options from live data
  const filterOptions = useMemo(
    () => ({
      status: [
        ...new Set(offers.map((o) => o.status).filter((s): s is string => !!s)),
      ].sort(),
      model: [
        ...new Set(
          offers
            .flatMap((o) => (o.model ?? "").split(",").map((m) => m.trim()))
            .filter(Boolean)
        ),
      ].sort(),
      billing: [
        ...new Set(offers.map((o) => o.billing).filter((b): b is string => !!b)),
      ].sort(),
      os: [
        ...new Set(
          offers
            .flatMap((o) => (o.os ?? "").split(/[,/]/).map((s) => s.trim()))
            .filter(Boolean)
        ),
      ].sort(),
    }),
    [offers]
  )

  // Filtered & sorted offers
  const filteredOffers = useMemo(() => {
    let result = [...offers]

    if (onlyFavorites) {
      result = result.filter((o) => isFavorite(o.campaign))
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (o) =>
          o.campaign?.toLowerCase().includes(q) ||
          o.geo?.toLowerCase().includes(q) ||
          o.model?.toLowerCase().includes(q)
      )
    }
    if (filters.status)
      result = result.filter(
        (o) => (o.status ?? "").toLowerCase() === filters.status.toLowerCase()
      )
    if (filters.model)
      result = result.filter((o) =>
        (o.model ?? "").toLowerCase().includes(filters.model.toLowerCase())
      )
    if (filters.billing)
      result = result.filter(
        (o) => (o.billing ?? "").toLowerCase() === filters.billing.toLowerCase()
      )
    if (filters.os)
      result = result.filter((o) =>
        (o.os ?? "").toLowerCase().includes(filters.os.toLowerCase())
      )

    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = String(a[sortConfig.key] ?? "").toLowerCase()
        const bVal = String(b[sortConfig.key] ?? "").toLowerCase()
        return sortConfig.dir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      })
    }

    return result
  }, [offers, searchQuery, filters, sortConfig, onlyFavorites, favorites])

  const totalPages = Math.ceil(filteredOffers.length / pageSize)
  const paginatedOffers = filteredOffers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filters, sortConfig, onlyFavorites])

  useEffect(() => {
    if (!selectedCampaign && filteredOffers.length > 0) {
      setSelectedCampaign(filteredOffers[0].campaign)
    }
  }, [filteredOffers])

  const activeFilterCount =
    Object.values(filters).filter(Boolean).length +
    (searchQuery ? 1 : 0) +
    (onlyFavorites ? 1 : 0)

  const selectedOffer = useMemo(
    () =>
      filteredOffers.find((o) => o.campaign === selectedCampaign) ??
      filteredOffers[0] ??
      null,
    [filteredOffers, selectedCampaign]
  )

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) =>
      prev?.key === key
        ? prev.dir === "asc"
          ? { key, dir: "desc" }
          : null
        : { key, dir: "asc" }
    )
  }

  const resetFilters = () => {
    setFilters({ status: "", model: "", billing: "", os: "" })
    setSearchQuery("")
    setSortConfig(null)
    setOnlyFavorites(false)
  }

  const handleCopy = useCallback(() => {
    if (!selectedOffer) return
    const text = [
      `Campaign: ${selectedOffer.campaign ?? "N/A"}`,
      `Model: ${selectedOffer.model ?? "N/A"}`,
      `Geo: ${selectedOffer.geo ?? "N/A"}`,
      `Preview: ${selectedOffer.previewUrl ?? "N/A"}`,
      `PO Event: ${selectedOffer.poEvent ?? "N/A"}`,
      `Flow: ${selectedOffer.flow ?? "N/A"}`,
      `Billing: ${selectedOffer.billing ?? "N/A"}`,
      `OS: ${selectedOffer.os ?? "N/A"}`,
      `Payout: ${selectedOffer.po ?? "N/A"}`,
      `Status: ${selectedOffer.status ?? "N/A"}`,
    ].join("\n")

    const doCopy = (): Promise<void> => {
      if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
      return new Promise<void>((resolve, reject) => {
        const el = document.createElement("textarea")
        el.value = text
        el.style.cssText = "position:fixed;opacity:0"
        document.body.appendChild(el)
        el.focus()
        el.select()
        const ok = document.execCommand("copy")
        document.body.removeChild(el)
        ok ? resolve() : reject(new Error("execCommand failed"))
      })
    }

    doCopy()
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch((err) => console.error("Copy failed:", err))
  }, [selectedOffer])

  const handleExportCSV = () => {
    exportOffersToCSV(filteredOffers)
  }

  const handleCopyJSON = () => {
    copyOffersToJSON(filteredOffers).then(() => {
      setJsonCopied(true)
      setTimeout(() => setJsonCopied(false), 2000)
    })
  }

  const lastUpdatedText = offersData?.updatedAt
    ? formatTimeAgo(new Date(offersData.updatedAt))
    : null

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto w-full">

      {/* ── Top Banner ── */}
      <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent overflow-hidden shadow-lg shadow-primary/5 relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Yori Labs Logo" className="h-11 w-auto object-contain shrink-0" />
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Offers
              </h1>
              {offersData?.isMockData && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                  Demo Data Mode
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live offer sync &amp; campaign bidding parameters
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {lastUpdatedText && (
              <span className="text-xs text-muted-foreground hidden md:flex items-center gap-1.5 mr-2">
                <Clock className="h-3 w-3" />
                Updated {lastUpdatedText}
              </span>
            )}
            <OfferFormModal
              mode="create"
              onSubmit={async (data) => {
                await addOffer(data)
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 gap-1.5 font-medium"
              onClick={async () => {
                try {
                  const res = await fetch("/api/offers/sync", { method: "POST" })
                  const resData = await res.json()
                  if (!res.ok) {
                    alert(`Sync Error: ${resData.error || resData.details || res.statusText}`)
                  } else {
                    alert(resData.message || "Sync completed successfully!")
                    refetch()
                  }
                } catch (e: any) {
                  alert(`Sync Request Failed: ${e.message || e}`)
                }
              }}

            >
              <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />
              Sync Google Sheet
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-border/50 bg-muted/20 hover:bg-muted/40 gap-1.5"
              onClick={handleExportCSV}
              disabled={filteredOffers.length === 0}
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              Export CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-border/50 bg-muted/20 hover:bg-muted/40 gap-1.5"
              onClick={handleCopyJSON}
              disabled={filteredOffers.length === 0}
            >
              {jsonCopied ? (
                <><Check className="h-3.5 w-3.5 text-emerald-400" /> Copied JSON</>
              ) : (
                <><FileJson className="h-3.5 w-3.5 text-sky-400" /> Copy JSON</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 gap-1.5"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching ? "Refreshing…" : "Refresh"}
            </Button>
          </div>

        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCards data={analyticsData} />
      </div>

      {/* ── Search & Filters Bar ── */}
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="offers-search"
                placeholder="Search campaign, geo, model…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-muted/20 border-border/50 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={onlyFavorites ? "default" : "outline"}
                size="sm"
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={`h-9 text-xs gap-1.5 ${
                  onlyFavorites
                    ? "bg-amber-500 text-black hover:bg-amber-400"
                    : "border-border/50 bg-muted/20 hover:bg-muted/40"
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${onlyFavorites ? "fill-black" : "text-amber-400"}`} />
                Starred ({favorites.length})
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompactMode(!compactMode)}
                className="h-9 text-xs border-border/50 bg-muted/20 hover:bg-muted/40 gap-1.5"
                title="Toggle Table Row Density"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                {compactMode ? "Compact" : "Normal"}
              </Button>

              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear all ({activeFilterCount})
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <FilterSelect
              label="STATUS"
              value={filters.status}
              options={filterOptions.status}
              onChange={(v) => setFilters((p) => ({ ...p, status: v }))}
            />
            <FilterSelect
              label="MODEL"
              value={filters.model}
              options={filterOptions.model}
              onChange={(v) => setFilters((p) => ({ ...p, model: v }))}
            />
            <FilterSelect
              label="BILLING"
              value={filters.billing}
              options={filterOptions.billing}
              onChange={(v) => setFilters((p) => ({ ...p, billing: v }))}
            />
            <FilterSelect
              label="OS"
              value={filters.os}
              options={filterOptions.os}
              onChange={(v) => setFilters((p) => ({ ...p, os: v }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Main Grid: Table + Details ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[600px]">

        {/* Left Column: Offers Table */}
        <Card className="lg:col-span-3 flex flex-col border-border/40 bg-card/50 backdrop-blur-sm shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-primary/20 bg-primary/10 flex items-center gap-2 shrink-0">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
              Available Offers
            </h2>
            <Badge
              variant="outline"
              className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20 ml-auto"
            >
              {isLoading ? "…" : `${filteredOffers.length} / ${offers.length}`}
            </Badge>
          </div>

          <ScrollArea className="flex-1">
            <Table>
              <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="w-[32px] px-2"></TableHead>
                  {(
                    [
                      { label: "Campaign", key: "campaign" as SortKey, width: "w-[150px]" },
                      { label: "Model", key: "model" as SortKey, width: "w-[75px]" },
                      { label: "Geo", key: null, width: "" },
                      { label: "Status", key: "status" as SortKey, width: "w-[85px]" },
                      { label: "Payout", key: "po" as SortKey, width: "w-[75px]" },
                    ] as const
                  ).map(({ label, key, width }) => (
                    <TableHead
                      key={label}
                      className={`${width} ${key ? "cursor-pointer select-none" : ""}`}
                      onClick={key ? () => handleSort(key) : undefined}
                    >
                      <span className="flex items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                        {label}
                        {key && (
                          <SortIcon
                            active={sortConfig?.key === key}
                            dir={sortConfig?.key === key ? sortConfig.dir : undefined}
                          />
                        )}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <OfferTableSkeleton />
                ) : filteredOffers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-16 text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Filter className="h-8 w-8 opacity-15" />
                        <p className="text-sm">No offers match your filters</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetFilters}
                          className="text-xs text-primary hover:text-primary/80 h-7"
                        >
                          Clear filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOffers.map((offer, i) => {
                    const isSelected = selectedOffer?.campaign === offer.campaign
                    const fav = isFavorite(offer.campaign)
                    return (
                      <TableRow
                        key={`${offer.campaign}-${i}`}
                        className={`border-border/20 hover:bg-muted/30 transition-colors cursor-pointer group ${
                          isSelected
                            ? "bg-primary/5 border-l-[3px] border-l-primary"
                            : ""
                        }`}
                        onClick={() => setSelectedCampaign(offer.campaign)}
                      >
                        <TableCell className="px-2 text-center" onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(offer.campaign)
                        }}>
                          <Star
                            className={`h-3.5 w-3.5 transition-colors ${
                              fav
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30 hover:text-amber-400"
                            }`}
                          />
                        </TableCell>
                        <TableCell className={`font-medium text-sm text-foreground/90 group-hover:text-primary transition-colors max-w-[150px] ${compactMode ? 'py-2' : 'py-3'}`}>
                          <div className="truncate" title={offer.campaign}>
                            {offer.campaign}
                          </div>
                        </TableCell>
                        <TableCell className={compactMode ? 'py-2' : 'py-3'}>
                          <Badge
                            variant="outline"
                            className="bg-muted/20 text-[10px] uppercase font-mono"
                          >
                            {offer.model}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-xs text-muted-foreground max-w-[120px] xl:max-w-[180px] ${compactMode ? 'py-2' : 'py-3'}`}>
                          <div className="truncate" title={offer.geo}>
                            {offer.geo}
                          </div>
                        </TableCell>
                        <TableCell className={compactMode ? 'py-2' : 'py-3'}>
                          <StatusBadge status={offer.status} />
                        </TableCell>
                        <TableCell className={compactMode ? 'py-2' : 'py-3'}>
                          <PayoutCell po={offer.po} />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Pagination footer */}
          {!isLoading && totalPages > 1 && (
            <div className="px-4 py-3 border-t border-border/30 bg-muted/5 flex items-center justify-between shrink-0">
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages} &mdash; {filteredOffers.length} offers
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Right Column: Campaign Details */}
        <Card className="lg:col-span-2 flex flex-col border-border/40 bg-card/50 backdrop-blur-sm shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-primary/20 bg-primary/10 flex justify-between items-center shrink-0">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
              Campaign Details
            </h2>
            {selectedOffer && (
              <div className="flex items-center gap-1">
                <OfferFormModal
                  mode="edit"
                  initialData={selectedOffer}
                  onSubmit={async (data) => {
                    await updateOffer(data)
                  }}
                  onDelete={async (id) => {
                    await deleteOffer(id)
                    setSelectedCampaign(null)
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-amber-400"
                  onClick={() => toggleFavorite(selectedOffer.campaign)}
                  title="Bookmark Offer"
                >
                  <Star className={`h-3.5 w-3.5 ${isFavorite(selectedOffer.campaign) ? "fill-amber-400 text-amber-400" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-xs px-2 transition-all duration-200 ${
                    copied
                      ? "text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                      : "text-primary hover:bg-primary/20 hover:text-primary"
                  }`}
                  onClick={handleCopy}
                >
                  {copied ? (
                    <><Check className="h-3.5 w-3.5 mr-1" />Copied!</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5 mr-1" />Copy</>
                  )}
                </Button>
              </div>
            )}

          </div>

          <CardContent className="p-4 flex flex-col gap-4 flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                Campaign
              </span>
              <Select
                value={selectedOffer?.campaign ?? ""}
                onValueChange={(v: string | null) => v && setSelectedCampaign(v)}
              >
                <SelectTrigger className="flex-1 bg-muted/20 border-border/50 text-sm font-medium">
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {filteredOffers.map((o, i) => (
                    <SelectItem key={`sel-${i}`} value={o.campaign}>
                      {o.campaign || `Unnamed ${i + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <AnimatePresence mode="wait">
              {selectedOffer ? (
                <motion.div
                  key={selectedOffer.campaign}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="rounded-md border border-border/40 bg-muted/10 p-5 flex-1 shadow-inner relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  <ScrollArea className="h-full pr-2">
                    <div className="space-y-5 relative z-10">
                      <DetailRow label="Campaign">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {selectedOffer.campaign || "N/A"}
                          </p>
                          {isFavorite(selectedOffer.campaign) && (
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          )}
                        </div>
                      </DetailRow>
                      <DetailRow label="Status">
                        <StatusBadge status={selectedOffer.status} />
                      </DetailRow>
                      <DetailRow label="Preview">
                        {selectedOffer.previewUrl ? (
                          <a
                            href={selectedOffer.previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline hover:text-primary/80 break-all leading-relaxed transition-colors"
                          >
                            {selectedOffer.previewUrl}
                          </a>
                        ) : (
                          <p className="text-xs text-muted-foreground">No preview link</p>
                        )}
                      </DetailRow>
                      <DetailRow label="Model">
                        <p className="text-sm font-medium text-foreground">
                          {selectedOffer.model || "N/A"}
                        </p>
                      </DetailRow>
                      <DetailRow label="PO Event">
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {selectedOffer.poEvent || "N/A"}
                        </p>
                      </DetailRow>
                      <DetailRow label="Flow">
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {selectedOffer.flow || "N/A"}
                        </p>
                      </DetailRow>
                      <DetailRow label="Billing">
                        <p className="text-sm font-medium text-foreground">
                          {selectedOffer.billing || "N/A"}
                        </p>
                      </DetailRow>
                      <DetailRow label="OS">
                        <p className="text-sm font-medium text-foreground">
                          {selectedOffer.os || "N/A"}
                        </p>
                      </DetailRow>
                      <DetailRow label="Geo">
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {selectedOffer.geo || "N/A"}
                        </p>
                      </DetailRow>
                      <DetailRow label="Payout">
                        <p className="text-sm font-bold text-emerald-400 font-mono">
                          {selectedOffer.po || "N/A"}
                        </p>
                      </DetailRow>

                      {/* ── AI Strategy & Hook Generator Section ── */}
                      <div className="pt-3 border-t border-border/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                            AI Strategy & Copy Hooks
                          </h3>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isGeneratingStrategy}
                            onClick={async () => {
                              if (!selectedOffer || isGeneratingStrategy) return
                              setIsGeneratingStrategy(true)
                              try {
                                const res = await fetch("/api/ai/strategy", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ offer: selectedOffer }),
                                })
                                if (res.ok) {
                                  const data = await res.json()
                                  setAiStrategy(data)
                                }
                              } catch (e) {
                                console.error(e)
                              } finally {
                                setIsGeneratingStrategy(false)
                              }
                            }}
                            className="h-6 text-[10px] gap-1 px-2 border-primary/40 text-primary hover:bg-primary/20"
                          >
                            {isGeneratingStrategy ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Zap className="h-3 w-3" />
                            )}
                            {aiStrategy ? "Regenerate" : "Generate Strategy"}
                          </Button>
                        </div>

                        {aiStrategy ? (
                          <div className="space-y-3 bg-card/60 p-3 rounded-lg border border-primary/20 text-xs">
                            {/* Executive Summary */}
                            {aiStrategy.executiveSummary && (
                              <div className="text-muted-foreground text-[11px] leading-relaxed italic border-l-2 border-primary pl-2">
                                &ldquo;{aiStrategy.executiveSummary}&rdquo;
                              </div>
                            )}

                            {/* Friction & Suggested Bid */}
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-muted-foreground">Friction:</span>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] font-mono px-1.5 py-0 ${
                                    aiStrategy.friction === "Low"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                      : aiStrategy.friction === "Medium"
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                      : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                  }`}
                                >
                                  {aiStrategy.friction || "Low"}
                                </Badge>
                              </div>
                              <div className="text-[10px] font-mono text-primary font-bold">
                                Bid: {aiStrategy.suggestedBid || "$0.20 - $0.50"}
                              </div>
                            </div>

                            {/* Ad Copy Hooks */}
                            {aiStrategy.hooks && aiStrategy.hooks.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                  <Flame className="h-3 w-3 text-amber-400" /> Ad Hooks & Copy:
                                </span>
                                <div className="space-y-1 pl-1">
                                  {aiStrategy.hooks.map((hook: string, hIdx: number) => (
                                    <div key={hIdx} className="bg-muted/30 p-1.5 rounded text-[11px] font-sans text-foreground/90 border border-border/30">
                                      {hook}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Traffic Matchmaker */}
                            {aiStrategy.trafficChannels && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                  <Target className="h-3 w-3 text-sky-400" /> Recommended Traffic Channels:
                                </span>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {aiStrategy.trafficChannels.map((tc: any, tIdx: number) => (
                                    <div key={tIdx} className="bg-muted/20 p-1.5 rounded border border-border/30 flex flex-col justify-between">
                                      <div className="flex justify-between items-center text-[10px] font-semibold text-foreground">
                                        <span>{tc.channel}</span>
                                        <span className="text-primary font-mono">{tc.score}%</span>
                                      </div>
                                      <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{tc.reason}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 bg-muted/20 rounded-lg border border-dashed border-border/50 text-center">
                            <p className="text-[11px] text-muted-foreground">
                              Click <span className="text-primary font-semibold">Generate Strategy</span> to analyze ad copy hooks, bid ranges & traffic channels with Groq AI.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-md border border-border/40 bg-muted/10 p-5 flex-1 shadow-inner flex items-center justify-center"
                >
                  <p className="text-sm text-muted-foreground">
                    Select a campaign to view details
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      {/* Floating AI Assistant Bar Trigger */}
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          onClick={() => setIsCopilotOpen(true)}
          className="shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-2 flex items-center gap-2 border border-primary/40"
        >
          <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
          <span className="text-xs font-bold">Ask AI Copilot</span>
          <kbd className="px-1.5 py-0.5 bg-black/20 rounded text-[10px] font-mono text-primary-foreground/80">Ctrl+K</kbd>
        </Button>
      </div>

      {/* AI Copilot Drawer */}
      <AiCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        offers={offers}
      />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
