// import ReportsClient from "./reportClient"

// interface PageProps {
//   searchParams: { page?: string }
// }

// export default function ReportsPage({ searchParams }: PageProps) {
//   const currentPage = Number(searchParams.page) || 1

//   return <ReportsClient currentPage={currentPage} />
// }
import ReportsClient from "./reportClient"

type PageProps = {
  searchParams: Promise<{ page?: string }>
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1

  return <ReportsClient currentPage={currentPage} />
}