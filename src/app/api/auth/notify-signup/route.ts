import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Email to receive signup notifications
const ADMIN_EMAIL = process.env.CONTACT_EMAIL || 'j83621235@gmail.com'

export async function POST(req: NextRequest) {
  try {
    const { email, fullName, userId } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'full',
      timeStyle: 'short'
    })

    // Send notification email to admin
    const { data, error } = await resend.emails.send({
      from: 'NIV Notifications <noreply@nivria.ai>',
      to: ADMIN_EMAIL,
      subject: `[NIV] New User Signup: ${fullName || email}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #c75d3a 0%, #a04830 100%); padding: 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px;">New User Registration</h2>
          </div>
          <div style="background: #fff; padding: 24px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; color: #666; font-size: 14px;">A new user has registered for NIV</p>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #666; width: 120px; border-bottom: 1px solid #eee;">Name:</td>
                <td style="padding: 12px 0; color: #1a1a1a; font-weight: 500; border-bottom: 1px solid #eee;">${fullName || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #666;">Email:</td>
                <td style="padding: 12px 0;">
                  <a href="mailto:${email}" style="color: #c75d3a; text-decoration: none;">${email}</a>
                </td>
              </tr>
              ${userId ? `
              <tr>
                <td style="padding: 12px 0; color: #666; border-top: 1px solid #eee;">User ID:</td>
                <td style="padding: 12px 0; color: #999; font-family: monospace; font-size: 12px; border-top: 1px solid #eee;">${userId}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 12px 0; color: #666; border-top: 1px solid #eee;">Registered:</td>
                <td style="padding: 12px 0; color: #1a1a1a; border-top: 1px solid #eee;">${timestamp}</td>
              </tr>
            </table>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 16px; text-align: center;">
            NIV User Registration Notification
          </p>
        </div>
      `,
      text: `
New User Registration

Name: ${fullName || 'Not provided'}
Email: ${email}
${userId ? `User ID: ${userId}` : ''}
Registered: ${timestamp}

---
NIV User Registration Notification
      `.trim()
    })

    if (error) {
      console.error('Failed to send signup notification:', error)
      // Don't fail the signup if notification fails
      return NextResponse.json({ success: false, error: 'Failed to send notification' })
    }

    console.log(`📧 Signup notification sent for ${email}, id: ${data?.id}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Signup notification error:', error)
    // Don't fail the signup if notification fails
    return NextResponse.json({ success: false, error: error.message })
  }
}
