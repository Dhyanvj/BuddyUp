# Send Trip Reminders Edge Function

This function sends automatic reminders to trip participants:
- 24 hours before departure
- 1 hour before departure

## Setup

### 1. Deploy the Function

```bash
supabase functions deploy send-trip-reminders
```

### 2. Set Up Cron Job

In your Supabase Dashboard, go to **Database** > **Cron Jobs** (via pg_cron extension):

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run every hour
SELECT cron.schedule(
  'send-trip-reminders',
  '0 * * * *',  -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://[your-project-ref].supabase.co/functions/v1/send-trip-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [your-anon-key]'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Replace:
- `[your-project-ref]` with your Supabase project reference
- `[your-anon-key]` with your Supabase anon key

### Alternative: Use Supabase Cron

If pg_cron is not available, you can use an external cron service like:
- GitHub Actions (free)
- Vercel Cron
- AWS EventBridge
- Any cron service that can make HTTP requests

Example GitHub Actions workflow (`.github/workflows/trip-reminders.yml`):

```yaml
name: Send Trip Reminders
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            https://[your-project-ref].supabase.co/functions/v1/send-trip-reminders
```

## How It Works

1. Function runs every hour
2. Queries for trips departing in 23-24 hours
3. Queries for trips departing in 59-60 minutes
4. Creates notifications for all participants (including creator)
5. Edge Function `send-fcm-notification` automatically sends push notifications

## Testing

Test manually:

```bash
curl -X POST \
  -H "Authorization: Bearer [your-anon-key]" \
  -H "Content-Type: application/json" \
  https://[your-project-ref].supabase.co/functions/v1/send-trip-reminders
```

Or create a test trip departing in 24 hours and wait for the cron to run.

## Monitoring

Check the function logs:

```bash
supabase functions logs send-trip-reminders
```

Or in Dashboard: **Edge Functions** > **send-trip-reminders** > **Logs**

## Cost

- Edge Function: Free tier includes 500K invocations/month
- Running hourly = 720 invocations/month (well within free tier)

