/**
 * Generate a URL-safe slug from a title string.
 * Handles unicode, special characters, and deduplication via optional suffix.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')           // remove smart quotes
    .replace(/[&]/g, 'and')         // & -> and
    .replace(/[^\w\s-]/g, '')       // remove non-word chars (except spaces/hyphens)
    .replace(/[\s_]+/g, '-')        // spaces/underscores -> hyphens
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .replace(/^-+|-+$/g, '')        // trim leading/trailing hyphens
    .slice(0, 280)                  // keep under 300 with room for dedup suffix
}

/**
 * Generate a URL-safe slug for an organization name.
 */
export function generateOrgSlug(name: string): string {
  return generateSlug(name)
}
