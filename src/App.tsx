import { useRef, useState } from 'react'
import { Album } from './album/Album'
import { Bgm } from './components/Bgm'
import { Icon, Toast } from './components/common'
import { Cover } from './components/Cover'
import { Gallery } from './components/Gallery'
import { Gift } from './components/Gift'
import { Greeting } from './components/Greeting'
import { Guestbook } from './components/Guestbook'
import { Intro } from './components/Intro'
import { Location } from './components/Location'
import { WeddingCalendar } from './components/WeddingCalendar'
import { config } from './config'
import { copyWithToast, shareInvitation, useScrollLock } from './lib/ui'

const share = () => shareInvitation(config.share.title, config.share.text)

export default function App() {
  const [opened, setOpened] = useState(false)
  const [introGone, setIntroGone] = useState(false)
  const [albumOpen, setAlbumOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  useScrollLock(!introGone)

  const open = () => {
    // 모바일 자동재생 정책상 사용자 클릭 이벤트 안에서 바로 play() 해야 한다
    audioRef.current?.play().catch(() => {})
    setOpened(true)
  }

  return (
    <>
      <header className={opened ? 'topbar is-open' : 'topbar'}>
        <p className="topbar-title">
          {config.groom.firstName} <Icon name="favorite" fill /> {config.bride.firstName}
        </p>
        <Bgm audioRef={audioRef} />
      </header>

      {!introGone && <Intro leaving={opened} onOpen={open} onGone={() => setIntroGone(true)} />}

      <main className={opened ? 'invitation is-open' : 'invitation'} inert={!opened}>
        <Cover />
        <Greeting />
        <WeddingCalendar />
        <Gallery />
        <Location />
        <Gift />
        <Guestbook onOpenAlbum={() => setAlbumOpen(true)} />

        <footer className="footer">
          <p className="poem">소중한 걸음으로 축복해 주신{'\n'}모든 분께 머리 숙여 감사드립니다.</p>
          <p className="primary">
            {config.groom.firstName} &amp; {config.bride.firstName} 올림
          </p>
          <div className="footer-actions">
            <button type="button" className="primary-btn" onClick={share}>
              <Icon name="share" /> 청첩장 공유하기
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() =>
                copyWithToast(location.href.split('#')[0], '청첩장 주소가 복사되었습니다')
              }
            >
              <Icon name="content_copy" /> 주소 복사
            </button>
          </div>
        </footer>
      </main>

      {introGone && (
        <>
          <div className="fab-stack">
            <button
              type="button"
              className="fab"
              onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="맨 위로"
            >
              <Icon name="arrow_upward" />
            </button>
            <button type="button" className="fab primary" onClick={share} aria-label="청첩장 공유">
              <Icon name="share" />
            </button>
          </div>
          <nav className="bottom-nav" aria-label="섹션 바로가기">
            <a href="#greeting">
              <Icon name="favorite" />
              예식안내
            </a>
            <a href="#calendar">
              <Icon name="calendar_today" />
              일정
            </a>
            <button type="button" onClick={() => setAlbumOpen(true)}>
              <Icon name="photo_camera" />
              하객사진
            </button>
            <a href="#location">
              <Icon name="pin_drop" />
              오시는길
            </a>
            <a href="#gift">
              <Icon name="redeem" />
              마음전하기
            </a>
          </nav>
        </>
      )}

      {albumOpen && <Album onClose={() => setAlbumOpen(false)} />}
      <Toast />
    </>
  )
}
