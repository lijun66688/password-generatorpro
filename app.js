// =====================================
// Secure Vault Pro v3.2
// Main Application
// Stable Notes Edition
// Part 1
// =====================================


let masterPassword = "";

let vaultData = [];


// 当前编辑笔记ID
let editingNoteId = null;



const $ = id =>
document.getElementById(id);




// ================================
// 页面元素
// ================================


const lockPage =
$("lockPage");


const appPage =
$("appPage");


const unlockBtn =
$("unlock");



const generatorTab =
$("generatorTab");


const vaultTab =
$("vaultTab");


const notesTab =
$("notesTab");



const generatorPage =
$("generatorPage");


const vaultPage =
$("vaultPage");


const notesPage =
$("notesPage");





// ================================
// 密码生成器
// ================================


const length =
$("length");


const lenNum =
$("lenNum");


const upper =
$("upper");


const lower =
$("lower");


const num =
$("num");


const sym =
$("sym");


const output =
$("output");


const bar =
$("barFill");


const text =
$("text");







if(length){


length.oninput=()=>{


lenNum.value =
length.value;


};


}







if(lenNum){


lenNum.oninput=()=>{


length.value =
lenNum.value;


};


}







const U =
"ABCDEFGHIJKLMNOPQRSTUVWXYZ";


const L =
"abcdefghijklmnopqrstuvwxyz";


const N =
"0123456789";


const S =
"!@#$%^&*()_+{}[]<>?";







function random(max){


return Math.floor(
Math.random()*max
);


}









function getPool(){


let pool="";



if(upper && upper.checked)

pool+=U;



if(lower && lower.checked)

pool+=L;



if(num && num.checked)

pool+=N;



if(sym && sym.checked)

pool+=S;



return pool;


}









function generatePassword(len){


let pool =
getPool();



if(!pool)

return "";



let result=[];



if(upper && upper.checked)

result.push(
U[random(U.length)]
);



if(lower && lower.checked)

result.push(
L[random(L.length)]
);



if(num && num.checked)

result.push(
N[random(N.length)]
);



if(sym && sym.checked)

result.push(
S[random(S.length)]
);






while(result.length < len){


result.push(
pool[random(pool.length)]
);


}




return result
.sort(
()=>Math.random()-0.5
)
.join("");

}













function checkStrength(password){


let score=0;



if(password.length>=8)

score+=20;



if(password.length>=12)

score+=20;



if(/[A-Z]/.test(password))

score+=20;



if(/[0-9]/.test(password))

score+=20;



if(/[^A-Za-z0-9]/.test(password))

score+=20;







if(bar)

bar.style.width =
score+"%";



if(text)

text.innerText =

score<40
?
"弱"
:
score<80
?
"中"
:
"强";


}









// ================================
// 生成密码
// ================================


if($("gen")){


$("gen").onclick=()=>{


let p =
generatePassword(
Number(length.value)
);



output.value=p;



checkStrength(p);



};


}






// ================================
// 复制密码
// ================================


if($("copy")){


$("copy").onclick=()=>{


if(!output.value)

return;



navigator.clipboard.writeText(
output.value
);



setTimeout(()=>{


navigator.clipboard.writeText("");

},15000);



};


}





// ================================
// 清空
// ================================


if($("clear")){


$("clear").onclick=()=>{


output.value="";


if(bar)

bar.style.width="0%";



if(text)

text.innerText="";


};


}

// ================================
// 主密码解锁
// ================================


unlockBtn.onclick =
async()=>{


let pass =
$("masterPassword").value;



if(!pass){


alert(
"请输入主密码"
);


return;


}



masterPassword =
pass;


NotesManager.setPassword(pass);




let encrypted =
await VaultDB.loadVault();






if(encrypted){



try{


vaultData =
await CryptoManager.decryptData(

encrypted,

masterPassword

);



}

catch(e){


alert(
"主密码错误"
);


masterPassword="";


return;


}



}

else{


vaultData=[];


await saveVault();


}






lockPage.style.display=
"none";


appPage.style.display=
"block";






if(window.SecurityManager){


SecurityManager.resetTimer();


}






// ⭐关键：恢复你的笔记加载

if(window.NotesManager){


await NotesManager.loadNotes();


}




renderVault();


updateHealth();



};



