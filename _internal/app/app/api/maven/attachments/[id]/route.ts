import { Buffer } from 'node:buffer';
import { getRevisionStore } from '@/lib/revision-store';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const db = await getRevisionStore();
  const file = await db
    .prepare(
      'SELECT name,mime_type,data_base64 FROM maven_attachments WHERE id=?',
    )
    .bind(id)
    .first<{ name: string; mime_type: string; data_base64: string }>();
  if (!file) return new Response('Attachment not found.', { status: 404 });
  const chunks = await db
    .prepare(
      'SELECT data_base64 FROM maven_attachment_chunks WHERE attachment_id=? ORDER BY chunk_index',
    )
    .bind(id)
    .all<{ data_base64: string }>();
  const bytes = chunks.results.length
    ? Buffer.concat(
        chunks.results.map((c) => Buffer.from(c.data_base64, 'base64')),
      )
    : Buffer.from(file.data_base64, 'base64');
  const query = new URL(request.url).searchParams;
  const download =
    query.has('download') ||
    (file.mime_type === 'application/pdf' && query.get('view') !== '1');
  return new Response(bytes, {
    headers: {
      'Content-Type': file.mime_type,
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}
