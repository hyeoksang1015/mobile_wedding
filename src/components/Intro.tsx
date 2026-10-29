import { useEffect, useState } from 'react'
import { config } from '../config'
import { reducedMotion } from '../lib/ui'
import { wedding as d } from '../lib/wedding'
import { Icon } from './common'

const CHAR_MS = 110
const chars = Array.from(config.intro.typing)
const dateLabel = `${d.year}. ${String(d.month).padStart(2, '0')}. ${String(d.day).padStart(2, '0')} ${['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.weekday]} ${d.hour % 12 || 12}:${String(d.minute).padStart(2, '0')} ${d.hour < 12 ? 'AM' : 'PM'}`

export function Intro(props: { leaving: boolean; onOpen: () => void; onGone: () => void }) {
  const [count, setCount] = useState(() => (reducedMotion() ? chars.length : 0))

  useEffect(() => {
    if (reducedMotion()) return
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const n = Math.min(chars.length, Math.floor((t - start) / CHAR_MS))
      setCount(n)
      if (n < chars.length) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className={props.leaving ? 'intro is-leaving' : 'intro'}
      onTransitionEnd={(e) => e.target === e.currentTarget && props.leaving && props.onGone()}
    >
      <div className="intro-head">
        <span className="seal">
          <Icon name="favorite" />
        </span>
        <p className="label">WEDDING INVITATION</p>
        <p className="intro-sub">{config.intro.subtitle}</p>
      </div>

      <div className="intro-center">
        <img className="intro-photo" src={config.images.intro} alt="신랑 신부 사진" />
        <h1 className="intro-typing" aria-label={config.intro.typing}>
          <span aria-hidden="true">{chars.slice(0, count).join('')}</span>
          <span className="caret" aria-hidden="true" />
        </h1>
        <p className="pill">
          <Icon name="calendar_today" />
          {dateLabel}
        </p>
      </div>

      <div className="intro-foot">
        <button type="button" className="open-btn" onClick={props.onOpen}>
          청첩장 열기 <Icon name="expand_more" />
        </button>
        <p className="label muted">
          {config.groom.nameEn} &amp; {config.bride.nameEn}
        </p>
      </div>
    </div>
  )
}
