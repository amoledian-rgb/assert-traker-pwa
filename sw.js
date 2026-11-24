/* 내 자산관리 — 오프라인에서도 앱이 바로 열리도록 껍데기만 캐싱한다.
   사용자가 입력한 자산 데이터는 localStorage 에만 있고 여기로 오지 않는다. */
var CACHE = 'asset-shell-v19';
var ASSETS = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png', './prices.json', './prices_history.json', './market.json'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){
        /* 하나가 없어도(예: prices.json) 설치는 계속한다 */
        return Promise.all(ASSETS.map(function(a){
          return c.add(a).catch(function(){});
        }));
      })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      var hadOld = keys.some(function(k){ return k !== CACHE; });   /* 예전 버전이 깔려 있었는지 */
      return Promise.all(keys.map(function(k){ return k === CACHE ? null : caches.delete(k); })).then(function(){
        return self.clients.claim();
      }).then(function(){
        if(!hadOld) return null;   /* 첫 설치면 새로고침할 필요 없다 */
        /* 예전 버전 앱이 이미 열려 있으면 한 번 새로고침해 새 화면으로 바꾼다. */
        return self.clients.matchAll({type:'window'}).then(function(list){
          list.forEach(function(c){ try{ c.navigate(c.url); }catch(err){} });
        });
      });
    })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;   /* 이 앱의 파일만 다룬다 */

  if(/(^|\/)(prices\.json|prices_history\.json|market\.json)$/.test(url.pathname)){
    /* 시세·시장종합은 네트워크 우선 — 캐시 때문에 옛 값이 보이면 안 된다.
       오프라인일 때만 마지막으로 받은 파일을 쓴다. */
    var name = url.pathname.match(/market\.json$/) ? './market.json'
             : (/prices_history\.json$/.test(url.pathname) ? './prices_history.json' : './prices.json');
    e.respondWith(
      fetch(req).then(function(res){
        if(res && res.ok){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(name, copy); }).catch(function(){});
        }
        return res;
      }).catch(function(){
        return caches.match(name, {ignoreSearch:true});
      })
    );
    return;
  }

  if(req.mode === 'navigate'){
    /* 화면(index.html)은 인터넷이 있으면 항상 최신 것을 받아 온다.
       (새 버전을 바로 받도록) 연결이 없을 때만 캐시를 쓴다. */
    e.respondWith(
      fetch(req).then(function(res){
        if(res && res.ok){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put('./index.html', copy); }).catch(function(){});
        }
        return res;
      }).catch(function(){
        return caches.match('./index.html', {ignoreSearch:true}).then(function(hit){
          return hit || caches.match('./', {ignoreSearch:true});
        });
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
