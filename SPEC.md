# Track My Starter - Project Specification

A web app for tracking the distribution and lineage of fermented starters (sourdough, kefir, kombucha, etc.)

## Core Concept

Users can register their fermented starters and track how they spread through sharing. Each starter receives a unique 3-word identifier and can be viewed/shared via URL. Descendants can be added to show the "family tree" of a starter's distribution.

## URL Scheme

- `/` - Home page with 3D globe and "Add My Starter" button
- `/explore` - Full-screen 2D map of all starters
- `/new` - Create a new root starter
- `/word1-word2-word3` or `/word1word2word3` - View a specific starter's page (hyphens optional)
- `/word1-word2-word3/new` - Add a descendant to an existing starter

Since all words are exactly 5 letters, URLs can be parsed without hyphens (15 chars = 3 words).

## Data Model

### Starter
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | Yes | MongoDB default |
| `words` | [String, String, String] | Yes | Auto-generated 3-word identifier |
| `name` | String | No | User-provided name |
| `type` | String | Yes | From predefined list or "other" |
| `type_other` | String | No | Custom type if "other" selected |
| `location` | GeoJSON Point | Yes | Few hundred feet precision |
| `parent_id` | ObjectId | No | Null for "root" starters |
| `created_at` | DateTime | Yes | Auto-set on creation |

### Starter Types (ordered)
1. Sourdough
2. Friendship Bread
3. Kefir (milk)
4. Kefir (water)
5. Kombucha
6. Ginger Bug
7. Jun
8. Other (freeform text input)

## Pages

### Home Page (`/`)
- Interactive 3D globe (react-globe.gl) showing all starters as points
- Rotating tagline cycling through starter types
- "Add My Starter" and "Explore Map" buttons
- Starter count stat

### Explore Page (`/explore`)
- Full-screen Leaflet map with all starters
- Type-colored markers with popup cards
- Starter count display
- Auto-fits bounds to show all starters

### Starter Page (`/word1-word2-word3`)
- Starter name displayed prominently (or word ID if unnamed)
- Starter type badge
- Leaflet map showing the starter and its family tree nodes with colored markers
- Family tree visualization (React Flow)
  - Show ancestors and descendants
  - Max 100 nodes displayed
  - Each node is clickable to navigate to that starter's page
  - Nodes color-coded by type
- "Add Descendant" and "Copy Link" buttons
- Parent link with name (if descended from another starter)

### New Starter Page (`/new` for root, `/word1-word2-word3/new` for descendant)
- Form fields:
  - Name (optional)
  - Type (dropdown with "other" option; inherited and locked for descendants)
  - Location (map picker, few hundred feet precision)
- **Permanent action confirmation modal** - clearly warns this cannot be undone
- On submit: generate 3-word ID, save to DB, redirect to new starter's page

## 3-Word Identifier System

- **Word list**: 5,719 curated 5-letter words from Knuth's Stanford GraphBase (`words.txt`)
- Auto-generated on starter creation (user cannot choose)
- All three words are randomly selected
- Format: `word1-word2-word3` (hyphens optional in URLs since all words are 5 letters)
- ~187 billion possible combinations (5719³)
- Check for collisions on generation (regenerate if exists)

## Tech Stack

### Backend
- **FastAPI** (Python 3.12)
- **MongoDB** with Motor (async driver)
- **Google Cloud Run** (hosting)
- **MongoDB Atlas** (database hosting)

### Frontend
- **React 19** with Vite 7
- **react-globe.gl** + Three.js (home page 3D globe)
- **Leaflet** + react-leaflet (2D maps on explore, starter, and new starter pages)
- **React Flow** (@xyflow/react) (family tree visualization)
- **React Router DOM v7** (routing)

## Visual Design

- **Minimal** aesthetic
- **Warm color palette** (creams, ambers, soft browns - evocative of bread/fermentation)
- Clean typography
- Mobile responsive

## MVP Checklist

### Backend
- [x] FastAPI project setup
- [x] MongoDB connection
- [x] Word list integration
- [x] 3-word ID generation with collision checking
- [x] Endpoints:
  - [x] `GET /api/starters` - list all starters (for map)
  - [x] `GET /api/starters/{words}` - get single starter by word ID
  - [x] `GET /api/starters/{words}/tree` - get family tree (ancestors + descendants, max 100)
  - [x] `POST /api/starters` - create new root starter
  - [x] `POST /api/starters/{words}/descendants` - create descendant

### Frontend
- [x] React project setup
- [x] Home page with 3D globe
- [x] Explore page with full-screen map
- [x] Starter detail page with map and family tree
- [x] Family tree visualization (clickable, color-coded nodes)
- [x] New starter form (root and descendant)
- [x] Permanent action confirmation modal
- [x] Copy URL to clipboard functionality
- [x] Responsive design

### Deployment
- [x] Dockerfiles for backend and frontend
- [x] Cloud Build configs (cloudbuild.yaml)
- [x] docker-compose.yml for local development
- [x] MongoDB Atlas setup
- [x] Google Cloud Run deployment
- [x] Custom domain

## Future Considerations (Not MVP)

- [ ] URL recovery via email verification
- [ ] Privacy controls (unlisted starters)
- [ ] Edit/delete functionality (with verification)
- [ ] Search/discovery features
- [ ] Photos of starters
- [ ] Notes/stories field
- [ ] Analytics (most prolific starters, geographic spread)
- [ ] Social sharing (generate share images)
- [ ] Additional word for identifiers if namespace fills up
- [ ] **QR Code Sheets**: Reserve blocks of word combinations to generate printable QR code sheets for distributing with physical starter samples (pre-assigned URLs people can register)
- [ ] Edge node fade-out on family tree boundaries to indicate more nodes exist

## API Design

### `GET /api/starters`
Returns array of all starters with minimal info for map display.
```json
[
  {
    "words": ["apple", "bread", "crisp"],
    "starter_type": "sourdough",
    "location": { "type": "Point", "coordinates": [-122.4, 37.8] }
  }
]
```

### `GET /api/starters/{words}`
Returns full starter details.
```json
{
  "words": ["apple", "bread", "crisp"],
  "name": "Old Faithful",
  "starter_type": "sourdough",
  "location": { "type": "Point", "coordinates": [-122.4, 37.8] },
  "parent_words": ["delta", "eager", "frost"],
  "created_at": "2024-01-15T10:30:00Z"
}
```

### `GET /api/starters/{words}/tree`
Returns family tree structure (max 100 nodes).
```json
{
  "nodes": [...],
  "edges": [{ "from": "word-word-word", "to": "word-word-word" }],
  "truncated": true
}
```

### `POST /api/starters`
Create new root starter.
```json
{
  "name": "My Starter",
  "starter_type": "sourdough",
  "lat": 37.8,
  "lng": -122.4
}
```

### `POST /api/starters/{words}/descendants`
Create descendant of existing starter. Same body as above.

---

## Notes

- Keep it lightweight - minimize costs on Cloud Run / MongoDB
- Location is stored precisely but can be displayed coarsely on public map
- The 3-word identifier is just an address, not a security mechanism - all starters are public
- No user accounts for MVP - simplicity is key
