export interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  committee_id: string;
  budget_allocation?: number;
  finance_processes?: string[];
  fin_drive_id?: string;
  fin_preacts_status?: string;
  fin_postacts_status?: string;
  fin_preacts_deadline?: string;
  fin_postacts_deadline?: string;
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


// Define the status values for individual files
const statusValues = ['INIT', 'DRAFTING', 'DONE', 'REVISE', 'APPROVED', null] as const;

// Export the type
export type FileStatus = typeof statusValues[number];
  
// Export the values as a readonly array
export const fileStatuses: readonly FileStatus[] = statusValues;

// Define the status values for Pre-Acts and Post-Acts
const documentationStatusValues = [
  'INIT', 'AVP', 'SENT', 'DOCU', 'REVISE', 'SIGNATURES', 'SUBMITTED',
  'FULLINCENTIVE', 'HALFINCENTIVE', 'EARLYAPPROVAL', 'LATEAPPROVAL',
  'EARLYCOMP', 'EARLYINC', 'LATECOMP', 'LATEINC', 'SPECIAL', 'DEFAULT',
  'PENDED', 'UNCPEND', 'DENIED', 'HOLD', 'CANCELLED'
] as const;

// Export the type
export type DocumentationStatus = typeof documentationStatusValues[number];

// Export the values as a readonly array
export const documentationStatuses: readonly DocumentationStatus[] = documentationStatusValues;

// Export status labels
export const documentationStatusLabels: Record<DocumentationStatus, string> = {
  INIT: 'Initialize',
  AVP: 'Drafting',
  SENT: 'Sent for Review',
  DOCU: 'In Review',
  REVISE: 'For Revision',
  SIGNATURES: 'Collecting Signatures',
  SUBMITTED: 'Submitted to CSO/SLIFE',
  FULLINCENTIVE: 'Full Incentive',
  HALFINCENTIVE: 'Half Incentive',
  EARLYAPPROVAL: 'Early Approved',
  LATEAPPROVAL: 'Late Approved',
  EARLYCOMP: 'Early Complete',
  EARLYINC: 'Early Incomplete',
  LATECOMP: 'Late Complete',
  LATEINC: 'Late Incomplete',
  SPECIAL: 'Special',
  DEFAULT: 'Default',
  PENDED: 'Pending',
  UNCPEND: 'Uncounted Pend',
  DENIED: 'Denied',
  HOLD: 'On Hold',
  CANCELLED: 'Cancelled'
} as const;

export type FinanceStatus = 
  | 'APPROVED'
  | 'DRAFTING'
  | 'INIT'
  | 'PENDED'
  | 'REVISE'
  | 'SIGNATURES'
  | 'SUBMITTED';

export const FINANCE_STATUS_LABELS: Record<FinanceStatus, string> = {
  APPROVED: 'Approved by CSO',
  DRAFTING: 'In Progress',
  INIT: 'Not Started',
  PENDED: 'Pended',
  REVISE: 'For Revision',
  SIGNATURES: 'Gathering Signatures',
  SUBMITTED: 'Submitted to CSO'
};

export const FINANCE_STATUS_COLORS: Record<FinanceStatus, string> = {
  APPROVED: 'bg-green-500 text-white',
  DRAFTING: 'bg-blue-500 text-white',
  INIT: 'bg-gray-500 text-white',
  PENDED: 'bg-yellow-500 text-white',
  REVISE: 'bg-orange-500 text-white',
  SIGNATURES: 'bg-purple-500 text-white',
  SUBMITTED: 'bg-indigo-500 text-white'
};

export interface FinanceFolderCreationResponse {
  folderId: string;
  steps: {
    label: string;
    status: 'pending' | 'success' | 'error';
    message?: string;
  }[];
}
  