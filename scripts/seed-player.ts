/**
 * Temporary seed script for testing the Course Player.
 * Uses SUPABASE_SERVICE_ROLE_KEY (from .env.local or env).
 *
 * Run: npx tsx scripts/seed-player.ts
 * Or:  npm run seed:player
 */

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnvLocal() {
  const p = resolve(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  const raw = readFileSync(p, 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (add to .env.local).'
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Remote DBs that predate the rename still expose `created_by` instead of `owner_id`. */
function looksLikeMissingColumn(msg: string | undefined) {
  if (!msg) return false;
  return /schema cache|could not find|column.*does not exist|owner_id|created_by/i.test(
    msg
  );
}

async function main() {
  let ownerId = process.env.SEED_OWNER_ID?.trim();
  if (!ownerId) {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    if (error) {
      console.error('Could not load profiles:', error.message);
      process.exit(1);
    }
    if (!profiles?.length) {
      console.error(
        'No rows in profiles. Register a user first, or set SEED_OWNER_ID to a valid profiles.id UUID.'
      );
      process.exit(1);
    }
    ownerId = profiles[0].id;
    console.log('Using owner_id from first profile:', ownerId);
  }

  const courseRow = {
    title: 'Mastering AI SaaS in 2026',
    description:
      'Temporary seed course for testing the Course Player (scripts/seed-player.ts).',
    category: 'education',
    is_published: true,
  };

  let course: { id: string } | null = null;
  let courseError = null as { message: string } | null;

  const tryOwner = await supabase
    .from('courses')
    .insert({ ...courseRow, owner_id: ownerId })
    .select('id')
    .single();

  if (tryOwner.data && !tryOwner.error) {
    course = tryOwner.data;
  } else if (tryOwner.error && looksLikeMissingColumn(tryOwner.error.message)) {
    console.log(
      'Note: inserting with legacy column `created_by` (apply supabase/schema.sql on your project to use `owner_id`).'
    );
    const tryLegacy = await supabase
      .from('courses')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ ...courseRow, created_by: ownerId } as any)
      .select('id')
      .single();
    if (tryLegacy.data && !tryLegacy.error) {
      course = tryLegacy.data;
    } else {
      courseError = tryLegacy.error ?? tryOwner.error;
    }
  } else {
    courseError = tryOwner.error;
  }

  if (courseError || !course) {
    console.error('Failed to create course:', courseError?.message ?? courseError);
    process.exit(1);
  }

  const markdownLesson1 = `## The Foundation

Welcome to **Mastering AI SaaS in 2026**.

This lesson is free for everyone.

### What you will learn

- How modern AI products are packaged and sold
- Why distribution beats raw model quality in 2026
- A simple checklist before you write code

### Next steps

1. Define one *painful* problem for a narrow ICP  
2. Validate with 10 conversations  
3. Ship a thin slice in two weeks

> Ship weekly. Learn from users, not slides.
`;

  const lessonsWithPremium = [
    {
      course_id: course.id,
      title: 'The Foundation',
      content: markdownLesson1,
      video_url: null as string | null,
      duration_minutes: 12,
      sort_order: 0,
      is_premium: false,
    },
    {
      course_id: course.id,
      title: 'Secret Scaling Tactics',
      content:
        '**Premium only.** Watch the video below for the full playbook. These notes are intentionally short.',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration_minutes: 18,
      sort_order: 1,
      is_premium: true,
    },
  ];

  const insertLessons = await supabase.from('lessons').insert(lessonsWithPremium);
  let lessonsError = insertLessons.error;

  if (lessonsError && looksLikeMissingColumn(lessonsError.message)) {
    console.log(
      'Note: inserting lessons without `is_premium` (add column: alter table public.lessons add column if not exists is_premium boolean not null default false).'
    );
    const stripped = lessonsWithPremium.map(({ is_premium: _p, ...rest }) => rest);
    const retry = await supabase.from('lessons').insert(stripped);
    lessonsError = retry.error;
  }

  if (lessonsError) {
    console.error('Failed to create lessons:', lessonsError.message);
    process.exit(1);
  }

  const path = `/user/courses/${course.id}`;
  console.log('');
  console.log('Seed complete.');
  console.log('Course ID:', course.id);
  console.log('');
  console.log('Open locally (with npm run dev):');
  console.log(`  ${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}${path}`);
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
