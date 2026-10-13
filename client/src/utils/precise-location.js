export const LOCATION_CHOICE_KEY = 'ccy_location_choice_v1';

function clean(value) {
  return String(value || '').trim().slice(0, 40);
}

export function normalizePreciseLocation(data = {}) {
  const names = Array.isArray(data.localityInfo?.administrative)
    ? data.localityInfo.administrative.map((item) => clean(item?.name)).filter(Boolean)
    : [];
  const city = names.find((name) => /市$/.test(name)) || clean(data.city);
  const district = names.find((name) => /(区|县|旗)$/.test(name)) || clean(data.locality);
  return { city, district };
}

export function shouldOfferLocation({ pathname, choice, district }) {
  return pathname === '/' && !choice && !district;
}

function getCoordinates(geolocation) {
  return new Promise((resolve, reject) => {
    if (!geolocation?.getCurrentPosition) return reject(new Error('geolocation_unavailable'));
    geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 300000,
    });
  });
}

export async function requestPreciseLocation({
  geolocation = navigator.geolocation,
  fetcher = fetch,
  reverseGeocodeTimeoutMs = 6000,
} = {}) {
  const position = await getCoordinates(geolocation);
  const latitude = Number(position.coords.latitude);
  const longitude = Number(position.coords.longitude);
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: 'zh',
  });
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('reverse_geocode_timeout')), reverseGeocodeTimeoutMs);
  });
  let response;
  try {
    response = await Promise.race([
      fetcher(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`),
      timeout,
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
  if (!response.ok) throw new Error('reverse_geocode_failed');
  const location = normalizePreciseLocation(await response.json());
  if (!location.city || !location.district) throw new Error('district_unavailable');
  return location;
}
