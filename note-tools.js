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
// 只处理 textBgColorBtn
//
// 功能：
// 1. 光标模式：
//    光标放在文字后面 → 点击 T → 激活背景色
//    后续输入文字自动带黄色背景
//    再点击 T → 取消激活
//    后续输入文字不再带黄色背景
//
// 2. 选中文字模式：
//    选中文字 → 点击 T → 黄色背景
//    再点击 T → 取消黄色背景
//
// 其他笔记功能不处理
// ============================================================

let noteBgMode = false;

if ($("textBgColorBtn")) {

    const bgColorButton = $("textBgColorBtn");
    const HIGHLIGHT_COLOR = "#fff59d";


    // --------------------------------------------------------
    // 点击按钮前保存光标 / 选区
    // 防止点击工具栏后编辑器选区丢失
    // --------------------------------------------------------

    bgColorButton.addEventListener("mousedown", function(e){
        e.preventDefault();
        saveNoteSelection();
    });

    bgColorButton.addEventListener("touchstart", function(){
        saveNoteSelection();
    }, { passive:true });


    // --------------------------------------------------------
    // T 按钮点击
    // --------------------------------------------------------

    bgColorButton.addEventListener("click", function(){

        const editor = getNoteEditor();

        if(!editor) return;

        // 恢复编辑器原来的光标 / 选区
        restoreNoteSelection();

        const selection = window.getSelection();

        if(!selection || !selection.rangeCount){
            return;
        }

        const range = selection.getRangeAt(0);

        // 必须确认选区在笔记编辑器里面
        if(!editor.contains(range.commonAncestorContainer)){
            return;
        }


        // ====================================================
        // 情况 1：没有选择文字
        // ====================================================

        if(range.collapsed){

            // 光标模式：
            // 只负责切换“后续输入是否自动带背景色”
            noteBgMode = !noteBgMode;

            bgColorButton.classList.toggle(
                "active",
                noteBgMode
            );

            // 把焦点重新放回编辑器
            editor.focus();

            return;
        }


        // ====================================================
        // 情况 2：选中了文字
        // ====================================================

        const selectedText = range.toString();

        if(!selectedText){
            return;
        }


        // 判断当前选中的文字是不是已经全部黄色
        const alreadyYellow = isRangeFullyYellow(
            range,
            editor
        );


        try{
            document.execCommand(
                "styleWithCSS",
                false,
                true
            );
        }catch(e){}


        // 已经黄色 → 取消黄色
        // 普通文字 → 加黄色
        const changed = document.execCommand(
            "backColor",
            false,
            alreadyYellow
                ? "transparent"
                : HIGHLIGHT_COLOR
        );


        // 选中文字操作完成以后，
        // 不进入“后续输入高亮模式”
        noteBgMode = false;


        // 更新 T 按钮状态
        updateHighlightButton();


        // 告诉笔记系统内容发生变化
        if(changed){

            if(typeof noteHasChanges !== "undefined"){
                noteHasChanges = true;
            }

            if(typeof scheduleNoteAutoSave === "function"){
                scheduleNoteAutoSave();
            }
        }
    });


    // ========================================================
    // 判断选中的文字是否全部是黄色背景
    // ========================================================

    function isRangeFullyYellow(range, editor){

        const walker = document.createTreeWalker(
            editor,
            NodeFilter.SHOW_TEXT,
            null
        );

        let node;
        let hasText = false;


        while(node = walker.nextNode()){

            if(
                !node.nodeValue ||
                !node.nodeValue.trim()
            ){
                continue;
            }


            let intersects = false;

            try{
                intersects = range.intersectsNode(node);
            }catch(e){
                intersects = false;
            }


            if(!intersects){
                continue;
            }


            let start = 0;
            let end = node.nodeValue.length;


            // 处理选择开始位置
            if(node === range.startContainer){
                start = range.startOffset;
            }


            // 处理选择结束位置
            if(node === range.endContainer){
                end = range.endOffset;
            }


            if(start >= end){
                continue;
            }


            const selectedText =
                node.nodeValue.substring(
                    start,
                    end
                );


            if(!selectedText.trim()){
                continue;
            }


            hasText = true;


            // 检查这个文字节点的父级
            // 有没有黄色背景
            let element = node.parentElement;

            let yellow = false;


            while(
                element &&
                element !== editor
            ){

                const background =
                    getComputedStyle(element)
                        .backgroundColor
                        .replace(/\s/g,"")
                        .toLowerCase();


                if(
                    background ===
                    "rgb(255,245,157)"
                ){

                    yellow = true;
                    break;
                }


                if(
                    background === "#fff59d"
                ){

                    yellow = true;
                    break;
                }


                element = element.parentElement;
            }


            // 只要有一部分没有黄色
            // 就认为当前选区不是全部黄色
            if(!yellow){
                return false;
            }
        }


        return hasText;
    }


    // ========================================================
    // 更新 T 按钮状态
    // ========================================================

    function updateHighlightButton(){

        const editor = getNoteEditor();

        if(!editor){

            bgColorButton.classList.remove("active");

            return;
        }


        const selection = window.getSelection();

        if(
            !selection ||
            !selection.rangeCount
        ){

            bgColorButton.classList.toggle(
                "active",
                noteBgMode
            );

            return;
        }


        const range =
            selection.getRangeAt(0);


        if(
            !editor.contains(
                range.commonAncestorContainer
            )
        ){

            bgColorButton.classList.toggle(
                "active",
                noteBgMode
            );

            return;
        }


        // ----------------------------------------------------
        // 光标模式
        // ----------------------------------------------------

        if(range.collapsed){

            bgColorButton.classList.toggle(
                "active",
                noteBgMode
            );

            return;
        }


        // ----------------------------------------------------
        // 选中文字模式
        // ----------------------------------------------------

        bgColorButton.classList.toggle(
            "active",
            isRangeFullyYellow(
                range,
                editor
            )
        );
    }


    // ========================================================
    // 编辑器事件
    // ========================================================

    const noteEditor = getNoteEditor();


    if(noteEditor){

        // 鼠标选择文字
        noteEditor.addEventListener(
            "mouseup",
            function(){
                updateHighlightButton();
            }
        );


        // 键盘选择文字
        noteEditor.addEventListener(
            "keyup",
            function(){
                updateHighlightButton();
            }
        );


        // 手机触摸选择文字
        noteEditor.addEventListener(
            "touchend",
            function(){
                setTimeout(
                    updateHighlightButton,
                    50
                );
            }
        );


        // 编辑器获得焦点
        noteEditor.addEventListener(
            "focus",
            function(){
                updateHighlightButton();
            }
        );


        // ----------------------------------------------------
        // 监听输入
        //
        // 只有 noteBgMode = true 时，
        // 后续输入文字才自动加黄色背景
        // ----------------------------------------------------

        noteEditor.addEventListener(
            "input",
            function(){

                if(!noteBgMode){
                    return;
                }


                try{

                    document.execCommand(
                        "styleWithCSS",
                        false,
                        true
                    );


                    document.execCommand(
                        "backColor",
                        false,
                        HIGHLIGHT_COLOR
                    );

                }catch(e){}


                // 标记笔记已经修改
                if(typeof noteHasChanges !== "undefined"){
                    noteHasChanges = true;
                }


                // 自动保存
                if(typeof scheduleNoteAutoSave === "function"){
                    scheduleNoteAutoSave();
                }


                // 更新按钮状态
                updateHighlightButton();
            }
        );
    }


    // 初始状态
    updateHighlightButton();
}