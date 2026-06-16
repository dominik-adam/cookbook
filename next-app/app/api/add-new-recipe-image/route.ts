import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { writeFile } from 'fs/promises'
import { NextResponse } from "next/server";
import { isAdmin } from '@/utils/auth';
import { randomUUID } from 'crypto';
import path from 'path';

// Uses a random name rather than the original filename + an existsSync check:
// pasted clipboard images are almost always named "image.png" by the browser,
// and existsSync-then-writeFile is a TOCTOU race that let concurrent uploads
// for different recipes collide on the same filename and overwrite each other.
function getUniqueFilePath(dir: string, originalName: string) {
  const ext = path.extname(originalName);
  const finalName = `${randomUUID()}${ext}`;
  return { fullPath: path.join(dir, finalName), finalName };
}

export async function POST(req: Request) {
  const session = await getServerSession(options);

  try {
    if (!session || !session.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.formData();
    const file = data.get('file') as File | null;

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Missing file' }, { status: 500 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    const uploadDir = process.cwd() + `/public/images`;

    const { fullPath, finalName } = getUniqueFilePath(uploadDir, file.name);

    await writeFile(fullPath, buffer);

    return NextResponse.json({
      message: 'File uploaded successfully',
      // Served via the dynamic media route so the upload is visible immediately,
      // without waiting for a server restart to rebuild the static public manifest.
      filepath: `/api/media/images/${finalName}`
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}