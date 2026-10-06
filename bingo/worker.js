importScripts("engine.js");

let freshCache = { key: null, value: null };

// 基準効率は、まっさらな盤面の設定 (freshConfig) で求める。盤面ごとの調整では変わらないので使い回す。
function freshRate(config) {
    const key = JSON.stringify(config);
    if (freshCache.key !== key) {
        freshCache = { key, value: BingoEngine.estimateFreshRate(config) };
    }
    return freshCache.value;
}

self.onmessage = function (event) {
    const { id, state, config, freshConfig } = event.data;
    try {
        const result = BingoEngine.suggest(state, config);
        const fresh = freshRate(freshConfig || config);
        const reset = BingoEngine.adviseReset(state, config, fresh);
        self.postMessage({ id, moves: result.moves.slice(0, 6), nodes: result.nodes, fresh, reset });
    } catch (error) {
        self.postMessage({ id, error: String(error && error.message || error) });
    }
};
