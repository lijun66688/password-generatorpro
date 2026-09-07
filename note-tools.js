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
// 2. 选中文字点T：切换选中文字高亮，不改变开关状态
// ============================================================

let noteBgMode = false;
let lastRange = null;
let lastText = "";

if ($("textBgColorBtn")) {
    const bgBtn = $("textBgColorBtn");
    const COLOR = "#fff59d";
    const COLOR_RGB = "rgb(255, 245, 157)";
    const editor = getNoteEditor();

    if (bgBtn) {
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

            // 情况1：没有选中文字，切换后续输入高亮模式
            if (range.collapsed) {
                noteBgMode = !noteBgMode;
                bgBtn.classList.toggle("active", noteBgMode);
                editor.focus();
                return;
            }

            // 情况2：选中文字，切换高亮，不改变 noteBgMode
            const yellow = isRangeYellow(range);

            document.execCommand("styleWithCSS", false, true);
            document.execCommand("backColor", false, yellow ? "transparent" : COLOR);

            bgBtn.classList.toggle("active", noteBgMode);

            noteHasChanges = true;
            if (typeof scheduleNoteAutoSave === "function") {
                scheduleNoteAutoSave();
            }
        });
    }

    function isRangeYellow(range) {
        let node = range.commonAncestorContainer;

        if (node.nodeType === 3) {
            node = node.parentElement;
        }

        while (node && node !== editor) {
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

    if (editor) {
        // 记录输入前的状态
        editor.addEventListener("keydown", function () {
            if (!noteBgMode) return;

            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            lastRange = selection.getRangeAt(0).cloneRange();
            lastText = editor.innerText || "";
        });

        // 中文输入法确认后统一处理
        editor.addEventListener("compositionend", function (e) {
            if (!noteBgMode) return;

            const text = e.data || "";
            if (!text) return;

            insertHighlightText(text);
        });

        // 普通英文、数字、符号输入
        editor.addEventListener("beforeinput", function (e) {
            if (!noteBgMode) return;

            if (e.inputType !== "insertText") return;
            if (e.isComposing) return;

            e.preventDefault();

            const text = e.data || "";
            if (!text) return;

            insertHighlightText(text);
        });

        function insertHighlightText(text) {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);

            const span = document.createElement("span");
            span.style.backgroundColor = COLOR;
            span.textContent = text;

            range.insertNode(span);

            // 光标放到黄色文字后面
            range.setStartAfter(span);
            range.setEndAfter(span);

            selection.removeAllRanges();
            selection.addRange(range);

            noteHasChanges = true;
            if (typeof scheduleNoteAutoSave === "function") {
                scheduleNoteAutoSave();
            }
        }
    }
}


