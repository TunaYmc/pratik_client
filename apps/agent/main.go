package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/mem"
)

// Socket.io standard message format might require specific packet types.
// For raw websockets (if WsAdapter is used in NestJS):
type Message struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data"`
}

type ActiveSession struct {
	Username    string `json:"username"`
	SessionName string `json:"sessionname"`
	ID          string `json:"id"`
	State       string `json:"state"`
	IdleTime    string `json:"idleTime"`
	LogonTime   string `json:"logonTime"`
	IsCurrent   bool   `json:"isCurrent"`
}

func main() {
	hostname, err := os.Hostname()
	if err != nil {
		log.Fatalf("Failed to get hostname: %v", err)
	}

	// Default to environment variable for testing, but fallback to hardcoded production URL
	serverURL := os.Getenv("PRATIK_BACKEND_URL")
	if serverURL == "" {
		serverURL = "wss://api.pratikbulut.com/agent"
	}
	
	u, err := url.Parse(serverURL)
	if err != nil {
		log.Fatal(err)
	}

	// Add hostname to headers
	headers := map[string][]string{
		"x-hostname": {hostname},
	}

	log.Printf("Connecting to %s as %s", u.String(), hostname)
	c, _, err := websocket.DefaultDialer.Dial(u.String(), headers)
	if err != nil {
		log.Fatal("dial:", err)
	}
	defer c.Close()

	// Start telemetry loop
	go func() {
		for {
			sendTelemetry(c)
			time.Sleep(5 * time.Second)
		}
	}()

	// Start sessions loop
	go func() {
		for {
			sendActiveSessions(c)
			time.Sleep(10 * time.Second)
		}
	}()

	// Keep alive / Listen for commands
	for {
		_, message, err := c.ReadMessage()
		if err != nil {
			log.Println("read err:", err)
			return
		}
		log.Printf("Received command: %s", message)
		// TODO: Handle commands (e.g. CreateUser)
	}
}

func sendTelemetry(c *websocket.Conn) {
	v, _ := mem.VirtualMemory()
	cStats, _ := cpu.Percent(0, false)

	cpuUsage := 0.0
	if len(cStats) > 0 {
		cpuUsage = cStats[0]
	}

	msg := Message{
		Event: "telemetry",
		Data: map[string]interface{}{
			"cpuUsage": cpuUsage,
			"ramUsage": v.UsedPercent,
		},
	}
	
	err := c.WriteJSON(msg)
	if err != nil {
		log.Println("write telemetry err:", err)
	}
}

func sendActiveSessions(c *websocket.Conn) {
	// Execute 'query user' command
	cmd := exec.Command("query", "user")
	output, err := cmd.Output()
	
	sessions := []ActiveSession{}

	if err == nil {
		lines := strings.Split(string(output), "\n")
		// Basic parser for Windows 'query user'
		for i := 1; i < len(lines); i++ {
			line := strings.TrimSpace(lines[i])
			if len(line) == 0 {
				continue
			}
			
			isCurrent := strings.HasPrefix(line, ">")
			if isCurrent {
				line = line[1:]
			}
			
			// Simple whitespace split (can be improved for exact column widths)
			fields := strings.Fields(line)
			if len(fields) >= 6 {
				sessions = append(sessions, ActiveSession{
					Username:    fields[0],
					SessionName: fields[1],
					ID:          fields[2],
					State:       fields[3],
					IdleTime:    fields[4],
					LogonTime:   strings.Join(fields[5:], " "),
					IsCurrent:   isCurrent,
				})
			}
		}
	}

	msg := Message{
		Event: "active_sessions",
		Data:  sessions,
	}

	c.WriteJSON(msg)
}
