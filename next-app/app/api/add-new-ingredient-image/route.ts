import { getServerSession } from "next-auth/next"
import { options } from 'app/api/auth/[...nextauth]/options'
import { writeFile } from 'fs/promises'
import { NextResponse } from "next/server";
import { isAdmin } from '@/utils/auth.js';

export async function POST(req: Request) {
  const session = await getServerSession(options);
  
  try {
    if (!session || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401});
    }

    const data = await req.formData();
    const file = data.get('file');
    // TODO add validation

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 500});
    }
  
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const path = process.cwd() + `/public/ingredients/${file.name}`
    await writeFile(path, buffer)

    return NextResponse.json({ 
      message: 'File uploaded successfully', 
      filepath: `/ingredients/${file.name}` 
    });
  } catch (error) {
    // TODO add general error message, specific is for debugging only 
    return NextResponse.json({ error: error.message }, { status: 500});
  }
}
