import ReportDetailClient from "./ReportDetailClient"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ReportDetailClient id={id} />
}