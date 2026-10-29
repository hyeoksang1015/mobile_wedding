import { config } from '../config'
import { kstParts, WEEKDAYS_KO } from './ui'

export const weddingAt = Date.parse(config.date)
export const wedding = kstParts(new Date(weddingAt))

const hour = `${wedding.hour < 12 ? '오전' : '오후'} ${wedding.hour % 12 || 12}시${wedding.minute ? ` ${wedding.minute}분` : ''}`
export const weddingDateKo = `${wedding.year}년 ${wedding.month}월 ${wedding.day}일 ${WEEKDAYS_KO[wedding.weekday]}요일`
export const weddingTimeKo = hour

/** 한국 날짜 기준 남은 일수 (당일 0, 지나면 음수) */
export function daysLeft(now: number) {
  const n = kstParts(new Date(now))
  return Math.round(
    (Date.UTC(wedding.year, wedding.month - 1, wedding.day) -
      Date.UTC(n.year, n.month - 1, n.day)) /
      86_400_000,
  )
}

export function dDayLabel(now: number) {
  const d = daysLeft(now)
  return d > 0 ? `D-${d}` : d === 0 ? 'D-DAY' : `D+${-d}`
}

const utc = (ms: number) => new Date(ms).toISOString().replace(/[-:]|\.\d{3}/g, '')
const icsText = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`)
const { venue, groom, bride } = config

export const weddingTitle = `${groom.firstName} ♥ ${bride.firstName} 결혼식`
export const weddingPlace = `${venue.name} ${venue.hall}, ${venue.address}`

/** 캘린더 앱에 바로 추가되는 .ics. 예식 3시간 전에 알림이 울린다. */
export const icsHref =
  'data:text/calendar;charset=utf-8,' +
  encodeURIComponent(
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//mobile-wedding//KO',
      'BEGIN:VEVENT',
      `UID:wedding-${weddingAt}@mobile-wedding`,
      `DTSTAMP:${utc(weddingAt)}`,
      `DTSTART:${utc(weddingAt)}`,
      // 종료 시각은 config에 없어 예식+식사를 2시간으로 잡는다
      `DTEND:${utc(weddingAt + 2 * 3_600_000)}`,
      `SUMMARY:${icsText(weddingTitle)}`,
      `LOCATION:${icsText(weddingPlace)}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT3H',
      'ACTION:DISPLAY',
      `DESCRIPTION:${icsText(weddingTitle)}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n'),
  )
