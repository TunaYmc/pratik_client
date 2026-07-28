# End User Guide: Accessing the nanoData RDP Platform

Welcome to the nanoData RDP Platform. This guide explains how to access your assigned Remote Desktop instances directly from your web browser.

## Step 1: Install the Helper Application

Because browsers block websites from launching local executables (like the Windows Remote Desktop Connection app) natively, you must run the **nanoData Helper** application once on your computer. 

This tiny background app securely catches your connection requests from the web dashboard and safely launches `mstsc.exe` for you.

1. Download the `nanoData Helper Setup.exe` (provided by your administrator).
2. Run the installer. 
3. The helper will automatically register the secure `nanodata://` browser protocol on your Windows machine and run in the background.

## Step 2: Log In to the Dashboard

1. Open your modern web browser (Chrome, Edge, Firefox).
2. Navigate to the platform URL provided by your administrator (e.g., `https://rdp-portal.yourcompany.com`).
3. Enter your **Email** and **Password**. 
4. Click **Sign in**.

## Step 3: Connect to a Desktop

Once logged in, you will see your **Assigned Desktops** dashboard. This shows all the computers and servers you have permission to access.

1. Locate the desktop you want to access on the grid. It will list the Server Hostname and your assigned Windows Username.
2. Click the blue **Connect** button.
3. **Browser Prompt**: Your browser will show a popup asking: *"Always open these types of links in the associated app?"* or *"Open nanoData Helper?"*
   - Check the box to "Always allow" so you aren't prompted every time.
   - Click **Open**.

## What happens next?

1. The helper app instantly downloads a hyper-secure, one-time use connection token from the platform.
2. It generates a temporary Remote Desktop file configured specifically to route securely through the corporate Gateway (`rdp.yamac.me`).
3. Your standard Windows Remote Desktop client will pop open automatically.
4. **Enter your Windows Password** when prompted by the Remote Desktop application to complete the login process to the destination server.

## Troubleshooting

- **"I clicked Connect but nothing happened"**: Make sure you have installed the **nanoData Helper** from Step 1. If it's installed, ensure the helper is running by checking your System Tray (bottom right of your screen).
- **"I don't have permission to log in to the Remote Desktop endpoint"**: The administrator must ensure that your generated Windows username is added to the `Remote Desktop Users` group on the target server. Please contact IT support.
