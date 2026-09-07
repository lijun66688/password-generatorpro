// ============================================================
// 笔记工具
// 插入当前时间
// ============================================================

if($("insertNoteTime")){

    const timeButton = $("insertNoteTime");

    // 点击按钮之前，先保存编辑器当前光标
    timeButton.addEventListener("mousedown", e => {

        e.preventDefault();

        const editor = $("noteEditor");

        if(!editor)
            return;

        const selection = window.getSelection();

        if(
            selection &&
            selection.rangeCount
        ){

            const range =
                selection.getRangeAt(0);

            if(
                editor.contains(
                    range.commonAncestorContainer
                )
            ){

                timeButton._savedRange =
                    range.cloneRange();

            }

        }

    });


    timeButton.addEventListener("click", () => {

        const editor = $("noteEditor");

        if(!editor)
            return;


        // ====================================================
        // 恢复点击按钮之前的光标
        // ====================================================

        if(timeButton._savedRange){

            const selection =
                window.getSelection();

            editor.focus();

            selection.removeAllRanges();

            selection.addRange(
                timeButton._savedRange
            );

        }


        // ====================================================
        // 当前时间
        // ====================================================

        const now = new Date();

        const time =
            now.getFullYear() + "-" +
            String(
                now.getMonth() + 1
            ).padStart(2,"0") + "-" +
            String(
                now.getDate()
            ).padStart(2,"0") ;
          /*  String(
             now.getHours()
             ).padStart(2,"0") + ":" +
            String(
               now.getMinutes()
            ).padStart(2,"0") + ":" +
            String(
                now.getSeconds()
           ).padStart(2,"0");
         */
           

        // ====================================================
        // 插入时间
        // ====================================================

        document.execCommand(
            "insertText",
            false,
            time
        );


        // ====================================================
        // 标记笔记已经修改
        // ====================================================

        if(typeof noteHasChanges !== "undefined"){

            noteHasChanges = true;

        }


        // 自动保存
        if(typeof scheduleNoteAutoSave === "function"){

            scheduleNoteAutoSave();

        }

    });

}

// ============================================================



// ============================================================
// 笔记文字背景色 / 高亮
// 固定黄色：#fff59d
//

// ============================================================
// 笔记文字背景色

// ============================================================
// 笔记文字背景色 / 高亮
// 兼容 iPhone Safari：两种模式
// 1. 光标折叠点T：开启/关闭后续输入高亮
// 2. 选中文字点T：切换选中文字高亮，不改变开关



// ============================================================
// 笔记文字背景色 / 高亮 兜底稳定版
// 只支持：选中文字后点T，切换黄色高亮
// ============================================================

