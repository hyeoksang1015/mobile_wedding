import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Icon } from '../components/common'
import { registerPhoto, removeFiles, uploadFile } from '../lib/api'
import { IMAGE_EXT, MAX_SOURCE_BYTES, resizeImage } from '../lib/image'
import { getNickname, saveNickname } from '../lib/storage'
import { toast } from '../lib/ui'

const CONCURRENCY = 3

type Status = 'ready' | 'queued' | 'working' | 'done' | 'error'
type Item = {
  id: string
  preview: string
  status: Status
  progress: number
  message?: string
  retryable?: boolean
}
type Source = { file: File; resized?: { original: Blob; thumb: Blob } }

export function Uploader(props: { onClose: () => void; onUploaded: () => void }) {
  const [nickname, setNickname] = useState(getNickname)
  const [items, setItems] = useState<Item[]>([])
  const sources = useRef(new Map<string, Source>())
  const queue = useRef<string[]>([])
  const active = useRef(0)
  const uploadedInBatch = useRef(0)
  const nickRef = useRef(nickname)

  useEffect(() => {
    const map = sources.current
    return () => map.forEach((_, id) => URL.revokeObjectURL(id))
  }, [])

  const patch = (id: string, change: Partial<Item>) =>
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...change } : it)))

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    const added = files.map((file): Item => {
      const id = URL.createObjectURL(file)
      sources.current.set(id, { file })
      return file.size > MAX_SOURCE_BYTES
        ? { id, preview: id, status: 'error', progress: 0, message: '20MB 초과' }
        : { id, preview: id, status: 'ready', progress: 0 }
    })
    if (added.some((it) => it.status === 'error')) toast('20MB를 넘는 사진은 올릴 수 없어요')
    setItems((list) => [...list, ...added])
  }

  const process = async (id: string) => {
    const src = sources.current.get(id)!
    patch(id, { status: 'working', progress: 0, message: undefined })
    try {
      src.resized ??= await resizeImage(src.file)
    } catch {
      patch(id, { status: 'error', message: '지원하지 않는 형식', retryable: false })
      return
    }
    const { original, thumb } = src.resized
    const name = crypto.randomUUID()
    const path = `${name}.${IMAGE_EXT}`
    const thumbPath = `${name}_thumb.${IMAGE_EXT}`
    const total = original.size + thumb.size
    const uploaded: string[] = []
    try {
      await uploadFile(path, original, (n) => patch(id, { progress: (n / total) * 0.95 }))
      uploaded.push(path)
      await uploadFile(thumbPath, thumb, (n) =>
        patch(id, { progress: ((original.size + n) / total) * 0.95 }),
      )
      uploaded.push(thumbPath)
      await registerPhoto(nickRef.current, path, thumbPath)
      uploadedInBatch.current++
      patch(id, { status: 'done', progress: 1 })
    } catch {
      // 보상 처리: 메타데이터가 없는 파일은 지운다
      removeFiles(uploaded).catch(() => {})
      patch(id, { status: 'error', message: '업로드 실패', retryable: true })
    }
  }

  const pump = () => {
    while (active.current < CONCURRENCY && queue.current.length) {
      const id = queue.current.shift()!
      active.current++
      process(id).finally(() => {
        active.current--
        pump()
        if (active.current === 0 && queue.current.length === 0 && uploadedInBatch.current) {
          toast(`${uploadedInBatch.current}장의 사진이 등록되었습니다`)
          uploadedInBatch.current = 0
          props.onUploaded()
        }
      })
    }
  }

  const enqueue = (ids: string[]) => {
    const nick = nickname.trim()
    if (!nick) {
      toast('닉네임을 입력해주세요')
      return
    }
    nickRef.current = nick
    saveNickname(nick)
    for (const id of ids) patch(id, { status: 'queued', progress: 0 })
    queue.current.push(...ids)
    pump()
  }

  const ready = items.filter((it) => it.status === 'ready')
  const busy = items.some((it) => it.status === 'queued' || it.status === 'working')

  const close = () => {
    if (busy && !confirm('업로드 중입니다. 창을 닫으면 남은 사진은 올라가지 않아요.')) return
    queue.current = []
    props.onClose()
  }

  const discard = (id: string) => {
    URL.revokeObjectURL(id)
    sources.current.delete(id)
    setItems((list) => list.filter((it) => it.id !== id))
  }

  return (
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="upload-title">
        <div className="sheet-head">
          <h2 id="upload-title">
            <Icon name="photo_library" /> 사진 올리기
          </h2>
          <button type="button" className="icon-btn soft" onClick={close} aria-label="닫기">
            <Icon name="close" />
          </button>
        </div>
        <p className="notice">
          <Icon name="info" /> 사진은 자동으로 용량이 줄어들어 빠르게 올라가요
        </p>

        <label className="field-label" htmlFor="up-nick">
          <span>
            작성자 닉네임 <span className="primary">*</span>
          </span>
          <span className="tiny muted">{nickname.length} / 10자</span>
        </label>
        <input
          id="up-nick"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={10}
          placeholder="닉네임"
          disabled={busy}
        />

        <p className="field-label">
          선택한 사진 <span className="tiny primary">{items.length}장</span>
        </p>
        <ul className="upload-grid">
          {items.map((it) => (
            <li key={it.id} className={`upload-item ${it.status}`}>
              {/* HEIC 등 브라우저가 못 그리는 미리보기는 깨진 아이콘 대신 숨긴다 */}
              <img src={it.preview} alt="" onError={(e) => (e.currentTarget.hidden = true)} />
              <span className="upload-state">
                {it.status === 'working' || it.status === 'queued' ? (
                  <>
                    <span className="tiny">
                      {it.status === 'queued' ? '대기 중' : `${Math.round(it.progress * 100)}%`}
                    </span>
                    <span
                      className="bar"
                      role="progressbar"
                      aria-valuenow={Math.round(it.progress * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="업로드 진행률"
                    >
                      <span style={{ width: `${it.progress * 100}%` }} />
                    </span>
                  </>
                ) : it.status === 'done' ? (
                  <span className="tiny">
                    <Icon name="check_circle" /> 완료
                  </span>
                ) : it.status === 'error' ? (
                  <>
                    <span className="tiny">
                      <Icon name="error" /> {it.message}
                    </span>
                    {it.retryable && (
                      <button type="button" className="retry-btn" onClick={() => enqueue([it.id])}>
                        <Icon name="refresh" /> 재시도
                      </button>
                    )}
                  </>
                ) : null}
              </span>
              {(it.status === 'ready' || it.status === 'error') && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => discard(it.id)}
                  aria-label="선택 취소"
                >
                  <Icon name="close" />
                </button>
              )}
            </li>
          ))}
          <li>
            <label className="add-photo">
              <Icon name="add_photo_alternate" />
              <span className="tiny">사진 추가</span>
              <input type="file" accept="image/*" multiple onChange={pick} className="sr-only" />
            </label>
          </li>
        </ul>

        <button
          type="button"
          className="primary-btn block"
          disabled={!ready.length || busy}
          onClick={() => enqueue(ready.map((it) => it.id))}
        >
          <Icon name="upload" />{' '}
          {ready.length ? `${ready.length}장 등록하기` : '사진을 선택해주세요'}
        </button>
      </div>
    </div>
  )
}
