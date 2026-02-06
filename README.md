# Track My Starter

A (mostly) vibe coded web app for tracking the distribution and lineage of fermented starters (sourdough, kefir, kombucha, etc.) around the world.

## Features

- **3-Word Identifiers**: Each starter gets a unique, memorable ID like `apple-bread-crisp`
- **Family Trees**: Track how starters spread through sharing with interactive lineage graphs
- **Global Map**: See all registered starters on an interactive 3D globe
- **Explore View**: Browse all starters on a full-screen 2D map with type-colored markers
- **Permanent Action Confirmation**: Clear warnings before creating starters (cannot be undone)
- **Mobile Responsive**: Works on all devices

## Tech Stack

- **Backend**: FastAPI (Python 3.12), MongoDB
- **Frontend**: React 19, Vite 7, React Router DOM v7
- **Visualization**: react-globe.gl (home), Leaflet + react-leaflet (maps), React Flow (family trees)
- **Hosting**: Google Cloud Run, MongoDB Atlas

## Project Structure

```
track-my-starter/
├── backend/           # FastAPI app, Dockerfile, cloudbuild.yaml
├── frontend/          # React app, Dockerfile, cloudbuild.yaml
├── words.txt          # 5-letter words for identifiers
├── docker-compose.yml # Local development
├── SPEC.md            # Project specification
└── DEPLOY.md          # Google Cloud deployment guide
```

## Development

### With Docker Compose

The quickest way to run everything locally:

```bash
docker compose up
```

This starts MongoDB, the backend (port 8000), and the frontend (port 3000).

### Without Docker

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

export MONGODB_URI="mongodb://localhost:27017/trackmystarter"
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` and proxies `/api` requests to the backend.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/starters` | List all starters (for map) |
| `GET` | `/api/starters/{words}` | Get starter by word ID |
| `GET` | `/api/starters/{words}/tree` | Get family tree (max 100 nodes) |
| `POST` | `/api/starters` | Create new root starter |
| `POST` | `/api/starters/{words}/descendants` | Create descendant |

## Starter Types

- Sourdough
- Friendship Bread
- Kefir (Milk)
- Kefir (Water)
- Kombucha
- Ginger Bug
- Jun
- Other (custom)

## Deployment

See [DEPLOY.md](./DEPLOY.md) for Google Cloud Run deployment instructions.

## License

MIT
