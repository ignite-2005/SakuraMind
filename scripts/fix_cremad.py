import os, glob
from pydub import AudioSegment
from tqdm import tqdm

files = glob.glob(os.path.join("CREMA-D-master", "AudioWAV", "*.wav"))
print(f"Converting {len(files)} CREMA-D files...")

fixed = 0
errors = 0
for f in tqdm(files):
    try:
        audio = AudioSegment.from_file(f)
        audio.export(f, format="wav")
        fixed += 1
    except Exception as e:
        errors += 1

print(f"Fixed: {fixed} | Errors: {errors}")