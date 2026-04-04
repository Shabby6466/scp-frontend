import { redirect } from 'next/navigation';

/** Legacy URL — use `/my-documents` for assigned requirements and uploads. */
export default function DocumentUploadingRedirectPage() {
  redirect('/my-documents');
}
