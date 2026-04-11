import os, shutil, glob, random

# RAVDESS emotion map (position 2 in filename)
RAVDESS_MAP = {
    '01': 'neutral',
    '02': 'neutral',   # calm → neutral
    '03': 'happy',
    '04': 'sad',
    '05': 'angry',
    '06': 'angry',     # fearful → angry
}

# CREMA-D emotion map (position 2 in filename)
CREMAD_MAP = {
    'ANG': 'angry',
    'HAP': 'happy',
    'SAD': 'sad',
    'NEU': 'neutral',
    'FEA': 'angry',    # fearful → angry
    'DIS': 'sad',      # disgust → sad
}

all_files = []  # list of (wav_path, emotion)

# Load RAVDESS
ravdess_files = glob.glob(os.path.join("Actor_*", "**", "*.wav"), recursive=True)
print(f"RAVDESS files found: {len(ravdess_files)}")
for wav_path in ravdess_files:
    parts = os.path.basename(wav_path).replace('.wav', '').split('-')
    emotion = RAVDESS_MAP.get(parts[2])
    if emotion:
        all_files.append((wav_path, emotion))

# Load CREMA-D
cremad_files = glob.glob(os.path.join("CREMA-D-master", "AudioWAV", "*.wav"))
print(f"CREMA-D files found: {len(cremad_files)}")
for wav_path in cremad_files:
    parts = os.path.basename(wav_path).replace('.wav', '').split('_')
    emotion = CREMAD_MAP.get(parts[2])
    if emotion:
        all_files.append((wav_path, emotion))

print(f"Total files: {len(all_files)}")

# Shuffle and split 80/20
random.seed(42)
random.shuffle(all_files)
split_idx = int(len(all_files) * 0.8)
train_files = all_files[:split_idx]
val_files   = all_files[split_idx:]

# Clear old dataset
if os.path.exists("dataset"):
    shutil.rmtree("dataset")

# Copy files
def copy_files(file_list, split_name):
    for wav_path, emotion in file_list:
        dest = os.path.join("dataset", split_name, emotion)
        os.makedirs(dest, exist_ok=True)
        shutil.copy(wav_path, dest)

copy_files(train_files, 'train')
copy_files(val_files, 'val')

print(f"\nTrain: {len(train_files)} | Val: {len(val_files)}")
for split in ['train', 'val']:
    print(f"\n{split.upper()}:")
    for emotion in sorted(os.listdir(f"dataset/{split}")):
        count = len(os.listdir(f"dataset/{split}/{emotion}"))
        print(f"  {emotion}: {count} files")