import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Normalize the model's raw label to the 4 UI emotions.
function normalize(rawEmotion: string, rawConfidence: number) {
  let emotion = rawEmotion;
  if (emotion === 'fearful') emotion = 'angry';
  if (emotion === 'calm') emotion = 'neutral';
  const valid = ['happy', 'sad', 'angry', 'neutral'];
  if (!valid.includes(emotion)) emotion = 'neutral';
  const confidence = Math.round(rawConfidence * 100);
  return { emotion, confidence, _t: Date.now() };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const voiceBlob = formData.get('voiceBlob') as File;
    if (!voiceBlob) {
      return NextResponse.json({ error: 'No voiceBlob found' }, { status: 400 });
    }

    // ---- HOSTED MODE: forward to the FastAPI inference service ----
    const apiUrl = process.env.INFERENCE_API_URL;
    if (apiUrl) {
      const fd = new FormData();
      fd.append('voiceBlob', voiceBlob, 'voice.webm');
      const res = await fetch(`${apiUrl}/analyze`, { method: 'POST', body: fd });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: `inference API: ${text}` }, { status: 502 });
      }
      const result = await res.json(); // { emotion, confidence: 0-1 }
      return NextResponse.json(normalize(result.emotion, parseFloat(result.confidence)));
    }

    // ---- LOCAL MODE: spawn the Python script directly (dev only) ----
    const buffer = Buffer.from(await voiceBlob.arrayBuffer());
    const projectRoot = path.join(process.cwd(), '..');
    const tempWebMPath = path.join(projectRoot, 'temp.webm');
    const tempWavPath = path.join(projectRoot, 'temp.wav');
    const scriptsPath = path.join(projectRoot, 'venv', 'Scripts', 'python.exe');
    const pythonExe = fs.existsSync(scriptsPath) ? `"${scriptsPath}"` : 'python';
    const inferenceScript = path.join(projectRoot, 'backend', 'inference.py');

    if (fs.existsSync(tempWavPath)) fs.unlinkSync(tempWavPath);
    fs.writeFileSync(tempWebMPath, buffer);

    try {
      await execAsync(`ffmpeg -i "${tempWebMPath}" -ar 44100 -ac 1 "${tempWavPath}" -y`, { cwd: projectRoot });
    } catch (e) {
      console.error('FFmpeg conversion failed, fallback to raw copy.');
      fs.copyFileSync(tempWebMPath, tempWavPath);
    }

    const { stdout } = await execAsync(`${pythonExe} "${inferenceScript}" "${tempWavPath}"`, { cwd: projectRoot });
    const jsonStart = stdout.indexOf('---JSON_START---');
    const jsonEnd = stdout.indexOf('---JSON_END---');
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error('Python Stdout:', stdout);
      return NextResponse.json({ error: 'Failed to extract JSON from python script' }, { status: 500 });
    }
    const jsonStr = stdout.substring(jsonStart + 16, jsonEnd).trim();
    const result = JSON.parse(jsonStr);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json(normalize(result.emotion, parseFloat(result.confidence)));
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
