import { ReportsResponse } from "@/lib/types"
import { ReportCard } from "@/components/ui/report-card"
import { FileText, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getApiUrl } from "@/lib/api"

async function getReports(): Promise<ReportsResponse> {
  try {
    const apiUrl = getApiUrl();
    console.log("Fetching from:", `${apiUrl}/reports`)
    // console.log("Fetching from:", `http://peds.liger-saiph.ts.net:5000/reports`)
    
    // const response = await fetch(`http://peds.liger-saiph.ts.net:5000/reports`, {
    //   cache: "no-store",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    // })
    const response = await fetch(`${apiUrl}/reports`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    })

    // if (!response.ok) {
    //   const errorText = await response.text()
    //   console.error("API Error:", response.status, errorText)
    //   throw new Error(`Failed to fetch reports: ${response.status} ${errorText}`)
    // }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Fetch error:", error)
    throw error
  }
}

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const pageSize = 10

  let data: ReportsResponse
  
  try {
    data = await getReports()
  } catch (error) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
              <h2 className="text-xl font-bold mb-2">Failed to load reports</h2>
              <p className="text-sm">
                {error instanceof Error ? error.message : "Unknown error occurred"}
              </p>
              <p className="text-sm mt-2">
                Please make sure your backend is running on the correct port.
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