import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/common'
import { listPhotos, PAGE_SIZE, publicUrl, supabase, type Photo, type Sort } from '../lib/api'
import { useScrollLock } from '../lib/ui'
import { Uploader } from './Uploader'
import { Viewer } from './Viewer'

type Feed = { photos: Photo[]; done: boolean; loading: boolean; error: boolean }
const EMPTY: Feed = { photos: [], done: false, loading: false, error: false }

const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  })

function Card({ photo, onOpen }: { photo: Photo; onOpen: () => void }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <li className="album-card">
      <button type="button" onClick={onOpen} aria-label={`${photo.nickname}님의 사진 보기`}>
        <span className={loaded ? 'thumb' : 'thumb skeleton'}>
          <img
            src={publicUrl(photo.thumb_path)}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
          />
        </span>
        <span className="album-card-meta">
          <span className="strong">{photo.nickname}</span>
          <span className="tiny muted">{hhmm(photo.created_at)}</span>
        </span>
        <span className="album-card-stats tiny">
          <span>
            <Icon name="favorite" fill={photo.liked} /> {photo.like_count}
          </span>
          <span>
            <Icon name="chat_bubble" /> {photo.comment_count}
          </span>
        </span>
      </button>
    </li>
  )
}

export function Album({ onClose }: { onClose: () => void }) {
  useScrollLock()
  const [sort, setSort] = useState<Sort>('recent')
  const [feed, setFeed] = useState<Feed>(EMPTY)
  const [viewing, setViewing] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  // 정렬 변경/새로고침 이후 도착한 이전 요청의 응답을 버리기 위한 세대 번호
  const generation = useRef(0)

  const loadNext = () => {
    if (!supabase || feed.loading || feed.done || feed.error) return
    const gen = generation.current
    setFeed((f) => ({ ...f, loading: true }))
    listPhotos(sort, feed.photos.at(-1)).then(
      (rows) => {
        if (gen !== generation.current) return
        setFeed((f) => {
          // 인기순은 페이지 사이에 좋아요 수가 바뀌어 중복될 수 있다
          const seen = new Set(f.photos.map((p) => p.id))
          return {
            photos: [...f.photos, ...rows.filter((r) => !seen.has(r.id))],
            done: rows.length < PAGE_SIZE,
            loading: false,
            error: false,
          }
        })
      },
      () => gen === generation.current && setFeed((f) => ({ ...f, loading: false, error: true })),
    )
  }

  // 페이지가 붙을 때마다 다시 관찰해서, 센티널이 여전히 보이면 다음 페이지를 이어서 부른다
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        loadNext()
      },
      { root: scrollRef.current, rootMargin: '0px 0px 600px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  })

  const reset = (nextSort = sort) => {
    generation.current++
    setSort(nextSort)
    setFeed(EMPTY)
  }

  const patch = (id: string, change: Partial<Photo>) =>
    setFeed((f) => ({ ...f, photos: f.photos.map((p) => (p.id === id ? { ...p, ...change } : p)) }))

  const remove = (id: string) => {
    setViewing(null)
    setFeed((f) => ({ ...f, photos: f.photos.filter((p) => p.id !== id) }))
  }

  return (
    <div className="album" role="dialog" aria-modal="true" aria-labelledby="album-title">
      <div className="album-bar">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="사진첩 닫기">
          <Icon name="arrow_back_ios_new" />
        </button>
        <h2 id="album-title">하객 사진첩</h2>
        <span className="icon-btn" aria-hidden="true" />
      </div>

      <div className="album-scroll" ref={scrollRef}>
        <p className="eyebrow">GUEST MOMENTS</p>
        <p className="body muted center">오늘의 소중하고 따뜻한 순간을 함께 나눠주세요</p>

        {!supabase ? (
          <p className="card tiny muted center">사진첩 준비 중입니다</p>
        ) : (
          <>
            <div className="album-tools">
              <div className="segmented" role="radiogroup" aria-label="정렬">
                {(['recent', 'popular'] as const).map((s) => (
                  <button
                    type="button"
                    key={s}
                    role="radio"
                    aria-checked={sort === s}
                    onClick={() => s !== sort && reset(s)}
                  >
                    {s === 'recent' ? '최신순' : '인기순'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="primary-btn small"
                onClick={() => setUploading(true)}
              >
                <Icon name="photo_camera" /> 사진 올리기
              </button>
            </div>

            <ul className="album-grid" aria-busy={feed.loading}>
              {feed.photos.map((p, i) => (
                <Card key={p.id} photo={p} onOpen={() => setViewing(i)} />
              ))}
              {feed.loading &&
                Array.from({ length: feed.photos.length ? 4 : 6 }, (_, i) => (
                  <li key={`s${i}`} className="album-card" aria-hidden="true">
                    <span className="thumb skeleton" />
                    <span className="skeleton line" />
                  </li>
                ))}
            </ul>

            {feed.error && (
              <button
                type="button"
                className="more-btn"
                onClick={() => setFeed((f) => ({ ...f, error: false }))}
              >
                <Icon name="refresh" /> 다시 불러오기
              </button>
            )}
            {feed.done && feed.photos.length === 0 && (
              <div className="card center empty">
                <Icon name="add_a_photo" />
                <p className="headline">우리만의 추억을 기록해요</p>
                <p className="tiny muted">첫 번째 사진을 올려주세요</p>
                <button type="button" className="primary-btn" onClick={() => setUploading(true)}>
                  <Icon name="cloud_upload" /> 지금 바로 등록하기
                </button>
              </div>
            )}
            <div ref={sentinelRef} className="sentinel" />
          </>
        )}
      </div>

      {viewing !== null && feed.photos[viewing] && (
        <Viewer
          photos={feed.photos}
          index={viewing}
          onIndex={setViewing}
          onClose={() => setViewing(null)}
          onPatch={patch}
          onRemove={remove}
          onNeedMore={loadNext}
        />
      )}
      {uploading && (
        <Uploader
          onClose={() => setUploading(false)}
          onUploaded={() => {
            if (sort === 'recent') reset()
          }}
        />
      )}
    </div>
  )
}
