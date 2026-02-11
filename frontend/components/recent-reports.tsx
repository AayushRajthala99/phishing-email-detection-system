import { AlertTriangle, CheckCircle, Clock, Paperclip } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Report } from "@/lib/types"

interface RecentReportsProps {
  reports: Report[]
}

export function RecentReports({ reports }: RecentReportsProps) {
  const recent = reports.slice(0, 8)

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          Recent Activity
        </CardTitle>
        <CardDescription className="text-xs">
          Latest email reports processed
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {recent.map((report) => {
          const isSpam = report.prediction === "spam"
          return (
            <div
              key={report._id}
              className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-secondary/50"
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  isSpam ? "bg-destructive/10" : "bg-primary/10"
                )}
              >
                {isSpam ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-sm font-medium text-foreground">
                  {report.subject || "No subject"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {formatTimestamp(report.timestamp)}
                  </span>
                  {report.attachments_info && report.attachments_info.length > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Paperclip className="h-2.5 w-2.5" />
                      {report.attachments_info.length}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    isSpam
                      ? "bg-destructive/10 text-destructive"
                      : "bg-green-200 text-slate-800"
                  )}
                >
                  {report.prediction}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
