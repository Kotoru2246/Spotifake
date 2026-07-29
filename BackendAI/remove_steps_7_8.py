import json

def remove_steps():
    path = "c:/Users/jacky/OneDrive/Desktop/New folder/BackendAI/CNN_Spectrogram_Training_Colab.ipynb"
    with open(path, 'r', encoding='utf-8') as f:
        nb = json.load(f)
        
    # We want to keep up to Step 6 Code (which is index 16)
    # The cells we want to keep are index 0 to 16.
    # We slice [:17] to keep 17 elements (indices 0 to 16).
    nb['cells'] = nb['cells'][:17]
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=1)

if __name__ == "__main__":
    remove_steps()


--- VERSION ---

import json

def remove_steps():
    path = "c:/Users/jacky/OneDrive/Desktop/New folder/BackendAI/CNN_Spectrogram_Training_Colab.ipynb"
    with open(path, 'r', encoding='utf-8') as f:
        nb = json.load(f)
        
    # We want to keep up to Step 6 Code (which is index 16)
    # The cells we want to keep are index 0 to 16.
    # We slice [:17] to keep 17 elements (indices 0 to 16).
    nb['cells'] = nb['cells'][:17]
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=1)

if __name__ == "__main__":
    remove_steps()
