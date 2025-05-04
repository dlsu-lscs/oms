export interface Event {
  id: number;
  arn: string;
  event_name: string;
  start: Date;
  end: Date;
  duration: string;
  type: string;
  committee?: string;
  committeeId?: number;
  nature?: string;
  eventVisual?: string | null;
}

export interface Participant {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
  attended: boolean;
  notes: string;
}
