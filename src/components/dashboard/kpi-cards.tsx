"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AnalyticsData } from "@/lib/analytics"
import { Activity, Globe2, Layers, DollarSign } from "lucide-react"

interface KpiCardsProps {
  data: AnalyticsData
}

export function KpiCards({ data }: KpiCardsProps) {
  const kpis = [
    {
      title: "Total Offers",
      value: data.totalOffers.toLocaleString(),
      subtitle: `${data.activeOffers} currently active`,
      icon: Layers,
      trend: "+12% MoM",
      trendUp: true,
    },
    {
      title: "Unique GEOs",
      value: data.uniqueGeos.toLocaleString(),
      subtitle: "Worldwide coverage",
      icon: Globe2,
      trend: "+4% MoM",
      trendUp: true,
    },
    {
      title: "Avg Payout",
      value: `$${data.averagePayout.toFixed(2)}`,
      subtitle: "Across all models",
      icon: DollarSign,
      trend: "+$0.40 WoW",
      trendUp: true,
    },
    {
      title: "Network Status",
      value: "99.9%",
      subtitle: "API Uptime",
      icon: Activity,
      trend: "Stable",
      trendUp: true,
    },
  ]

  return (
    <>
      {kpis.map((kpi, i) => (
        <Card key={i} className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors">
          {/* Subtle gradient glow effect on hover */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <CardContent className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                {kpi.title}
              </h3>
              <kpi.icon className="h-4 w-4 text-primary opacity-80" />
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <div className="text-3xl font-bold tracking-tight text-foreground/90">
                {kpi.value}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${kpi.trendUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {kpi.trend}
                </span>
                <p className="text-xs text-muted-foreground">
                  {kpi.subtitle}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  )
}
