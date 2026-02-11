import { AlertTriangle, Mail } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Report } from "@/lib/types"

interface TopThreatsProps {
  reports: Report[]
}

export function TopThreats({ reports }: TopThreatsProps) {
  const topSpam = reports
    .filter((r) => r.prediction === "spam")
    .sort((a, b) => b.spam_probability - a.spam_probability)
    .slice(0, 5)

  const getThreatLevel = (prob: number) => {
    if (prob >= 0.9) return { label: "Critical", className: "bg-destructive/15 text-destructive" }
    if (prob >= 0.8) return { label: "High", className: "bg-destructive/10 text-destructive" }
    if (prob >= 0.7) return { label: "Medium", className: "bg-[hsl(30,80%,55%)]/15 text-[hsl(30,80%,40%)]" }
    return { label: "Low", className: "bg-secondary text-muted-foreground" }
  }

  return (
    <Card className="border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          Highest Threats
        </CardTitle>
        <CardDescription className="text-xs">
          Emails with the highest spam probability
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {topSpam.map((report) => {
          const threat = getThreatLevel(report.spam_probability)
          return (
            <div
              key={report._id}
              className="flex items-center gap-3 rounded-xl border bg-background p-3 transition-colors hover:bg-secondary/50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <p className="truncate text-sm font-medium text-foreground">
                    {report.subject || "No subject"}
                  </p>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {report.body
                    ? report.body.substring(0, 60) +
                      (report.body.length > 60 ? "..." : "")
                    : "No body"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-bold tabular-nums text-destructive">
                  {Math.round(report.spam_probability * 100)}%
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    threat.className
                  )}
                >
                  {threat.label}
                </span>
              </div>
            </div>
          )
        })}
        {topSpam.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No threats detected
          </p>
        )}
      </CardContent>
    </Card>
  )
}
