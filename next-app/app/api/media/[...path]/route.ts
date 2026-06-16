import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

// Serve runtime-uploaded images from disk on every request.
//
// In production `next start` builds the list of servable `public/` files ONCE at
// startup. Anything written to `public/` afterwards (user uploads) isn't in that
// manifest, so the static handler 404s it until the server is restarted — which is
// why freshly pasted thumbnails showed a broken image until a manual restart.
// This route handler reads the file from disk per request, so new uploads are
// available immediately, with no restart and no dependency on the static manifest.
export const dynamic = 'force-dynamic';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const ALLOWED_DIRS = ['images', 'ingredients'];

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};

export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } }
) {
  const segments = params.path ?? [];

  // Must be at least <dir>/<file>, restricted to known upload dirs, and free of
  // any path-traversal characters in every segment.
  const isSafe =
    segments.length >= 2 &&
    ALLOWED_DIRS.includes(segments[0]) &&
    segments.every((s) => s && !s.includes('..') && !s.includes('/') && !s.includes('\\'));

  if (!isSafe) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const filePath = path.join(PUBLIC_DIR, ...segments);

  // Defense in depth: ensure the resolved path is still inside /public.
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()];
  if (!contentType) {
    return NextResponse.json({ error: 'Unsupported media type' }, { status: 415 });
  }

  try {
    const file = await readFile(filePath);
    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Filenames are random UUIDs, so a given URL always maps to the same bytes.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
