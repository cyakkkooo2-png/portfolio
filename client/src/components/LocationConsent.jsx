import { useEffect } from 'react';
import { initAnalytics, updateAnalyticsLocation } from '../analytics';
import {
  LOCATION_CHOICE_KEY,
  requestPreciseLocation,
  shouldOfferLocation,
} from '../utils/precise-location';

export default function LocationConsent() {
  useEffect(() => {
    let active = true;
    initAnalytics().then(async (session) => {
      if (!active || !shouldOfferLocation({
        pathname: window.location.pathname,
        choice: localStorage.getItem(LOCATION_CHOICE_KEY) || '',
        district: session?.geo?.district || '',
      })) return;
      try {
        const location = await requestPreciseLocation();
        if (!active) return;
        await updateAnalyticsLocation(location);
        localStorage.setItem(LOCATION_CHOICE_KEY, 'allowed');
      } catch {
        if (active) localStorage.setItem(LOCATION_CHOICE_KEY, 'dismissed');
      }
    });
    return () => { active = false; };
  }, []);
  return null;
}
