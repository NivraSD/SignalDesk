// Notify on New User Registration
// Triggered by database webhook on auth.users INSERT

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NOTIFY_EMAIL = 'jl@nivria.ai';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const payload = await req.json();

    // Supabase webhook sends: { type, table, record, schema, old_record }
    const { type, record } = payload;

    if (type !== 'INSERT' || !record) {
      return new Response(JSON.stringify({ message: 'Not a new user insert' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userEmail = record.email || 'Unknown';
    const createdAt = record.created_at ? new Date(record.created_at).toLocaleString() : 'Unknown';
    const userId = record.id || 'Unknown';

    // Send notification via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SignalDesk <notifications@nivria.ai>',
        to: NOTIFY_EMAIL,
        subject: `New SignalDesk User: ${userEmail}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New User Registration</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>User ID:</strong> ${userId}</p>
              <p><strong>Registered:</strong> ${createdAt}</p>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              This is an automated notification from SignalDesk.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    console.log(`Notification sent for new user: ${userEmail}`);

    return new Response(JSON.stringify({ success: true, user: userEmail }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
