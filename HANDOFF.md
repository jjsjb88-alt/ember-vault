# Ember Vault V9 작업 인계

V9는 2026-11-06의 기존 main `878b3bc`에서 이어 작업했다. 기존 게임의 메아리·숨결, 도적 걷기·공격, 컷신과 자동 메달 추출을 보존하고, 마지막 유물 회수·귀환까지 직접 해보는 튜토리얼과 전략 던전을 확장한다.

- 일반 새 탐험: 20방·5층. `newRun({layout:'classic'})`은 기존16방·RNG를 유지한다.
- 저장 key/version은 그대로다. 기존16방 탐험을 임의로 확장하지 않는다. 메뉴 → 새 탐험의 확인 화면을 거쳐야20방으로 시작한다.
- 윈치17은 기술2·소리6으로9↔17 승강통로를 연다. 소리·추적·숨결은 실제 edges를 따른다.
- 튜토리얼14단계: 처음10개 기본 조작, 양갈래길·선택 상호작용·유물·실제 탈출. 기존 탐험/최고 기록은 보존하고, 실패시11단계 체크포인트부터 재시도한다.
- 주 UI: `dist/app.js`, `dist/v9.css`; 규칙: `engine.js`; 지도: `scene-layout.js`/`scene-v5.js`/`noise-moment.js`; 여행 안내: `strategy.js`.
- 회수 atlas: `dist/assets/v9/motion/rogue-relic-se/manifest.json`; 런타임 절대rect 모듈은 제작 도구로 생성해 원본과 일치시킨다. 이미지격자를 추측하거나개별프레임배율을바꾸지않는다.

검사: `npm run check && npm test`. 브라우저·그림·8개도구 적용범위/한계는 `docs/production/V9-VERIFICATION.md`, `V9-TOOLS.md`, `V9-MOTION.md`, `V9-ENVIRONMENT.md` 참조. GPU 연구후보SSD는실행하지않았고 Forge의머리밴드자동FAIL은별도시각채택근거와함께보존한다. 모든미술검사가자동PASS라고표현하지않는다.

실제 iOS/Android 휴대폰의 성능·오디오·장기적인 밸런스, 다른 직업의 신규 모션, 모든방의독립배경은별도작업이다. B5배경은기존배경의선택적표면변형이다.

배포는기존 `main`의 GitHub Pages 워크플로를사용한다. Jekyll source는저장소루트이며 루트 `index.html`이`dist/`로연결한다. 공개게임주소는 https://jjsjb88-alt.github.io/ember-vault/dist/ . 이실행환경에서는 Pages도메인직접접속이403프록시차단이므로 로컬터치브라우저검증과GitHub Actions배포성공을구분한다. 보호규칙을바꾸거나강제푸시하지않는다.
