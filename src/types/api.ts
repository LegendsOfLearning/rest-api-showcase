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

// Searches
export type SearchContentType = 'game' | 'video' | 'standard';
export type GameType = 'instructional' | 'quiz' | 'simulation';
export type GradeLevel = 'K' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
export type SubjectArea = 'math' | 'science' | 'social studies';

export interface GlobalSearchParams {
  q?: string;
  content_type?: SearchContentType;
  game_types?: GameType[];
  grade_levels?: GradeLevel[];
  subject_areas?: SubjectArea[];
  standard_set?: string;
  max_lexile_level?: number;
  page?: number;
  page_size?: number;
}

export type SearchResult =
  | {
      content_type: 'standard';
      id: number;
      standard: {
        id: number;
        name: string;
        description: string;
        grade_levels: string[];
        image: string;
        standard_set: string;
        subject_area: string[];
        standard_code: string;
      };
      highlights?: unknown;
    }
  | {
      content_type: 'content';
      id: number;
      content: {
        id: number;
        name: string;
        description: string;
        thumbnail_url: string;
        grade_levels: string[];
        subject_areas: string[];
        game_type: string;
        content_type: string;
        lexile_level?: number;
      };
      highlights?: unknown;
    };

export interface GlobalSearchResponse {
  hits: SearchResult[];
  total_count: number;
  page: number;
  per_page: number;
}

export interface AssignmentCreateRequest {
  application_user_id: string;
  activities: { content_id?: number; standard_id?: number }[];
}

export interface AssignmentCreateResponse {
  assignment_id: number;
}

export interface AssignmentJoinRequest {
  application_user_id: string;
  target: 'awakening' | 'web';
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

// Content list and detail
export interface ContentListEntry {
  id: number;
  game: string;
  image: string;
  description: string;
  estimated_duration: number | null;
  type: string;
  content_type: string;
  supports_ipad: boolean;
  supports_tts: boolean;
  video_preview_url: string | null;
  version: {
    id: number;
    url: string;
    language_key: string;
    api_version: number;
  } | null;
  stats: {
    id: number;
    teacher_rating_avg: number | null;
    teacher_rating_count: number | null;
    student_rating_avg: number | null;
    student_rating_count: number | null;
    ease_of_play_avg: number | null;
    content_integration_avg: number | null;
    composite_rating_score: number | null;
    composite_rating_avg: number | null;
  } | null;
}

export interface ContentListResponse {
  entries: ContentListEntry[];
  page_number: number;
  page_size: number;
  total_pages: number;
  total_entries: number;
}

export interface ContentDetail extends Omit<ContentListEntry, 'version' | 'stats' | 'image' | 'game'> {
  is_available: boolean;
  banner: string | null;
  vocabulary: string | null;
  image: string;
  pdf_url: string | null;
  is_question_game: boolean;
  game_developer_id: number | null;
  discussion_questions_after: string | null;
  discussion_questions_before: string | null;
  video: string | null;
  supports_spanish: boolean;
  instructions: string | null;
  type: string;
  game: string;
  short_name: string | null;
  sponsorship_image_url: string | null;
  sponsorship_link_url: string | null;
  developer_instructions: string | null;
  video_preview_url: string | null;
  lexile_level: number | null;
  standards: { id: number; ngss_dci_name: string; standard: string; image_key: string }[];
  concepts: { concept: string; concept_ident: string }[];
  version: { id: number; url: string; language_key: string; api_version: number } | null;
  grade_levels: string[];
  stats: {
    id: number | null;
    teacher_rating_avg: number | null;
    teacher_rating_count: number | null;
    student_rating_avg: number | null;
    student_rating_count: number | null;
    ease_of_play_avg: number | null;
    content_integration_avg: number | null;
    composite_rating_score: number | null;
    composite_rating_avg: number | null;
  } | null;
}

export interface ContentReview {
  id: number;
  score: number;
  review: string;
  created_at: string;
  teacher?: { id: number; name: string };
  tester_display_name?: string | null;
  upvotes_count: number;
}

export interface ContentReviewsResponse {
  entries: ContentReview[];
  page_number: number;
  page_size: number;
  total_pages: number;
  total_entries: number;
  stats?: {
    teacher_rating_avg: number | null;
    teacher_rating_count: number | null;
    student_rating_avg: number | null;
    student_rating_count: number | null;
    composite_rating_avg: number | null;
    composite_rating_score: number | null;
    teacher_rating_score_summary?: unknown;
    student_rating_score_summary?: unknown;
    ease_of_play_avg: number | null;
    content_integration_avg: number | null;
    suggested_use_summary?: string | null;
  };
}

// Assignment detail
export interface AssignmentActivitySummary {
  id: number;
  type: 'content';
  content_type?: 'game' | 'video' | null;
  standard_id?: number | null;
  content_id?: number | null;
}

export interface AssignmentDetailResponse {
  assignment: {
    id: number;
    name: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
    activities?: AssignmentActivitySummary[];
  };
  players?: {
    entries: unknown[];
    page_number: number;
    page_size: number;
    total_pages: number;
    total_entries: number;
  };
  by_activity?: unknown;
  by_activity_by_player?: unknown;
  by_player?: unknown;
  by_standard?: unknown;
  by_standard_by_student?: unknown;
}