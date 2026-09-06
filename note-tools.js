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
// 笔记文字背景色 / 高亮
// Word 风格：任意选区增加 / 取消黄色高亮
// 不影响 B / I / U
// ============================================================

if($("textBgColorBtn")){

    const bgColorButton = $("textBgColorBtn");

    // 固定黄色
    const HIGHLIGHT_COLOR = "#fff59d";


    // ========================================================
    // 判断是不是我们的高亮元素
    // ========================================================

    function isHighlightElement(element){

        return !!(
            element &&
            element.nodeType === Node.ELEMENT_NODE &&
            element.matches &&
            element.matches(
                'span[data-note-highlight="true"]'
            )
        );

    }


    // ========================================================
    // 判断文字节点是否在高亮里面
    // ========================================================

    function isTextHighlighted(textNode){

        if(!textNode){
            return false;
        }

        let element =
            textNode.nodeType === Node.TEXT_NODE
                ? textNode.parentElement
                : textNode;


        while(element){

            if(isHighlightElement(element)){
                return true;
            }

            if(element.id === "noteEditor"){
                break;
            }

            element =
                element.parentElement;

        }

        return false;

    }


    // ========================================================
    // 获取 Range 里面所有文字节点
    // ========================================================

    function getTextNodesInRange(range){

        const nodes = [];

        if(!range){
            return nodes;
        }


        const editor =
            $("noteEditor");

        if(!editor){
            return nodes;
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

                if(range.intersectsNode(node)){

                    nodes.push(node);

                }

            }catch(error){

                // 某些 Safari 情况下忽略该节点
            }

        }


        return nodes;

    }


    // ========================================================
    // 判断当前选区是否全部都是黄色高亮
    // ========================================================

    function isEntireSelectionHighlighted(range){

        const textNodes =
            getTextNodesInRange(range);


        if(!textNodes.length){
            return false;
        }


        let hasRealText = false;


        for(const node of textNodes){

            let start = 0;
            let end =
                node.nodeValue.length;


            if(node === range.startContainer){

                start =
                    range.startOffset;

            }


            if(node === range.endContainer){

                end =
                    range.endOffset;

            }


            const selectedText =
                node.nodeValue.substring(
                    start,
                    end
                );


            // 忽略纯空白
            if(selectedText.trim()){

                hasRealText = true;


                if(!isTextHighlighted(node)){

                    return false;

                }

            }

        }


        return hasRealText;

    }


    // ========================================================
    // 取消 fragment 中所有我们的高亮标签
    //
    // 注意：
    // 这里只删除高亮 span，
    // 不删除 B / I / U
    // ========================================================

    function unwrapHighlights(fragment){

        const marks =
            Array.from(
                fragment.querySelectorAll(
                    'span[data-note-highlight="true"]'
                )
            );


        marks.forEach(mark => {

            const parent =
                mark.parentNode;

            if(!parent){
                return;
            }


            while(mark.firstChild){

                parent.insertBefore(
                    mark.firstChild,
                    mark
                );

            }


            mark.remove();

        });

    }


    // ========================================================
    // 清理空的高亮标签
    // ========================================================

    function removeEmptyHighlights(editor){

        const marks =
            Array.from(
                editor.querySelectorAll(
                    'span[data-note-highlight="true"]'
                )
            );


        marks.forEach(mark => {

            if(!mark.textContent){

                mark.remove();

            }

        });

    }


    // ========================================================
    // 合并相邻高亮
    // ========================================================

    function mergeAdjacentHighlights(editor){

        if(!editor){
            return;
        }


        let changed = true;


        while(changed){

            changed = false;


            const marks =
                Array.from(
                    editor.querySelectorAll(
                        'span[data-note-highlight="true"]'
                    )
                );


            for(const mark of marks){

                const next =
                    mark.nextSibling;


                if(
                    next &&
                    next.nodeType === Node.ELEMENT_NODE &&
                    isHighlightElement(next)
                ){

                    while(next.firstChild){

                        mark.appendChild(
                            next.firstChild
                        );

                    }


                    next.remove();

                    changed = true;

                    break;

                }

            }

        }

    }


    // ========================================================
    // 给当前 Range 增加黄色高亮
    //
    // 使用 extractContents：
    // 可以正确处理跨段落、跨 B/I/U 的选择
    // ========================================================

    function applyHighlight(range, editor){

        const fragment =
            range.extractContents();


        if(!fragment.textContent){

            // 没有文字，恢复内容
            range.insertNode(fragment);

            return false;

        }


        // 如果原来的选择里面已经有高亮，
        // 先解除旧的高亮，避免产生高亮套高亮
        unwrapHighlights(fragment);


        const highlight =
            document.createElement("span");


        highlight.setAttribute(
            "data-note-highlight",
            "true"
        );


        highlight.style.backgroundColor =
            HIGHLIGHT_COLOR;


        highlight.style.color =
            "inherit";


        highlight.appendChild(
            fragment
        );


        range.insertNode(
            highlight
        );


        // ====================================================
        // 恢复选择区域
        // ====================================================

        const newRange =
            document.createRange();


        newRange.selectNodeContents(
            highlight
        );


        const selection =
            window.getSelection();


        selection.removeAllRanges();

        selection.addRange(
            newRange
        );


        mergeAdjacentHighlights(editor);


        return true;

    }


    // ========================================================
    // 取消当前 Range 的黄色高亮
    //
    // 只取消当前选中的部分
    // 不影响 B / I / U
    // ========================================================

    function removeHighlight(range, editor){

        const fragment =
            range.extractContents();


        if(!fragment.textContent){

            range.insertNode(fragment);

            return false;

        }


        // ====================================================
        // 只移除高亮 span
        // B / I / U 等其他标签全部保留
        // ====================================================

        unwrapHighlights(fragment);


        range.insertNode(
            fragment
        );


        // ====================================================
        // 清理空标签
        // ====================================================

        removeEmptyHighlights(editor);


        mergeAdjacentHighlights(editor);


        return true;

    }


    // ========================================================
    // 保存按钮点击之前的选区
    // ========================================================

    bgColorButton.addEventListener(
        "mousedown",
        e => {

            e.preventDefault();


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

                return;

            }


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
    );


    // ========================================================
    // 点击高亮按钮
    // ========================================================

    bgColorButton.addEventListener(
        "click",
        () => {

            const editor =
                $("noteEditor");


            if(
                !editor ||
                !bgColorButton._savedRange
            ){

                return;

            }


            // ==================================================
            // 恢复原来的选区
            // ==================================================

            editor.focus();


            const selection =
                window.getSelection();


            selection.removeAllRanges();


            selection.addRange(
                bgColorButton._savedRange
            );


            const range =
                selection.getRangeAt(0);


            // 没有选择文字
            if(range.collapsed){

                return;

            }


            // ==================================================
            // 如果整个选择区域都是黄色
            // → 取消黄色
            //
            // 否则
            // → 整个选择区域增加黄色
            // ==================================================

            const allHighlighted =
                isEntireSelectionHighlighted(
                    range
                );


            let changed = false;


            if(allHighlighted){

                changed =
                    removeHighlight(
                        range,
                        editor
                    );

            }else{

                changed =
                    applyHighlight(
                        range,
                        editor
                    );

            }


            // ==================================================
            // 更新按钮状态
            // ==================================================

            updateHighlightButton();


            // ==================================================
            // 标记笔记已经修改
            // ==================================================

            if(
                changed &&
                typeof noteHasChanges !== "undefined"
            ){

                noteHasChanges = true;

            }


            // ==================================================
            // 自动保存
            // ==================================================

            if(
                changed &&
                typeof scheduleNoteAutoSave === "function"
            ){

                scheduleNoteAutoSave();

            }


            // ==================================================
            // 清除旧 Range
            // ==================================================

            bgColorButton._savedRange =
                null;

        }
    );


    // ========================================================
    // 根据当前光标 / 选区更新按钮状态
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


        // 光标没有选择文字：
        // 判断光标所在文字是否高亮
        if(range.collapsed){

            let node =
                range.startContainer;


            if(
                node.nodeType === Node.TEXT_NODE
            ){

                if(isTextHighlighted(node)){

                    bgColorButton.classList.add(
                        "active"
                    );

                }else{

                    bgColorButton.classList.remove(
                        "active"
                    );

                }

            }else{

                const element =
                    node.nodeType === Node.ELEMENT_NODE
                        ? node
                        : node.parentElement;


                if(
                    element &&
                    (
                        isHighlightElement(element) ||
                        element.closest(
                            'span[data-note-highlight="true"]'
                        )
                    )
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


            return;

        }


        // 有选择文字：
        // 只有全部是黄色时才显示 active
        if(
            isEntireSelectionHighlighted(
                range
            )
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
    // 监听选区变化
    // ========================================================

    document.addEventListener(
        "selectionchange",
        () => {

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
                editor.contains(
                    range.commonAncestorContainer
                )
            ){

                updateHighlightButton();

            }

        }
    );

}
