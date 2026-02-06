import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Globe from 'react-globe.gl'
import * as THREE from 'three'
import { useFetch } from '../hooks/useFetch'
import LoadingSpinner from '../components/LoadingSpinner'
import './Home.css'

const COUNTRIES_URL = 'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson'
const LAKES_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_lakes.geojson'

function extractBorders(features) {
  const paths = []
  features.forEach((feature) => {
    const geom = feature.geometry
    if (geom.type === 'Polygon') {
      geom.coordinates.forEach((ring) => {
        paths.push({ coords: ring })
      })
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          paths.push({ coords: ring })
        })
      })
    }
  })
  return paths
}

const ROTATING_TYPES = [
  'sourdough starter',
  'kombucha starter',
  'kefir starter',
  'ginger bug starter',
  'friendship bread',
  'jun starter',
  'other ferments'
]

function RotatingType() {
  const [typeIndex, setTypeIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTypeIndex((prev) => (prev + 1) % ROTATING_TYPES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="rotating-type">
      <span key={typeIndex} className="rotating-type-text">{ROTATING_TYPES[typeIndex]}</span>
    </span>
  )
}

export default function Home({ apiUrl }) {
  const { data: starters, loading: startersLoading } = useFetch(`${apiUrl}/api/starters`)
  const [countries, setCountries] = useState([])
  const [borders, setBorders] = useState([])
  const [lakes, setLakes] = useState([])
  const [geoLoading, setGeoLoading] = useState(true)
  const [globeSize, setGlobeSize] = useState(550)
  const globeRef = useRef()
  const globeContainerRef = useRef()
  const navigate = useNavigate()

  const loading = startersLoading || geoLoading

  const globeMaterial = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      color: new THREE.Color('#7dd3fc'),
      transparent: false,
    })
  }, [])

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
    Promise.all([
      fetch(COUNTRIES_URL).then((res) => res.json()),
      fetch(LAKES_URL).then((res) => res.json()),
    ])
      .then(([countriesData, lakesData]) => {
        setCountries(countriesData.features)
        setBorders(extractBorders(countriesData.features))
        setLakes(lakesData.features)
        setGeoLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load geographic data:', err)
        setGeoLoading(false)
      })
  }, [])

  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls()
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.4
      controls.enableZoom = false
      globeRef.current.pointOfView({ lat: 35, lng: -95, altitude: 2.2 })
    }
  }, [loading])

  const pointsData = (starters || []).map((s) => ({
    lat: s.location.coordinates[1],
    lng: s.location.coordinates[0],
    words: s.words.join('-'),
    name: s.name,
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
            Follow the journey of your<br />
            <RotatingType /><br />
            around the world!
          </p>
          <div className="home-actions">
            <Link to="/new" className="btn btn-large">
              Add My Starter
            </Link>
            <Link to="/explore" className="btn btn-large btn-secondary">
              Explore Map
            </Link>
          </div>
          {!loading && starters && starters.length > 0 && (
            <p className="home-stats">
              {starters.length} starter{starters.length !== 1 ? 's' : ''} tracked worldwide
            </p>
          )}
        </div>

        <div className="home-globe" ref={globeContainerRef}>
          {loading ? (
            <LoadingSpinner message="Loading globe..." />
          ) : (
            <Globe
              ref={globeRef}
              backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
              globeMaterial={globeMaterial}
              showGlobe={true}
              showAtmosphere={true}
              atmosphereColor="#7dd3fc"
              atmosphereAltitude={0.12}
              animateIn={false}
              polygonsData={[
                ...countries.map(f => ({ ...f, _type: 'land' })),
                ...lakes.map(f => ({ ...f, _type: 'water' }))
              ]}
              polygonCapColor={(d) => d._type === 'water' ? '#7dd3fc' : '#e8ddd0'}
              polygonSideColor={(d) => d._type === 'water' ? '#7dd3fc' : '#d4c4b0'}
              polygonStrokeColor={() => false}
              polygonAltitude={(d) => d._type === 'water' ? 0.012 : 0.01}
              pathsData={borders}
              pathPoints="coords"
              pathPointLat={(p) => p[1]}
              pathPointLng={(p) => p[0]}
              pathColor={() => '#b07d4f'}
              pathStroke={1}
              pathAltitude={0.011}
              pointsData={pointsData}
              pointLat="lat"
              pointLng="lng"
              pointColor={() => '#b07d4f'}
              pointRadius={0.8}
              pointAltitude={0.02}
              onPointClick={handlePointClick}
              pointLabel={(d) => `
                <div class="globe-tooltip">
                  <strong>${d.name || d.words}</strong>
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
