import { z } from 'zod';

// Common schemas
export const idSchema = z.coerce.number().int().positive();

// Department schemas
export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(255),
  teams: z.array(z.string().min(1)).optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  teams: z.array(z.string().min(1)).optional(),
});

// Team schemas
export const createTeamSchema = z.object({
  department_id: z.coerce.number().int().positive(),
  name: z.string().min(1).max(255),
});

export const updateTeamSchema = createTeamSchema.partial();

// WiFi info schema
export const wifiInfoSchema = z.object({
  title: z.string().min(1),
  desc: z.string().optional().default(''),
  wifi_name: z.string().min(1),
  wifi_password: z.string().min(1),
});

// Helpdesk info schema
export const helpdeskInfoSchema = z.object({
  title: z.string().min(1),
  desc: z.string().optional().default(''),
  start_time: z.string().optional().default(''),
  end_time: z.string().optional().default(''),
  contact_numbers: z.array(z.string()).optional().default([]),
  contact_emails: z.array(z.string()).optional().default([]),
});

// Venue Map info schema
export const venueMapInfoSchema = z.object({
  title: z.string().min(1),
  file_url: z.string().min(1),
});

// Quick Link schema
export const quickLinkSchema = z.object({
  title: z.string().min(1),
  url: z.string().min(1),
});

// Event Banner schemas
export const eventBannerEntrySchema = z.object({
  file_url: z.string().min(1),
  original_name: z.string().min(1),
});

export const eventBannersSchema = z.object({
  mobile: eventBannerEntrySchema.optional(),
  tablet: eventBannerEntrySchema.optional(),
  desktop: eventBannerEntrySchema.optional(),
}).default({});

// Event schemas
export const createEventSchema = z.object({
  event_slug: z.string().max(255).optional().nullable(),
  pwa_name: z.string().min(1).max(255),
  pwa_logo_url: z.string().optional().nullable(),
  event_name: z.string().min(1).max(255),
  event_banner_url: z.string().optional().nullable(),
  event_description: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  event_location: z.string().optional().nullable(),
  event_location_map_url: z.string().optional().nullable(),
  event_start_date: z.string(),
  event_end_date: z.string(),
  event_venue_map_url: z.string().optional().nullable(),
  event_app_url: z.string().optional().nullable(),
  wifi: z.array(wifiInfoSchema).default([]),
  helpdesk: z.array(helpdeskInfoSchema).default([]),
  venue_maps: z.array(venueMapInfoSchema).default([]),
  event_banners: eventBannersSchema.default({}),
  quick_links: z.array(quickLinkSchema).default([]),
  is_draft: z.boolean().default(true),
  manifest_url: z.string().optional().nullable(),
});

export const updateEventSchema = createEventSchema.partial();

// Speaker schemas
export const createSpeakerSchema = z.object({
  speaker_name: z.string().min(1).max(255),
  speaker_designation: z.string().optional().nullable(),
  speaker_about: z.string().optional().nullable(),
  speaker_image_url: z.string().optional().nullable(),
  speaker_occupation: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  teams: z.string().optional().nullable(),
});

export const updateSpeakerSchema = createSpeakerSchema.partial();

// Session Tag schemas
export const createSessionTagSchema = z.object({
  name: z.string().min(1).max(255),
});

export const updateSessionTagSchema = createSessionTagSchema.partial();

// Session Type schemas
export const createSessionTypeSchema = z.object({
  name: z.string().min(1).max(255),
});

export const updateSessionTypeSchema = createSessionTypeSchema.partial();

// Session schemas
export const createSessionSchema = z.object({
  event_id: z.coerce.number().int().positive(),
  session_name: z.string().min(1).max(255),
  session_description: z.string().optional().nullable(),
  session_date: z.string(),
  session_start_time: z.string(),
  session_end_time: z.string().optional().nullable(),
  session_tag: z.string().optional().nullable(),
  session_location: z.string().optional().nullable(),
  session_location_map_url: z.string().optional().nullable(),
  session_venue_map_url: z.string().optional().nullable(),
  is_generic: z.boolean().default(true),
  department: z.string().optional().nullable(),
  is_dept_generic: z.boolean().default(true),
  team: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  has_topics: z.boolean().default(false),
  survey_url: z.string().optional().nullable(),
  supporting_material_url: z.string().optional().nullable(),
});

export const updateSessionSchema = createSessionSchema.partial().omit({ event_id: true });

// Session Topic schemas
export const createSessionTopicSchema = z.object({
  name: z.string().min(1).max(255),
  location: z.string().optional().nullable(),
  session_type: z.string().optional().nullable(),
});

export const updateSessionTopicSchema = createSessionTopicSchema.partial();

// Session Speaker assignment schema
export const assignSpeakerSchema = z.object({
  speaker_id: z.coerce.number().int().positive(),
});

// Important Update schemas
export const createUpdateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  links: z.array(z.string()).optional().nullable(),
  update_date_time: z.string(),
});

export const updateUpdateSchema = createUpdateSchema.partial();

// Admin schemas
export const createAdminSchema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(6),
  department: z.string().optional().nullable(),
});

export const updateAdminSchema = z.object({
  email: z.string().email().optional(),
  department: z.string().optional().nullable(),
});

// Attendee schemas
export const createAttendeeSchema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(6),
  department: z.string().optional().nullable(),
  team: z.string().optional().nullable(),
});

export const updateAttendeeSchema = z.object({
  email: z.string().email().optional(),
  department: z.string().optional().nullable(),
  team: z.string().optional().nullable(),
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(1),
});

// Type exports from schemas
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateSpeakerInput = z.infer<typeof createSpeakerSchema>;
export type UpdateSpeakerInput = z.infer<typeof updateSpeakerSchema>;
export type CreateSessionTagInput = z.infer<typeof createSessionTagSchema>;
export type UpdateSessionTagInput = z.infer<typeof updateSessionTagSchema>;
export type CreateSessionTypeInput = z.infer<typeof createSessionTypeSchema>;
export type UpdateSessionTypeInput = z.infer<typeof updateSessionTypeSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type CreateSessionTopicInput = z.infer<typeof createSessionTopicSchema>;
export type UpdateSessionTopicInput = z.infer<typeof updateSessionTopicSchema>;
export type AssignSpeakerInput = z.infer<typeof assignSpeakerSchema>;
export type CreateUpdateInput = z.infer<typeof createUpdateSchema>;
export type UpdateUpdateInput = z.infer<typeof updateUpdateSchema>;
export type CreateAttendeeInput = z.infer<typeof createAttendeeSchema>;
export type UpdateAttendeeInput = z.infer<typeof updateAttendeeSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
