import os
root = os.path.join('C:\\', 'Users', 'jacky', 'OneDrive', 'Desktop', 'New folder', 'BackendAI')
os.chdir(root)
import fma_download
fma_download.main(out_dir='fma_data', download_audio=True)
