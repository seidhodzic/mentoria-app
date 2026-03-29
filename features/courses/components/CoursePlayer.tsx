'use client';

import DashboardHeader from '@/components/layout/DashboardHeader';
import { markLessonComplete, recordLessonView } from '@/features/courses/actions/progress';
import { toYouTubeEmbedUrl } from '@/features/courses/lib/video-embed';
import type { Tables } from '@/types/supabase';
import {
  Check,
  ChevronRight,
  Circle,
  List,
  Lock,
  Maximize2,
  Minimize2,
  PanelLeftClose,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

const COURSE_NAV = [{ label: '← Courses', href: '/user/courses' }];

/** YouTube iframe `allow` list (Permissions-Policy delegation). */
const VIDEO_IFRAME_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

type LessonRow = Tables<'lessons'>;
type ProgressRow = Tables<'progress'>;

function LessonVideo({ src, title }: { src: string; title: string }) {
  const embedSrc = useMemo(() => toYouTubeEmbedUrl(src), [src]);
  const [loaded, setLoaded] = useState(false);
  const [inFullscreen, setInFullscreen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoaded(false);
  }, [embedSrc]);

  useEffect(() => {
    const onFs = () => {
      const el = shellRef.current;
      setInFullscreen(!!el && document.fullscreenElement === el);
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  function toggleFullscreen() {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen().catch(() => {});
    }
  }

  return (
    <div className="relative w-full max-w-4xl overflow-hidden rounded-sm bg-black shadow-lg ring-1 ring-black/10">
      <div
        ref={shellRef}
        className="relative aspect-video w-full bg-black"
      >
        {!loaded && (
          <div
            className="absolute inset-0 z-10 flex animate-pulse flex-col items-center justify-center gap-3 bg-[#19353E]/92"
            aria-hidden
          >
            <div className="app-route-spinner" />
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--gold)] opacity-90">
              Loading video…
            </span>
          </div>
        )}
        <iframe
          src={embedSrc}
          className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          allow={VIDEO_IFRAME_ALLOW}
          allowFullScreen
          title={title}
          onLoad={() => setLoaded(true)}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 right-2 z-30 flex pointer-events-auto">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-2 rounded-sm border border-white/20 bg-black/55 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-white backdrop-blur-sm transition-colors hover:bg-black/75"
            aria-pressed={inFullscreen}
          >
            {inFullscreen ? (
              <Minimize2 className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Maximize2 className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {inFullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LessonTypography({
  content,
  hasVideo,
}: {
  content: string;
  hasVideo: boolean;
}) {
  return (
    <div
      className={`markdown-lesson max-w-none rounded-sm border border-[rgba(25,53,62,0.08)] bg-white px-5 py-8 shadow-sm md:px-10 md:py-10 ${
        hasVideo ? 'mt-6' : ''
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          iframe: (props) => (
            <span className="my-4 block aspect-video w-full overflow-hidden rounded-sm bg-black">
              <iframe
                {...props}
                className="h-full w-full border-0"
                title={typeof props.title === 'string' ? props.title : 'Embedded content'}
              />
            </span>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function CoursePlayer({
  course,
  lessons,
  initialProgress,
  subscriptionActive,
}: {
  course: Tables<'courses'>;
  lessons: LessonRow[];
  initialProgress: ProgressRow[];
  subscriptionActive: boolean;
}) {
  const sortedLessons = useMemo(
    () =>
      [...lessons].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    [lessons]
  );

  const [progress, setProgress] = useState<ProgressRow[]>(initialProgress);
  const [activeId, setActiveId] = useState<string | null>(
    sortedLessons[0]?.id ?? null
  );

  useEffect(() => {
    setProgress(initialProgress);
  }, [initialProgress]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const viewSent = useRef<Set<string>>(new Set());

  const completedByLesson = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const p of progress) {
      if (p.completed) m.set(p.lesson_id, true);
    }
    return m;
  }, [progress]);

  const active = useMemo(
    () => sortedLessons.find((l) => l.id === activeId) ?? null,
    [sortedLessons, activeId]
  );

  const completedCount = sortedLessons.filter((l) =>
    completedByLesson.get(l.id)
  ).length;
  const pct =
    sortedLessons.length > 0
      ? Math.round((completedCount / sortedLessons.length) * 100)
      : 0;

  const isLocked = useCallback(
    (lesson: LessonRow) => lesson.is_premium && !subscriptionActive,
    [subscriptionActive]
  );

  useEffect(() => {
    if (!active || isLocked(active)) return;
    if (viewSent.current.has(active.id)) return;
    viewSent.current.add(active.id);
    void recordLessonView(active.id, course.id);
  }, [active, course.id, isLocked]);

  async function handleComplete() {
    if (!active || isLocked(active)) return;
    startTransition(async () => {
      const res = await markLessonComplete(active.id, course.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setProgress((prev) => {
        const rest = prev.filter((p) => p.lesson_id !== res.progress.lesson_id);
        return [...rest, res.progress];
      });
      toast.success('Progress saved!');
    });
  }

  function selectLesson(l: LessonRow) {
    setActiveId(l.id);
    setDrawerOpen(false);
  }

  const lessonIndex = active
    ? sortedLessons.findIndex((l) => l.id === active.id) + 1
    : 0;
  const nextLesson = active
    ? sortedLessons[sortedLessons.findIndex((l) => l.id === active.id) + 1]
    : null;

  const sidebarBody = (
    <>
      <div className="border-b border-[rgba(25,53,62,0.08)] px-5 pb-4 pt-1">
        <div className="mb-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[var(--gold)]">
          {course.category ?? 'Course'}
        </div>
        <div className="font-condensed text-base font-black uppercase leading-tight text-[var(--teal)]">
          {course.title}
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-sm bg-[rgba(25,53,62,0.08)]">
          <div
            className="h-full rounded-sm bg-[var(--gold)] transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 text-[0.65rem] text-[var(--text-muted)]">
          {pct}% complete · {completedCount}/{sortedLessons.length} lessons
        </div>
      </div>
      <nav
        className="flex max-h-[min(60vh,520px)] flex-col gap-0.5 overflow-y-auto overscroll-contain px-2 py-3 md:max-h-[calc(100vh-12rem)]"
        aria-label="Lessons"
      >
        {sortedLessons.map((l, i) => {
          const done = completedByLesson.get(l.id) ?? false;
          const isActive = active?.id === l.id;
          const locked = isLocked(l);
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => selectLesson(l)}
              className={`flex w-full items-start gap-3 rounded-sm px-3 py-2.5 text-left transition-colors ${
                isActive
                  ? 'bg-[rgba(247,188,21,0.12)] ring-1 ring-[rgba(247,188,21,0.35)]'
                  : 'hover:bg-[rgba(25,53,62,0.04)]'
              }`}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                {locked ? (
                  <Lock className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                ) : done ? (
                  <Check
                    className="h-4 w-4 text-[#276749]"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                ) : (
                  <Circle className="h-4 w-4 text-[rgba(25,53,62,0.25)]" aria-hidden />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.68rem] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  Lesson {i + 1}
                  {locked ? ' · Premium' : ''}
                </span>
                <span
                  className={`mt-0.5 block text-[0.84rem] leading-snug ${
                    isActive
                      ? 'font-bold text-[var(--teal)]'
                      : 'font-medium text-[rgba(25,53,62,0.78)]'
                  }`}
                >
                  {l.title}
                </span>
                {l.duration_minutes != null && (
                  <span className="mt-1 block text-[0.65rem] text-[var(--text-muted)]">
                    {l.duration_minutes} min
                  </span>
                )}
              </span>
              <ChevronRight
                className={`mt-1 h-4 w-4 shrink-0 text-[rgba(25,53,62,0.2)] ${
                  isActive ? 'text-[var(--gold)]' : ''
                }`}
                aria-hidden
              />
            </button>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="dash-layout flex min-h-screen flex-col">
      <DashboardHeader navItems={COURSE_NAV} activeNav="/user/courses">
        <div className="text-[0.72rem] font-semibold text-[rgba(255,255,255,0.65)]">
          {completedCount}/{sortedLessons.length} · {pct}%
        </div>
      </DashboardHeader>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="hidden w-[280px] shrink-0 flex-col border-r border-[rgba(25,53,62,0.08)] bg-white md:flex">
          {sidebarBody}
        </aside>

        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--light)]">
          <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[rgba(25,53,62,0.08)] bg-white px-4 py-3 md:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 rounded-sm border border-[rgba(25,53,62,0.12)] bg-[rgba(25,53,62,0.03)] px-3 py-2 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[var(--teal)]"
            >
              <List className="h-4 w-4" aria-hidden />
              Lessons
            </button>
            <span className="text-[0.7rem] font-semibold text-[var(--text-muted)]">
              {pct}% done
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-10">
            {!active ? (
              <div className="empty-state">
                <h3>No lessons yet</h3>
                <p>Content will appear here once lessons are published.</p>
              </div>
            ) : isLocked(active) ? (
              <div className="mx-auto max-w-lg rounded-sm border border-[rgba(247,188,21,0.35)] bg-white px-8 py-14 text-center shadow-md">
                <Lock
                  className="mx-auto mb-4 h-12 w-12 text-[var(--gold)]"
                  strokeWidth={1.25}
                  aria-hidden
                />
                <h2 className="mb-2 font-condensed text-xl uppercase text-[var(--teal)]">
                  Premium lesson
                </h2>
                <p className="text-[0.92rem] text-[rgba(25,53,62,0.65)]">
                  An active subscription is required to access this lesson. Upgrade
                  your plan to unlock the full course.
                </p>
              </div>
            ) : (
              <>
                <div className="mx-auto max-w-3xl">
                  <div className="mb-6">
                    <div className="mb-2 flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[var(--gold)]">
                      <span className="inline-block h-0.5 w-5 bg-[var(--gold)]" />
                      Lesson {lessonIndex}
                    </div>
                    <h1 className="mb-2 font-condensed text-[clamp(1.4rem,3vw,2rem)] font-black uppercase leading-tight text-[var(--teal)]">
                      {active.title}
                    </h1>
                    {active.duration_minutes != null && (
                      <p className="text-[0.8rem] font-semibold text-[var(--text-muted)]">
                        {active.duration_minutes} min
                      </p>
                    )}
                  </div>

                  {active.video_url ? (
                    <LessonVideo src={active.video_url} title={active.title} />
                  ) : null}

                  {active.content?.trim() ? (
                    <LessonTypography
                      content={active.content}
                      hasVideo={!!active.video_url}
                    />
                  ) : !active.video_url ? (
                    <p className="rounded-sm border border-dashed border-[rgba(25,53,62,0.15)] bg-white/80 px-6 py-10 text-center text-[0.9rem] text-[var(--text-muted)]">
                      No video or text for this lesson yet.
                    </p>
                  ) : null}

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    {completedByLesson.get(active.id) ? (
                      <span className="inline-flex items-center gap-2 rounded-sm bg-[rgba(56,161,105,0.12)] px-4 py-2 text-[0.82rem] font-bold text-[#276749]">
                        <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                        Lesson complete
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleComplete}
                        disabled={pending}
                        className="btn btn-primary disabled:opacity-60"
                      >
                        {pending ? 'Saving…' : 'Mark as complete'}
                      </button>
                    )}
                    {nextLesson && !isLocked(nextLesson) && (
                      <button
                        type="button"
                        onClick={() => selectLesson(nextLesson)}
                        className="btn btn-outline"
                      >
                        Next lesson →
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {drawerOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[200] bg-[rgba(13,34,41,0.5)] md:hidden"
            aria-label="Close lessons menu"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 top-0 z-[201] flex w-[min(100vw,320px)] flex-col bg-white shadow-2xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Lessons"
          >
            <div className="flex items-center justify-between border-b border-[rgba(25,53,62,0.08)] px-4 py-3">
              <span className="font-condensed text-sm font-black uppercase tracking-[0.12em] text-[var(--teal)]">
                Course outline
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-sm p-2 text-[var(--teal)] hover:bg-[rgba(25,53,62,0.06)]"
                aria-label="Close"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{sidebarBody}</div>
          </div>
        </>
      )}
    </div>
  );
}
