# QTS ERP - Employee Management System

Single repository / monorepo setup for QTS ERP with React Frontend, NestJS Backend, and PostgreSQL database.

## Monorepo Architecture

```
Emp-management/
├── frontend/             # React SPA (Vite + Tailwind CSS + Nginx Docker)
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
├── backend/              # NestJS Backend API (Prisma + PostgreSQL Docker)
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml    # Docker Compose multi-container setup
├── .env.example          # Environment variables template
├── .gitignore
└── README.md
```

---

## Windows Docker LAN Deployment

This deployment guide is intended for setting up the production application on a separate Windows Server / PC running Docker Desktop.

### Prerequisites on Windows Server
1. Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
2. Enable WSL 2 backend in Docker Desktop settings.
3. Git installed on Windows.

---

### Step-by-Step Deployment Instructions

#### 1. Clone the Repository
Open PowerShell or Command Prompt on the Windows server:
```powershell
git clone <YOUR_GIT_REPOSITORY_URL>
```

#### 2. Enter Project Directory
```powershell
cd Emp-management
```

#### 3. Create Server Environment File (`.env`)
Copy `.env.example` to `.env`:
```powershell
copy .env.example .env
```
Edit `.env` using Notepad or your text editor and set your secure passwords and secret keys:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=qts_erp
DATABASE_URL=postgresql://postgres:your_secure_password_here@postgres:5432/qts_erp?schema=public
JWT_ACCESS_SECRET=your_long_random_jwt_access_secret
JWT_REFRESH_SECRET=your_long_random_jwt_refresh_secret
```

#### 4. Build Docker Images
Build the production Docker images for both frontend (Nginx + React build) and backend (NestJS):
```powershell
docker compose build
```

#### 5. Start Container Stack
Run containers in detached mode:
```powershell
docker compose up -d
```

#### 6. Check Container Status
Verify all three containers (`frontend`, `backend`, `postgres`) are running and healthy:
```powershell
docker compose ps
```

#### 7. View Application Logs
Check container logs if needed:
```powershell
docker compose logs -f
```

#### 8. Run Prisma Database Migrations
Apply database schema migrations inside the running backend container:
```powershell
docker compose exec backend npx prisma migrate deploy
```

*(Optional)* Seed initial database data:
```powershell
docker compose exec backend npm run prisma:seed
```

#### 9. Find Windows Server LAN IP Address
To find the IP address of the Windows server on your local network:
```powershell
ipconfig
```
Look for `IPv4 Address` under your active network adapter (e.g., `192.168.1.100`).

#### 10. Access Application from Any LAN Computer
Open a web browser on any phone, laptop, or desktop on the local network and navigate to:
```
http://<WINDOWS_SERVER_IP>
```
Example: `http://192.168.1.100`

---

## Security & Architecture Notes
- **Nginx Reverse Proxy**: Nginx listens on port `80` and serves the React SPA statically. Requests to `/api/*` are internally proxied to `http://backend:3000`.
- **PostgreSQL Database**: PostgreSQL runs inside Docker on port `5432` and is accessible **only** within the internal Docker network by the `backend` service. It is NOT exposed directly to the LAN for security.
- **Port Mapping**: Only port `80` (HTTP) is mapped to the host machine.
