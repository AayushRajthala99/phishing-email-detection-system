// "use client"

// import { useEffect, useState } from "react"
// import { ReportsResponse } from "@/lib/types"
// import { ReportCard } from "@/components/ui/report-card"
// import { FileText, ChevronLeft, ChevronRight } from "lucide-react"
// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { getApiUrl } from "@/lib/api"

// export default function ReportsClient({
//   currentPage,
// }: {
//   currentPage: number
// }) {
//   const pageSize = 10

//   const [data, setData] = useState<ReportsResponse | null>(null)
//   const [error, setError] = useState<string | null>(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const fetchReports = async () => {
//       try {
//         const apiUrl = getApiUrl()
//         const res = await fetch(`${apiUrl}/reports`)
//         // const res = await fetch(`http://peds.liger-saiph.ts.net:5000/reports`)
//         if (!res.ok) throw new Error("Failed to fetch reports")

//         const json: ReportsResponse = await res.json()
//         setData(json)
//       } catch (err) {
//         setError(err instanceof Error ? err.message : "Unknown error")
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchReports()
//   }, [])

// // ✅ Guards (VERY IMPORTANT)
//   if (loading) {
//     return <p className="p-8">Loading reports...</p>
//   }

//   if (error) {
//     return <p className="p-8 text-red-500">{error}</p>
//   }

//   if (!data) return null

//   const totalPages = Math.ceil(data.total / pageSize)
  
//   const startIndex = (currentPage - 1) * pageSize
//   const endIndex = startIndex + pageSize
//   const reports = data.reports.slice(startIndex, endIndex)

//   const spamCount = reports.filter((r) => r.prediction === "spam").length
//   const hamCount = reports.filter((r) => r.prediction === "ham").length

//   return (
//     <main className="min-h-screen bg-background">
//            <div className="container mx-auto px-4 py-8 max-w-4xl">
//         <header className="mb-8">
//           <div className="flex items-center gap-3 mb-4">
//             <div className="p-2 rounded-lg bg-primary/10">
//               <FileText className="h-6 w-6 text-primary" />
//             </div>
//             <h1 className="text-3xl font-bold tracking-tight text-foreground">
//               Reports
//             </h1>
//           </div>

//           <div className="flex items-center gap-4 text-sm text-muted-foreground">
//             <span>
//               Showing <strong className="text-foreground">{reports.length}</strong> of{" "}
//               <strong className="text-foreground">{data.total}</strong> reports
//             </span>
//             <span className="text-border">|</span>
//             <span className="flex items-center gap-1">
//               <span className="w-2 h-2 rounded-full bg-red-500" />
//               <strong className="text-foreground">{spamCount}</strong> spam
//             </span>
//             <span className="flex items-center gap-1">
//               <span className="w-2 h-2 rounded-full bg-green-500" />
//               <strong className="text-foreground">{hamCount}</strong> ham
//             </span>
//           </div>
//         </header>

//         <div className="grid gap-4">
//           {reports.map((report) => (
//             <ReportCard key={report._id} report={report} />
//           ))}
//         </div>

//         {totalPages > 1 && (
//           <div className="flex items-center justify-between mt-8 pt-6 border-t">
//             <p className="text-sm text-muted-foreground">
//               Page <strong className="text-foreground">{currentPage}</strong> of{" "}
//               <strong className="text-foreground">{totalPages}</strong>
//             </p>
//             <div className="flex items-center gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 disabled={currentPage <= 1}
//                 asChild={currentPage > 1}
//               >
//                 {currentPage > 1 ? (
//                   <Link href={`/reports?page=${currentPage - 1}`}>
//                     <ChevronLeft className="h-4 w-4 mr-1" />
//                     Previous
//                   </Link>
//                 ) : (
//                   <span>
//                     <ChevronLeft className="h-4 w-4 mr-1" />
//                     Previous
//                   </span>
//                 )}
//               </Button>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 disabled={currentPage >= totalPages}
//                 asChild={currentPage < totalPages}
//               >
//                 {currentPage < totalPages ? (
//                   <Link href={`/reports?page=${currentPage + 1}`}>
//                     Next
//                     <ChevronRight className="h-4 w-4 ml-1" />
//                   </Link>
//                 ) : (
//                   <span>
//                     Next
//                     <ChevronRight className="h-4 w-4 ml-1" />
//                   </span>
//                 )}
//               </Button>
//             </div>
//           </div>
//         )}
//       </div>
//     </main>
//   )
// }

"use client"

import { useEffect, useState } from "react"
import { ReportsResponse } from "@/lib/types"
import { ReportCard } from "@/components/ui/report-card"
import { FileText, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getApiUrl } from "@/lib/api"

export default function ReportsClient({
  currentPage,
}: {
  currentPage: number
}) {
  const pageSize = 10

  const [data, setData] = useState<ReportsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true) // ✅ Reset loading state on page change
      try {
        const apiUrl = getApiUrl()
        // const res = await fetch(`${apiUrl}/reports`)
        const res = await fetch(`http://peds.liger-saiph.ts.net:5000/reports`)
        if (!res.ok) throw new Error("Failed to fetch reports")

        const json: ReportsResponse = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [currentPage]) // ✅ Re-fetch when currentPage changes

  // ✅ Guards (VERY IMPORTANT)
  if (loading) {
    return <p className="p-8">Loading reports...</p>
  }

  if (error) {
    return <p className="p-8 text-red-500">{error}</p>
  }

  if (!data) return null

  const totalPages = Math.ceil(data.total / pageSize)
  
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const reports = data.reports.slice(startIndex, endIndex)

  const displayStart = startIndex + 1
  const displayEnd = Math.min(endIndex, data.total)

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
              Showing <strong className="text-foreground">{displayStart}-{displayEnd}</strong> of{" "}
              <strong className="text-foreground">{data.total}</strong> reports
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <strong className="text-foreground">{spamCount}</strong> Suspicious
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <strong className="text-foreground">{hamCount}</strong> Legitimate
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {currentPage > 1 ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/reports?page=${currentPage - 1}`}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
              
              {currentPage < totalPages ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/reports?page=${currentPage + 1}`}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
