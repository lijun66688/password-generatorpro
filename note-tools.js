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
// 笔记文字背景色 / 高亮（兼容iPhone Safari）
// 固定黄色：#fff59d
// ============================================================
let noteBgMode = false;
let mo = null; //MutationObserver实例
if ($("textBgColorBtn")) {
    const bgBtn = $("textBgColorBtn");
    const COLOR = "#fff59d";
    const COLOR_RGB = "rgb(255, 245, 157)";
    const editor = getNoteEditor();

    bgBtn.addEventListener("mousedown", function (e) {
        e.preventDefault();
        saveNoteSelection();
    });
    bgBtn.addEventListener("touchstart", function () {
        saveNoteSelection();
    }, { passive: true });

    bgBtn.addEventListener("click", function () {
        if (!editor) return;
        restoreNoteSelection();
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        if (!editor.contains(range.commonAncestorContainer)) return;

        // 1.光标折叠：切换持续输入高亮开关
        if (range.collapsed) {
            noteBgMode = !noteBgMode;
            bgBtn.classList.toggle("active", noteBgMode);

            // 开启模式：启动DOM监听；关闭模式停止监听
            if(noteBgMode){
                startObserver();
            }else{
                stopObserver();
            }
            editor.focus();
            return;
        }

        // 2.有选中文字：切换选中区域底色，不改动noteBgMode
        const yellow = isRangeYellow(range);
        document.execCommand("styleWithCSS", false, true);
        document.execCommand("backColor", false, yellow ? "transparent" : COLOR);
        bgBtn.classList.toggle("active", noteBgMode);

        noteHasChanges = true;
        if (typeof scheduleNoteAutoSave === "function") {
            scheduleNoteAutoSave();
        }
    });

    function isRangeYellow(range) {
        let node = range.commonAncestorContainer;
        if (node.nodeType === 3) node = node.parentElement;
        while (node) {
            const bg = getComputedStyle(node).backgroundColor;
            if (bg === COLOR_RGB) {
                return true;
            }
            node = node.parentElement;
        }
        return false;
    }

    document.addEventListener("selectionchange", function () {
        if (!editor) return;
        bgBtn.classList.toggle("active", noteBgMode);
    });

    //启动DOM变化监听
    function startObserver(){
        if(mo) return;
        mo = new MutationObserver((mutations)=>{
            if(!noteBgMode) return;
            for(const mut of mutations){
                for(const n of mut.addedNodes){
                    //只处理新增纯文本节点，且外层还没有黄色span
                    if(n.nodeType === 3 && n.textContent.trim()!==''){
                        if(n.parentNode.style.backgroundColor !== COLOR){
                            const sp = document.createElement("span");
                            sp.style.backgroundColor = COLOR;
                            n.parentNode.insertBefore(sp, n);
                            sp.appendChild(n);
                            //恢复光标
                            const sel = window.getSelection();
                            const r = document.createRange();
                            r.setStartAfter(sp);
                            r.setEndAfter(sp);
                            sel.removeAllRanges();
                            sel.addRange(r);

                            noteHasChanges=true;
                            if(typeof scheduleNoteAutoSave==="function") scheduleNoteAutoSave();
                        }
                    }
                }
            }
        });
        mo.observe(editor, {childList:true, subtree:true});
    }

    function stopObserver(){
        if(mo){
            mo.disconnect();
            mo = null;
        }
    }
}


