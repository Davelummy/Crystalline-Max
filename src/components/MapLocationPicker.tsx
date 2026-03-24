import React from 'react';
import { LocateFixed, MapPin, Navigation, RefreshCw } from 'lucide-react';
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { BookingLocationSelection } from '../types';

const MANCHESTER_CENTER: [number, number] = [53.4808, -2.2426];

interface ReverseGeocodeResponse {
  display_name?: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    postcode?: string;
  };
}

interface MapLocationPickerProps {
  value: BookingLocationSelection | null;
  onChange: (location: BookingLocationSelection) => void;
}

function MapSelectionEvents({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function buildLocationSelection(lat: number, lng: number, response: ReverseGeocodeResponse): BookingLocationSelection {
  const address = response.address ?? {};
  const line1 = [address.house_number, address.road].filter(Boolean).join(' ').trim();
  const city = address.city || address.town || address.village || address.county || 'Manchester';
  const postcode = address.postcode || '';

  return {
    address: line1 || response.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    city,
    postcode,
    locationLabel: response.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    locationLat: Number(lat.toFixed(6)),
    locationLng: Number(lng.toFixed(6)),
    locationVerified: true,
  };
}

async function reverseGeocode(lat: number, lng: number) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error('Location lookup failed. Try another point on the map.');
  }

  const data = (await response.json()) as ReverseGeocodeResponse;
  return buildLocationSelection(lat, lng, data);
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ value, onChange }) => {
  const [isResolving, setIsResolving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const center = React.useMemo<[number, number]>(
    () => (value ? [value.locationLat, value.locationLng] : MANCHESTER_CENTER),
    [value],
  );

  const resolvePoint = React.useCallback(async (lat: number, lng: number) => {
    setIsResolving(true);
    setError(null);

    try {
      const selection = await reverseGeocode(lat, lng);
      onChange(selection);
    } catch (lookupError) {
      console.error('Map location lookup failed:', lookupError);
      setError(lookupError instanceof Error ? lookupError.message : 'Location lookup failed.');
    } finally {
      setIsResolving(false);
    }
  }, [onChange]);

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('This browser does not support geolocation.');
      return;
    }

    setIsResolving(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const selection = await reverseGeocode(position.coords.latitude, position.coords.longitude);
          onChange(selection);
        } catch (lookupError) {
          console.error('Current location lookup failed:', lookupError);
          setError(lookupError instanceof Error ? lookupError.message : 'Location lookup failed.');
        } finally {
          setIsResolving(false);
        }
      },
      (geoError) => {
        console.error('Current location failed:', geoError);
        setError('Current location could not be read. Allow location access or tap the map manually.');
        setIsResolving(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-charcoal/70">Tap the map to verify the service address</h4>
          <p className="mt-1 text-xs text-charcoal/55">
            We reverse-check the exact point into a real address so fake locations cannot be submitted.
          </p>
        </div>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isResolving}
          className="btn-secondary border-charcoal/10 text-charcoal hover:text-charcoal px-5 py-3 flex items-center justify-center gap-2"
        >
          {isResolving ? <RefreshCw size={14} className="animate-spin" /> : <LocateFixed size={14} />}
          Use Current Location
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-charcoal/10 bg-white shadow-[0_20px_50px_rgba(10,12,16,0.08)]">
        <MapContainer center={center} zoom={12} className="h-[22rem] w-full md:h-[26rem]" scrollWheelZoom>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapSelectionEvents onPick={resolvePoint} />
          {value && (
            <CircleMarker
              center={[value.locationLat, value.locationLng]}
              radius={12}
              pathOptions={{ color: '#00F5D4', fillColor: '#00F5D4', fillOpacity: 0.35, weight: 2 }}
            />
          )}
        </MapContainer>
      </div>

      <div className="rounded-3xl border border-charcoal/10 bg-charcoal/[0.03] p-5">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-teal/10 text-teal">
            {isResolving ? <RefreshCw size={18} className="animate-spin" /> : <MapPin size={18} />}
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Verified service point</p>
            {value ? (
              <>
                <p className="mt-2 text-sm font-bold uppercase tracking-wide text-charcoal">{value.address}</p>
                <p className="mt-1 text-sm text-charcoal/65">{value.city} {value.postcode}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-widest text-charcoal/55">
                  <span className="inline-flex items-center gap-1"><Navigation size={12} className="text-teal" /> {value.locationLat.toFixed(5)}, {value.locationLng.toFixed(5)}</span>
                  <span className="text-teal">Verified on map</span>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-charcoal/60">
                No address verified yet. Tap the map or use your current location to continue.
              </p>
            )}
            {error && <p className="mt-3 text-xs font-bold uppercase tracking-widest text-red-500">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
