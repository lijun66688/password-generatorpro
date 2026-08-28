// =====================================
// Secure Vault Pro v2
// Password Health Analyzer
// Local Only
// =====================================


window.PasswordHealth = (()=>{


// ================================
// 弱密码库
// ================================


const weakPasswords=[

"123456",

"12345678",

"password",

"admin",

"qwerty",

"111111",

"abc123",

"000000"

];





// ================================
// 单个密码评分
// ================================


function scorePassword(password){


let score=0;



if(password.length>=8)
score+=20;


if(password.length>=12)
score+=20;


if(/[A-Z]/.test(password))
score+=15;


if(/[a-z]/.test(password))
score+=15;


if(/[0-9]/.test(password))
score+=15;


if(/[^A-Za-z0-9]/.test(password))
score+=15;



return score;


}




// ================================
// 检查弱密码
// ================================


function checkWeakPasswords(vault){


return vault.filter(item=>{


return weakPasswords.includes(

item.password.toLowerCase()

);


});


}





// ================================
// 检查重复密码
// ================================


function checkDuplicatePasswords(vault){


let map={};


let result=[];



vault.forEach(item=>{


let p=item.password;



if(map[p]){


result.push({

password:p,

accounts:[

map[p],

item.site

]

});


}

else{


map[p]=item.site;


}


});



return result;


}




// ================================
// 总体健康评分
// ================================


function analyze(vault){


if(!vault.length){


return {

score:100,

weak:[],

duplicates:[]

};


}




let total=100;



let weak =
checkWeakPasswords(vault);



let duplicates =
checkDuplicatePasswords(vault);





// 弱密码扣分

total -=
weak.length * 10;



// 重复密码扣分

total -=
duplicates.length * 15;



if(total<0)
total=0;




return {


score:total,


weak,


duplicates


};



}




return {


analyze,

scorePassword

};



})();