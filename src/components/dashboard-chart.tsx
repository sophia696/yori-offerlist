"use client"
import ReactECharts from "echarts-for-react"
import { useTheme } from "next-themes"

export function DashboardChart() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const option = {
    color: ["#9D4EDD", "#3B82F6"], // Purple and Blue accents
    tooltip: {
      trigger: "axis",
      backgroundColor: isDark ? "#1E1A29" : "#ffffff",
      borderColor: isDark ? "#2D2640" : "#e2e8f0",
      textStyle: {
        color: isDark ? "#F8FAFC" : "#0f172a",
      },
      axisPointer: {
        type: "line",
        lineStyle: {
          color: isDark ? "#3D3459" : "#cbd5e1",
        },
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: [
      {
        type: "category",
        boundaryGap: false,
        data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        axisLine: {
          lineStyle: {
            color: isDark ? "#2D2640" : "#e2e8f0",
          },
        },
        axisLabel: {
          color: isDark ? "#94a3b8" : "#64748b",
        },
      },
    ],
    yAxis: [
      {
        type: "value",
        splitLine: {
          lineStyle: {
            color: isDark ? "#1E1A29" : "#f1f5f9",
            type: "dashed",
          },
        },
        axisLabel: {
          color: isDark ? "#94a3b8" : "#64748b",
        },
      },
    ],
    series: [
      {
        name: "Revenue",
        type: "line",
        smooth: true,
        lineStyle: {
          width: 3,
          shadowColor: "rgba(157, 78, 221, 0.5)",
          shadowBlur: 10,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(157, 78, 221, 0.3)" },
              { offset: 1, color: "rgba(157, 78, 221, 0.0)" },
            ],
          },
        },
        data: [12000, 15000, 13500, 18000, 22000, 28000, 31000],
      },
    ],
  }

  return (
    <ReactECharts
      option={option}
      style={{ height: "100%", width: "100%" }}
      opts={{ renderer: "svg" }}
    />
  )
}
