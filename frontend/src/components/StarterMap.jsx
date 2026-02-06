import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './StarterMap.css'

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

export default function StarterMap({ center, zoom, scrollWheelZoom = true, children }) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={scrollWheelZoom}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
      {children}
    </MapContainer>
  )
}
