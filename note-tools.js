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
// 笔记文字背景色 / 高亮
// Word 风格：任意选区增加 / 取消黄色高亮
// 不影响 B / I / U
// ============================================================
// ============================================================
// ============================================================
// 笔记文字背景色 / 高亮
// 固定黄色
// 支持任意选区增加 / 取消
// 不影响 B / I / U
// ============================================================

if($("textBgColorBtn")){

    const bgColorButton = $("textBgColorBtn");

    // 默认黄色
    const HIGHLIGHT_COLOR = "#fff59d";


    // ========================================================
    // 保存当前选区
    // ========================================================

    bgColorButton.addEventListener("mousedown", e => {

        e.preventDefault();

        const editor = $("noteEditor");

        if(!editor) return;

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

                bgColorButton._savedRange =
                    range.cloneRange();

            }

        }

    });


    // ========================================================
    // 获取当前选区
    // ========================================================

    function restoreHighlightSelection(){

        const editor = $("noteEditor");

        if(
            !editor ||
            !bgColorButton._savedRange
        ){

            return null;

        }


        editor.focus();

        const selection =
            window.getSelection();


        selection.removeAllRanges();

        selection.addRange(
            bgColorButton._savedRange
        );


        return selection.getRangeAt(0);

    }


    // ========================================================
    // 判断当前选区是否存在黄色背景
    // ========================================================

    function selectionHasYellow(range){

        if(!range){
            return false;
        }


        const editor =
            $("noteEditor");

        if(!editor){
            return false;
        }


        const walker =
            document.createTreeWalker(
                editor,
                NodeFilter.SHOW_TEXT
            );


        let node;


        while(node = walker.nextNode()){

            if(!node.nodeValue){
                continue;
            }


            try{

                if(!range.intersectsNode(node)){
                    continue;
                }

            }catch(e){

                continue;

            }


            let element =
                node.parentElement;


            while(
                element &&
                element !== editor
            ){

                const bg =
                    window.getComputedStyle(
                        element
                    ).backgroundColor;


                if(
                    bg === "rgb(255, 245, 157)" ||
                    bg === "rgba(255, 245, 157, 1)"
                ){

                    return true;

                }


                element =
                    element.parentElement;

            }

        }


        return false;

    }


    // ========================================================
    // 点击高亮按钮
    // ========================================================

    bgColorButton.addEventListener("click", () => {

        const editor =
            $("noteEditor");


        if(!editor){
            return;
        }


        const range =
            restoreHighlightSelection();


        if(!range){
            return;
        }


        // 没有选择文字
        if(range.collapsed){

            return;

        }


        // ====================================================
        // 判断当前选区
        // ====================================================

        const hasYellow =
            selectionHasYellow(range);


        // ====================================================
        // 已经有黄色
        // → 取消黄色
        //
        // 没有黄色
        // → 增加黄色
        // ====================================================

        if(hasYellow){

            /*
             * transparent 只处理背景色，
             * 不使用 removeFormat，
             * 因此不会主动删除 B / I / U。
             */

            document.execCommand(
                "hiliteColor",
                false,
                "transparent"
            );


            bgColorButton.classList.remove(
                "active"
            );

        }else{

            document.execCommand(
                "hiliteColor",
                false,
                HIGHLIGHT_COLOR
            );


            bgColorButton.classList.add(
                "active"
            );

        }


        // ====================================================
        // 标记笔记已经修改
        // ====================================================

        if(
            typeof noteHasChanges !== "undefined"
        ){

            noteHasChanges = true;

        }


        // ====================================================
        // 自动保存
        // ====================================================

        if(
            typeof scheduleNoteAutoSave === "function"
        ){

            scheduleNoteAutoSave();

        }

    });


    // ========================================================
    // 根据光标 / 选区同步按钮状态
    // ========================================================

    function updateHighlightButton(){

        const editor =
            $("noteEditor");

        if(!editor){
            return;
        }


        const selection =
            window.getSelection();


        if(
            !selection ||
            !selection.rangeCount
        ){

            bgColorButton.classList.remove(
                "active"
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

            bgColorButton.classList.remove(
                "active"
            );

            return;

        }


        if(
            selectionHasYellow(range)
        ){

            bgColorButton.classList.add(
                "active"
            );

        }else{

            bgColorButton.classList.remove(
                "active"
            );

        }

    }


    // ========================================================
    // 监听光标 / 选区变化
    // ========================================================

    document.addEventListener(
        "selectionchange",
        () => {

            updateHighlightButton();

        }
    );

}