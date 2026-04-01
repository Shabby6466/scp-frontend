/**
 * PUT to a presigned URL. Supabase signed uploads require `Authorization: Bearer <token>`.
 * S3 presigned URLs work with Content-Type only.
 */
export async function putFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  mimeType: string,
  uploadToken?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': mimeType || 'application/octet-stream',
  };
  if (uploadToken) {
    headers.Authorization = `Bearer ${uploadToken}`;
  }
  return fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers,
  });
}
