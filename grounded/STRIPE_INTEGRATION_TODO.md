# Stripe integration — contributions

Grounded accepts contributions through **Hosted Stripe Checkout**: Settings → About → **Contribute** opens
`/api/contribute`, which creates a Checkout Session and redirects to a Stripe-hosted page where the person
enters their own amount. Stripe sends them back to Settings with a thank-you.

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**
- [api/contribute.ts](api/contribute.ts)
- [src/lib/constants.ts](src/lib/constants.ts)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| line_items[].price | `STRIPE_CONTRIBUTION_PRICE_ID` = `price_1UTO0SQvyjXbqyjm81qY1BcK` (**test mode**, "Donations for Grounded Project") | Create a **"Customer chooses what to pay"** Price in the Dashboard (Product catalog → Add product → Pricing: *Customer chooses price*; optionally set a suggested, minimum and maximum amount). For going live: create the same Price in **live** mode and replace the variable. |
| `STRIPE_SECRET_KEY` (Vercel) | test-mode key (`sk_test_...`) | For going live: replace with the live secret key (`sk_live_...`). |

Already set to real values (no change needed):

| Field | Value |
|-------|-------|
| mode | `payment` (one-time contribution) |
| success_url | `<site>/settings?contributed=1` (shows a thank-you) |
| cancel_url | `<site>/settings` |

**Status (2026-10-22): LIVE.** Production uses the live secret key and live Price `price_1UTPd3JAYGcueEzLEnkpMp2X` ("Donations for Grounded Project"). Preview deployments keep the test key and test Price `price_1UTO0SQvyjXbqyjm81qY1BcK`, so test builds never take real money. Vercel only reads these at build time: after changing a key, redeploy production.

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**
- [api/contribute.ts](api/contribute.ts)

| Parameter | Value |
|-----------|-------|
| ui_mode | `hosted_page` (Stripe SDK `stripe@^23`; versions below 21 would use `hosted`) |
| billing_address_collection | `auto` |
| phone_number_collection | `{ enabled: false }` |
| automatic_tax | `{ enabled: false }` |
| allow_promotion_codes | `false` |
| submit_type | `auto` |
| integration_identifier | `hosted_mobile_app_0001` |
| origin_context | `mobile_app` |

`payment_method_collection` is omitted on purpose: it only applies to `subscription` mode.

## Setup

1. **API keys.** In the Stripe Dashboard → Developers → API keys, copy the **secret key**. Add it to the Vercel
   project `grounded` as `STRIPE_SECRET_KEY` (Production and Preview). It is server-only — never prefix it with
   `VITE_` and never put it in code. No publishable key is needed: the redirect happens on the server.
2. **Price.** Create the "Customer chooses what to pay" Price (above) and add `STRIPE_CONTRIBUTION_PRICE_ID`
   to the same Vercel project.
3. **Turn the button on.** Set `CONTRIBUTE_URL = '/api/contribute'` in `src/lib/constants.ts`, then deploy.
4. **Dependency.** `stripe` (^23) is already in `package.json`.

Until `STRIPE_SECRET_KEY` is set, `/api/contribute` answers "Contributions are not set up yet." (503).

## Files

```
api/contribute.ts            # creates the Checkout Session, 303-redirects to Stripe
src/lib/constants.ts         # CONTRIBUTE_URL — shows/hides the button
src/components/settings/SettingsPage.tsx   # About: "Modest contributions go a long way." + thank-you
vercel.json                  # function config for api/contribute.ts
```

## How it works

1. The person taps **Contribute** in Settings → About.
2. `GET /api/contribute` creates a Checkout Session with the parameters above and redirects (303) to Stripe.
3. They choose an amount and pay on Stripe's hosted page.
4. Stripe returns them to `/settings?contributed=1`, which shows a short thank-you. Cancelling returns to `/settings`.

Nothing needs to be fulfilled, so no webhook is required. If you later want a record of contributions inside
Grounded (e.g. a thank-you email), add a webhook for `checkout.session.completed`.

## Testing

Use your **test-mode** secret key and a test-mode Price first. Test card: `4242 4242 4242 4242`, any future
expiry, any CVC, any postal code. A declined card: `4000 0000 0000 0002`. More:
https://docs.stripe.com/testing — then swap in the live key and live Price.

## Next steps

- Set a suggested amount on the Price (Stripe shows it as the default).
- Optionally change the receipt and statement descriptor in Stripe settings so contributions are recognizable.
- Optionally add a webhook if you want contributions recorded in Grounded.

## Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
