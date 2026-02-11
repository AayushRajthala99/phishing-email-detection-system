import ReportsClient from "./reportClient"

type PageProps = {
  searchParams: Promise<{ page?: string }>
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1

  return <ReportsClient currentPage={currentPage} />
}