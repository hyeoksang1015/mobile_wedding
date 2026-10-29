import { useEffect, useState, type FormEvent } from 'react'
import {
  addGuestbook,
  deleteGuestbook,
  GUESTBOOK_PAGE,
  isRateLimited,
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
  const [password, setPassword] = useState('')
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
      const entry = await addGuestbook(nickname, body, password)
      saveNickname(nickname)
      setEntries((prev) => [entry, ...prev])
      setBody('')
      setPassword('')
      toast('축하 메시지가 등록되었습니다')
    } catch (err) {
      toast(
        isRateLimited(err)
          ? '메시지는 10분에 3개까지 남길 수 있어요'
          : '등록에 실패했어요. 잠시 후 다시 시도해주세요',
      )
    } finally {
      setBusy(false)
    }
  }

  const remove = async (g: GuestbookEntry) => {
    const pw = prompt('작성할 때 입력한 비밀번호 4자리를 입력해주세요')
    if (pw === null) return
    try {
      if (await deleteGuestbook(g.id, pw)) {
        setEntries((prev) => prev.filter((x) => x.id !== g.id))
        toast('메시지가 삭제되었습니다')
      } else {
        toast('비밀번호가 일치하지 않아요')
      }
    } catch {
      toast('삭제에 실패했어요')
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
            <div className="form-row">
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
              <label className="sr-only" htmlFor="gb-pw">
                삭제용 비밀번호 숫자 4자리
              </label>
              <input
                id="gb-pw"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                placeholder="비밀번호 (4자리)"
                maxLength={4}
                pattern="[0-9]{4}"
                required
              />
            </div>
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
              disabled={busy || !nickname.trim() || !body.trim() || password.length !== 4}
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
                  <button
                    type="button"
                    className="icon-btn tiny-btn"
                    onClick={() => remove(g)}
                    aria-label={`${g.nickname}님의 메시지 삭제`}
                  >
                    <Icon name="close" />
                  </button>
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