// note-tools.js============================================================
// 笔记工具
// 插入当前时间
// ============================================================
if($("insertNoteTime")){
    const timeButton = $("insertNoteTime");
    // 点击按钮之前，先保存编辑器当前光标
    timeButton.addEventListener("mousedown", e => {
        e.preventDefault();
        const editor = $("noteEditor");
        if(!editor)
            return;
        const selection = window.getSelection();
        if(
            selection &&
            selection.rangeCount
        ){
            const range =
                selection.getRangeAt(0);
            if(
                editor.contains(
                    range.commonAncestorContainer
                )
            ){
                timeButton._savedRange =
                    range.cloneRange();
            }
        }
    });
    timeButton.addEventListener("click", () => {
        const editor = $("noteEditor");
        if(!editor)
            return;
        // ====================================================
        // 恢复点击按钮之前的光标
        // ====================================================
        if(timeButton._savedRange){
            const selection =
                window.getSelection();
            editor.focus();
            selection.removeAllRanges();
            selection.addRange(
                timeButton._savedRange
            );
        }
        // ====================================================
        // 当前时间
        // ====================================================
        const now = new Date();
        const time =
            now.getFullYear() + "-" +
            String(
                now.getMonth() + 1
            ).padStart(2,"0") + "-" +
            String(
                now.getDate()
            ).padStart(2,"0") ;
          /*  String(
             now.getHours()
             ).padStart(2,"0") + ":" +
            String(
               now.getMinutes()
            ).padStart(2,"0") + ":" +
            String(
                now.getSeconds()
           ).padStart(2,"0");
         */
           
        // ====================================================
        // 插入时间
        // ====================================================
        document.execCommand(
            "insertText",
            false,
            time
        );
        // ====================================================
        // 标记笔记已经修改
        // ====================================================
        if(typeof noteHasChanges !== "undefined"){
            noteHasChanges = true;
        }
        // 自动保存
        if(typeof scheduleNoteAutoSave === "function"){
            scheduleNoteAutoSave();
        }
    });
}
// ============================================================
// ============================================================
// 笔记文字背景色 / 高亮
// 固定黄色：#fff59d
//
// ============================================================
let noteBgMode = false;
if($("textBgColorBtn")){
    const bgBtn = $("textBgColorBtn");
    const COLOR = "#fff59d";

    bgBtn.addEventListener("mousedown",function(e){
        e.preventDefault();
        saveNoteSelection();
    });
    bgBtn.addEventListener("touchstart",function(){
        saveNoteSelection();
    },{passive:true});

    bgBtn.addEventListener("click",function(){
        const editor = getNoteEditor();
        if(!editor) return;
        restoreNoteSelection();
        const selection = window.getSelection();
        if(!selection || !selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        if(!editor.contains(range.commonAncestorContainer)) return;

        // ========== 情况1：光标折叠，无选中文字：切换后续输入高亮开关 noteBgMode ==========
        if(range.collapsed){
            noteBgMode = !noteBgMode;
            bgBtn.classList.toggle("active", noteBgMode);
            editor.focus();
            return;
        }

        // ========== 情况2：有选中文字，切换选中区域背景色，不修改noteBgMode ==========
        const yellow = isRangeYellow(range);
        document.execCommand("styleWithCSS", false, true);
        document.execCommand("backColor", false, yellow ? "transparent" : COLOR);
        // 选中操作不接管按钮active，active完全交给noteBgMode
        bgBtn.classList.toggle("active", noteBgMode);

        noteHasChanges=true;
        if(typeof scheduleNoteAutoSave==="function"){
            scheduleNoteAutoSave();
        }
    });


    function getHighlightParent(node,editor){
        if(node.nodeType===3) node=node.parentElement;
        while(node && node!==editor){
            const bg = getComputedStyle(node).backgroundColor;
            if(bg==="rgb(255, 245, 157)"){
                return node;
            }
            node=node.parentElement;
        }
        return null;
    }

    function isRangeYellow(range){
        let node = range.commonAncestorContainer;
        if(node.nodeType===3) node=node.parentElement;
        while(node){
            const bg = getComputedStyle(node).backgroundColor;
            if(bg==="rgb(255, 245, 157)"){
                return true;
            }
            node=node.parentElement;
        }
        return false;
    }

    // selectionchange：不再乱改active，active只由noteBgMode控制
    document.addEventListener("selectionchange",function(){
        const editor = getNoteEditor();
        if(!editor) return;
        bgBtn.classList.toggle("active", noteBgMode);
    });
}

// =====================================
// 输入监听：noteBgMode开启时，仅给刚输入的字符设置背景，不污染全部编辑器
// =====================================
const bgEditor = getNoteEditor();
if(bgEditor){
    bgEditor.addEventListener("input", function(e){
        if(!noteBgMode) return;
        // 只处理普通文本插入，删除、回车等跳过
        if(e.inputType !== "insertText") return;

        const sel = window.getSelection();
        if(!sel.rangeCount) return;
        const r = sel.getRangeAt(0);
        // 取最后输入的1个字符范围
        r.setStart(r.endContainer, r.endOffset - 1);
        r.setEnd(r.endContainer, r.endOffset);

        document.execCommand("styleWithCSS", false, true);
        document.execCommand("backColor", false, "#fff59d");

        // 恢复光标到文字后面
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);

        noteHasChanges=true;
        if(typeof scheduleNoteAutoSave==="function"){
            scheduleNoteAutoSave();
        }
    });
}