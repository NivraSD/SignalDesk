import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Email to receive contact form submissions
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'j83621235@gmail.com'

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // Send email notification
    const { data, error } = await resend.emails.send({
      from: 'NIV Contact <noreply@nivria.ai>',
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `[NIV Contact] ${company ? `${company} - ` : ''}${name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a1a1a; padding: 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: #faf9f7; margin: 0; font-size: 20px;">New Contact Form Submission</h2>
          </div>
          <div style="background: #fff; padding: 24px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 100px;">Name:</td>
                <td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Email:</td>
                <td style="padding: 8px 0;">
                  <a href="mailto:${email}" style="color: #c75d3a;">${email}</a>
                </td>
              </tr>
              ${company ? `
              <tr>
                <td style="padding: 8px 0; color: #666;">Company:</td>
                <td style="padding: 8px 0; color: #1a1a1a;">${company}</td>
              </tr>
              ` : ''}
            </table>
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
              <p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">Message:</p>
              <p style="color: #1a1a1a; margin: 0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 16px; text-align: center;">
            Sent from nivria.ai contact form
          </p>
        </div>
      `,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
${company ? `Company: ${company}` : ''}

Message:
${message}

---
Sent from nivria.ai contact form
      `.trim()
    })

    if (error) {
      console.error('Failed to send contact email:', error)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    console.log(`✅ Contact form submission from ${name} <${email}>, id: ${data?.id}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
