-- Durable rate-limit events for serverless (replaces per-lambda in-memory Map)
create table if not exists public.rate_limit_buckets (
  id bigint generated always as identity primary key,
  bucket_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_buckets_key_created_idx
  on public.rate_limit_buckets (bucket_key, created_at desc);
