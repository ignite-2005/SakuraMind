import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const melPath = path.join(process.cwd(), '..', 'mel.png');
    if (!fs.existsSync(melPath)) {
      return NextResponse.json({ error: 'mel.png not found' }, { status: 404 });
    }
    const buffer = fs.readFileSync(melPath);
    return new NextResponse(buffer, {
      headers: { 
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
