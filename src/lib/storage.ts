// localStorage는 사생활 보호 모드/차단 설정에서 예외를 던지므로 항상 감싸서 쓴다.
function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 저장 불가: 이번 방문 동안만 메모리 값으로 동작
  }
}

const DEVICE_KEY = 'wedding.device_id'
const NICK_KEY = 'wedding.nickname'

let deviceId = read(DEVICE_KEY)
if (!deviceId) {
  deviceId = crypto.randomUUID()
  write(DEVICE_KEY, deviceId)
}

export const getDeviceId = () => deviceId as string

let nickname = read(NICK_KEY) ?? ''
export const getNickname = () => nickname
export function saveNickname(value: string) {
  nickname = value.trim()
  write(NICK_KEY, nickname)
}
