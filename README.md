# Disaster Response Coordination Hub

This repository contains a coordination platform for disaster response. The system collects incident reports, manages relief and rescue centers, supports volunteer task assignment and verification, and offers routing for resource deployment via GraphHopper.

Key components
- Backend: FastAPI + SQLAlchemy (`backend/`)
- Frontend: React + Vite (`frontend/`)
- Coordinator server: Node helper (`server.js`)
- Routing: GraphHopper (`graphhopper/`)

Project report
- See the detailed project report: MP Final_report.pdf

Quick start
1. Clone the repository

```bash
git clone https://github.com/dapaja04/Disaster-Response-Coordination-Hub.git
cd Disaster-Response-Coordination-Hub
```

2. Prerequisites
- Python 3.9+ and pip (see `backend/requirements.txt`)
- Node.js (18+) and npm
- Java 11+ for GraphHopper (allocate sufficient heap for large OSM files)

3. Run services (development)
- Backend (from `backend/`):
   ```bash
   pip install -r requirements.txt
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
- Frontend (from `frontend/`):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
- Coordinator server (repo root):
   ```bash
   node server.js
   ```
- GraphHopper (from `graphhopper/`):
   ```bash
   java -Xmx8g -jar graphhopper-web-*.jar server config.yml
   ```

Additional notes

For detailed setup instructions, configuration options, and deployment guidelines, please refer to the individual component directories and the project report 'Report.pdf'.