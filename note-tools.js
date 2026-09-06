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
// ============================================================
// 笔记文字背景色 / 高亮
// 固定黄色 #fff59d
// ============================================================

if($("textBgColorBtn")){

    const bgBtn = $("textBgColorBtn");
    const editor = $("noteEditor");

    const HIGHLIGHT = "#fff59d";


    // ========================================================
    // 设置按钮状态
    // ========================================================

    function setHighlightButton(active){

        if(active){

            bgBtn.classList.add("active");

            // 直接设置颜色，避免 CSS 状态没有刷新
            bgBtn.style.backgroundColor = HIGHLIGHT;
            bgBtn.style.color = "#333";
            bgBtn.style.boxShadow =
                "0 0 0 2px #facc15, 0 2px 5px rgba(0,0,0,.12)";

        }else{

            bgBtn.classList.remove("active");

            bgBtn.style.backgroundColor = "";
            bgBtn.style.color = "";
            bgBtn.style.boxShadow = "";

        }

    }


    // ========================================================
    // 判断一个元素是不是黄色高亮
    // ========================================================

    function elementIsHighlighted(element){

        if(!element)
            return false;


        while(
            element &&
            element !== editor
        ){

            if(element.nodeType === Node.ELEMENT_NODE){

                const style =
                    getComputedStyle(element);

                const bg =
                    style.backgroundColor
                    .replace(/\s/g,"")
                    .toLowerCase();


                if(
                    bg === "rgb(255,245,157)" ||
                    bg === "#fff59d"
                ){

                    return true;

                }

            }

            element =
                element.parentElement;

        }


        return false;

    }


    // ========================================================
    // 获取当前光标所在位置的高亮状态
    // ========================================================

    function getCaretHighlight(){

        const selection =
            window.getSelection();


        if(
            !selection ||
            !selection.rangeCount
        ){

            return false;

        }


        const range =
            selection.getRangeAt(0);


        if(
            !editor.contains(
                range.commonAncestorContainer
            )
        ){

            return false;

        }


        let node =
            range.startContainer;


        if(
            node.nodeType ===
            Node.TEXT_NODE
        ){

            node =
                node.parentElement;

        }


        return elementIsHighlighted(node);

    }


    // ========================================================
    // 获取当前选中文字的高亮状态
    // 必须全部是黄色才算 active
    // ========================================================

    function getSelectionHighlight(){

        const selection =
            window.getSelection();


        if(
            !selection ||
            !selection.rangeCount
        ){

            return false;

        }


        const range =
            selection.getRangeAt(0);


        if(
            range.collapsed
        ){

            return getCaretHighlight();

        }


        if(
            !editor.contains(
                range.commonAncestorContainer
            )
        ){

            return false;

        }


        const walker =
            document.createTreeWalker(
                editor,
                NodeFilter.SHOW_TEXT,
                null
            );


        let node;

        let foundText = false;

        let allYellow = true;


        while(
            node = walker.nextNode()
        ){

            if(!node.nodeValue)
                continue;


            let intersects = false;


            try{

                intersects =
                    range.intersectsNode(node);

            }catch(e){

                continue;

            }


            if(!intersects)
                continue;


            let start = 0;
            let end = node.nodeValue.length;


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


            const text =
                node.nodeValue.substring(
                    start,
                    end
                );


            if(!text.trim())
                continue;


            foundText = true;


            if(
                !elementIsHighlighted(
                    node.parentElement
                )
            ){

                allYellow = false;

                break;

            }

        }


        return (
            foundText &&
            allYellow
        );

    }


    // ========================================================
    // 同步按钮状态
    // ========================================================

    function refreshHighlightButton(){

        if(!editor){

            setHighlightButton(false);

            return;

        }


        const active =
            getSelectionHighlight();


        setHighlightButton(active);

    }


    // ========================================================
    // 点击按钮前保存选区
    // ========================================================

    bgBtn.addEventListener(
        "mousedown",
        function(e){

            e.preventDefault();

            saveNoteSelection();

        }
    );


    // ========================================================
    // 点击高亮按钮
    // ========================================================

    bgBtn.addEventListener(
        "click",
        function(){

            if(!editor)
                return;


            // 恢复选区
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


            if(
                !editor.contains(
                    range.commonAncestorContainer
                )
            ){

                return;

            }


            // 没有选中文字
            if(range.collapsed){

                refreshHighlightButton();

                return;

            }


            if(!range.toString()){

                refreshHighlightButton();

                return;

            }


            // ------------------------------------------------
            // 点击前先判断当前是不是全部高亮
            // ------------------------------------------------

            const wasHighlighted =
                getSelectionHighlight();


            editor.focus();


            try{

                document.execCommand(
                    "styleWithCSS",
                    false,
                    true
                );

            }catch(e){}


            // ------------------------------------------------
            // 黄色 → 取消
            // ------------------------------------------------

            if(wasHighlighted){

                document.execCommand(
                    "backColor",
                    false,
                    "transparent"
                );

            }

            // ------------------------------------------------
            // 普通 → 黄色
            // ------------------------------------------------

            else{

                document.execCommand(
                    "backColor",
                    false,
                    HIGHLIGHT
                );

            }


            // 保存操作后的选区
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
            // 关键：
            // 不等 selectionchange
            // 直接根据操作结果更新按钮
            // ------------------------------------------------

            setTimeout(
                function(){

                    refreshHighlightButton();

                },
                0
            );


            // 自动保存
            noteHasChanges = true;

            scheduleNoteAutoSave();

        }
    );


    // ========================================================
    // 浏览器选区变化
    // ========================================================

    document.addEventListener(
        "selectionchange",
        function(){

            refreshHighlightButton();

        }
    );


    // ========================================================
    // iPhone 触摸选择
    // ========================================================

    editor.addEventListener(
        "touchend",
        function(){

            setTimeout(
                refreshHighlightButton,
                100
            );

        }
    );


    // ========================================================
    // 鼠标选择
    // ========================================================

    editor.addEventListener(
        "mouseup",
        function(){

            refreshHighlightButton();

        }
    );


    // ========================================================
    // 键盘移动光标
    // ========================================================

    editor.addEventListener(
        "keyup",
        function(){

            refreshHighlightButton();

        }
    );


    // ========================================================
    // 初始化
    // ========================================================

    refreshHighlightButton();

}