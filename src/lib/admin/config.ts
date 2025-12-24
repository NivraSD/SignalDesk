// Platform Admin Configuration
// Add email addresses of users who should have admin access

export const PLATFORM_ADMIN_EMAILS = [
  'j83621235@gmail.com',
  'jonathan@nivria.com',
  'jon@nivria.com',
  'jl@nivria.ai',
  // Add more admin emails as needed
]

export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return PLATFORM_ADMIN_EMAILS.includes(email.toLowerCase())
}
