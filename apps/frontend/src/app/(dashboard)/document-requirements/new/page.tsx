import { redirect } from 'next/navigation';

/** Legacy URL — document type CRUD lives on `/document-types`. */
export default function DocumentRequirementsNewRedirectPage() {
  redirect('/document-types');
}
