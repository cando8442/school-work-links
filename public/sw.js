/* 바탕화면 앱으로 설치되게 하려면 서비스워커가 하나 있어야 합니다.
   내용을 캐시에 붙들어 두면 고친 내용이 늦게 반영되므로, 항상 새로 받아 옵니다. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  /* 네트워크 기본 동작에 맡깁니다. */
});
