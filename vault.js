// =====================================
// Secure Vault Pro v3
// Vault Database Module
// IndexedDB Storage v2
//
// Tables:
// vault    密码库
// notes    笔记
// finance  记账
// scans    扫描
// =====================================


const VaultDB = (()=>{


const DB_NAME="SecureVaultDB";

const DB_VERSION=2;


let db=null;


// ================================
// 打开数据库
// ================================

function openDB(){


return new Promise((resolve,reject)=>{


let request=
indexedDB.open(
DB_NAME,
DB_VERSION
);



request.onupgradeneeded=e=>{


let database=e.target.result;



// 密码库

if(
!database.objectStoreNames.contains("vault")
){


database.createObjectStore(
"vault",
{
keyPath:"id"
}
);


}



// 笔记库

if(
!database.objectStoreNames.contains("notes")
){


database.createObjectStore(
"notes",
{
keyPath:"id"
}
);


}



// 记账库（预留）

if(
!database.objectStoreNames.contains("finance")
){


database.createObjectStore(
"finance",
{
keyPath:"id"
}
);


}



// 扫描文件库（预留）

if(
!database.objectStoreNames.contains("scans")
){


database.createObjectStore(
"scans",
{
keyPath:"id"
}
);


}


};





request.onsuccess=e=>{


db=e.target.result;

resolve(db);


};



request.onerror=e=>{


reject(e);


};



});


}







// ================================
// 获取数据库
// ================================


async function getDB(){


if(!db)

await openDB();


return db;


}






// ================================
// 保存密码库
// ================================


async function saveVault(encrypted){


let database=
await getDB();



return new Promise((resolve,reject)=>{


let tx=
database.transaction(
"vault",
"readwrite"
);



tx.objectStore("vault")
.put({

id:1,

data:encrypted

});



tx.oncomplete=()=>{

resolve(true);

};



tx.onerror=e=>{

reject(e);

};



});


}






// ================================
// 读取密码库
// ================================


async function loadVault(){


let database=
await getDB();



return new Promise((resolve,reject)=>{


let tx=
database.transaction(
"vault",
"readonly"
);



let request=
tx.objectStore("vault")
.get(1);



request.onsuccess=()=>{


if(request.result)

resolve(
request.result.data
);

else

resolve(null);



};



request.onerror=e=>{

reject(e);

};



});


}







// ================================
// 通用保存
// 给笔记/记账/扫描使用
// ================================


async function save(
table,
data
){


let database=
await getDB();



return new Promise((resolve,reject)=>{


let tx=
database.transaction(
table,
"readwrite"
);



tx.objectStore(table)
.put(data);



tx.oncomplete=()=>{

resolve(true);

};



tx.onerror=e=>{

reject(e);

};



});


}






// ================================
// 通用读取全部
// ================================


async function getAll(table){


let database=
await getDB();



return new Promise((resolve,reject)=>{


let tx=
database.transaction(
table,
"readonly"
);



let req=
tx.objectStore(table)
.getAll();



req.onsuccess=()=>{


resolve(
req.result
);


};



req.onerror=e=>{

reject(e);

};



});


}






// ================================
// 删除数据
// ================================


async function remove(
table,
id
){


let database=
await getDB();



return new Promise((resolve,reject)=>{


let tx=
database.transaction(
table,
"readwrite"
);



tx.objectStore(table)
.delete(id);



tx.oncomplete=()=>{

resolve(true);

};



tx.onerror=e=>{

reject(e);

};


});


}






// ================================
// 清空数据库
// ================================


async function clearAll(){


let database=
await getDB();



let tables=[

"vault",

"notes",

"finance",

"scans"

];



return Promise.all(

tables.map(t=>{


return new Promise(resolve=>{


let tx=
database.transaction(
t,
"readwrite"
);



tx.objectStore(t)
.clear();



tx.oncomplete=
()=>resolve();


});


})

);


}






return {


openDB,


saveVault,


loadVault,


save,


getAll,


remove,


clearAll


};



})();