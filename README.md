# 모바일 청첩장 기본형 — GitHub Pages

[leeworms/wedding-invitation](https://github.com/leeworms/wedding-invitation)의 화면 구성 아이디어와 [GitHub Pages 사용 사례](https://it-ist.tistory.com/365)를 참고해 **새로 만든 정적 Next.js 예제**입니다. 원본 사진·문구·코드를 복사하지 않았습니다. 이름·날짜·장소는 실제 정보가 아닌 예시입니다.

## 수정할 곳

- `src/data/invitation.ts`: 이름, 한국시간 예식 일시, 장소, 주소, 인사말
- `public/couple.jpg`를 추가한 후 `photo: '/couple.jpg'`로 바꾸면 사진 표시
- 공유 이미지 `og.png`는 예식 정보로 **빌드 시 자동 생성**. 문자/이미지 수정 후 다시 빌드·배포하세요.
- 공유/링크 복사, 네이버·카카오 지도 링크, 일정 파일(`.ics`) 다운로드는 브라우저에서 동작합니다.
- 방명록·사진 업로드·비공개 관리 기능은 없습니다. GitHub Pages만으로는 서버/API/DB를 운영할 수 없습니다.

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

GitHub 저장소 생성·업로드·실제 Pages 배포·도메인 구매는 **아직 하지 않았습니다.** 현재 파일은 로컬 준비 상태입니다.
