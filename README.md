# Track My Starter

A web app for tracking the distribution and lineage of fermented starters (sourdough, kefir, kombucha, etc.)

## Project Structure

```
track-my-starter/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── config.py         # Settings and environment variables
│   │   ├── database.py       # MongoDB connection
│   │   ├── models.py         # Pydantic models
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   └── starters.py   # Starter API endpoints
│   │   └── services/
│   │       ├── __init__.py
│   │       └── words.py      # Word ID generation
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile
├── words.txt                  # 5,719 curated 5-letter words
├── SPEC.md                    # Full project specification
└── README.md
```

## Tech Stack

- **Backend**: FastAPI (Python), MongoDB
- **Frontend**: React
- **Hosting**: Google Cloud Run

## Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

```
MONGODB_URI=mongodb+srv://...
```
