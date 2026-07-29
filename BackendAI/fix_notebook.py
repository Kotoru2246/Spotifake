import json

def fix_notebook():
    path = "c:/Users/jacky/OneDrive/Desktop/New folder/BackendAI/CNN_Training_Robust.ipynb"
    with open(path, 'r', encoding='utf-8') as f:
        nb = json.load(f)
        
    # We want everything up to Cell 13 (Step 5 code).
    # Then we add a Markdown cell for Step 6.
    # Then we add the robust training code cell.
    
    new_cells = nb['cells'][:14] # 0 to 13 (Step 0 through Step 5 code)
    
    markdown_step6 = {
        "cell_type": "markdown",
        "metadata": {},
        "source": ["## 🏋️ Step 6 – Robust Training Loop (With Checkpoints & Eval)"]
    }
    
    robust_training_source = [
        "import torch.optim as optim\n",
        "from torch.optim.lr_scheduler import CosineAnnealingLR\n",
        "from sklearn.metrics import confusion_matrix, accuracy_score, f1_score, classification_report\n",
        "import matplotlib.pyplot as plt\n",
        "import seaborn as sns\n",
        "from tqdm import tqdm\n",
        "from IPython.display import FileLink, display\n",
        "import numpy as np\n",
        "\n",
        "print(\"🚀 Starting robust training loop with checkpointing...\")\n",
        "EPOCHS = 20\n",
        "LR = 3e-4\n",
        "\n",
        "criterion = nn.CrossEntropyLoss()\n",
        "optimizer = optim.AdamW(cnn_model.parameters(), lr=LR, weight_decay=1e-4)\n",
        "scheduler = CosineAnnealingLR(optimizer, T_max=EPOCHS)\n",
        "\n",
        "history = {'train_loss': [], 'val_acc': [], 'val_f1': []}\n",
        "\n",
        "for epoch in range(1, EPOCHS + 1):\n",
        "    # ------ 1. TRAINING PHASE ------\n",
        "    cnn_model.train()\n",
        "    train_loss = 0.0\n",
        "    for mel, labels, weights in tqdm(train_loader, desc=f'Epoch {epoch}/{EPOCHS} [Train]', leave=False):\n",
        "        mel, labels = mel.to(device), labels.to(device)\n",
        "        weights = weights.float().to(device)\n",
        "\n",
        "        optimizer.zero_grad()\n",
        "        outputs = cnn_model(mel)\n",
        "        loss = (criterion(outputs, labels) * weights).mean()\n",
        "        loss.backward()\n",
        "        optimizer.step()\n",
        "        train_loss += loss.item()\n",
        "\n",
        "    scheduler.step()\n",
        "    avg_loss = train_loss / len(train_loader)\n",
        "    history['train_loss'].append(avg_loss)\n",
        "    print(f'Epoch {epoch:02d}/{EPOCHS} | Train Loss: {avg_loss:.4f} | LR: {scheduler.get_last_lr()[0]:.6f}')\n",
        "\n",
        "    # ------ 2. EVERY 5 EPOCHS: EVALUATE & SAVE ------\n",
        "    if epoch % 5 == 0:\n",
        "        print(f\"\\n✨ --- EPOCH {epoch} MILESTONE REACHED --- ✨\")\n",
        "        \n",
        "        # A. Evaluate Model\n",
        "        cnn_model.eval()\n",
        "        all_preds, all_labels = [], []\n",
        "        print(\"Evaluating on Validation Set...\")\n",
        "        with torch.no_grad():\n",
        "            for mel, labels, _ in tqdm(val_loader, desc=f'Epoch {epoch}/{EPOCHS} [Val]  ', leave=False):\n",
        "                mel = mel.to(device)\n",
        "                outputs = cnn_model(mel)\n",
        "                preds = outputs.argmax(dim=1).cpu().numpy()\n",
        "                all_preds.extend(preds)\n",
        "                all_labels.extend(labels.numpy())\n",
        "        \n",
        "        val_acc = accuracy_score(all_labels, all_preds)\n",
        "        val_f1  = f1_score(all_labels, all_preds, average='weighted')\n",
        "        history['val_acc'].append(val_acc)\n",
        "        history['val_f1'].append(val_f1)\n",
        "        print(f\"✅ Validation Accuracy: {val_acc*100:.2f}% | Validation F1: {val_f1*100:.2f}%\")\n",
        "        \n",
        "        # Plot Confusion Matrix\n",
        "        cm = confusion_matrix(all_labels, all_preds)\n",
        "        plt.figure(figsize=(10, 8))\n",
        "        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=genres, yticklabels=genres)\n",
        "        plt.title(f'Confusion Matrix - Epoch {epoch}')\n",
        "        plt.ylabel('Actual'); plt.xlabel('Predicted')\n",
        "        plt.tight_layout()\n",
        "        plt.show()\n",
        "        \n",
        "        # B. Save Checkpoint\n",
        "        save_bundle = {\n",
        "            'model_state_dict': cnn_model.state_dict(),\n",
        "            'genres': genres, 'label2idx': label2idx,\n",
        "            'idx2label': {str(k): v for k, v in idx2label.items()},\n",
        "            'num_classes': len(genres), 'sample_rate': SAMPLE_RATE,\n",
        "            'clip_seconds': CLIP_SECONDS, 'n_mels': N_MELS,\n",
        "            'n_fft': N_FFT, 'hop_length': HOP_LENGTH, 'target_length': TARGET_LENGTH,\n",
        "            'epoch': epoch, 'val_acc': val_acc\n",
        "        }\n",
        "        \n",
        "        model_filename = f'cnn_genre_model_epoch_{epoch}.pth'\n",
        "        torch.save(save_bundle, model_filename)\n",
        "        print(f\"✅ Successfully saved checkpoint: {model_filename}\")\n",
        "        \n",
        "        # Show Download Link\n",
        "        try:\n",
        "            display(FileLink(model_filename))\n",
        "        except Exception:\n",
        "            pass\n",
        "        print(\"✨ ------------------------------------- ✨\\n\")\n",
        "\n",
        "print('\\n✅ Robust training loop complete!')\n"
    ]
    
    code_step6 = {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": robust_training_source
    }
    
    new_cells.append(markdown_step6)
    new_cells.append(code_step6)
    
    nb['cells'] = new_cells
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=1)

