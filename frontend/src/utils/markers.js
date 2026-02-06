import L from 'leaflet'

export function createMarkerIcon(fillColor, strokeColor, isCurrent = false) {
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
