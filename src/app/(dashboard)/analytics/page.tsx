"use client"

import { useMemo } from "react"
import { useOffers } from "@/hooks/use-offers"
import { computeAnalytics } from "@/lib/analytics"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { BarChart3, Globe2, Layers, Activity, TrendingUp, ExternalLink } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

const COLORS = [
  "#9333ea", "#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#6366f1",
]

const STATUS_COLORS: Record<string, string> = {
  Active: "#10b981",
  Paused: "#f59e0b",
  Inactive: "#ef4444",
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="bg-background/95 border border-border/50 p-3 rounded-lg shadow-xl backdrop-blur-md">
      <p className="text-xs font-bold text-foreground mb-1">{label ?? entry.name}</p>
      <p className="text-xs font-mono" style={{ color: entry.payload?.fill ?? entry.color }}>
        {entry.value} offers
      </p>
    </div>
  )
}

const PayoutTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background/95 border border-border/50 p-3 rounded-lg shadow-xl backdrop-blur-md">
      <p className="text-xs font-bold text-foreground mb-1">{label}</p>
      <p className="text-xs font-mono text-emerald-400">{payload[0].value} offers</p>
    </div>
  )
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { data: offersData, isLoading } = useOffers()
  const offers = offersData?.data ?? []
  const analytics = useMemo(() => computeAnalytics(offers), [offers])

  const handleGeoClick = (geoCode: string) => {
    router.push(`/?search=${encodeURIComponent(geoCode)}`)
  }

  const statCards = [
    {
      title: "Total Offers",
      value: analytics.totalOffers,
      icon: Layers,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Active Offers",
      value: analytics.activeOffers,
      icon: Activity,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Unique GEOs",
      value: analytics.uniqueGeos,
      icon: Globe2,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
    },
    {
      title: "Avg Payout",
      value: `$${analytics.averagePayout.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">

      {/* Page Header */}
      <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent overflow-hidden shadow-lg shadow-primary/5 relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics &amp; Insights</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Data breakdown across all offers and campaigns
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
            className="h-8 text-xs border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 gap-1.5 self-start sm:self-auto"
          >
            Back to Offers Table
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden group hover:border-primary/40 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.title}
                </p>
                <div className={`h-7 w-7 rounded-md ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-3xl font-bold tracking-tight text-foreground/90">{stat.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

        {/* Model Distribution — Donut */}
        <motion.div variants={cardVariants}>
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden h-full">
            <CardHeader className="pb-2 border-b border-border/20 bg-muted/5">
              <CardTitle className="text-sm uppercase tracking-wider">Model Distribution</CardTitle>
              <CardDescription className="text-xs">Offer breakdown by conversion model</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] pt-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-48 w-48 rounded-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.modelDistribution}
                      cx="50%"
                      cy="45%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive
                      animationBegin={200}
                      animationDuration={800}
                    >
                      {analytics.modelDistribution.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} opacity={0.85} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top GEOs — Horizontal Bar with Drill-down */}
        <motion.div variants={cardVariants}>
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden h-full">
            <CardHeader className="pb-2 border-b border-border/20 bg-muted/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm uppercase tracking-wider">Top Geographies</CardTitle>
                <CardDescription className="text-xs">Highest volume GEOs (click code to view on dashboard)</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="h-[320px] pt-4 pr-6">
              {isLoading ? (
                <div className="space-y-3 pt-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 rounded" style={{ width: `${100 - i * 11}%` }} />
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col justify-between">
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.geoDistribution}
                        layout="vertical"
                        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 600 }}
                          width={35}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(147, 51, 234, 0.05)" }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18} isAnimationActive animationBegin={300} animationDuration={700}>
                          {analytics.geoDistribution.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/20">
                    <span className="text-[11px] text-muted-foreground mr-1 self-center">Filter Dashboard:</span>
                    {analytics.geoDistribution.map((geo) => (
                      <Button
                        key={geo.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleGeoClick(geo.name)}
                        className="h-6 text-[10px] font-mono px-2 border-border/50 bg-muted/20 hover:bg-primary/20 hover:text-primary gap-1"
                      >
                        {geo.name}
                        <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Breakdown — Pie */}
        <motion.div variants={cardVariants}>
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden h-full">
            <CardHeader className="pb-2 border-b border-border/20 bg-muted/5">
              <CardTitle className="text-sm uppercase tracking-wider">Status Breakdown</CardTitle>
              <CardDescription className="text-xs">Active vs paused offer distribution</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] pt-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-48 w-48 rounded-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.statusBreakdown}
                      cx="50%"
                      cy="45%"
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive
                      animationBegin={400}
                      animationDuration={800}
                    >
                      {analytics.statusBreakdown.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={STATUS_COLORS[entry.name] ?? COLORS[idx % COLORS.length]}
                          opacity={0.85}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payout Ranges — Vertical Bar */}
        <motion.div variants={cardVariants}>
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden h-full">
            <CardHeader className="pb-2 border-b border-border/20 bg-muted/5">
              <CardTitle className="text-sm uppercase tracking-wider">Payout Distribution</CardTitle>
              <CardDescription className="text-xs">Offers grouped by payout range</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] pt-4 pr-6">
              {isLoading ? (
                <div className="space-y-4 pt-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded" />
                  ))}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.payoutRanges} margin={{ top: 0, right: 0, left: -10, bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis
                      dataKey="range"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<PayoutTooltip />} cursor={{ fill: "rgba(147, 51, 234, 0.05)" }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive animationBegin={500} animationDuration={700}>
                      {analytics.payoutRanges.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} opacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </motion.div>
    </div>
  )
}
