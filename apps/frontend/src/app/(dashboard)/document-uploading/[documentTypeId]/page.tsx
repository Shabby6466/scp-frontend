import { redirect } from 'next/navigation';

/** Legacy URL — form detail lives on `/my-documents?type=…`. */
export default async function DocumentUploadingTypeRedirectPage({
  params,
}: {
  params: Promise<{ documentTypeId: string }>;
}) {
  const { documentTypeId } = await params;
  redirect(`/my-documents?type=${encodeURIComponent(documentTypeId)}`);
}
