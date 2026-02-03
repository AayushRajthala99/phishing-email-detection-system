import ReportDetailPage from "./reportSingle";

export default function Page({
  params,
}: {
  params: { id: string };
}) {
  return <ReportDetailPage id={params.id} />;
}
