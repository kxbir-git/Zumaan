## Goal
Replace direct WhatsApp checkout with a scan-to-pay + screenshot-upload flow, admin review, payment confirmation email, and later tracking email.

## 1. Database
Migration adds:
- `orders` columns: `payment_screenshot_path` (text), `payment_status` (`pending` | `approved` | `rejected`), `reviewed_at`, `reviewed_by`, `reject_reason`, `tracking_carrier`, `tracking_number`, `tracking_added_at`, `customer_email`, `customer_name`, `shipping_address` (jsonb).
- `site_settings` table (single row): `payment_qr_path`, `payment_upi_id`, `payment_instructions` — readable by anyone, writable only by admins.
- RLS: users can read/insert their own orders; admins can read/update all (via `has_role(auth.uid(),'admin')`).

## 2. Storage
Two private buckets created via the storage tool:
- `payment-proofs` — user uploads their screenshot to `{userId}/{orderId}.jpg`. User can insert/read own; admins read all.
- `site-assets` — admin uploads the static QR image; public read so checkout can display it.

## 3. Checkout (`/checkout`)
New route. Requires sign-in. Shows: order summary, name + email + shipping address form, the admin-uploaded QR image + UPI ID + instructions, a screenshot upload field. On submit: creates order with `payment_status='pending'`, uploads screenshot, clears cart, redirects to `/orders/{id}` with a "We're reviewing your payment" state. The existing WhatsApp button is removed from the cart drawer; the drawer "Checkout" now routes here.

## 4. Admin
- Role: first run needs you (the project owner) seeded as admin. I'll add a one-time server fn `claimFirstAdmin` that grants admin only if zero admins exist yet — safe to leave in place.
- Pages under `/_authenticated/admin/`:
  - `/admin/orders` — list pending orders with screenshot preview, customer details, items, total. Buttons: **Approve** (sends payment-confirmation email), **Reject** (with reason, sends rejection email).
  - `/admin/orders/$id` — order detail with **Add tracking** form (carrier + tracking #) → sends tracking email.
  - `/admin/settings` — upload payment QR + edit UPI ID + instructions.
- Header gets an "Admin" link visible only to admins.

## 5. Emails
Three templates via Lovable's built-in emails (you confirmed you have a domain):
- `payment-confirmed` — "Payment approved, we're preparing your order" + order summary.
- `payment-rejected` — reason + how to retry.
- `tracking-added` — carrier, tracking #, and a tracking link if carrier is recognized.

I'll trigger the email setup dialog now so we can scaffold the templates on your domain. Each email is sent server-side from the approve/tracking server functions with an idempotency key.

## Technical notes
- All writes go through `createServerFn` + `requireSupabaseAuth`. Admin-only fns check `has_role(userId,'admin')` before doing anything.
- Email sender uses `/lovable/email/transactional/send` with the user's bearer; idempotency keys prevent dupes on retry.
- Screenshots are validated server-side: max 5 MB, jpeg/png/webp only.

## Open question
You said "I have a domain ready" for email. After you confirm this plan, I'll open the email setup dialog so you can enter that domain and add the DNS records — the rest is automatic.