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
// 笔记文字背景色 / 高亮
// 固定黄色：#fff59d
// ============================================================
let noteBgMode = false;
if ($("textBgColorBtn")) {
    const bgBtn = $("textBgColorBtn");
    const COLOR = "#fff59d";
    const COLOR_RGB = "rgb(255, 245, 157)";

    bgBtn.addEventListener("mousedown", function (e) {
        e.preventDefault();
        saveNoteSelection();
    });
    bgBtn.addEventListener("touchstart", function () {
        saveNoteSelection();
    }, { passive: true });

    bgBtn.addEventListener("click", function () {
        const editor = getNoteEditor();
        if (!editor) return;
        restoreNoteSelection();
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        if (!editor.contains(range.commonAncestorContainer)) return;

        // 1.光标折叠，无选中文字：切换持续输入高亮开关
        if (range.collapsed) {
            noteBgMode = !noteBgMode;
            bgBtn.classList.toggle("active", noteBgMode);
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
        const editor = getNoteEditor();
        if (!editor) return;
        bgBtn.classList.toggle("active", noteBgMode);
    });

    const editor = getNoteEditor();
    if (editor) {
        let lastTextLength = 0;

        editor.addEventListener("input", function (e) {
            // 模式关闭直接退出，不碰DOM
            if (!noteBgMode) return;
            // 只处理文本插入，跳过删除、回车、粘贴
            if (e.inputType !== "insertText") return;

            const sel = window.getSelection();
            if (!sel.rangeCount) return;
            const r = sel.getRangeAt(0);
            const textNode = r.endContainer;
            // 必须是文本节点
            if (textNode.nodeType !== 3) return;

            const addedLen = e.data.length;
            // 取刚输入出来的那一段文本
            const offsetStart = r.endOffset - addedLen;
            const newText = textNode.substringData(offsetStart, addedLen);

            if (!newText) return;

            // 分割文本节点：旧部分留在原地，新文本切出来，包span
            textNode.splitText(offsetStart);
            const newTextNode = textNode.nextSibling;

            const span = document.createElement("span");
            span.style.backgroundColor = COLOR;
            span.appendChild(newTextNode);
            textNode.parentNode.insertBefore(span, newTextNode);

            // 把光标挪到span后面
            r.setStartAfter(span);
            r.setEndAfter(span);
            sel.removeAllRanges();
            sel.addRange(r);

            noteHasChanges = true;
            if (typeof scheduleNoteAutoSave === "function") {
                scheduleNoteAutoSave();
            }
        });
    }
}