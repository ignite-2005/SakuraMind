# SakuraMind Model

Machine Learning pipeline powering SakuraMind's voice-based emotional analysis system.

The model processes speech recordings, converts them into Mel Spectrogram representations, and performs emotion classification using a fine-tuned ResNet18 architecture.

Supported emotions include:

- Happy
- Sad
- Neutral
- Angry

The output is consumed by the SakuraMind backend to generate emotional balance scores, trend analysis, and AI-generated interpretations.

---

## Contents

- [emotion_model.pth](emotion_model.pth): trained checkpoint used by backend inference
- [scripts](scripts): data preparation and training scripts
- [dataset](dataset): prepared train/validation WAV hierarchy
- [spectrograms](spectrograms): generated mel spectrogram images used for training

---

## Script Overview

### [scripts/organize_dataset.py](scripts/organize_dataset.py)

- Scans RAVDESS and CREMA-D datasets
- Maps labels into unified emotion classes
- Creates train/validation split structure

### [scripts/convert_spectrograms.py](scripts/convert_spectrograms.py)

- Converts WAV files into Mel Spectrogram PNG images
- Prepares visual inputs for model training

### [scripts/train.py](scripts/train.py)

- Trains a ResNet18 classifier using TIMM
- Performs fine-tuning strategy
- Saves best checkpoint as `emotion_model.pth`

### [scripts/fix_cremad.py](scripts/fix_cremad.py)

- Re-exports CREMA-D audio files using Pydub
- Resolves compatibility issues during preprocessing

---

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

```text
emotion_model.pth
```

---

## Current Training Configuration

As defined in `scripts/train.py`:

| Parameter | Value |
|------------|---------|
| Architecture | ResNet18 (TIMM) |
| Epochs | 15 |
| Batch Size | 32 |
| Image Size | 224 × 224 |
| Optimizer | Adam |
| Device | CUDA (if available) / CPU |

### Fine-Tuning Strategy

- Freeze backbone initially
- Train classification head
- Unfreeze all layers at Epoch 8
- Continue end-to-end fine-tuning

---

## Label Mapping Notes

Dataset preparation scripts merge multiple emotion taxonomies into a common set for SakuraMind.

Frontend presentation currently focuses on:

- Happy
- Sad
- Angry
- Neutral

Some source labels are normalized during inference and UI processing.

Examples:

- Calm → Neutral
- Fearful → Stressed / Neutral (depending on mapping strategy)

---

## Dependencies

Core libraries used throughout the pipeline:

- torch
- torchvision
- timm
- librosa
- matplotlib
- numpy
- pillow
- pydub
- tqdm

Install requirements:

```bash
pip install torch torchvision timm librosa matplotlib numpy pillow pydub tqdm
```

---

## Data and Artifact Notes

- Large datasets are intentionally excluded from Git
- Intermediate training artifacts are ignored
- Model checkpoints should remain synchronized with backend class metadata
- Refer to the repository `.gitignore` for exclusion rules

---

## Model Workflow

```text
Voice Recording
        ↓
Audio Preprocessing
        ↓
Mel Spectrogram Generation
        ↓
ResNet18 Emotion Classifier
        ↓
Emotion Prediction
        ↓
Backend Analysis
        ↓
Balance Score & Insights
        ↓
SakuraMind Dashboard
```

---

## Future Improvements

Planned enhancements for future versions:

- Additional emotion classes
- Larger and more diverse speech datasets
- Transformer-based audio architectures
- Confidence calibration
- Real-time streaming inference
- Longitudinal emotional trend modeling
- Improved multi-speaker robustness
- Personalized emotional baseline tracking

---

## Project Role in SakuraMind

This model serves as the analytical core of SakuraMind, enabling:

- Voice emotion detection
- Emotional balance estimation
- Trend monitoring across sessions
- AI-generated emotional interpretations
- Historical emotional reporting

The long-term vision is to evolve SakuraMind into a more comprehensive emotional well-being platform powered by voice-based behavioral intelligence.