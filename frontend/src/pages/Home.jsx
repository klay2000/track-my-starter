import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Globe from 'react-globe.gl'
import './Home.css'

// Fetch country polygons for stylized look
const COUNTRIES_URL = 'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson'

export default function Home({ apiUrl }) {
  const [starters, setStarters] = useState([])
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const globeRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    // Load countries for polygon rendering
    fetch(COUNTRIES_URL)
      .then((res) => res.json())
      .then((data) => setCountries(data.features))
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
          <Link to="/new" className="btn btn-large">
            Add My Starter
          </Link>
          {!loading && starters.length > 0 && (
            <p className="home-stats">
              {starters.length} starter{starters.length !== 1 ? 's' : ''} tracked worldwide
            </p>
          )}
        </div>

        <div className="home-globe">
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
              polygonsData={countries}
              polygonCapColor={() => '#e8ddd0'}
              polygonSideColor={() => '#d4c4b0'}
              polygonStrokeColor={() => '#c9a066'}
              polygonAltitude={0.005}
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
              width={550}
              height={550}
            />
          )}
        </div>
      </div>
    </div>
  )
}