// ================================
// 保存密码库
// ================================
// ================================
// 修改主密码
// ================================

if($("changeMasterPassword")){

    $("changeMasterPassword").onclick =
    async()=>{

        // 1. 输入当前主密码
        const oldPassword =
            prompt("请输入当前主密码");

        if(!oldPassword)
            return;


        // 2. 检查当前主密码
        try{

            const encrypted =
                await VaultDB.loadVault();


            if(encrypted){

                await CryptoManager.decryptData(
                    encrypted,
                    oldPassword
                );

            }

        }
        catch(error){

            alert("当前主密码错误");

            return;

        }


        // 3. 输入新密码
        const newPassword =
            prompt("请输入新的主密码");

        if(!newPassword){

            alert("新主密码不能为空");

            return;

        }


        // 4. 检查新密码长度
        if(newPassword.length < 6){

            alert(
                "新主密码至少需要 6 位"
            );

            return;

        }


        // 5. 再次输入新密码
        const confirmPassword =
            prompt(
                "请再次输入新的主密码"
            );


        if(newPassword !== confirmPassword){

            alert(
                "两次输入的新主密码不一致"
            );

            return;

        }


        // 6. 用新密码重新加密
        try{

            const encryptedVault =
                await CryptoManager.encryptData(
                    vaultData,
                    newPassword
                );


            // 7. 保存新的密码库
            await VaultDB.saveVault(
                encryptedVault
            );


            // 8. 更新当前主密码
            masterPassword =
                newPassword;


            // 9. 更新笔记密码
            if(window.NotesManager){

                NotesManager.setPassword(
                    newPassword
                );

            }


            alert(
                "主密码修改成功！"
            );

        }
        catch(error){

            console.error(
                "修改主密码失败:",
                error
            );

            alert(
                "修改主密码失败，请重试"
            );

        }

    };

}



async function saveVault(){


if(!masterPassword)

return;



let encrypted =

await CryptoManager.encryptData(

vaultData,

masterPassword

);



await VaultDB.saveVault(

encrypted

);



}









// ================================
// 页面切换
// ================================


if(generatorTab){


generatorTab.onclick=()=>{


generatorPage.style.display =
"block";


vaultPage.style.display =
"none";


notesPage.style.display =
"none";



};



}








if(vaultTab){


vaultTab.onclick=()=>{


generatorPage.style.display =
"none";


vaultPage.style.display =
"block";


notesPage.style.display =
"none";



renderVault();


updateHealth();



};



}







if(notesTab){


notesTab.onclick=
async()=>{


generatorPage.style.display =
"none";


vaultPage.style.display =
"none";


notesPage.style.display =
"block";






// 每次打开重新读取

if(window.NotesManager){


await NotesManager.loadNotes();


}





renderNotes();



};



}

// ================================
// 添加账号
// ================================


if($("saveAccount")){


$("saveAccount")
.onclick=
async()=>{



let item={



id:
Date.now(),




site:

$("siteName")
.value
.trim(),





username:

$("username")
.value
.trim(),





password:

$("vaultPassword")
.value,





category:

$("category")
.value




};








if(!item.site){


alert(
"请输入网站名称"
);


return;


}







vaultData.unshift(item);





await saveVault();








$("siteName").value="";


$("username").value="";


$("vaultPassword").value="";






renderVault();


updateHealth();





};



}












// ================================
// 密码库显示
// ================================


