import { createClient } from '@supabase/supabase-js'
import { getDeviceId } from './storage'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/** env가 없으면 null — 사진첩/방명록은 "준비 중"으로 표시된다 */
export const supabase =
  url && key ? createClient(url, key, { auth: { persistSession: false } }) : null

const BUCKET = 'photos'
export const PAGE_SIZE = 24

export type Sort = 'recent' | 'popular'

export type Photo = {
  id: string
  nickname: string
  path: string
  thumb_path: string
  like_count: number
  comment_count: number
  created_at: string
  mine: boolean
  liked: boolean
}

export type Comment = {
  id: string
  nickname: string
  body: string
  created_at: string
  mine: boolean
}
export type GuestbookEntry = { id: string; nickname: string; body: string; created_at: string }

function db() {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다')
  return supabase
}

async function rpc<T>(fn: string, args: Record<string, unknown>) {
  const { data, error } = await db().rpc(fn, args)
  if (error) throw new Error(error.message)
  return data as T
}

/** DB의 기기당 쓰기 제한(_rate_limit)에 걸렸는지 */
export const isRateLimited = (e: unknown) => e instanceof Error && e.message === 'too many requests'

export const publicUrl = (path: string) =>
  db().storage.from(BUCKET).getPublicUrl(path).data.publicUrl

export function listPhotos(sort: Sort, after?: Photo) {
  return rpc<Photo[]>('list_photos', {
    p_device_id: getDeviceId(),
    p_sort: sort,
    p_after_created: after?.created_at ?? null,
    p_after_likes: after?.like_count ?? null,
    p_after_id: after?.id ?? null,
    p_limit: PAGE_SIZE,
  })
}

export const toggleLike = (photoId: string) =>
  rpc<{ liked: boolean; like_count: number }>('toggle_like', {
    p_photo_id: photoId,
    p_device_id: getDeviceId(),
  })

export const deleteOwnPhoto = (photoId: string) =>
  rpc<boolean>('delete_own_photo', { p_photo_id: photoId, p_device_id: getDeviceId() })

export const listComments = (photoId: string, after?: Comment) =>
  rpc<Comment[]>('list_comments', {
    p_photo_id: photoId,
    p_device_id: getDeviceId(),
    p_after_created: after?.created_at ?? null,
    p_after_id: after?.id ?? null,
  })

export const addComment = (photoId: string, nickname: string, body: string) =>
  rpc<Comment>('add_comment', {
    p_photo_id: photoId,
    p_device_id: getDeviceId(),
    p_nickname: nickname,
    p_body: body,
  })

export const deleteOwnComment = (commentId: string) =>
  rpc<boolean>('delete_own_comment', { p_comment_id: commentId, p_device_id: getDeviceId() })

export const report = (type: 'photo' | 'comment', id: string) =>
  rpc<void>('report', { p_target_type: type, p_target_id: id, p_device_id: getDeviceId() })

export const GUESTBOOK_PAGE = 10

export const listGuestbook = (after?: GuestbookEntry) =>
  rpc<GuestbookEntry[]>('list_guestbook', {
    p_after_created: after?.created_at ?? null,
    p_after_id: after?.id ?? null,
    p_limit: GUESTBOOK_PAGE,
  })

export const addGuestbook = (nickname: string, body: string, password: string) =>
  rpc<GuestbookEntry>('add_guestbook', {
    p_device_id: getDeviceId(),
    p_nickname: nickname,
    p_body: body,
    p_password: password,
  })

export const deleteGuestbook = (id: string, password: string) =>
  rpc<boolean>('delete_guestbook', { p_id: id, p_password: password })

/** XHR로 올려야 업로드 진행률을 받을 수 있다 (supabase-js 업로드는 fetch 기반) */
export function uploadFile(path: string, blob: Blob, onProgress: (loaded: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${url}/storage/v1/object/${BUCKET}/${path}`)
    xhr.setRequestHeader('apikey', key!)
    xhr.setRequestHeader('Authorization', `Bearer ${key}`)
    xhr.setRequestHeader('Content-Type', blob.type)
    xhr.setRequestHeader('Cache-Control', 'max-age=31536000')
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.upload.onprogress = (e) => onProgress(e.loaded)
    xhr.onload = () =>
      xhr.status < 300 ? resolve() : reject(new Error(`upload ${xhr.status}: ${xhr.responseText}`))
    xhr.onerror = () => reject(new Error('network error'))
    xhr.send(blob)
  })
}

export const registerPhoto = (nickname: string, path: string, thumbPath: string) =>
  rpc<string>('add_photo', {
    p_device_id: getDeviceId(),
    p_nickname: nickname,
    p_path: path,
    p_thumb_path: thumbPath,
  })

/** 등록 실패 시 이미 올라간 파일 정리. 정책상 10분 내 미등록 파일만 지울 수 있다. */
export async function removeFiles(paths: string[]) {
  if (paths.length) await db().storage.from(BUCKET).remove(paths)
}
