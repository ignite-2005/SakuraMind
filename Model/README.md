# SakuraMind Model

This folder contains model artifacts, data preparation scripts, and training scripts for voice emotion classification.

## Contents

- [emotion_model.pth](emotion_model.pth): trained checkpoint used by backend inference
- [scripts](scripts): data prep and training scripts
- [dataset](dataset): prepared train/val WAV hierarchy
- [spectrograms](spectrograms): generated mel spectrogram images for training

## Script Overview

- [scripts/organize_dataset.py](scripts/organize_dataset.py)
  - scans RAVDESS and CREMA-D
  - maps labels into unified classes
  - creates train/val split in dataset
- [scripts/convert_spectrograms.py](scripts/convert_spectrograms.py)
  - converts WAV files to mel spectrogram PNG files
- [scripts/train.py](scripts/train.py)
  - trains timm resnet18 classifier
  - saves best checkpoint as emotion_model.pth
- [scripts/fix_cremad.py](scripts/fix_cremad.py)
  - re-exports CREMA-D audio files using pydub

## Training Pipeline

From repository root:

```bash
venv\Scripts\activate
cd Model
python scripts/organize_dataset.py
python scripts/convert_spectrograms.py
python scripts/train.py
```

Output artifact:

- [emotion_model.pth](emotion_model.pth)

## Current Training Config

As defined in [scripts/train.py](scripts/train.py):

- Architecture: resnet18 (timm)
- Epochs: 15
- Batch size: 32
- Image size: 224
- Optimizer: Adam
- Device: CUDA if available, else CPU
- Fine-tuning strategy:
  - freeze backbone initially
  - unfreeze all layers at epoch 8

## Label Mapping Notes

Dataset scripts merge source emotion taxonomies to a common set for this project. Frontend display currently focuses on:

- happy
- sad
- angry
- neutral

Some classes are normalized at inference/UI boundary (for example calm and fearful remapping).

## Dependencies

Typical Python dependencies used by scripts:

- torch
- torchvision
- timm
- librosa
- matplotlib
- numpy
- pillow
- pydub
- tqdm

## Data and Artifact Notes

- Large datasets and intermediate artifacts are intentionally ignored in git
- Check [.gitignore](../.gitignore) for current exclusion rules
- Keep [emotion_model.pth](emotion_model.pth) aligned with class metadata expected by backend
