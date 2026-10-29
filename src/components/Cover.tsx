import { config } from '../config'
import { useNow } from '../lib/ui'
import { dDayLabel, weddingDateKo, weddingTimeKo } from '../lib/wedding'
import { Divider, Icon, Section } from './common'

export function Cover() {
  const now = useNow(60_000)
  return (
    <Section id="cover">
      <p className="eyebrow">WEDDING INVITATION</p>
      <div className="monogram" aria-hidden="true">
        <span>{config.groom.nameEn}</span>
        <span className="amp">— &amp; —</span>
        <span>{config.bride.nameEn}</span>
      </div>

      <figure className="cover-photo">
        <img
          src={config.images.cover}
          alt={`${config.groom.name}, ${config.bride.name} 웨딩 사진`}
        />
      </figure>

      <h2 className="cover-title">우리 결혼합니다</h2>
      <Divider />

      <div className="card soft center">
        <p className="card-label">
          <Icon name="calendar_today" /> THE WEDDING DAY
        </p>
        <p className="headline">{weddingDateKo}</p>
        <p className="body">{weddingTimeKo}</p>
        <span className="dday-pill">{dDayLabel(now)}</span>
      </div>

      <div className="card soft center">
        <p className="card-label">
          <Icon name="pin_drop" /> CEREMONY VENUE
        </p>
        <p className="headline">{config.venue.name}</p>
        <p className="body">{config.venue.hall}</p>
        <p className="body muted">{config.venue.address}</p>
      </div>
    </Section>
  )
}
