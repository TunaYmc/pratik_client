# Windows Server Deployment Guide

This guide describes how to deploy the nanoData backend API onto a Windows Server environment for production use. Since the application natively interacts with PowerShell to verify Remote Desktop User groups, hosting it on a Windows Server (specifically the one domain-joined or managing the generic RDP targets) is the recommended path.

## Prerequisites
1. **Windows Server 2016 / 2019 / 2022**
2. **Node.js**: Install version 18.x or 20.x (LTS) from [nodejs.org](https://nodejs.org).
3. **PM2**: A production process manager for Node.js.
   ```ps1
   npm install -g pm2
   npm install -g pm2-windows-service
   ```
4. **Git** (optional, for cloning the repository directly onto the server).

## 1. Prepare the Application Files

Copy the `apps/backend` folder and the root `package.json` to your Windows Server, or clone the repository directly.

1. Open PowerShell as Administrator.
2. Navigate to the project root directory:
   ```ps1
   cd C:\path\to\nano-cli
   ```
3. Install production dependencies via workspaces:
   ```ps1
   npm install --production
   ```
4. Build the NestJS backend:
   ```ps1
   cd apps/backend
   npm run build
   ```

## 2. Configure the Environment

In the `apps/backend` directory, create a `.env` file to hold your production configuration:

```env
# Define a highly secure, random string for JWT hashing
RDP_JWT_SECRET=YOUR_SECURE_RANDOM_LONG_STRING_HERE

# Database URL. If using SQLite, place the file in a secure, backed-up directory.
# Example: file:C:/Database/nanodata.db
DATABASE_URL=file:./prod.db

# If using PostgreSQL instead of SQLite, update the prisma schema provider and set:
# DATABASE_URL=postgresql://user:password@localhost:5432/nanodata
```

## 3. Initialize the Database

Run Prisma to initialize the schema. From the `apps/backend` directory:
```ps1
npx prisma db push
npx prisma generate
```

## 4. Run the Backend Service using PM2

PM2 will keep the backend running autonomously, and automatically restart it if it crashes.

1. Start the service:
   ```ps1
   pm2 start dist/main.js --name "nanodata-backend"
   ```
2. Save the PM2 list so it remembers the app on reboot:
   ```ps1
   pm2 save
   ```
3. Install the PM2 service to start on Windows boot:
   ```ps1
   pm2-service-install -n PM2
   ```
   *(During the prompt, select "Y" to use your saved PM2 list).*

## 5. Configure Windows Firewall

The NestJS backend runs on port `3000` by default. You need to allow inbound traffic so the frontend application can access the API.

1. Open **Windows Defender Firewall with Advanced Security**.
2. Go to **Inbound Rules** -> **New Rule...**
3. Select **Port** -> **TCP** -> Specific local ports: **3000**.
4. Allow the connection -> Check Domain/Private/Public as needed.
5. Name it "nanoData API Port 3000" and save.

## 6. (Optional) Run Behind IIS as a Reverse Proxy

For a fully production-ready environment, it's highly recommended to expose the API through IIS with an SSL certificate mapping `api.yourdomain.com` to `localhost:3000`.

1. Install the **Application Request Routing (ARR)** and **URL Rewrite** modules in IIS.
2. In IIS Manager, create a new Website binded to your domain on Port 443 with your SSL cert.
3. Open **URL Rewrite** for the site, and Add a new **Reverse Proxy** rule.
4. Enter `localhost:3000` as the inbound server.
5. This enables your frontend to securely communicate with the backend over HTTPS.
