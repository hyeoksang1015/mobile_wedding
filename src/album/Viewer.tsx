import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from '../components/common'
import {
  addComment,
  deleteOwnComment,
  deleteOwnPhoto,
  listComments,
  publicUrl,
  isRateLimited,
  report,
  toggleLike,
  type Comment,
  type Photo,
} from '../lib/api'
import { getNickname, saveNickname } from '../lib/storage'
import { swipeHandlers, timeAgo, toast, useBackToClose } from '../lib/ui'

const COMMENT_PAGE = 20

async function reportTarget(type: 'photo' | 'comment', id: string) {
  if (!confirm('부적절한 내용으로 신고할까요?')) return
  try {
    await report(type, id)
    toast('신고가 접수되었습니다')
  } catch {
    toast('신고에 실패했어요')
  }
}

function Comments({ photo, onCount }: { photo: Photo; onCount: (delta: number) => void }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [nickname, setNickname] = useState(getNickname)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  const load = (after?: Comment) =>
    listComments(photo.id, after).then(
      (rows) => {
        setComments((prev) => (after ? [...prev, ...rows] : rows))
        setHasMore(rows.length === COMMENT_PAGE)
      },
      () => toast('댓글을 불러오지 못했어요'),
    )

  useEffect(() => {
    listComments(photo.id).then(
      (rows) => {
        setComments(rows)
        setHasMore(rows.length === COMMENT_PAGE)
      },
      () => toast('댓글을 불러오지 못했어요'),
    )
  }, [photo.id])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const c = await addComment(photo.id, nickname, body)
      saveNickname(nickname)
      setComments((prev) => [c, ...prev])
      setBody('')
      onCount(1)
      toast('축하 댓글이 소중히 기록되었습니다')
    } catch (err) {
      toast(isRateLimited(err) ? '댓글은 1분에 10개까지 남길 수 있어요' : '댓글 등록에 실패했어요')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (c: Comment) => {
    if (!confirm('댓글을 삭제할까요?')) return
    try {
      if (await deleteOwnComment(c.id)) {
        setComments((prev) => prev.filter((x) => x.id !== c.id))
        onCount(-1)
      }
    } catch {
      toast('삭제에 실패했어요')
    }
  }

  return (
    <section className="comments" aria-label="댓글">
      <h3>
        댓글 <span className="count-pill">{photo.comment_count}</span>
      </h3>
      <ul>
        {comments.map((c) => (
          <li key={c.id} className="comment">
            <p className="comment-meta">
              <span className="avatar" aria-hidden="true">
                {c.nickname.slice(0, 1)}
              </span>
              <b>{c.nickname}</b>
              {c.mine && <span className="me-pill">나</span>}
              <span className="tiny muted">{timeAgo(c.created_at)}</span>
              {c.mine ? (
                <button
                  type="button"
                  className="icon-btn tiny-btn"
                  onClick={() => remove(c)}
                  aria-label="내 댓글 삭제"
                >
                  <Icon name="close" />
                </button>
              ) : (
                <button
                  type="button"
                  className="icon-btn tiny-btn"
                  onClick={() => reportTarget('comment', c.id)}
                  aria-label="댓글 신고"
                >
                  <Icon name="flag" />
                </button>
              )}
            </p>
            <p className="body">{c.body}</p>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button type="button" className="more-btn" onClick={() => load(comments.at(-1))}>
          댓글 더보기
        </button>
      )}
      <form className="comment-form" onSubmit={submit}>
        <label className="sr-only" htmlFor="c-nick">
          닉네임
        </label>
        <input
          id="c-nick"
          className="nick-chip"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임"
          maxLength={10}
          required
        />
        <label className="sr-only" htmlFor="c-body">
          댓글
        </label>
        <input
          id="c-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="따뜻한 축하 댓글을 남겨주세요"
          maxLength={200}
          required
        />
        <button
          type="submit"
          className="send-btn"
          disabled={busy || !nickname.trim() || !body.trim()}
          aria-label="댓글 등록"
        >
          <Icon name="send" />
        </button>
      </form>
    </section>
  )
}

/** 원본은 열린 사진만 로드하고, 그동안 이미 받은 썸네일을 흐리게 보여준다 */
function FullImage({ photo }: { photo: Photo }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <>
      {!loaded && <img className="viewer-placeholder" src={publicUrl(photo.thumb_path)} alt="" />}
      <img
        src={publicUrl(photo.path)}
        alt={`${photo.nickname}님이 올린 사진`}
        onLoad={() => setLoaded(true)}
        style={loaded ? undefined : { opacity: 0 }}
      />
    </>
  )
}

