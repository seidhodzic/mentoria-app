import longArticlesEnJson from '@/lib/marketing-long-articles-en.json';
import { mktAsset } from '@/lib/mkt-assets';
import type { ArticleTab, Lang } from './types';

type LongEnKey = keyof typeof longArticlesEnJson;

function H({ html }: { html: string }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

type Props = {
  lang: Lang;
  t: (k: string) => string;
  articleTab: ArticleTab;
  setArticleTab: (v: ArticleTab) => void;
  ex: Record<string, boolean>;
  toggleArticle: (id: string) => void;
  articleLabels: (open: boolean) => string;
  showCard: (cat: string) => boolean;
  longEnHtml: (key: LongEnKey) => string;
  longHrHtml: (key: string) => string;
  openGallery: (kind: 'lj' | 'hvd', i: number) => void;
};

function tabBtn(active: boolean) {
  return `tab-btn${active ? ' active' : ''}`;
}

export function ArticlesSection(p: Props) {
  const {
    t,
    articleTab,
    setArticleTab,
    ex,
    toggleArticle,
    articleLabels,
    showCard,
    longEnHtml,
    longHrHtml,
    openGallery,
  } = p;

  const e = (id: string) => !!ex[id];
  const longBody = (enKey: LongEnKey, hrKey: string) =>
    p.lang === 'en' ? longEnHtml(enKey) : longHrHtml(hrKey);

  const cx = (cat: string) =>
    showCard(cat) ? 'article-card' : 'article-card mkt-article-hidden';

  return (
    <section className="articles" id="articles">
      <div className="articles-header">
        <div>
          <p
            id="t-articles-tag"
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              marginBottom: 10,
            }}
          >
            <H html={t('t-articles-tag')} />
          </p>
          <h2 id="t-articles-h2">
            <H html={t('t-articles-h2')} />
          </h2>
        </div>
        <div className="articles-tabs">
          <button
            type="button"
            className={tabBtn(articleTab === 'all')}
            id="t-tab-all"
            onClick={() => setArticleTab('all')}
          >
            {t('t-tab-all')}
          </button>
          <button
            type="button"
            className={tabBtn(articleTab === 'sports')}
            id="t-tab-sports"
            onClick={() => setArticleTab('sports')}
          >
            {t('t-tab-sports')}
          </button>
          <button
            type="button"
            className={tabBtn(articleTab === 'investment')}
            id="t-tab-investment"
            onClick={() => setArticleTab('investment')}
          >
            {t('t-tab-investment')}
          </button>
          <button
            type="button"
            className={tabBtn(articleTab === 'education')}
            id="t-tab-education"
            onClick={() => setArticleTab('education')}
          >
            {t('t-tab-education')}
          </button>
        </div>
      </div>

      <div className="articles-grid" id="articles-grid">
        {/* Ljubljana */}
        <article className={cx('sports')} data-cat="sports">
          <div className="article-thumb" style={{ background: '#0d1f26' }}>
            <img
              alt="Jasmila Hodžić moderating panel at Business of Sport in Eastern Europe"
              src={mktAsset('assets/images/index-22329ab37232.jpg')}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: '70% 68%',
                display: 'block',
              }}
            />
            <span className="article-thumb-cat" id="lj-cat">
              {t('lj-cat')}
            </span>
          </div>
          <div className="article-body">
            <div className="article-meta" id="art1-meta">
              <H html={t('art1-meta')} />
            </div>
            <h3 className="article-title" id="art1-title">
              {t('art1-title')}
            </h3>
            <p className="article-excerpt" id="art1-excerpt">
              {t('art1-excerpt')}
            </p>
            <div
              id="lj-full"
              style={{ display: e('lj') ? 'block' : 'none' }}
            >
              <p
                className="article-excerpt"
                id="art1-full-p"
                style={{ marginTop: 0 }}
              >
                {t('art1-full-p')}
              </p>
              <div
                className="article-gallery"
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 20,
                  overflowX: 'auto',
                  paddingBottom: 4,
                }}
              >
                {[
                  'assets/images/index-965dcf455c44.jpg',
                  'assets/images/index-3d8cd39c6b5f.jpg',
                  'assets/images/index-01805a09810d.jpg',
                  'assets/images/index-6e594ec6df16.jpg',
                  'assets/images/index-891edff1fea0.jpg',
                ].map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    style={{
                      padding: 0,
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => openGallery('lj', i)}
                  >
                    <img
                      alt=""
                      src={mktAsset(src)}
                      style={{
                        height: 72,
                        width: 108,
                        objectFit: 'cover',
                        borderRadius: 2,
                        flexShrink: 0,
                        opacity: 0.85,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-bold tracking-widest uppercase font-saira text-teal-mid hover:text-gold transition-colors mt-4"
              id="lj-btn"
              onClick={() => toggleArticle('lj')}
            >
              {articleLabels(e('lj'))}
            </button>
          </div>
        </article>

        {/* Hess */}
        <article className={cx('investment')} data-cat="investment">
          <div className="article-thumb" style={{ background: '#19353E' }}>
            <img
              alt="Waterford FC Women players in Hess Sports Group kit"
              src={mktAsset('assets/images/index-39b7900786de.jpg')}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: '70% 68%',
                display: 'block',
              }}
            />
            <span className="article-thumb-cat" id="hess-cat">
              {t('hess-cat')}
            </span>
          </div>
          <div className="article-body">
            <div className="article-meta" id="art2-meta">
              <H html={t('art2-meta')} />
            </div>
            <h3 className="article-title" id="art2-title">
              {t('art2-title')}
            </h3>
            <p className="article-excerpt" id="art2-excerpt">
              {t('art2-excerpt')}
            </p>
            <div
              id="hess-full"
              style={{ display: e('hess') ? 'block' : 'none' }}
            >
              <p
                className="article-excerpt"
                id="art2-full-p"
                style={{ marginTop: 0 }}
              >
                {t('art2-full-p')}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-bold tracking-widest uppercase font-saira text-teal-mid hover:text-gold transition-colors mt-4"
              id="hess-btn"
              onClick={() => toggleArticle('hess')}
            >
              {articleLabels(e('hess'))}
            </button>
          </div>
        </article>

        {/* Harvard */}
        <article className={cx('education')} data-cat="education">
          <div className="article-thumb" style={{ background: '#0d1f26' }}>
            <img
              alt="Jasmila Hodžić at Harvard Business School"
              src={mktAsset('assets/images/index-fbf291e534b6.jpg')}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: '70% 68%',
                display: 'block',
              }}
            />
            <span className="article-thumb-cat" id="hvd-cat">
              {t('hvd-cat')}
            </span>
          </div>
          <div className="article-body">
            <div className="article-meta" id="art3-meta">
              <H html={t('art3-meta')} />
            </div>
            <h3 className="article-title" id="art3-title">
              {t('art3-title')}
            </h3>
            <p className="article-excerpt" id="art3-excerpt">
              {t('art3-excerpt')}
            </p>
            <div
              id="hvd-full"
              style={{ display: e('hvd') ? 'block' : 'none' }}
            >
              <p
                className="article-excerpt"
                id="art3-full-p"
                style={{ marginTop: 0 }}
              >
                {t('art3-full-p')}
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 20,
                  overflowX: 'auto',
                  paddingBottom: 4,
                }}
              >
                {[
                  'assets/images/index-fbf291e534b6.jpg',
                  'assets/images/index-271bccd98b59.jpg',
                ].map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    style={{
                      padding: 0,
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => openGallery('hvd', i)}
                  >
                    <img
                      alt=""
                      src={mktAsset(src)}
                      style={{
                        height: 72,
                        width: 108,
                        objectFit: 'cover',
                        objectPosition: i === 0 ? 'center 30%' : undefined,
                        borderRadius: 2,
                        flexShrink: 0,
                        opacity: 0.85,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-bold tracking-widest uppercase font-saira text-teal-mid hover:text-gold transition-colors mt-4"
              id="hvd-btn"
              onClick={() => toggleArticle('hvd')}
            >
              {articleLabels(e('hvd'))}
            </button>
          </div>
        </article>

        {/* PTB */}
        <article className={cx('education')} data-cat="education">
          <div className="article-thumb" style={{ background: '#153040' }}>
            <img
              alt="Preparing Athletes for Life After Sport"
              src={mktAsset('assets/images/index-47d3259bf150.jpg')}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: '70% 20%',
                display: 'block',
              }}
            />
            <span className="article-thumb-cat" id="ptb-cat">
              {t('ptb-cat')}
            </span>
          </div>
          <div className="article-body">
            <div className="article-meta" id="ptb-meta">
              <H html={t('ptb-meta')} />
            </div>
            <h3 className="article-title" id="ptb-title">
              {t('ptb-title')}
            </h3>
            <p className="article-excerpt" id="ptb-excerpt">
              {t('ptb-excerpt')}
            </p>
            <div
              id="ptb-full"
              style={{ display: e('ptb') ? 'block' : 'none' }}
              dangerouslySetInnerHTML={{
                __html: longBody('ptbFull', 'ptb-full-text'),
              }}
            />
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-bold tracking-widest uppercase font-saira text-teal-mid hover:text-gold transition-colors mt-4"
              id="ptb-btn"
              onClick={() => toggleArticle('ptb')}
            >
              {articleLabels(e('ptb'))}
            </button>
          </div>
        </article>

        {/* WOB */}
        <article className={cx('sports')} data-cat="sports">
          <div className="article-thumb" style={{ background: '#19353E' }}>
            <img
              alt="Women on Board — Game-Changing Benefits"
              src={mktAsset('assets/images/index-6f867b3758cf.jpg')}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: '70% 20%',
                display: 'block',
              }}
            />
            <span className="article-thumb-cat" id="wob-cat">
              {t('wob-cat')}
            </span>
          </div>
          <div className="article-body">
            <div className="article-meta" id="wob-meta">
              <H html={t('wob-meta')} />
            </div>
            <h3 className="article-title" id="wob-title">
              {t('wob-title')}
            </h3>
            <p className="article-excerpt" id="wob-excerpt">
              {t('wob-excerpt')}
            </p>
            <div
              id="wob-full"
              style={{ display: e('wob') ? 'block' : 'none' }}
              dangerouslySetInnerHTML={{
                __html: longBody('wobFull', 'wob-full-text'),
              }}
            />
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-bold tracking-widest uppercase font-saira text-teal-mid hover:text-gold transition-colors mt-4"
              id="wob-btn"
              onClick={() => toggleArticle('wob')}
            >
              {articleLabels(e('wob'))}
            </button>
          </div>
        </article>

        {/* CM */}
        <article className={cx('sports')} data-cat="sports">
          <div className="article-thumb" style={{ background: '#19353E' }}>
            <img
              alt="Club Management in Emerging Markets: Lessons from the Western Balkans"
              src={mktAsset('assets/images/index-afd72ae4e7a1.jpg')}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
            <span className="article-thumb-cat" id="cm-cat">
              {t('cm-cat')}
            </span>
          </div>
          <div className="article-body">
            <div className="article-meta" id="cm-meta">
              <H html={t('cm-meta')} />
            </div>
            <h3 className="article-title" id="cm-title">
              {t('cm-title')}
            </h3>
            <p className="article-excerpt" id="cm-excerpt">
              {t('cm-excerpt')}
            </p>
            <div
              id="cm-full"
              style={{ display: e('cm') ? 'block' : 'none' }}
              dangerouslySetInnerHTML={{
                __html: longBody('cmFull', 'cm-full-text'),
              }}
            />
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-bold tracking-widest uppercase font-saira text-teal-mid hover:text-gold transition-colors mt-4"
              id="cm-btn"
              onClick={() => toggleArticle('cm')}
            >
              {articleLabels(e('cm'))}
            </button>
          </div>
        </article>

        {/* BRE */}
        <article className={cx('investment')} data-cat="investment">
          <div className="article-thumb" style={{ background: '#F7BC15' }}>
            <img
              alt="Balkans Real Estate & Sports Infrastructure: A Buy-Side Perspective"
              src={mktAsset('assets/images/index-ea302185e156.jpg')}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
            <span
              className="article-thumb-cat"
              id="bre-cat"
              style={{ background: 'var(--teal)', color: 'var(--gold)' }}
            >
              {t('bre-cat')}
            </span>
          </div>
          <div className="article-body">
            <div className="article-meta" id="bre-meta">
              <H html={t('bre-meta')} />
            </div>
            <h3 className="article-title" id="bre-title">
              {t('bre-title')}
            </h3>
            <p className="article-excerpt" id="bre-excerpt">
              {t('bre-excerpt')}
            </p>
            <div
              id="bre-full"
              style={{ display: e('bre') ? 'block' : 'none' }}
              dangerouslySetInnerHTML={{
                __html: longBody('breFull', 'bre-full-text'),
              }}
            />
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-bold tracking-widest uppercase font-saira text-teal-mid hover:text-gold transition-colors mt-4"
              id="bre-btn"
              onClick={() => toggleArticle('bre')}
            >
              {articleLabels(e('bre'))}
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
