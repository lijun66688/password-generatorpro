// =====================================
// Secure Vault Pro v3.2
// Notes Manager
// GoodNotes Style Text Notebook
//
// Database:
// SecureVaultDB
//
// Store:
// notes
//
// 笔记内容：
// 加密保存
// =====================================


const NotesManager = (() => {

    const STORE = "notes";

    let notes = [];

    let notePassword = "";


    // =====================================
    // 设置笔记加密密码
    // =====================================

    function setPassword(password) {

        notePassword = password || "";

    }


    // =====================================
    // 加载全部笔记
    // =====================================

    async function loadNotes() {

        const data =
            await VaultDB.getAll(STORE) || [];

        notes = [];


        for (const item of data) {

            try {

                // 新格式：加密数据
                if (
                    item &&
                    item.data &&
                    notePassword
                ) {

                    const note =
                        await CryptoManager.decryptData(
                            item.data,
                            notePassword
                        );

                    if (note) {

                        notes.push(note);

                    }

                }

                // 兼容旧数据
                else if (
                    item &&
                    item.title
                ) {

                    notes.push(item);

                }

            }

            catch (e) {

                console.log(
                    "笔记解密失败:",
                    item?.id
                );

            }

        }


        sortNotes();

        return notes;

    }


    // =====================================
    // 笔记排序
    // =====================================

    function sortNotes() {

        notes.sort((a, b) => {

            if (
                Boolean(a.pinned) !==
                Boolean(b.pinned)
            ) {

                return b.pinned - a.pinned;

            }

            return b.id - a.id;

        });

    }


    // =====================================
    // 加密保存单条笔记
    // =====================================

    async function saveNote(note) {

        if (!notePassword) {

            console.warn(
                "没有笔记加密密码，无法保存"
            );

            return false;

        }


        const encrypted =
            await CryptoManager.encryptData(
                note,
                notePassword
            );


        await VaultDB.save(
            STORE,
            {
                id: note.id,
                data: encrypted
            }
        );


        return true;

    }


    // =====================================
    // 创建笔记
    // =====================================

    async function createNote(data = {}) {

        const now =
            new Date().toLocaleString();


        const note = {

            id: Date.now(),

            title:
                data.title ||
                "无标题",

            content:
                data.content ||
                "",

            category:
                data.category ||
                "其他",

            tags:
                Array.isArray(data.tags)
                    ? data.tags
                    : [],

            todo:
                Array.isArray(data.todo)
                    ? data.todo
                    : [],

            favorite:
                false,

            pinned:
                false,

            createTime:
                now,

            updateTime:
                now

        };


        notes.unshift(note);

        sortNotes();

        await saveNote(note);

        return note;

    }


    // =====================================
    // 兼容旧 app.js
    // =====================================

    async function addNote(data) {

        return await createNote(data);

    }


    // =====================================
    // 修改笔记
    // =====================================

    async function updateNote(id, data = {}) {

        const note =
            notes.find(
                n => n.id === id
            );


        if (!note) {

            return null;

        }


        Object.assign(
            note,
            data
        );


        note.updateTime =
            new Date().toLocaleString();


        sortNotes();

        await saveNote(note);


        return note;

    }


    // =====================================
    // 删除笔记
    // =====================================

    async function deleteNote(id) {

        notes =
            notes.filter(
                n => n.id !== id
            );


        await VaultDB.remove(
            STORE,
            id
        );

    }


    // =====================================
    // 搜索
    // =====================================

    function search(keyword) {

        keyword =
            (keyword || "")
                .toLowerCase()
                .trim();


        if (!keyword) {

            return [...notes];

        }


        return notes.filter(note => {

            const title =
                (note.title || "")
                    .toLowerCase();

            const content =
                (note.content || "")
                    .toLowerCase();

            const tags =
                (note.tags || [])
                    .join(",")
                    .toLowerCase();


            return (
                title.includes(keyword) ||
                content.includes(keyword) ||
                tags.includes(keyword)
            );

        });

    }


    // =====================================
    // 收藏
    // =====================================

    async function toggleFavorite(id) {

        const note =
            notes.find(
                n => n.id === id
            );


        if (!note) {

            return;

        }


        note.favorite =
            !note.favorite;


        note.updateTime =
            new Date().toLocaleString();


        await saveNote(note);

    }


    // =====================================
    // 置顶
    // =====================================

    async function togglePin(id) {

        const note =
            notes.find(
                n => n.id === id
            );


        if (!note) {

            return;

        }


        note.pinned =
            !note.pinned;


        note.updateTime =
            new Date().toLocaleString();


        sortNotes();

        await saveNote(note);

    }


    // =====================================
    // 添加待办
    // =====================================

    async function addTodo(
        id,
        text
    ) {

        const note =
            notes.find(
                n => n.id === id
            );


        if (!note || !text) {

            return;

        }


        if (!note.todo) {

            note.todo = [];

        }


        note.todo.push({

            text: text,

            done: false

        });


        note.updateTime =
            new Date().toLocaleString();


        await saveNote(note);

    }


    // =====================================
    // 勾选待办
    // =====================================

    async function checkTodo(
        id,
        index
    ) {

        const note =
            notes.find(
                n => n.id === id
            );


        if (
            !note ||
            !note.todo ||
            !note.todo[index]
        ) {

            return;

        }


        note.todo[index].done =
            !note.todo[index].done;


        note.updateTime =
            new Date().toLocaleString();


        await saveNote(note);

    }


    // =====================================
    // 获取全部笔记
    // =====================================

    function getNotes() {

        return notes;

    }


    // =====================================
    // 获取单条笔记
    // =====================================

    function getNote(id) {

        return notes.find(
            n => n.id === id
        );

    }


    // =====================================
    // 初始化
    // =====================================

    async function init() {

        await loadNotes();

    }


    // =====================================
    // 导出
    // =====================================

    return {

        init,

        setPassword,

        loadNotes,

        getNotes,

        getNote,

        createNote,

        addNote,

        updateNote,

        deleteNote,

        search,

        toggleFavorite,

        togglePin,

        addTodo,

        checkTodo

    };


})();


window.NotesManager =
    NotesManager;