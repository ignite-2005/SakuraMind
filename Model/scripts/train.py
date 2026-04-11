import torch
import torch.nn as nn
import torch.optim as optim
import timm
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
EPOCHS = 15
BATCH_SIZE = 32
IMG_SIZE = 224

print(f"Training on: {DEVICE}")

train_tf = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])
val_tf = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

train_ds = datasets.ImageFolder("spectrograms/train", transform=train_tf)
val_ds   = datasets.ImageFolder("spectrograms/val",   transform=val_tf)

train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  num_workers=0)
val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

CLASS_NAMES = train_ds.classes
print(f"Classes: {CLASS_NAMES}")
print(f"Train: {len(train_ds)} | Val: {len(val_ds)}")

model = timm.create_model('resnet18', pretrained=True, num_classes=len(CLASS_NAMES))

# Freeze all layers except final
for name, param in model.named_parameters():
    if 'fc' not in name:
        param.requires_grad = False

model = model.to(DEVICE)
optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-3)
criterion = nn.CrossEntropyLoss()
best_val_acc = 0

for epoch in range(EPOCHS):
    # Unfreeze all layers at epoch 8
    if epoch == 8:
        print("\n--- Unfreezing all layers for fine-tuning ---")
        for param in model.parameters():
            param.requires_grad = True
        optimizer = optim.Adam(model.parameters(), lr=1e-5)

    model.train()
    train_correct = 0
    for images, labels in train_loader:
        images, labels = images.to(DEVICE), labels.to(DEVICE)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        train_correct += (outputs.argmax(1) == labels).sum().item()

    model.eval()
    val_correct = 0
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            val_correct += (model(images).argmax(1) == labels).sum().item()

    train_acc = train_correct / len(train_ds)
    val_acc   = val_correct   / len(val_ds)
    print(f"Epoch {epoch+1:2d}/{EPOCHS} | Train: {train_acc:.2%} | Val: {val_acc:.2%}")

    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save({
            'model_state': model.state_dict(),
            'classes': CLASS_NAMES
        }, 'emotion_model.pth')
        print(f"  ✓ Best model saved ({val_acc:.2%})")

print(f"\nTraining complete. Best val accuracy: {best_val_acc:.2%}")