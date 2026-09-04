// =====================================
// Secure Vault Pro PWA
// Offline Service Worker
// =====================================


const CACHE_NAME =
"secure-vault-v1.2";



// ===============================
// 只缓存程序文件
// 不缓存用户密码数据
// ===============================


const FILES_TO_CACHE=[


"./",

"./index.html",

"./style.css",

"./crypto.js",

"./vault.js",

"./security.js",

"./health.js",

"./app.js",

"./manifest.json",


"./icon-192.png",

"./icon-512.png"


];




// ===============================
// 安装
// ===============================


self.addEventListener(
"install",
event=>{


event.waitUntil(


caches.open(
CACHE_NAME
)

.then(cache=>{


return cache.addAll(
FILES_TO_CACHE
);


})


);



self.skipWaiting();


});






// ===============================
// 激活
// 清理旧版本
// ===============================


self.addEventListener(
"activate",
event=>{


event.waitUntil(


caches.keys()

.then(keys=>{


return Promise.all(


keys.map(key=>{


if(
key!==CACHE_NAME
){


return caches.delete(key);


}


})


);


})


);



self.clients.claim();


});







// ===============================
// 请求处理
// Cache First
// ===============================


self.addEventListener(
"fetch",
event=>{


const request=
event.request;



// 只处理GET

if(
request.method!=="GET"
)
return;



event.respondWith(


caches.match(request)

.then(cacheResponse=>{


if(cacheResponse){


return cacheResponse;


}



return fetch(request);


})


);



});