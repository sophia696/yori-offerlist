"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AnalyticsData } from "@/lib/analytics"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"

interface AnalyticsChartsProps {
  data: AnalyticsData
}

// Toned cyberpunk color palette for charts
const COLORS = [
  '#9333ea', // Purple 600
  '#4f46e5', // Indigo 600
  '#0ea5e9', // Sky 500
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#ec4899', // Pink 500
  '#6366f1', // Indigo 500
]

// Custom Tooltip for Bar Chart
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 border border-border/50 p-3 rounded-md shadow-lg backdrop-blur-md">
        <p className="text-sm font-bold text-foreground mb-1">{label}</p>
        <p className="text-xs text-primary font-mono">
          {payload[0].value} Offers
        </p>
      </div>
    )
  }
  return null
}

// Custom Tooltip for Pie Chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 border border-border/50 p-3 rounded-md shadow-lg backdrop-blur-md">
        <p className="text-sm font-bold text-foreground mb-1">{payload[0].name}</p>
        <p className="text-xs font-mono" style={{ color: payload[0].payload.fill }}>
          {payload[0].value} Offers
        </p>
      </div>
    )
  }
  return null
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-6">
      
      {/* Model Distribution (Donut Chart) */}
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="pb-2 border-b border-border/20 bg-muted/5">
          <CardTitle className="text-sm uppercase tracking-wider">Models</CardTitle>
          <CardDescription className="text-xs">Top conversion models</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] pt-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.modelDistribution}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.modelDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Geo Distribution (Bar Chart) */}
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="pb-2 border-b border-border/20 bg-muted/5">
          <CardTitle className="text-sm uppercase tracking-wider">Top Geographies</CardTitle>
          <CardDescription className="text-xs">Highest volume GEOs</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] pt-6 pr-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.geoDistribution}
              layout="vertical"
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }}
                width={40}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(147, 51, 234, 0.05)' }} />
              <Bar 
                dataKey="value" 
                fill="hsl(var(--primary))" 
                radius={[0, 4, 4, 0]} 
                barSize={20}
                opacity={0.8}
              >
                {data.geoDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  )
}
