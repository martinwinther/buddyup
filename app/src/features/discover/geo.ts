export function kmBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371; // km
  const dLat = deg2rad(b.lat - a.lat);
  const dLon = deg2rad(b.lon - a.lon);
  const la1 = deg2rad(a.lat);
  const la2 = deg2rad(b.lat);

  const h = Math.sin(dLat/2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon/2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const deg2rad = (d: number) => d * (Math.PI / 180);

