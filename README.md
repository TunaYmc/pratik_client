# nanoData RDP Platform

A secure enterprise platform to assign, manage, and automatically launch Windows Remote Desktop (RDP) sessions from a modern web dashboard.

## Overview
- **Backend**: NestJS, Prisma, SQLite (easy to swap to PostgreSQL). Handles JWT Authentication, RBAC, RDP assignment, and powershell validations.
- **Frontend**: React + Vite + Tailwind CSS (Cursor.com inspired dark theme).
- **Helper Client**: Electron + TypeScript. Registers `nanodata://` URI handler, downloads short-lived `.rdp` configurations, and launches `mstsc.exe`.

## Security Features
- Passes no Windows passwords in the backend or frontend APIs.
- Generates 1-minute expiration short-lived JWTs to authenticate RDP file downloads.
- Employs strict RBAC (`admin` / `user`).
- Automatically clears state on unauthorized connections.
- Native Helper validation and automatic temporary RDP cleanup logic.

## Prerequisites
- Node.js 18+
- npm Workspaces
- Windows OS (for the end-user helper, specifically to launch `mstsc.exe`)

## Documentation Guides
- [Windows Server Backend Deployment Guide](docs/windows-server-deployment.md) - Instructions for pushing the NestJS Node API to production environments using PM2 or IIS on Windows Server.
- [End User GUI Access Guide](docs/end-user-guide.md) - Walkthrough for your end-users explaining how the dashboard operates and how to securely launch Remote Desktop natively from the browser using the nanoData Helper app.

## Quick Start (Development)

1. **Install dependencies from root**:
   ```bash
   npm install
   ```

2. **Initialize Database**:
   ```bash
   cd apps/backend
   npx prisma db push
   npx prisma generate
   ```

3. **Start the Frontend and Backend**:
   Run the concurrent helper at the root folder:
   ```bash
   npm run dev
   ```

4. **Start the Helper** (Requires Windows):
   ```bash
   cd apps/helper
   npm run build
   npm run start
   ```

## Usage Flow
1. Open `http://localhost:5173` (Frontend)
2. Use the initial admin user or create one by calling the `POST /auth/register` api manually via Postman to seed an Admin.
3. Login as Admin. Go to **Admin Panel** and Create new users.
4. Go to **Assign Remote Desktop** via the Admin Panel, pick the created user, input the `Windows Username`, `Target Host`, and a Label.
5. Login as the newly created standard User.
6. The User's dashboard will show the assigned instances.
7. Click **Connect**.
8. The browser will prompt to open the custom `nanodata://` URI.
9. The Electron helper will automatically download the generated RDP and launch it natively using `mstsc.exe` securely via Gateway `rdp.yamac.me`.
