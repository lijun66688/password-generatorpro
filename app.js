// =====================================
// Secure Vault Pro v3.2
// Main Application
// Stable Notes Edition
// app.js
// =====================================


let masterPassword = "";

let vaultData = [];


// 当前编辑笔记ID
let editingNoteId = null;


// 当前笔记页面位置
let currentNotePageIndex = -1;


// 当前笔记分类
let currentNoteCategory = "全部";


// 笔记编辑模式
let noteEditMode = false;


// 自动保存计时器
let noteAutoSaveTimer = null;

let noteSaveInProgress = false;


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


    if(
        upper &&
        upper.checked
    )

        pool+=U;


    if(
        lower &&
        lower.checked
    )

        pool+=L;


    if(
        num &&
        num.checked
    )

        pool+=N;


    if(
        sym &&
        sym.checked
    )

        pool+=S;


    return pool;

}




function generatePassword(len){

    let pool =
        getPool();


    if(!pool)

        return "";


    let result=[];


    if(
        upper &&
        upper.checked
    )

        result.push(
            U[random(U.length)]
        );


    if(
        lower &&
        lower.checked
    )

        result.push(
            L[random(L.length)]
        );


    if(
        num &&
        num.checked
    )

        result.push(
            N[random(N.length)]
        );


    if(
        sym &&
        sym.checked
    )

        result.push(
            S[random(S.length)]
        );




    while(
        result.length < len
    ){

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
// 清空密码
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


    NotesManager.setPassword(
        pass
    );


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


    lockPage.style.display =
        "none";


    appPage.style.display =
        "block";


    if(window.SecurityManager){

        SecurityManager.resetTimer();

    }


    if(window.NotesManager){

        await NotesManager.loadNotes();

    }


    renderVault();

    updateHealth();

};




// ================================
// 修改主密码
// ================================


if($("changeMasterPassword")){

    $("changeMasterPassword").onclick =
    async()=>{

        const oldPassword =
            prompt(
                "请输入当前主密码"
            );


        if(!oldPassword)

            return;


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

            alert(
                "当前主密码错误"
            );

            return;

        }


        const newPassword =
            prompt(
                "请输入新的主密码"
            );


        if(!newPassword){

            alert(
                "新主密码不能为空"
            );

            return;

        }


        if(newPassword.length < 6){

            alert(
                "新主密码至少需要 6 位"
            );

            return;

        }


        const confirmPassword =
            prompt(
                "请再次输入新的主密码"
            );


        if(
            newPassword !==
            confirmPassword
        ){

            alert(
                "两次输入的新主密码不一致"
            );

            return;

        }


        try{

            const encryptedVault =
                await CryptoManager.encryptData(
                    vaultData,
                    newPassword
                );


            await VaultDB.saveVault(
                encryptedVault
            );


            masterPassword =
                newPassword;


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




// ================================
// 保存密码库
// ================================


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


        if(window.NotesManager){

            await NotesManager.loadNotes();

        }


        /*
         * 回到笔记模块时，
         * 如果当前正在编辑某条笔记，
         * 保持当前页面。
         */
        if(editingNoteId){

            await setCurrentNotePageById(
                editingNoteId
            );

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
        (
            $("search")?.value
            || ""
        )
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


            div.querySelector(
                ".showBtn"
            )
            .onclick=()=>{

                let span =
                    $("pwd-"+item.id);


                span.innerText =
                    item.password;


                setTimeout(()=>{

                    span.innerText =
                        "••••••••";

                },3000);

            };




            div.querySelector(
                ".copyBtn"
            )
            .onclick=()=>{

                navigator.clipboard.writeText(
                    item.password
                );


                setTimeout(()=>{

                    navigator.clipboard.writeText("");

                },15000);

            };




            div.querySelector(
                ".deleteBtn"
            )
            .onclick=
            async()=>{

                if(
                    confirm(
                        "确定删除这个账号？"
                    )
                ){

                    vaultData =
                        vaultData.filter(
                            x =>
                                x.id !==
                                item.id
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

            msg =
                "✅ 未发现明显风险";

        }


        detail.innerHTML =
            msg;

    }

}




// ============================================================
// 笔记列表
// ============================================================


async function renderNotes(){

    const list =
        $("notesList");


    if(
        !list ||
        !window.NotesManager
    )

        return;


    await NotesManager.loadNotes();


    let notes =
    NotesManager.getNotes()
    || [];


/*
 * 防止同一条历史笔记重复显示
 */
const uniqueNotes = [];
const noteIds = new Set();

notes.forEach(note => {

    if(!note)
        return;

    if(noteIds.has(note.id))
        return;

    noteIds.add(note.id);

    uniqueNotes.push(note);

});

notes = uniqueNotes;


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

                    title.includes(keyword)

                    ||

                    content.includes(keyword)

                    ||

                    tags.includes(keyword)

                    ||

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

                return(
                    note.category ===
                    currentNoteCategory
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
                        ?
                        "没有找到相关笔记"
                        :
                        "暂无笔记"
                    }

                </div>

            </div>

        `;


        updateNotePageInfo();

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
                            ||
                            "其他"
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
                        ? "⭐ 取消收藏"
                        : "⭐ 收藏"
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
        .onclick=()=>{

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


    updateNotePageInfo();

}




// ================================
// 防止笔记 HTML 注入显示
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




// ============================================================
// 笔记页面导航
// ============================================================
//
// 这里使用 NotesManager 原来的数据。
// 不修改 NotesManager。
// 不删除历史笔记列表。
// 不修改 CSS。
//
// 排序与 renderNotes() 保持一致：
// 1. 置顶优先
// 2. ID 新的在前
//
// ============================================================


async function getNotePageList(){

    if(!window.NotesManager)

        return [];


    await NotesManager.loadNotes();


    let notes =
        NotesManager.getNotes()
        || [];


    /*
     * ============================
     * 防止历史笔记重复
     * ============================
     *
     * 同一个 ID 只保留一条。
     */
    const uniqueNotes = [];
    const noteIds = new Set();

    notes.forEach(note => {

        if(!note)
            return;

        if(noteIds.has(note.id))
            return;

        noteIds.add(note.id);

        uniqueNotes.push(note);

    });

    notes = uniqueNotes;


    notes =
        [...notes]
        .sort((a,b)=>{

            if(
                Boolean(a.pinned) !==
                Boolean(b.pinned)
            ){

                return b.pinned - a.pinned;

            }


            return b.id - a.id;

        });


    return notes;

}




// ============================================================
// 根据 ID 同步当前页面位置
// ============================================================


async function setCurrentNotePageById(noteId){

    const notes =
        await getNotePageList();


    currentNotePageIndex =
        notes.findIndex(
            note =>
                note.id === noteId
        );


    updateNotePageInfo();


    return notes;

}




// ============================================================
// 更新顶部“第 X 页”
// ============================================================


async function updateNotePageInfo(){

    const info =
        $("notePageInfo");


    if(!info)

        return;


    const notes =
        await getNotePageList();


    if(!notes.length){

        info.innerText =
            "暂无历史笔记";

        return;

    }


    /*
     * 新建页面状态
     */
    if(
        currentNotePageIndex === -1
    ){

        info.innerText =
            "新页面";

        return;

    }


    /*
     * 防止 index 越界
     */
    let index =
        currentNotePageIndex;


    if(index < 0)

        index=0;


    if(index >= notes.length)

        index =
            notes.length - 1;


    info.innerText =
        "第 " +
        (index + 1) +
        " 页 / 共 " +
        notes.length +
        " 页";

}




// ============================================================
// 打开历史笔记
// ============================================================


async function openHistoryNote(note){

    if(!note)

        return;


    editingNoteId =
        note.id;


    noteEditMode =
        true;


    // ============================
    // 标题
    // ============================


    if($("noteTitle")){

        $("noteTitle").value =
            note.title || "";

    }


    // ============================
    // 分类
    // ============================


    if($("noteCategory")){

        $("noteCategory").value =
            note.category || "其他";

    }


    // ============================
    // 标签
    // ============================


    if($("noteTags")){

        $("noteTags").value =
            (note.tags || [])
            .join(",");

    }


    // ============================
    // 内容
    // ============================


    if($("noteEditor")){

        $("noteEditor").innerHTML =
            note.content || "";

    }


    // ============================
    // 编辑器顶部
    // ============================


    if($("noteEditorHeader")){

        $("noteEditorHeader").style.display =
            "flex";

    }


    if($("noteEditorTitle")){

        $("noteEditorTitle").innerText =
            note.title ||
            "无标题";

    }


    if($("noteSaveStatus")){

        $("noteSaveStatus").innerText =
            "已保存";

    }


    // ============================
    // 隐藏历史列表
    // ============================


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


    // ============================
    // 同步页码
    // ============================


    await setCurrentNotePageById(
        note.id
    );


    // ============================
    // 滚动到编辑器
    // ============================


    if($("noteEditor")){

        $("noteEditor").scrollIntoView({

            behavior:"smooth",

            block:"start"

        });


        $("noteEditor").focus();

    }

}




// ============================================================
// 打开笔记编辑器
// ============================================================


function openNoteEditor(note = null){
    
    const titleBox = $("noteTitle")?.closest(".box");
    const editorBox = $("noteEditor")?.closest(".box");
    const buttons = $("saveNote")?.closest(".btns");

    if(titleBox) titleBox.style.display = "";
    if(editorBox) editorBox.style.display = "";
    if(buttons) buttons.style.display = "";

    noteEditMode =
        true;


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




    // ========================================================
    // 编辑历史笔记
    // ========================================================


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


        /*
         * 同步当前页
         */
        setCurrentNotePageById(
            note.id
        );

    }




    // ========================================================
    // 新建笔记
    // ========================================================


    else{

        editingNoteId =
            null;


        currentNotePageIndex =
            -1;


        $("noteTitle").value =
            "";


        $("noteCategory").value =
            "其他";


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


        updateNotePageInfo();

    }




    // ========================================================
    // 隐藏历史列表
    // ========================================================


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


    // ========================================================
    // 编辑器显示
    // ========================================================


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




// ============================================================
// 新页面
// ============================================================


async function createNewNotePage(){

    /*
     * 注意：
     *
     * 这里只清空编辑器。
     *
     * 不调用 deleteNote。
     * 不修改历史笔记。
     * 不替换 notesList。
     */
    editingNoteId =
        null;


    currentNotePageIndex =
        -1;


    noteEditMode =
        true;


    if($("noteTitle")){

        $("noteTitle").value =
            "";

    }


    if($("noteCategory")){

        $("noteCategory").value =
            "其他";

    }


    if($("noteTags")){

        $("noteTags").value =
            "";

    }


    if($("noteEditor")){

        $("noteEditor").innerHTML =
            "";

    }


    if($("noteEditorHeader")){

        $("noteEditorHeader").style.display =
            "flex";

    }


    if($("noteEditorTitle")){

        $("noteEditorTitle").innerText =
            "新建笔记";

    }


    if($("noteSaveStatus")){

        $("noteSaveStatus").innerText =
            "新建";

    }


    /*
     * 隐藏列表，但绝不删除列表。
     */
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


    updateNotePageInfo();


    if($("noteEditor")){

        $("noteEditor").scrollIntoView({

            behavior:"smooth",

            block:"start"

        });


        $("noteEditor").focus();

    }

}




// ============================================================
// 上一页
// ============================================================


async function previousNotePage(){

    const notes =
        await getNotePageList();


    if(!notes.length){

        alert(
            "暂无历史笔记"
        );

        return;

    }


    /*
     * 如果当前正在新建页面，
     * 上一页直接进入最新历史笔记。
     */
    if(
        currentNotePageIndex === -1
    ){

        currentNotePageIndex =
            0;

    }

    else{

        currentNotePageIndex--;

    }


    if(
        currentNotePageIndex < 0
    ){

        currentNotePageIndex =
            0;


        alert(
            "已经是第一条笔记"
        );


        updateNotePageInfo();


        return;

    }


    const note =
        notes[
            currentNotePageIndex
        ];


    if(!note)

        return;


    await openHistoryNote(
        note
    );

}




// ============================================================
// 下一页
// ============================================================


async function nextNotePage(){

    const notes =
        await getNotePageList();


    if(!notes.length){

        alert(
            "暂无历史笔记"
        );

        return;

    }


    /*
     * 新页面 → 最新历史笔记
     */
    if(
        currentNotePageIndex === -1
    ){

        currentNotePageIndex =
            0;

    }

    else{

        currentNotePageIndex++;

    }


    if(
        currentNotePageIndex >=
        notes.length
    ){

        currentNotePageIndex =
            notes.length - 1;


        alert(
            "已经是最后一条笔记"
        );


        updateNotePageInfo();


        return;

    }


    const note =
        notes[
            currentNotePageIndex
        ];


    if(!note)

        return;


    await openHistoryNote(
        note
    );

}




// ============================================================
// 删除当前页面
// ============================================================


async function deleteCurrentNotePage(){

    /*
     * 如果当前是新页面，
     * 没有真正保存的笔记。
     */
    if(!editingNoteId){

        const ok =
            confirm(
                "当前页面还没有保存，确定关闭新页面吗？"
            );


        if(!ok)

            return;


        await closeNoteEditor();


        return;

    }


    const notes =
        await getNotePageList();


    const deletedIndex =
        currentNotePageIndex;


    const currentNote =
        notes.find(
            note =>
                note.id ===
                editingNoteId
        );


    if(!currentNote){

        editingNoteId =
            null;


        await closeNoteEditor();


        return;

    }


    const ok =
        confirm(
            "确定删除当前笔记？\n\n删除后无法恢复。"
        );


    if(!ok)

        return;


    /*
     * 使用原来的 NotesManager 删除。
     */
    await NotesManager.deleteNote(
        editingNoteId
    );


    /*
     * 当前编辑状态清空。
     */
    editingNoteId =
        null;


    noteEditMode =
        false;


    /*
     * 重新加载 NotesManager。
     */
    await NotesManager.loadNotes();


    const remainingNotes =
        await getNotePageList();


    /*
     * 删除以后还有历史笔记。
     */
    if(remainingNotes.length){

        let newIndex =
            deletedIndex;


        /*
         * 如果删除的是最后一条，
         * 自动选择前一条。
         */
        if(
            newIndex >=
            remainingNotes.length
        ){

            newIndex =
                remainingNotes.length - 1;

        }


        if(newIndex < 0){

            newIndex =
                0;

        }


        currentNotePageIndex =
            newIndex;


        await openHistoryNote(
            remainingNotes[
                currentNotePageIndex
            ]
        );


        return;

    }


    /*
     * 已经没有任何历史笔记。
     */
    currentNotePageIndex =
        -1;


    await closeNoteEditor();

}




// ============================================================
// 绑定顶部按钮
// ============================================================


// 上一页
if($("prevNotePage")){

    $("prevNotePage").onclick =
        async()=>{

            await previousNotePage();

        };

}


// 下一页
if($("nextNotePage")){

    $("nextNotePage").onclick =
        async()=>{

            await nextNotePage();

        };

}


// 新页面
if($("newNotePage")){

    $("newNotePage").onclick =
        async()=>{

            await createNewNotePage();

        };

}


// 删除页面
if($("deleteCurrentNote")){

    $("deleteCurrentNote").onclick =
        async()=>{

            await deleteCurrentNotePage();

        };

}




// ============================================================
// 保存 / 修改笔记
// ============================================================


if($("saveNote")){
    $("saveNote").onclick = async()=>{
        if(noteSaveInProgress) return;
        noteSaveInProgress = true;

        try{
            let data = {

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
                .map(
                    x =>
                        x.trim()
                )
                .filter(x=>x),

            todo:[]

        };


        if(!data.title){

            alert(
                "请输入笔记标题"
            );

            return;

        }




        // ====================================================
        // 修改历史笔记
        // ====================================================


        if(editingNoteId){

            await NotesManager.updateNote(
                editingNoteId,
                data
            );


            /*
             * 修改后重新读取。
             */
            await NotesManager.loadNotes();


            /*
             * 保持当前页面位置。
             */
            await setCurrentNotePageById(
                editingNoteId
            );


            if($("noteSaveStatus")){

                $("noteSaveStatus").innerText =
                    "已保存";

            }


            alert(
                "笔记修改成功"
            );

        }




        // ====================================================
        // 新建笔记
        // ====================================================


        else{

            const createdNote =
                await NotesManager.createNote(
                    data
                );


            /*
             * 重新读取数据库。
             */
            await NotesManager.loadNotes();


            const notes =
                await getNotePageList();


            /*
             * 找到刚刚创建的笔记。
             *
             * 优先使用 createNote 返回的 ID。
             */
            let createdId =
                createdNote?.id;


            let newNote =
                null;


            if(createdId){

                newNote =
                    notes.find(
                        note =>
                            note.id ===
                            createdId
                    );

            }


            /*
             * 如果 NotesManager.createNote()
             * 没有返回对象，则根据标题、
             * 最新 ID 找到刚刚保存的笔记。
             */
            if(!newNote){

                newNote =
                    notes.find(
                        note =>
                            note.title ===
                            data.title
                    );

            }


            if(!newNote && notes.length){

                newNote =
                    notes[0];

            }


            /*
             * 新笔记保存成功后，
             * 让它成为当前页面。
             */
            if(newNote){

    currentNotePageIndex =
        notes.findIndex(
            note =>
                note.id ===
                newNote.id
        );

    editingNoteId = null;

}


            if($("noteSaveStatus")){

                $("noteSaveStatus").innerText =
                    "已保存";

            }


            alert(
                "笔记保存成功"
            );

        }




        /*
         * 刷新历史笔记数据。
         *
         * 不删除历史列表。
         */
        await NotesManager.loadNotes();


        /*
         * 如果当前仍然有编辑中的笔记，
         * 保持页面索引。
         */
        if(editingNoteId){

            await setCurrentNotePageById(
                editingNoteId
            );

        }


        renderNotes();




        /*
         * 保存按钮原来的行为：
         * 清空编辑区。
         *
         * 这里保留。
         *
         * 但如果刚刚保存的是新笔记，
         * 当前页面仍然记录为这条历史笔记。
         */
       $("noteTitle").value="";
       $("noteTags").value="";
       $("noteEditor").innerHTML="";

        } finally {
            noteSaveInProgress = false;
        }
    };
}




// ============================================================
// 清空笔记
// ============================================================


if($("clearNote")){

    $("clearNote")
    .onclick=()=>{

        /*
         * 只清空编辑器。
         *
         * 不删除数据库中的历史笔记。
         */
        editingNoteId=null;

        currentNotePageIndex=-1;


        $("noteTitle").value="";

        $("noteTags").value="";

        $("noteEditor").innerHTML="";


        if($("noteCategory")){

            $("noteCategory").value =
                "其他";

        }


        if($("noteEditorTitle")){

            $("noteEditorTitle").innerText =
                "新建笔记";

        }


        if($("noteSaveStatus")){

            $("noteSaveStatus").innerText =
                "新建";

        }


        updateNotePageInfo();

    };

}




// ============================================================
// 返回笔记列表
// ============================================================


async function closeNoteEditor(){

    noteEditMode = false;
    editingNoteId = null;
    currentNotePageIndex = -1;

    const header = $("noteEditorHeader");
    if(header) header.style.display = "none";

    const titleBox = $("noteTitle")?.closest(".box");
    const editorBox = $("noteEditor")?.closest(".box");
    const buttons = $("saveNote")?.closest(".btns");

    if(titleBox) titleBox.style.display = "none";
    if(editorBox) editorBox.style.display = "none";
    if(buttons) buttons.style.display = "none";

    const searchBox = $("noteSearch")?.closest(".box");
    const categories = $("noteCategories")?.closest(".box");
    const list = $("notesList");

    if(searchBox) searchBox.style.display = "";
    if(categories) categories.style.display = "";
    if(list) list.style.display = "";

    await renderNotes();
}

if($("backToNotes")){
    $("backToNotes").onclick = async()=>{

        const title = $("noteTitle")?.value.trim();
        const content = $("noteEditor")?.innerHTML;
        const tags = $("noteTags")?.value.trim();

        // 新建笔记时，如果什么都没写，直接返回
        if(!editingNoteId && !title && !content && !tags){
            await closeNoteEditor();
            return;
        }

        // 有内容时询问
        if(title || content || tags){

            const save = confirm("笔记有修改，是否保存？");

            if(!save){
                return;
            }

            // 已有笔记 → 保存修改
            if(editingNoteId){

                await NotesManager.updateNote(editingNoteId,{
                    title: title,
                    content: content,
                    category: $("noteCategory").value,
                    tags: $("noteTags").value
                        .split(",")
                        .map(x=>x.trim())
                        .filter(x=>x),
                    todo:[]
                });

            }else{

                // 新笔记 → 保存
                await NotesManager.createNote({
                    title: title,
                    content: content,
                    category: $("noteCategory").value,
                    tags: $("noteTags").value
                        .split(",")
                        .map(x=>x.trim())
                        .filter(x=>x),
                    todo:[]
                });
            }
        }

        await closeNoteEditor();
    };
}




// ============================================================
// 笔记编辑器
// ============================================================


// 当前编辑器
function getNoteEditor(){

    return $("noteEditor");

}




// ============================================================
// 保持编辑器焦点
// ============================================================


function focusNoteEditor(){

    const editor =
        getNoteEditor();


    if(!editor)

        return;


    editor.focus();

}




// ============================================================
// 获取当前光标 Range
// ============================================================


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




// ============================================================
// 光标移动到清单文字末尾
// ============================================================


function placeCaretAfter(node){

    const editor =
        getNoteEditor();


    if(!editor || !node)

        return;


    const text =
        node.querySelector(
            ".note-check-text"
        );


    if(!text)

        return;


    const selection =
        window.getSelection();


    if(!selection)

        return;


    const range =
        document.createRange();


    editor.focus();


    range.selectNodeContents(
        text
    );


    range.collapse(false);


    selection.removeAllRanges();


    selection.addRange(
        range
    );

}




// ============================================================
// 普通文字格式
// ============================================================


// ================================
// 编辑器当前选区保存
// ================================

let savedNoteRange = null;


// ================================
// 保存当前选区
// ================================

function saveNoteSelection(){

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


    const range =
        selection.getRangeAt(0);


    /*
     * 必须确认选区属于笔记编辑器
     */
    if(
        !editor.contains(
            range.commonAncestorContainer
        )
    )
        return;


    /*
     * cloneRange 非常重要
     * 防止后续 DOM 操作改变原来的 Range
     */
    savedNoteRange =
        range.cloneRange();

}


// ================================
// 恢复当前选区
// ================================

function restoreNoteSelection(){

    const editor =
        getNoteEditor();

    if(
        !editor ||
        !savedNoteRange
    )
        return;


    const selection =
        window.getSelection();

    if(!selection)
        return;


    /*
     * 先重新 focus 编辑器
     */
    editor.focus();


    /*
     * 恢复选区
     */
    selection.removeAllRanges();

    selection.addRange(
        savedNoteRange
    );

}


// ================================
// 改变文字样式
// B / I / U / H1
// ================================

function formatText(type){

    const editor =
        getNoteEditor();

    if(!editor)
        return;


    /*
     * 先恢复用户刚才选中的文字
     */
    restoreNoteSelection();


    const selection =
        window.getSelection();

    if(
        !selection ||
        !selection.rangeCount
    )
        return;


    const range =
        selection.getRangeAt(0);


    /*
     * 确认选区在编辑器里面
     */
    if(
        !editor.contains(
            range.commonAncestorContainer
        )
    )
        return;


    /*
     * ============================
     * H1
     * ============================
     */

    if(type === "title"){

        document.execCommand(
            "formatBlock",
            false,
            "h2"
        );

    }


    /*
     * ============================
     * B / I / U
     * ============================
     */

    else if(
        type === "bold" ||
        type === "italic" ||
        type === "underline"
    ){

        document.execCommand(
            type,
            false,
            null
        );

    }


    /*
     * ============================
     * 保存修改后的选区
     * ============================
     */

    const newSelection =
        window.getSelection();


    if(
        newSelection &&
        newSelection.rangeCount
    ){

        savedNoteRange =
            newSelection
            .getRangeAt(0)
            .cloneRange();

    }


    /*
     * 保持编辑器焦点
     */
    editor.focus();


    /*
     * 再次恢复选中状态
     *
     * 这样点击 B/I/U/H1 后，
     * 文字仍然保持选中。
     */
    if(savedNoteRange){

        const finalSelection =
            window.getSelection();


        finalSelection
            .removeAllRanges();


        finalSelection
            .addRange(
                savedNoteRange
            );

    }


    /*
     * 自动保存
     */
    scheduleNoteAutoSave();

}




// ============================================================
// 创建清单行
// ============================================================


function createTodoLine(text = ""){

    const line =
        document.createElement("div");


    line.className =
        "note-check-line";


    line.setAttribute(
        "contenteditable",
        "false"
    );


    const checkbox =
        document.createElement("input");


    checkbox.type =
        "checkbox";


    checkbox.className =
        "note-checkbox";


    const textSpan =
        document.createElement("span");


    textSpan.className =
        "note-check-text";


    textSpan.contentEditable =
        "true";


    textSpan.innerText =
        text;


    line.appendChild(
        checkbox
    );


    line.appendChild(
        textSpan
    );


    return line;

}




// ============================================================
// 插入清单
// ============================================================


function insertTodo(){

    const editor =
        getNoteEditor();


    if(!editor)

        return;


    let range =
        getEditorRange();


    if(!range){

        editor.focus();


        range =
            document.createRange();


        range.selectNodeContents(
            editor
        );


        range.collapse(false);

    }


    let node =
        range.startContainer;


    let currentTodo =
        null;


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

            currentTodo =
                node;


            break;

        }


        node =
            node.parentNode;

    }


    const newLine =
        createTodoLine();


    if(currentTodo){

        currentTodo.after(
            newLine
        );

    }

    else{

        range.deleteContents();


        range.insertNode(
            newLine
        );

    }


    const textSpan =
        newLine.querySelector(
            ".note-check-text"
        );


    if(!textSpan)

        return;


    editor.focus();


    const selection =
        window.getSelection();


    const newRange =
        document.createRange();


    newRange.selectNodeContents(
        textSpan
    );


    newRange.collapse(false);


    selection.removeAllRanges();


    selection.addRange(
        newRange
    );


    requestAnimationFrame(()=>{

        editor.focus();


        selection.removeAllRanges();


        selection.addRange(
            newRange
        );

    });


    scheduleNoteAutoSave();

}




// ============================================================
// 插入分割线
// ============================================================


function insertLine(){

    const editor =
        getNoteEditor();


    if(!editor)

        return;


    editor.focus();


    let range =
        getEditorRange();


    if(!range){

        range =
            document.createRange();


        range.selectNodeContents(
            editor
        );


        range.collapse(false);

    }


    range.deleteContents();


    const before =
        document.createElement(
            "div"
        );


    before.innerHTML =
        "<br>";


    const hr =
        document.createElement(
            "hr"
        );


    hr.className =
        "note-divider";


    const after =
        document.createElement(
            "div"
        );


    after.innerHTML =
        "<br>";


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




// ============================================================
// Enter 自动处理
// ============================================================


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


    let todoLine =
        null;


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

            todoLine =
                node;


            break;

        }


        node =
            node.parentNode;

    }




    // ============================
    // 清单 Enter
    // ============================


    if(todoLine){

        e.preventDefault();


        const newLine =
            createTodoLine();


        todoLine.after(
            newLine
        );


        const textSpan =
            newLine.querySelector(
                ".note-check-text"
            );


        if(!textSpan)

            return;


        editor.focus();


        const newRange =
            document.createRange();


        newRange.selectNodeContents(
            textSpan
        );


        newRange.collapse(true);


        selection.removeAllRanges();


        selection.addRange(
            newRange
        );


        requestAnimationFrame(()=>{

            editor.focus();


            selection.removeAllRanges();


            selection.addRange(
                newRange
            );

        });


        setTimeout(()=>{

            editor.focus();


            selection.removeAllRanges();


            selection.addRange(
                newRange
            );

        },50);


        scheduleNoteAutoSave();


        return;

    }




    // ============================
    // 普通文字 Enter
    // ============================


    scheduleNoteAutoSave();

}




// ============================================================
// 清单点击
// ============================================================


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




// ============================================================
// 编辑器自动保存
// ============================================================


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




// ============================================================
// 静默保存当前笔记
// ============================================================


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
        (
            $("noteTags")?.value
            || ""
        )
        .split(",")
        .map(
            x =>
                x.trim()
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


        if($("noteSaveStatus")){

            $("noteSaveStatus").innerText =
                "已保存";

        }

    }

    catch(error){

        console.error(
            "笔记自动保存失败:",
            error
        );

    }

}




// ============================================================
// 编辑器事件
// ============================================================


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


    $("noteEditor")
    .addEventListener(
        "keydown",
        handleTodoBackspace
    );

}




// ============================================================
// 撤销
// ============================================================


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




// ============================================================
// 重做
// ============================================================


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




// ============================================================
// 当前笔记置顶
// ============================================================


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
    .then(async()=>{

        await setCurrentNotePageById(
            editingNoteId
        );


        renderNotes();

    });

}




// ============================================================
// 待办事项
// ============================================================


if($("addTodo")){

    $("addTodo")
    .onclick=()=>{

        let value =
            $("todoInput")
            .value
            .trim();


        if(!value)

            return;


        let div =
            document.createElement("div");


        div.className =
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




// ============================================================
// 笔记搜索
// ============================================================


if($("noteSearch")){

    $("noteSearch").oninput = ()=>{

        renderNotes();

    };

}




// ============================================================
// 笔记分类
// ============================================================


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
                ||
                "全部";


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




// ============================================================
// Backspace 清单逻辑
// ============================================================


function handleTodoBackspace(e){

    if(e.key !== "Backspace")

        return;


    const selection =
        window.getSelection();


    if(
        !selection ||
        !selection.rangeCount
    )

        return;


    if(!selection.isCollapsed)

        return;


    let node =
        selection.anchorNode;


    let textSpan =
        null;


    let todoLine =
        null;


    while(
        node &&
        node.id !== "noteEditor"
    ){

        if(
            node.nodeType === 1 &&
            node.classList &&
            node.classList.contains(
                "note-check-text"
            )
        ){

            textSpan =
                node;

        }


        if(
            node.nodeType === 1 &&
            node.classList &&
            node.classList.contains(
                "note-check-line"
            )
        ){

            todoLine =
                node;

            break;

        }


        node =
            node.parentNode;

    }


    if(
        !textSpan ||
        !todoLine
    )

        return;


    const range =
        selection.getRangeAt(0);


    if(
        range.startContainer ===
        textSpan
    ){

        if(
            range.startOffset !==
            0
        )

            return;

    }

    else{

        if(
            range.startContainer.nodeType ===
            Node.TEXT_NODE
        ){

            if(
                range.startOffset !==
                0
            )

                return;

        }

    }


    const text =
        textSpan.innerText
        .replace(
            /\u200B/g,
            ""
        )
        .trim();


    if(text === ""){

        e.preventDefault();


        const previous =
            todoLine.previousElementSibling;


        todoLine.remove();


        if(previous){

            const previousText =
                previous.querySelector(
                    ".note-check-text"
                );


            if(previousText){

                const editor =
                    getNoteEditor();


                const newRange =
                    document.createRange();


                const newSelection =
                    window.getSelection();


                editor.focus();


                newRange.selectNodeContents(
                    previousText
                );


                newRange.collapse(false);


                newSelection.removeAllRanges();


                newSelection.addRange(
                    newRange
                );

            }

        }


        scheduleNoteAutoSave();

    }

}




// ============================================================
// 启动
// ============================================================


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


    if(window.NotesManager){

        await NotesManager.loadNotes();

    }


    /*
     * 初始化页码。
     */
    currentNotePageIndex =
        -1;


    updateNotePageInfo();

};

/* =========================
   全局禁止 iPhone 双指缩放
========================= */

document.addEventListener(
    "gesturestart",
    function(e) {
        e.preventDefault();
    },
    { passive: false }
);

document.addEventListener(
    "gesturechange",
    function(e) {
        e.preventDefault();
    },
    { passive: false }
);

document.addEventListener(
    "gestureend",
    function(e) {
        e.preventDefault();
    },
    { passive: false }
);



