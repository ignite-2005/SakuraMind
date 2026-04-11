import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const voiceBlob = formData.get('voiceBlob') as File;
    if (!voiceBlob) {
      return NextResponse.json({ error: 'No voiceBlob found' }, { status: 400 });
    }

    const buffer = Buffer.from(await voiceBlob.arrayBuffer());
    
    const projectRoot = path.join(process.cwd(), '..');
    const tempWebMPath = path.join(projectRoot, 'temp.webm');
    const tempWavPath = path.join(projectRoot, 'temp.wav');
    const scriptsPath = path.join(projectRoot, 'venv', 'Scripts', 'python.exe');
    const pythonExe = fs.existsSync(scriptsPath) ? `"${scriptsPath}"` : 'python';
    const inferenceScript = path.join(projectRoot, 'inference.py');

    // Make sure old files are removed to avoid caching issues
    if (fs.existsSync(tempWavPath)) fs.unlinkSync(tempWavPath);
    
    fs.writeFileSync(tempWebMPath, buffer);

    try {
        await execAsync(`ffmpeg -i "${tempWebMPath}" -ar 44100 -ac 1 "${tempWavPath}" -y`, { cwd: projectRoot });
    } catch(e) {
        console.error("FFmpeg conversion failed or took too long, fallback to raw copy.");
        fs.copyFileSync(tempWebMPath, tempWavPath);
    }

    const { stdout, stderr } = await execAsync(`${pythonExe} "${inferenceScript}" "${tempWavPath}"`, { cwd: projectRoot });
    
    const jsonStart = stdout.indexOf('---JSON_START---');
    const jsonEnd = stdout.indexOf('---JSON_END---');
    
    if (jsonStart === -1 || jsonEnd === -1) {
       console.error("Python Stdout:", stdout);
       return NextResponse.json({ error: 'Failed to extract JSON from python script' }, { status: 500 });
    }

    const jsonStr = stdout.substring(jsonStart + 16, jsonEnd).trim();
    const result = JSON.parse(jsonStr);

    if (result.error) {
       return NextResponse.json({ error: result.error }, { status: 500 });
    }

    let emotion = result.emotion;
    if (emotion === 'fearful') emotion = 'angry';
    if (emotion === 'calm') emotion = 'neutral';
    
    const validEmotions = ['happy', 'sad', 'angry', 'neutral'];
    if (!validEmotions.includes(emotion)) emotion = 'neutral';

    const confidence = Math.round(parseFloat(result.confidence) * 100);

    return NextResponse.json({ emotion, confidence, _t: Date.now() });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
