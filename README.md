# 모바일 청첩장 + 하객 사진첩

1. [supabase.com](https://supabase.com)에서 무료 프로젝트를 만들고, SQL Editor에서 `supabase/migrations/`의 SQL 파일을 이름 순서대로 하나씩 실행합니다(테이블·RLS·RPC·`photos` 버킷, 도배 방지·방명록 비밀번호).
2. Project Settings → API에서 URL과 anon(publishable) 키를 복사해 `.env.example`을 `.env`로 복사한 뒤 채웁니다. 지도를 넣으려면 네이버 클라우드 Maps 키를 `VITE_NAVER_MAP_KEY`에 넣습니다.
3. 청첩장 문구·사진·계좌는 `src/config.ts`와 `public/images/`에서, 공유 미리보기는 `index.html`의 og 태그에서, 배경음악은 `public/bgm.mp3`로 바꿉니다. 디자인 값은 `src/styles/tokens.css`에 있습니다.
4. 로컬 실행: `npm install` → `npm run dev`. 검사: `npm run lint`, `npm run build`.
5. 배포(Cloudflare Pages 또는 Vercel): 이 저장소를 연결하고 빌드 명령 `npm run build`, 출력 폴더 `dist`(꼭 지정해야 함, 비우면 빈 화면), 환경 변수(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, 선택 `VITE_NAVER_MAP_KEY`)를 설정합니다.
6. GitHub 저장소 Secrets에 `SUPABASE_URL`, `SUPABASE_ANON_KEY`를 등록하면 `keepalive` 워크플로가 주 2회 DB를 깨워 무료 프로젝트 자동 정지를 막습니다.
7. 신고 내역은 Supabase 대시보드의 `reports` 테이블에서 보고, 문제 사진/댓글은 해당 행의 `hidden`을 `true`로 바꿔 숨깁니다.
