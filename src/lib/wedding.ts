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