function renderVault(){


let list =
$("vaultList");



if(!list)

return;



list.innerHTML="";



let keyword =
($("search")?.value || "")
.toLowerCase();








vaultData

.filter(item=>{


return(

item.site

.toLowerCase()

.includes(keyword)





||





item.category

.toLowerCase()

.includes(keyword)



);



})





.forEach(item=>{



let div =
document.createElement("div");



div.className =
"vault-item";






div.innerHTML=

`

<div class="vault-title">

🔐 ${item.site}

</div>



<div>

👤账号：

${item.username}

</div>



<div>

📂分类：

${item.category}

</div>




<div>

🔑密码：

<span

id="pwd-${item.id}"

class="password-mask">

••••••••

</span>


</div>






<div class="vault-actions">


<button class="showBtn">

👁 显示

</button>




<button class="copyBtn">

📋 复制

</button>




<button class="deleteBtn">

🗑 删除

</button>


</div>


`;








// 显示密码


div.querySelector(".showBtn")

.onclick=()=>{


let span =

$("pwd-"+item.id);



span.innerText =

item.password;







setTimeout(()=>{


span.innerText=

"••••••••";



},3000);



};










// 复制密码


div.querySelector(".copyBtn")

.onclick=()=>{


navigator.clipboard.writeText(

item.password

);






setTimeout(()=>{


navigator.clipboard.writeText("");



},15000);



};









// 删除


div.querySelector(".deleteBtn")

.onclick=

async()=>{


if(confirm(

"确定删除这个账号？"

)){



vaultData =

vaultData.filter(

x=>x.id!==item.id

);






await saveVault();





renderVault();


updateHealth();



}



};









list.appendChild(div);





});



}













if($("search")){


$("search").oninput=()=>{


renderVault();



};



}









// ================================
// 密码健康
// ================================


function updateHealth(){


if(!window.PasswordHealth)

return;





let result =

PasswordHealth.analyze(

vaultData

);







let score =

$("healthScore");



let detail =

$("healthResult");







if(score){



score.innerHTML =

`

安全评分：

<b>

${result.score}

</b>

/100

`;



}








if(detail){



let msg="";







if(result.weak.length){



msg +=

"⚠ 弱密码："+

result.weak.length+

"个<br>";



}







if(result.duplicates.length){



msg +=

"⚠ 重复密码："+

result.duplicates.length+

"组<br>";



}







if(!msg){


msg=

"✅ 未发现明显风险";


}



detail.innerHTML = msg;



}



}

// ================================
// 笔记列表
// ================================


// ================================
// 笔记列表
// ================================

