// Contributions: creates a Stripe Checkout Session (Stripe-hosted page) and redirects to it.
// The price is a "customer chooses what to pay" Price, so people enter their own amount.
// Setup and placeholders: see STRIPE_INTEGRATION_TODO.md.
import Stripe from 'stripe'

export async function GET(request: Request): Promise<Response> {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return new Response('Contributions are not set up yet.', { status: 503 })

  const stripe = new Stripe(secretKey) // API version left to the account default
  const origin = new URL(request.url).origin

  // One-time contribution.
  const mode = 'payment' as const

  const session = await stripe.checkout.sessions.create({
    // Configured in Checkout Studio
    ui_mode: 'hosted_page',
    billing_address_collection: 'auto',
    phone_number_collection: { enabled: false },
    automatic_tax: { enabled: false },
    allow_promotion_codes: false,
    submit_type: 'auto',
    integration_identifier: 'hosted_mobile_app_0001',
    origin_context: 'mobile_app',
    // App-specific (see STRIPE_INTEGRATION_TODO.md)
    mode,
    success_url: `${origin}/settings?contributed=1`,
    cancel_url: `${origin}/settings`,
    line_items: [{ price: process.env.STRIPE_CONTRIBUTION_PRICE_ID || 'price_...', quantity: 1 }],
  } as Stripe.Checkout.SessionCreateParams)

  if (!session.url) return new Response('Could not start checkout.', { status: 502 })
  return new Response(null, { status: 303, headers: { Location: session.url, 'Cache-Control': 'no-store' } })
}
