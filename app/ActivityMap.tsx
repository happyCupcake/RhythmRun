"use client";

import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import polyline from "@mapbox/polyline";
import "leaflet/dist/leaflet.css";
import { LatLngExpression, Icon } from "leaflet";

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

  // Function: convert interval.startKm to an index in the positions array
  const getPositionForKm = (km: number) => {
    if (!positions.length) return positions[0];
    const idx = Math.min(Math.round((km / (intervals[intervals.length - 1]?.endKm || 1)) * positions.length), positions.length - 1);
    return positions[idx];
  };

  return (
    <MapContainer
      center={positions[0]}
      zoom={13}
      style={{ height: "400px", width: "100%", borderRadius: "1rem" }}
    >
    <TileLayer
    url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
    attribution="&copy; <a href='https://stadiamaps.com/'>Stadia Maps</a>, © <a href='https://openmaptiles.org/'>OpenMapTiles</a> © <a href='https://openstreetmap.org'>OpenStreetMap</a> contributors"
    />

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
