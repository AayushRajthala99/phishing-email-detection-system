"use client"

import Link from "next/link"
import { Report } from "@/lib/types"
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle, Paperclip } from "lucide-react"

interface ReportCardProps {
  report: Report
}

export function ReportCard({ report }: ReportCardProps) {
  const isSpam = report.prediction === "spam"
  const probability = isSpam ? report.spam_probability : report.ham_probability

  const getColorClasses = () => {
    if (isSpam) {
      if (report.spam_probability >= 0.8) {
        return "bg-red-500/15 border-red-500/50 hover:bg-red-500/25"
      } else if (report.spam_probability >= 0.6) {
        return "bg-orange-500/15 border-orange-500/50 hover:bg-orange-500/25"
      } else {
        return "bg-yellow-500/15 border-yellow-500/50 hover:bg-yellow-500/25"
      }
    } else {
      if (report.ham_probability >= 0.8) {
        return "bg-green-500/15 border-green-500/50 hover:bg-green-500/25"
      } else if (report.ham_probability >= 0.6) {
        return "bg-emerald-500/15 border-emerald-500/50 hover:bg-emerald-500/25"
      } else {
        return "bg-teal-500/15 border-teal-500/50 hover:bg-teal-500/25"
      }
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Link href={`/reports/${report._id}`}>
      <div
        className={cn(
          "relative rounded-xl border-2 p-5 transition-all duration-200 cursor-pointer",
          "hover:scale-[1.02] hover:shadow-lg",
          getColorClasses()
        )}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-foreground font-mono tracking-tight">
              #{report._id}
            </p>
            {report.attachments_info && report.attachments_info.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-muted-foreground">
                <Paperclip className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">
                  {report.attachments_info.length}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {formatTimestamp(report.timestamp)}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {isSpam ? (
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium uppercase",
                    isSpam ? "text-red-600" : "text-green-600"
                  )}
                >
                  {report.prediction}
                </span>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold",
                  isSpam ? "text-red-600" : "text-green-600"
                )}
              >
                {(probability * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
