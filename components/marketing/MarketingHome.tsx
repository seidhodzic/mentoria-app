'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import translations from '@/lib/marketing-translations.json';
import longArticlesEn from '@/lib/marketing-long-articles-en.json';
import { mktAbsolutizeHtmlAssets, mktAsset } from '@/lib/mkt-assets';
import { MarketingPageSections } from './MarketingPageSections';
import type { ArticleTab, Lang } from './types';

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'info@mentoria.com';

function useT(lang: Lang) {
  return useCallback(
    (key: string) => {
      const pack = translations[lang] as Record<string, string>;
      const fallback = translations.en as Record<string, string>;
      return pack[key] ?? fallback[key] ?? '';
    },
    [lang],
  );
}

function TH({ lang, k }: { lang: Lang; k: string }) {
  const t = useT(lang);
  return <span dangerouslySetInnerHTML={{ __html: t(k) }} />;
}

const LJ_GALLERY = [
  'assets/images/index-965dcf455c44.jpg',
  'assets/images/index-3d8cd39c6b5f.jpg',
  'assets/images/index-01805a09810d.jpg',
  'assets/images/index-6e594ec6df16.jpg',
  'assets/images/index-891edff1fea0.jpg',
];

const HVD_GALLERY = [
  'assets/images/index-fbf291e534b6.jpg',
  'assets/images/index-271bccd98b59.jpg',
];

