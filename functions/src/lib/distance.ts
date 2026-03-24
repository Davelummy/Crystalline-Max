function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function getDistanceMeters(
  originLat: number,
  originLng: number,
  targetLat: number,
  targetLng: number,
) {
  const earthRadius = 6371000;
  const dLat = toRadians(targetLat - originLat);
  const dLng = toRadians(targetLng - originLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(originLat)) *
      Math.cos(toRadians(targetLat)) *
      Math.sin(dLng / 2) ** 2;

  return Math.round(earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))));
}
