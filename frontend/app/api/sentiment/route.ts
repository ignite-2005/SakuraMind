import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const historyPath = path.join(process.cwd(), '..', 'history.txt');
    if (!fs.existsSync(historyPath)) {
      return NextResponse.json({ error: 'history.txt not found' }, { status: 404 });
    }
    const stat = fs.statSync(historyPath);
    const content = fs.readFileSync(historyPath, 'utf-8');
    const lines = content.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    if (!lastLine) {
       return NextResponse.json({ error: 'Empty history.txt' }, { status: 400 });
    }
    let [emotion, confidenceStr] = lastLine.split(',');
    
    // Map backend emotions to frontend EmotionType
    if (emotion === 'fearful') emotion = 'angry';
    if (emotion === 'calm') emotion = 'neutral';
    
    // Validate emotion
    const validEmotions = ['happy', 'sad', 'angry', 'neutral'];
    if (!validEmotions.includes(emotion)) {
        emotion = 'neutral';
    }
    
    const confidence = Math.round(parseFloat(confidenceStr) * 100);
    return NextResponse.json({ emotion, confidence, mtime: stat.mtimeMs });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
