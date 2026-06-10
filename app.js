document.addEventListener('DOMContentLoaded', () => {
    // --- 画面切り替え要素 ---
    const homeScreen = document.getElementById('home-screen');
    const editorScreen = document.getElementById('editor-screen');
    const subTitle = document.getElementById('sub-title');

    // --- 操作用要素 ---
    const searchInput = document.getElementById('search-input');
    const newDocBtn = document.getElementById('new-doc-btn');
    const docsGrid = document.getElementById('docs-grid');
    const emptyState = document.getElementById('empty-state');

    const backBtn = document.getElementById('back-btn');
    const saveBtn = document.getElementById('save-btn');
    const docTitleInput = document.getElementById('doc-title-input');
    const editor = document.getElementById('editor');
    const clearMainBtn = document.getElementById('clear-main-btn');

    const rawCount = document.getElementById('raw-count');
    const convertedCount = document.getElementById('converted-count');
    const editorLineCount = document.getElementById('editor-line-count');

    const reloadBtn = document.getElementById('reload-btn');

    // --- ホーム画面側ニュース見出し管理用要素 ---
    const headlineInputHome = document.getElementById('headline-input-home');
    const headlineAddBtnHome = document.getElementById('headline-add-btn-home');
    const headlineCancelBtnHome = document.getElementById('headline-cancel-btn-home');
    const headlinesListHome = document.getElementById('headlines-list-home');

    // --- エディタ画面側ニュース見出し管理用要素 ---
    const headlineInputEditor = document.getElementById('headline-input-editor');
    const headlineAddBtnEditor = document.getElementById('headline-add-btn-editor');
    const headlineCancelBtnEditor = document.getElementById('headline-cancel-btn-editor');
    const headlinesListEditor = document.getElementById('headlines-list-editor');

    // --- モーダル要素 ---
    const deleteModal = document.getElementById('delete-modal');
    const deleteCancelBtn = document.getElementById('delete-cancel-btn');
    const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // --- フォントサイズ調整用 ---
    const btnSizeSm = document.getElementById('btn-size-sm');
    const btnSizeMd = document.getElementById('btn-size-md');
    const btnSizeLg = document.getElementById('btn-size-lg');

    // --- カラーパレットの色のマッピング定義 ---
    const COLOR_THEMES = {
        white:  { card: "bg-white border-slate-200 hover:border-brand-300" },
        blue:   { card: "bg-blue-50 border-blue-200 hover:border-blue-400" },
        green:  { card: "bg-emerald-50 border-emerald-200 hover:border-emerald-400" },
        yellow: { card: "bg-amber-50 border-amber-200 hover:border-amber-400" },
        rose:   { card: "bg-rose-50 border-rose-200 hover:border-rose-400" },
        purple: { card: "bg-purple-50 border-purple-200 hover:border-purple-400" },
        sky:    { card: "bg-sky-50 border-sky-200 hover:border-sky-400" },
        orange: { card: "bg-orange-50 border-orange-200 hover:border-orange-400" },
        teal:   { card: "bg-teal-50 border-teal-200 hover:border-teal-400" },
        slate:  { card: "bg-slate-100 border-slate-300 hover:border-slate-500" }
    };

    // --- 状態管理 (メモリ内 & ローカルストレージ自動保存) ---
    let texts = [];
    let headlines = [];

    // ローカルストレージからのデータ復元
    function loadDataFromStorage() {
        const savedTexts = localStorage.getItem('editor_texts');
        const savedHeadlines = localStorage.getItem('editor_headlines');

        if (savedTexts) {
            texts = JSON.parse(savedTexts);
        } else {
            // 初期サンプルデータ
            texts = [
                {
                    id: "sample-1",
                    title: "自動改行のテストデータ",
                    content: "ここにはリアルタイムで自動的に三十六文字改行\u200B\nコードが入ります。半角英数は0.5文字分、全角\u200B\nカタカナは0.7文字分として計算されますので、\u200B\n異なる種類の文字が混ざりあっても、表示の幅\u200B\nがぴったり三十六文字で統一されます。",
                    rawCount: 104,
                    convertedCount: 116,
                    lineCount: 5,
                    color: "blue",
                    updatedAt: "2026/06/08 22:45"
                },
                {
                    id: "sample-2",
                    title: "禁則処理のテスト用サンプル",
                    content: "行の最後が「。」や「、」などの句読点で終わ\u200B\nる場合でも、次の行の行頭にそれらの文字がポ\u200B\nツンと一文字だけで配置されることがないよう\u200B\nに、自動的に前の文字と一緒に次の行へと送り\u200B\n出す禁則処理を内部に搭載しています。",
                    rawCount: 105,
                    convertedCount: 117,
                    lineCount: 5,
                    color: "green",
                    updatedAt: "2026/06/08 23:01"
                }
            ];
            saveTextsToStorage();
        }

        if (savedHeadlines) {
            headlines = JSON.parse(savedHeadlines);
        } else {
            headlines = [
                { id: "hl-1", text: "都内で今年初の真夏日を記録 統計開始以来最も早く" },
                { id: "hl-2", text: "最新のiPadOSに対応したWebPWA文章自動改行エディタアプリ検証" }
            ];
            saveHeadlinesToStorage();
        }
    }

    function saveTextsToStorage() {
        localStorage.setItem('editor_texts', JSON.stringify(texts));
    }

    function saveHeadlinesToStorage() {
        localStorage.setItem('editor_headlines', JSON.stringify(headlines));
    }

    let activeDocId = null;
    let isComposing = false;
    let deleteTargetId = null;
    let editingHeadlineId = null;
    let autoSaveTimer = null;

    const AUTO_BREAK_MARKER = '\u200B\n';
    const KINSOKU_CHARS = `、。，．・？！?!゛゜ー〜～）]｝」』】〉》〕»"'ぁぃぅぇぉっゃゅょゎヵヶァィゥェォッャュョヮヵヶ`;

    // --- 自動保存インジケータ ---
    const autosaveIndicator = document.getElementById('autosave-indicator');
    let autosaveHideTimer = null;

    function showAutosaveIndicator() {
        if (autosaveHideTimer) clearTimeout(autosaveHideTimer);
        autosaveIndicator.classList.remove('hidden');
        autosaveIndicator.classList.add('flex');
        autosaveHideTimer = setTimeout(() => {
            autosaveIndicator.classList.add('hidden');
            autosaveIndicator.classList.remove('flex');
        }, 3000);
    }

    // --- 自動保存ロジック（デバウンス付き 1.5秒） ---
    function scheduleAutoSave() {
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            performAutoSave();
        }, 1500);
    }

    function performAutoSave() {
        const rawText = editor.value;
        const textWithoutAutoLineBreaks = rawText.replace(new RegExp(AUTO_BREAK_MARKER, 'g'), '');
        if (!textWithoutAutoLineBreaks.trim()) return;

        let title = docTitleInput.value.trim();
        if (!title) {
            const cleanText = textWithoutAutoLineBreaks.replace(/\n/g, ' ');
            title = cleanText.substring(0, 15) || '無題のドキュメント';
            if (cleanText.length > 15) title += '...';
        }

        const rCount = parseFloat(rawCount.textContent);
        const cCount = parseFloat(convertedCount.textContent);
        const calculatedLineCount = rawText ? rawText.split('\n').length : 0;

        if (activeDocId) {
            // 既存ドキュメント：上書き保存
            const index = texts.findIndex(t => t.id === activeDocId);
            if (index !== -1) {
                texts[index] = {
                    ...texts[index],
                    title: title,
                    content: rawText,
                    rawCount: rCount,
                    convertedCount: cCount,
                    lineCount: calculatedLineCount,
                    updatedAt: getNowFormatted()
                };
                saveTextsToStorage();
                showAutosaveIndicator();
            }
        } else {
            // 新規ドキュメント：下書きとして保存
            localStorage.setItem('editor_draft', JSON.stringify({
                title: title,
                content: rawText,
                rawCount: rCount,
                convertedCount: cCount,
                lineCount: calculatedLineCount,
                savedAt: getNowFormatted()
            }));
            showAutosaveIndicator();
        }
    }

    // --- 下書き復元 ---
    function restoreDraftIfExists() {
        const draft = localStorage.getItem('editor_draft');
        if (!draft) return;

        const data = JSON.parse(draft);
        const confirmRestore = confirm(
            `前回の未保存の下書きが見つかりました。\n\n` +
            `タイトル：${data.title}\n` +
            `保存日時：${data.savedAt}\n\n` +
            `復元しますか？（キャンセルで下書きを破棄）`
        );

        if (confirmRestore) {
            docTitleInput.value = data.title !== '無題のドキュメント' && !data.title.endsWith('...') ? data.title : '';
            editor.value = data.content;
            processText();
        } else {
            localStorage.removeItem('editor_draft');
        }
    }

    // --- 共通トースト表示 ---
    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('flex');
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.classList.remove('flex');
        }, 2000);
    }

    // --- 画面切り替え管理 ---
    function switchTo(screen) {
        if (screen === 'home') {
            editorScreen.classList.add('hidden');
            homeScreen.classList.remove('hidden');
            subTitle.textContent = "作成ドキュメント管理";

            if (editingHeadlineId !== null) cancelEdit();

            renderHome();
            renderHeadlines();
        } else if (screen === 'editor') {
            homeScreen.classList.add('hidden');
            editorScreen.classList.remove('hidden');
            subTitle.textContent = activeDocId ? "ドキュメント編集" : "新規ドキュメント作成";

            if (editingHeadlineId !== null) cancelEdit();

            renderHeadlines();
        }
    }

    // --- 文字ウェイト評価 (半角0.5, 全角カタカナ0.7, その他1.0) ---
    function getCharWidth(char) {
        if (char === '\u200B' || char === '\n' || char === '\r') return 0;
        const code = char.charCodeAt(0);
        if (code >= 0x0020 && code <= 0x007E) return 0.5;
        if (code >= 0xFF61 && code <= 0xFF9F) return 0.5;
        if ((code >= 0x30A0 && code <= 0x30FF) || (code >= 0x31F0 && code <= 0x31FF)) return 0.7;
        return 1.0;
    }

    function getStringWidth(str) {
        let total = 0;
        for (let i = 0; i < str.length; i++) {
            total += getCharWidth(str.charAt(i));
        }
        return total;
    }

    // 数値フォーマット用関数
    function formatCountValue(num) {
        return Number(num.toFixed(1));
    }

    // --- 文字数に応じた配色スタイル調整 ---
    function getHeadlineColorClasses(count) {
        if (count < 35) {
            return {
                text: 'text-blue-600',
                bg: 'bg-blue-50',
                border: 'border-blue-100',
                badge: 'text-blue-700 bg-blue-50 border-blue-100/70'
            };
        } else if (count >= 40) {
            return {
                text: 'text-rose-600',
                bg: 'bg-rose-50',
                border: 'border-rose-100',
                badge: 'text-rose-700 bg-rose-50 border-rose-100/70'
            };
        } else {
            return {
                text: 'text-emerald-600',
                bg: 'bg-emerald-50',
                border: 'border-emerald-100',
                badge: 'text-emerald-700 bg-emerald-50 border-emerald-100/70'
            };
        }
    }

    // --- ニュース入力欄：リアルタイム文字数（実数）カウント連動処理 ---
    function updateInputCounter(inputElement, counterWrapper, countSpan) {
        const text = inputElement.value;
        if (!text) {
            counterWrapper.classList.add('hidden');
            return;
        }
        counterWrapper.classList.remove('hidden');
        counterWrapper.classList.add('inline-block');

        const cleanText = text.replace(/\n/g, '');
        const count = cleanText.length;

        counterWrapper.className = "hidden text-xs font-semibold px-3 py-1.5 rounded-xl animate-in fade-in slide-in-from-right-1 duration-150 inline-block shadow-sm";
        const colors = getHeadlineColorClasses(count);
        counterWrapper.classList.add(colors.text, colors.bg, 'border', colors.border);

        const isEditing = (editingHeadlineId !== null);
        const iconHtml = isEditing
            ? `<i class="fa-solid fa-pen-to-square mr-1.5 animate-pulse"></i>`
            : `<i class="fa-regular fa-keyboard mr-1.5 animate-pulse"></i>`;
        const labelText = isEditing ? '編集中：' : '入力中：';

        counterWrapper.innerHTML = `${iconHtml}${labelText}<span class="font-bold text-sm">${count}</span> 文字`;
    }

    // 各入力エリアの入力を検知（実数カウント）
    headlineInputHome.addEventListener('input', () => {
        updateInputCounter(headlineInputHome, document.getElementById('headline-counter-home'));
    });

    headlineInputEditor.addEventListener('input', () => {
        updateInputCounter(headlineInputEditor, document.getElementById('headline-counter-editor'));
    });

    // --- 見出し用ボタン表示状態切り替え ---
    function updateHeadlineButtonsUI(isEditing) {
        const cancelHome = headlineCancelBtnHome;
        const cancelEditor = headlineCancelBtnEditor;

        const iconHome = document.getElementById('headline-btn-icon-home');
        const iconEditor = document.getElementById('headline-btn-icon-editor');

        const textHome = document.getElementById('headline-btn-text-home');
        const textEditor = document.getElementById('headline-btn-text-editor');

        const btnHome = headlineAddBtnHome;
        const btnEditor = headlineAddBtnEditor;

        if (isEditing) {
            cancelHome.classList.remove('hidden');
            cancelHome.classList.add('flex');
            cancelEditor.classList.remove('hidden');
            cancelEditor.classList.add('flex');

            iconHome.className = "fa-solid fa-check";
            iconEditor.className = "fa-solid fa-check";

            textHome.textContent = "確定";
            textEditor.textContent = "確定";

            btnHome.className = "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm px-5 rounded-xl flex items-center gap-1.5 transition-all btn-touch shadow-md shadow-indigo-500/10 whitespace-nowrap h-[46px]";
            btnEditor.className = "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm px-5 rounded-xl flex items-center gap-1.5 transition-all btn-touch shadow-md shadow-indigo-500/10 whitespace-nowrap h-[46px]";
        } else {
            cancelHome.classList.add('hidden');
            cancelHome.classList.remove('flex');
            cancelEditor.classList.add('hidden');
            cancelEditor.classList.remove('flex');

            iconHome.className = "fa-solid fa-plus";
            iconEditor.className = "fa-solid fa-plus";

            textHome.textContent = "追加";
            textEditor.textContent = "追加";

            btnHome.className = "bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-sm px-5 rounded-xl flex items-center gap-1.5 transition-all btn-touch shadow-md shadow-amber-500/10 whitespace-nowrap h-[46px]";
            btnEditor.className = "bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-sm px-5 rounded-xl flex items-center gap-1.5 transition-all btn-touch shadow-md shadow-amber-500/10 whitespace-nowrap h-[46px]";
        }
    }

    // --- ニュース見出しリストの追加・更新＆同期処理 ---
    function saveHeadline(inputElement) {
        const text = inputElement.value;
        if (!text.trim()) return;

        if (editingHeadlineId !== null) {
            // 【編集モード】既存項目更新
            const index = headlines.findIndex(h => h.id === editingHeadlineId);
            if (index !== -1) {
                headlines[index].text = text.trim();
                saveHeadlinesToStorage();
                showToast('見出しを変更しました');
            }
            editingHeadlineId = null;
            updateHeadlineButtonsUI(false);
        } else {
            // 【通常モード】新規追加
            const lines = text.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            if (lines.length > 0) {
                lines.forEach(line => {
                    headlines.push({
                        id: "hl-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
                        text: line
                    });
                });
                saveHeadlinesToStorage();
                showToast(`${lines.length}件の見出しを追加しました`);
            }
        }

        headlineInputHome.value = '';
        headlineInputEditor.value = '';

        document.getElementById('headline-counter-home').classList.add('hidden');
        document.getElementById('headline-counter-editor').classList.add('hidden');

        renderHeadlines();
    }

    // イベントリスナー登録 (ホーム画面側)
    headlineAddBtnHome.addEventListener('click', () => saveHeadline(headlineInputHome));
    headlineInputHome.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.isComposing) {
            if (!e.shiftKey) {
                e.preventDefault();
                saveHeadline(headlineInputHome);
            }
        }
    });

    // イベントリスナー登録 (エディタ画面側)
    headlineAddBtnEditor.addEventListener('click', () => saveHeadline(headlineInputEditor));
    headlineInputEditor.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.isComposing) {
            if (!e.shiftKey) {
                e.preventDefault();
                saveHeadline(headlineInputEditor);
            }
        }
    });

    // 編集キャンセル処理
    function cancelEdit() {
        editingHeadlineId = null;
        headlineInputHome.value = '';
        headlineInputEditor.value = '';

        document.getElementById('headline-counter-home').classList.add('hidden');
        document.getElementById('headline-counter-editor').classList.add('hidden');

        updateHeadlineButtonsUI(false);
        renderHeadlines();
        showToast('編集をキャンセルしました');
    }

    headlineCancelBtnHome.addEventListener('click', cancelEdit);
    headlineCancelBtnEditor.addEventListener('click', cancelEdit);

    // 1列隙間なし見出しリストの同期レンダリング
    function renderHeadlines() {
        headlinesListHome.innerHTML = '';
        headlinesListEditor.innerHTML = '';

        const isEmpty = headlines.length === 0;
        if (isEmpty) {
            const emptyHtml = `<p class="text-xs text-slate-400 text-center py-6 bg-white">追加された見出しはありません</p>`;
            headlinesListHome.innerHTML = emptyHtml;
            headlinesListEditor.innerHTML = emptyHtml;
            return;
        }

        headlines.forEach(hl => {
            const count = hl.text.replace(/\n/g, '').length;
            const colors = getHeadlineColorClasses(count);
            const isCurrentEditing = (editingHeadlineId === hl.id);

            const rowBgClass = isCurrentEditing
                ? "bg-amber-50/70 border-l-4 border-l-amber-400"
                : "bg-white hover:bg-slate-50/80";

            // コピー用関数を用意
            const copyText = escapeHtml(hl.text);

            const rowHtml = `
                <div class="flex-1 min-w-0 flex items-center gap-1.5 py-0.5">
                    ${isCurrentEditing ? `<span class="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded animate-pulse shrink-0">編集中</span>` : ''}
                    <p class="text-sm font-semibold truncate select-text transition-colors duration-150 ${isCurrentEditing ? 'text-amber-800' : colors.text}" title="${copyText}">${copyText}</p>
                </div>
                
                <div class="flex items-center gap-2 shrink-0 py-0.5">
                    <div class="flex text-xs font-bold">
                        <span class="${colors.badge} px-2 py-0.5 rounded border shadow-sm transition-colors duration-150">文字数: <b>${count}</b> 字</span>
                    </div>
                    <div class="flex items-center space-x-1">
                        <button onclick="window.editHeadline('${hl.id}')" class="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-200/60 rounded-lg transition-colors btn-touch" title="編集">
                            <i class="fa-regular fa-pen-to-square text-base ${isCurrentEditing ? 'text-brand-500' : ''}"></i>
                        </button>
                        <button onclick="window.deleteHeadline('${hl.id}')" class="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors btn-touch" title="削除">
                            <i class="fa-regular fa-trash-can text-base"></i>
                        </button>
                    </div>
                </div>
            `;

            // ホーム用
            const rowHome = document.createElement('div');
            rowHome.className = `flex items-center justify-between py-1.5 px-3 gap-3 transition-colors select-none ${rowBgClass}`;
            rowHome.innerHTML = rowHtml;
            headlinesListHome.appendChild(rowHome);

            // エディタ用
            const rowEditor = document.createElement('div');
            rowEditor.className = `flex items-center justify-between py-1.5 px-2 gap-2 transition-colors select-none ${rowBgClass}`;
            rowEditor.innerHTML = rowHtml;
            headlinesListEditor.appendChild(rowEditor);
        });
    }

    // コピー処理
    window.copyToClipboard = function (text) {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        showToast('クリップボードにコピーしました');
    };

    // 見出しの再編集機能
    window.editHeadline = function (id) {
        const hl = headlines.find(h => h.id === id);
        if (hl) {
            editingHeadlineId = hl.id;
            updateHeadlineButtonsUI(true);

            const isHomeActive = !homeScreen.classList.contains('hidden');
            if (isHomeActive) {
                headlineInputHome.value = hl.text;
                headlineInputHome.focus();
                updateInputCounter(headlineInputHome, document.getElementById('headline-counter-home'));
            } else {
                headlineInputEditor.value = hl.text;
                headlineInputEditor.focus();
                updateInputCounter(headlineInputEditor, document.getElementById('headline-counter-editor'));
            }
            renderHeadlines();
            showToast('見出しを入力欄にロードしました');
        }
    };

    // 見出しの削除
    window.deleteHeadline = function (id) {
        if (editingHeadlineId === id) {
            editingHeadlineId = null;
            headlineInputHome.value = '';
            headlineInputEditor.value = '';
            document.getElementById('headline-counter-home').classList.add('hidden');
            document.getElementById('headline-counter-editor').classList.add('hidden');
            updateHeadlineButtonsUI(false);
        }
        headlines = headlines.filter(h => h.id !== id);
        saveHeadlinesToStorage();
        renderHeadlines();
        showToast('見出しを削除しました');
    };

    // --- 文字サイズ変更ロジック ---
    function changeFontSize(size, activeBtn) {
        editor.style.fontSize = size;
        [btnSizeSm, btnSizeMd, btnSizeLg].forEach(btn => {
            btn.className = "px-3 py-1 text-xs rounded-lg transition-all font-semibold hover:bg-white/50";
        });
        activeBtn.className = "px-3 py-1 text-xs rounded-lg transition-all font-semibold bg-white shadow-sm text-brand-600";
    }

    btnSizeSm.addEventListener('click', () => changeFontSize('14px', btnSizeSm));
    btnSizeMd.addEventListener('click', () => changeFontSize('16px', btnSizeMd));
    btnSizeLg.addEventListener('click', () => changeFontSize('18px', btnSizeLg));

    // --- リアルタイムテキスト変換＆改行 ---
    function processText() {
        if (isComposing) return;

        const text = editor.value;
        const textWithoutAutoLineBreaks = text.replace(new RegExp(AUTO_BREAK_MARKER, 'g'), '');
        const cleanText = textWithoutAutoLineBreaks.replace(/\n/g, '');

        const rawLength = getStringWidth(cleanText);
        rawCount.textContent = formatCountValue(rawLength);

        if (!textWithoutAutoLineBreaks) {
            editor.value = '';
            convertedCount.textContent = '0';
            editorLineCount.textContent = '0';
            return;
        }

        const oldSelectionStart = editor.selectionStart;
        const paragraphs = textWithoutAutoLineBreaks.split('\n');
        const limit = 36;

        const convertedParagraphs = paragraphs.map(paragraph => {
            let chunked = [];
            let i = 0;

            while (i < paragraph.length) {
                let currentWidth = 0;
                let breakIndex = i;

                while (breakIndex < paragraph.length) {
                    const charWidth = getCharWidth(paragraph.charAt(breakIndex));
                    if (currentWidth + charWidth > limit) {
                        break;
                    }
                    currentWidth += charWidth;
                    breakIndex++;
                }

                if (breakIndex >= paragraph.length) {
                    chunked.push(paragraph.substring(i));
                    break;
                }

                let nextChar = paragraph.charAt(breakIndex);

                if (KINSOKU_CHARS.includes(nextChar)) {
                    let tempBreak = breakIndex;
                    while (tempBreak > i && KINSOKU_CHARS.includes(paragraph.charAt(tempBreak))) {
                        tempBreak--;
                    }
                    if (tempBreak > i) {
                        breakIndex = tempBreak;
                    }
                }

                chunked.push(paragraph.substring(i, breakIndex));
                i = breakIndex;
            }

            return chunked.length > 0 ? chunked.join(AUTO_BREAK_MARKER) : '';
        });

        const finalText = convertedParagraphs.join('\n');

        const convertedTextClean = finalText.replace(/\u200B/g, '');
        const textCharsOnly = convertedTextClean.replace(/\n/g, '');
        const lineBreakCount = (convertedTextClean.match(/\n/g) || []).length;

        const convertedLength = getStringWidth(textCharsOnly) + lineBreakCount;
        convertedCount.textContent = formatCountValue(convertedLength);

        const calculatedLineCount = finalText ? finalText.split('\n').length : 0;
        editorLineCount.textContent = calculatedLineCount;

        editor.value = finalText;

        // カーソル位置の復元
        let lenBeforeCursorWithoutAutoLineBreaks = 0;
        let idx = 0;
        while (idx < oldSelectionStart && idx < text.length) {
            if (text.substring(idx).startsWith(AUTO_BREAK_MARKER)) {
                idx += AUTO_BREAK_MARKER.length;
            } else {
                lenBeforeCursorWithoutAutoLineBreaks++;
                idx++;
            }
        }

        let newSelectionStart = 0;
        let currentLen = 0;
        while (currentLen < lenBeforeCursorWithoutAutoLineBreaks && newSelectionStart < finalText.length) {
            if (finalText.substring(newSelectionStart).startsWith(AUTO_BREAK_MARKER)) {
                newSelectionStart += AUTO_BREAK_MARKER.length;
            } else {
                currentLen++;
                newSelectionStart++;
            }
        }

        if (finalText.substring(newSelectionStart).startsWith(AUTO_BREAK_MARKER)) {
            newSelectionStart += AUTO_BREAK_MARKER.length;
        }

        editor.setSelectionRange(newSelectionStart, newSelectionStart);
    }

    // --- IME（日本語入力）ハンドラー ---
    editor.addEventListener('compositionstart', () => { isComposing = true; });
    editor.addEventListener('compositionend', () => {
        isComposing = false;
        processText();
        scheduleAutoSave();
    });
    editor.addEventListener('input', () => {
        processText();
        scheduleAutoSave();
    });

    // タイトル変更時も自動保存
    docTitleInput.addEventListener('input', scheduleAutoSave);

    // --- クリアボタン ---
    clearMainBtn.addEventListener('click', () => {
        editor.value = '';
        processText();
        editor.focus();
    });

    // --- 日時のフォーマッター ---
    function getNowFormatted() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${y}/${m}/${d} ${h}:${min}`;
    }

    // --- ドキュメント保存機能 ---
    saveBtn.addEventListener('click', () => {
        const rawText = editor.value;
        const textWithoutAutoLineBreaks = rawText.replace(new RegExp(AUTO_BREAK_MARKER, 'g'), '');

        if (!textWithoutAutoLineBreaks.trim()) {
            showToast('保存するテキストがありません');
            return;
        }

        let title = docTitleInput.value.trim();
        if (!title) {
            const cleanText = textWithoutAutoLineBreaks.replace(/\n/g, ' ');
            title = cleanText.substring(0, 15) || '無題のドキュメント';
            if (cleanText.length > 15) title += '...';
        }

        const rCount = parseFloat(rawCount.textContent);
        const cCount = parseFloat(convertedCount.textContent);
        const calculatedLineCount = rawText ? rawText.split('\n').length : 0;

        if (activeDocId) {
            // 更新処理
            const index = texts.findIndex(t => t.id === activeDocId);
            if (index !== -1) {
                texts[index] = {
                    ...texts[index],
                    title: title,
                    content: rawText,
                    rawCount: rCount,
                    convertedCount: cCount,
                    lineCount: calculatedLineCount,
                    updatedAt: getNowFormatted()
                };
            }
        } else {
            // 新規追加
            const newId = 'doc-' + Date.now();
            texts.unshift({
                id: newId,
                title: title,
                content: rawText,
                rawCount: rCount,
                convertedCount: cCount,
                lineCount: calculatedLineCount,
                color: "white",
                updatedAt: getNowFormatted()
            });
        }

        saveTextsToStorage();
        // 明示的保存時に下書きを削除
        localStorage.removeItem('editor_draft');
        showToast('保存しました');
        switchTo('home');
    });

    // --- 新規ドキュメント開始 ---
    newDocBtn.addEventListener('click', () => {
        activeDocId = null;
        docTitleInput.value = '';
        editor.value = '';
        rawCount.textContent = '0';
        convertedCount.textContent = '0';
        editorLineCount.textContent = '0';
        switchTo('editor');
        // 下書きがあれば復元を提案
        restoreDraftIfExists();
    });

    // --- 一覧に戻る ---
    backBtn.addEventListener('click', () => {
        // 新規ドキュメントで未保存の場合、下書きを残す（自動保存済みのため消さない）
        // 既存ドキュメントの場合は自動保存済みなので下書きは不要
        if (activeDocId) {
            localStorage.removeItem('editor_draft');
        }
        switchTo('home');
    });

    // --- ホーム画面カード一覧レンダリング ---
    function renderHome() {
        const query = searchInput.value.trim().toLowerCase();
        docsGrid.innerHTML = '';

        const filtered = texts.filter(t =>
            t.title.toLowerCase().includes(query) ||
            t.content.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
            return;
        } else {
            emptyState.classList.add('hidden');
            emptyState.classList.remove('flex');
        }

        filtered.forEach(doc => {
            const lCount = doc.lineCount !== undefined ? doc.lineCount : (doc.content ? doc.content.split('\n').length : 0);
            const docColor = doc.color || 'white';
            const theme = COLOR_THEMES[docColor] || COLOR_THEMES.white;

            const card = document.createElement('div');
            card.className = `${theme.card} rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[135px] list-item-touch relative group`;

            card.innerHTML = `
                <div class="flex-1 cursor-pointer" onclick="window.loadDoc('${doc.id}')">
                    <div class="flex flex-col">
                        <h3 class="font-bold text-slate-800 text-base line-clamp-1 group-hover:text-brand-600 transition-colors">${escapeHtml(doc.title)}</h3>
                        <p class="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                            <i class="fa-regular fa-clock"></i> ${doc.updatedAt}
                        </p>
                    </div>
                </div>
                
                <div class="border-t border-slate-200/60 pt-2.5 flex items-center justify-between relative">
                    <div class="flex items-center space-x-3 text-xs text-slate-400">
                        <span>元: <b class="text-slate-600">${doc.rawCount}</b></span>
                        <span>換算: <b class="text-brand-600">${doc.convertedCount}</b></span>
                        <span>行: <b class="text-emerald-600">${lCount}</b></span>
                    </div>
                    
                    <div class="flex items-center space-x-1.5 relative">
                        <button onclick="window.togglePalette(event, '${doc.id}')" class="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100/50 rounded-lg transition-colors btn-touch" title="背景色の変更">
                            <i class="fa-solid fa-palette text-base"></i>
                        </button>
                        <button onclick="window.openDeleteModal('${doc.id}')" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors btn-touch" title="削除">
                            <i class="fa-regular fa-trash-can text-base"></i>
                        </button>

                        <div id="palette-${doc.id}" class="hidden absolute bottom-12 right-0 bg-white border border-slate-200 rounded-xl p-2.5 shadow-xl z-30 animate-in fade-in slide-in-from-bottom-2 duration-150" style="width:156px">
                            <div class="grid grid-cols-5 gap-1.5">
                                <button onclick="window.changeDocColor(event, '${doc.id}', 'white')"  class="w-7 h-7 rounded-full border-2 border-slate-300  bg-white          hover:scale-110 transition-transform shrink-0" title="ホワイト"></button>
                                <button onclick="window.changeDocColor(event, '${doc.id}', 'blue')"   class="w-7 h-7 rounded-full border-2 border-blue-300   bg-blue-100       hover:scale-110 transition-transform shrink-0" title="ブルー"></button>
                                <button onclick="window.changeDocColor(event, '${doc.id}', 'green')"  class="w-7 h-7 rounded-full border-2 border-emerald-300 bg-emerald-100    hover:scale-110 transition-transform shrink-0" title="グリーン"></button>
                                <button onclick="window.changeDocColor(event, '${doc.id}', 'yellow')" class="w-7 h-7 rounded-full border-2 border-amber-300   bg-amber-100      hover:scale-110 transition-transform shrink-0" title="イエロー"></button>
                                <button onclick="window.changeDocColor(event, '${doc.id}', 'rose')"   class="w-7 h-7 rounded-full border-2 border-rose-300    bg-rose-100       hover:scale-110 transition-transform shrink-0" title="ローズ"></button>
                                <button onclick="window.changeDocColor(event, '${doc.id}', 'purple')" class="w-7 h-7 rounded-full border-2 border-purple-300   bg-purple-100     hover:scale-110 transition-transform shrink-0" title="パープル"></button>
                                <button onclick="window.changeDocColor(event, '${doc.id}', 'sky')"    class="w-7 h-7 rounded-full border-2 border-sky-300     bg-sky-100        hover:scale-110 transition-transform shrink-0" title="スカイ"></button>
                                <button onclick="window.changeDocColor(event, '${doc.id}', 'orange')" class="w-7 h-7 rounded-full border-2 border-orange-300   bg-orange-100     hover:scale-110 transition-transform shrink-0" title="オレンジ"></button>
                                <button onclick="window.changeDocColor(event, '${doc.id}', 'teal')"   class="w-7 h-7 rounded-full border-2 border-teal-300     bg-teal-100       hover:scale-110 transition-transform shrink-0" title="ティール"></button>
                                <button onclick="window.changeDocColor(event, '${doc.id}', 'slate')"  class="w-7 h-7 rounded-full border-2 border-slate-400    bg-slate-200      hover:scale-110 transition-transform shrink-0" title="グレー"></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            docsGrid.appendChild(card);
        });
    }

    window.togglePalette = function (event, id) {
        event.stopPropagation();
        texts.forEach(doc => {
            if (doc.id !== id) {
                const otherPalette = document.getElementById(`palette-${doc.id}`);
                if (otherPalette) otherPalette.classList.add('hidden');
            }
        });
        const targetPalette = document.getElementById(`palette-${id}`);
        if (targetPalette) targetPalette.classList.toggle('hidden');
    };

    window.changeDocColor = function (event, id, colorKey) {
        event.stopPropagation();
        const index = texts.findIndex(t => t.id === id);
        if (index !== -1) {
            texts[index].color = colorKey;
            saveTextsToStorage();
        }
        renderHome();
        showToast('背景色を変更しました');
    };

    document.addEventListener('click', () => {
        texts.forEach(doc => {
            const pal = document.getElementById(`palette-${doc.id}`);
            if (pal) pal.classList.add('hidden');
        });
    });

    window.loadDoc = function (id) {
        const doc = texts.find(t => t.id === id);
        if (doc) {
            activeDocId = doc.id;
            docTitleInput.value = doc.title;
            editor.value = doc.content;
            switchTo('editor');
            processText();
        }
    };

    window.openDeleteModal = function (id) {
        deleteTargetId = id;
        deleteModal.classList.remove('hidden');
        deleteModal.classList.add('flex');
    };

    deleteConfirmBtn.addEventListener('click', () => {
        if (deleteTargetId) {
            texts = texts.filter(t => t.id !== deleteTargetId);
            saveTextsToStorage();
            deleteModal.classList.add('hidden');
            deleteModal.classList.remove('flex');
            deleteTargetId = null;
            showToast('削除しました');
            renderHome();
        }
    });

    deleteCancelBtn.addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        deleteModal.classList.remove('flex');
        deleteTargetId = null;
    });

    searchInput.addEventListener('input', renderHome);

    // 一覧更新ボタンのアクション
    reloadBtn.addEventListener('click', () => {
        const icon = reloadBtn.querySelector('i');
        icon.classList.add('animate-spin');

        loadDataFromStorage();
        renderHome();
        renderHeadlines();
        showToast('一覧を最新に同期しました');

        setTimeout(() => {
            icon.classList.remove('animate-spin');
        }, 500);
    });

    function escapeHtml(string) {
        if (typeof string !== 'string') return '';
        return string.replace(/[&<>"']/g, function (match) {
            const escape = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
            return escape[match];
        });
    }

    // 初期化
    loadDataFromStorage();
    renderHome();
    renderHeadlines();
});
