(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = api;
    } else {
        root.BingoEngine = api;
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    // 7x7 盤面。セル番号は row * 7 + col。盤面は 2 つの整数 (lo: 0..24, hi: 25..48) のビットマスクで持つ。
    const SIZE = 7;
    const CELLS = SIZE * SIZE;
    const LO_BITS = 25;

    // フリップの形。回転なし。out=true は盤面外へのはみ出しを許可する形。
    const SHAPES = [
        { id: "v", name: "縦ライン", out: false, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0]] },
        { id: "h", name: "横ライン", out: false, cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]] },
        { id: "sq", name: "正方形", out: true, cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] },
        { id: "cross", name: "十字", out: true, cells: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]] },
        { id: "x", name: "X字", out: true, cells: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]] }
    ];

    // 初期値は参考シミュレーターと同じ比率 (マス 1 / 縦横ライン 3 / 斜め 7)
    const DEFAULT_CONFIG = {
        cellValues: new Array(CELLS).fill(1),
        rowBonus: new Array(SIZE).fill(3),
        colBonus: new Array(SIZE).fill(3),
        diagBonus: [7, 7], // 左上→右下, 右上→左下
        pieceWeights: [1, 1, 1, 1, 1],
        roundReward: 20, // ラウンド報酬 (達成率 100% で 1 回だけ得る。マス 1 個の平均報酬を 1 とした換算)
        clearTarget: 65, // 達成率 100% とみなす素点 (マス 1 / 縦横 3 / 斜め 7 換算)
        clearBonus: 0, // >0 で「早くクリアするほど得」を評価に加える (達成優先モード)
        lineShaping: 0, // 未完成ラインの途中経過をどれだけ評価するか (シミュレーションでは効果なしだったので 0)
        depth: 2,
        beam: 4
    };

    // 報酬アイテムと、1 枚の盤面に含まれる個数 (Wiki「ビンゴイベント」イードの永遠の夢路の一覧。
    // 中身は各盤面で共通、場所だけランダム)。
    //   cells: 49 マスに入っている合計個数
    //   lines: 縦横 14 本のライン報酬の合計個数 (どのラインに付くかは固定でないので平均で扱う)
    //   diags: 斜め 2 本のライン報酬の合計個数
    //   rounds: ラウンド報酬の個数 (キャンディ 100 で固定。1〜4 ラウンドの別報酬は確実に回収できるので除く)
    // value: 初期値の価値 (ゴールド換算。null は未入力)。出どころ:
    //   モカロン・マシュマロ・教団証 … おすすめショップ表の「試算ゴールド」(モカロンはレート 1.5/G)
    //   装備の定石 … ★4 設計図の試算 12,158 ÷ 定石 10 個 (Wiki 装備設計図: ランク 4 の欠片 1 枚 = 定石 10)
    //   シューカロン … マス 1 個の価値をモカロンのマスと同じにする
    //   研究素材 … 下級 = エリーフ 3、中級 = エリーフ 10 (鉛・基板などの加工品は下級 3 個分)
    //   基本合成カード … 試算なし。買値 5,900 を仮置き
    //   エリーフ・スターキャンディ・キャンディ … えびやんの記事 (円換算 ÷ 0.0004 円)
    const ELIEF_VALUE = 1667;
    const MOCARON_VALUE = 1 / 1.5;
    const ITEMS = [
        { key: "gold", label: "ゴールド", cells: 330000, lines: 0, diags: 0, rounds: 0, value: 1 },
        { key: "mocaron", label: "モカロン", cells: 105000, lines: 0, diags: 0, rounds: 0, value: MOCARON_VALUE },
        // モカロンのマス 7 個 (合計 105,000) と、シューカロンのマス 6 個 (合計 13,500) の 1 マスあたりの価値を揃える
        { key: "shucaron", label: "シューカロン", cells: 13500, lines: 0, diags: 0, rounds: 0, value: MOCARON_VALUE * (105000 / 7) / (13500 / 6) },
        { key: "teiseki", label: "装備の定石", cells: 105, lines: 0, diags: 0, rounds: 0, value: 12158 / 10 },
        { key: "card", label: "基本合成カード", cells: 21, lines: 0, diags: 0, rounds: 0, value: 5900 },
        { key: "kyodansho", label: "教団証", cells: 10, lines: 10, diags: 0, rounds: 0, value: 42000 },
        { key: "lowMarsh", label: "下級マシュマロ選択箱", cells: 20, lines: 0, diags: 0, rounds: 0, value: 305 },
        { key: "midMarsh", label: "中級マシュマロ選択箱", cells: 8, lines: 0, diags: 0, rounds: 0, value: 330 },
        { key: "highMarsh", label: "上級マシュマロ選択箱", cells: 4, lines: 0, diags: 0, rounds: 0, value: 3225 },
        // 下級: 鉄粉 3・金箔 3・再生プラスチック 1・睡眠アイマスク 1・銅の匙 1
        { key: "materialLow", label: "研究素材(下級)", cells: 9, lines: 0, diags: 0, rounds: 0, value: 3 * ELIEF_VALUE },
        // 中級: 地球から来た鉛・バラバラの基板・柔らか金属・曲がった針金 各 1
        { key: "materialMid", label: "研究素材(中級)", cells: 4, lines: 0, diags: 0, rounds: 0, value: 10 * ELIEF_VALUE },
        { key: "elief", label: "エリーフ", cells: 0, lines: 80, diags: 100, rounds: 0, value: ELIEF_VALUE },
        { key: "starCandy", label: "スターキャンディ", cells: 0, lines: 40, diags: 0, rounds: 0, value: 1759 },
        { key: "candy", label: "キャンディ", cells: 0, lines: 0, diags: 0, rounds: 100, value: 625 }
    ];
    const ROW_COL_LINES = 14;
    const DIAG_LINES = 2;

    // アイテムごとの価値 (values[key]、未入力は 0 扱い) から、探索に渡す報酬量を求める。
    // cellValue = マス 1 個の平均、lineValue = 縦横ライン 1 本の平均、diagValue = 斜め 1 本の平均、
    // roundValue = ラウンド報酬 1 回分。
    function deriveRewards(values) {
        let cellTotal = 0;
        let lineTotal = 0;
        let diagTotal = 0;
        let roundTotal = 0;
        const missing = [];
        for (const item of ITEMS) {
            const v = Number(values && values[item.key]);
            const value = Number.isFinite(v) && v > 0 ? v : 0;
            if (value === 0) missing.push(item.label);
            cellTotal += item.cells * value;
            lineTotal += item.lines * value;
            diagTotal += item.diags * value;
            roundTotal += item.rounds * value;
        }
        return {
            cellValue: cellTotal / CELLS,
            lineValue: lineTotal / ROW_COL_LINES,
            diagValue: diagTotal / DIAG_LINES,
            roundValue: roundTotal,
            missing
        };
    }

    // 価値が飛び抜けている 2 マス。開けたかどうかで、残りのマスの期待値が大きく変わる。
    const BIG_CELLS = [
        { key: "kyodansho10", label: "教団証 10 個", item: "kyodansho", amount: 10 },
        { key: "gold250k", label: "ゴールド 250,000", item: "gold", amount: 250000 }
    ];

    // まだ開いていないマス 1 個の期待値。found[key] が true の大物マスは開いた (中身を得た) とみなす。
    // 大物以外のマスは中身を区別せず、開いたマスにはその平均が入っていたとして扱う。
    function unopenedCellValue(values, opened, found) {
        const total = deriveRewards(values).cellValue * CELLS;
        const remaining = CELLS - opened;
        if (remaining <= 0) return 0;
        let bigTotal = 0;
        let bigFound = 0;
        let foundCount = 0;
        for (const big of BIG_CELLS) {
            const v = Number(values && values[big.item]);
            const value = (Number.isFinite(v) && v > 0 ? v : 0) * big.amount;
            bigTotal += value;
            if (found && found[big.key]) {
                bigFound += value;
                foundCount++;
            }
        }
        const restAverage = (total - bigTotal) / (CELLS - BIG_CELLS.length);
        const openedRest = Math.max(0, opened - foundCount);
        return Math.max(0, (total - bigFound - openedRest * restAverage) / remaining);
    }

    function bit(i) {
        return i < LO_BITS ? [1 << i, 0] : [0, 1 << (i - LO_BITS)];
    }

    function popcount(x) {
        x = x - ((x >>> 1) & 0x55555555);
        x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
        return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
    }

    function maskOf(indices) {
        let lo = 0;
        let hi = 0;
        for (const i of indices) {
            const [l, h] = bit(i);
            lo |= l;
            hi |= h;
        }
        return { lo, hi };
    }

    // 全ライン: 行 7 本 → 列 7 本 → 斜め 2 本
    const LINES = [];
    for (let r = 0; r < SIZE; r++) {
        LINES.push({ kind: "row", index: r, cells: Array.from({ length: SIZE }, (_, c) => r * SIZE + c) });
    }
    for (let c = 0; c < SIZE; c++) {
        LINES.push({ kind: "col", index: c, cells: Array.from({ length: SIZE }, (_, r) => r * SIZE + c) });
    }
    LINES.push({ kind: "diag", index: 0, cells: Array.from({ length: SIZE }, (_, i) => i * SIZE + i) });
    LINES.push({ kind: "diag", index: 1, cells: Array.from({ length: SIZE }, (_, i) => i * SIZE + (SIZE - 1 - i)) });
    for (const line of LINES) {
        Object.assign(line, maskOf(line.cells));
    }

    // 形ごとの全配置 (新規マスの有無に関わらず、盤面内に 1 マス以上載るもの)
    const PLACEMENTS = SHAPES.map(shape => {
        const list = [];
        for (let r = -2; r < SIZE; r++) {
            for (let c = -2; c < SIZE; c++) {
                let valid = true;
                const cells = [];
                for (const [dr, dc] of shape.cells) {
                    const rr = r + dr;
                    const cc = c + dc;
                    if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) {
                        cells.push(rr * SIZE + cc);
                    } else if (!shape.out) {
                        valid = false;
                    }
                }
                if (valid && cells.length > 0) {
                    list.push({ r, c, cells, ...maskOf(cells) });
                }
            }
        }
        return list;
    });

    function lineBonus(config, line) {
        if (line.kind === "row") return config.rowBonus[line.index];
        if (line.kind === "col") return config.colBonus[line.index];
        return config.diagBonus[line.index];
    }

    function cellMaskToArray(lo, hi) {
        const filled = new Array(CELLS).fill(false);
        for (let i = 0; i < CELLS; i++) {
            filled[i] = i < LO_BITS ? (lo & (1 << i)) !== 0 : (hi & (1 << (i - LO_BITS))) !== 0;
        }
        return filled;
    }

    function boardFromArray(filled) {
        return maskOf(filled.reduce((acc, on, i) => (on ? acc.concat(i) : acc), []));
    }

    function isFilled(lo, hi, i) {
        return i < LO_BITS ? (lo & (1 << i)) !== 0 : (hi & (1 << (i - LO_BITS))) !== 0;
    }

    // 素点: マス 1 / 縦横ライン 3 / 斜め 7。達成率の表示と達成優先モードの基準。
    function rawScore(lo, hi) {
        let score = popcount(lo) + popcount(hi);
        for (const line of LINES) {
            if ((lo & line.lo) === line.lo && (hi & line.hi) === line.hi) {
                score += line.kind === "diag" ? 7 : 3;
            }
        }
        return score;
    }

    function countBingos(lo, hi) {
        let n = 0;
        for (const line of LINES) {
            if ((lo & line.lo) === line.lo && (hi & line.hi) === line.hi) n++;
        }
        return n;
    }

    // 報酬量 (設定した重み付き) + 未完成ラインの途中経過ボーナス
    function makeEvaluator(config) {
        const vals = config.cellValues;
        const bonuses = LINES.map(line => lineBonus(config, line));
        const shaping = config.lineShaping;
        const roundReward = config.roundReward || 0;
        const target = config.clearTarget;
        return function evaluate(lo, hi) {
            let total = 0;
            let raw = 0;
            for (let i = 0; i < CELLS; i++) {
                if (i < LO_BITS ? lo & (1 << i) : hi & (1 << (i - LO_BITS))) {
                    total += vals[i];
                    raw += 1;
                }
            }
            for (let j = 0; j < LINES.length; j++) {
                const line = LINES[j];
                const n = popcount(lo & line.lo) + popcount(hi & line.hi);
                if (n === SIZE) {
                    total += bonuses[j];
                    raw += line.kind === 'diag' ? 7 : 3;
                } else if (shaping > 0) {
                    const p = n / SIZE;
                    total += bonuses[j] * shaping * p * p;
                }
            }
            if (roundReward > 0 && raw >= target) total += roundReward;
            return total;
        };
    }

    // 指し手の列挙。手持ちかホールドのどちらかを置き、置かなかった方が次のホールドになる。
    // ホールドは常に埋まっている前提 (held < 0 のときは手持ちだけが候補)。
    function generateMoves(lo, hi, cur, held) {
        const moves = [];
        const seen = new Set();
        const sources = [{ shape: cur, from: "cur", keep: held }];
        if (held >= 0) sources.push({ shape: held, from: "hold", keep: cur });
        for (const src of sources) {
            for (const p of PLACEMENTS[src.shape]) {
                if ((p.lo & ~lo) === 0 && (p.hi & ~hi) === 0) continue; // 新規マスなし
                const nlo = lo | p.lo;
                const nhi = hi | p.hi;
                const key = nlo + "," + nhi + "," + src.keep;
                if (seen.has(key)) continue;
                seen.add(key);
                moves.push({ type: "place", from: src.from, shape: src.shape, r: p.r, c: p.c, cells: p.cells, lo: nlo, hi: nhi, keep: src.keep });
            }
        }
        return moves;
    }

    function suggest(state, userConfig) {
        const config = Object.assign({}, DEFAULT_CONFIG, userConfig);
        const evaluate = makeEvaluator(config);
        const weights = config.pieceWeights;
        const weightSum = weights.reduce((a, b) => a + b, 0);
        const probs = weights.map(w => w / weightSum);
        const depthMax = config.depth;
        const beam = config.beam;
        const cache = new Map();
        let nodes = 0;

        function cleared(lo, hi) {
            return config.clearBonus > 0 && rawScore(lo, hi) >= config.clearTarget;
        }

        // 手持ちが分かっている状態の価値 (残り d 手)
        function decide(lo, hi, cur, held, d) {
            nodes++;
            const moves = generateMoves(lo, hi, cur, held);
            if (moves.length === 0) return evaluate(lo, hi);
            for (const m of moves) m.score = evaluate(m.lo, m.hi);
            moves.sort((a, b) => b.score - a.score);
            let best = -Infinity;
            const limit = Math.min(beam, moves.length);
            for (let i = 0; i < limit; i++) {
                const m = moves[i];
                const v = after(m.lo, m.hi, m.keep, d - 1);
                if (v > best) best = v;
            }
            return best;
        }

        // 次の 1 枚が未知 (確率で平均) の状態の価値 (残り d 手)
        function after(lo, hi, held, d) {
            if (cleared(lo, hi)) return evaluate(lo, hi) + config.clearBonus * (d + 1);
            if (d <= 0 || (popcount(lo) + popcount(hi) === CELLS)) return evaluate(lo, hi);
            const key = lo + "," + hi + "," + held + "," + d;
            const hit = cache.get(key);
            if (hit !== undefined) return hit;
            let sum = 0;
            for (let t = 0; t < SHAPES.length; t++) {
                if (probs[t] > 0) sum += probs[t] * decide(lo, hi, t, held, d);
            }
            cache.set(key, sum);
            return sum;
        }

        const { lo, hi, cur, held } = state;
        const moves = generateMoves(lo, hi, cur, held);
        const base = evaluate(lo, hi);
        // value は、いまの盤面から増える期待報酬 (先読みした手数ぶん)
        for (const m of moves) {
            m.value = after(m.lo, m.hi, m.keep, depthMax - 1) - base;
            m.gain = rawScore(m.lo, m.hi) - rawScore(lo, hi);
            m.rewardGain = evaluate(m.lo, m.hi) - base;
        }
        moves.sort((a, b) => b.value - a.value);
        return { moves, nodes };
    }

    function makeRandom(seed) {
        let s = seed >>> 0;
        return function () {
            s = (s + 0x6d2b79f5) >>> 0;
            let t = s;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function drawPiece(rand, probs) {
        let x = rand();
        for (let t = 0; t < probs.length; t++) {
            x -= probs[t];
            if (x < 0) return t;
        }
        return probs.length - 1;
    }

    // 先読みなしの貪欲法で h フリップ進めたときの累計報酬 (curve[h-1])。
    // 盤面が埋まる等で置けなくなったら以降は増えない。
    // reach = 素点が target に届いたときのフリップ数 (届かなければ Infinity、最初から届いていれば 0)。
    function rollout(evaluate, probs, rand, lo, hi, cur, held, flips, target) {
        const base = evaluate(lo, hi);
        const curve = new Array(flips).fill(0);
        let last = 0;
        let reach = rawScore(lo, hi) >= target ? 0 : Infinity;
        // 初期化直後は手持ちもホールドも空。最初の 1 枚は必ずホールドに入り (ホールドを空のまま
        // 進める盤面はない)、次の 1 枚が手持ちになる。このやり取りはフリップを消費しない。
        if (cur < 0) cur = drawPiece(rand, probs);
        if (held < 0) {
            held = cur;
            cur = drawPiece(rand, probs);
        }
        for (let h = 0; h < flips; h++) {
            const moves = generateMoves(lo, hi, cur, held);
            if (moves.length > 0) {
                let best = moves[0];
                let bestScore = -Infinity;
                for (const m of moves) {
                    const s = evaluate(m.lo, m.hi);
                    if (s > bestScore) {
                        bestScore = s;
                        best = m;
                    }
                }
                lo = best.lo;
                hi = best.hi;
                held = best.keep;
                last = bestScore - base;
                if (reach === Infinity && rawScore(lo, hi) >= target) reach = h + 1;
            }
            curve[h] = last;
            cur = drawPiece(rand, probs);
        }
        return { curve, reach };
    }

    function normalizedProbs(config) {
        const sum = config.pieceWeights.reduce((a, b) => a + b, 0);
        return config.pieceWeights.map(w => w / sum);
    }

    // まっさらな盤面から始めて、どこで切り上げるのが最も効率的か。
    // 次のラウンドへは達成率 100% (素点 clearTarget) にならないと進めないので、
    // 「100% に届いてから、さらに extra フリップ開けて切り上げる」の中から最善の extra を選ぶ。
    // rate = 1 フリップあたりの期待報酬 (λ*)、flips = そのときの 1 ラウンドの平均フリップ数。
    function estimateFreshRate(userConfig, options) {
        const config = Object.assign({}, DEFAULT_CONFIG, userConfig);
        const opts = Object.assign({ sims: 400, maxFlips: 24, seed: 12345 }, options);
        const evaluate = makeEvaluator(config);
        const probs = normalizedProbs(config);
        const rand = makeRandom(opts.seed);
        const runs = [];
        for (let i = 0; i < opts.sims; i++) {
            runs.push(rollout(evaluate, probs, rand, 0, 0, -1, -1, opts.maxFlips, config.clearTarget));
        }
        let rate = 0;
        let flips = 0;
        let extra = 0;
        for (let k = 0; k < opts.maxFlips; k++) {
            let reward = 0;
            let used = 0;
            for (const run of runs) {
                const stop = Math.min(run.reach + k, opts.maxFlips);
                reward += run.curve[stop - 1];
                used += stop;
            }
            if (reward / used > rate) {
                rate = reward / used;
                flips = used / runs.length;
                extra = k;
            }
        }
        return { rate, flips, extra };
    }

    // 続行 vs 初期化。value = max_h (h フリップ後の期待累計報酬 − λ*·h)。
    // λ* はまっさらな盤面から最適に切り上げたときの効率なので、初期化側の value は定義上 0。
    // (シミュレーションし直すと乱数の誤差で 0 を超え、初期化を勧めすぎる)
    // 達成率 100% 未満では次のラウンドへ進めないので、判定しない (canReset = false)。
    function adviseReset(state, userConfig, fresh, options) {
        const config = Object.assign({}, DEFAULT_CONFIG, userConfig);
        if (rawScore(state.lo, state.hi) < config.clearTarget) {
            return { canReset: false, keep: null, reset: null, shouldReset: false };
        }
        const opts = Object.assign({ sims: 300, flips: 12, seed: 777 }, options);
        const evaluate = makeEvaluator(config);
        const probs = normalizedProbs(config);

        function value(lo, hi, cur, held) {
            const rand = makeRandom(opts.seed);
            const sum = new Array(opts.flips).fill(0);
            for (let i = 0; i < opts.sims; i++) {
                const { curve } = rollout(evaluate, probs, rand, lo, hi, cur, held, opts.flips, config.clearTarget);
                for (let h = 0; h < opts.flips; h++) sum[h] += curve[h];
            }
            let best = 0;
            let bestH = 0;
            sum.forEach((s, h) => {
                const v = s / opts.sims - fresh.rate * (h + 1);
                if (v > best) {
                    best = v;
                    bestH = h + 1;
                }
            });
            return { value: best, flips: bestH };
        }

        const keep = value(state.lo, state.hi, state.cur, state.held);
        const reset = { value: 0, flips: 0 };
        // 続行しても基準の効率を超えないなら初期化を勧める
        return { canReset: true, keep, reset, shouldReset: keep.value <= 0 };
    }

    function applyMove(state, move, nextCur) {
        return { lo: move.lo, hi: move.hi, cur: nextCur, held: move.keep };
    }

    return {
        SIZE, CELLS, SHAPES, LINES, PLACEMENTS, DEFAULT_CONFIG, ITEMS, BIG_CELLS, deriveRewards, unopenedCellValue,
        boardFromArray, cellMaskToArray, isFilled, rawScore, countBingos, popcount,
        generateMoves, suggest, applyMove, makeEvaluator, estimateFreshRate, adviseReset
    };
});
