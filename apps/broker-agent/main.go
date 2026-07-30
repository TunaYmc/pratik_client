package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/gorilla/websocket"
)

type Message struct {
	Event string          `json:"event"`
	Data  json.RawMessage `json:"data"`
}

type OnboardData struct {
	CompanyId       int      `json:"companyId"`
	CompanyName     string   `json:"companyName"`
	TargetHost      string   `json:"targetHost"`
	UserCount       int      `json:"userCount"`
	Users           []string `json:"users"`
	QuotaTB         float64  `json:"quotaTB"`
	DefaultPassword string   `json:"defaultPassword"`
}

func main() {
	serverURL := os.Getenv("PRATIK_BACKEND_URL")
	if serverURL == "" {
		serverURL = "wss://api.pratikbulut.com/broker"
	}

	u, err := url.Parse(serverURL)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("Broker Agent connecting to %s", u.String())

	for {
		c, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
		if err != nil {
			log.Printf("Dial error: %v, retrying in 5 seconds...", err)
			time.Sleep(5 * time.Second)
			continue
		}

		log.Println("Connected to Broker Gateway.")

		for {
			_, message, err := c.ReadMessage()
			if err != nil {
				log.Println("read err:", err)
				break
			}

			var msg Message
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("Failed to unmarshal message: %v", err)
				continue
			}

			if msg.Event == "onboard_company" {
				var data OnboardData
				if err := json.Unmarshal(msg.Data, &data); err != nil {
					log.Printf("Failed to unmarshal onboard data: %v", err)
					continue
				}

				handleOnboardCompany(c, data)
			}
		}
		c.Close()
		log.Println("Connection lost, reconnecting in 5 seconds...")
		time.Sleep(5 * time.Second)
	}
}

func handleOnboardCompany(c *websocket.Conn, data OnboardData) {
	log.Printf("Processing onboarding for company: %s", data.CompanyName)

	scriptContent := generatePowershellScript(data)
	scriptPath := filepath.Join(os.TempDir(), fmt.Sprintf("onboard_%s.ps1", data.CompanyName))

	log.Printf("Generated Script for %s:\n%s", data.CompanyName, scriptContent)

	if err := ioutil.WriteFile(scriptPath, []byte(scriptContent), 0644); err != nil {
		sendResult(c, data.CompanyId, false, err.Error())
		return
	}
	defer os.Remove(scriptPath)

	cmd := exec.Command("powershell", "-ExecutionPolicy", "Bypass", "-File", scriptPath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		sendResult(c, data.CompanyId, false, fmt.Sprintf("PS Error: %v\nOutput: %s", err, string(output)))
		return
	}

	log.Printf("Successfully processed %s. Output: %s", data.CompanyName, string(output))
	sendResult(c, data.CompanyId, true, "")
}

func sendResult(c *websocket.Conn, companyId int, success bool, errStr string) {
	msg := Message{
		Event: "onboard_result",
		Data: func() json.RawMessage {
			b, _ := json.Marshal(map[string]interface{}{
				"companyId": companyId,
				"success":   success,
				"error":     errStr,
			})
			return b
		}(),
	}
	c.WriteJSON(msg)
}

func generatePowershellScript(data OnboardData) string {
	usersArray := ""
	for _, u := range data.Users {
		usersArray += fmt.Sprintf("\"%s\",", u)
	}
	if len(usersArray) > 0 {
		usersArray = usersArray[:len(usersArray)-1] // remove trailing comma
	}

	return fmt.Sprintf(`
# --- PRATİKBULUT YENİ MÜŞTERİ (TENANT) OTOMASYONU ---
Import-Module ActiveDirectory
Import-Module FileServerResourceManager

$SirketAdi = "%s"
$KullaniciSayisi = %d
$KotaBoyutu = %vTB
$VarsayilanSifre = "%s"

$OrtakDiskHarfi = "Z:" 
$SunucuPaylasimYolu = "\\PB-WIN-MGMT\Storage$"

$DomainAdi = "pratikbulut.local"
$AnaOU = "OU=sirketler,DC=pratikbulut,DC=local" 
$AnaKlasorYolu = "Z:\Storage"
$YeniKlasorYolu = "$AnaKlasorYolu\$SirketAdi"
$GrupAdi = "$SirketAdi"

Write-Host ">>> $SirketAdi için kurulum başlatılıyor..." -ForegroundColor Cyan

$YeniOU = New-ADOrganizationalUnit -Name $SirketAdi -Path $AnaOU -PassThru
$YeniGrup = New-ADGroup -Name $GrupAdi -GroupCategory Security -GroupScope Global -Path $YeniOU.DistinguishedName -PassThru

$SifreGizli = ConvertTo-SecureString $VarsayilanSifre -AsPlainText -Force
$UsersList = @(%s)

foreach ($User in $UsersList) {
    New-ADUser -Name $User -SamAccountName $User -UserPrincipalName "$User@$DomainAdi" -AccountPassword $SifreGizli -Enabled $true -PasswordNeverExpires $true -Path $YeniOU.DistinguishedName -HomeDrive $OrtakDiskHarfi -HomeDirectory "$SunucuPaylasimYolu\$SirketAdi"
               
    Add-ADGroupMember -Identity $YeniGrup -Members $User
}

New-Item -Path $YeniKlasorYolu -ItemType Directory -Force | Out-Null
icacls $YeniKlasorYolu /inheritance:r /grant:r "SYSTEM:(OI)(CI)F" /grant:r "Administrators:(OI)(CI)F" /grant:r "pratikbulut\${GrupAdi}:(OI)(CI)M" /T /C /Q | Out-Null

Set-FsrmQuota -Path $YeniKlasorYolu -Size $KotaBoyutu

Write-Host ">>> İŞLEM TAMAMLANDI! $SirketAdi sisteme başarıyla eklendi." -ForegroundColor Green
`, data.CompanyName, data.UserCount, data.QuotaTB, data.DefaultPassword, usersArray)
}
