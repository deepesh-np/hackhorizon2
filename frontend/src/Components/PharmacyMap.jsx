import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';

// Fix typical react-leaflet marker issue with webpack/vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function RoutingComponent({ start, end }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !start || !end) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1])
      ],
      routeWhileDragging: false,
      lineOptions: {
        styles: [{ color: "#10b981", weight: 6 }]
      },
      show: false, // hide the directions table to keep map clean
      addWaypoints: false,
      fitSelectedRoutes: true,
      createMarker: () => null // prevent LRM from adding duplicate start/end markers
    }).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };
  }, [map, start, end]);

  return null;
}

const PharmacyMap = ({ pharmacies, userLocation }) => {
  const defaultCenter = [20.5937, 78.9629]; // India center
  const center = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;
  const [destination, setDestination] = useState(null);

  // Clear destination if user location changes significantly or list changes
  useEffect(() => {
      setDestination(null);
  }, [pharmacies]);

  return (
    <div className="w-full h-96 rounded-2xl overflow-hidden border border-outline-variant/30 relative z-0 mt-6 shadow-sm">
      <MapContainer center={center} zoom={userLocation ? 13 : 5} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Only recenter if there's no destination route actively shown */}
        {!destination && <ChangeView center={center} zoom={userLocation ? 13 : 5} />}
        
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <strong>You are here</strong>
            </Popup>
          </Marker>
        )}

        {userLocation && destination && (
            <RoutingComponent 
                start={[userLocation.lat, userLocation.lng]} 
                end={destination} 
            />
        )}

        {pharmacies?.map((pharmacy, idx) => {
          if (pharmacy.coordinates && pharmacy.coordinates.length === 2) {
            // MongoDB coordinates are [longitude, latitude]
            const [lng, lat] = pharmacy.coordinates;
            // Handle edge case where [0,0] is default empty coordinate
            if (lat !== 0 || lng !== 0) {
                return (
                <Marker key={idx} position={[lat, lng]}>
                    <Popup>
                    <div className="text-sm font-body">
                        <strong className="text-primary block mb-1">{pharmacy.pharmacyName}</strong>
                        {pharmacy.address?.street && <div>{pharmacy.address.street}</div>}
                        <div className="mt-2 font-bold flex justify-between gap-4">
                            <span>Price: ₹{pharmacy.price || '--'}</span>
                            {pharmacy.distance && <span className="text-secondary">{pharmacy.distance} km</span>}
                        </div>
                        {pharmacy.distance && (
                            <div className="mt-1 text-xs text-[#6b7c72] flex justify-between">
                                <span>Travel cost (₹2/km)</span>
                                <span className="font-semibold text-[#1a1a1a]">≈ ₹{Math.round(pharmacy.distance * 2)}</span>
                            </div>
                        )}
                        {userLocation && (
                            <button 
                                onClick={() => setDestination([lat, lng])}
                                className="mt-3 w-full bg-primary text-white text-xs font-bold py-1.5 rounded-lg hover:bg-black transition-colors"
                            >
                                Show Route
                            </button>
                        )}
                    </div>
                    </Popup>
                </Marker>
                );
            }
          }
          return null;
        })}
      </MapContainer>
      {destination && (
          <button 
            onClick={() => setDestination(null)}
            className="absolute top-4 right-4 z-[400] bg-white text-error font-bold px-4 py-2 rounded-xl shadow-lg border border-outline-variant/30 hover:bg-error-container hover:text-on-error-container transition-colors text-sm"
          >
            Clear Route
          </button>
      )}
    </div>
  );
};

export default PharmacyMap;
