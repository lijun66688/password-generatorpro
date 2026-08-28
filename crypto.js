// =====================================
// Secure Vault Pro
// Crypto Module
// AES-256-GCM Encryption
// =====================================



const CryptoManager = (()=>{


// ================================
// 生成随机盐
// ================================

function generateSalt(){

return crypto.getRandomValues(
new Uint8Array(16)
);

}



// ================================
// ArrayBuffer 转 Base64
// ================================

function bufferToBase64(buffer){

let binary="";

let bytes=new Uint8Array(buffer);


bytes.forEach(b=>{

binary+=String.fromCharCode(b);

});


return btoa(binary);

}



// ================================
// Base64 转 ArrayBuffer
// ================================


function base64ToBuffer(base64){


let binary=atob(base64);


let bytes=new Uint8Array(
binary.length
);


for(let i=0;i<binary.length;i++){

bytes[i]=binary.charCodeAt(i);

}


return bytes.buffer;


}




// ================================
// 主密码生成密钥
// PBKDF2
// ================================


async function deriveKey(
password,
salt
){


const encoder=new TextEncoder();



const keyMaterial=
await crypto.subtle.importKey(

"raw",

encoder.encode(password),

{
name:"PBKDF2"
},

false,

[
"deriveKey"
]

);




return crypto.subtle.deriveKey(

{


name:"PBKDF2",

salt:salt,

iterations:120000,

hash:"SHA-256"


},


keyMaterial,


{


name:"AES-GCM",

length:256


},


false,


[
"encrypt",
"decrypt"
]


);


}





// ================================
// 加密
// ================================


async function encryptData(
data,
password
){


const salt=
generateSalt();



const key=
await deriveKey(
password,
salt
);



const iv=
crypto.getRandomValues(
new Uint8Array(12)
);



const encoded=
new TextEncoder()
.encode(
JSON.stringify(data)
);



const encrypted=
await crypto.subtle.encrypt(

{


name:"AES-GCM",

iv:iv


},


key,


encoded


);




return {


salt:
bufferToBase64(salt),


iv:
bufferToBase64(iv),


data:
bufferToBase64(encrypted)


};


}





// ================================
// 解密
// ================================


async function decryptData(
encrypted,
password
){


try{


const salt=
new Uint8Array(
base64ToBuffer(
encrypted.salt
)
);



const iv=
new Uint8Array(
base64ToBuffer(
encrypted.iv
)
);



const data=
base64ToBuffer(
encrypted.data
);



const key=
await deriveKey(
password,
salt
);




const decrypted=

await crypto.subtle.decrypt(

{


name:"AES-GCM",

iv:iv


},


key,


data


);



return JSON.parse(

new TextDecoder()

.decode(decrypted)

);



}catch(e){


throw new Error(
"密码错误或数据损坏"
);


}



}




return {


encryptData,

decryptData

};



})();