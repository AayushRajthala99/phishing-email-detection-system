"use client"

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Report } from "@/lib/types"

interface SpamTimelineChartProps {
  reports: Report[]
}

export function SpamTimelineChart({ reports }: SpamTimelineChartProps) {
  const dailyData = reports.reduce<
    Record<string, { date: string; spam: number; ham: number }>
  >((acc, report) => {
    const date = new Date(report.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    if (!acc[date]) {
      acc[date] = { date, spam: 0, ham: 0 }
    }
    if (report.prediction === "spam") {
      acc[date].spam += 1
    } else {
      acc[date].ham += 1
    }
    return acc
  }, {})

  const chartData = Object.values(dailyData).reverse()

  return (
    <Card className="border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">
          Daily Activity
        </CardTitle>
        <CardDescription className="text-xs">
          Spam vs ham classifications over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            spam: {
              label: "Spam",
              color: "hsl(0, 72%, 51%)",
            },
            ham: {
              label: "Ham",
              color: "hsl(160, 84%, 39%)",
            },
          }}
          className="h-[240px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(220, 14%, 90%)"
              />
              <XAxis
                dataKey="date"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(220, 10%, 46%)" }}
              />
              <YAxis
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fill: "hsl(220, 10%, 46%)" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="spam"
                fill="var(--color-spam)"
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
              <Bar
                dataKey="ham"
                fill="var(--color-ham)"
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
