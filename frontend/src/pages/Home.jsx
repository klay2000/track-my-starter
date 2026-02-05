import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Globe from 'react-globe.gl'
import './Home.css'

// Fetch geographic data for stylized look
const COUNTRIES_URL = 'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson'
const STATES_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_1_states_provinces_lines.geojson'
const LAKES_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_lakes.geojson'

export default function Home({ apiUrl }) {
  const [starters, setStarters] = useState([])
  const [countries, setCountries] = useState([])
  const [stateBorders, setStateBorders] = useState([])
  const [lakes, setLakes] = useState([])
  const [loading, setLoading] = useState(true)
  const [globeSize, setGlobeSize] = useState(550)
  const globeRef = useRef()
  const globeContainerRef = useRef()
  const navigate = useNavigate()

  // Update globe size on resize
  useEffect(() => {
    const updateSize = () => {
      if (globeContainerRef.current) {
        const container = globeContainerRef.current
        const size = Math.min(container.offsetWidth, container.offsetHeight)
        setGlobeSize(size)
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [loading])

  useEffect(() => {
    // Load geographic data for polygon rendering
    fetch(COUNTRIES_URL)
      .then((res) => res.json())
      .then((data) => setCountries(data.features))
      .catch(console.error)

    fetch(STATES_URL)
      .then((res) => res.json())
      .then((data) => {
        // Flatten MultiLineString into individual LineStrings
        const paths = []
        data.features.forEach((feature) => {
          if (feature.geometry.type === 'MultiLineString') {
            feature.geometry.coordinates.forEach((coords) => {
              paths.push({ coords })
            })
          } else if (feature.geometry.type === 'LineString') {
            paths.push({ coords: feature.geometry.coordinates })
          }
        })
        setStateBorders(paths)
      })
      .catch(console.error)

    fetch(LAKES_URL)
      .then((res) => res.json())
      .then((data) => setLakes(data.features))
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetch(`${apiUrl}/api/starters`)
      .then((res) => res.json())
      .then((data) => {
        setStarters(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load starters:', err)
        setLoading(false)
      })
  }, [apiUrl])

  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls()
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.4
      controls.enableZoom = false
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 })
    }
  }, [loading])

  const pointsData = starters.map((s) => ({
    lat: s.location.coordinates[1],
    lng: s.location.coordinates[0],
    words: s.words.join('-'),
    type: s.starter_type,
  }))

  const handlePointClick = (point) => {
    navigate(`/${point.words}`)
  }

  return (
    <div className="home">
      <div className="home-content">
        <div className="home-hero">
          <h1>Track My Starter</h1>
          <p className="home-tagline">
            Follow the journey of fermented starters around the world
          </p>
          <div className="home-actions">
            <Link to="/new" className="btn btn-large">
              Add My Starter
            </Link>
            <Link to="/explore" className="btn btn-large btn-secondary">
              Explore Map
            </Link>
          </div>
          {!loading && starters.length > 0 && (
            <p className="home-stats">
              {starters.length} starter{starters.length !== 1 ? 's' : ''} tracked worldwide
            </p>
          )}
        </div>

        <div className="home-globe" ref={globeContainerRef}>
          {loading ? (
            <div className="globe-loading">
              <div className="loading-spinner" />
              <p>Loading globe...</p>
            </div>
          ) : (
            <Globe
              ref={globeRef}
              backgroundColor="rgba(0,0,0,0)"
              globeImageUrl={null}
              showGlobe={true}
              showAtmosphere={true}
              atmosphereColor="#c9a066"
              atmosphereAltitude={0.15}
              polygonsData={[
                ...countries.map(f => ({ ...f, _type: 'land' })),
                ...lakes.map(f => ({ ...f, _type: 'water' }))
              ]}
              polygonCapColor={(d) => d._type === 'water' ? '#a8c8d8' : '#e8ddd0'}
              polygonSideColor={(d) => d._type === 'water' ? '#8ab4c8' : '#d4c4b0'}
              polygonStrokeColor={(d) => d._type === 'water' ? '#8ab4c8' : '#c9a066'}
              polygonAltitude={(d) => d._type === 'water' ? 0.006 : 0.005}
              pathsData={stateBorders}
              pathPoints="coords"
              pathPointLat={(p) => p[1]}
              pathPointLng={(p) => p[0]}
              pathColor={() => 'rgba(180, 160, 130, 0.6)'}
              pathStroke={0.3}
              pathAltitude={0.007}
              pointsData={pointsData}
              pointLat="lat"
              pointLng="lng"
              pointColor={() => '#b07d4f'}
              pointRadius={0.8}
              pointAltitude={0.02}
              onPointClick={handlePointClick}
              pointLabel={(d) => `
                <div class="globe-tooltip">
                  <strong>${d.words}</strong>
                  <span>${d.type.replace(/_/g, ' ')}</span>
                </div>
              `}
              width={globeSize}
              height={globeSize}
            />
          )}
        </div>
      </div>
    </div>
  )
}
