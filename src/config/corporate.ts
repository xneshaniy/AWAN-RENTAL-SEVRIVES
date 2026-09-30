// Shared corporate service definitions. Plain data module (no directives) so it
// can be imported by both the server page and the client form component.
export const SERVICE_TYPES = [
  { value: 'employee_transport', label: 'Employee Transportation', description: 'Daily commute, shift transport, staff shuttle services' },
  { value: 'executive_travel', label: 'Executive Travel', description: 'Premium vehicles for executives, VIPs, and board members' },
  { value: 'airport_transfer', label: 'Corporate Airport Transfers', description: 'Airport pickup/drop for employees, clients, and visitors' },
  { value: 'event_transport', label: 'Event & Conference Transport', description: 'Conferences, seminars, team building, corporate events' },
  { value: 'meeting_transport', label: 'Meeting Transportation', description: 'Inter-city meetings, client visits, site visits' },
  { value: 'long_term_contract', label: 'Long-term Contract', description: 'Monthly/annual contracts with dedicated vehicles and drivers' },
] as const;
