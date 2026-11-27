'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Mail, Mails, Search, Shuffle } from 'lucide-react';
import { getTags, type Tag } from '@/lib/api';
import { GoToTop } from '@/components/go-to-top';
import { Button } from '@/components/ui/button';
import styles from './topics.module.css';

function PostageStamp() {
  return (
    <svg aria-hidden="true" className={styles.stamp} viewBox="0 0 156 92" fill="none">
      <g transform="rotate(7 112 45)" strokeLinejoin="round">
        <rect x="78" y="5" width="68" height="78" fill="currentColor" />
        <rect x="78" y="5" width="68" height="78" stroke="var(--color-surface)" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 7" />
        <g stroke="var(--color-surface)">
          <rect x="85" y="12" width="54" height="64" />
          <circle cx="98" cy="26" r="5" fill="var(--color-surface)" />
          <path d="m90 43 43-20-15 37-10-13-6 6-1-9Z" fill="var(--color-surface)" />
          <path d="m101 44 32-21-25 24-6 6Z" fill="currentColor" />
          <path d="m90 65 13-6m-13 10 19-9m13 9 12-6m-6 8 6-3" />
        </g>
      </g>
      <g transform="rotate(-9 48 60)" stroke="var(--color-brand)" opacity=".8">
        <circle cx="47" cy="60" r="23" strokeWidth="1.5" />
        <circle cx="47" cy="60" r="18.5" strokeDasharray="2 2" />
        <path d="m43 51-4 18m16-18-4 18m-15-12h23m-25 7h23" strokeWidth="2" />
        <path d="M69 52c13-8 22 6 36 0s19-4 26-1m-62 9c13-8 22 6 36 0s19-4 26-1m-63 9c13-8 22 6 36 0s19-4 26-1" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function TopicCard({ tag, featured = false }: { tag: Tag; featured?: boolean }) {
  const Heading = featured ? 'h2' : 'h3';
  const title = `${featured ? 'postcard' : 'topic'}-${tag.id}`;
  const description = tag.description ? `${title}-description` : undefined;

  return (
    <Link
      href={{ pathname: '/tags/detail', query: { id: tag.id, name: tag.tag_name } }}
      aria-labelledby={featured ? `${title}-action ${title}` : title}
      aria-describedby={[description, `${title}-meta`].filter(Boolean).join(' ')}
      className={`${styles.card} ${featured ? styles.featured : styles.slip} fabric-card`}
    >
      {featured && (
        <div className={styles.letterhead}>
          <span><Mails size={16} aria-hidden="true" />话题明信片</span>
          <PostageStamp />
        </div>
      )}
      <Heading id={title} className={styles.subject}>
        <span className={styles.hash}>#</span>{tag.tag_name}
      </Heading>
      {tag.description && <p id={description} className={styles.description}>{tag.description}</p>}
      <div className={styles.footer}>
        <span id={`${title}-meta`} className="inline-flex items-center gap-2">
          <Mail size={15} aria-hidden="true" />{tag.question_count} 封投稿
        </span>
        <span className={styles.open}>
          {featured && <span id={`${title}-action`}>进入话题</span>}<ArrowUpRight aria-hidden="true" size={17} />
        </span>
      </div>
    </Link>
  );
}

function normalize(text: string) {
  return text.normalize('NFKC').toLowerCase();
}

function findTopics(tags: Tag[], term: string) {
  if (!term) return tags;
  const names: Tag[] = [];
  const descriptions: Tag[] = [];
  for (const tag of tags) {
    if (normalize(tag.tag_name).includes(term)) names.push(tag);
    else if (normalize(tag.description).includes(term)) descriptions.push(tag);
  }
  return [...names, ...descriptions];
}

export default function TagsPage() {
  const [result, setResult] = useState<Tag[] | 'loading' | 'error'>('loading');
  const [card, setCard] = useState({ index: 0, drawn: false });
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const loading = result === 'loading';

  useEffect(() => {
    if (!loading) return;
    let active = true;
    getTags().then((res) => {
      if (!active) return;
      if (res.code !== 200 || !Array.isArray(res.data)) {
        setResult('error');
        return;
      }
      if (res.data.length > 1) {
        setCard({ index: Math.floor(Math.random() * res.data.length), drawn: false });
      }
      setResult(res.data);
    }).catch(() => {
      if (active) setResult('error');
    });
    return () => { active = false; };
  }, [loading]);

  const tags = Array.isArray(result) ? result : [];
  const current = tags[card.index];
  const term = normalize(query).trim().replace(/^#\s*/, '');
  const matches = findTopics(tags, term);
  const showDeck = tags.length > 1 && !term;
  const drawCard = () => {
    // Every nonzero offset selects a different topic with the same probability.
    const offset = 1 + Math.floor(Math.random() * (tags.length - 1));
    setCard(({ index }) => ({ index: (index + offset) % tags.length, drawn: true }));
  };
  const clearSearch = () => {
    setQuery('');
    searchRef.current?.focus();
  };

  return (
    <main className={`${styles.page} mx-auto w-full max-w-[68rem] px-5 pb-16 sm:px-9`}>
      <div className={styles.counter}>
        <header>
          <h1 className={styles.title}>话题</h1>
          <div role="search" aria-label="查找话题" className={styles.search}>
            <Search size={19} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              aria-label="搜索话题"
              placeholder="搜索话题名称或描述"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && <button type="button" aria-label="清除搜索" onClick={clearSearch}>清除</button>}
          </div>
          {showDeck && (
            <>
              <Button type="button" onClick={drawCard} aria-controls="topic-postcard" className="mt-6 min-h-11 cursor-pointer">
                <Shuffle aria-hidden="true" />随机一张
              </Button>
              <span className="sr-only" role="status">抽到的话题：#{current.tag_name}</span>
            </>
          )}
        </header>

        {showDeck && (
          <aside id="topic-postcard" aria-label="话题明信片" className={styles.stack}>
            <div key={current.id} className={card.drawn ? styles.turn : undefined}>
              <TopicCard tag={current} featured />
            </div>
          </aside>
        )}
      </div>

      {tags.length > 0 ? (
        <section aria-labelledby="topic-directory">
          <div className="mb-5 flex items-center gap-4">
            <h2 id="topic-directory" className={styles.sectionTitle}>{term ? '搜索结果' : '全部话题'}</h2>
            <span aria-hidden="true" className="grow border-t border-dashed border-[var(--color-fabric-stitch)]" />
            <span role="status" className="text-sm text-secondary-foreground">
              {term ? '找到 ' : '共 '}{matches.length} 个话题
            </span>
          </div>
          {matches.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((tag) => <TopicCard key={tag.id} tag={tag} />)}
            </div>
          ) : (
            <div className={styles.notice}>
              <p>没有找到匹配的话题</p>
              <button type="button" onClick={clearSearch}>查看全部话题</button>
            </div>
          )}
        </section>
      ) : (
        <div className={styles.notice}>
          <Mails size={28} aria-hidden="true" />
          <p role="status">
            {loading ? '正在加载话题…' : result === 'error' ? '话题加载失败' : '暂时没有话题'}
          </p>
          {result === 'error' && <button type="button" onClick={() => setResult('loading')}>重新加载</button>}
        </div>
      )}
      <GoToTop />
    </main>
  );
}
