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
// 功能：
//
// ① 光标模式
// 光标放在文字后面
// → 点击 T：激活背景色
// → 后面输入的文字自动带黄色背景
// → 再点击 T：取消激活
// → 后面输入的文字不再带黄色背景
//
// ② 选中文字模式
// 选中文字
// → 点击 T：添加黄色背景
// → 再点击 T：取消黄色背景
//
// 注意：
// 不在 input 事件里面执行 execCommand。
// 避免每输入一个字都重新处理 DOM，解决打字卡顿问题。
// ============================================================

let noteBgMode = false;

if($("textBgColorBtn")){

    const bgColorButton =
        $("textBgColorBtn");

    const HIGHLIGHT_COLOR =
        "#fff59d";


    // ========================================================
    // 点击 T 前保存当前光标 / 选区
    // ========================================================

    bgColorButton.addEventListener(
        "mousedown",
        function(e){

            e.preventDefault();

            saveNoteSelection();

        }
    );


    bgColorButton.addEventListener(
        "touchstart",
        function(){

            saveNoteSelection();

        },
        {
            passive:true
        }
    );


    // ========================================================
    // T 按钮
    // ========================================================

    bgColorButton.addEventListener(
        "click",
        function(){

            const editor =
                getNoteEditor();

            if(!editor){
                return;
            }


            // =================================================
            // 恢复点击按钮之前的光标 / 选区
            // =================================================

            restoreNoteSelection();


            const selection =
                window.getSelection();


            if(
                !selection ||
                !selection.rangeCount
            ){
                return;
            }


            const range =
                selection.getRangeAt(0);


            // =================================================
            // 确保操作发生在笔记编辑器内部
            // =================================================

            if(
                !editor.contains(
                    range.commonAncestorContainer
                )
            ){
                return;
            }


            // =================================================
            // 情况 1：光标模式
            // =================================================

            if(range.collapsed){

                // =================================================
                // 当前没有激活
                //
                // → 开启黄色输入模式
                // =================================================

                if(!noteBgMode){

                    try{

                        document.execCommand(
                            "styleWithCSS",
                            false,
                            true
                        );

                    }catch(e){}


                    try{

                        document.execCommand(
                            "backColor",
                            false,
                            HIGHLIGHT_COLOR
                        );

                    }catch(e){}


                    noteBgMode = true;


                    bgColorButton.classList.add(
                        "active"
                    );

                }


                // =================================================
                // 当前已经激活
                //
                // → 关闭黄色输入模式
                //
                // 这里不再修改 DOM。
                //
                // 也不插入透明 span。
                //
                // 也不执行 backColor("transparent")。
                //
                // 只关闭 noteBgMode。
                //
                // 下一次输入由 beforeinput 负责确保
                // 新文字不会继续继承黄色背景。
                // =================================================

                else{

                    noteBgMode = false;


                    bgColorButton.classList.remove(
                        "active"
                    );

                }


                // =================================================
                // 焦点回编辑器
                // =================================================

                editor.focus();


                return;

            }


            // =================================================
            // 情况 2：选中文字
            // =================================================

            const selectedText =
                range.toString();


            if(!selectedText){
                return;
            }


            // =================================================
            // 判断选中的文字是否已经全部黄色
            // =================================================

            const alreadyYellow =
                isRangeFullyYellow(
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


            let changed = false;


            // =================================================
            // 已经黄色
            // → 取消黄色
            // =================================================

            if(alreadyYellow){

                try{

                    changed =
                        document.execCommand(
                            "backColor",
                            false,
                            "transparent"
                        );

                }catch(e){

                    changed = false;

                }

            }


            // =================================================
            // 普通文字
            // → 添加黄色
            // =================================================

            else{

                try{

                    changed =
                        document.execCommand(
                            "backColor",
                            false,
                            HIGHLIGHT_COLOR
                        );

                }catch(e){

                    changed = false;

                }

            }


            // =================================================
            // 选中文字操作不改变后续输入模式
            // =================================================

            noteBgMode = false;


            bgColorButton.classList.remove(
                "active"
            );


            // =================================================
            // 更新按钮状态
            // =================================================

            updateHighlightButton();


            // =================================================
            // 标记笔记修改
            // =================================================

            if(changed){

                if(
                    typeof noteHasChanges !==
                    "undefined"
                ){

                    noteHasChanges = true;

                }


                if(
                    typeof scheduleNoteAutoSave ===
                    "function"
                ){

                    scheduleNoteAutoSave();

                }

            }

        }
    );


    // ========================================================
    // 关键：
    // 处理关闭 T 后的第一次文字输入
    //
    // 浏览器 contenteditable 可能仍然保留之前的
    // 黄色 typing state。
    //
    // 所以：
    //
    // T 关闭
    // ↓
    // 浏览器准备插入下一段文字
    // ↓
    // beforeinput 拦截
    // ↓
    // 如果当前输入模式已经关闭
    // ↓
    // 直接插入普通 Text Node
    //
    // 这样不会执行 input + execCommand，
    // 不会每个字重新格式化。
    // ========================================================

    const noteEditor =
        getNoteEditor();


    if(noteEditor){

        noteEditor.addEventListener(
            "beforeinput",
            function(e){

                // =================================================
                // 只有关闭 T 后才需要处理
                // =================================================

                if(noteBgMode){
                    return;
                }


                // =================================================
                // 只处理普通文字输入
                //
                // 不干涉：
                // 删除
                // 回车
                // 粘贴
                // 图片
                // 其他编辑操作
                // =================================================

                if(
                    e.inputType !==
                    "insertText"
                ){
                    return;
                }


                if(
                    typeof e.data !==
                    "string" ||
                    !e.data
                ){
                    return;
                }


                const selection =
                    window.getSelection();


                if(
                    !selection ||
                    !selection.rangeCount
                ){
                    return;
                }


                const range =
                    selection.getRangeAt(0);


                if(!range.collapsed){
                    return;
                }


                if(
                    !noteEditor.contains(
                        range.commonAncestorContainer
                    )
                ){
                    return;
                }


                // =================================================
                // 判断当前光标是否仍然位于黄色元素里面
                // =================================================

                let node =
                    range.startContainer;


                if(
                    node.nodeType ===
                    Node.TEXT_NODE
                ){

                    node =
                        node.parentElement;

                }


                let yellowElement = null;


                while(
                    node &&
                    node !== noteEditor
                ){

                    const background =
                        getComputedStyle(
                            node
                        )
                        .backgroundColor
                        .replace(/\s/g,"")
                        .toLowerCase();


                    if(
                        background ===
                        "rgb(255,245,157)"
                    ){

                        yellowElement =
                            node;

                        break;

                    }


                    node =
                        node.parentElement;

                }


                // =================================================
                // 如果当前光标不在黄色元素里
                //
                // 浏览器已经正常恢复普通输入，
                // 不需要干涉。
                // =================================================

                if(!yellowElement){
                    return;
                }


                // =================================================
                // 浏览器仍然处于黄色输入节点
                //
                // 阻止浏览器默认插入
                // =================================================

                e.preventDefault();


                try{

                    const textNode =
                        document.createTextNode(
                            e.data
                        );


                    range.insertNode(
                        textNode
                    );


                    // =================================================
                    // 光标移动到新文字后面
                    // =================================================

                    const newRange =
                        document.createRange();


                    newRange.setStart(
                        textNode,
                        textNode.nodeValue.length
                    );


                    newRange.collapse(
                        true
                    );


                    selection.removeAllRanges();

                    selection.addRange(
                        newRange
                    );


                }catch(error){

                    console.error(
                        "普通文字输入恢复失败：",
                        error
                    );

                }

            }
        );


        // ========================================================
        // 编辑器状态监听
        // ========================================================

        noteEditor.addEventListener(
            "mouseup",
            function(){

                updateHighlightButton();

            }
        );


        noteEditor.addEventListener(
            "keyup",
            function(){

                updateHighlightButton();

            }
        );


        noteEditor.addEventListener(
            "touchend",
            function(){

                setTimeout(
                    updateHighlightButton,
                    50
                );

            }
        );


        noteEditor.addEventListener(
            "focus",
            function(){

                updateHighlightButton();

            }
        );

    }


    // ========================================================
    // 判断选区是否全部是黄色背景
    // ========================================================

    function isRangeFullyYellow(
        range,
        editor
    ){

        const walker =
            document.createTreeWalker(
                editor,
                NodeFilter.SHOW_TEXT,
                null
            );


        let node;

        let hasText = false;


        while(
            node = walker.nextNode()
        ){

            if(
                !node.nodeValue ||
                !node.nodeValue.trim()
            ){

                continue;

            }


            let intersects = false;


            try{

                intersects =
                    range.intersectsNode(
                        node
                    );

            }catch(e){

                intersects = false;

            }


            if(!intersects){
                continue;
            }


            let start = 0;

            let end =
                node.nodeValue.length;


            if(
                node ===
                range.startContainer
            ){

                start =
                    range.startOffset;

            }


            if(
                node ===
                range.endContainer
            ){

                end =
                    range.endOffset;

            }


            if(start >= end){
                continue;
            }


            const selectedText =
                node.nodeValue.substring(
                    start,
                    end
                );


            if(
                !selectedText.trim()
            ){

                continue;

            }


            hasText = true;


            let element =
                node.parentElement;


            let yellow = false;


            while(
                element &&
                element !== editor
            ){

                const background =
                    getComputedStyle(
                        element
                    )
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
                    background ===
                    "#fff59d"
                ){

                    yellow = true;

                    break;

                }


                element =
                    element.parentElement;

            }


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

        const editor =
            getNoteEditor();


        if(!editor){

            bgColorButton.classList.remove(
                "active"
            );

            return;

        }


        const selection =
            window.getSelection();


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


        // =================================================
        // 光标状态
        // =================================================

        if(range.collapsed){

            bgColorButton.classList.toggle(
                "active",
                noteBgMode
            );

            return;

        }


        // =================================================
        // 选中文字状态
        // =================================================

        bgColorButton.classList.toggle(
            "active",
            isRangeFullyYellow(
                range,
                editor
            )
        );

    }


    // ========================================================
    // 初始按钮状态
    // ========================================================

    updateHighlightButton();

}

