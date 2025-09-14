"use client";

import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import polyline from "@mapbox/polyline";
import "leaflet/dist/leaflet.css";
import { LatLngExpression } from "leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// ✅ Fix default Leaflet marker paths (for Next.js / Webpack)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

interface Interval {
  segment: number;
  startKm: number;
  endKm: number;
}

interface ActivityMapProps {
  encodedPolyline: string;
  intervals?: Interval[];
}

export default function ActivityMap({ encodedPolyline, intervals = [] }: ActivityMapProps) {
  if (!encodedPolyline) {
    return <p>No map data available.</p>;
  }

  // Decode polyline into [lat, lng]
  const positions: LatLngExpression[] = polyline
    .decode(encodedPolyline)
    .map(([lat, lng]) => [lat, lng] as LatLngExpression);

  // Find approximate position along polyline for a given km marker
  const getPositionForKm = (km: number) => {
    if (!positions.length) return positions[0];
    const totalKm = intervals[intervals.length - 1]?.endKm || 1;
    const safeKm = km ?? 0;
    const idx = Math.min(
      Math.round((safeKm / totalKm) * positions.length),
      positions.length - 1
    );
    return positions[idx];
  };

  return (
    <MapContainer
      center={positions[0]}
      zoom={13}
      style={{ height: "400px", width: "100%", borderRadius: "1rem", marginBottom: "3rem"}}
    >
      <TileLayer
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
        attribution="&copy; <a href='https://stadiamaps.com/'>Stadia Maps</a>, © <a href='https://openmaptiles.org/'>OpenMapTiles</a> © <a href='https://openstreetmap.org'>OpenStreetMap</a> contributors"
      />

      {/* Draw route polyline */}
      <Polyline positions={positions} color="red" weight={4} />

      {/* Interval markers */}
      {intervals.map((interval) => {
        const pos = getPositionForKm(interval.startKm);
        return (
          <Marker key={interval.segment} position={pos}>
            <Popup>Segment S{interval.segment}</Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
