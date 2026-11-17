/* Ciclo PC-TO: funciona offline e pega a versão nova sempre que houver internet. */
var CACHE = 'ciclo-pcto-cebraspe-1';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k.indexOf('ciclo-pcto-') === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request; if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var fonte = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !fonte) return;
  if (fonte) {            /* fontes: usa a cópia guardada e atualiza por trás */
    e.respondWith(caches.open(CACHE).then(function(c){
      return c.match(req).then(function(hit){
        var rede = fetch(req).then(function(res){ c.put(req, res.clone()); return res; }).catch(function(){ return hit; });
        return hit || rede;
      });
    }));
    return;
  }
  /* app: tenta a internet primeiro; sem conexão, usa a cópia guardada */
  e.respondWith(fetch(req).then(function(res){
    if (res && res.ok) { var copia = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copia); }); }
    return res;
  }).catch(function(){
    return caches.match(req).then(function(hit){ return hit || caches.match('index.html'); });
  }));
});
