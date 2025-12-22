# Disaster Response Coordination Hub

Professional, lightweight platform to coordinate disaster response: receive incident reports, manage rescue centers, assign and verify volunteer tasks, and visualize live data.

Key components
- Backend: FastAPI + SQLAlchemy (located in `backend/`)
- Frontend: React + Vite (located in `frontend/`)
- Coordinator server: Node helper service (`server.js`)
- Routing/graph service: GraphHopper (`graphhopper/`)

Quick start (recommended)

1) Clone the repository

```bash
git clone https://github.com/dapaja04/Disaster-Response-Coordination-Hub.git
cd Disaster-Response-Coordination-Hub
```

2) Prerequisites
- Python 3.9+ and `pip` (backend dependencies in `backend/requirements.txt`)
- Node.js (18+) and `npm`
- Java 11+ with sufficient heap (GraphHopper uses up to 8GB in this repo)
- Recommended on Windows: use WSL2 / Git Bash or run the included PowerShell helper

3) Running the full development environment

Open the workspace in VS Code and run the Tasks:

Running services individually
- Backend (inside `backend/`):
   ```bash
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
- Frontend (inside `frontend/`):
   ```bash
   npm install
   npm run dev
   ```
- Coordinator server (root):
   ```bash
   node server.js
   ```
- GraphHopper (inside `graphhopper/`):
   ```bash
   java -Xmx8g -jar graphhopper-web-11.0.jar server config.yml
   ```
