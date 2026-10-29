// 청첩장의 모든 문구/정보. [대괄호] 값은 자리표시자이니 실제 정보로 바꿔주세요.
// 사진은 public/images/ 에 넣고 경로만 바꾸면 됩니다.

const venue = {
  name: '[예식장 이름]',
  hall: '[홀 이름]',
  address: '[예식장 도로명 주소]',
  tel: '[예식장 전화번호]',
  // 지도 핀/내비 목적지 좌표 (WGS84) — [자리표시자] 예식장 실제 좌표로 교체
  lat: 37.5665,
  lng: 126.978,
}

export const config = {
  groom: { name: '[신랑 이름]', firstName: '[신랑]', nameEn: 'GROOM', order: '장남' },
  bride: { name: '[신부 이름]', firstName: '[신부]', nameEn: 'BRIDE', order: '장녀' },

  // 예식 일시 (한국 시간 기준 ISO 8601) — [자리표시자] 실제 일시로 교체
  date: '2027-01-01T12:00:00+09:00',

  intro: {
    subtitle: '두 사람이 함께 시작하는 새로운 계절',
    typing: '[신랑] ♥ [신부], 결혼합니다',
  },

  greeting: {
    title: '소중한 분들을 초대합니다',
    body: '[인사말 첫째 문단]\n[인사말 둘째 줄]\n\n[인사말 둘째 문단]\n[인사말 넷째 줄]',
  },

  parents: {
    groom: [
      { role: '아버지', name: '[신랑 아버지]', phone: '' },
      { role: '어머니', name: '[신랑 어머니]', phone: '' },
      { role: '신랑', name: '[신랑 이름]', phone: '' },
    ],
    bride: [
      { role: '아버지', name: '[신부 아버지]', phone: '' },
      { role: '어머니', name: '[신부 어머니]', phone: '' },
      { role: '신부', name: '[신부 이름]', phone: '' },
    ],
  },

  venue,

  transport: [
    { icon: 'subway', title: '지하철', lines: ['[노선/역/출구 안내]'] },
    { icon: 'directions_bus', title: '버스', lines: ['[정류장/노선 안내]'] },
    { icon: 'local_parking', title: '자가용 & 주차', lines: ['[주차 안내]'] },
  ],

  // 앱이 설치돼 있으면 앱으로, 아니면 각 서비스 웹으로 연결됩니다. 필요하면 공유 링크로 교체하세요.
  mapLinks: {
    tmap: `tmap://route?goalname=${encodeURIComponent(venue.name)}&goalx=${venue.lng}&goaly=${venue.lat}`,
    kakaoNavi: `https://map.kakao.com/link/to/${encodeURIComponent(venue.name)},${venue.lat},${venue.lng}`,
    naverMap: `https://map.naver.com/p/search/${encodeURIComponent(venue.address)}`,
  },

  accounts: {
    groom: [
      { role: '신랑', name: '[신랑 이름]', bank: '[은행]', number: '[계좌번호]' },
      { role: '아버지', name: '[신랑 아버지]', bank: '[은행]', number: '[계좌번호]' },
      { role: '어머니', name: '[신랑 어머니]', bank: '[은행]', number: '[계좌번호]' },
    ],
    bride: [
      { role: '신부', name: '[신부 이름]', bank: '[은행]', number: '[계좌번호]' },
      { role: '아버지', name: '[신부 아버지]', bank: '[은행]', number: '[계좌번호]' },
      { role: '어머니', name: '[신부 어머니]', bank: '[은행]', number: '[계좌번호]' },
    ],
  },

  images: {
    intro: '/images/placeholder.svg',
    cover: '/images/placeholder.svg',
    greeting: '/images/placeholder.svg',
    gallery: [
      { src: '/images/placeholder.svg', caption: '[사진 설명]' },
      { src: '/images/placeholder.svg', caption: '[사진 설명]' },
      { src: '/images/placeholder.svg', caption: '[사진 설명]' },
      { src: '/images/placeholder.svg', caption: '[사진 설명]' },
      { src: '/images/placeholder.svg', caption: '[사진 설명]' },
    ],
  },

  share: {
    title: '[신랑] ♥ [신부] 결혼합니다',
    text: '[공유 메시지]',
  },
}
