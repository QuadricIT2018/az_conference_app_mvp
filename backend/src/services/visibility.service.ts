import { query } from '../config/database.js';

interface VisibilityParams {
  eventId?: number;
  eventSlug?: string;
  userId: number;
  department: string | null;
  team: string | null;
  date?: string;
  favouritesOnly?: boolean;
}

/**
 * Parse the department field which can be:
 * - null → no department set
 * - "ALL" → all departments
 * - "BREAST" → single department
 * - "BREAST,G1,LUNG" → multiple departments
 */
function parseDepartments(department: string | null): { isAll: boolean; departments: string[] } {
  if (!department) return { isAll: false, departments: [] };
  if (department.toUpperCase() === 'ALL') return { isAll: true, departments: [] };
  return { isAll: false, departments: department.split(',').map(d => d.trim()).filter(Boolean) };
}

/**
 * Get sessions visible to a specific user based on visibility rules:
 * - is_generic = true: visible to all
 * - is_generic = false + department: visible to users in that department
 * - is_dept_generic = false + team: visible only to users in that team
 */
export async function getVisibleSessions(params: VisibilityParams) {
  const { eventId, eventSlug, userId, department, team, date, favouritesOnly } = params;

  let sql = `
    SELECT s.*,
           e.event_slug, e.event_name,
           CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favourite
    FROM sessions s
    JOIN events e ON s.event_id = e.id
    LEFT JOIN user_favourite_sessions f ON s.id = f.session_id AND f.user_id = $1
    WHERE e.is_draft = false
  `;

  const queryParams: (string | number | string[] | null)[] = [userId];
  let paramIndex = 2;

  // Filter by event (by ID or slug)
  if (eventId) {
    sql += ` AND s.event_id = $${paramIndex}`;
    queryParams.push(eventId);
    paramIndex++;
  } else if (eventSlug) {
    sql += ` AND e.event_slug = $${paramIndex}`;
    queryParams.push(eventSlug);
    paramIndex++;
  }

  // Filter by date
  if (date) {
    sql += ` AND s.session_date = $${paramIndex}`;
    queryParams.push(date);
    paramIndex++;
  }

  // Apply visibility rules
  const { isAll, departments } = parseDepartments(department);

  if (!isAll && departments.length > 0) {
    // User belongs to specific department(s) — show generic + matching department sessions
    sql += ` AND (
      s.is_generic = true
      OR (s.is_generic = false AND s.department = ANY($${paramIndex}::text[]))
      OR (s.is_generic = false AND s.is_dept_generic = false AND s.department = ANY($${paramIndex}::text[]) AND s.team = $${paramIndex + 1})
    )`;
    queryParams.push(departments, team);
    paramIndex += 2;
  }
  // If isAll or no departments set → show all sessions (no department filter)

  // Filter favourites only
  if (favouritesOnly) {
    sql += ` AND f.id IS NOT NULL`;
  }

  sql += ` ORDER BY s.session_date, s.session_start_time`;

  const result = await query(sql, queryParams);
  return result.rows;
}

/**
 * Get a single session with visibility check
 */
export async function getSessionWithVisibilityCheck(
  sessionId: number,
  userId: number,
  department: string | null,
  team: string | null
) {
  let sql = `
    SELECT s.*,
           e.event_slug, e.event_name,
           CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favourite
    FROM sessions s
    JOIN events e ON s.event_id = e.id
    LEFT JOIN user_favourite_sessions f ON s.id = f.session_id AND f.user_id = $1
    WHERE s.id = $2
  `;

  const params: (string | number | string[] | null)[] = [userId, sessionId];

  const { isAll, departments } = parseDepartments(department);

  if (!isAll && departments.length > 0) {
    sql += ` AND (
      s.is_generic = true
      OR (s.is_generic = false AND s.department = ANY($3::text[]))
      OR (s.is_generic = false AND s.is_dept_generic = false AND s.department = ANY($3::text[]) AND s.team = $4)
    )`;
    params.push(departments, team);
  }

  const result = await query(sql, params);
  return result.rows[0] || null;
}

/**
 * Get session dates for an event (for date picker)
 */
export async function getSessionDates(
  eventSlug: string,
  _userId: number,
  department: string | null,
  team: string | null
): Promise<string[]> {
  let sql = `
    SELECT DISTINCT s.session_date
    FROM sessions s
    JOIN events e ON s.event_id = e.id
    WHERE e.event_slug = $1
      AND e.is_draft = false
  `;

  const params: (string | string[] | null)[] = [eventSlug];

  const { isAll, departments } = parseDepartments(department);

  if (!isAll && departments.length > 0) {
    sql += ` AND (
      s.is_generic = true
      OR (s.is_generic = false AND s.department = ANY($2::text[]))
      OR (s.is_generic = false AND s.is_dept_generic = false AND s.department = ANY($2::text[]) AND s.team = $3)
    )`;
    params.push(departments, team);
  }

  sql += ` ORDER BY s.session_date`;

  const result = await query(sql, params);
  return result.rows.map(row => row.session_date);
}
