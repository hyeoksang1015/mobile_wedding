import { useEffect, useState } from 'react'
import { config } from '../config'
import { swipeHandlers, useScrollLock } from '../lib/ui'
import { Icon, Section } from './common'

const photos = config.images.gallery

function Lightbox({ start, onClose }: { start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start)
  useScrollLock()
  const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length)
  const next = () => setIndex((i) => (i + 1) % photos.length)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + photos.length) % photos.length)
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % photos.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="웨딩 사진 크게 보기">
      <div className="viewer-bar">
        <span>
          {index + 1} / {photos.length}
        </span>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="닫기" autoFocus>
          <Icon name="close" />
        </button>
      </div>
      <div className="viewer-stage" {...swipeHandlers(prev, next)}>
        <img src={photos[index].src} alt={photos[index].caption} />
        <button type="button" className="nav-arrow left" onClick={prev} aria-label="이전 사진">
          <Icon name="chevron_left" />
        </button>
        <button type="button" className="nav-arrow right" onClick={next} aria-label="다음 사진">
          <Icon name="chevron_right" />
        </button>
      </div>
      <p className="viewer-caption">{photos[index].caption}</p>
    </div>
  )
}

export function Gallery() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <Section id="gallery" eyebrow="GALLERY" title="소중한 순간들">
      <div className="gallery-grid">
        {photos.map((p, i) => (
          <button
            type="button"
            key={i}
            className={i === 0 ? 'gallery-item featured' : 'gallery-item'}
            onClick={() => setOpen(i)}
            aria-label={`${p.caption} 크게 보기`}
          >
            <img src={p.src} alt={p.caption} loading="lazy" />
          </button>
        ))}
      </div>
      {open !== null && <Lightbox start={open} onClose={() => setOpen(null)} />}
    </Section>
  )
}
