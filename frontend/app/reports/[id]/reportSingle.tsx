"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Report } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getApiUrl } from "@/lib/api"

import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  FileText,
  BarChart3,
  Paperclip,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function ReportDetailPage({ id }: { id: string }) {
  const router = useRouter()

  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReport() {
      try {
        const apiUrl = getApiUrl()
        const res = await fetch(`${apiUrl}/report?id=${id}`, {
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        })
        // const res = await fetch(`http://peds.liger-saiph.ts.net:5000/report?id=${id}`, {
        // })
        // console.log(apiUrl)
        // console.log(res)
        if (!res.ok) {
          router.replace("/404")
          return
        }

        const data = await res.json()
        setReport(data)
      } catch (error) {
        console.error("Fetch error:", error)
        router.replace("/404")
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [id, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading report…
      </div>
    )
  }

  if (!report) return null

  const isSpam = report.prediction === "spam"

  const formatTimestamp = (timestamp: string) =>
    new Date(timestamp).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </Link>

        <div
          className={cn(
            "rounded-2xl border-2 p-6 mb-6",
            isSpam
              ? "bg-red-500/10 border-red-500/50"
              : "bg-green-500/10 border-green-500/50"
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            {isSpam ? (
              <AlertTriangle className="h-8 w-8 text-red-500" />
            ) : (
              <CheckCircle className="h-8 w-8 text-green-500" />
            )}
            <div>
              <Badge
                variant={isSpam ? "destructive" : "default"}
                className={cn(
                  "text-sm font-semibold uppercase",
                  !isSpam && "bg-green-600 hover:bg-green-700 text-white"
                )}
              >
                {report.prediction}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Prediction Result
              </p>
            </div>
          </div>

          <p className="text-xs font-mono text-muted-foreground">
            Report ID: {report._id}
          </p>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Subject
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">{report.subject}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Body
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {report.body}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Probability Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-600">
                    Spam Probability
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    {(report.spam_probability * 100).toFixed(2)}%
                  </span>
                </div>
                <Progress
                  value={report.spam_probability * 100}
                  className="h-2 bg-red-100 [&>div]:bg-red-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-600">
                    Ham Probability
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    {(report.ham_probability * 100).toFixed(2)}%
                  </span>
                </div>
                <Progress
                  value={report.ham_probability * 100}
                  className="h-2 bg-green-100 [&>div]:bg-green-500"
                />
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Model Confidence
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {(report.confidence * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {report.attachments_info && report.attachments_info.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  Attachments ({report.attachments_info.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.attachments_info.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {attachment.filename}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{attachment.content_type}</span>
                        <span>{formatFileSize(attachment.size)}</span>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                        SHA256: {attachment.sha256.slice(0, 16)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-3">
                      {attachment.malicious_score === 0 ? (
                        <>
                          <ShieldCheck className="h-4 w-4 text-green-500" />
                          <span className="text-xs font-medium text-green-600">
                            Safe
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-4 w-4 text-red-500" />
                          <span className="text-xs font-medium text-red-600">
                            Risk: {attachment.malicious_score}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Timestamp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {formatTimestamp(report.timestamp)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}