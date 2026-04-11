const fs = require('fs');
const path = require('path');

async function test() {
    const filePath = path.resolve('../audio.wav');
    const fileBuf = fs.readFileSync(filePath);
    // Node.js native fetch and Blob (Node 18+)
    const blob = new Blob([fileBuf], { type: 'audio/wav' });

    const formData = new FormData();
    formData.append('voiceBlob', blob, 'recording.wav');

    try {
        console.log("Sending POST to /api/analyze...");
        const res = await fetch('http://localhost:3000/api/analyze', {
            method: 'POST',
            body: formData
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch(e) {
        console.error("Fetch Error:", e);
    }
}
test();
