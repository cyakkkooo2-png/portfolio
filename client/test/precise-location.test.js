import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePreciseLocation, requestPreciseLocation, shouldOfferLocation } from '../src/utils/precise-location.js';

test('extracts only city and district from reverse geocoding data', () => {
  const location = normalizePreciseLocation({
    city: '广州',
    locality: '石牌街道',
    latitude: 23.12,
    longitude: 113.36,
    localityInfo: {
      administrative: [
        { name: '中国' },
        { name: '广东省' },
        { name: '广州市' },
        { name: '天河区' },
      ],
    },
  });

  assert.deepEqual(location, { city: '广州市', district: '天河区' });
  assert.equal(Object.hasOwn(location, 'latitude'), false);
  assert.equal(Object.hasOwn(location, 'longitude'), false);
});

test('offers location only on the public home page before a choice is saved', () => {
  assert.equal(shouldOfferLocation({ pathname: '/', choice: '', district: '' }), true);
  assert.equal(shouldOfferLocation({ pathname: '/admin', choice: '', district: '' }), false);
  assert.equal(shouldOfferLocation({ pathname: '/', choice: 'allowed', district: '' }), false);
  assert.equal(shouldOfferLocation({ pathname: '/', choice: '', district: '天河区' }), false);
});

test('requests browser coordinates and returns only the resolved city and district', async () => {
  const geolocation = {
    getCurrentPosition(success) {
      success({ coords: { latitude: 23.12, longitude: 113.36, accuracy: 18 } });
    },
  };
  const fetcher = async () => ({
    ok: true,
    json: async () => ({
      latitude: 23.12,
      longitude: 113.36,
      localityInfo: { administrative: [{ name: '广州市' }, { name: '天河区' }] },
    }),
  });

  assert.deepEqual(await requestPreciseLocation({ geolocation, fetcher }), {
    city: '广州市', district: '天河区',
  });
});

test('stops waiting when reverse geocoding is unavailable', async () => {
  const geolocation = {
    getCurrentPosition(success) {
      success({ coords: { latitude: 23.12, longitude: 113.36 } });
    },
  };
  const fetcher = () => new Promise(() => {});

  await assert.rejects(
    requestPreciseLocation({ geolocation, fetcher, reverseGeocodeTimeoutMs: 5 }),
    /reverse_geocode_timeout/,
  );
});
