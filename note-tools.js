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
// ============================================================
// 笔记文字背景色 / 高亮
// 固定黄色 #fff59d
// 使用现有 contenteditable 格式系统
// 不修改 B / I / U
// ============================================================

if($("textBgColorBtn")){

    const bgColorButton =
        $("textBgColorBtn");

    const HIGHLIGHT_COLOR =
        "#fff59d";


    // ========================================================
    // 保存高亮按钮点击前的选区
    // ========================================================

    bgColorButton.addEventListener(
        "mousedown",
        function(e){

            /*
             * 非常重要：
             * 防止按钮抢走编辑器选区。
             */
            e.preventDefault();


            saveNoteSelection();

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


            /*
             * 恢复用户之前选中的文字。
             */
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


            /*
             * 必须是编辑器里面的选区。
             */
            if(
                !editor.contains(
                    range.commonAncestorContainer
                )
            ){

                return;

            }


            /*
             * 没有选中文字就不处理。
             */
            if(range.collapsed){

                return;

            }


            /*
             * 没有真正文字就不处理。
             */
            if(
                !range.toString()
            ){

                return;

            }


            // ==================================================
            // 判断当前选区是否已经是黄色
            // ==================================================

            const alreadyYellow =
                isSelectionYellow(
                    range,
                    editor
                );


            let changed = false;


            // ==================================================
            // 已经黄色
            // → 取消黄色
            // ==================================================

            if(alreadyYellow){

                document.execCommand(
                    "styleWithCSS",
                    false,
                    true
                );


                changed =
                    document.execCommand(
                        "backColor",
                        false,
                        "transparent"
                    );

            }


            // ==================================================
            // 没有黄色
            // → 增加黄色
            // ==================================================

            else{

                document.execCommand(
                    "styleWithCSS",
                    false,
                    true
                );


                changed =
                    document.execCommand(
                        "backColor",
                        false,
                        HIGHLIGHT_COLOR
                    );

            }


            /*
             * 保持选区。
             */
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


            /*
             * 更新按钮状态。
             */
            updateHighlightButton();


            /*
             * 标记笔记修改。
             */
            if(changed){

                noteHasChanges =
                    true;


                scheduleNoteAutoSave();

            }

        }
    );


    // ========================================================
    // 判断当前选区是不是黄色背景
    // ========================================================

    function isSelectionYellow(
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


            /*
             * 只检查真正选中的文字。
             */
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


            if(!selectedText.trim())
                continue;


            hasText = true;


            /*
             * 找到文字所在元素。
             */
            let element =
                node.parentElement;


            let yellow = false;


            while(
                element &&
                element !== editor
            ){

                const background =
                    element.style
                        ?.backgroundColor
                        ?.replace(
                            /\s/g,
                            ""
                        )
                        .toLowerCase();


                if(
                    background ===
                    "#fff59d"
                ){

                    yellow = true;

                    break;

                }


                if(
                    background ===
                    "rgb(255,245,157)"
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


        if(
            !range.collapsed &&
            isSelectionYellow(
                range,
                editor
            )
        ){

            bgColorButton
                .classList
                .add("active");

        }

        else{

            bgColorButton
                .classList
                .remove("active");

        }

    }


    // ========================================================
    // 选区改变时同步按钮
    // ========================================================

    document.addEventListener(
        "selectionchange",
        function(){

            const editor =
                getNoteEditor();


            if(!editor)
                return;


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


            if(
                editor.contains(
                    range.commonAncestorContainer
                )
            ){

                updateHighlightButton();

            }

        }
    );

}
