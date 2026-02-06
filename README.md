# Track My Starter

A (mostly) vibe coded web app for tracking the distribution and lineage of fermented starters (sourdough, kefir, kombucha, etc.) around the world.

## Features

- **3-Word Identifiers**: Each starter gets a unique, memorable ID like `apple-bread-crisp`
- **Family Trees**: Track how starters spread through sharing with visual lineage graphs
- **Global Map**: See all registered starters on an interactive globe
- **Lineage Proximity**: Descendants share the first word with their parent, making relationships intuitable
- **Mobile Responsive**: Works on all devices

## Project Structure

```
track-my-starter/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── config.py         # Settings and environment variables
│   │   ├── database.py       # MongoDB connection
│   │   ├── models.py         # Pydantic models
│   │   ├── routes/
│   │   │   └── starters.py   # Starter API endpoints
│   │   └── services/
│   │       └── words.py      # Word ID generation
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── FamilyTree.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Starter.jsx
│   │   │   └── NewStarter.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── nginx.conf
│   └── Dockerfile
├── words.txt                  # 5,719 curated 5-letter words
├── SPEC.md                    # Full project specification
├── DEPLOY.md                  # Google Cloud deployment guide
└── README.md
```

## Tech Stack

- **Backend**: FastAPI (Python 3.12)
- **Frontend**: React 19, React Flow, Leaflet, react-globe.gl
- **Database**: MongoDB
- **Hosting**: Google Cloud Run

## Development

### Prerequisites

- Python 3.12+
- Node.js 20+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variable
export MONGODB_URI="mongodb://localhost:27017/trackmystarter"

# Run development server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/starters` | List all starters (for map) |
| `GET` | `/api/starters/{words}` | Get starter by word ID |
| `GET` | `/api/starters/{words}/tree` | Get family tree (max 100 nodes) |
| `POST` | `/api/starters` | Create new root starter |
| `POST` | `/api/starters/{words}/descendants` | Create descendant |

## Deployment

See [DEPLOY.md](./DEPLOY.md) for detailed Google Cloud deployment instructions.

## Starter Types

- Sourdough
- Friendship Bread
- Kefir (Milk)
- Kefir (Water)
- Kombucha
- Ginger Bug
- Jun
- Other (custom)

## License

MIT