export function Viewer(props: {
  photos: Photo[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
  onPatch: (id: string, change: Partial<Photo>) => void
  onRemove: (id: string) => void
  onNeedMore: () => void
}) {
  const { photos, index, onIndex, onClose, onNeedMore } = props
  useBackToClose(onClose)
  const photo = photos[index]
  const liking = useRef(false)

  const prev = () => index > 0 && onIndex(index - 1)
  const next = () => index < photos.length - 1 && onIndex(index + 1)

  useEffect(() => {
    const following = photos[index + 1]
    if (following) new Image().src = publicUrl(following.path)
    if (index >= photos.length - 3) onNeedMore()
    // onNeedMore는 매 렌더마다 새 함수라 deps에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1)
      if (e.key === 'ArrowRight' && index < photos.length - 1) onIndex(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, photos.length, onClose, onIndex])

  const like = async () => {
    if (liking.current) return
    liking.current = true
    const before = { liked: photo.liked, like_count: photo.like_count }
    props.onPatch(photo.id, {
      liked: !before.liked,
      like_count: before.like_count + (before.liked ? -1 : 1),
    })
    try {
      props.onPatch(photo.id, await toggleLike(photo.id))
    } catch {
      props.onPatch(photo.id, before)
      toast('잠시 후 다시 시도해주세요')
    } finally {
      liking.current = false
    }
  }

  const removePhoto = async () => {
    if (!confirm('내가 올린 사진을 삭제할까요?')) return
    try {
      if (await deleteOwnPhoto(photo.id)) props.onRemove(photo.id)
    } catch {
      toast('삭제에 실패했어요')
    }
  }

  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label="사진 보기">
      <div className="viewer-bar">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="닫기" autoFocus>
          <Icon name="close" />
        </button>
        <span>
          <b>{index + 1}</b> / {photos.length}
        </span>
        {photo.mine ? (
          <button
            type="button"
            className="icon-btn"
            onClick={removePhoto}
            aria-label="내 사진 삭제"
          >
            <Icon name="delete" />
          </button>
        ) : (
          <button
            type="button"
            className="icon-btn"
            onClick={() => reportTarget('photo', photo.id)}
            aria-label="사진 신고"
          >
            <Icon name="flag" />
          </button>
        )}
      </div>

      <div className="viewer-scroll">
        <div className="viewer-stage" {...swipeHandlers(prev, next)}>
          <FullImage key={photo.id} photo={photo} />
          {index > 0 && (
            <button type="button" className="nav-arrow left" onClick={prev} aria-label="이전 사진">
              <Icon name="chevron_left" />
            </button>
          )}
          {index < photos.length - 1 && (
            <button type="button" className="nav-arrow right" onClick={next} aria-label="다음 사진">
              <Icon name="chevron_right" />
            </button>
          )}
        </div>

        <div className="viewer-info">
          <span className="avatar" aria-hidden="true">
            {photo.nickname.slice(0, 1)}
          </span>
          <span>
            <b>{photo.nickname}</b>
            <span className="tiny">{timeAgo(photo.created_at)}</span>
          </span>
          <button
            type="button"
            className={photo.liked ? 'like-btn liked' : 'like-btn'}
            onClick={like}
            aria-pressed={photo.liked}
            aria-label={photo.liked ? '좋아요 취소' : '좋아요'}
          >
            <Icon name="favorite" fill={photo.liked} /> {photo.like_count}
          </button>
        </div>

        <Comments
          key={photo.id}
          photo={photo}
          onCount={(d) =>
            props.onPatch(photo.id, { comment_count: Math.max(0, photo.comment_count + d) })
          }
        />
      </div>
    </div>
  )
}
