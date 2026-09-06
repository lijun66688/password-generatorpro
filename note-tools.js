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
// ===========================================
// ============================================================
// 笔记文字背景色 / 高亮
// 固定黄色：#fff59d
// 不修改 B / I / U
// ============================================================

if($("textBgColorBtn")){

    const bgColorButton = $("textBgColorBtn");
    const HIGHLIGHT_COLOR = "#fff59d";


    // ========================================================
    // 判断是不是我们的高亮
    // ========================================================

    function isHighlightElement(element){

        if(
            !element ||
            element.nodeType !== Node.ELEMENT_NODE
        ){
            return false;
        }

        return (
            element.tagName === "MARK" &&
            element.dataset.noteHighlight === "true"
        );

    }


    // ========================================================
    // 判断文字节点是否在高亮中
    // ========================================================

    function getHighlightParent(node){

        let element =
            node && node.nodeType === Node.TEXT_NODE
                ? node.parentElement
                : node;

        while(element){

            if(isHighlightElement(element)){
                return element;
            }

            if(element.id === "noteEditor"){
                break;
            }

            element = element.parentElement;

        }

        return null;

    }


    // ========================================================
    // 获取选区中的文字节点
    // ========================================================

    function getSelectedTextNodes(range, editor){

        const result = [];

        if(!range || !editor){
            return result;
        }

        const walker =
            document.createTreeWalker(
                editor,
                NodeFilter.SHOW_TEXT,
                null
            );

        let node;

        while(node = walker.nextNode()){

            if(!node.nodeValue){
                continue;
            }

            try{

                if(range.intersectsNode(node)){

                    result.push(node);

                }

            }catch(e){

                // 忽略无效节点

            }

        }

        return result;

    }


    // ========================================================
    // 判断当前选区有没有真正的文字
    // ========================================================

    function selectionHasText(range){

        if(!range || range.collapsed){
            return false;
        }

        const text =
            range.toString();

        return text.length > 0;

    }


    // ========================================================
    // 给一个文字节点增加高亮
    // ========================================================

    function wrapTextNode(node){

        if(
            !node ||
            node.nodeType !== Node.TEXT_NODE ||
            !node.nodeValue
        ){
            return false;
        }

        // 已经高亮，不重复处理
        if(getHighlightParent(node)){
            return false;
        }

        const mark =
            document.createElement("mark");

        mark.dataset.noteHighlight = "true";

        mark.style.backgroundColor =
            HIGHLIGHT_COLOR;

        mark.style.color =
            "inherit";

        mark.style.padding =
            "0";

        mark.style.borderRadius =
            "2px";


        node.parentNode.insertBefore(
            mark,
            node
        );

        mark.appendChild(node);

        return true;

    }


    // ========================================================
    // 把一个高亮节点拆开
    // 只移除指定文字
    // ========================================================

    function removeHighlightFromTextNode(
        node,
        start,
        end
    ){

        if(
            !node ||
            node.nodeType !== Node.TEXT_NODE
        ){
            return false;
        }

        const mark =
            getHighlightParent(node);

        if(!mark){
            return false;
        }


        const length =
            node.nodeValue.length;


        start =
            Math.max(
                0,
                Math.min(start, length)
            );

        end =
            Math.max(
                0,
                Math.min(end, length)
            );


        if(start >= end){
            return false;
        }


        // ====================================================
        // 先从后面切
        // ====================================================

        let selectedNode = node;

        let afterNode = null;


        if(end < selectedNode.nodeValue.length){

            afterNode =
                selectedNode.splitText(end);

        }


        // ====================================================
        // 再从前面切
        // ====================================================

        if(start > 0){

            selectedNode =
                selectedNode.splitText(start);

        }


        // ====================================================
        // selectedNode 就是需要取消高亮的文字
        // ====================================================

        const parent =
            mark.parentNode;


        if(!parent){
            return false;
        }


        parent.insertBefore(
            selectedNode,
            mark
        );


        // ====================================================
        // 如果 mark 已经没有文字
        // ====================================================

        if(!mark.textContent){

            mark.remove();

        }


        return true;

    }


    // ========================================================
    // 合并相邻高亮
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

            let next =
                mark.nextSibling;


            // 删除空文字节点
            while(
                next &&
                next.nodeType === Node.TEXT_NODE &&
                next.nodeValue === ""
            ){

                const empty =
                    next;

                next =
                    next.nextSibling;

                empty.remove();

            }


            // ==================================================
            // 两个相邻 mark 合并
            // ==================================================

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
    // 添加高亮
    // ========================================================

    function applyHighlight(range, editor){

        const nodes =
            getSelectedTextNodes(
                range,
                editor
            );

        if(!nodes.length){
            return false;
        }


        let changed = false;


        /*
         * 非常重要：
         *
         * 从后往前处理文字节点。
         *
         * 这样 splitText() 不会影响
         * 前面节点的 Range。
         */

        for(
            let i = nodes.length - 1;
            i >= 0;
            i--
        ){

            const originalNode =
                nodes[i];


            if(
                !originalNode.parentNode ||
                !editor.contains(originalNode)
            ){
                continue;
            }


            let start = 0;
            let end =
                originalNode.nodeValue.length;


            // ==================================================
            // 当前文字节点的选区开始位置
            // ==================================================

            if(
                originalNode ===
                range.startContainer
            ){

                start =
                    range.startOffset;

            }


            // ==================================================
            // 当前文字节点的选区结束位置
            // ==================================================

            if(
                originalNode ===
                range.endContainer
            ){

                end =
                    range.endOffset;

            }


            if(start >= end){
                continue;
            }


            let targetNode =
                originalNode;


            // ==================================================
            // 从后面切
            // ==================================================

            if(
                end <
                targetNode.nodeValue.length
            ){

                targetNode =
                    targetNode.splitText(end);

                /*
                 * splitText(end) 后，
                 * targetNode 是前半段。
                 */

            }


            // ==================================================
            // 从前面切
            // ==================================================

            if(start > 0){

                targetNode =
                    targetNode.splitText(start);

            }


            // ==================================================
            // 如果这一段还没有高亮
            // ==================================================

            if(
                !getHighlightParent(
                    targetNode
                )
            ){

                if(
                    wrapTextNode(
                        targetNode
                    )
                ){

                    changed = true;

                }

            }

        }


        mergeHighlightElements(editor);

        return changed;

    }


    // ========================================================
    // 取消高亮
    // ========================================================

    function removeHighlight(range, editor){

        const nodes =
            getSelectedTextNodes(
                range,
                editor
            );

        if(!nodes.length){
            return false;
        }


        let changed = false;


        /*
         * 同样从后往前处理。
         */

        for(
            let i = nodes.length - 1;
            i >= 0;
            i--
        ){

            const originalNode =
                nodes[i];


            if(
                !originalNode.parentNode ||
                !editor.contains(originalNode)
            ){
                continue;
            }


            if(
                !getHighlightParent(
                    originalNode
                )
            ){
                continue;
            }


            let start = 0;

            let end =
                originalNode.nodeValue.length;


            if(
                originalNode ===
                range.startContainer
            ){

                start =
                    range.startOffset;

            }


            if(
                originalNode ===
                range.endContainer
            ){

                end =
                    range.endOffset;

            }


            if(start >= end){
                continue;
            }


            if(
                removeHighlightFromTextNode(
                    originalNode,
                    start,
                    end
                )
            ){

                changed = true;

            }

        }


        mergeHighlightElements(editor);

        return changed;

    }


    // ========================================================
    // 当前选区是否全部已经高亮
    // ========================================================

    function selectionFullyHighlighted(
        range,
        editor
    ){

        if(!range){
            return false;
        }


        if(range.collapsed){

            let node =
                range.startContainer;


            if(
                node.nodeType === Node.TEXT_NODE
            ){

                return !!getHighlightParent(node);

            }


            return false;

        }


        const nodes =
            getSelectedTextNodes(
                range,
                editor
            );


        let hasRealText = false;


        for(const node of nodes){

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


            const selectedText =
                node.nodeValue.substring(
                    start,
                    end
                );


            if(!selectedText.trim()){
                continue;
            }


            hasRealText = true;


            if(
                !getHighlightParent(node)
            ){

                return false;

            }

        }


        return hasRealText;

    }


    // ========================================================
    // 更新按钮 active
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
            selectionFullyHighlighted(
                range,
                editor
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
    // 点击按钮之前保存选区
    // ========================================================

    bgColorButton.addEventListener(
        "mousedown",
        function(e){

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
        function(){

            const editor =
                $("noteEditor");


            if(
                !editor ||
                !bgColorButton._savedRange
            ){
                return;
            }


            const range =
                bgColorButton._savedRange;


            if(!selectionHasText(range)){

                bgColorButton._savedRange =
                    null;

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
                range
            );


            // ==================================================
            // 如果整段已经高亮
            // → 取消
            //
            // 否则
            // → 增加黄色高亮
            // ==================================================

            const alreadyHighlighted =
                selectionFullyHighlighted(
                    range,
                    editor
                );


            let changed = false;


            if(alreadyHighlighted){

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
            // 更新按钮
            // ==================================================

            updateHighlightButton();


            // ==================================================
            // 修改状态
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


            bgColorButton._savedRange =
                null;

        }
    );


    // ========================================================
    // 选区改变
    // ========================================================

    document.addEventListener(
        "selectionchange",
        function(){

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