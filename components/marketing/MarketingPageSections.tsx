import {
  Award,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Globe,
  GraduationCap,
  ShieldCheck,
  Star,
  Trophy,
} from 'lucide-react';
import longArticlesEnJson from '@/lib/marketing-long-articles-en.json';
import { mktAsset } from '@/lib/mkt-assets';
import { ArticlesSection } from './MarketingArticles';
import type { ArticleTab, Lang } from './types';

export type { ArticleTab, Lang } from './types';

type LongEnKey = keyof typeof longArticlesEnJson;

function H({ html }: { html: string }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Achievement row icons (order matches sab-badge1…6 / jas-badge1…6 translation keys). */
const SAB_ACHIEVEMENT_ICONS = [
  Trophy,
  Star,
  ShieldCheck,
  Trophy,
  Award,
  Briefcase,
] as const;
const JAS_ACHIEVEMENT_ICONS = [
  ShieldCheck,
  Briefcase,
  GraduationCap,
  GraduationCap,
  GraduationCap,
  Globe,
] as const;

export type MarketingPageSectionsProps = {
  lang: Lang;
  t: (k: string) => string;
  articleTab: ArticleTab;
  setArticleTab: (v: ArticleTab) => void;
  expandedArticles: Record<string, boolean>;
  toggleArticle: (id: string) => void;
  articleLabels: (open: boolean) => string;
  sabrinaOpen: boolean;
  setSabrinaOpen: (v: boolean) => void;
  jasmilaOpen: boolean;
  setJasmilaOpen: (v: boolean) => void;
  profileBtn: (open: boolean) => string;
  showCard: (cat: string) => boolean;
  longEnHtml: (key: LongEnKey) => string;
  longHrHtml: (key: string) => string;
  openGallery: (kind: 'lj' | 'hvd', i: number) => void;
  contactMailto: string;
};

export function MarketingPageSections(p: MarketingPageSectionsProps) {
  const {
    lang,
    t,
    articleTab,
    setArticleTab,
    expandedArticles: ex,
    toggleArticle,
    articleLabels,
    sabrinaOpen,
    setSabrinaOpen,
    jasmilaOpen,
    setJasmilaOpen,
    profileBtn,
    showCard,
    longEnHtml,
    longHrHtml,
    openGallery,
    contactMailto,
  } = p;

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow" id="t-hero-tag">
            <H html={t('t-hero-tag')} />
          </div>
          <h1 className="hero-title" id="t-hero-h1">
            <H html={t('t-hero-h1')} />
          </h1>
          <p className="hero-desc" id="t-hero-sub">
            {t('t-hero-sub')}
          </p>
          <div className="hero-btns">
            <a className="btn-primary" href="#services" id="t-hero-btn1">
              <H html={t('t-hero-btn1')} />
            </a>
            <a className="btn-outline" href="#about" id="t-hero-btn2">
              <H html={t('t-hero-btn2')} />
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-num">3</div>
              <div className="stat-label" id="t-hero-stat1">
                <H html={t('t-hero-stat1')} />
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-num" id="t-stat-15">
                15+
              </div>
              <div className="stat-label" id="t-hero-stat2">
                <H html={t('t-hero-stat2')} />
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-num" id="t-hero-stat-balkans">
                <H html={t('t-hero-stat-balkans')} />
              </div>
              <div className="stat-label" id="t-hero-stat3">
                <H html={t('t-hero-stat3')} />
              </div>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-cards">
            <div className="hcard">
              <div className="hcard-icon">
                <svg
                  fill="none"
                  height={36}
                  width={36}
                  viewBox="0 0 44 44"
                  stroke="#F7BC15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                >
                  <circle cx={22} cy={22} r={14} />
                  <polygon fill="#F7BC15" points="22,10 26,14 24,19 20,19 18,14" />
                  <polygon fill="#F7BC15" points="13,17 17,15 20,19 18,23 13,22" />
                  <polygon fill="#F7BC15" points="22,34 19,30 21,26 25,26 27,30" />
                </svg>
              </div>
              <div className="hcard-title" id="hcard1-title">
                <H html={t('hcard1-title')} />
              </div>
              <div className="hcard-desc" id="hcard1-desc">
                <H html={t('hcard1-desc')} />
              </div>
            </div>
            <div className="hcard">
              <div className="hcard-icon">
                <svg
                  fill="none"
                  height={36}
                  width={36}
                  viewBox="0 0 44 44"
                  stroke="#F7BC15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                >
                  <polyline points="6,34 14,22 20,28 28,14 38,8" />
                  <polyline points="32,8 38,8 38,14" />
                </svg>
              </div>
              <div className="hcard-title" id="hcard2-title">
                <H html={t('hcard2-title')} />
              </div>
              <div className="hcard-desc" id="hcard2-desc">
                <H html={t('hcard2-desc')} />
              </div>
            </div>
            <div className="hcard span2">
              <div className="hcard-icon">
                <svg
                  fill="none"
                  height={36}
                  width={36}
                  viewBox="0 0 44 44"
                  stroke="#F7BC15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                >
                  <path d="M22 8 C18 6,8 6,6 8 L6 34 C8 32,18 32,22 34 C26 32,36 32,38 34 L38 8 C36 6,26 6,22 8Z" />
                  <line x1={22} x2={22} y1={8} y2={34} />
                  <line x1={10} x2={20} y1={15} y2={15} />
                  <line x1={10} x2={20} y1={20} y2={20} />
                  <line x1={10} x2={20} y1={25} y2={25} />
                  <line x1={24} x2={34} y1={15} y2={15} />
                  <line x1={24} x2={34} y1={20} y2={20} />
                  <line x1={24} x2={34} y1={25} y2={25} />
                </svg>
              </div>
              <div className="hcard-title" id="hcard3-title">
                <H html={t('hcard3-title')} />
              </div>
              <div className="hcard-desc" id="hcard3-desc">
                <H html={t('hcard3-desc')} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pillars" id="services">
        <div className="section-label" id="t-pillars-tag">
          <H html={t('t-pillars-tag')} />
        </div>
        <h2 className="section-title" id="t-pillars-h2">
          <H html={t('t-pillars-h2')} />
        </h2>
        <p className="section-sub" id="t-pillars-sub">
          {t('t-pillars-sub')}
        </p>
        <div className="pillars-grid">
          <div className="pillar" id="sports">
            <span className="pillar-num">01</span>
            <div className="pillar-icon">
              <svg fill="#F7BC15" height={44} width={44} viewBox="0 0 44 44">
                <circle cx={22} cy={22} fill="none" r={18} stroke="#F7BC15" strokeWidth={2.5} />
                <polygon points="22,10 26,14 24,19 20,19 18,14" />
                <polygon points="11,18 15,16 18,20 16,24 11,23" />
                <polygon points="11,26 16,25 18,29 15,33 10,30" />
                <polygon points="22,34 19,30 21,26 25,26 27,30" />
                <polygon points="33,26 28,25 26,29 29,33 34,30" />
                <polygon points="33,18 29,16 26,20 28,24 33,23" />
              </svg>
            </div>
            <div className="pillar-title" id="t-pillar1-title">
              <H html={t('t-pillar1-title')} />
            </div>
            <p className="pillar-desc" id="t-pillar1-body">
              {t('t-pillar1-body')}
            </p>
            <div className="pillar-tags !flex !flex-wrap gap-2">
              {(['pt1-tag1', 'pt1-tag2', 'pt1-tag3', 'pt1-tag4', 'pt1-tag5', 'pt1-tag6', 'pt1-tag7', 'pt1-tag8'] as const).map(
                (k) => (
                  <span
                    key={k}
                    className="tag !inline-flex items-center gap-2"
                    id={k}
                  >
                    <CheckCircle2
                      className="h-5 w-5 flex-shrink-0 text-gold"
                      aria-hidden
                    />
                    {t(k)}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="pillar" id="investment">
            <span className="pillar-num">02</span>
            <div className="pillar-icon">
              <svg fill="#F7BC15" height={44} width={44} viewBox="0 0 44 44">
                <rect height={12} rx={1.5} width={8} x={4} y={28} />
                <rect height={20} rx={1.5} width={8} x={15} y={20} />
                <rect height={27} rx={1.5} width={8} x={26} y={13} />
                <rect height={33} opacity={0} rx={1.5} width={3} x={37} y={7} />
                <path
                  d="M36 8 L40 4 M40 4 L44 8 M40 4 L40 18"
                  fill="none"
                  stroke="#F7BC15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                />
              </svg>
            </div>
            <div className="pillar-title" id="t-pillar2-title">
              <H html={t('t-pillar2-title')} />
            </div>
            <p className="pillar-desc" id="t-pillar2-body">
              {t('t-pillar2-body')}
            </p>
            <div className="pillar-tags !flex !flex-wrap gap-2">
              {(['pt2-tag1', 'pt2-tag2', 'pt2-tag3', 'pt2-tag4'] as const).map((k) => (
                <span
                  key={k}
                  className="tag !inline-flex items-center gap-2"
                  id={k}
                >
                  <CheckCircle2
                    className="h-5 w-5 flex-shrink-0 text-gold"
                    aria-hidden
                  />
                  {t(k)}
                </span>
              ))}
            </div>
          </div>

          <div className="pillar" id="education">
            <span className="pillar-num">03</span>
            <div className="pillar-icon">
              <svg fill="#F7BC15" height={44} width={44} viewBox="0 0 44 44">
                <path
                  d="M22 10 C18 8, 8 8, 6 10 L6 36 C8 34, 18 34, 22 36 C26 34, 36 34, 38 36 L38 10 C36 8, 26 8, 22 10 Z"
                  fill="none"
                  stroke="#F7BC15"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                />
                <line stroke="#F7BC15" strokeWidth={2.5} x1={22} x2={22} y1={10} y2={36} />
                <line stroke="#F7BC15" strokeLinecap="round" strokeWidth={1.8} x1={10} x2={20} y1={16} y2={16} />
                <line stroke="#F7BC15" strokeLinecap="round" strokeWidth={1.8} x1={10} x2={20} y1={21} y2={21} />
                <line stroke="#F7BC15" strokeLinecap="round" strokeWidth={1.8} x1={10} x2={20} y1={26} y2={26} />
                <line stroke="#F7BC15" strokeLinecap="round" strokeWidth={1.8} x1={24} x2={34} y1={16} y2={16} />
                <line stroke="#F7BC15" strokeLinecap="round" strokeWidth={1.8} x1={24} x2={34} y1={21} y2={21} />
                <line stroke="#F7BC15" strokeLinecap="round" strokeWidth={1.8} x1={24} x2={34} y1={26} y2={26} />
              </svg>
            </div>
            <div className="pillar-title" id="t-pillar3-title">
              <H html={t('t-pillar3-title')} />
            </div>
            <p className="pillar-desc" id="t-pillar3-body">
              {t('t-pillar3-body')}
            </p>
            <div className="pillar-tags !flex !flex-wrap gap-2">
              {(['pt3-tag1', 'pt3-tag2', 'pt3-tag3', 'pt3-tag4'] as const).map((k) => (
                <span
                  key={k}
                  className="tag !inline-flex items-center gap-2"
                  id={k}
                >
                  <CheckCircle2
                    className="h-5 w-5 flex-shrink-0 text-gold"
                    aria-hidden
                  />
                  {t(k)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: '#fff', padding: '100px 5%' }}>
        <div className="services-intro">
          <div>
            <div className="section-label" id="t-svc-tag">
              <H html={t('t-svc-tag')} />
            </div>
            <h2 className="section-title" id="t-svc-h2-main">
              <H html={t('t-svc-h2-main')} />
            </h2>
          </div>
          <p className="section-sub" id="t-svc-sub">
            {t('t-svc-sub')}
          </p>
        </div>
        <div className="services-grid">
          {(
            [
              <svg
                key="i1"
                fill="none"
                height={36}
                width={36}
                viewBox="0 0 44 44"
                stroke="#F7BC15"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
              >
                <circle cx={22} cy={14} r={6} />
                <path d="M10 38 C10 30 14 26 22 26 C30 26 34 30 34 38" />
                <line x1={16} x2={28} y1={22} y2={22} />
              </svg>,
              <svg
                key="i2"
                fill="none"
                height={36}
                width={36}
                viewBox="0 0 44 44"
                stroke="#F7BC15"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
              >
                <rect height={22} rx={2} width={28} x={8} y={14} />
                <polyline points="8,20 22,28 36,20" />
                <line x1={22} x2={22} y1={8} y2={14} />
                <line x1={16} x2={28} y1={8} y2={8} />
              </svg>,
              <svg
                key="i3"
                fill="none"
                height={36}
                width={36}
                viewBox="0 0 44 44"
                stroke="#F7BC15"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
              >
                <line x1={22} x2={22} y1={6} y2={38} />
                <line x1={10} x2={34} y1={10} y2={10} />
                <path d="M10 10 L6 22 C6 28 10 32 16 32 C22 32 26 28 26 22 L22 10" />
                <path d="M34 10 L38 22 C38 28 34 32 28 32 C22 32 18 28 18 22 L22 10" />
              </svg>,
              <svg
                key="i4"
                fill="none"
                height={36}
                width={36}
                viewBox="0 0 44 44"
                stroke="#F7BC15"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
              >
                <rect height={12} rx={2} width={12} x={8} y={8} />
                <rect height={12} rx={2} width={12} x={24} y={8} />
                <rect height={12} rx={2} width={12} x={8} y={24} />
                <rect height={12} rx={2} width={12} x={24} y={24} />
                <line x1={20} x2={24} y1={14} y2={14} />
                <line x1={14} x2={14} y1={20} y2={24} />
                <line x1={30} x2={30} y1={20} y2={24} />
                <line x1={20} x2={24} y1={30} y2={30} />
              </svg>,
              <svg
                key="i5"
                fill="none"
                height={36}
                width={36}
                viewBox="0 0 44 44"
                stroke="#F7BC15"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
              >
                <circle cx={22} cy={22} r={14} />
                <line x1={22} x2={22} y1={14} y2={24} />
                <circle cx={22} cy={28} fill="#F7BC15" r={1.5} />
              </svg>,
              <svg
                key="i6"
                fill="none"
                height={36}
                width={36}
                viewBox="0 0 44 44"
                stroke="#F7BC15"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
              >
                <circle cx={16} cy={32} r={4} />
                <circle cx={32} cy={32} r={4} />
                <path d="M6 32 C6 20 12 12 22 12 C32 12 38 20 38 32" />
                <polyline points="22,12 22,6 28,10" />
              </svg>,
              <svg
                key="i7"
                fill="none"
                height={36}
                width={36}
                viewBox="0 0 44 44"
                stroke="#F7BC15"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
              >
                <polyline points="8,10 22,24 36,10" />
                <line x1={22} x2={22} y1={24} y2={38} />
                <line x1={14} x2={30} y1={38} y2={38} />
              </svg>,
              <svg
                key="i8"
                fill="none"
                height={36}
                width={36}
                viewBox="0 0 44 44"
                stroke="#F7BC15"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
              >
                <circle cx={22} cy={22} r={15} />
                <ellipse cx={22} cy={22} rx={7} ry={15} />
                <line x1={7} x2={37} y1={22} y2={22} />
                <line x1={9} x2={35} y1={14} y2={14} />
                <line x1={9} x2={35} y1={30} y2={30} />
              </svg>,
            ] as const
          ).map((icon, idx) => {
            const n = idx + 1;
            const titleKey = `t-svc${n}-title` as const;
            const bodyKey = `t-svc${n}-body` as const;
            return (
              <div key={titleKey} className="svc">
                <div className="svc-icon-wrap">{icon}</div>
                <div className="svc-title" id={titleKey}>
                  <H html={t(titleKey)} />
                </div>
                <p className="svc-body flex items-start gap-2" id={bodyKey}>
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold opacity-90"
                    aria-hidden
                  />
                  <span>{t(bodyKey)}</span>
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="about" id="about">
        <div className="about-grid">
          <div>
            <div className="section-label" id="t-about-tag">
              <H html={t('t-about-label')} />
            </div>
            <h2 className="section-title" id="t-about-h2-alt">
              <H html={t('t-about-h2-alt')} />
            </h2>
            <p className="section-sub" id="t-about-body">
              {t('t-about-body')}
            </p>
            <div className="about-features">
              <div className="afeat">
                <div className="afeat-icon">
                  <Globe
                    className="h-9 w-9 flex-shrink-0 text-gold"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>
                <div>
                  <div className="afeat-title" id="t-about-feat1-title">
                    <H html={t('t-about-feat1-title')} />
                  </div>
                  <p className="afeat-body" id="t-about-feat1-body">
                    {t('t-about-feat1-body')}
                  </p>
                </div>
              </div>
              <div className="afeat">
                <div className="afeat-icon">
                  <Star
                    className="h-9 w-9 flex-shrink-0 text-gold"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>
                <div>
                  <div className="afeat-title" id="t-about-feat2-title">
                    <H html={t('t-about-feat2-title')} />
                  </div>
                  <p className="afeat-body" id="t-about-feat2-body">
                    {t('t-about-feat2-body')}
                  </p>
                </div>
              </div>
              <div className="afeat">
                <div className="afeat-icon">
                  <Award
                    className="h-9 w-9 flex-shrink-0 text-gold"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>
                <div>
                  <div className="afeat-title" id="t-about-feat3-title">
                    <H html={t('t-about-feat3-title')} />
                  </div>
                  <p className="afeat-body" id="t-about-feat3-body">
                    {t('t-about-feat3-body')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="about-visual">
            <div className="about-big-text">MENTORIA</div>
            <div className="about-quote">
              <p
                id="t-about-quote"
                className="flex items-start gap-2 sm:gap-3"
              >
                <ChevronRight
                  className="mt-1 h-5 w-5 flex-shrink-0 text-gold"
                  aria-hidden
                />
                <span>
                  <H html={t('t-about-quote')} />
                </span>
              </p>
            </div>
            <div className="about-metrics">
              <div className="metric">
                <div className="metric-val">FIFA</div>
                <div className="metric-lbl" id="t-metric-lbl1">
                  <H html={t('t-metric-lbl1')} />
                </div>
              </div>
              <div className="metric">
                <div className="metric-val">3+</div>
                <div className="metric-lbl" id="t-metric-lbl2">
                  <H html={t('t-metric-lbl2')} />
                </div>
              </div>
              <div className="metric">
                <div className="metric-val">360°</div>
                <div className="metric-lbl" id="t-metric-lbl3">
                  <H html={t('t-metric-lbl3')} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PeopleSection
        t={t}
        sabrinaOpen={sabrinaOpen}
        setSabrinaOpen={setSabrinaOpen}
        jasmilaOpen={jasmilaOpen}
        setJasmilaOpen={setJasmilaOpen}
        profileBtn={profileBtn}
      />

      <ArticlesSection
        lang={lang}
        t={t}
        articleTab={articleTab}
        setArticleTab={setArticleTab}
        ex={ex}
        toggleArticle={toggleArticle}
        articleLabels={articleLabels}
        showCard={showCard}
        longEnHtml={longEnHtml}
        longHrHtml={longHrHtml}
        openGallery={openGallery}
      />

      <div className="cta-strip" id="contact">
        <div>
          <h2 id="t-cta-h2">
            <H html={t('t-cta-h2')} />
          </h2>
        </div>
        <a className="btn-dark" id="t-cta-btn" href={contactMailto}>
          <H html={t('t-cta-btn')} />
        </a>
      </div>

      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <a className="nav-logo" href="#top">
              <img
                alt="M"
                width={20}
                height={15}
                src={mktAsset('assets/images/index-b1a1cf456366.png')}
                style={{ display: 'block', flexShrink: 0 }}
              />
              <span
                style={{
                  fontFamily: "'Saira Condensed',sans-serif",
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#F7BC15',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                }}
              >
                MENTORIA
              </span>
            </a>
            <p id="t-footer-desc">{t('t-footer-desc')}</p>
          </div>
          <div className="footer-col">
            <h4 id="f-h4-sports">
              <H html={t('f-h4-sports')} />
            </h4>
            <a href="#sports" id="fl-sports1">
              {t('fl-sports1')}
            </a>
            <a href="#sports" id="fl-sports2">
              {t('fl-sports2')}
            </a>
            <a href="#sports" id="fl-sports3">
              {t('fl-sports3')}
            </a>
            <a href="#sports" id="fl-sports4">
              {t('fl-sports4')}
            </a>
            <a href="#sports" id="fl-sports5">
              {t('fl-sports5')}
            </a>
          </div>
          <div className="footer-col">
            <h4 id="f-h4-investment">
              <H html={t('f-h4-investment')} />
            </h4>
            <a href="#investment" id="fl-inv1">
              {t('fl-inv1')}
            </a>
            <a href="#investment" id="fl-inv2">
              {t('fl-inv2')}
            </a>
            <a href="#investment" id="fl-inv3">
              {t('fl-inv3')}
            </a>
            <a href="#investment" id="fl-inv4">
              {t('fl-inv4')}
            </a>
          </div>
          <div className="footer-col">
            <h4 id="f-h4-education">
              <H html={t('f-h4-education')} />
            </h4>
            <a href="#education" id="fl-edu1">
              {t('fl-edu1')}
            </a>
            <a href="#education" id="fl-edu2">
              {t('fl-edu2')}
            </a>
            <a href="#education" id="fl-edu3">
              {t('fl-edu3')}
            </a>
            <a href="#education" id="fl-edu4">
              {t('fl-edu4')}
            </a>
          </div>
        </div>
        <div
          className="footer-bottom"
          style={{ flexWrap: 'wrap', gap: 10 }}
        >
          <p id="t-footer-copy">
            <H html={t('t-footer-copy')} />
          </p>
          <p
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: 0.6,
              fontSize: '0.6rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Powered by
            <img
              alt="rnd+"
              height={28}
              src={mktAsset('assets/images/index-e29e4eea4097.png')}
              style={{
                display: 'inline-block',
                verticalAlign: 'bottom',
                borderRadius: 4,
                position: 'relative',
                top: -3,
              }}
            />
          </p>
        </div>
      </footer>
    </>
  );
}

function LinkedInIcon() {
  return (
    <svg fill="#F7BC15" height={18} width={18} viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function PeopleSection({
  t,
  sabrinaOpen,
  setSabrinaOpen,
  jasmilaOpen,
  setJasmilaOpen,
  profileBtn,
}: Pick<
  MarketingPageSectionsProps,
  | 't'
  | 'sabrinaOpen'
  | 'setSabrinaOpen'
  | 'jasmilaOpen'
  | 'setJasmilaOpen'
  | 'profileBtn'
>) {
  const sabBadges = [
    'sab-badge1',
    'sab-badge2',
    'sab-badge3',
    'sab-badge4',
    'sab-badge5',
    'sab-badge6',
  ] as const;
  const jasBadges = [
    'jas-badge1',
    'jas-badge2',
    'jas-badge3',
    'jas-badge4',
    'jas-badge5',
    'jas-badge6',
  ] as const;

  return (
    <section className="people" id="team">
      <div className="people-header">
        <div>
          <div className="section-label" id="t-people-tag">
            <H html={t('t-people-tag')} />
          </div>
          <h2 className="section-title" id="t-people-h2">
            <H html={t('t-people-h2')} />
          </h2>
        </div>
        <p className="section-sub" id="t-people-sub" style={{ maxWidth: 360 }}>
          {t('t-people-sub')}
        </p>
      </div>

      <div className="person-card">
        <div className="person-photo">
          <img
            alt="Sabrina Buljubašić"
            src={mktAsset('assets/images/index-997cb6655502.jpg')}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
          <div className="person-photo-overlay">
            <div className="person-role-badge" id="t-sabrina-role">
              <H html={t('t-sabrina-role')} />
            </div>
            <div className="person-photo-name">
              Sabrina
              <br />
              Buljubašić
            </div>
          </div>
        </div>
        <div className="person-body">
          <div className="person-divider" />
          <p className="person-bio" id="sab-bio-short">
            {t('sab-bio-short')}
          </p>
          {sabrinaOpen ? (
            <p
              className="person-bio"
              id="sab-bio-full"
              style={{ marginTop: 14 }}
            >
              <H html={t('sab-bio-full')} />
            </p>
          ) : null}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 16,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              id="sabrina-btn"
              className="mkt-profile-btn"
              onClick={() => setSabrinaOpen(!sabrinaOpen)}
            >
              {profileBtn(sabrinaOpen)}
            </button>
            <a
              className="mkt-linkedin-btn"
              href="https://www.linkedin.com/in/sabrina-buljubasic-susic-11136993/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <LinkedInIcon /> LinkedIn
            </a>
          </div>
          <ul className="m-0 mt-4 list-none p-0 font-saira text-sm text-teal-mid flex flex-col gap-3">
            {sabBadges.map((k, i) => {
              const Icon = SAB_ACHIEVEMENT_ICONS[i];
              return (
                <li key={k} className="flex items-center gap-3">
                  <Icon
                    className="h-4 w-4 flex-shrink-0 text-gold"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span id={k}>{t(k)}</span>
                </li>
              );
            })}
          </ul>
          <div className="person-highlight" id="sab-highlight">
            <H html={t('sab-highlight')} />
          </div>
        </div>
      </div>

      <div className="person-card" style={{ marginTop: 24 }}>
        <div className="person-photo">
          <img
            alt="Jasmila Hodžić"
            src={mktAsset('assets/images/index-04393172e173.jpg')}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
          <div className="person-photo-overlay">
            <div className="person-role-badge" id="t-jasmila-role">
              <H html={t('t-jasmila-role')} />
            </div>
            <div className="person-photo-name">
              Jasmila
              <br />
              Hodžić
            </div>
          </div>
        </div>
        <div className="person-body">
          <div className="person-divider" />
          <p className="person-bio" id="jas-bio-short">
            {t('jas-bio-short')}
          </p>
          {jasmilaOpen ? (
            <p
              className="person-bio"
              id="jas-bio-full"
              style={{ marginTop: 14 }}
            >
              <H html={t('jas-bio-full')} />
            </p>
          ) : null}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 16,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              id="jasmila-btn"
              className="mkt-profile-btn"
              onClick={() => setJasmilaOpen(!jasmilaOpen)}
            >
              {profileBtn(jasmilaOpen)}
            </button>
            <a
              className="mkt-linkedin-btn"
              href="https://www.linkedin.com/in/jasmila-iljazovic-hodzic/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <LinkedInIcon /> LinkedIn
            </a>
          </div>
          <ul className="m-0 mt-4 list-none p-0 font-saira text-sm text-teal-mid flex flex-col gap-3">
            {jasBadges.map((k, i) => {
              const Icon = JAS_ACHIEVEMENT_ICONS[i];
              return (
                <li key={k} className="flex items-center gap-3">
                  <Icon
                    className="h-4 w-4 flex-shrink-0 text-gold"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span id={k}>{t(k)}</span>
                </li>
              );
            })}
          </ul>
          <div className="person-highlight" id="jas-highlight">
            <H html={t('jas-highlight')} />
          </div>
        </div>
      </div>
    </section>
  );
}
