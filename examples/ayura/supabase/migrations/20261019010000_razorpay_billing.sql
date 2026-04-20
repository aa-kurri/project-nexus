-- ──────────────────────────────────────────────────────────────────────────────
-- S-PAY-RAZORPAY: Add Razorpay billing columns to tenant_subscriptions
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE tenant_subscriptions
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id text,
  ADD COLUMN IF NOT EXISTS razorpay_customer_id     text;

-- Index for webhook lookups by Razorpay subscription ID
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_rzp_sub
  ON tenant_subscriptions (razorpay_subscription_id)
  WHERE razorpay_subscription_id IS NOT NULL;

-- Index for webhook lookups by Razorpay customer ID
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_rzp_cust
  ON tenant_subscriptions (razorpay_customer_id)
  WHERE razorpay_customer_id IS NOT NULL;
