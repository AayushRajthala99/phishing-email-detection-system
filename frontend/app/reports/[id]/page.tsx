import ReportDetailClient from "./ReportDetailClient"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // console.log("Rendering Report Detail Page for ID:", id)
  return <ReportDetailClient id={id} />
}