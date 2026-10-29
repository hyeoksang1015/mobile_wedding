// Safari 등 WebP 인코딩을 못 하는 브라우저는 toDataURL이 PNG로 떨어지므로 그걸로 판별한다.
const webp = (() => {
  const c = document.createElement('canvas')
  c.width = c.height = 1
  return c.toDataURL('image/webp').startsWith('data:image/webp')
})()

export const IMAGE_TYPE = webp ? 'image/webp' : 'image/jpeg'
export const IMAGE_EXT = webp ? 'webp' : 'jpg'
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('encode failed'))),
      IMAGE_TYPE,
      quality,
    ),
  )

async function encode(source: ImageBitmap, maxSide: number, budget: number) {
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(source.width * scale)
  canvas.height = Math.round(source.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  // 기본 q0.8. 디테일이 아주 많은 사진만 용량 예산에 들어올 때까지 품질을 낮춘다.
  let blob = await toBlob(canvas, 0.8)
  for (const q of [0.7, 0.6, 0.5]) {
    if (blob.size <= budget) break
    blob = await toBlob(canvas, q)
  }
  return blob
}

/** 원본(긴 변 1600px, ≤400KB)과 썸네일(400px, ≤50KB). 디코드 못 하는 형식(HEIC 등)은 reject. */
export async function resizeImage(file: Blob) {
  // EXIF 회전값을 픽셀에 반영해서 디코드
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    return {
      original: await encode(bitmap, 1600, 400 * 1024),
      thumb: await encode(bitmap, 400, 50 * 1024),
    }
  } finally {
    bitmap.close()
  }
}
