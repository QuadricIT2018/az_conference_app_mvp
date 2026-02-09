// Base types
export interface BaseEntity {
  id: number;
  created_at: Date;
  updated_at: Date;
}

// Department
export interface Department {
  id: number;
  name: string;
}

// Team
export interface Team {
  id: number;
  department_id: number;
  name: string;
}

// Session Tag
export interface SessionTag {
  id: number;
  name: string;
}

// Session Type
export interface SessionType {
  id: number;
  name: string;
}

// WiFi Info (JSONB)
export interface WifiInfo {
  title: string;
  desc: string;
  wifi_name: string;
  wifi_password: string;
}

// Helpdesk Info (JSONB)
export interface HelpdeskInfo {
  title: string;
  desc: string;
  start_time: string;
  end_time: string;
  contact_numbers: string[];
  contact_emails: string[];
}

// Venue Map Info (JSONB)
export interface VenueMapInfo {
  title: string;
  file_url: string;
}

// Quick Link (JSONB)
export interface QuickLink {
  title: string;
  url: string;
}

// Event Banner (JSONB)
export interface EventBannerEntry {
  file_url: string;
  original_name: string;
}

export interface EventBanners {
  mobile?: EventBannerEntry;
  tablet?: EventBannerEntry;
  desktop?: EventBannerEntry;
}

// Event
export interface Event {
  id: number;
  event_slug: string | null;
  pwa_name: string;
  pwa_logo_url: string | null;
  event_name: string;
  event_banner_url: string | null;
  event_description: string | null;
  department: string | null;
  event_location: string | null;
  event_location_map_url: string | null;
  event_start_date: Date;
  event_end_date: Date;
  event_venue_map_url: string | null;
  event_app_url: string | null;
  wifi: WifiInfo[];
  helpdesk: HelpdeskInfo[];
  venue_maps: VenueMapInfo[];
  event_banners: EventBanners;
  quick_links: QuickLink[];
  is_draft: boolean;
  manifest_url: string | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

// Speaker
export interface Speaker {
  id: number;
  speaker_name: string;
  speaker_designation: string | null;
  speaker_about: string | null;
  speaker_image_url: string | null;
  speaker_occupation: string | null;
  department: string | null;
  teams: string | null;
  created_at: Date;
  updated_at: Date;
}

// Session
export interface Session {
  id: number;
  event_id: number | null;
  session_name: string;
  session_description: string | null;
  session_date: Date;
  session_start_time: string;
  session_end_time: string | null;
  session_tag: string | null;
  session_location: string | null;
  session_location_map_url: string | null;
  session_venue_map_url: string | null;
  created_at: Date;
  updated_at: Date;
  is_generic: boolean;
  department: string | null;
  is_dept_generic: boolean;
  team: string | null;
  timezone: string | null;
  has_topics: boolean;
}

// Session Topic
export interface SessionTopic {
  id: number;
  name: string;
  session_id: number;
  location: string | null;
  session_type: string | null;
}

// Session Topic Attendee
export interface SessionTopicAttendee {
  id: number;
  attendee_id: number;
  session_topic_id: number | null;
}

// Session Speaker (junction)
export interface SessionSpeaker {
  id: number;
  session_id: number;
  speaker_id: number;
}

// Attendee
export interface Attendee {
  id: number;
  email: string;
  password_hash: string;
  department: string | null;
  team: string | null;
  last_login: Date;
  created_at: Date;
  updated_at: Date;
}

// Admin
export interface Admin {
  id: number;
  email: string;
  password_hash: string;
  department: string | null;
  created_at: Date;
  updated_at: Date;
}

// User Favourite Session
export interface UserFavouriteSession {
  id: number;
  user_id: number;
  session_id: number;
  event_id: number;
}

// Important Update
export interface ImportantUpdate {
  id: number;
  event_id: number | null;
  title: string;
  description: string | null;
  links: string[] | null;
  created_at: Date;
  update_date_time: Date;
}

// JWT Payload
export interface JWTPayload {
  userId: number;
  email: string;
  department: string | null;
  team: string | null;
  isAdmin: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