if __name__ == "__main__":
    fix_notebook()


--- VERSION ---

import json

def fix_notebook():
    path = "c:/Users/jacky/OneDrive/Desktop/New folder/BackendAI/CNN_Training_Robust.ipynb"
    with open(path, 'r', encoding='utf-8') as f:
        nb = json.load(f)
        
    # We want everything up to Cell 13 (Step 5 code).
    # Then we add a Markdown cell for Step 6.
    # Then we add the robust training code cell.
    
    new_cells = nb['cells'][:14] # 0 to 13 (Step 0 through Step 5 code)
    
    markdown_step6 = {
        "cell_type": "markdown",
        "metadata": {},
        "source": ["## 🏋️ Step 6 – Robust Training Loop (With Checkpoints & Eval)"]
    }
    
    robust_training_source = [
        "import torch.optim as optim\n",
        "from torch.optim.lr_scheduler import CosineAnnealingLR\n",
        "from sklearn.metrics import confusion_matrix, accuracy_score, f1_score, classification_report\n",
        "import matplotlib.pyplot as plt\n",
        "import seaborn as sns\n",
        "from tqdm import tqdm\n",
        "from IPython.display import FileLink, display\n",
        "import numpy as np\n",
        "\n",
        "print(\"🚀 Starting robust training loop with checkpointing...\")\n",
        "EPOCHS = 20\n",
        "LR = 3e-4\n",
        "\n",
        "criterion = nn.CrossEntropyLoss()\n",
        "optimizer = optim.AdamW(cnn_model.parameters(), lr=LR, weight_decay=1e-4)\n",
        "scheduler = CosineAnnealingLR(optimizer, T_max=EPOCHS)\n",
        "\n",
        "history = {'train_loss': [], 'val_acc': [], 'val_f1': []}\n",
        "\n",
        "for epoch in range(1, EPOCHS + 1):\n",
        "    # ------ 1. TRAINING PHASE ------\n",
        "    cnn_model.train()\n",
        "    train_loss = 0.0\n",
        "    for mel, labels, weights in tqdm(train_loader, desc=f'Epoch {epoch}/{EPOCHS} [Train]', leave=False):\n",
        "        mel, labels = mel.to(device), labels.to(device)\n",
        "        weights = weights.float().to(device)\n",
        "\n",
        "        optimizer.zero_grad()\n",
        "        outputs = cnn_model(mel)\n",
        "        loss = (criterion(outputs, labels) * weights).mean()\n",
        "        loss.backward()\n",
        "        optimizer.step()\n",
        "        train_loss += loss.item()\n",
        "\n",
        "    scheduler.step()\n",
        "    avg_loss = train_loss / len(train_loader)\n",
        "    history['train_loss'].append(avg_loss)\n",
        "    print(f'Epoch {epoch:02d}/{EPOCHS} | Train Loss: {avg_loss:.4f} | LR: {scheduler.get_last_lr()[0]:.6f}')\n",
        "\n",
        "    # ------ 2. EVERY 5 EPOCHS: EVALUATE & SAVE ------\n",
        "    if epoch % 5 == 0:\n",
        "        print(f\"\\n✨ --- EPOCH {epoch} MILESTONE REACHED --- ✨\")\n",
        "        \n",
        "        # A. Evaluate Model\n",
        "        cnn_model.eval()\n",
        "        all_preds, all_labels = [], []\n",
        "        print(\"Evaluating on Validation Set...\")\n",
        "        with torch.no_grad():\n",
        "            for mel, labels, _ in tqdm(val_loader, desc=f'Epoch {epoch}/{EPOCHS} [Val]  ', leave=False):\n",
        "                mel = mel.to(device)\n",
        "                outputs = cnn_model(mel)\n",
        "                preds = outputs.argmax(dim=1).cpu().numpy()\n",
        "                all_preds.extend(preds)\n",
        "                all_labels.extend(labels.numpy())\n",
        "        \n",
        "        val_acc = accuracy_score(all_labels, all_preds)\n",
        "        val_f1  = f1_score(all_labels, all_preds, average='weighted')\n",
        "        history['val_acc'].append(val_acc)\n",
        "        history['val_f1'].append(val_f1)\n",
        "        print(f\"✅ Validation Accuracy: {val_acc*100:.2f}% | Validation F1: {val_f1*100:.2f}%\")\n",
        "        \n",
        "        # Plot Confusion Matrix\n",
        "        cm = confusion_matrix(all_labels, all_preds)\n",
        "        plt.figure(figsize=(10, 8))\n",
        "        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=genres, yticklabels=genres)\n",
        "        plt.title(f'Confusion Matrix - Epoch {epoch}')\n",
        "        plt.ylabel('Actual'); plt.xlabel('Predicted')\n",
        "        plt.tight_layout()\n",
        "        plt.show()\n",
        "        \n",
        "        # B. Save Checkpoint\n",
        "        save_bundle = {\n",
        "            'model_state_dict': cnn_model.state_dict(),\n",
        "            'genres': genres, 'label2idx': label2idx,\n",
        "            'idx2label': {str(k): v for k, v in idx2label.items()},\n",
        "            'num_classes': len(genres), 'sample_rate': SAMPLE_RATE,\n",
        "            'clip_seconds': CLIP_SECONDS, 'n_mels': N_MELS,\n",
        "            'n_fft': N_FFT, 'hop_length': HOP_LENGTH, 'target_length': TARGET_LENGTH,\n",
        "            'epoch': epoch, 'val_acc': val_acc\n",
        "        }\n",
        "        \n",
        "        model_filename = f'cnn_genre_model_epoch_{epoch}.pth'\n",
        "        torch.save(save_bundle, model_filename)\n",
        "        print(f\"✅ Successfully saved checkpoint: {model_filename}\")\n",
        "        \n",
        "        # Show Download Link\n",
        "        try:\n",
        "            display(FileLink(model_filename))\n",
        "        except Exception:\n",
        "            pass\n",
        "        print(\"✨ ------------------------------------- ✨\\n\")\n",
        "\n",
        "print('\\n✅ Robust training loop complete!')\n"
    ]
    
    code_step6 = {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": robust_training_source
    }
    
    new_cells.append(markdown_step6)
    new_cells.append(code_step6)
    
    nb['cells'] = new_cells
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=1)

if __name__ == "__main__":
    fix_notebook()
