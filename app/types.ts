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
