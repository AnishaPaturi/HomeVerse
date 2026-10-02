# HomeVerse Backend

Unified FastAPI backend service powering HomeVerse — the AI Spatial Architecture & Interior Budget OS.

## 🚀 Key Responsibilities
- **Authentication & User Management**: Bcrypt-hashed password auth, JWT tokens, and zero-trace cascading account purging (`AccountPurgeService`).
- **Spatial Architecture API**: Multi-floor hierarchies, room coordinates, 3D scene graphs, and CAD models.
- **Budget-First Engine**: Indian currency estimations (₹ Lakhs & Crores), trade package allocations (*Civil, Millwork, Lighting, Furniture, Painting*), and What-If cost delta simulation.
- **Dynamic Notifications**: Live project alerts, milestone updates, procurement tracking, and AI design recommendations.
- **AI Agent Swarm**: Integration with Google Gemini for room computer vision, layout planning, and multimodal design generation.

## 🛠️ Quick Start

```bash
# 1. Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1    # On Windows PowerShell
source venv/bin/activate       # On macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start development server
uvicorn app.main:app --reload --port 8080
```

Interactive API documentation available at:
- Swagger UI: [http://localhost:8080/docs](http://localhost:8080/docs)
- ReDoc: [http://localhost:8080/redoc](http://localhost:8080/redoc)

## 🧪 Testing

```bash
# Run pytest test suite
$env:PYTHONPATH = "."
pytest tests/api/test_account_deletion_and_recreation.py -v
pytest tests/api/test_projects.py -v
pytest tests/core/test_v2_flow.py -v
```
