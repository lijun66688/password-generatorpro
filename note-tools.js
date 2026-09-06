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
// 功能：
// 1. 选中文字 → 添加黄色背景
// 2. 选中已经高亮的文字 → 取消黄色背景
// 3. 光标放在高亮文字中 → 按钮显示 active
// 4. 选区全部是高亮 → 按钮显示 active
// 5. 选区包含普通文字 → 按钮不 active
// 6. 不影响 B / I / U
// 7. 不使用颜色选择器
// ============================================================

if($("textBgColorBtn")){

    const bgColorButton =
        $("textBgColorBtn");

    const HIGHLIGHT_COLOR =
        "#fff59d";


    // ========================================================
    // 保存点击按钮之前的编辑器选区
    // 防止手机点击按钮后选区丢失
    // ========================================================

    bgColorButton.addEventListener(
        "mousedown",
        function(e){

            e.preventDefault();

            saveNoteSelection();

        }
    );


    // ========================================================
    // 手机触摸开始时保存选区
    // ========================================================

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
    // 点击高亮按钮
    // ========================================================

    bgColorButton.addEventListener(
        "click",
        function(){

            const editor =
                getNoteEditor();


            if(!editor)
                return;


            // ------------------------------------------------
            // 恢复点击按钮之前的选区
            // ------------------------------------------------

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


            // ------------------------------------------------
            // 确保选区在编辑器里面
            // ------------------------------------------------

            if(
                !editor.contains(
                    range.commonAncestorContainer
                )
            ){

                return;

            }


            // ------------------------------------------------
            // 必须选择文字
            // ------------------------------------------------

            if(range.collapsed){

                updateHighlightButton();

                return;

            }


            if(!range.toString()){

                updateHighlightButton();

                return;

            }


            // ------------------------------------------------
            // 判断当前选区是不是全部黄色
            // ------------------------------------------------

            const alreadyYellow =
                isSelectionYellow(
                    range,
                    editor
                );


            let changed = false;


            // ==================================================
            // 已经全部黄色
            // → 取消黄色
            // ==================================================

            if(alreadyYellow){

                try{

                    document.execCommand(
                        "styleWithCSS",
                        false,
                        true
                    );

                }catch(e){}


                changed =
                    document.execCommand(
                        "backColor",
                        false,
                        "transparent"
                    );

            }


            // ==================================================
            // 不是全部黄色
            // → 增加黄色
            // ==================================================

            else{

                try{

                    document.execCommand(
                        "styleWithCSS",
                        false,
                        true
                    );

                }catch(e){}


                changed =
                    document.execCommand(
                        "backColor",
                        false,
                        HIGHLIGHT_COLOR
                    );

            }


            // ------------------------------------------------
            // 保存操作后的选区
            // ------------------------------------------------

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


            // ------------------------------------------------
            // 更新按钮状态
            // ------------------------------------------------

            updateHighlightButton();


            // ------------------------------------------------
            // 自动保存
            // ------------------------------------------------

            if(changed){

                noteHasChanges = true;

                scheduleNoteAutoSave();

            }

        }
    );


    // ========================================================
    // 判断当前选区 / 光标位置是否为黄色高亮
    // ========================================================

    function isSelectionYellow(
        range,
        editor
    ){

        // ====================================================
        // 情况一：
        // 光标没有选择文字，只是停在某个文字里面
        // ====================================================

        if(range.collapsed){

            let node =
                range.startContainer;


            if(
                node.nodeType ===
                Node.TEXT_NODE
            ){

                node =
                    node.parentElement;

            }


            while(
                node &&
                node !== editor
            ){

                if(
                    node.nodeType ===
                    Node.ELEMENT_NODE
                ){

                    const background =
                        getComputedStyle(node)
                        .backgroundColor
                        .replace(/\s/g,"")
                        .toLowerCase();


                    if(
                        background ===
                        "rgb(255,245,157)"
                    ){

                        return true;

                    }


                    if(
                        background ===
                        "#fff59d"
                    ){

                        return true;

                    }

                }


                node =
                    node.parentElement;

            }


            return false;

        }


        // ====================================================
        // 情况二：
        // 选择了一段文字
        //
        // 必须保证：
        // 选中的所有文字都是黄色
        // ====================================================

        const walker =
            document.createTreeWalker(
                editor,
                NodeFilter.SHOW_TEXT,
                null
            );


        let node;

        let hasText = false;

        let allYellow = true;


        while(
            node = walker.nextNode()
        ){

            if(!node.nodeValue)
                continue;


            let intersects = false;


            try{

                intersects =
                    range.intersectsNode(
                        node
                    );

            }catch(e){

                intersects = false;

            }


            if(!intersects)
                continue;


            // ------------------------------------------------
            // 计算这个文字节点真正被选中的部分
            // ------------------------------------------------

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


            if(start >= end)
                continue;


            const selectedText =
                node.nodeValue.substring(
                    start,
                    end
                );


            // 忽略纯空格、换行
            if(!selectedText.trim())
                continue;


            hasText = true;


            // ------------------------------------------------
            // 检查文字所在元素
            // ------------------------------------------------

            let element =
                node.parentElement;

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

                allYellow = false;

            }

        }


        return (
            hasText &&
            allYellow
        );

    }


    // ========================================================
    // 更新高亮按钮状态
    // ========================================================

    function updateHighlightButton(){

        const editor =
            getNoteEditor();


        if(!editor){

            bgColorButton
                .classList
                .remove("active");

            return;

        }


        const selection =
            window.getSelection();


        if(
            !selection ||
            !selection.rangeCount
        ){

            bgColorButton
                .classList
                .remove("active");

            return;

        }


        const range =
            selection.getRangeAt(0);


        // ------------------------------------------------
        // 当前光标/选区不在笔记编辑器里面
        // ------------------------------------------------

        if(
            !editor.contains(
                range.commonAncestorContainer
            )
        ){

            bgColorButton
                .classList
                .remove("active");

            return;

        }


        // ------------------------------------------------
        // 判断当前状态
        // ------------------------------------------------

        const active =
            isSelectionYellow(
                range,
                editor
            );


        bgColorButton
            .classList
            .toggle(
                "active",
                active
            );

    }


    // ========================================================
    // 浏览器选区发生变化
    // ========================================================

    document.addEventListener(
        "selectionchange",
        function(){

            updateHighlightButton();

        }
    );


    // ========================================================
    // 鼠标选择完成
    // ========================================================

    const noteEditor =
        getNoteEditor();


    if(noteEditor){

        noteEditor.addEventListener(
            "mouseup",
            function(){

                updateHighlightButton();

            }
        );


        // ====================================================
        // 键盘移动光标
        // ====================================================

        noteEditor.addEventListener(
            "keyup",
            function(){

                updateHighlightButton();

            }
        );


        // ====================================================
        // iPhone / iPad 触摸选择
        // ====================================================

        noteEditor.addEventListener(
            "touchend",
            function(){

                setTimeout(
                    updateHighlightButton,
                    50
                );

            }
        );


        // ====================================================
        // 编辑器获得焦点
        // ====================================================

        noteEditor.addEventListener(
            "focus",
            function(){

                updateHighlightButton();

            }
        );

    }


    // ========================================================
    // 初始化按钮状态
    // ========================================================

    updateHighlightButton();

}

