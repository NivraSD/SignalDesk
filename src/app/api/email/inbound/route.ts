import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Email address to forward all inbound emails to
const FORWARD_TO_EMAIL = process.env.EMAIL_FORWARD_TO || 'jonleibo@me.com'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    // Resend webhook payload structure
    const { type, data } = payload

    if (type !== 'email.received') {
      return NextResponse.json({ message: 'Ignored event type' }, { status: 200 })
    }

    const { from, to, subject, html, text, attachments } = data

    console.log(`📧 Inbound email received:`)
    console.log(`   From: ${from}`)
    console.log(`   To: ${to}`)
    console.log(`   Subject: ${subject}`)

    // Build forwarded email content
    const forwardedHtml = `
      <div style="border-left: 3px solid #c75d3a; padding-left: 16px; margin-bottom: 20px; color: #666;">
        <p><strong>Forwarded email</strong></p>
        <p><strong>From:</strong> ${from}</p>
        <p><strong>To:</strong> ${Array.isArray(to) ? to.join(', ') : to}</p>
        <p><strong>Subject:</strong> ${subject}</p>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      ${html || `<pre style="white-space: pre-wrap;">${text}</pre>`}
    `

    const forwardedText = `
---------- Forwarded email ----------
From: ${from}
To: ${Array.isArray(to) ? to.join(', ') : to}
Subject: ${subject}
-------------------------------------

${text || 'No plain text content'}
    `.trim()

    // Forward the email
    const { data: sendData, error } = await resend.emails.send({
      from: 'NIV Mail <noreply@nivria.ai>',
      to: FORWARD_TO_EMAIL,
      subject: `[Fwd] ${subject}`,
      html: forwardedHtml,
      text: forwardedText,
      // Note: Attachments would need to be downloaded and re-attached
      // For now, we'll include a note if there are attachments
    })

    if (error) {
      console.error('Failed to forward email:', error)
      return NextResponse.json({ error: 'Failed to forward' }, { status: 500 })
    }

    console.log(`✅ Email forwarded to ${FORWARD_TO_EMAIL}, id: ${sendData?.id}`)

    // If there were attachments, log a note
    if (attachments && attachments.length > 0) {
      console.log(`   Note: ${attachments.length} attachment(s) not forwarded`)
    }

    return NextResponse.json({
      success: true,
      forwarded_to: FORWARD_TO_EMAIL,
      email_id: sendData?.id
    })
  } catch (error: any) {
    console.error('Email inbound webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Resend may send GET requests to verify the endpoint
export async function GET() {
  return NextResponse.json({ status: 'Email inbound webhook active' })
}
