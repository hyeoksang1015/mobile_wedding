import { useEffect, useState, type FormEvent } from 'react'
import {
  addGuestbook,
  GUESTBOOK_PAGE,
  listGuestbook,
  supabase,
  type GuestbookEntry,
} from '../lib/api'
import { getNickname, saveNickname } from '../lib/storage'
import { timeAgo, toast } from '../lib/ui'
import { Icon, Section } from './common'

export function Guestbook({ onOpenAlbum }: { onOpenAlbum: () => void }) {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [nickname, setNickname] = useState(getNickname)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async (after?: GuestbookEntry) => {
    try {
      const rows = await listGuestbook(after)
      setEntries((prev) => (after ? [...prev, ...rows] : rows))
      setHasMore(rows.length === GUESTBOOK_PAGE)
    } catch {
      toast('방명록을 불러오지 못했어요')
    }
  }

  useEffect(() => {
    if (!supabase) return
    listGuestbook().then(
      (rows) => {
        setEntries(rows)
        setHasMore(rows.length === GUESTBOOK_PAGE)
      },
      () => {},
    )
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const entry = await addGuestbook(nickname, body)
      saveNickname(nickname)
      setEntries((prev) => [entry, ...prev])
      setBody('')
      toast('축하 메시지가 등록되었습니다')
    } catch {
      toast('등록에 실패했어요. 잠시 후 다시 시도해주세요')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section id="guestbook" eyebrow="GUESTBOOK" title="축복의 한마디">
      <div className="card album-cta">
        <p className="strong">
          <Icon name="photo_camera" /> 하객 사진첩에 사진을 공유해주세요
        </p>
        <p className="tiny muted">오늘 촬영한 순간들을 신랑·신부와 함께 나눠요</p>
        <button type="button" className="ghost-btn" onClick={onOpenAlbum}>
          <Icon name="photo_library" /> 사진첩 바로가기
        </button>
      </div>

      {!supabase ? (
        <p className="card tiny muted center">방명록 준비 중입니다</p>
      ) : (
        <>
          <form className="card form" onSubmit={submit}>
            <p className="strong">
              <Icon name="edit_note" /> 축하 메시지 남기기
            </p>
            <label className="sr-only" htmlFor="gb-name">
              이름
            </label>
            <input
              id="gb-name"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="이름 (10자 이내)"
              maxLength={10}
              required
            />
            <label className="sr-only" htmlFor="gb-body">
              메시지
            </label>
            <textarea
              id="gb-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="신랑, 신부에게 따뜻한 축하의 메시지를 남겨주세요"
              maxLength={200}
              rows={3}
              required
            />
            <p className="tiny muted right">{body.length} / 200</p>
            <button
              type="submit"
              className="primary-btn"
              disabled={busy || !nickname.trim() || !body.trim()}
            >
              <Icon name="favorite" /> 작성하기
            </button>
          </form>

          <ul className="guestbook-list">
            {entries.map((g) => (
              <li key={g.id} className="card">
                <p className="comment-meta">
                  <span className="avatar" aria-hidden="true">
                    {g.nickname.slice(0, 1)}
                  </span>
                  <b>{g.nickname}</b>
                  <span className="tiny muted">{timeAgo(g.created_at)}</span>
                </p>
                <p className="body">{g.body}</p>
              </li>
            ))}
          </ul>
          {hasMore && (
            <button type="button" className="more-btn" onClick={() => load(entries.at(-1))}>
              방명록 더보기 <Icon name="expand_more" />
            </button>
          )}
        </>
      )}
    </Section>
  )
}
