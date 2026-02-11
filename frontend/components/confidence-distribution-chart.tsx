"use client"

import {
  Area,
  AreaChart,
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

interface ConfidenceDistributionChartProps {
  reports: Report[]
}

export function ConfidenceDistributionChart({
  reports,
}: ConfidenceDistributionChartProps) {
  // Bucket reports into confidence ranges
  const buckets = [
    { range: "50-60%", min: 0.5, max: 0.6 },
    { range: "60-70%", min: 0.6, max: 0.7 },
    { range: "70-80%", min: 0.7, max: 0.8 },
    { range: "80-90%", min: 0.8, max: 0.9 },
    { range: "90-100%", min: 0.9, max: 1.0 },
  ]

  const chartData = buckets.map((bucket) => {
    const spamInBucket = reports.filter((r) => {
      const conf = r.prediction === "spam" ? r.spam_probability : r.ham_probability
      return r.prediction === "spam" && conf >= bucket.min && conf < bucket.max
    }).length

    const hamInBucket = reports.filter((r) => {
      const conf = r.prediction === "spam" ? r.spam_probability : r.ham_probability
      return r.prediction === "ham" && conf >= bucket.min && conf < bucket.max
    }).length

    return {
      range: bucket.range,
      spam: spamInBucket,
      ham: hamInBucket,
    }
  })

  return (
    <Card className="border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">
          Confidence Distribution
        </CardTitle>
        <CardDescription className="text-xs">
          How confident the model is in its predictions
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
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(220, 14%, 90%)"
              />
              <XAxis
                dataKey="range"
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
              <Area
                type="monotone"
                dataKey="spam"
                fill="var(--color-spam)"
                fillOpacity={0.15}
                stroke="var(--color-spam)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="ham"
                fill="var(--color-ham)"
                fillOpacity={0.15}
                stroke="var(--color-ham)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
