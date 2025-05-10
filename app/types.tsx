export interface Event {
  id: number;
  arn: string;
  event_name: string;
  committee: string;
  duration: string;
  dates?: Date[];
  type: string;
  nature: string;
  eventVisual?: string;
  event_post_caption?: string;
  project_heads?: string;
  venue?: string;
  budget_allocation?: number;
  brief_description?: string;
  goals?: string;
  objectives?: string;
  strategies?: string;
  measures?: string;
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


// Define the status values
const statusValues = ['INIT', 'SENT', 'DONE', 'REVISE', 'APPROVED', null] as const;

// Export the type
export type FileStatus = typeof statusValues[number];

// Export the values as a readonly array
export const fileStatuses: readonly FileStatus[] = statusValues; 
