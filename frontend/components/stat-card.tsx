import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  variant?: "default" | "danger" | "success"
}

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
}: StatCardProps) {
  return (
    <div className="min-w-0 rounded-2xl border p-4 shadow-sm bg-white">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            variant === "danger" && "bg-destructive/10 text-destructive",
            variant === "success" && "bg-green-300 text-slate-100",
            variant === "default" && "bg-secondary text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <p
          className={cn(
            "text-3xl font-bold tracking-tight",
            variant === "danger" && "text-destructive",
            variant === "success" && "text-green-500",
            variant === "default" && "text-foreground"
          )}
        >
          {value}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
