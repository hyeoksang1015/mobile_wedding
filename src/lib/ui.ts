import { useEffect, useRef, useState, type PointerEvent } from 'react'

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 구형 브라우저/비보안 컨텍스트/권한 거부 시
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;top:0;opacity:0'
    document.body.append(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: message }))
}

export async function copyWithToast(text: string, label = '복사되었습니다') {
  toast((await copyText(text)) ? label : '복사에 실패했어요. 길게 눌러 복사해주세요')
}

export async function shareInvitation(title: string, text: string) {
  const url = location.href.split('#')[0]
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
    } catch {
      // 사용자가 공유 시트를 닫은 경우
    }
    return
  }
  await copyWithToast(url, '청첩장 주소가 복사되었습니다')
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

let revealObserver: IntersectionObserver | undefined

/** 처음 화면에 들어올 때 `.reveal`을 붙이고 관찰을 끝낸다. 모든 섹션이 옵저버 하나를 공유한다. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reducedMotion() || !('IntersectionObserver' in window)) {
      el.classList.add('reveal')
      return
    }
    revealObserver ??= new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.classList.add('reveal')
          revealObserver?.unobserve(e.target)
        }
      },
      { threshold: 0.12 },
    )
    revealObserver.observe(el)
    return () => revealObserver?.unobserve(el)
  }, [])
  return ref
}

/** 탭이 보일 때만 주기적으로 갱신되는 현재 시각 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    let timer: number | undefined
    const sync = () => {
      clearInterval(timer)
      if (document.visibilityState !== 'visible') return
      setNow(Date.now())
      timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [intervalMs])
  return now
}

/** 좌우 스와이프. 세로 스크롤과 구분하려고 가로 이동이 더 클 때만 인정한다. */
export function swipeHandlers(onPrev: () => void, onNext: () => void) {
  let x = 0
  let y = 0
  return {
    onPointerDown: (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
    },
    onPointerUp: (e: PointerEvent) => {
      const dx = e.clientX - x
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(e.clientY - y)) return
      if (dx > 0) onPrev()
      else onNext()
    },
  }
}

/** 오버레이가 열려 있는 동안 배경 스크롤을 막는다 */
export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])
}

let openOverlays = 0
const stateDepth = (state: unknown) => (state as { depth?: number } | null)?.depth ?? 0

/**
 * 열려 있는 동안 히스토리 항목을 하나 쌓아서, 휴대폰 뒤로가기가 페이지 이탈 대신 오버레이를 닫게 한다.
 * 겹친 오버레이(사진첩 위 뷰어)는 depth로 구분해 맨 위 것만 닫힌다.
 */
export function useBackToClose(onClose: () => void) {
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })
  useEffect(() => {
    const depth = ++openOverlays
    // StrictMode 재마운트처럼 이미 같은 깊이의 항목이 있으면 재사용한다
    if (stateDepth(history.state) !== depth) history.pushState({ depth }, '')
    let popped = false
    const onPop = (e: PopStateEvent) => {
      if (stateDepth(e.state) >= depth) return
      popped = true
      closeRef.current()
    }
    window.addEventListener('popstate', onPop)
    return () => {
      openOverlays--
      window.removeEventListener('popstate', onPop)
      if (popped) return
      // 버튼으로 닫았으면 쌓아둔 항목을 걷어낸다. 곧바로 다시 마운트된 경우(StrictMode)는 그대로 둔다.
      setTimeout(() => {
        if (openOverlays < depth && stateDepth(history.state) === depth) history.back()
      })
    }
  }, [])
}

const KST = 'Asia/Seoul'

/** 한국 시간 기준 연/월/일/요일/시/분 */
export function kstParts(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: KST,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  )
  return {
    year: +parts.year,
    month: +parts.month,
    day: +parts.day,
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday),
    hour: +parts.hour,
    minute: +parts.minute,
  }
}

export const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

export function timeAgo(iso: string) {
  const sec = (Date.now() - Date.parse(iso)) / 1000
  if (sec < 60) return '방금'
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`
  if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`
  return `${Math.floor(sec / 86400)}일 전`
}
