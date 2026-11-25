# 모바일 청첩장 — GitHub Pages

[GitHub Pages 사용 사례](https://it-ist.tistory.com/365)와 아래 공개 청첩장 저장소의 화면 구성 아이디어를 참고해 **새로 만든 정적 Next.js 예제**입니다. 원본 사진·문구·코드를 복사하지 않았습니다. 이름·날짜·장소는 실제 정보가 아닌 예시입니다.

## 디자인 참고

GitHub 검색 결과 전체를 검토한 것은 아닙니다. 다음 저장소의 공개 화면·README와 라이선스를 확인하고 구성만 참고했습니다.

- [heejin-hwang/mobile-wedding-invitation](https://github.com/heejin-hwang/mobile-wedding-invitation) (MIT): 모바일 중심의 화사한 표지와 사진 갤러리. 여기서는 사진이 없어도 비어 보이지 않는 독자적인 식물 문양 표지로 대체했습니다.
- [juhonamnam/wedding-invitation](https://github.com/juhonamnam/wedding-invitation) (MIT): 초대 글 → 날짜 달력 → 장소·지도 흐름. 실제 교통편·계좌·사진은 제공받지 않아 추가하지 않았습니다.
- [nerdkim/wedding-invitation-for-nerds](https://github.com/nerdkim/wedding-invitation-for-nerds) (MIT): 달력과 모바일용 정적 청첩장 아이디어. 개발자·터미널 테마나 방명록은 적용하지 않았습니다.
- [leeworms/wedding-invitation](https://github.com/leeworms/wedding-invitation) (라이선스 미확인): 초기 레이아웃 검토용. 코드·이미지는 재사용하지 않았습니다.

## 수정할 곳

- `src/data/invitation.ts`: 이름, 한국시간 예식 일시, 장소, 주소, 인사말
- 사진 없이도 표지에 자체 제작 식물 문양이 표시됩니다. `public/couple.jpg`를 추가한 후 `photo: '/couple.jpg'`로 바꾸면 사진으로 대체됩니다.
- 공유 이미지 `og.png`는 예식 정보로 **빌드 시 자동 생성**. 문자/이미지 수정 후 다시 빌드·배포하세요.
- 공유/링크 복사, 네이버·카카오 지도 링크, 일정 파일(`.ics`) 다운로드는 브라우저에서 동작합니다.
- 방명록·하객 사진은 Supabase Edge Function과 비공개 Storage에 접수하고, 운영자가 승인한 것만 보여줍니다. Supabase를 연결하기 전에는 제출 기능을 열지 않습니다.

## 방명록·사진 업로드 연결

GitHub Pages에는 저장 기능이 없으므로 **Supabase 프로젝트**와 **Cloudflare Turnstile 위젯**을 별도로 준비해야 합니다. 계정은 각 서비스의 이용약관을 충족하는 사이트 운영자가 만들고 관리하세요. 현재 예시 사이트의 정보는 실제 예식 정보로 교체한 뒤 연결하세요.

1. Supabase 프로젝트를 만들고 CLI에서 `npx supabase login` → `npx supabase link --project-ref <프로젝트 ref>`를 실행합니다. `npx supabase db push`로 `supabase/migrations/`를 적용합니다. 또는 SQL Editor에서 마이그레이션 파일을 직접 실행합니다(둘 중 하나만).
2. 운영자가 SQL Editor에서 `supabase/issue-guest-passes.sql`을 실행해 16자리 코드를 발급합니다. 결과는 **한 번만 표시**되므로 안전한 곳에 별도로 보관하고, 하객마다 다른 코드를 전달하세요. 코드당 세 번 제출할 수 있습니다. 실제 코드·결과 파일은 저장소, 채팅 또는 공유 URL에 올리지 마세요.
3. Turnstile 위젯 허용 호스트에 실제 게시 호스트(`yuseh.github.io`)를 등록합니다. 로컬에서도 시험하려면 `localhost`도 등록하세요. 사이트 키는 공개 설정, **비밀 키는 Supabase Edge Function Secrets에만** 보관합니다.
4. Supabase Edge Function Secrets에 `TURNSTILE_SECRET`, `SITE_ORIGINS`(예: `https://yuseh.github.io,http://localhost:3000`)를 설정합니다. `SUBMISSIONS_ENABLED`는 아직 설정하지 마세요. `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`는 Supabase 함수 환경에서 제공되는 값인지 확인하세요. **service-role 키·Turnstile 비밀 키를 GitHub 변수, `.env` 공개 값, 저장소 또는 채팅에 넣지 마세요.**
5. `npx supabase functions deploy contributions --no-verify-jwt`로 함수를 배포합니다. 사이트 출처·Turnstile 서버 검증, 코드별 세 번 제한과 전체 승인 대기 100건 상한을 적용합니다. 함수의 `SUBMISSIONS_ENABLED`가 `true`가 아니면 POST는 503으로 닫힙니다.
6. GitHub 저장소 **Settings → Secrets and variables → Actions → Variables**에 `SUPABASE_URL`, `SUPABASE_ANON_KEY`(publishable/anon 공개 키), `TURNSTILE_SITE_KEY`를 넣습니다. URL은 `https://<project-ref>.supabase.co` 형식입니다. `SUBMISSIONS_ENABLED`는 아직 비워 두면 Pages 화면에 “준비 중”만 표시됩니다.
7. 테스트 준비가 된 운영자가 Edge Function Secrets의 `SUBMISSIONS_ENABLED=true`를 설정하고, 로컬 미리보기에서 공개 설정 세 값과 `NEXT_PUBLIC_SUBMISSIONS_ENABLED=true`를 사용해 테스트 코드·테스트 이미지로 접수→승인 흐름을 검증합니다. 확인 후 GitHub Actions 변수 `SUBMISSIONS_ENABLED=true`를 설정하고 Pages 워크플로를 다시 실행해 공개 폼을 엽니다.
8. 접수된 글은 Supabase **Table Editor → `wedding_contributions`**에서 확인하고, 적절한 항목만 `status`를 `approved`로 변경합니다. 사진은 서버에서 JPEG 메타데이터 구간을 제거한 뒤 비공개 `wedding-pending` 버킷에 저장되며 승인된 항목에만 만료되는 읽기 링크가 발급됩니다. 거절·삭제한 사진은 Storage에서도 직접 삭제하고, 행사 후 필요 없는 글·사진도 정리하세요.

연결 후에는 실제 사람의 사진 대신 테스트 이미지로 글·사진을 제출해 `pending` 상태에서 사이트에 보이지 않는지, 직접 Storage URL로는 열리지 않는지 확인하세요. `approved`로 바꾼 뒤 글·사진이 보이는지, `rejected` 또는 삭제 시 다시 숨겨지는지도 확인해야 합니다. 승인 목록은 요청 부담을 줄이기 위해 60초간 캐시하므로 반영까지 약 1분 걸릴 수 있고, 이미 발급된 사진 링크는 만료 전까지 열릴 수 있습니다.

“접수 여부를 확인할 수 없어요” 안내가 나오면 바로 다시 제출하거나 사진을 삭제하지 말고 운영자에게 확인하세요. 함수 로그의 임시 사진 경로와 `wedding_contributions.photo_path`를 대조하고, 장애 후 1시간이 지나면 운영자가 SQL Editor에서 `supabase/find-orphan-photos.sql`로 **연결되지 않은 오래된 사진만 조회**할 수 있습니다. 조회 결과를 확인한 뒤 해당 파일만 Storage 대시보드에서 수동 삭제하세요. 이 SQL은 파일을 삭제하지 않습니다.

방명록에는 연락처 등 민감한 정보를 적지 않도록 안내하고, 타인이 보이는 사진은 동의를 확인하세요. 미성년자가 나온 사진은 보호자 동의도 확인해야 합니다. 관리자용 승인 화면은 만들지 않았으며 Supabase 대시보드에서 직접 관리합니다. 실제 프로젝트 연결 전에는 저장·업로드의 실서비스 동작을 검증할 수 없습니다.

## 로컬 실행 및 검증

Node.js 22 설치 후:

```bash
npm ci
npm run dev
```

`http://localhost:3000`에서 확인. 다른 터미널에서 `npm test` 및 `npm run test:smoke`를 실행할 수 있습니다. `npm run build`는 정적 `out/` 폴더를 생성합니다. `npm run test:export`는 GitHub Pages용 경로/PNG를 검증합니다. **Windows Git Bash에서 `NEXT_PUBLIC_BASE_PATH=/repo` 값을 직접 전달할 때만** `MSYS_NO_PATHCONV=1`을 명령 앞에 붙이세요. GitHub Actions의 Linux에서는 불필요합니다.

## 도메인 구매 없이 GitHub Pages 배포

1. 이 폴더를 본인 GitHub 계정의 **공개 저장소**(예: `wedding-invitation`)로 만들고 `main` 브랜치에 올립니다. 비공개로 유지해야 할 정보나 원본 고화질 사진은 올리지 마세요.
2. 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정합니다.
3. `main`에 push하면 `.github/workflows/pages.yml`이 `npm ci` → 테스트 → 정적 빌드 → `out/` 배포를 실행합니다. 저장소 **Actions** 탭에서 성공 여부를 확인합니다.
4. 일반 저장소 주소: `https://사용자명.github.io/저장소명/`. 저장소 이름 자체가 `사용자명.github.io`이면 `https://사용자명.github.io/`입니다. 워크플로가 저장소명에 맞게 경로와 공유 미리보기 주소를 자동 설정합니다.
5. 실제 주소에서 페이지·사진·`og.png`·지도 링크·카카오톡 링크 미리보기를 확인하세요. 카카오톡의 캐시 때문에 이전 미리보기가 남을 수 있습니다.

> 참고 기사에는 `.gitlab-ci.yml` 예시가 등장하지만 이는 **GitLab CI용**입니다. 이 프로젝트는 GitHub Pages 공식 Actions 방식(`.github/workflows/pages.yml`)을 사용합니다.

## 나중에 구매한 도메인을 연결하려면

1. 원하는 도메인 구매 후 저장소 **Settings → Pages → Custom domain**에 입력합니다.
2. DNS 관리 화면에서 GitHub가 안내하는 레코드(하위 도메인은 보통 CNAME)를 설정하고 HTTPS 적용을 확인합니다.
3. 저장소 **Settings → Secrets and variables → Actions → Variables**에 `SITE_URL`을 추가합니다. 값은 `https://wedding.example.com`처럼 실제 도메인의 최종 URL입니다. 이후 `main`에 다시 push하거나 Actions에서 수동 실행하면 하위 경로 없이 새 주소용으로 빌드합니다.
4. 실제 주소와 미리보기 이미지가 새 도메인을 가리키는지 확인하세요. 기존 URL을 이미 공유했다면 리디렉션 동작도 확인하세요.

예시 버전은 [GitHub Pages](https://yuseh.github.io/wedding_planning/)에 게시됩니다. 별도 도메인은 연결하지 않았습니다. Supabase 설정이 없으면 방명록·사진 접수는 열리지 않습니다.
