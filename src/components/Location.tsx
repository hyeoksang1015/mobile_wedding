import { useEffect, useRef } from 'react'
import { config } from '../config'
import { copyWithToast } from '../lib/ui'
import { Icon, Section } from './common'

const { venue, naverMapLink, transport } = config
const mapKey = import.meta.env.VITE_NAVER_MAP_KEY

type NaverMaps = {
  Map: new (el: HTMLElement, opts: object) => unknown
  LatLng: new (lat: number, lng: number) => unknown
  Marker: new (opts: object) => unknown
}

function NaverMap({ apiKey }: { apiKey: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const script = document.createElement('script')
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${apiKey}`
    script.onload = () => {
      const maps = (window as unknown as { naver?: { maps: NaverMaps } }).naver?.maps
      if (!maps || !ref.current) return
      const position = new maps.LatLng(venue.lat, venue.lng)
      const map = new maps.Map(ref.current, { center: position, zoom: 16 })
      new maps.Marker({ position, map })
    }
    document.head.append(script)
    return () => script.remove()
  }, [apiKey])
  return <div ref={ref} className="map" role="img" aria-label={`${venue.name} 위치 지도`} />
}

export function Location() {
  return (
    <Section id="location" eyebrow="LOCATION" title="오시는 길">
      <div className="card">
        <p className="headline">{venue.name}</p>
        <p className="body">{venue.hall}</p>
        <div className="address-box">
          <p>
            <Icon name="location_on" /> {venue.address}
          </p>
          <button
            type="button"
            className="ghost-btn small"
            onClick={() => copyWithToast(venue.address, '주소가 복사되었습니다')}
          >
            <Icon name="content_copy" /> 주소 복사
          </button>
        </div>
        <a className="tel-link" href={`tel:${venue.tel}`}>
          <Icon name="call" /> {venue.tel}
        </a>
      </div>

      {mapKey && <NaverMap apiKey={mapKey} />}

      <p className="tiny muted">길찾기</p>
      <a className="nav-btn" href={naverMapLink} target="_blank" rel="noreferrer">
        <span className="nav-mark" aria-hidden="true">
          N
        </span>
        네이버지도로 길찾기
      </a>

      <h3 className="sub-title">
        <Icon name="directions_bus" /> 대중교통 및 주차 안내
      </h3>
      {transport.map((t) => (
        <div key={t.title} className="card transport">
          <span className="round-icon" aria-hidden="true">
            <Icon name={t.icon} />
          </span>
          <div>
            <p className="strong">{t.title}</p>
            {t.lines.map((line) => (
              <p key={line} className="body">
                {line}
              </p>
            ))}
          </div>
        </div>
      ))}
    </Section>
  )
}
