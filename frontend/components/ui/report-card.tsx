"use client"

import Link from "next/link"
import { Report } from "@/lib/types"
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle, Paperclip, ArrowUpRight, Clock, Hash } from "lucide-react"

interface ReportCardProps {
  report: Report
}

export function ReportCard({ report }: ReportCardProps) {
  const isSpam = report.prediction === "spam"
  const probability = isSpam ? report.spam_probability : report.ham_probability
  const percentage = Math.round(probability * 100)

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Link href={`/reports/${report._id}`} className="group block">
      <div
        className={cn(
          "relative overflow-hidden shadow-sm rounded-2xl border bg-card p-8 transition-all duration-300",
          "hover:shadow-xl hover:-translate-y-1",
          "hover:border-border/80",
        )}
      >
        {/* Subtle top accent bar */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-0.5 transition-all duration-300 group-hover:h-1",
            isSpam
              ? "bg-destructive"
              : "bg-green-500"
          )}
        />

        {/* Arrow indicator */}
        <div className="absolute right-4 top-4 opacity-0 -translate-x-1 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0">
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex flex-col gap-4">
          {/* Header: ID + Badge */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground font-mono tracking-tight">
                {report._id}
              </span>
            </div>

            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                isSpam
                  ? "bg-destructive/10 text-destructive"
                  : "bg-green-500/10 text-primary"
              )}
            >
              {isSpam ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              {report.prediction}
            </div>
          </div>

          {/* Probability bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Confidence</span>
              <span
                className={cn(
                  "text-sm font-bold tabular-nums",
                  isSpam ? "text-destructive" : "text-primary"
                )}
              >
                {percentage}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isSpam ? "bg-destructive" : "bg-green-500"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Footer: Timestamp + Attachments */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="text-xs">
                {formatTimestamp(report.timestamp)}
              </span>
            </div>

            {report.attachments_info && report.attachments_info.length > 0 && (
              <div className="flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-muted-foreground">
                <Paperclip className="h-3 w-3" />
                <span className="text-xs font-medium">
                  {report.attachments_info.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
