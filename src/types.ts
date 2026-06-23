export type IssueCategory =
  | 'pothole'
  | 'water_leak'
  | 'broken_streetlight'
  | 'garbage'
  | 'drainage'
  | 'illegal_dumping'
  | 'damaged_signage'
  | 'other';

export type IssueStatus =
  | 'pending_verification'
  | 'verified'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export interface LocationInfo {
  lat: number;
  lng: number;
  address: string;
  ward: string;
}

export interface TimelineEvent {
  status: IssueStatus;
  timestamp: string;
  note: string;
  actor: string;
}

export interface Issue {
  id: string;
  title: string;
  category: IssueCategory;
  subType: string;
  description: string;
  severity: number; // 1 - 5
  priorityScore: number; // 0 - 100
  status: IssueStatus;
  location: LocationInfo;
  confirmations: number;
  upvotes: number;
  reportsCount: number;
  reportIds: string[];
  imageUrls: string[];
  resolvedImageUrl?: string;
  resolvedNote?: string;
  assignedDepartment?: string;
  assignedOfficer?: string;
  eta?: string;
  aiRationale: string;
  aiThoughtProcess?: string[];
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'officer';
  department?: string;
  points: number;
  badges: Badge[];
  streak: number;
  reportsCount: number;
  verificationsCount: number;
}

export interface InsightCard {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'success';
  ward: string;
  category: string;
  frequency: string;
  recommendation: string;
}
