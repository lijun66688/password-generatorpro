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
            ).padStart(2,"0");


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
// 笔记文字背景色 / 高亮
//
/* =========================================================
   笔记文字背景高亮
   功能：
   1. 选中文字 → 点击 T → 黄色背景
   2. 再次选择同样文字 → 点击 T → 取消黄色背景
   3. 光标状态 → 点击 T → 开启黄色输入模式
   4. 再点击 T → 关闭黄色输入模式
   5. 开启黄色输入模式后，新输入的文字自动黄色
   6. 关闭后，新输入文字恢复正常
   7. 不修改文字颜色
   8. 不使用 input 事件逐字 execCommand，避免输入卡顿
   ========================================================= */

let noteBgMode = false;

const HIGHLIGHT_COLOR = "#fff59d";

/* ---------------------------------------------------------
   保存当前选区
   --------------------------------------------------------- */

let savedNoteRange = null;

function saveNoteSelection() {
    const editor = document.getElementById("noteEditor");
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    if (!editor.contains(range.commonAncestorContainer)) {
        return;
    }

    savedNoteRange = range.cloneRange();
}


/* ---------------------------------------------------------
   恢复当前选区
   --------------------------------------------------------- */

function restoreNoteSelection() {
    if (!savedNoteRange) return false;

    const editor = document.getElementById("noteEditor");
    if (!editor) return false;

    try {
        if (!editor.contains(savedNoteRange.commonAncestorContainer)) {
            return false;
        }

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedNoteRange);

        return true;
    } catch (e) {
        return false;
    }
}


/* ---------------------------------------------------------
   判断一个文字节点是否处于黄色背景中
   --------------------------------------------------------- */

function isTextNodeHighlighted(node) {
    if (!node) return false;

    let el = node.nodeType === Node.TEXT_NODE
        ? node.parentElement
        : node;

    const editor = document.getElementById("noteEditor");

    while (el && el !== editor) {
        const style = window.getComputedStyle(el);

        if (
            style.backgroundColor === "rgb(255, 245, 157)" ||
            style.backgroundColor === HIGHLIGHT_COLOR ||
            style.backgroundColor === "#fff59d"
        ) {
            return true;
        }

        el = el.parentElement;
    }

    return false;
}


/* ---------------------------------------------------------
   判断选中的文字是否全部已经是黄色背景
   --------------------------------------------------------- */

function isRangeFullyYellow(range, editor) {
    if (!range || range.collapsed) {
        return false;
    }

    const fragment = range.cloneContents();

    const walker = document.createTreeWalker(
        fragment,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                if (!node.nodeValue || !node.nodeValue.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    let foundText = false;
    let allYellow = true;

    let node;

    while ((node = walker.nextNode())) {
        foundText = true;

        let parent = node.parentElement;
        let yellow = false;

        while (parent) {
            const style = window.getComputedStyle(parent);

            if (
                style.backgroundColor === "rgb(255, 245, 157)" ||
                style.backgroundColor === HIGHLIGHT_COLOR ||
                style.backgroundColor === "#fff59d"
            ) {
                yellow = true;
                break;
            }

            parent = parent.parentElement;
        }

        if (!yellow) {
            allYellow = false;
            break;
        }
    }

    return foundText && allYellow;
}


/* ---------------------------------------------------------
   更新 T 按钮状态
   --------------------------------------------------------- */

function updateHighlightButton() {
    const btn = document.getElementById("textBgColorBtn");
    const editor = document.getElementById("noteEditor");

    if (!btn || !editor) return;

    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
        btn.classList.toggle("active", noteBgMode);
        return;
    }

    const range = selection.getRangeAt(0);

    if (!editor.contains(range.commonAncestorContainer)) {
        btn.classList.toggle("active", noteBgMode);
        return;
    }

    /* 光标状态 */
    if (range.collapsed) {
        btn.classList.toggle("active", noteBgMode);
        return;
    }

    /* 选中文字状态 */
    const fullyYellow = isRangeFullyYellow(range, editor);

    btn.classList.toggle("active", fullyYellow);
}


/* ---------------------------------------------------------
   T 按钮
   --------------------------------------------------------- */

const textBgColorBtn = document.getElementById("textBgColorBtn");

if (textBgColorBtn) {

    /* 鼠标按下前先保存选区 */
    textBgColorBtn.addEventListener("mousedown", function () {
        saveNoteSelection();
    });

    /* 手机触摸按下前保存选区 */
    textBgColorBtn.addEventListener("touchstart", function () {
        saveNoteSelection();
    }, { passive: true });


    textBgColorBtn.addEventListener("click", function () {

        const editor = document.getElementById("noteEditor");

        if (!editor) return;

        /*
         * 点击按钮后恢复之前的选区。
         * 这样鼠标点击按钮不会让编辑器原来的选区丢失。
         */
        restoreNoteSelection();

        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);

        if (!editor.contains(range.commonAncestorContainer)) {
            return;
        }


        /* =================================================
           情况一：只有光标，没有选中文字
           ================================================= */

        if (range.collapsed) {

            /*
             * 这里非常重要：
             *
             * 不再使用：
             * execCommand("backColor")
             *
             * 因为部分浏览器虽然按钮看起来已经开启，
             * 但后续输入并不会真正继承背景色。
             *
             * 现在改成 noteBgMode 状态控制。
             *
             * 真正输入文字时，由 beforeinput 直接把文字
             * 放进黄色 span。
             */

            noteBgMode = !noteBgMode;

            updateHighlightButton();

            return;
        }


        /* =================================================
           情况二：选中了文字
           ================================================= */

        const fullyYellow = isRangeFullyYellow(range, editor);

        /*
         * 选区已经全部黄色
         * → 取消黄色
         */

        if (fullyYellow) {

            document.execCommand("styleWithCSS", false, true);

            document.execCommand(
                "backColor",
                false,
                "transparent"
            );

            noteBgMode = false;

        } else {

            /*
             * 选区不是全部黄色
             * → 设置黄色背景
             */

            document.execCommand("styleWithCSS", false, true);

            document.execCommand(
                "backColor",
                false,
                HIGHLIGHT_COLOR
            );

            noteBgMode = false;
        }


        /* 保存新的选区 */
        saveNoteSelection();

        /* 更新按钮状态 */
        updateHighlightButton();


        /*
         * 保持笔记已有的修改检测 / 自动保存逻辑。
         * 这里不监听 input，因此不会产生逐字卡顿。
         */
        if (typeof noteHasChanges !== "undefined") {
            noteHasChanges = true;
        }

        if (typeof scheduleNoteAutoSave === "function") {
            scheduleNoteAutoSave();
        }
    });
}


