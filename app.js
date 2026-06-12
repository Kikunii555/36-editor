document.addEventListener('DOMContentLoaded', () => {
    // ==================== Supabase 設定 ====================
    // TODO: ご自身のSupabaseプロジェクトのURLとAnon Keyに書き換えてください。
    const SUPABASE_URL = 'https://rqghnrfdsgfgszaxumyz.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_XCMxvgCxTbv4VebZj1fYiw_xiBFOk6j';

    let supabase = null;
    // URLがプレースホルダーでなければSupabaseクライアントを初期化
    if (typeof window.supabase !== 'undefined' && SUPABASE_URL && !SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // 共有用の4桁の暗証番号（パスコード）
    const CORRECT_PIN = '8888';

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
    const docTitleInput = document.getElementById('doc-title-input');
    const editor = document.getElementById('editor');
    const clearMainBtn = document.getElementById('clear-main-btn');

    const rawCount = document.getElementById('raw-count');
    const convertedCount = document.getElementById('converted-count');
    const editorLineCount = document.getElementById('editor-line-count');

    const reloadBtn = document.getElementById('reload-btn');
    const saveAllBtn = document.getElementById('save-all-btn');

    // --- ホーム画面側ニュース見出し管理用要素 ---
    const headlineInputHome = document.getElementById('headline-input-home');
    const headlineAddBtnHome = document.getElementById('headline-add-btn-home');
    const headlineCancelBtnHome = document.getElementById('headline-cancel-btn-home');
    const headlinesListHome = document.getElementById('headlines-list-home');

    // --- モーダル要素 ---
    const deleteModal = document.getElementById('delete-modal');
    const deleteCancelBtn = document.getElementById('delete-cancel-btn');
    const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // --- PIN入力モーダル要素と制御ロジック ---
    const pinModal = document.getElementById('pin-modal');
    const pinModalDesc = document.getElementById('pin-modal-desc');
    const pinErrorMsg = document.getElementById('pin-error-msg');
    const pinDots = document.querySelectorAll('.pin-dot');
    const pinKeys = document.querySelectorAll('.pin-key');
    const pinClearBtn = document.getElementById('pin-clear');
    const pinCancelBtn = document.getElementById('pin-cancel');

    let pinInputCallback = null;
    let pinInputCancelCallback = null;
    let currentEnteredPin = "";

    // 暗証番号入力モーダルを開く関数
    function requestPin(actionDescription, onSuccess, onCancel) {
        currentEnteredPin = "";
        pinInputCallback = onSuccess;
        pinInputCancelCallback = onCancel;
        pinModalDesc.textContent = `${actionDescription}するため、4桁の暗証番号を入力してください`;
        updatePinDots();
        pinErrorMsg.classList.add('opacity-0');
        pinModal.classList.remove('hidden');
        pinModal.classList.add('flex');
    }

    // ドット表示の更新
    function updatePinDots() {
        pinDots.forEach((dot, idx) => {
            if (idx < currentEnteredPin.length) {
                dot.classList.remove('bg-transparent', 'border-slate-300');
                dot.classList.add('bg-brand-600', 'border-brand-600');
            } else {
                dot.classList.remove('bg-brand-600', 'border-brand-600');
                dot.classList.add('bg-transparent', 'border-slate-300');
            }
        });
    }

    // パスコード検証処理
    function verifyPin() {
        if (currentEnteredPin === CORRECT_PIN) {
            pinModal.classList.add('hidden');
            pinModal.classList.remove('flex');
            if (pinInputCallback) pinInputCallback();
        } else {
            pinErrorMsg.classList.remove('opacity-0');
            pinDots.forEach(dot => {
                dot.classList.add('border-rose-500', 'bg-rose-500');
            });
            setTimeout(() => {
                currentEnteredPin = "";
                updatePinDots();
                pinDots.forEach(dot => {
                    dot.classList.remove('border-rose-500', 'bg-rose-500');
                });
            }, 500);
        }
    }

    // テンキー押下時のハンドラー
    pinKeys.forEach(key => {
        key.addEventListener('click', () => {
            if (currentEnteredPin.length < 4) {
                currentEnteredPin += key.getAttribute('data-value');
                updatePinDots();
                pinErrorMsg.classList.add('opacity-0');

                if (currentEnteredPin.length === 4) {
                    setTimeout(verifyPin, 150);
                }
            }
        });
    });

    pinClearBtn.addEventListener('click', () => {
        currentEnteredPin = "";
        updatePinDots();
        pinErrorMsg.classList.add('opacity-0');
    });

    pinCancelBtn.addEventListener('click', () => {
        pinModal.classList.add('hidden');
        pinModal.classList.remove('flex');
        if (pinInputCancelCallback) pinInputCancelCallback();
    });

    // --- フォントサイズ調整用 ---
    const btnSizeSm = document.getElementById('btn-size-sm');
    const btnSizeMd = document.getElementById('btn-size-md');
    const btnSizeLg = document.getElementById('btn-size-lg');

    // --- カラーパレットの色のマッピング定義 ---
    const COLOR_THEMES = {
        white: { card: "bg-white border-slate-200 hover:border-brand-300" },
        blue: { card: "bg-indigo-50 border-indigo-200 hover:border-indigo-400" },
        green: { card: "bg-emerald-50 border-emerald-200 hover:border-emerald-400" },
        yellow: { card: "bg-amber-50 border-amber-200 hover:border-amber-400" },
        rose: { card: "bg-rose-50 border-rose-200 hover:border-rose-400" },
        purple: { card: "bg-purple-50 border-purple-200 hover:border-purple-400" },
        sky: { card: "bg-sky-50 border-sky-200 hover:border-sky-400" },
        orange: { card: "bg-orange-50 border-orange-200 hover:border-orange-400" },
        teal: { card: "bg-teal-50 border-teal-200 hover:border-teal-400" },
        slate: { card: "bg-slate-100 border-slate-300 hover:border-slate-500" }
    };

    // --- デフォルト設定値 ---
    const DEFAULT_CHAR_WEIGHTS = {
        ascii: 0.5,  // 半角英数字・記号
        hankakuKana: 0.5,  // 半角カタカナ
        katakana: 0.7,  // 全角カタカナ
        fullwidth: 1.0,  // 漢字・ひらがな・その他
        lineWidth: 36    // 1行の最大文字幅
    };

    // localStorageから設定を読み込む
    function loadCharWeights() {
        const saved = localStorage.getItem('editor_char_weights');
        if (saved) {
            try {
                return { ...DEFAULT_CHAR_WEIGHTS, ...JSON.parse(saved) };
            } catch (e) { }
        }
        return { ...DEFAULT_CHAR_WEIGHTS };
    }

    let CHAR_WEIGHTS = loadCharWeights();

    // --- 状態管理 (メモリ内 & ローカルストレージ自動保存) ---
    let texts = [];
    let headlines = [];

    // Supabaseからデータを非同期ロードする関数
    async function loadDataFromSupabase() {
        if (!supabase) return false;
        try {
            // texts の取得
            const { data: dbTexts, error: textsError } = await supabase
                .from('texts')
                .select('*')
                .order('updated_at', { ascending: false });

            if (textsError) throw textsError;

            if (dbTexts) {
                texts = dbTexts.map(t => ({
                    id: t.id,
                    title: t.title,
                    content: t.content,
                    rawCount: t.raw_count,
                    convertedCount: t.converted_count,
                    lineCount: t.line_count,
                    color: t.color,
                    updatedAt: getNowFormatted(new Date(t.updated_at))
                }));
                saveTextsToStorage(); // ローカルキャッシュを更新
            }

            // headlines の取得
            const { data: dbHeadlines, error: hlError } = await supabase
                .from('headlines')
                .select('*')
                .order('created_at', { ascending: true });

            if (hlError) throw hlError;

            if (dbHeadlines) {
                headlines = dbHeadlines.map(h => ({
                    id: h.id,
                    text: h.text
                }));
                saveHeadlinesToStorage(); // ローカルキャッシュを更新
            }
            return true;
        } catch (err) {
            console.error('Supabaseからのデータ取得に失敗しました。ローカルデータを使用します。', err);
            return false;
        }
    }

    // ローカルストレージおよびSupabaseからのデータ復元
    async function loadDataFromStorage() {
        const savedTexts = localStorage.getItem('editor_texts');
        const savedHeadlines = localStorage.getItem('editor_headlines');

        // まずローカルデータを即時に表示してUXを確保
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

        // Supabaseが有効ならクラウドから最新データを取得・同期
        if (supabase) {
            const success = await loadDataFromSupabase();
            if (success) {
                renderHome();
                renderHeadlines();
            }
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

    // --- 一括クラウド保存処理 (Supabase) ---
    async function saveAllToSupabase() {
        if (!supabase) {
            showToast('Supabaseが初期化されていません');
            return;
        }
        
        const saveIcon = saveAllBtn.querySelector('i');
        if (saveIcon) saveIcon.classList.add('animate-spin');

        try {
            // 1. texts（ドキュメント）の全件削除
            const { error: deleteDocsError } = await supabase.from('texts').delete().neq('id', '');
            if (deleteDocsError) throw deleteDocsError;

            // 2. texts（ドキュメント）の全件挿入
            if (texts.length > 0) {
                const dbTexts = texts.map(t => ({
                    id: t.id,
                    title: t.title,
                    content: t.content,
                    raw_count: t.rawCount,
                    converted_count: t.convertedCount,
                    line_count: t.lineCount,
                    color: t.color,
                    updated_at: new Date().toISOString()
                }));
                const { error: insertDocsError } = await supabase.from('texts').insert(dbTexts);
                if (insertDocsError) throw insertDocsError;
            }

            // 3. headlines（ニュース見出し）の全件削除
            const { error: deleteHlError } = await supabase.from('headlines').delete().neq('id', '');
            if (deleteHlError) throw deleteHlError;

            // 4. headlines（ニュース見出し）の全件挿入
            if (headlines.length > 0) {
                const dbHeadlines = headlines.map(h => ({
                    id: h.id,
                    text: h.text,
                    created_at: new Date().toISOString()
                }));
                const { error: insertHlError } = await supabase.from('headlines').insert(dbHeadlines);
                if (insertHlError) throw insertHlError;
            }

            showToast('すべてのデータをクラウドに保存しました');
        } catch (err) {
            console.error('クラウド一括保存エラー:', err);
            showToast('一括保存に失敗しました');
        } finally {
            if (saveIcon) saveIcon.classList.remove('animate-spin');
        }
    }

    // --- 共通保存処理（ローカルLocalStorageへの保存のみ） ---
    function saveCurrentDoc(shouldGoHome = false) {
        const rawText = editor.value;
        const textWithoutAutoLineBreaks = rawText.replace(new RegExp(AUTO_BREAK_MARKER, 'g'), '');
        if (!textWithoutAutoLineBreaks.trim()) {
            if (shouldGoHome) switchTo('home');
            return false; // 空なら保存しない
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
            const index = texts.findIndex(t => t.id === activeDocId);
            if (index !== -1) {
                texts[index] = {
                    ...texts[index],
                    title, content: rawText,
                    rawCount: rCount, convertedCount: cCount,
                    lineCount: calculatedLineCount,
                    updatedAt: getNowFormatted()
                };
            }
        } else {
            const newId = 'doc-' + Date.now();
            texts.unshift({
                id: newId, title, content: rawText,
                rawCount: rCount, convertedCount: cCount,
                lineCount: calculatedLineCount,
                color: "white",
                updatedAt: getNowFormatted()
            });
            activeDocId = newId;
        }

        saveTextsToStorage();
        localStorage.removeItem('editor_draft');

        if (shouldGoHome) {
            switchTo('home');
        }
        return true;
    }

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
        autoSaveTimer = setTimeout(saveCurrentDoc, 1500);
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
            updateActiveLinePreview();
        }
    }

    // --- 文字ウェイト評価 (設定値を参照) ---
    function getCharWidth(char) {
        if (char === '\u200B' || char === '\n' || char === '\r') return 0;
        const code = char.charCodeAt(0);
        if (code >= 0x0020 && code <= 0x007E) return CHAR_WEIGHTS.ascii;
        if (code >= 0xFF61 && code <= 0xFF9F) return CHAR_WEIGHTS.hankakuKana;
        if ((code >= 0x30A0 && code <= 0x30FF) || (code >= 0x31F0 && code <= 0x31FF)) return CHAR_WEIGHTS.katakana;
        return CHAR_WEIGHTS.fullwidth;
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

    // --- 見出し用ボタン表示状態切り替え ---
    function updateHeadlineButtonsUI(isEditing) {
        const cancelHome = headlineCancelBtnHome;
        const iconHome = document.getElementById('headline-btn-icon-home');
        const textHome = document.getElementById('headline-btn-text-home');
        const btnHome = headlineAddBtnHome;

        if (isEditing) {
            cancelHome.classList.remove('hidden');
            cancelHome.classList.add('flex');

            iconHome.className = "fa-solid fa-check";
            textHome.textContent = "確定";

            btnHome.className = "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm px-3 sm:px-5 rounded-xl flex items-center gap-1 sm:gap-1.5 transition-all btn-touch shadow-md shadow-indigo-500/10 whitespace-nowrap h-[46px]";
        } else {
            cancelHome.classList.add('hidden');
            cancelHome.classList.remove('flex');

            iconHome.className = "fa-solid fa-plus";
            textHome.textContent = "追加";

            btnHome.className = "bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-xs sm:text-sm px-3.5 sm:px-5 rounded-xl flex items-center gap-1 sm:gap-1.5 transition-all btn-touch shadow-md shadow-amber-500/10 whitespace-nowrap h-[46px]";
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
        const cntHome = document.getElementById('headline-counter-home');
        if (cntHome) cntHome.classList.add('hidden');
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



    // 編集キャンセル処理
    function cancelEdit() {
        editingHeadlineId = null;
        headlineInputHome.value = '';

        document.getElementById('headline-counter-home').classList.add('hidden');

        updateHeadlineButtonsUI(false);
        renderHeadlines();
        showToast('編集をキャンセルしました');
    }

    headlineCancelBtnHome.addEventListener('click', cancelEdit);

    // 1列隙間なし見出しリストの同期レンダリング
    function renderHeadlines() {
        headlinesListHome.innerHTML = '';

        // 件数バッジを更新
        const count = headlines.length;
        const badgeText = `${count}件`;
        const badgeHome = document.getElementById('headline-count-badge-home');
        if (badgeHome) badgeHome.textContent = badgeText;

        const isEmpty = count === 0;
        if (isEmpty) {
            const emptyHtml = `<p class="text-xs text-slate-400 text-center py-6 bg-white">追加された見出しはありません</p>`;
            headlinesListHome.innerHTML = emptyHtml;
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
            const cntHome = document.getElementById('headline-counter-home');
            if (cntHome) cntHome.classList.add('hidden');
            updateHeadlineButtonsUI(false);
        }
        headlines = headlines.filter(h => h.id !== id);
        saveHeadlinesToStorage();
        showToast('見出しを削除しました');
        renderHeadlines();
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
        const limit = CHAR_WEIGHTS.lineWidth;

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
        updateActiveLinePreview();
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
    function getNowFormatted(dateObj) {
        const now = dateObj instanceof Date && !isNaN(dateObj) ? dateObj : new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${y}/${m}/${d} ${h}:${min}`;
    }

    // --- ドキュメント保存（指定なし・戻るボタンで呼び出す） ---

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

    // --- 一覧に戻る（ローカル保存のみで戻る） ---
    backBtn.addEventListener('click', () => {
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        // 暗証番号なしでローカル保存してホームに戻る
        saveCurrentDoc(true, true);
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
                    <div class="flex items-center space-x-1.5 sm:space-x-3 text-[10px] sm:text-xs text-slate-400">
                        <span>元: <b class="text-slate-600">${doc.rawCount}</b></span>
                        <span><span class="hidden sm:inline">換算</span><span class="inline sm:hidden">換</span>: <b class="text-brand-600">${doc.convertedCount}</b></span>
                        <span>行: <b class="text-emerald-600">${lCount}</b></span>
                    </div>
                    
                    <div class="flex items-center space-x-0.5 sm:space-x-1.5 relative">
                        <button onclick="window.duplicateDoc(event, '${doc.id}')" class="p-1.5 sm:p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100/50 rounded-lg transition-colors btn-touch" title="複製">
                            <i class="fa-regular fa-copy text-sm sm:text-base"></i>
                        </button>
                        <button onclick="window.togglePalette(event, '${doc.id}')" class="p-1.5 sm:p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100/50 rounded-lg transition-colors btn-touch" title="背景色の変更">
                            <i class="fa-solid fa-palette text-sm sm:text-base"></i>
                        </button>
                        <button onclick="window.openDeleteModal('${doc.id}')" class="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors btn-touch" title="削除">
                            <i class="fa-regular fa-trash-can text-sm sm:text-base"></i>
                        </button>

                        <div id="palette-${doc.id}" class="hidden absolute bottom-12 right-0 bg-white border border-slate-200 rounded-xl p-2.5 shadow-xl z-30 animate-in fade-in slide-in-from-bottom-2 duration-150" style="width:156px">
                            <div class="grid grid-cols-5 gap-1.5">
                                <button onclick="window.changeDocColor(event, '${doc.id}', 'white')"  class="w-7 h-7 rounded-full border-2 border-slate-300  bg-white          hover:scale-110 transition-transform shrink-0" title="ホワイト"></button>
                                <button onclick="window.changeDocColor(event, '${doc.id}', 'blue')"   class="w-7 h-7 rounded-full border-2 border-indigo-300   bg-indigo-100       hover:scale-110 transition-transform shrink-0" title="インディゴ"></button>
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

    window.duplicateDoc = function (event, id) {
        if (event) event.stopPropagation();
        const doc = texts.find(t => t.id === id);
        if (doc) {
            const newId = 'doc-' + Date.now();
            let newTitle = doc.title;
            if (!newTitle.endsWith(' - コピー')) {
                newTitle = newTitle + ' - コピー';
            } else {
                newTitle = newTitle + ' - コピー';
            }
            const newDoc = {
                id: newId,
                title: newTitle,
                content: doc.content,
                rawCount: doc.rawCount,
                convertedCount: doc.convertedCount,
                lineCount: doc.lineCount,
                color: doc.color || "white",
                updatedAt: getNowFormatted()
            };
            texts.unshift(newDoc);
            saveTextsToStorage();
            showToast('ドキュメントを複製しました');
            renderHome();
        }
    };

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
            showToast('背景色を変更しました');
            renderHome();
        }
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
        if (!supabase) {
            showToast('Supabaseが初期化されていません（URLやキーの設定をご確認ください）');
            return;
        }

        requestPin("データをロード", async () => {
            const icon = reloadBtn.querySelector('i');
            if (icon) icon.classList.add('animate-spin');

            const success = await loadDataFromSupabase();
            renderHome();
            renderHeadlines();

            if (success) {
                showToast('クラウドと同期しました');
            } else {
                showToast('同期に失敗しました（テーブルが正常に作成されているかご確認ください）');
            }

            if (icon) {
                setTimeout(() => {
                    icon.classList.remove('animate-spin');
                }, 500);
            }
        }, () => {
            showToast('ロードをキャンセルしました');
        });
    });

    // 一括セーブボタンのアクション（暗証番号要求）
    saveAllBtn.addEventListener('click', () => {
        if (!supabase) {
            showToast('Supabaseが初期化されていません（URLやキーの設定をご確認ください）');
            return;
        }

        requestPin("すべてのデータを保存", async () => {
            await saveAllToSupabase();
        }, () => {
            showToast('保存をキャンセルしました');
        });
    });

    function escapeHtml(string) {
        if (typeof string !== 'string') return '';
        return string.replace(/[&<>"']/g, function (match) {
            const escape = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
            return escape[match];
        });
    }

    // ==================== 設定モーダル ====================
    const settingsModal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    const settingsSaveBtn = document.getElementById('settings-save-btn');
    const settingsResetBtn = document.getElementById('settings-reset-btn');

    const inputLineWidth = document.getElementById('setting-line-width');
    const inputAscii = document.getElementById('setting-weight-ascii');
    const inputHankakuKana = document.getElementById('setting-weight-hankaku-kana');
    const inputKatakana = document.getElementById('setting-weight-katakana');
    const inputFullwidth = document.getElementById('setting-weight-fullwidth');

    // モーダルを開く（現在の設定値をフォームに反映）
    function openSettingsModal() {
        inputLineWidth.value = CHAR_WEIGHTS.lineWidth;
        inputAscii.value = CHAR_WEIGHTS.ascii;
        inputHankakuKana.value = CHAR_WEIGHTS.hankakuKana;
        inputKatakana.value = CHAR_WEIGHTS.katakana;
        inputFullwidth.value = CHAR_WEIGHTS.fullwidth;

        settingsModal.classList.remove('hidden');
        settingsModal.classList.add('flex');
    }

    // モーダルを閉じる
    function closeSettingsModal() {
        settingsModal.classList.add('hidden');
        settingsModal.classList.remove('flex');
    }

    settingsBtn.addEventListener('click', openSettingsModal);
    settingsCloseBtn.addEventListener('click', closeSettingsModal);
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettingsModal();
    });

    // 設定を保存して適用
    settingsSaveBtn.addEventListener('click', () => {
        const lw = parseFloat(inputLineWidth.value);
        const wa = parseFloat(inputAscii.value);
        const wh = parseFloat(inputHankakuKana.value);
        const wk = parseFloat(inputKatakana.value);
        const wf = parseFloat(inputFullwidth.value);

        if ([lw, wa, wh, wk, wf].some(v => isNaN(v) || v <= 0)) {
            showToast('正しい数値を入力してください');
            return;
        }

        CHAR_WEIGHTS = { lineWidth: lw, ascii: wa, hankakuKana: wh, katakana: wk, fullwidth: wf };
        localStorage.setItem('editor_char_weights', JSON.stringify(CHAR_WEIGHTS));

        closeSettingsModal();
        showToast('設定を適用しました');

        // エディタが開いていれば即時再処理
        if (!editorScreen.classList.contains('hidden')) {
            processText();
        }
    });

    // デフォルトに戻す
    settingsResetBtn.addEventListener('click', () => {
        CHAR_WEIGHTS = { ...DEFAULT_CHAR_WEIGHTS };
        localStorage.removeItem('editor_char_weights');

        closeSettingsModal();
        showToast('デフォルト設定に戻しました');

        if (!editorScreen.classList.contains('hidden')) {
            processText();
        }
    });

    // --- アクティブ行プレビューのロジック ---
    const activeLinePreview = document.getElementById('active-line-preview');
    const previewLineNum = document.getElementById('preview-line-num');
    const previewCharCount = document.getElementById('preview-char-count');
    const previewText = document.getElementById('preview-text');

    function updateActiveLinePreview() {
        if (!activeLinePreview || !previewLineNum || !previewCharCount || !previewText) return;
        const text = editor.value;
        if (!text) {
            activeLinePreview.classList.add('hidden');
            return;
        }

        const selectionStart = editor.selectionStart;
        const beforeText = text.substring(0, selectionStart);

        // 改行コードで分割し、カーソルが何行目にあるかを求める（1-indexed）
        const lines = text.split('\n');
        const currentLineIndex = beforeText.split('\n').length - 1;
        const currentLineText = lines[currentLineIndex] || '';

        // 特殊改行コード \u200B を取り除いた、実際のテキストを表示用とする
        const cleanLineText = currentLineText.replace(/\u200B/g, '');

        // プレビューの更新
        previewLineNum.textContent = currentLineIndex + 1;

        // 全角カナ(0.7)、半角英数(0.5)などを考慮した換算文字数を計算
        const lineCharWidth = getStringWidth(cleanLineText);
        previewCharCount.textContent = formatCountValue(lineCharWidth);

        // 表示するテキストが空でなければプレビューを表示する
        if (cleanLineText.trim() !== '') {
            previewText.textContent = cleanLineText;
            activeLinePreview.classList.remove('hidden');
        } else {
            previewText.innerHTML = '<span class="text-slate-400 font-normal italic">（空の行）</span>';
            activeLinePreview.classList.remove('hidden');
        }
    }

    // イベントの紐付け
    editor.addEventListener('keyup', updateActiveLinePreview);
    editor.addEventListener('click', updateActiveLinePreview);
    editor.addEventListener('select', updateActiveLinePreview);
    editor.addEventListener('input', updateActiveLinePreview);
    editor.addEventListener('focus', updateActiveLinePreview);

    // 初期化
    loadDataFromStorage();
    renderHome();
    renderHeadlines();
});
