import React from 'react';
import { LocateFixed, MapPin, Navigation, RefreshCw, Search } from 'lucide-react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
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

interface SearchGeocodeResponse {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: ReverseGeocodeResponse['address'];
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

function MapViewController({ center }: { center: [number, number] }) {
  const map = useMap();

  React.useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 14), { animate: true });
  }, [center, map]);

  return null;
}

function buildLocationSelection(
  lat: number,
  lng: number,
  response: { display_name?: string; address?: ReverseGeocodeResponse['address'] },
): BookingLocationSelection {
  const address = response.address || {};
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

async function searchGeocode(query: string, signal: AbortSignal) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=gb`,
    {
      headers: {
        Accept: 'application/json',
      },
      signal,
    },
  );

  if (!response.ok) {
    throw new Error('Address search failed. Try refining the address.');
  }

  return (await response.json()) as SearchGeocodeResponse[];
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ value, onChange }) => {
  const [isResolving, setIsResolving] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [query, setQuery] = React.useState(value?.locationLabel || '');
  const [searchResults, setSearchResults] = React.useState<SearchGeocodeResponse[]>([]);
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
      setQuery(selection.locationLabel);
      setSearchResults([]);
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
          setQuery(selection.locationLabel);
          setSearchResults([]);
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

  React.useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      setError(null);

      try {
        const results = await searchGeocode(normalizedQuery, controller.signal);
        setSearchResults(results);
      } catch (searchError) {
        if ((searchError as { name?: string })?.name !== 'AbortError') {
          console.error('Address search failed:', searchError);
          setError(searchError instanceof Error ? searchError.message : 'Address search failed.');
        }
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  const handleSelectResult = (result: SearchGeocodeResponse) => {
    const lat = Number.parseFloat(result.lat);
    const lng = Number.parseFloat(result.lon);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('The selected address has invalid coordinates. Choose another suggestion.');
      return;
    }

    const selection = buildLocationSelection(lat, lng, result);
    onChange(selection);
    setQuery(selection.locationLabel);
    setSearchResults([]);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-charcoal/70">Type your address or tap the map to verify it</h4>
          <p className="mt-1 text-xs text-charcoal/55">
            Start typing and choose an autocomplete suggestion, or pin the location manually on the map.
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

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Search Address</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/55" size={16} />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Start typing your full address"
            className="input-field-light pl-12"
          />
        </div>
        {isSearching && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/55">Searching addresses...</p>
        )}
        {searchResults.length > 0 && (
          <div className="max-h-56 overflow-y-auto rounded-2xl border border-charcoal/10 bg-white shadow-[0_16px_40px_rgba(10,12,16,0.08)]">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="w-full border-b border-charcoal/5 px-4 py-3 text-left transition-colors hover:bg-charcoal/[0.03] last:border-b-0"
              >
                <p className="text-xs font-bold tracking-wide text-charcoal">{result.display_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-charcoal/10 bg-white shadow-[0_20px_50px_rgba(10,12,16,0.08)]">
        <MapContainer center={center} zoom={12} className="h-[22rem] w-full md:h-[26rem]" scrollWheelZoom>
          <MapViewController center={center} />
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
                No address verified yet. Type an address, tap a result, or pin directly on the map.
              </p>
            )}
            {error && <p className="mt-3 text-xs font-bold uppercase tracking-widest text-red-500">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
