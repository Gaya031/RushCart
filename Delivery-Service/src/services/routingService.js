const toNum = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const toLatLng = (coords = []) => coords.map(([lng, lat]) => [lat, lng]);

export const parseRouteCoordinates = (query = {}) => {
  const fromLat = toNum(query.from_lat);
  const fromLng = toNum(query.from_lng);
  const toLat = toNum(query.to_lat);
  const toLng = toNum(query.to_lng);

  if ([fromLat, fromLng, toLat, toLng].some((v) => v === null)) {
    return null;
  }
  return { fromLat, fromLng, toLat, toLng };
};

export const fetchRoute = async ({ fromLat, fromLng, toLat, toLng }) => {
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
  const routeRes = await fetch(osrmUrl);
  if (!routeRes.ok) {
    throw new Error(`OSRM request failed with status ${routeRes.status}`);
  }
  const data = await routeRes.json();
  const route = Array.isArray(data.routes) ? data.routes[0] : null;
  if (!route) {
    throw new Error("No route found");
  }

  return {
    distance_km: Number(route.distance || 0) / 1000,
    eta_minutes: Math.round(Number(route.duration || 0) / 60),
    polyline: toLatLng(route.geometry?.coordinates || []),
  };
};

