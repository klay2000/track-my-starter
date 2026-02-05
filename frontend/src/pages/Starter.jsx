import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import FamilyTree from '../components/FamilyTree'
import 'leaflet/dist/leaflet.css'
import './Starter.css'

// Distinct color palette for nodes
const NODE_COLORS = [
  { fill: '#f59e0b', stroke: '#d97706' }, // amber
  { fill: '#10b981', stroke: '#059669' }, // emerald
  { fill: '#8b5cf6', stroke: '#7c3aed' }, // violet
  { fill: '#ec4899', stroke: '#db2777' }, // pink
  { fill: '#06b6d4', stroke: '#0891b2' }, // cyan
  { fill: '#f97316', stroke: '#ea580c' }, // orange
  { fill: '#84cc16', stroke: '#65a30d' }, // lime
  { fill: '#6366f1', stroke: '#4f46e5' }, // indigo
  { fill: '#14b8a6', stroke: '#0d9488' }, // teal
  { fill: '#ef4444', stroke: '#dc2626' }, // red
  { fill: '#a855f7', stroke: '#9333ea' }, // purple
  { fill: '#eab308', stroke: '#ca8a04' }, // yellow
]

// Create marker icon with custom colors
function createMarkerIcon(fillColor, strokeColor, isCurrent = false) {
  const size = isCurrent ? 36 : 28
  const r = isCurrent ? 14 : 10
  const innerR = isCurrent ? 6 : 4
  const center = size / 2
  return new L.Icon({
    iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <circle cx="${center}" cy="${center}" r="${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${isCurrent ? 3 : 2}"/>
        <circle cx="${center}" cy="${center}" r="${innerR}" fill="${strokeColor}"/>
      </svg>
    `),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const TYPE_LABELS = {
  sourdough: 'Sourdough',
  friendship_bread: 'Friendship Bread',
  kefir_milk: 'Kefir (Milk)',
  kefir_water: 'Kefir (Water)',
  kombucha: 'Kombucha',
  ginger_bug: 'Ginger Bug',
  jun: 'Jun',
  other: 'Other',
}

function FitBounds({ nodes, currentWords }) {
  const map = useMap()
  useEffect(() => {
    if (nodes.length === 0) return

    if (nodes.length === 1) {
      const node = nodes[0]
      map.setView([node.location.coordinates[1], node.location.coordinates[0]], 10)
    } else {
      const bounds = L.latLngBounds(
        nodes.map((n) => [n.location.coordinates[1], n.location.coordinates[0]])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, nodes, currentWords])
  return null
}

export default function Starter({ apiUrl }) {
  const { words } = useParams()
  const navigate = useNavigate()
  const [starter, setStarter] = useState(null)
  const [tree, setTree] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  // Generate unique colors for each node
  const nodeColors = useMemo(() => {
    if (!tree?.nodes) return {}

    const colors = {}
    tree.nodes.forEach((node, index) => {
      const nodeWords = node.words.join('-')
      const color = NODE_COLORS[index % NODE_COLORS.length]
      colors[nodeWords] = color
    })
    return colors
  }, [tree])

  useEffect(() => {
    // Only show loading spinner on initial load, not when switching starters
    if (!starter) {
      setLoading(true)
    }
    setError(null)

    Promise.all([
      fetch(`${apiUrl}/api/starters/${words}`).then((res) => {
        if (!res.ok) throw new Error('Starter not found')
        return res.json()
      }),
      fetch(`${apiUrl}/api/starters/${words}/tree`).then((res) => res.json()),
    ])
      .then(([starterData, treeData]) => {
        setStarter(starterData)
        setTree(treeData)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [apiUrl, words])

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="starter-page">
        <div className="starter-loading">
          <div className="loading-spinner" />
          <p>Loading starter...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="starter-page">
        <div className="starter-error">
          <h1>Starter not found</h1>
          <p>The starter you're looking for doesn't exist.</p>
          <Link to="/" className="btn">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const hasName = !!starter.name
  const displayName = starter.name || starter.words.join('-')
  const typeLabel = starter.starter_type === 'other' && starter.type_other
    ? starter.type_other
    : TYPE_LABELS[starter.starter_type]

  const position = [
    starter.location.coordinates[1],
    starter.location.coordinates[0]
  ]

  return (
    <div className="starter-page">
      <nav className="starter-nav">
        <Link to="/" className="nav-back">
          ← Back to Map
        </Link>
      </nav>

      <header className="starter-header">
        <span className="badge">{typeLabel}</span>
        <h1>{displayName}</h1>
        {hasName && <p className="starter-words">{starter.words.join('-')}</p>}
        <div className="starter-actions">
          <button onClick={copyUrl} className="btn btn-secondary">
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <Link to={`/${words}/new`} className="btn">
            Add Descendant
          </Link>
        </div>
      </header>

      <div className="starter-content">
        <section className="starter-section">
          <h2>Family Locations</h2>
          <div className="starter-map">
            <MapContainer
              center={position}
              zoom={10}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {tree && <FitBounds nodes={tree.nodes} currentWords={words} />}
              {tree?.nodes.map((node) => {
                const nodeWords = node.words.join('-')
                const pos = [node.location.coordinates[1], node.location.coordinates[0]]
                const isCurrent = node.is_target
                const color = nodeColors[nodeWords] || NODE_COLORS[0]
                const icon = createMarkerIcon(color.fill, color.stroke, isCurrent)
                const hasName = !!node.name
                const displayName = node.name || nodeWords

                return (
                  <Marker key={nodeWords} position={pos} icon={icon}>
                    <Popup>
                      <div className="map-popup">
                        <span className="popup-label" style={{ background: color.stroke }}>
                          {isCurrent ? 'Current' : TYPE_LABELS[node.starter_type] || 'Starter'}
                        </span>
                        <p className="popup-name">{displayName}</p>
                        {hasName && <p className="popup-words">{nodeWords}</p>}
                        {!isCurrent && (
                          <button
                            className="popup-link"
                            onClick={() => navigate(`/${nodeWords}`)}
                          >
                            View Details →
                          </button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>
        </section>

        <section className="starter-section starter-section-tree">
          <h2>Family Tree</h2>
          <div className="tree-container">
            {tree && <FamilyTree tree={tree} currentWords={words} nodeColors={nodeColors} />}
          </div>
          {tree?.truncated && (
            <p className="text-muted" style={{ textAlign: 'center', marginTop: 12 }}>
              Showing first 100 nodes
            </p>
          )}
        </section>
      </div>

      <footer className="starter-footer">
        <p>
          Created {new Date(starter.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
          {starter.parent_words && (
            <>
              {' · Descended from '}
              <Link to={`/${starter.parent_words.join('-')}`}>
                {starter.parent_words.join('-')}
              </Link>
            </>
          )}
        </p>
      </footer>
    </div>
  )
}
