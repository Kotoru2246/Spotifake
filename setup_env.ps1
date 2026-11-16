$pyExe = 'C:\Users\jacky\AppData\Local\Programs\Python\Python312\python.exe'
$targetDir = 'C:\Users\jacky\.gemini\antigravity-ide\scratch\Spotifake'
Set-Location $targetDir

Write-Host "Updating User PATH with Python 3.12..."
$pyDir = 'C:\Users\jacky\AppData\Local\Programs\Python\Python312'
$scriptsDir = 'C:\Users\jacky\AppData\Local\Programs\Python\Python312\Scripts'
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($userPath -notlike "*$pyDir*") {
    [Environment]::SetEnvironmentVariable('Path', "$userPath;$pyDir;$scriptsDir", 'User')
    Write-Host "Added Python to User PATH."
}

Write-Host "Creating Python virtual environment..."
& $pyExe -m venv .venv

$venvPy = Join-Path $targetDir '.venv\Scripts\python.exe'

Write-Host "Upgrading pip..."
& $venvPy -m pip install --upgrade pip

Write-Host "Installing requirements from BackendAI/requirements.txt..."
& $venvPy -m pip install -r BackendAI/requirements.txt matplotlib

Write-Host "Environment setup complete!"
