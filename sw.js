/* 내 자산관리 — 오프라인에서도 앱이 바로 열리도록 껍데기만 캐싱한다.
   사용자가 입력한 자산 데이터는 localStorage 에만 있고 여기로 오지 않는다. */
var CACHE = 'asset-shell-v1';
var ASSETS = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;   /* 이 앱의 파일만 다룬다 */

  if(req.mode === 'navigate'){
    /* 화면(index.html)은 캐시 우선 — 인터넷이 없어도 바로 뜬다 */
    e.respondWith(
      caches.match('./index.html', {ignoreSearch:true}).then(function(hit){
        return hit || fetch(req).catch(function(){ return caches.match('./', {ignoreSearch:true}); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req, {ignoreSearch:true}).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        if(res && res.ok){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
        }
        return res;
      });
    })
  );
});