async function renderNotes(){

    const list = $("notesList");

    if(!list || !window.NotesManager)
        return;


    await NotesManager.loadNotes();


    let notes =
        NotesManager.getNotes()
        || [];


    // ============================
    // 搜索
    // ============================

    const keyword =
        (
            $("noteSearch")?.value
            || ""
        )

        
        

        .trim()
        .toLowerCase();

        


    if(keyword){

        notes =
            notes.filter(note=>{

                const title =
                    (note.title || "")
                    .toLowerCase();

                const content =
                    (note.content || "")
                    .toLowerCase();

                const tags =
                    (note.tags || [])
                    .join(" ")
                    .toLowerCase();

                const category =
                    (note.category || "")
                    .toLowerCase();


                return(
                    title.includes(keyword) ||
                    content.includes(keyword) ||
                    tags.includes(keyword) ||
                    category.includes(keyword)
                );

            });

    }

    // ============================
// 分类筛选
// ============================

if(
    currentNoteCategory &&
    currentNoteCategory !== "全部"
){

    notes =
        notes.filter(note=>{

            return (
                note.category
                === currentNoteCategory
            );

        });

}


    // ============================
    // 置顶优先
    // ============================

    notes.sort((a,b)=>{

        if(
            Boolean(a.pinned) !==
            Boolean(b.pinned)
        ){

            return b.pinned - a.pinned;

        }


        return b.id - a.id;

    });


    list.innerHTML = "";


    // ============================
    // 没有笔记
    // ============================

    if(notes.length === 0){

        list.innerHTML = `

            <div class="note-empty">

                📒

                <div>
                    ${
                        keyword
                        ? "没有找到相关笔记"
                        : "暂无笔记"
                    }
                </div>

            </div>

        `;

        return;

    }


    // ============================
    // 创建笔记卡片
    // ============================

    notes.forEach(note=>{

        const div =
            document.createElement("div");


        div.className =
            "note-card";


        if(note.pinned){

            div.classList.add(
                "note-pinned"
            );

        }


        // ========================
        // 内容预览
        // ========================

        let preview =
            note.content || "";


        // 去掉 HTML
        preview =
            preview
            .replace(
                /<[^>]*>/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


        if(preview.length > 160){

            preview =
                preview.substring(
                    0,
                    160
                )
                + "...";

        }


        // ========================
        // 标签
        // ========================

        const tagsHTML =
            (note.tags || [])
            .map(tag=>`

                <span class="note-tag">
                    ${escapeNoteHTML(tag)}
                </span>

            `)
            .join("");


        // ========================
        // 卡片
        // ========================

        div.innerHTML = `

            <div class="note-card-header">

                <div class="note-card-title">

                    ${
                        note.pinned
                        ? "📌 "
                        : ""
                    }

                    ${
                        escapeNoteHTML(
                            note.title
                        )
                    }

                </div>


                <div class="note-card-favorite">

                    ${
                        note.favorite
                        ? "⭐"
                        : ""
                    }

                </div>

            </div>


            <div class="note-card-preview">

                ${
                    escapeNoteHTML(
                        preview
                    )
                    ||
                    "暂无内容"
                }

            </div>


            <div class="note-card-meta">

                <span>

                    📂
                    ${
                        escapeNoteHTML(
                            note.category
                            || "其他"
                        )
                    }

                </span>


                <span>

                    🕒
                    ${
                        note.updateTime
                        ||
                        note.createTime
                        ||
                        ""
                    }

                </span>

            </div>


            <div class="note-tags">

                ${tagsHTML}

            </div>


            <div class="note-buttons">

                <button
                    type="button"
                    class="editNote">

                    ✏ 编辑

                </button>


                <button
                    type="button"
                    class="favoriteBtn">

                    ${
                        note.favorite
                        ? "⭐"
                        : "☆"
                    }

                </button>


                <button
                    type="button"
                    class="pinNote">

                    ${
                        note.pinned
                        ? "📌 取消置顶"
                        : "📌 置顶"
                    }

                </button>


                <button
                    type="button"
                    class="deleteNote">

                    🗑 删除

                </button>

            </div>

        `;


        // ========================
        // 编辑
        // ========================

        div
.querySelector(".editNote")
.onclick = ()=>{

    openNoteEditor(note);

};


        // ========================
        // 收藏
        // ========================

        div
        .querySelector(".favoriteBtn")
        .onclick =
        async()=>{

            await NotesManager
                .toggleFavorite(
                    note.id
                );


            await renderNotes();

        };


        // ========================
        // 置顶
        // ========================

        div
        .querySelector(".pinNote")
        .onclick =
        async()=>{

            await NotesManager
                .togglePin(
                    note.id
                );


            await renderNotes();

        };


        // ========================
        // 删除
        // ========================

        div
        .querySelector(".deleteNote")
        .onclick =
        async()=>{

            const ok =
                confirm(
                    "确定删除这条笔记？"
                );


            if(!ok)
                return;


            await NotesManager
                .deleteNote(
                    note.id
                );


            if(
                editingNoteId ===
                note.id
            ){

                editingNoteId =
                    null;

            }


            await renderNotes();

        };


        list.appendChild(div);

    });

}


// ================================
// 防止笔记内容 HTML 注入显示
// ================================

function escapeNoteHTML(value){

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}

// ================================
// 保存 / 修改笔记
// ================================


if($("saveNote")){


$("saveNote")
.onclick=
async()=>{



let data={



title:

$("noteTitle")
.value
.trim(),





content:

$("noteEditor")
.innerHTML,







category:

$("noteCategory")
.value,







tags:

$("noteTags")
.value

.split(",")

.map(x=>x.trim())

.filter(x=>x),








todo:[]




};









if(!data.title){


alert(

"请输入笔记标题"

);


return;


}









// ================================
// 编辑模式
// ================================


if(editingNoteId){



await NotesManager.updateNote(

editingNoteId,

data

);



editingNoteId=null;



alert(

"笔记修改成功"

);



}

else{



// 新建


await NotesManager.createNote(

data

);

// 强制刷新笔记数据

await NotesManager.loadNotes();


console.log(
"保存后的笔记:",
NotesManager.getNotes()
);


alert(

"笔记保存成功"

);



}









// 重新读取数据库


await NotesManager.loadNotes();







renderNotes();









// 清空编辑区


$("noteTitle").value="";


$("noteTags").value="";


$("noteEditor").innerHTML="";





};






}











// ================================
// 清空笔记
// ================================


if($("clearNote")){


$("clearNote")

.onclick=()=>{



editingNoteId=null;



$("noteTitle").value="";


$("noteTags").value="";


$("noteEditor").innerHTML="";



};



}



// ================================
// 笔记编辑模式
// ================================

let noteEditMode = false;


// ================================
// 打开笔记编辑器
// ================================

function openNoteEditor(note = null){

    noteEditMode = true;


    const header =
        $("noteEditorHeader");

    if(header){

        header.style.display =
            "flex";

    }


    const title =
        $("noteEditorTitle");


    const status =
        $("noteSaveStatus");


    if(note){

        editingNoteId =
            note.id;


        $("noteTitle").value =
            note.title || "";


        $("noteCategory").value =
            note.category || "其他";


        $("noteTags").value =
            (note.tags || [])
            .join(",");


        $("noteEditor").innerHTML =
            note.content || "";


        if(title){

            title.innerText =
                note.title ||
                "无标题";

        }


        if(status){

            status.innerText =
                "已保存";

        }

    }

    else{

        editingNoteId =
            null;


        $("noteTitle").value =
            "";


        $("noteTags").value =
            "";


        $("noteEditor").innerHTML =
            "";


        if(title){

            title.innerText =
                "新建笔记";

        }


        if(status){

            status.innerText =
                "新建";

        }

    }


    // 隐藏列表区域

    const searchBox =
        $("noteSearch")
        ?.closest(".box");


    const categories =
        $("noteCategories")
        ?.closest(".box");


    const list =
        $("notesList");


    if(searchBox)
        searchBox.style.display =
            "none";


    if(categories)
        categories.style.display =
            "none";


    if(list)
        list.style.display =
            "none";


    // 编辑区显示

    const editor =
        $("noteEditor");


    if(editor){

        editor.scrollIntoView({

            behavior:"smooth",

            block:"start"

        });


        editor.focus();

    }

}


// ================================
// 返回笔记列表
// ================================

async function closeNoteEditor(){

    noteEditMode = false;


    const header =
        $("noteEditorHeader");


    if(header){

        header.style.display =
            "none";

    }


    const searchBox =
        $("noteSearch")
        ?.closest(".box");


    const categories =
        $("noteCategories")
        ?.closest(".box");


    const list =
        $("notesList");


    if(searchBox)
        searchBox.style.display =
            "";


    if(categories)
        categories.style.display =
            "";


    if(list)
        list.style.display =
            "";


    await renderNotes();

}

if($("backToNotes")){

    $("backToNotes").onclick =
        async()=>{

            await closeNoteEditor();

        };

}








// ================================
// ================================
// 笔记编辑器
// ================================


// 当前编辑器
function getNoteEditor(){

    return $("noteEditor");

}


// ================================
// 保持编辑器焦点
// ================================

function focusNoteEditor(){

    const editor =
        getNoteEditor();

    if(!editor)
        return;

    editor.focus();

}


// ================================
// 获取当前光标 Range
// ================================

function getEditorRange(){

    const editor =
        getNoteEditor();

    if(!editor)
        return null;


    const selection =
        window.getSelection();


    if(
        !selection ||
        !selection.rangeCount
    ){

        return null;

    }


    const range =
        selection.getRangeAt(0);


    if(
        !editor.contains(
            range.commonAncestorContainer
        )
    ){

        return null;

    }


    return range;

}


// ================================
// 光标移动到指定节点末尾
// ================================

function placeCaretAfter(node){

    const editor =
        getNoteEditor();

    if(!editor)
        return;


    const selection =
        window.getSelection();

    const range =
        document.createRange();


    range.selectNodeContents(node);

    range.collapse(false);


    selection.removeAllRanges();

    selection.addRange(range);


    editor.focus();

}


// ================================
// 普通文字格式
// ================================

function formatText(type){

    const editor =
        getNoteEditor();

    if(!editor)
        return;


    editor.focus();


    if(type === "title"){

        document.execCommand(
            "formatBlock",
            false,
            "h2"
        );

    }

    else{

        document.execCommand(
            type,
            false,
            null
        );

    }


    scheduleNoteAutoSave();

}


// ================================
// 创建清单行
// ================================

function createTodoLine(text = ""){

    const line =
        document.createElement("div");


    line.className =
        "note-check-line";


    const checkbox =
        document.createElement("input");


    checkbox.type =
        "checkbox";


    checkbox.className =
        "note-checkbox";


    const textNode =
        document.createTextNode(
            text
        );


    line.appendChild(
        checkbox
    );


    line.appendChild(
        textNode
    );


    return line;

}


// ================================
// 插入清单
// ================================

function insertTodo(){

    const editor =
        getNoteEditor();

    if(!editor)
        return;


    editor.focus();


    let range =
        getEditorRange();


    // 没有光标时放到最后
    if(!range){

        range =
            document.createRange();

        range.selectNodeContents(
            editor
        );

        range.collapse(false);

    }


    // 找当前所在行
    let current =
        range.startContainer;


    while(
        current &&
        current !== editor &&
        !(
            current.nodeType === 1 &&
            current.classList &&
            current.classList.contains(
                "note-check-line"
            )
        )
    ){

        current =
            current.parentNode;

    }


    // 如果已经在清单行
    if(
        current &&
        current !== editor &&
        current.classList.contains(
            "note-check-line"
        )
    ){

        placeCaretAfter(current);

        return;

    }


    // 创建新的清单行
    const line =
        createTodoLine();


    range.deleteContents();

    range.insertNode(line);


    // 光标放到文字后面
    const newRange =
        document.createRange();


    newRange.setStart(
        line,
        line.childNodes.length
    );

    newRange.collapse(true);


    const selection =
        window.getSelection();


    selection.removeAllRanges();

    selection.addRange(
        newRange
    );


    editor.focus();


    scheduleNoteAutoSave();

}


// ================================
// 插入分割线
// ================================

function insertLine(){

    const editor =
        getNoteEditor();

    if(!editor)
        return;


    editor.focus();


    let range =
        getEditorRange();


    // 没有光标
    if(!range){

        range =
            document.createRange();

        range.selectNodeContents(
            editor
        );

        range.collapse(false);

    }


    range.deleteContents();


    // 前面的换行
    const before =
        document.createElement(
            "div"
        );


    before.innerHTML =
        "<br>";


    // 分割线
    const hr =
        document.createElement(
            "hr"
        );


    hr.className =
        "note-divider";


    // 分割线下面的新行
    const after =
        document.createElement(
            "div"
        );


    after.innerHTML =
        "<br>";


    // 建立结构
    const fragment =
        document.createDocumentFragment();


    fragment.appendChild(
        before
    );

    fragment.appendChild(
        hr
    );

    fragment.appendChild(
        after
    );


    range.insertNode(
        fragment
    );


    // 光标放到分割线下面
    const newRange =
        document.createRange();


    newRange.selectNodeContents(
        after
    );


    newRange.collapse(true);


    const selection =
        window.getSelection();


    selection.removeAllRanges();

    selection.addRange(
        newRange
    );


    editor.focus();


    scheduleNoteAutoSave();

}


// ================================
// Enter 自动处理
// ================================

function handleNoteEnter(e){

    if(e.key !== "Enter")
        return;


    const editor =
        getNoteEditor();

    if(!editor)
        return;


    const selection =
        window.getSelection();


    if(
        !selection ||
        !selection.rangeCount
    )
        return;


    let node =
        selection.anchorNode;


    // 找当前清单行
    let todoLine = null;


    while(
        node &&
        node !== editor
    ){

        if(
            node.nodeType === 1 &&
            node.classList &&
            node.classList.contains(
                "note-check-line"
            )
        ){

            todoLine = node;

            break;

        }


        node =
            node.parentNode;

    }


    // ==========================
    // 清单回车
    // ==========================

    if(todoLine){

        e.preventDefault();


        const newLine =
            createTodoLine();


        todoLine.after(
            newLine
        );


        const range =
            document.createRange();


        range.setStart(
            newLine,
            newLine.childNodes.length
        );


        range.collapse(true);


        selection.removeAllRanges();

        selection.addRange(
            range
        );


        editor.focus();


        scheduleNoteAutoSave();


        return;

    }


    // 普通 Enter
    // 浏览器默认行为保留
    scheduleNoteAutoSave();

}


// ================================
// 清单点击
// ================================

function handleTodoCheck(e){

    const target =
        e.target;


    if(
        !target.matches(
            "#noteEditor input[type='checkbox']"
        )
    )
        return;


    scheduleNoteAutoSave();

}


// ================================
// 编辑器自动保存
// ================================

let noteAutoSaveTimer = null;


function scheduleNoteAutoSave(){

    clearTimeout(
        noteAutoSaveTimer
    );


    if($("noteSaveStatus")){

        $("noteSaveStatus").innerText =
            "正在编辑...";

    }


    noteAutoSaveTimer =
        setTimeout(
            saveCurrentNoteSilently,
            700
        );

}


// ================================
// 静默保存当前笔记
// ================================

async function saveCurrentNoteSilently(){

    if(!editingNoteId)
        return;


    if(!window.NotesManager)
        return;


    const editor =
        getNoteEditor();

    if(!editor)
        return;


    const title =
        $("noteTitle")?.value
            .trim();


    if(!title)
        return;


    const tags =
        ($("noteTags")?.value || "")
            .split(",")
            .map(
                x => x.trim()
            )
            .filter(Boolean);


    const data = {

        title,

        content:
            editor.innerHTML,

        category:
            $("noteCategory")?.value ||
            "其他",

        tags,

    };


    try{

        await NotesManager.updateNote(
            editingNoteId,
            data
        );


    }

    catch(error){

        console.error(
            "笔记自动保存失败:",
            error
        );

    }

}


// ================================
// 编辑器事件
// ================================

if($("noteEditor")){


    $("noteEditor")
        .addEventListener(
            "keydown",
            handleNoteEnter
        );


    $("noteEditor")
        .addEventListener(
            "change",
            handleTodoCheck
        );


    $("noteEditor")
        .addEventListener(
            "input",
            scheduleNoteAutoSave
        );


}


// ================================
// 撤销
// ================================

function undoNote(){

    const editor =
        getNoteEditor();

    if(!editor)
        return;


    editor.focus();


    document.execCommand(
        "undo",
        false,
        null
    );


    scheduleNoteAutoSave();

}


// ================================
// 重做
// ================================

function redoNote(){

    const editor =
        getNoteEditor();

    if(!editor)
        return;


    editor.focus();


    document.execCommand(
        "redo",
        false,
        null
    );


    scheduleNoteAutoSave();

}

let currentNoteCategory = "全部";
// ================================
// 置顶
// ================================

function pinCurrentNote(){

    if(!editingNoteId){

        alert(
            "请先保存笔记"
        );

        return;

    }


    if(
        !window.NotesManager
    )
        return;


    NotesManager.togglePin(
        editingNoteId
    )
    .then(()=>{

        renderNotes();

    });

}








//function pinCurrentNote(){



//alert(

//"保存后可以设置置顶"

//);



//}




// ================================
// 待办事项
// ================================


if($("addTodo")){


$("addTodo")

.onclick=()=>{



let value =

$("todoInput")

.value

.trim();






if(!value)

return;









let div=

document.createElement("div");



div.className=

"todo-item";








div.innerHTML=

`

<label>

<input type="checkbox">

${value}

</label>

`;









$("todoList")

.appendChild(div);







$("todoInput").value="";





};


}












// ================================
// 启动
// ================================


window.onload=

async()=>{





if(

"serviceWorker"

in navigator

){



navigator.serviceWorker.register(

"service-worker.js"

);



}








if(window.SecurityManager){



SecurityManager.start();



}









// ⭐启动时加载笔记缓存


if(window.NotesManager){



await NotesManager.loadNotes();



}





};

// ================================
// 笔记搜索
// ================================

// ================================
// 笔记搜索
// ================================

if($("noteSearch")){

    $("noteSearch").oninput = ()=>{

        renderNotes();

    };

}


// ================================
// 笔记分类
// ================================

if($("noteCategories")){

    $("noteCategories")
    .addEventListener(
        "click",
        e=>{

            const button =
                e.target.closest(
                    ".note-category"
                );


            if(!button)
                return;


            currentNoteCategory =
                button.dataset.category
                || "全部";


            document
                .querySelectorAll(
                    ".note-category"
                )
                .forEach(btn=>{

                    btn.classList.remove(
                        "active"
                    );

                });


            button.classList.add(
                "active"
            );


            renderNotes();

        }
    );

}