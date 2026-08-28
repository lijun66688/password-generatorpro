// =====================================
// Secure Vault Pro v2
// Security Manager
// Auto Lock System
// =====================================


const SecurityManager = (()=>{


let timer=null;


// 默认5分钟

let timeout =
5 * 60 * 1000;



// ================================
// 设置自动锁定时间
// ================================


function setTimeoutMinutes(min){


timeout =
min * 60 * 1000;


}




// ================================
// 重置计时器
// ================================


function resetTimer(){


if(timer){

clearTimeout(timer);

}



timer=setTimeout(()=>{


lock();


},timeout);


}




// ================================
// 锁定事件
// ================================


function lock(){



const app=
document.getElementById(
"appPage"
);


const lockPage=
document.getElementById(
"lockPage"
);



if(app){

app.style.display="none";

}



if(lockPage){


lockPage.style.display="block";


}



const password=
document.getElementById(
"masterPassword"
);



if(password){

password.value="";

}



}


// ================================
// 监听用户操作
// ================================


function start(){


[
"click",
"touchstart",
"keydown",
"mousemove"
]


.forEach(event=>{


document.addEventListener(
event,
()=>{

resetTimer();

},
true
);


});



resetTimer();


}




return {


start,

lock,

resetTimer,

setTimeoutMinutes


};


})();