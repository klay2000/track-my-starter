# Track My Starter - Project Specification

A web app for tracking the distribution and lineage of fermented starters (sourdough, kefir, kombucha, etc.)

## Core Concept

Users can register their fermented starters and track how they spread through sharing. Each starter receives a unique 3-word identifier and can be viewed/shared via URL. Descendants can be added to show the "family tree" of a starter's distribution.

## URL Scheme

- `/` - Home page with global map and "Add My Starter" button
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
- Global map showing all public starters as pins
- "Add My Starter" button (links to `/new`)
- Minimal branding/tagline

### Starter Page (`/word1-word2-word3`)
- Starter name displayed prominently (or type if unnamed)
- Starter type badge
- Small globe showing starter's location pin
  - Optionally show origin starter location if this is a descendant
- Family tree visualization
  - Show ancestors and descendants
  - Max 100 nodes displayed
  - Edge nodes (at boundary) should fade out to indicate more exist
  - Each node is clickable to navigate to that starter's page
- "Add Descendant" button/link

### New Starter Page (`/new` for root, `/word1-word2-word3/new` for descendant)
- Form fields:
  - Name (optional)
  - Type (dropdown with "other" option)
  - Location (map picker, few hundred feet precision)
- **Permanent action warning** - clearly inform user this cannot be undone
- On submit: generate 3-word ID, save to DB, redirect to new starter's page
- Display the generated URL prominently after creation with copy button

## 3-Word Identifier System

- **Word list**: 5,719 curated 5-letter words from Knuth's Stanford GraphBase (`words.txt`)
- Auto-generated on starter creation (user cannot choose)
- Format: `word1-word2-word3` (hyphens optional in URLs since all words are 5 letters)
- ~187 billion possible combinations (5719³)
- Check for collisions on generation (regenerate if exists)

### Descendant Naming (Lineage Proximity)
Descendants inherit the **first word** from their parent, making family relationships intuitable:
- Root starter: `apple-bread-crisp`
- Child: `apple-delta-frost` (inherits "apple")
- Grandchild: `apple-games-hover` (inherits "apple" from parent, which inherited from root)

This means all starters in a lineage share the same first word. Still allows ~32 million descendants per root (5719²).

## Tech Stack

### Backend
- **FastAPI** (Python)
- **MongoDB** (database)
- **Google Cloud Run** (hosting)

### Frontend
- **React**
- Globe/map library (TBD - options: react-globe.gl, globe.gl, react-simple-maps, Leaflet)
- Graph visualization (TBD - options: react-force-graph, d3-hierarchy, vis.js)

## Visual Design

- **Minimal** aesthetic
- **Warm color palette** (creams, ambers, soft browns - evocative of bread/fermentation)
- Clean typography
- Mobile responsive

## MVP Checklist

### Backend
- [ ] FastAPI project setup
- [ ] MongoDB connection
- [ ] Word list integration (find/download list)
- [ ] 3-word ID generation with collision checking
- [ ] Endpoints:
  - [ ] `GET /api/starters` - list all starters (for map)
  - [ ] `GET /api/starters/{words}` - get single starter by word ID
  - [ ] `GET /api/starters/{words}/tree` - get family tree (ancestors + descendants, max 100)
  - [ ] `POST /api/starters` - create new root starter
  - [ ] `POST /api/starters/{words}/descendants` - create descendant

### Frontend
- [ ] React project setup
- [ ] Home page with global map
- [ ] Starter detail page
- [ ] Globe component showing location
- [ ] Family tree visualization (clickable nodes)
- [ ] New starter form (root)
- [ ] New descendant form
- [ ] Permanent action confirmation modal
- [ ] Copy URL to clipboard functionality
- [ ] Responsive design

### Deployment
- [ ] Dockerfile for backend
- [ ] Frontend build & static hosting (Cloud Run or separate)
- [ ] MongoDB Atlas setup (free tier)
- [ ] Environment variables / secrets management
- [ ] Domain setup (trackmystarter.com?)

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

## API Design

### `GET /api/starters`
Returns array of all starters with minimal info for map display.
```json
[
  {
    "words": ["apple", "bread", "crisp"],
    "type": "sourdough",
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
  "type": "sourdough",
  "location": { "type": "Point", "coordinates": [-122.4, 37.8] },
  "parent_words": ["delta", "eager", "frost"],
  "created_at": "2024-01-15T10:30:00Z"
}
```

### `GET /api/starters/{words}/tree`
Returns family tree structure (max 100 nodes).
```json
{
  "root": { "words": [...], "name": "...", "type": "..." },
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
  "type": "sourdough",
  "location": { "lat": 37.8, "lng": -122.4 }
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
