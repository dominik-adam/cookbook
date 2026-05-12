import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { writeFile } from 'fs/promises'
import { NextResponse } from "next/server";
import { isAdmin } from '@/utils/auth';
import fs from 'fs';
import path from 'path';

function getUniqueFilePath(dir: string, originalName: string) {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);

  let finalName = originalName;
  let counter = 1;

  let fullPath = path.join(dir, finalName);

  while (fs.existsSync(fullPath)) {
    finalName = `${baseName}-${counter}${ext}`;
    fullPath = path.join(dir, finalName);
    counter++;
  }

  return { fullPath, finalName };
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
      filepath: `/images/${finalName}`
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}