"use client"

import { useEffect, useState } from "react"
import { Shield, AlertTriangle, CheckCircle, Activity, Paperclip } from "lucide-react"
import type { Report, ReportsResponse } from "@/lib/types"
import { StatCard } from "@/components/stat-card"
import { SpamTimelineChart } from "@/components/spam-timeline-chart"
import { ConfidenceDistributionChart } from "@/components/confidence-distribution-chart"
import { TopThreats } from "@/components/top-threats"
import { RecentReports } from "@/components/recent-reports"
import { getApiUrl } from "@/lib/api"

export default function Page() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const apiUrl = getApiUrl()
        // const res = await fetch(`${apiUrl}/reports`)
        const res = await fetch(`http://peds.liger-saiph.ts.net:5000/reports`)
        if (!res.ok) throw new Error("Failed to fetch reports")

        const json: ReportsResponse = await res.json()
        setReports(json.reports)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
          <p className="text-red-500">{error}</p>
        </div>
      </main>
    )
  }

  // Compute analytics
  const totalReports = reports.length
  const spamReports = reports.filter((r) => r.prediction === "spam")
  const hamReports = reports.filter((r) => r.prediction === "ham")
  const spamCount = spamReports.length
  const hamCount = hamReports.length
  const spamRate = totalReports > 0 ? Math.round((spamCount / totalReports) * 100) : 0

  const avgConfidence =
    totalReports > 0
      ? reports.reduce(
          (sum, r) =>
            sum +
            (r.prediction === "spam" ? r.spam_probability : r.ham_probability),
          0
        ) / totalReports
      : 0

  const attachmentReports = reports.filter(
    (r) => r.attachments_info && r.attachments_info.length > 0
  )

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
        {/* Stat Cards */}
        <div className="mb-6 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          
          <StatCard
            label="Total Scanned"
            value={totalReports}
            subtitle="emails processed"
            icon={Activity}
          />
        
          
          <StatCard
            label="Spam Detected"
            value={spamCount}
            subtitle={`${spamRate}% of total`}
            icon={AlertTriangle}
            variant="danger"
          />
        
          
          <StatCard
            label="Legitimate"
            value={hamCount}
            subtitle={`${100 - spamRate}% of total`}
            icon={CheckCircle}
            variant="success"
          />
        
          
          <StatCard
            label="Avg Confidence"
            value={`${Math.round(avgConfidence * 100)}%`}
            subtitle="model certainty"
            icon={Activity}
          />
        
          
          <StatCard
            label="Attachments"
            value={attachmentReports.length}
            subtitle="files scanned"
            icon={Paperclip}
          />
        
        </div>

        {/* Charts Row */}
        <div className="mb-6 grid gap-4 grid-cols-1 lg:grid-cols-2">
          <SpamTimelineChart reports={reports} />
          <ConfidenceDistributionChart reports={reports} />
        </div>

        {/* Bottom Row: Top Threats + Recent Activity */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <TopThreats reports={reports} />
          <RecentReports reports={reports} />
        </div>
      </div>
    </main>
  )
}