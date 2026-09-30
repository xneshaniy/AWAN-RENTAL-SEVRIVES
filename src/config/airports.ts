/**
 * Airports configured for the airport-transfer page and booking form.
 *
 * The page, the form options, and the server-side validation all read this
 * list, so an airport only appears — and can only be submitted — after it is
 * added here with `enabled: true`. Additional airports stay hidden until they
 * are actually confirmed and configured.
 */

export interface AirportOption {
  /** Stable id used by the form value and server validation. */
  id: string;
  label: string;
  city: string;
  enabled: boolean;
  /** Short line shown on the coverage card. */
  note?: string;
}

/** Free-form "Other airport" option, shown only when allowed below. */
export const OTHER_AIRPORT_ID = 'other';
export const ALLOW_OTHER_AIRPORT = false;

export const AIRPORT_OPTIONS: AirportOption[] = [
  {
    id: 'isb',
    label: 'Islamabad International Airport',
    city: 'Islamabad',
    enabled: true,
    note: 'Arrival pickups and departure drop-offs at the airport.',
  },
  {
    id: 'lhe',
    label: 'Lahore Allama Iqbal International Airport',
    city: 'Lahore',
    enabled: true,
    note: 'Arrival pickups and departure drop-offs at the airport.',
  },
  {
    id: 'rwp-isb',
    label: 'Rawalpindi / Islamabad',
    city: 'Rawalpindi / Islamabad',
    enabled: true,
    note: 'Pickups and drop-offs across the Twin Cities.',
  },
  // Not yet configured — set `enabled: true` only when the route is confirmed.
  { id: 'khi', label: 'Karachi Jinnah International Airport', city: 'Karachi', enabled: false },
  { id: 'pjr', label: 'Peshawar Bacha Khan International Airport', city: 'Peshawar', enabled: false },
  { id: 'mux', label: 'Multan International Airport', city: 'Multan', enabled: false },
  { id: 'skt', label: 'Sialkot International Airport', city: 'Sialkot', enabled: false },
];

export function getEnabledAirports(): AirportOption[] {
  return AIRPORT_OPTIONS.filter((airport) => airport.enabled);
}

export function getEnabledAirportIds(): string[] {
  return getEnabledAirports().map((airport) => airport.id);
}

/** Values accepted by `airportTransferSchema.vehiclePreference` (kept in sync). */
export const VEHICLE_PREFERENCE_VALUES = ['ANY', 'CAR', 'SUV', 'VAN_MINIBUS'] as const;

export type VehiclePreference = (typeof VEHICLE_PREFERENCE_VALUES)[number];

export const VEHICLE_PREFERENCE_OPTIONS: { value: VehiclePreference; label: string }[] = [
  { value: 'ANY', label: 'No preference' },
  { value: 'CAR', label: 'Car (economy or sedan)' },
  { value: 'SUV', label: 'SUV' },
  { value: 'VAN_MINIBUS', label: 'Van or minibus' },
];