function GalleryModal({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (index < 0 || index >= images.length) return null;
  return (
    <div
      className="mkt-gallery-overlay"
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <button
        type="button"
        className="mkt-gallery-close"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        ×
      </button>
      <img
        src={mktAsset(images[index])}
        alt=""
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 ? (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            display: 'flex',
            gap: 12,
          }}
        >
          <button
            type="button"
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              cursor: 'pointer',
              borderRadius: 4,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          >
            ←
          </button>
          <button
            type="button"
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              cursor: 'pointer',
              borderRadius: 4,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
          >
            →
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function MarketingHome() {
  const [lang, setLang] = useState<Lang>('en');
  const t = useT(lang);
  const rootRef = useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [articleTab, setArticleTab] = useState<ArticleTab>('all');
  const [expandedArticles, setExpandedArticles] = useState<Record<string, boolean>>(
    {},
  );
  const [sabrinaOpen, setSabrinaOpen] = useState(false);
  const [jasmilaOpen, setJasmilaOpen] = useState(false);
  const [gallery, setGallery] = useState<{
    kind: 'lj' | 'hvd';
    i: number;
  } | null>(null);

  const langBtnId = useId();

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (mobileOpen) el.classList.add('mobile-menu-open');
    else el.classList.remove('mobile-menu-open');
    return () => el.classList.remove('mobile-menu-open');
  }, [mobileOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = lang === 'hr' ? 'hr' : 'en';
  }, [lang]);

  const toggleArticle = (id: string) => {
    setExpandedArticles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const articleLabels = (open: boolean) =>
    lang === 'hr'
      ? open
        ? 'Manje'
        : 'Pročitajte cijeli članak'
      : open
        ? 'Read Less'
        : 'Read Full Article';

  const profileBtn = (open: boolean) =>
    lang === 'hr'
      ? open
        ? 'Smanji profil ↑'
        : 'Proširi profil ↓'
      : open
        ? 'Collapse Profile ↑'
        : 'Expand Profile ↓';

  const showCard = (cat: string) =>
    articleTab === 'all' || articleTab === cat;

  const longEnHtml = (key: keyof typeof longArticlesEn) =>
    mktAbsolutizeHtmlAssets(longArticlesEn[key]);

  const longHrHtml = (key: string) =>
    mktAbsolutizeHtmlAssets(t(key));

  const galleryImages = gallery?.kind === 'lj' ? LJ_GALLERY : HVD_GALLERY;
  const galleryIdx = gallery?.i ?? 0;

  return (
    <div ref={rootRef} className="marketing-root">
      {gallery ? (
        <GalleryModal
          images={galleryImages}
          index={galleryIdx}
          onClose={() => setGallery(null)}
          onPrev={() =>
            setGallery((g) =>
              g
                ? {
                    ...g,
                    i: (g.i - 1 + galleryImages.length) % galleryImages.length,
                  }
                : null,
            )
          }
          onNext={() =>
            setGallery((g) =>
              g
                ? { ...g, i: (g.i + 1) % galleryImages.length }
                : null,
            )
          }
        />
      ) : null}

      {/* NAV */}
      <nav>
        <a
          className="nav-logo"
          href="#top"
          aria-label="Mentoria — home"
        >
          <img
            src="/mentoria-logo.svg"
            alt="Mentoria"
            style={{ height: 36, width: 'auto', display: 'block' }}
          />
        </a>
        <div className="nav-links">
          <a href="#services" id="t-nav-sports">
            <TH lang={lang} k="t-nav-sports" />
          </a>
          <a href="#about" id="t-nav-about">
            <TH lang={lang} k="t-nav-about" />
          </a>
          <a href="#sports" id="t-nav-sports2">
            <TH lang={lang} k="t-nav-sports2" />
          </a>
          <a href="#investment" id="t-nav-investment">
            <TH lang={lang} k="t-nav-investment" />
          </a>
          <a href="#education" id="t-nav-education">
            <TH lang={lang} k="t-nav-education" />
          </a>
          <a href="#team" id="t-nav-people">
            <TH lang={lang} k="t-nav-people" />
          </a>
          <Link className="nav-member-login" href="/login">
            {lang === 'hr' ? 'Prijava članova' : 'Member Login'}
          </Link>
          <Link className="nav-register" href="/register">
            {lang === 'hr' ? 'Registracija' : 'Get started'}
          </Link>
          <a className="nav-cta" href="#contact" id="t-nav-contact">
            <TH lang={lang} k="t-nav-contact" />
          </a>
        </div>
        <div className="nav-mobile-actions">
          <Link className="nav-mobile-login" href="/login">
            Member Login
          </Link>
          <button
            type="button"
            className={`mobile-menu-toggle${mobileOpen ? ' is-open' : ''}`}
            aria-controls="mobile-menu"
            aria-expanded={mobileOpen}
            aria-label="Open menu"
            id="mobile-menu-toggle"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <div
          id="lang-toggle-wrap"
          style={{ position: 'relative', marginLeft: 24 }}
        >
          <button
            type="button"
            id={langBtnId}
            style={{
              background: 'none',
              border: '1.5px solid rgba(255,255,255,0.35)',
              borderRadius: 3,
              padding: '5px 13px',
              cursor: 'pointer',
              fontFamily: "'Saira',sans-serif",
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.9)',
              textTransform: 'uppercase',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
            onClick={() => setLangMenuOpen((v) => !v)}
          >
            <span id="lang-btn-label">
              {lang === 'hr' ? '🇧🇦 BS' : '🇬🇧 EN'}
            </span>
            <svg
              fill="none"
              height={6}
              width={10}
              viewBox="0 0 10 6"
              style={{
                transform: langMenuOpen ? 'rotate(180deg)' : undefined,
                transition: 'transform 0.2s',
              }}
            >
              <path
                d="M1 1L5 5L9 1"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth={1.5}
              />
            </svg>
          </button>
          {langMenuOpen ? (
            <div
              id="lang-menu"
              style={{
                position: 'fixed',
                top: 72,
                right: '5%',
                background: '#19353E',
                border: '1px solid rgba(247,188,21,0.3)',
                borderRadius: 4,
                overflow: 'hidden',
                minWidth: 140,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                zIndex: 9999,
              }}
            >
              <button
                type="button"
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '11px 16px',
                  cursor: 'pointer',
                  fontFamily: "'Saira',sans-serif",
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.9)',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onClick={() => {
                  setLang('en');
                  setLangMenuOpen(false);
                }}
              >
                🇬🇧 English
              </button>
              <button
                type="button"
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '11px 16px',
                  cursor: 'pointer',
                  fontFamily: "'Saira',sans-serif",
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.9)',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onClick={() => {
                  setLang('hr');
                  setLangMenuOpen(false);
                }}
              >
                🇧🇦 Bosanski
              </button>
            </div>
          ) : null}
        </div>
      </nav>

      <div className="mobile-menu" id="mobile-menu" hidden={!mobileOpen}>
        <Link href="/login" onClick={() => setMobileOpen(false)}>
          {lang === 'hr' ? 'Prijava članova' : 'Member Login'}
        </Link>
        <Link href="/register" onClick={() => setMobileOpen(false)}>
          {lang === 'hr' ? 'Registracija' : 'Get started'}
        </Link>
        <a href="#services" id="mobile-nav-capabilities" onClick={() => setMobileOpen(false)}>
          <TH lang={lang} k="t-nav-sports" />
        </a>
        <a href="#about" id="mobile-nav-platform" onClick={() => setMobileOpen(false)}>
          <TH lang={lang} k="t-nav-about" />
        </a>
        <a href="#sports" id="mobile-nav-sports" onClick={() => setMobileOpen(false)}>
          <TH lang={lang} k="t-nav-sports2" />
        </a>
        <a href="#investment" id="mobile-nav-investment" onClick={() => setMobileOpen(false)}>
          <TH lang={lang} k="t-nav-investment" />
        </a>
        <a href="#education" id="mobile-nav-education" onClick={() => setMobileOpen(false)}>
          <TH lang={lang} k="t-nav-education" />
        </a>
        <a href="#team" id="mobile-nav-leadership" onClick={() => setMobileOpen(false)}>
          <TH lang={lang} k="t-nav-people" />
        </a>
        <a href="#contact" id="mobile-nav-contact" onClick={() => setMobileOpen(false)}>
          <TH lang={lang} k="t-nav-contact" />
        </a>
      </div>

      <main id="top">
        <MarketingPageSections
          lang={lang}
          t={t}
          articleTab={articleTab}
          setArticleTab={setArticleTab}
          expandedArticles={expandedArticles}
          toggleArticle={toggleArticle}
          articleLabels={articleLabels}
          sabrinaOpen={sabrinaOpen}
          setSabrinaOpen={setSabrinaOpen}
          jasmilaOpen={jasmilaOpen}
          setJasmilaOpen={setJasmilaOpen}
          profileBtn={profileBtn}
          showCard={showCard}
          longEnHtml={longEnHtml}
          longHrHtml={longHrHtml}
          openGallery={(kind, i) => setGallery({ kind, i })}
          contactMailto={`mailto:${CONTACT_EMAIL}`}
        />
      </main>
    </div>
  );
}
