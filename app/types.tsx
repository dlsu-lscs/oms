export interface Event {
  id: string;
  arn: string;
  name: string;
  committee: string;
  committeeId: number;
  startTime: string;
  endTime: string;
  type: string;
  nature: string;
  duration: string;
  eventVisual: string;
  eventPostCaption: string;
  attendanceForm: string;
  preregistrationForm: string;
  customLinks: { title: string; url: string }[];
  createdAt: string;
  updatedAt: string;
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
