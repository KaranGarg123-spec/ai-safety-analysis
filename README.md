# Construction Intelligence MVP: Safety Monitoring

construction-ai/
├── backend/
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── index.css
        ├── main.jsx
        └── App.jsx

## Run the backend (terminal 1)
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Docs and test UI: http://localhost:8000/docs

## Run the frontend (terminal 2)
cd frontend
npm install
npm start          # http://localhost:5173
