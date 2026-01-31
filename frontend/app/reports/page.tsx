import ReportsClient from "./reportClient"

interface PageProps {
  searchParams: { page?: string }
}

export default function ReportsPage({ searchParams }: PageProps) {
  const currentPage = Number(searchParams.page) || 1

  return <ReportsClient currentPage={currentPage} />
}
