$ErrorActionPreference = "Stop"

$sourceDir = "C:\nano-cli"
$backupDir = "C:\nano-cli\backups"

# Create backups folder if it doesn't exist
if (-not (Test-Path -Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$tempDir = Join-Path $backupDir "temp_$timestamp"
$backupFile = Join-Path $backupDir "nanocli_backup_$timestamp.zip"

Write-Host "Yedekleme baslatiliyor... Lütfen bekleyin!" -ForegroundColor Cyan

# 1. Aşama: Robocopy ile dosyaları kopyala (Kilitli dev.db gibi dosyaları da güvenle alır)
# node_modules ve diğer gereksiz ağır dosyalar dışarıda bırakılır
Write-Host "Dosyalar hazirlaniyor..."
robocopy $sourceDir $tempDir /MIR /XD node_modules .git dist .vite backups release /NC /NS /NP /NJH /NJS

# 2. Aşama: Temp dizini ziple
Write-Host "Dosyalar sıkıstırılıyor..."
Compress-Archive -Path "$tempDir\*" -DestinationPath $backupFile -CompressionLevel Optimal -Force

# 3. Aşama: Temp temizliği
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Yedekleme tamamlandi! Dosya: $backupFile" -ForegroundColor Green
Write-Host "Bir sorun cikarsa bu zipli dosyayi eski ana dizininize tamamen cikartarak sistemi kurtarabilirsiniz." -ForegroundColor Yellow
