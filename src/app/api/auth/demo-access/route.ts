import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.CONTACT_EMAIL || 'j83621235@gmail.com'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    // Simple token gate — not a password, just prevents bots/crawlers
    if (token !== 'palantir-fellowship-2026') {
      return NextResponse.json({ error: 'Invalid access' }, { status: 403 })
    }

    const supabase = createServiceClient()

    const email = 'trial@palantir.com'

    // Generate a magic link for the demo user
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (error) {
      console.error('Magic link generation error:', error)
      return NextResponse.json({ error: 'Failed to generate access link' }, { status: 500 })
    }

    // The hashed_token and type can be used with the existing callback
    const properties = data?.properties
    const hashedToken = properties?.hashed_token

    if (!hashedToken) {
      return NextResponse.json({ error: 'No token generated' }, { status: 500 })
    }

    // Notify admin (fire and forget)
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'full',
      timeStyle: 'short'
    })

    resend.emails.send({
      from: 'NIV Notifications <noreply@nivria.ai>',
      to: ADMIN_EMAIL,
      subject: '[NIV] Palantir Demo Accessed',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #c75d3a 0%, #a04830 100%); padding: 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Palantir Demo Access</h2>
          </div>
          <div style="background: #fff; padding: 24px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 16px; color: #1a1a1a; font-size: 15px;">
              Someone just clicked <strong>Enter Dashboard</strong> on the Palantir fellowship demo page.
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #666; width: 120px; border-bottom: 1px solid #eee;">Account:</td>
                <td style="padding: 12px 0; color: #1a1a1a; font-weight: 500; border-bottom: 1px solid #eee;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #666;">Time:</td>
                <td style="padding: 12px 0; color: #1a1a1a;">${timestamp}</td>
              </tr>
            </table>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 16px; text-align: center;">
            NIV Demo Access Notification
          </p>
        </div>
      `,
      text: `Palantir Demo Accessed\n\nAccount: ${email}\nTime: ${timestamp}`
    }).catch(err => console.error('Demo notification email failed:', err))

    return NextResponse.json({
      redirect: `/auth/callback?token_hash=${hashedToken}&type=magiclink&next=/dashboard`
    })
  } catch (err) {
    console.error('Demo access error:', err)
    return NextResponse.json({ error: 'Access failed' }, { status: 500 })
  }
}
