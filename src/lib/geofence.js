// Regimanuel Gray, Balloon Gate estate — the only area currently served.
// Mirrored in server/src/services/geofence.js; keep both in sync if this changes.
export const CENTER = { lat: 5.681349986764666, lng: -0.2466662467301573 };
export const RADIUS_METERS = 700;

// Haversine great-circle distance, in meters.
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinDeliveryZone(lat, lng) {
  return distanceMeters(lat, lng, CENTER.lat, CENTER.lng) <= RADIUS_METERS;
}
