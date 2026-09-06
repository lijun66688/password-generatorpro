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

if($("textBgColorBtn")){

    const bgColorButton = $("textBgColorBtn");
    const HIGHLIGHT_COLOR = "#fff59d";


    // ========================================================
    // 判断一个节点是否属于高亮
    // ========================================================

    function isHighlightElement(element){

        if(!element || element.nodeType !== Node.ELEMENT_NODE){
            return false;
        }

        return (
            element.tagName === "MARK" &&
            element.dataset.noteHighlight === "true"
        );

    }


    // ========================================================
    // 判断文字节点是否处于高亮中
    // ========================================================

    function isTextNodeHighlighted(textNode){

        if(!textNode){
            return false;
        }

        let element = textNode.parentElement;

        while(element){

            if(isHighlightElement(element)){
                return true;
            }

            if(element.id === "noteEditor"){
                break;
            }

            element = element.parentElement;

        }

        return false;

    }


    // ========================================================
    // 获取当前选区中的所有文字节点
    // ========================================================

    function getSelectedTextNodes(range){

        const nodes = [];

        if(!range){
            return nodes;
        }

        const root =
            range.commonAncestorContainer;

        const walker =
            document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode(node){

                        if(!node.nodeValue){
                            return NodeFilter.FILTER_REJECT;
                        }

                        try{

                            if(range.intersectsNode(node)){
                                return NodeFilter.FILTER_ACCEPT;
                            }

                        }catch(e){

                            return NodeFilter.FILTER_REJECT;

                        }

                        return NodeFilter.FILTER_REJECT;

                    }
                }
            );


        let node;

        while(node = walker.nextNode()){

            nodes.push(node);

        }


        // 如果 commonAncestorContainer 本身就是文字节点
        if(
            root.nodeType === Node.TEXT_NODE &&
            range.intersectsNode(root)
        ){

            if(!nodes.includes(root)){
                nodes.unshift(root);
            }

        }

        return nodes;

    }


    // ========================================================
    // 创建黄色高亮
    // ========================================================

    function applyHighlight(range, editor){

        const textNodes =
            getSelectedTextNodes(range);

        if(!textNodes.length){
            return false;
        }


        textNodes.forEach(textNode => {

            let start = 0;
            let end = textNode.nodeValue.length;


            // 计算选区在当前文字节点中的实际范围
            if(textNode === range.startContainer){

                start = range.startOffset;

            }

            if(textNode === range.endContainer){

                end = range.endOffset;

            }


            if(start >= end){
                return;
            }


            // ==================================================
            // 把需要高亮的文字切出来
            // ==================================================

            let targetNode = textNode;


            if(start > 0){

                targetNode =
                    textNode.splitText(start);

            }


            if(end - start < targetNode.nodeValue.length){

                targetNode.splitText(end - start);

            }


            // 已经是高亮就不重复包裹
            if(isTextNodeHighlighted(targetNode)){
                return;
            }


            const mark =
                document.createElement("mark");

            mark.dataset.noteHighlight = "true";

            mark.style.backgroundColor =
                HIGHLIGHT_COLOR;

            mark.style.color = "inherit";


            targetNode.parentNode.insertBefore(
                mark,
                targetNode
            );

            mark.appendChild(targetNode);

        });


        mergeHighlightElements(editor);

        return true;

    }


    // ========================================================
    // 取消黄色高亮
    // 只取消选择区域
    // 不影响 B / I / U
    // ========================================================

    function removeHighlight(range, editor){

        const textNodes =
            getSelectedTextNodes(range);

        if(!textNodes.length){
            return false;
        }


        let changed = false;


        textNodes.forEach(textNode => {

            if(!isTextNodeHighlighted(textNode)){
                return;
            }


            let start = 0;
            let end = textNode.nodeValue.length;


            if(textNode === range.startContainer){

                start = range.startOffset;

            }


            if(textNode === range.endContainer){

                end = range.endOffset;

            }


            if(start >= end){
                return;
            }


            let targetNode = textNode;


            // ==================================================
            // 切出选中的部分
            // ==================================================

            if(start > 0){

                targetNode =
                    textNode.splitText(start);

            }


            if(
                end - start <
                targetNode.nodeValue.length
            ){

                targetNode.splitText(
                    end - start
                );

            }


            const mark =
                targetNode.parentElement;


            if(!isHighlightElement(mark)){
                return;
            }


            // ==================================================
            // 把文字从 mark 中拿出来
            // 保留其他格式
            // ==================================================

            const parent =
                mark.parentNode;

            parent.insertBefore(
                targetNode,
                mark
            );


            // 如果 mark 已经空了
            if(!mark.textContent){

                mark.remove();

            }


            // 如果 mark 中没有剩余文字
            else if(!mark.textContent.trim()){

                mark.remove();

            }


            changed = true;

        });


        mergeHighlightElements(editor);

        return changed;

    }


    // ========================================================
    // 合并相邻黄色高亮
    // ========================================================

    function mergeHighlightElements(editor){

        if(!editor){
            return;
        }


        const marks =
            Array.from(
                editor.querySelectorAll(
                    'mark[data-note-highlight="true"]'
                )
            );


        marks.forEach(mark => {

            let next = mark.nextSibling;


            while(
                next &&
                next.nodeType === Node.TEXT_NODE &&
                !next.nodeValue
            ){

                const emptyNode = next;

                next = next.nextSibling;

                emptyNode.remove();

            }


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

            }

        });

    }


    // ========================================================
    // 检查当前选区是否包含高亮
    // ========================================================

    function selectionHasHighlight(range){

        if(!range){
            return false;
        }


        const textNodes =
            getSelectedTextNodes(range);


        for(const node of textNodes){

            if(isTextNodeHighlighted(node)){
                return true;
            }

        }


        return false;

    }


    // ========================================================
    // 更新 🅃 按钮 active 状态
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


        if(selectionHasHighlight(range)){

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
    // 点击按钮之前保存选区
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
            // 恢复原来的文字选区
            // ==================================================

            editor.focus();


            const selection =
                window.getSelection();


            selection.removeAllRanges();


            selection.addRange(
                bgColorButton._savedRange
            );


            const range =
                bgColorButton._savedRange;


            if(range.collapsed){

                return;

            }


            // ==================================================
            // 如果选区中已经存在高亮
            // → 取消高亮
            //
            // 如果完全没有高亮
            // → 增加高亮
            // ==================================================

            const hasHighlight =
                selectionHasHighlight(range);


            let changed = false;


            if(hasHighlight){

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

        }
    );


    // ========================================================
    // 光标 / 选区改变时同步按钮状态
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
