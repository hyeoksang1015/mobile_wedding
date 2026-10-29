import { useEffect, useRef, useState, type RefObject } from 'react'
import { Icon } from './common'

/** public/bgm.mp3가 없으면 error 이벤트로 버튼을 숨긴다. 재생 시작은 App이 클릭 핸들러에서 한다. */
export function Bgm({ audioRef }: { audioRef: RefObject<HTMLAudioElement | null> }) {
  const [available, setAvailable] = useState(false)
  const [playing, setPlaying] = useState(false)
  const resumeOnShow = useRef(false)

  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current
      if (!audio) return
      if (document.hidden) {
        resumeOnShow.current = !audio.paused
        audio.pause()
      } else if (resumeOnShow.current) {
        audio.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [audioRef])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }

  return (
    <>
      <audio
        ref={audioRef}
        src="/bgm.mp3"
        loop
        preload="metadata"
        onLoadedMetadata={() => setAvailable(true)}
        onError={() => setAvailable(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {available && (
        <button
          type="button"
          className="bgm-toggle"
          onClick={toggle}
          aria-pressed={playing}
          aria-label={playing ? '배경음악 끄기' : '배경음악 켜기'}
        >
          <Icon name={playing ? 'volume_up' : 'volume_off'} />
          <span>BGM {playing ? 'ON' : 'OFF'}</span>
        </button>
      )}
    </>
  )
}
