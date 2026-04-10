import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

const PharmacyMap = ({ pharmacies, userLocation }) => {
  const defaultCenter = [20.5937, 78.9629]; // India center
  const center = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;

  return (
    <div className="w-full h-96 rounded-2xl overflow-hidden border border-outline-variant/30 relative z-0 mt-6 shadow-sm">
      <MapContainer center={center} zoom={userLocation ? 13 : 5} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={center} zoom={userLocation ? 13 : 5} />
        
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <strong>You are here</strong>
            </Popup>
          </Marker>
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
                    </div>
                    </Popup>
                </Marker>
                );
            }
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
};

export default PharmacyMap;
