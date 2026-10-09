(function () {
    "use strict";

    const E = BingoEngine;
    const STORAGE_KEY = "trickcal.bingo.v1";
    const TARGET = E.DEFAULT_CONFIG.clearTarget;
    const defaultValues = () => Object.fromEntries(E.ITEMS.map(item => [item.key, item.value]));
    // overrides には、自分で入力して初期値から変えた項目だけを持つ (初期値を更新したときに反映されるように)
    const defaultSettings = () => ({ depth: 2, overrides: {} });
    const effectiveValues = () => Object.assign(defaultValues(), settings.overrides);
    // 価値が 1 つも入っていない間は、参考サイトと同じ仮の重み (マス 1 / 縦横 3 / 斜め 7) で動かす
    const FALLBACK = { cellValue: 1, lineValue: 3, diagValue: 7 };

    let filled = new Array(E.CELLS).fill(false);
    let cur = -1;
    let held = -1;
    let moves = 0;
    let found = {}; // 開けた大物マスの数 (E.BIG_CELLS の key → 個数)
    let editing = false; // 盤面をタップで修正中 (「計算する」を押すまで計算しない)
    let history = [];
    let settings = defaultSettings();
    let suggestions = [];
    let selected = 0;
    let requestId = 0;
    let worker = null;
    let pending = false;

    const $ = id => document.getElementById(id);

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ filled, cur, held, moves, found, history, settings }));
        } catch (e) { /* 保存できなくても動作は続ける */ }
    }

    function load() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
            if (!data) return;
            if (Array.isArray(data.filled) && data.filled.length === E.CELLS) filled = data.filled.map(Boolean);
            if (Number.isInteger(data.cur)) cur = data.cur;
            if (Number.isInteger(data.held)) held = data.held;
            if (Number.isInteger(data.moves)) moves = data.moves;
            if (data.found && typeof data.found === "object") found = data.found;
            if (Array.isArray(data.history)) history = data.history;
            if (data.settings) {
                const base = defaultSettings();
                if (Number.isInteger(data.settings.depth)) base.depth = data.settings.depth;
                if (data.settings.overrides) {
                    base.overrides = data.settings.overrides;
                } else if (data.settings.values) {
                    // 旧形式は全項目を保存していた。空欄 (null) と初期値と同じ値は捨て、変えた値だけ引き継ぐ
                    const defaults = defaultValues();
                    for (const [key, v] of Object.entries(data.settings.values)) {
                        if (key in defaults && Number.isFinite(v) && v !== defaults[key]) base.overrides[key] = v;
                    }
                }
                settings = base;
            }
        } catch (e) { /* 壊れたデータは無視 */ }
    }

    function derived() {
        const rewards = E.deriveRewards(effectiveValues());
        const usable = rewards.cellValue > 0 || rewards.lineValue > 0 || rewards.diagValue > 0;
        return { rewards, usable, used: usable ? rewards : FALLBACK };
    }

    // まだ開いていないマス 1 個の期待値。開けた大物マスに応じて変わる。
    function unopenedValue() {
        const { used, usable } = derived();
        if (!usable) return used.cellValue;
        return E.unopenedCellValue(effectiveValues(), filled.filter(Boolean).length, found);
    }

    // fresh = true はまっさらな盤面 (基準効率の計算用)。マスの価値は全マスの平均。
    function buildConfig(fresh) {
        const { rewards, used, usable } = derived();
        const cellValue = fresh ? used.cellValue : unopenedValue();
        return {
            cellValues: new Array(E.CELLS).fill(cellValue),
            // ライン報酬は、ラインごとの価値 (中央の行と列は教団証)。仮の重みのときは一律
            rowBonus: usable ? rewards.rowValues : new Array(E.SIZE).fill(used.lineValue),
            colBonus: usable ? rewards.colValues : new Array(E.SIZE).fill(used.lineValue),
            diagBonus: usable ? rewards.diagValues : [used.diagValue, used.diagValue],
            // 仮の重みで動かしている間は、換算の合わないラウンド報酬を使わない
            roundReward: usable ? rewards.roundValue : 0,
            depth: settings.depth
        };
    }

    function iconFor(shapeIndex) {
        const shape = E.SHAPES[shapeIndex];
        const el = document.createElement("div");
        if (shape.id === "h") {
            el.className = "icon line-h";
            for (let i = 0; i < 7; i++) el.appendChild(Object.assign(document.createElement("i"), { className: "on" }));
        } else if (shape.id === "v") {
            el.className = "icon line-v";
            for (let i = 0; i < 7; i++) el.appendChild(Object.assign(document.createElement("i"), { className: "on" }));
        } else {
            el.className = "icon box";
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const on = shape.cells.some(([rr, cc]) => rr === r && cc === c);
                    el.appendChild(Object.assign(document.createElement("i"), { className: on ? "on" : "" }));
                }
            }
        }
        return el;
    }

    function buildPicker(containerId, getValue, setValue) {
        const box = $(containerId);
        box.innerHTML = "";
        E.SHAPES.forEach((shape, index) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "pick" + (getValue() === index ? " on" : "");
            btn.appendChild(iconFor(index));
            btn.appendChild(document.createTextNode(shape.name));
            btn.onclick = () => {
                setValue(index);
                save();
                render();
                recompute();
            };
            box.appendChild(btn);
        });
    }

    function boardMask() {
        return E.boardFromArray(filled);
    }

    function renderStatus() {
        const { lo, hi } = boardMask();
        const raw = E.rawScore(lo, hi);
        // 次のラウンドへは達成率 100% になるまで進めないので、それまで判定欄は出さない
        $("reset-card").hidden = raw < TARGET;
        $("btn-reset").hidden = raw < TARGET;
        if (raw < TARGET) $("dock-verdict").hidden = true;
        const percent = Math.min(100, Math.floor(raw / TARGET * 100));
        $("progress").textContent = percent + "%";
        $("meter-bar").style.width = percent + "%";
        $("filled").textContent = E.popcount(lo) + E.popcount(hi);
        $("bingos").textContent = E.countBingos(lo, hi);
        $("moves").textContent = moves;
    }

    function renderBoard() {
        const box = $("board");
        if (!box.children.length) {
            for (let i = 0; i < E.CELLS; i++) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "cell";
                btn.setAttribute("aria-label", `${Math.floor(i / E.SIZE) + 1}行${(i % E.SIZE) + 1}列`);
                btn.onclick = () => {
                    filled[i] = !filled[i];
                    startEditing();
                };
                box.appendChild(btn);
            }
        }
        const move = suggestions[selected];
        const placing = move ? new Set(move.cells) : new Set();
        Array.from(box.children).forEach((btn, i) => {
            let cls = "cell";
            if (placing.has(i)) cls += filled[i] ? " dup" : " new";
            else if (filled[i]) cls += " filled";
            btn.className = cls;
        });
    }

    // 盤面の修正中は計算せず、「計算する」が押されるか、ほかの操作をしたときにまとめて計算する
    function startEditing() {
        editing = true;
        requestId++; // 計算中の結果は捨てる
        suggestions = [];
        selected = 0;
        save();
        render();
        renderBig();
        $("reset-advice").textContent = "盤面の修正が終わったら「計算する」を押してください。";
    }

    function renderBig() {
        const box = $("big-cells");
        box.innerHTML = "";
        const setFound = (big, n) => {
            const v = Math.min(big.count, Math.max(0, n));
            if (v > 0) found[big.key] = v;
            else delete found[big.key];
            save();
            renderBig();
            recompute();
        };
        E.BIG_CELLS.forEach(big => {
            const n = E.foundCountOf(found, big);
            if (big.count === 1) {
                const label = document.createElement("label");
                const check = document.createElement("input");
                check.type = "checkbox";
                check.checked = n > 0;
                check.onchange = () => setFound(big, check.checked ? 1 : 0);
                label.appendChild(check);
                label.appendChild(document.createTextNode(big.label));
                box.appendChild(label);
                return;
            }
            // 同じ中身のマスが複数ある大物は、開けた数を数える
            const row = document.createElement("div");
            row.className = "big-counter";
            const minus = document.createElement("button");
            minus.type = "button";
            minus.textContent = "−";
            minus.setAttribute("aria-label", `${big.label}を1つ減らす`);
            minus.disabled = n <= 0;
            minus.onclick = () => setFound(big, n - 1);
            const plus = document.createElement("button");
            plus.type = "button";
            plus.textContent = "+";
            plus.setAttribute("aria-label", `${big.label}を1つ増やす`);
            plus.disabled = n >= big.count;
            plus.onclick = () => setFound(big, n + 1);
            const text = document.createElement("span");
            text.textContent = `${big.label} を開けた数 ${n} / ${big.count}`;
            row.append(minus, plus, text);
            box.appendChild(row);
        });
        const { rewards, usable } = derived();
        $("big-note").textContent = usable
            ? `まだ開いていないマス 1 個の期待値 ${fmtK(unopenedValue())}(全マスの平均 ${fmtK(rewards.cellValue)})`
            : "";
        $("btn-calc").hidden = !editing;
    }

    function describe(move) {
        const shape = E.SHAPES[move.shape];
        const fresh = move.cells.filter(i => !filled[i]).length;
        const dup = move.cells.length - fresh;
        const where = shape.id === "v" ? `${move.c + 1}列目`
            : shape.id === "h" ? `${move.r + 1}行目`
            : `左上が${move.r + 1}行${move.c + 1}列の位置`;
        return `${shape.name}を${where}に置く(+${fresh}マス${dup ? `・被り${dup}` : ""})`;
    }

    function renderResult() {
        const result = $("result");
        const alts = $("alts");
        alts.innerHTML = "";
        $("btn-apply").disabled = true;
        $("alts-box").hidden = true;
        if (cur < 0 || held < 0) {
            result.textContent = held < 0
                ? "フリップを2枚選んでください(上下の段で1枚ずつ)。"
                : "新しく引いたフリップを、選んでいない方の段で選んでください。";
            return;
        }
        if (!suggestions.length) {
            result.textContent = editing ? "盤面の修正が終わったら「計算する」を押してください。" : "計算中…";
            return;
        }
        const move = suggestions[selected];
        // 表示するのは、この手で得られる報酬 (新しく埋まるマス + 完成するライン + ラウンド報酬)。
        // 並び順と「最善」は、次の手以降まで先読みした期待値で決めている。
        result.innerHTML = `<b>${describe(move)}</b><br>この手で +${fmtK(move.rewardGain)}`
            + (selected === 0 ? "(最善)" : "");
        $("alts-box").hidden = suggestions.length < 2;
        suggestions.slice(0, 5).forEach((m, i) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "alt" + (i === selected ? " sel" : "");
            btn.textContent = `${i + 1}. ${describe(m)}  [+${fmtK(m.rewardGain)}]`;
            btn.onclick = () => {
                selected = i;
                renderBoard();
                renderResult();
            };
            alts.appendChild(btn);
        });
        $("btn-apply").disabled = false;
    }

    function renderReset(data) {
        const box = $("reset-advice");
        $("dock-verdict").hidden = true;
        if (!data) {
            box.textContent = cur < 0 || held < 0 ? "フリップを選ぶと判定します。" : "計算中…";
            return;
        }
        const { canReset, keep, shouldReset } = data.reset;
        const rate = data.fresh.rate;
        const freshNote = `<small>まっさらな盤面の平均効率: 1手あたり ${fmtK(rate)}`
            + `(100%に届いてから${data.fresh.extra ? `さらに${data.fresh.extra}手開けて` : "すぐに"}次のラウンドへ進むのが最適。1ラウンド平均${fmt(data.fresh.flips)}手)</small>`;
        if (!canReset) return;
        const short = $("dock-verdict");
        short.hidden = false;
        short.textContent = shouldReset ? "100%到達: 次のラウンドへ進む方が得" : `100%到達: 続ける方が得(+${fmtK(keep.value)}、あと約${keep.flips}手)`;
        const verdict = shouldReset
            ? "<b>次のラウンドへ進む方が得</b>です。"
            : "<b>このまま続ける方が得</b>です。";
        box.innerHTML = `${verdict}<br>`
            + (shouldReset
                ? "続けても、まっさらな盤面の平均効率を上回りません。<br>"
                : `続行すると、まっさらな盤面の平均効率より +${fmtK(keep.value)} 多く得られる見込み(あと約${keep.flips}手)<br>`)
            + freshNote;
    }

    function render() {
        buildPicker("pick-cur", () => cur, v => { cur = v; });
        buildPicker("pick-held", () => held, v => { held = v; });
        renderStatus();
        renderBoard();
        renderResult();
    }

    function handleResponse(data) {
        if (data.id !== requestId) return;
        if (data.error) {
            $("result").textContent = "計算エラー: " + data.error;
            return;
        }
        suggestions = data.moves;
        selected = 0;
        renderBoard();
        renderResult();
        if (!suggestions.length) $("result").innerHTML = '<span class="warn">置ける場所がありません</span>';
        renderReset(data);
    }

    function recompute() {
        editing = false;
        suggestions = [];
        selected = 0;
        renderBoard();
        renderBig();
        if (cur < 0 || held < 0) {
            renderResult();
            renderReset(null);
            return;
        }
        renderResult();
        renderReset(null);
        const { lo, hi } = boardMask();
        const payload = { id: ++requestId, state: { lo, hi, cur, held }, config: buildConfig(false), freshConfig: buildConfig(true) };
        if (worker) {
            // 前の計算が終わっていなければ打ち切る (結果は捨てるだけなので、待つと操作が溜まって遅れる)
            if (pending) startWorker();
            pending = true;
            worker.postMessage(payload);
            return;
        }
        // Worker が使えない環境ではメインスレッドで計算する
        setTimeout(() => {
            try {
                const result = E.suggest(payload.state, payload.config);
                const fresh = E.estimateFreshRate(payload.freshConfig);
                const reset = E.adviseReset(payload.state, payload.config, fresh);
                handleResponse({ id: payload.id, moves: result.moves.slice(0, 6), fresh, reset });
            } catch (error) {
                handleResponse({ id: payload.id, error: String(error.message || error) });
            }
        }, 20);
    }

    function applySelected() {
        const move = suggestions[selected];
        if (!move) return;
        history.push({ filled: filled.slice(), cur, held, moves, found: Object.assign({}, found) });
        move.cells.forEach(i => { filled[i] = true; });
        moves++;
        held = move.keep;
        cur = -1;
        suggestions = [];
        save();
        render();
        renderBig();
        renderReset(null);
    }

    function undo() {
        const prev = history.pop();
        if (!prev) return;
        filled = prev.filled;
        cur = prev.cur;
        held = prev.held;
        moves = prev.moves;
        found = prev.found || {};
        save();
        render();
        recompute();
    }

    function resetBoard() {
        if (!confirm("次のラウンドへ進みますか?(盤面・ホールド・手持ちが空になります)")) return;
        history.push({ filled: filled.slice(), cur, held, moves, found: Object.assign({}, found) });
        filled = new Array(E.CELLS).fill(false);
        moves = 0;
        cur = -1;
        held = -1;
        found = {};
        save();
        render();
        recompute();
    }

    const fmt = n => n.toLocaleString("ja-JP", { maximumFractionDigits: 1 });
    // 報酬はゴールド換算で桁が大きいので、1,000 以上は k 単位にまとめる
    const fmtK = n => Math.abs(n) >= 1000
        ? (n / 1000).toLocaleString("ja-JP", { maximumFractionDigits: 0 }) + "k"
        : Math.round(n).toLocaleString("ja-JP");

    function renderValueSummary() {
        const { rewards, usable } = derived();
        const missing = rewards.missing.length ? `<br>価値 0 のアイテム: ${rewards.missing.join("、")}` : "";
        $("value-summary").innerHTML = usable
            ? `マス 1 個の平均 ${fmt(rewards.cellValue)} / 縦横ライン 1 本の平均 ${fmt(rewards.lineValue)} / 斜め 1 本の平均 ${fmt(rewards.diagValue)} / ラウンド報酬 ${fmt(rewards.roundValue)}${missing}`
            : "価値が未入力のため、仮の重み(マス 1 / 縦横 3 / 斜め 7)で計算しています。";
    }

    function buildValueTable() {
        const table = $("value-table");
        table.innerHTML = "<tr><th>アイテム</th><th>マス計</th><th>ライン計</th><th>ラウンド</th><th>1個の価値</th></tr>";
        E.ITEMS.forEach(item => {
            const row = document.createElement("tr");
            const input = document.createElement("input");
            input.type = "number";
            input.min = "0";
            input.step = "any";
            input.inputMode = "decimal";
            // 表示は小数 4 桁まで。計算には、変更しない限り元の値をそのまま使う
            const shown = v => (v === null || v === undefined ? "" : String(Math.round(v * 10000) / 10000));
            input.value = shown(effectiveValues()[item.key]);
            const markUnset = () => row.classList.toggle("unset", !(parseFloat(input.value) > 0));
            input.onchange = () => {
                const v = parseFloat(input.value);
                // 空欄にすると初期値に戻す
                if (Number.isFinite(v) && v >= 0 && v !== item.value && input.value !== shown(item.value)) settings.overrides[item.key] = v;
                else delete settings.overrides[item.key];
                input.value = shown(effectiveValues()[item.key]);
                markUnset();
                renderValueSummary();
                save();
                recompute();
            };
            const lineUnits = item.lines + item.diags;
            row.innerHTML = `<td>${item.label}</td><td class="num">${item.cells ? fmt(item.cells) : "-"}</td><td class="num">${lineUnits ? fmt(lineUnits) : "-"}</td><td class="num">${item.rounds ? fmt(item.rounds) : "-"}</td><td></td>`;
            row.lastChild.appendChild(input);
            markUnset();
            table.appendChild(row);
        });
    }

    function bindSettings() {
        const sync = () => {
            $("cfg-depth").value = settings.depth;
            buildValueTable();
            renderValueSummary();
        };
        sync();
        $("cfg-depth").onchange = () => {
            settings.depth = Math.round(parseFloat($("cfg-depth").value)) || 2;
            save();
            recompute();
        };
        $("cfg-default").onclick = () => {
            settings = defaultSettings();
            sync();
            save();
            recompute();
        };
    }

    function startWorker() {
        if (worker) worker.terminate();
        pending = false;
        try {
            worker = new Worker("worker.js");
            worker.onmessage = event => {
                pending = false;
                handleResponse(event.data);
            };
            worker.onerror = () => { worker = null; pending = false; recompute(); };
        } catch (e) {
            worker = null;
        }
    }

    function init() {
        load();
        startWorker();
        $("btn-apply").onclick = applySelected;
        $("btn-undo").onclick = undo;
        $("btn-reset").onclick = resetBoard;
        $("btn-calc").onclick = recompute;
        bindSettings();
        render();
        recompute();
    }

    init();
})();
