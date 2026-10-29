import { config } from '../config'
import { copyWithToast, useNow, WEEKDAYS_KO } from '../lib/ui'
import {
  dDayLabel,
  daysLeft,
  icsHref,
  wedding,
  weddingAt,
  weddingDateKo,
  weddingPlace,
  weddingTimeKo,
} from '../lib/wedding'
import { Icon, Section } from './common'

const firstWeekday = new Date(Date.UTC(wedding.year, wedding.month - 1, 1)).getUTCDay()
const monthDays = new Date(Date.UTC(wedding.year, wedding.month, 0)).getUTCDate()
const cells = [
  ...Array<null>(firstWeekday).fill(null),
  ...Array.from({ length: monthDays }, (_, i) => i + 1),
]

const pad = (n: number) => String(n).padStart(2, '0')

export function WeddingCalendar() {
  const now = useNow()
  const left = Math.max(0, weddingAt - now)
  const units = [
    ['DAYS', Math.floor(left / 86_400_000)],
    ['HOURS', Math.floor(left / 3_600_000) % 24],
    ['MINS', Math.floor(left / 60_000) % 60],
    ['SECS', Math.floor(left / 1000) % 60],
  ] as const
  const days = daysLeft(now)

  return (
    <Section id="calendar" eyebrow="WEDDING DAY" title="소중한 날, 함께해 주세요">
      <p className="pill center-self">
        <Icon name="schedule" /> {weddingDateKo} {weddingTimeKo}
      </p>

      <div className="card center">
        <p className="body">
          {config.groom.firstName} <Icon name="favorite" fill /> {config.bride.firstName}의
          결혼식까지
        </p>
        <p className="dday-big">{dDayLabel(now)}</p>
        <p className="dday-pill">
          {days > 0
            ? `결혼식까지 ${days}일 남았습니다`
            : days === 0
              ? '오늘 결혼합니다'
              : '감사합니다'}
        </p>
        <div className="countdown" role="timer" aria-label="결혼식까지 남은 시간">
          {units.map(([label, value]) => (
            <div key={label}>
              <b>{pad(value)}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card calendar">
        <div className="calendar-head">
          <p>
            <b>
              {wedding.year}. {pad(wedding.month)}
            </b>
          </p>
          <p className="tiny primary">
            <Icon name="celebration" /> {weddingTimeKo}
          </p>
        </div>
        <table>
          <caption className="sr-only">
            {wedding.year}년 {wedding.month}월 달력
          </caption>
          <thead>
            <tr>
              {WEEKDAYS_KO.map((w) => (
                <th key={w} scope="col">
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) => (
              <tr key={row}>
                {Array.from({ length: 7 }, (_, col) => {
                  const day = cells[row * 7 + col]
                  const isWedding = day === wedding.day
                  return (
                    <td key={col} className={isWedding ? 'is-wedding' : undefined}>
                      {day && (
                        <span aria-label={isWedding ? `${day}일 예식일` : undefined}>{day}</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="tiny muted center">
          <span className="dot" aria-hidden="true" /> {weddingDateKo} {weddingTimeKo}{' '}
          {config.venue.name}
        </p>
      </div>

      <a className="primary-btn block" href={icsHref} download="wedding.ics">
        <Icon name="event_available" /> 캘린더에 일정 등록하기 (3시간 전 알림)
      </a>
      <button
        type="button"
        className="ghost-btn block"
        onClick={() =>
          copyWithToast(
            `${weddingDateKo} ${weddingTimeKo}\n${weddingPlace}`,
            '예식 일시와 장소가 복사되었습니다',
          )
        }
      >
        <Icon name="content_copy" /> 일시 복사하기
      </button>
    </Section>
  )
}
