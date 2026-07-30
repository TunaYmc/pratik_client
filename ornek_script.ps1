# --- PRATİKBULUT YENİ MÜŞTERİ (TENANT) OTOMASYONU ---

# Gerekli Modülleri Çağır
Import-Module ActiveDirectory
Import-Module FileServerResourceManager

# ==========================================
# 1. DEĞİŞKENLER (Müşteriye Göre Sadece Burayı Değiştirin)
# ==========================================
$SirketAdi = "Sirket_X"
$KullaniciSayisi = 5
$KotaBoyutu = "4TB"
$VarsayilanSifre = "PratikBulut@2026" # Kullanıcıların ilk şifresi

# --- YENİ EKLENEN HOME DRIVE (ORTAK DİSK) DEĞİŞKENLERİ ---
$OrtakDiskHarfi = "Z:" 
$SunucuPaylasimYolu = "\\PB-WIN-MGMT\Storage$" # Broker sunucunuzun gizli paylaşım yolu

# Sistem Sabitleri (Kendi yapınıza göre bir kez ayarlayın)
$DomainAdi = "pratikbulut.local"
$AnaOU = "OU=sirketler,DC=pratikbulut,DC=local" 
$AnaKlasorYolu = "Z:\Storage"
$YeniKlasorYolu = "$AnaKlasorYolu\$SirketAdi"
$GrupAdi = "$SirketAdi"

Write-Host ">>> $SirketAdi için kurulum başlatılıyor..." -ForegroundColor Cyan

# ==========================================
# 2. ACTIVE DIRECTORY İŞLEMLERİ
# ==========================================
Write-Host "AD Organizasyon Birimi (OU) ve Grup oluşturuluyor..." -ForegroundColor Yellow

# Şirket için OU oluştur
$YeniOU = New-ADOrganizationalUnit -Name $SirketAdi -Path $AnaOU -PassThru

# Şirket Güvenlik Grubunu oluştur
$YeniGrup = New-ADGroup -Name $GrupAdi -GroupCategory Security -GroupScope Global -Path $YeniOU.DistinguishedName -PassThru

Write-Host "$KullaniciSayisi adet kullanıcı hesabı oluşturuluyor ve O: diski bağlanıyor..." -ForegroundColor Yellow
$SifreGizli = ConvertTo-SecureString $VarsayilanSifre -AsPlainText -Force

for ($i = 1; $i -le $KullaniciSayisi; $i++) {
    $KullaniciLogon = "$($SirketAdi.ToLower()).kullanici$i"
    
    # Kullanıcıyı Yarat ve Aynı Anda Diski Bağla (HomeDrive Parametreleri Eklendi)
    New-ADUser -Name $KullaniciLogon `
               -SamAccountName $KullaniciLogon `
               -UserPrincipalName "$KullaniciLogon@$DomainAdi" `
               -AccountPassword $SifreGizli `
               -Enabled $true `
               -PasswordNeverExpires $true `
               -Path $YeniOU.DistinguishedName `
               -HomeDrive $OrtakDiskHarfi `
               -HomeDirectory "$SunucuPaylasimYolu\$SirketAdi"
               
    # Kullanıcıyı Şirket Grubuna Ekle
    Add-ADGroupMember -Identity $YeniGrup -Members $KullaniciLogon
}

# ==========================================
# 3. KLASÖR VE NTFS İZİNLERİ (İzolasyon)
# ==========================================
Write-Host "Ortak alan klasörü oluşturuluyor ve mühürleniyor..." -ForegroundColor Yellow

# Klasörü aç
New-Item -Path $YeniKlasorYolu -ItemType Directory -Force | Out-Null

# NTFS İzinlerini Ayarla (icacls)
icacls $YeniKlasorYolu /inheritance:r /grant:r "SYSTEM:(OI)(CI)F" /grant:r "Administrators:(OI)(CI)F" /grant:r "pratikbulut\$GrupAdi:(OI)(CI)M" /T /C /Q | Out-Null

# ==========================================
# 4. FSRM KOTA YÖNETİMİ
# ==========================================
Write-Host "FSRM üzerinden $KotaBoyutu kota tanımlanıyor..." -ForegroundColor Yellow

# Kotayı Güncelle
Set-FsrmQuota -Path $YeniKlasorYolu -Size $KotaBoyutu

Write-Host ">>> İŞLEM TAMAMLANDI! $SirketAdi sisteme başarıyla eklendi." -ForegroundColor Green
