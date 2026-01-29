"use client"

import { useState, useEffect } from "react"
import { ReportsResponse } from "@/lib/types"
import { ReportCard } from "@/components/ui/report-card"
import { FileText, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getApiUrl } from "@/lib/api"
import { useSearchParams } from "next/navigation"

export function ReportsContent() {
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get("page")) || 1
  const pageSize = 10

  const [data, setData] = useState<ReportsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReports() {
      setLoading(true)
      setError(null)
      
      try {
        const apiUrl = getApiUrl()
        console.log("Fetching from:", `${apiUrl}/reports`)
        
        const response = await fetch(`${apiUrl}/reports`, {
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("API Error:", response.status, errorText)
          throw new Error(`Failed to fetch reports: ${response.status}`)
        }

        const responseData = await response.json()
        console.log("Fetched data:", responseData)
        
        // Handle different response formats
        let normalizedData: ReportsResponse
        
        if (Array.isArray(responseData)) {
          normalizedData = {
            total: responseData.length,
            reports: responseData
          }
        } else if (responseData.reports && Array.isArray(responseData.reports)) {
          normalizedData = {
            total: responseData.total || responseData.reports.length,
            reports: responseData.reports
          }
        } else {
          throw new Error("Unexpected API response format")
        }
        
        setData(normalizedData)
      } catch (err) {
        console.error("Fetch error:", err)
        setError(err instanceof Error ? err.message : "Failed to load reports")
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, []) // Only fetch once when component mounts

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Reports
              </h1>
            </div>
          </header>
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive max-w-md">
              <h2 className="text-xl font-bold mb-2">Failed to load reports</h2>
              <p className="text-sm">{error}</p>
              <p className="text-sm mt-2">
                Please make sure your backend is running and accessible.
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!data || !data.reports || data.reports.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Reports
              </h1>
            </div>
          </header>
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">No reports found</h2>
              <p className="text-sm text-muted-foreground">
                There are no email analysis reports yet.
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const totalPages = Math.ceil(data.total / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const reports = data.reports.slice(startIndex, endIndex)

  const spamCount = reports.filter((r) => r.prediction === "spam").length
  const hamCount = reports.filter((r) => r.prediction === "ham").length

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Reports
            </h1>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Showing <strong className="text-foreground">{reports.length}</strong> of{" "}
              <strong className="text-foreground">{data.total}</strong> reports
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <strong className="text-foreground">{spamCount}</strong> spam
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <strong className="text-foreground">{hamCount}</strong> ham
            </span>
          </div>
        </header>

        <div className="grid gap-4">
          {reports.map((report) => (
            <ReportCard key={report._id} report={report} />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Page <strong className="text-foreground">{currentPage}</strong> of{" "}
              <strong className="text-foreground">{totalPages}</strong>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                asChild={currentPage > 1}
              >
                {currentPage > 1 ? (
                  <Link href={`/reports?page=${currentPage - 1}`}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Link>
                ) : (
                  <span>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                asChild={currentPage < totalPages}
              >
                {currentPage < totalPages ? (
                  <Link href={`/reports?page=${currentPage + 1}`}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                ) : (
                  <span>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}