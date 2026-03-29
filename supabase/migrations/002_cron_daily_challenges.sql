-- ============================================================
-- Migration: 002_cron_daily_challenges.sql
-- Agenda a geração automática de desafios diários via pg_cron
-- ============================================================
--
-- ANTES DE EXECUTAR:
-- 1. Habilite pg_cron e pg_net no Supabase Dashboard:
--    Settings → Database → Extensions → ative pg_cron e pg_net
--
-- 2. Substitua os placeholders abaixo:
--    - YOUR_PROJECT_REF  → encontre em Settings > General (ex: abcdefghijklmnop)
--    - YOUR_SERVICE_ROLE_KEY → encontre em Settings > API > service_role key
--
-- 3. Execute este SQL no SQL Editor do Supabase
-- ============================================================

-- Remover job anterior se existir
SELECT cron.unschedule('generate-daily-challenges')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-challenges'
);

-- Agendar às 03:00 UTC = 00:00 BRT
SELECT cron.schedule(
  'generate-daily-challenges',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url        := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-daily-challenges',
    headers    := '{"Content-Type": "application/json"}'::jsonb,
    body       := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Verificar que foi agendado
SELECT jobname, schedule, command
FROM cron.job
WHERE jobname = 'generate-daily-challenges';
