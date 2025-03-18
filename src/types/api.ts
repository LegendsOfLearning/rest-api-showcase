export interface User {
  id: number;
  role: 'teacher' | 'student';
  first_name: string;
  last_name: string;
  application_user_id: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  total_count: number;
  page: number;
  per_page: number;
}

export interface StandardSet {
  id: string;
  name: string;
  subject_area: string;
}

export interface Subject {
  id: number;
  name: string;
  subject_area: string;
  school_level: string;
}

export interface Standard {
  id: number;
  description: string;
  standard: string;
  subject: Subject;
  image_url: string;
  image_key: string;
  grade_levels: string[];
  standard_code: string;
}

export interface StandardsResponse {
  meta: {
    total_count: number;
    page_size: number;
    total_pages: number;
    page: number;
  };
  entries: Standard[];
}

export interface AssignmentCreateRequest {
  type: 'standard';
  standard_id: number;
  application_user_id: string;
}

export interface AssignmentCreateResponse {
  assignment_id: number;
}

export interface AssignmentJoinRequest {
  application_user_id: string;
  target: 'awakening';
}

export interface AssignmentJoinResponse {
  join_url: string;
}

export interface LaunchResponse {
  assignment_id: number;
  student_links: {
    student_id: string;
    launch_url: string;
  }[];
} 