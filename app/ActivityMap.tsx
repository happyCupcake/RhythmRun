"use client";

import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import polyline from "@mapbox/polyline";
import "leaflet/dist/leaflet.css";
import { LatLngExpression } from "leaflet";

interface ActivityMapProps {
  encodedPolyline: string;
}

export default function ActivityMap({ encodedPolyline }: ActivityMapProps) {
  if (!encodedPolyline) {
    return <p>No map data available.</p>;
  }

  // Decode the polyline string into an array of [lat, lng]
  const positions: LatLngExpression[] = polyline
    .decode(encodedPolyline)
    .map(([lat, lng]) => [lat, lng] as LatLngExpression);

  return (
    <MapContainer
      center={positions[0]} // now TypeScript knows this is a LatLngExpression
      zoom={13}
      style={{ height: "400px", width: "100%", borderRadius: "1rem" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <Polyline positions={positions} color="red" weight={4} />
    </MapContainer>
  );
}
