CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_own_select" ON public.push_subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "push_own_insert" ON public.push_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "push_own_update" ON public.push_subscriptions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "push_own_delete" ON public.push_subscriptions FOR DELETE USING (user_id = auth.uid());