/* =========================================================
   黄色输入模式
   ========================================================= */

const noteEditor = document.getElementById("noteEditor");

if (noteEditor) {

    /*
     * beforeinput：
     *
     * 只有在 noteBgMode = true 时拦截普通文字输入。
     *
     * 不使用 input 事件，所以不会出现：
     *
     * 输入 A
     * → input
     * → execCommand
     * → 浏览器重新排版
     * → 输入 B
     * → input
     * → execCommand
     *
     * 这种逐字卡顿。
     */

    noteEditor.addEventListener("beforeinput", function (e) {

        if (!noteBgMode) {
            return;
        }

        /*
         * 只处理普通文字输入。
         *
         * 删除、Backspace、Enter、粘贴等操作
         * 暂时全部交给浏览器原本的 contenteditable 行为。
         */

        if (e.inputType !== "insertText") {
            return;
        }

        if (!e.data) {
            return;
        }

        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);

        if (!range.collapsed) {
            return;
        }

        if (!noteEditor.contains(range.commonAncestorContainer)) {
            return;
        }


        /*
         * 阻止浏览器直接插入文字。
         */

        e.preventDefault();


        /*
         * 创建黄色 span。
         */

        const span = document.createElement("span");

        span.style.backgroundColor = HIGHLIGHT_COLOR;


        /*
         * 把本次输入的文字放进去。
         */

        const textNode = document.createTextNode(e.data);

        span.appendChild(textNode);


        /*
         * 插入到当前光标位置。
         */

        range.insertNode(span);


        /*
         * 把光标移动到刚刚输入的文字后面。
         */

        const newRange = document.createRange();

        newRange.setStartAfter(span);
        newRange.collapse(true);

        selection.removeAllRanges();
        selection.addRange(newRange);


        /*
         * 保存当前选区。
         */

        savedNoteRange = newRange.cloneRange();


        /*
         * 标记笔记发生修改。
         */

        if (typeof noteHasChanges !== "undefined") {
            noteHasChanges = true;
        }


        /*
         * 保持原来的自动保存机制。
         */

        if (typeof scheduleNoteAutoSave === "function") {
            scheduleNoteAutoSave();
        }


        /*
         * 更新 T 按钮状态。
         */

        updateHighlightButton();
    });


    /* -----------------------------------------------------
       鼠标操作后更新按钮
       ----------------------------------------------------- */

    noteEditor.addEventListener("mouseup", function () {
        saveNoteSelection();
        updateHighlightButton();
    });


    /* -----------------------------------------------------
       键盘操作后更新按钮
       ----------------------------------------------------- */

    noteEditor.addEventListener("keyup", function () {
        saveNoteSelection();
        updateHighlightButton();
    });


    /* -----------------------------------------------------
       手机触摸操作后更新按钮
       ----------------------------------------------------- */

    noteEditor.addEventListener("touchend", function () {
        setTimeout(function () {
            saveNoteSelection();
            updateHighlightButton();
        }, 0);
    }, { passive: true });


    /* -----------------------------------------------------
       获得焦点时更新按钮
       ----------------------------------------------------- */

    noteEditor.addEventListener("focus", function () {
        updateHighlightButton();
    });


    /* -----------------------------------------------------
       点击编辑器时更新按钮
       ----------------------------------------------------- */

    noteEditor.addEventListener("click", function () {
        setTimeout(function () {
            saveNoteSelection();
            updateHighlightButton();
        }, 0);
    });
}


