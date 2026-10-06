// トリッカル装備設計図 最適周回計算ツール Core Logic

// 1. 使徒データベース（装備武器を決める攻撃属性のみ保持）
const APOSTLES_DB = [
    { name: "エピカ", type: "physical", yomi: "えぴか", romaji: "epika" },
    { name: "カンナ", type: "physical", yomi: "かんな", romaji: "kanna" },
    { name: "バター", type: "physical", yomi: "ばたー", romaji: "bata" },
    { name: "ベニー", type: "physical", yomi: "べにー", romaji: "beni" },
    { name: "モモ", type: "magic", yomi: "もも", romaji: "momo" },
    { name: "ルポ", type: "physical", yomi: "るぽ", romaji: "rupo" },
    { name: "ルード", type: "physical", yomi: "るーど", romaji: "rudo" },
    { name: "ミンス", type: "physical", yomi: "みんす", romaji: "minsu" },
    { name: "アレット", type: "physical", yomi: "あれっと", romaji: "aretto" },
    { name: "ビッグウッド", type: "physical", yomi: "びっぐうっど", romaji: "bigguuddo" },
    { name: "キュウイ", type: "magic", yomi: "きゅうい", romaji: "kyui" },
    { name: "マーゴ", type: "magic", yomi: "まーご", romaji: "mago" },
    { name: "クロエ", type: "magic", yomi: "くろえ", romaji: "kuroe" },
    { name: "リニュア", type: "physical", yomi: "りにゅあ", romaji: "rinyua" },
    { name: "ディアナ", type: "magic", yomi: "でぃあな", romaji: "diana" },
    { name: "リッツ", type: "physical", yomi: "りっつ", romaji: "rittu" },
    { name: "ユミミ", type: "physical", yomi: "ゆみみ", romaji: "yumimi" },
    { name: "エシュール", type: "magic", yomi: "えしゅーる", romaji: "eshuru" },
    { name: "ギデオン", type: "physical", yomi: "ぎでおん", romaji: "gideon" },
    { name: "コミー", type: "physical", yomi: "こみー", romaji: "komi" },
    { name: "チョッピー", type: "physical", yomi: "ちょっぴー", romaji: "tyoppi" },
    { name: "ウイ", type: "magic", yomi: "うい", romaji: "ui" },
    { name: "セリーネ", type: "magic", yomi: "せりーぬ", romaji: "serinu" },
    { name: "カレン", type: "magic", yomi: "かれん", romaji: "karen" },
    { name: "ジュビー", type: "physical", yomi: "じゅびー", romaji: "jubi" },
    { name: "タイダー", type: "physical", yomi: "たいだー", romaji: "taida" },
    { name: "マリー", type: "physical", yomi: "まりー", romaji: "mari" },
    { name: "アヤ", type: "magic", yomi: "あや", romaji: "aya" },
    { name: "イード", type: "magic", yomi: "いーど", romaji: "ido" },
    { name: "アメリア", type: "physical", yomi: "あめりあ", romaji: "ameria" },
    { name: "エレナ", type: "physical", yomi: "えれな", romaji: "erena" },
    { name: "シーラ", type: "physical", yomi: "しーら", romaji: "sira" },
    { name: "ジェイド", type: "magic", yomi: "じぇいど", romaji: "jeido" },
    { name: "バロン", type: "magic", yomi: "ばろん", romaji: "baron" },
    { name: "ピコラ", type: "magic", yomi: "ぴこら", romaji: "pikora" },
    { name: "フリックル", type: "magic", yomi: "ふりっくる", romaji: "furikkuru" },
    { name: "ベルベット", type: "physical", yomi: "べるべっと", romaji: "berubetto" },
    { name: "エスピー", type: "magic", yomi: "えすぴー", romaji: "esupi" },
    { name: "メロナ", type: "magic", yomi: "めろな", romaji: "merona" },
    { name: "レイジー", type: "physical", yomi: "れいじー", romaji: "reiji" },
    { name: "パトラ", type: "physical", yomi: "ぱとら", romaji: "patora" },
    { name: "アリス", type: "magic", yomi: "ありす", romaji: "arisu" },
    { name: "イフリート", type: "magic", yomi: "いふりーと", romaji: "ifurito" },
    { name: "シェイディ", type: "physical", yomi: "しぇいでぃ", romaji: "seidi" },
    { name: "シスト", type: "physical", yomi: "しすと", romaji: "sisuto" },
    { name: "ネル", type: "magic", yomi: "ねる", romaji: "neru" },
    { name: "ベリータ", type: "magic", yomi: "べりーた", romaji: "berita" },
    { name: "マヨ", type: "physical", yomi: "まよ", romaji: "mayo" },
    { name: "メゾン", type: "physical", yomi: "めぞん", romaji: "mezon" },
    { name: "シオン・ザ・DB", type: "physical", yomi: "しおんざでぃーびー", romaji: "shionzadbi" },
    { name: "ヨミ", type: "magic", yomi: "よみ", romaji: "yomi" },
    { name: "スノキー", type: "physical", yomi: "すのきー", romaji: "sunoki" },
    { name: "ヒルデ", type: "magic", yomi: "ひるで", romaji: "hirude" },
    { name: "ブランセ", type: "magic", yomi: "ぶらんせ", romaji: "buranse" },
    { name: "ポーシャー", type: "magic", yomi: "ぽーしゃー", romaji: "posha" },
    { name: "リスティ", type: "physical", yomi: "りすてぃ", romaji: "risuti" },
    { name: "リム", type: "physical", yomi: "りむ", romaji: "rimu" },
    { name: "レヴィ", type: "physical", yomi: "れゔぃ", romaji: "revi" },
    { name: "フェスタ", type: "physical", yomi: "ふぇすた", romaji: "fesuta" },
    { name: "ベル", type: "physical", yomi: "べる", romaji: "beru" },
    { name: "ヴィヴィ", type: "magic", yomi: "ゔぃゔぃ", romaji: "vivi" },
    { name: "エルフィン", type: "magic", yomi: "えるふぃん", romaji: "erufin" },
    { name: "ガヴィア", type: "magic", yomi: "がゔぃあ", romaji: "gavia" },
    { name: "キャロット", type: "magic", yomi: "きゃろっと", romaji: "kyarotto" },
    { name: "シルフィール", type: "physical", yomi: "しるふぃーる", romaji: "shirufiru" },
    { name: "スピッキー", type: "magic", yomi: "すぴっきー", romaji: "supikki" },
    { name: "ダーヤ", type: "magic", yomi: "だーや", romaji: "daya" },
    { name: "ナイア", type: "magic", yomi: "ないあ", romaji: "naia" },
    { name: "ヘイリー", type: "physical", yomi: "へいりー", romaji: "heiri" },
    { name: "ローネ", type: "physical", yomi: "ろーね", romaji: "rone" },
    { name: "サリー", type: "physical", yomi: "さりー", romaji: "sari" },
    { name: "ロレット", type: "magic", yomi: "ろれっと", romaji: "roretto" },
    { name: "マエストロMK2", type: "physical", yomi: "まえすとろえむけーつー", romaji: "maestromk2" },
    { name: "シュパン", type: "magic", yomi: "しゅぱん", romaji: "syupan" },
    { name: "ティグ", type: "physical", yomi: "てぃぐ", romaji: "tigu" }
].sort((a, b) => a.name.localeCompare(b.name, "ja"));

// 2. 装備部位の定義
const SLOTS = ["weapon", "armor", "hat", "boots", "sparkly", "splendid"];
const SLOT_NAMES = {
    weapon: "武器", // 描画時に使徒の物理/魔法に合わせて絵文字を付与
    armor: "🛡️ 鎧",
    hat: "🎓 帽子",
    boots: "🥾 ブーツ",
    sparkly: "💍 煌めく装飾品",
    splendid: "💎 華麗な装飾品"
};

// 素材キーの定義ユーティリティ
function getMaterialKey(rank, slot, isMagic = false) {
    if (slot === "weapon") {
        return `R${rank}_${isMagic ? "MAG" : "PHYS"}_WEAPON`;
    }
    return `R${rank}_${slot.toUpperCase()}`;
}

// 素材の日本語名マッピング (絵文字の追加)
const MATERIAL_NAMES = {};
const EMOJI_MAP = {
    PHYS_WEAPON: "⚔️",
    MAG_WEAPON: "🔮",
    ARMOR: "🛡️",
    HAT: "🎓",
    BOOTS: "🥾",
    SPARKLY: "💍",
    SPLENDID: "💎"
};
for (let r = 1; r <= 9; r++) {
    
    const suffixes = ["PHYS_WEAPON", "MAG_WEAPON", "ARMOR", "HAT", "BOOTS", "SPARKLY", "SPLENDID"];
    suffixes.forEach(s => {
        const key = `R${r}_${s}`;
        const label = s === "PHYS_WEAPON" ? "物理武器" :
                      s === "MAG_WEAPON" ? "魔法武器" :
                      s === "ARMOR" ? "鎧" :
                      s === "HAT" ? "帽子" :
                      s === "BOOTS" ? "ブーツ" :
                      s === "SPARKLY" ? "煌めく装飾品" : "華麗な装飾品";
        MATERIAL_NAMES[key] = `${EMOJI_MAP[s]} R${r} ${label}`;
    });
}

// 3. 装備製作レシピ (1部位あたりに必要な設計図・欠片の枚数)
// 偶数ランク(R4, R7など)は欠片、奇数ランク(R5, R6, R8, R9など)は設計図がメイン素材
const RECIPES = {
    9: { mainCount: 52, subRank: 8, subCount: 20 },
    8: { mainCount: 46, subRank: 7, subCount: 18 },
    7: { mainCount: 42, subRank: null, subCount: 0 },
    6: { mainCount: 36, subRank: 5, subCount: 14 },
    5: { mainCount: 30, subRank: 4, subCount: 12 },
    4: { mainCount: 20, subRank: null, subCount: 0 },
    3: { mainCount: 18, subRank: 2, subCount: 8 },
    2: { mainCount: 10, subRank: 1, subCount: 4 } // R1は完成品を店等で買うため、R1設計図という概念は無視（一般素材代用）
};

// 4. ステージドロップデータベース
// 各ステージのドロップアイテムのペア（メイン枠、サブ枠）
const STAGES_DB = [
    { stage: "3-1", area: 3, main: "R2_PHYS_WEAPON", sub: "R2_BOOTS" },
    { stage: "3-2", area: 3, main: "R2_MAG_WEAPON", sub: "R2_SPARKLY" },
    { stage: "3-3", area: 3, main: "R2_ARMOR", sub: "R2_SPLENDID" },
    { stage: "3-4", area: 3, main: "R2_PHYS_WEAPON", sub: "R2_HAT" },
    { stage: "3-5", area: 3, main: "R2_MAG_WEAPON", sub: "R2_BOOTS" },
    { stage: "3-6", area: 3, main: "R2_ARMOR", sub: "R2_SPARKLY" },
    { stage: "3-7", area: 3, main: "R2_HAT", sub: "R2_SPLENDID" },
    { stage: "3-8", area: 3, main: "R2_PHYS_WEAPON", sub: "R2_SPARKLY" },
    { stage: "3-9", area: 3, main: "R2_MAG_WEAPON", sub: "R2_SPLENDID" },
    { stage: "3-10", area: 3, main: "R2_PHYS_WEAPON", sub: "R2_ARMOR" },
    { stage: "4-1", area: 4, main: "R2_MAG_WEAPON", sub: "R2_HAT" },
    { stage: "4-2", area: 4, main: "R2_ARMOR", sub: "R2_BOOTS" },
    { stage: "4-3", area: 4, main: "R2_BOOTS", sub: "R2_SPARKLY" },
    { stage: "4-4", area: 4, main: "R2_SPARKLY", sub: "R2_SPLENDID" },
    { stage: "4-5", area: 4, main: "R2_PHYS_WEAPON", sub: "R2_SPLENDID" },
    { stage: "4-6", area: 4, main: "R2_PHYS_WEAPON", sub: "R2_MAG_WEAPON" },
    { stage: "4-7", area: 4, main: "R2_MAG_WEAPON", sub: "R2_ARMOR" },
    { stage: "4-8", area: 4, main: "R2_ARMOR", sub: "R2_HAT" },
    { stage: "4-9", area: 4, main: "R2_BOOTS", sub: "R2_SPARKLY" },
    { stage: "4-10", area: 4, main: "R2_HAT", sub: "R2_SPARKLY" },
    { stage: "5-1", area: 5, main: "R2_SPLENDID", sub: "R3_PHYS_WEAPON" },
    { stage: "5-2", area: 5, main: "R2_PHYS_WEAPON", sub: "R3_MAG_WEAPON" },
    { stage: "5-3", area: 5, main: "R2_MAG_WEAPON", sub: "R3_ARMOR" },
    { stage: "5-4", area: 5, main: "R2_ARMOR", sub: "R3_HAT" },
    { stage: "5-5", area: 5, main: "R2_HAT", sub: "R3_BOOTS" },
    { stage: "5-6", area: 5, main: "R2_BOOTS", sub: "R3_SPARKLY" },
    { stage: "5-7", area: 5, main: "R2_SPARKLY", sub: "R3_SPLENDID" },
    { stage: "5-8", area: 5, main: "R2_SPLENDID", sub: "R3_PHYS_WEAPON" },
    { stage: "5-9", area: 5, main: "R2_PHYS_WEAPON", sub: "R3_MAG_WEAPON" },
    { stage: "5-10", area: 5, main: "R2_MAG_WEAPON", sub: "R3_ARMOR" },
    { stage: "6-1", area: 6, main: "R2_ARMOR", sub: "R3_HAT" },
    { stage: "6-2", area: 6, main: "R2_HAT", sub: "R3_BOOTS" },
    { stage: "6-3", area: 6, main: "R2_BOOTS", sub: "R3_SPARKLY" },
    { stage: "6-4", area: 6, main: "R2_SPARKLY", sub: "R3_SPLENDID" },
    { stage: "6-5", area: 6, main: "R2_SPLENDID", sub: "R3_PHYS_WEAPON" },
    { stage: "6-6", area: 6, main: "R2_PHYS_WEAPON", sub: "R3_MAG_WEAPON" },
    { stage: "6-7", area: 6, main: "R2_MAG_WEAPON", sub: "R3_ARMOR" },
    { stage: "6-8", area: 6, main: "R2_ARMOR", sub: "R3_HAT" },
    { stage: "6-9", area: 6, main: "R2_HAT", sub: "R3_BOOTS" },
    { stage: "6-10", area: 6, main: "R2_BOOTS", sub: "R3_SPARKLY" },
    { stage: "7-1", area: 7, main: "R3_MAG_WEAPON", sub: "R3_SPLENDID" },
    { stage: "7-2", area: 7, main: "R3_PHYS_WEAPON", sub: "R3_SPLENDID" },
    { stage: "7-3", area: 7, main: "R3_PHYS_WEAPON", sub: "R3_MAG_WEAPON" },
    { stage: "7-4", area: 7, main: "R3_ARMOR", sub: "R3_ARMOR" },
    { stage: "7-5", area: 7, main: "R3_HAT", sub: "R3_HAT" },
    { stage: "7-6", area: 7, main: "R3_BOOTS", sub: "R3_BOOTS" },
    { stage: "7-7", area: 7, main: "R3_PHYS_WEAPON", sub: "R3_SPARKLY" },
    { stage: "7-8", area: 7, main: "R3_MAG_WEAPON", sub: "R3_SPLENDID" },
    { stage: "7-9", area: 7, main: "R3_PHYS_WEAPON", sub: "R3_SPLENDID" },
    { stage: "7-10", area: 7, main: "R3_PHYS_WEAPON", sub: "R3_MAG_WEAPON" },
    { stage: "8-1", area: 8, main: "R3_ARMOR", sub: "R3_ARMOR" },
    { stage: "8-2", area: 8, main: "R3_HAT", sub: "R3_HAT" },
    { stage: "8-3", area: 8, main: "R3_BOOTS", sub: "R3_BOOTS" },
    { stage: "8-4", area: 8, main: "R3_PHYS_WEAPON", sub: "R3_SPARKLY" },
    { stage: "8-5", area: 8, main: "R3_SPARKLY", sub: "R3_SPLENDID" },
    { stage: "8-6", area: 8, main: "R3_PHYS_WEAPON", sub: "R3_SPLENDID" },
    { stage: "8-7", area: 8, main: "R3_PHYS_WEAPON", sub: "R3_MAG_WEAPON" },
    { stage: "8-8", area: 8, main: "R3_ARMOR", sub: "R3_ARMOR" },
    { stage: "8-9", area: 8, main: "R3_HAT", sub: "R3_HAT" },
    { stage: "8-10", area: 8, main: "R3_BOOTS", sub: "R3_BOOTS" },
    { stage: "9-1", area: 9, main: "R3_ARMOR", sub: "R4_PHYS_WEAPON" },
    { stage: "9-2", area: 9, main: "R3_SPARKLY", sub: "R4_MAG_WEAPON" },
    { stage: "9-3", area: 9, main: "R3_SPLENDID", sub: "R4_ARMOR" },
    { stage: "9-4", area: 9, main: "R3_MAG_WEAPON", sub: "R4_HAT" },
    { stage: "9-5", area: 9, main: "R3_ARMOR", sub: "R4_BOOTS" },
    { stage: "9-6", area: 9, main: "R3_HAT", sub: "R4_SPARKLY" },
    { stage: "9-7", area: 9, main: "R3_BOOTS", sub: "R4_SPLENDID" },
    { stage: "9-8", area: 9, main: "R3_SPARKLY", sub: "R4_PHYS_WEAPON" },
    { stage: "9-9", area: 9, main: "R3_SPLENDID", sub: "R4_MAG_WEAPON" },
    { stage: "9-10", area: 9, main: "R3_SPLENDID", sub: "R4_ARMOR" },
    { stage: "10-1", area: 10, main: "R3_MAG_WEAPON", sub: "R4_HAT" },
    { stage: "10-2", area: 10, main: "R3_ARMOR", sub: "R4_BOOTS" },
    { stage: "10-3", area: 10, main: "R3_HAT", sub: "R4_SPARKLY" },
    { stage: "10-4", area: 10, main: "R3_BOOTS", sub: "R4_SPLENDID" },
    { stage: "10-5", area: 10, main: "R3_SPARKLY", sub: "R4_PHYS_WEAPON" },
    { stage: "10-6", area: 10, main: "R3_SPARKLY", sub: "R4_MAG_WEAPON" },
    { stage: "10-7", area: 10, main: "R3_SPLENDID", sub: "R4_ARMOR" },
    { stage: "10-8", area: 10, main: "R3_MAG_WEAPON", sub: "R4_HAT" },
    { stage: "10-9", area: 10, main: "R3_SPARKLY", sub: "R4_BOOTS" },
    { stage: "10-10", area: 10, main: "R3_SPARKLY", sub: "R4_SPARKLY" },
    { stage: "11-1", area: 11, main: "R4_MAG_WEAPON", sub: "R4_SPLENDID" },
    { stage: "11-2", area: 11, main: "R4_PHYS_WEAPON", sub: "R4_SPLENDID" },
    { stage: "11-3", area: 11, main: "R4_PHYS_WEAPON", sub: "R4_ARMOR" },
    { stage: "11-4", area: 11, main: "R4_MAG_WEAPON", sub: "R4_ARMOR" },
    { stage: "11-5", area: 11, main: "R4_ARMOR", sub: "R4_HAT" },
    { stage: "11-6", area: 11, main: "R4_HAT", sub: "R4_BOOTS" },
    { stage: "11-7", area: 11, main: "R4_BOOTS", sub: "R4_SPARKLY" },
    { stage: "11-8", area: 11, main: "R4_PHYS_WEAPON", sub: "R4_HAT" },
    { stage: "11-9", area: 11, main: "R4_SPARKLY", sub: "R4_SPLENDID" },
    { stage: "11-10", area: 11, main: "R4_PHYS_WEAPON", sub: "R4_MAG_WEAPON" },
    { stage: "12-1", area: 12, main: "R4_PHYS_WEAPON", sub: "R4_ARMOR" },
    { stage: "12-2", area: 12, main: "R4_ARMOR", sub: "R4_HAT" },
    { stage: "12-3", area: 12, main: "R4_HAT", sub: "R4_BOOTS" },
    { stage: "12-4", area: 12, main: "R4_BOOTS", sub: "R4_SPARKLY" },
    { stage: "12-5", area: 12, main: "R4_BOOTS", sub: "R4_SPARKLY" },
    { stage: "12-6", area: 12, main: "R4_MAG_WEAPON", sub: "R4_SPLENDID" },
    { stage: "12-7", area: 12, main: "R4_PHYS_WEAPON", sub: "R4_SPLENDID" },
    { stage: "12-8", area: 12, main: "R4_PHYS_WEAPON", sub: "R4_ARMOR" },
    { stage: "12-9", area: 12, main: "R4_ARMOR", sub: "R4_HAT" },
    { stage: "12-10", area: 12, main: "R4_HAT", sub: "R4_BOOTS" },
    { stage: "13-1", area: 13, main: "R4_BOOTS", sub: "R5_PHYS_WEAPON" },
    { stage: "13-2", area: 13, main: "R4_SPARKLY", sub: "R5_SPLENDID" },
    { stage: "13-3", area: 13, main: "R4_SPLENDID", sub: "R5_MAG_WEAPON" },
    { stage: "13-4", area: 13, main: "R4_MAG_WEAPON", sub: "R5_ARMOR" },
    { stage: "13-5", area: 13, main: "R4_ARMOR", sub: "R5_HAT" },
    { stage: "13-6", area: 13, main: "R4_HAT", sub: "R5_BOOTS" },
    { stage: "13-7", area: 13, main: "R4_BOOTS", sub: "R5_SPARKLY" },
    { stage: "13-8", area: 13, main: "R4_SPARKLY", sub: "R5_PHYS_WEAPON" },
    { stage: "13-9", area: 13, main: "R4_SPLENDID", sub: "R5_SPLENDID" },
    { stage: "13-10", area: 13, main: "R4_SPLENDID", sub: "R5_MAG_WEAPON" },
    { stage: "14-1", area: 14, main: "R4_MAG_WEAPON", sub: "R5_ARMOR" },
    { stage: "14-2", area: 14, main: "R4_ARMOR", sub: "R5_HAT" },
    { stage: "14-3", area: 14, main: "R4_HAT", sub: "R5_BOOTS" },
    { stage: "14-4", area: 14, main: "R4_BOOTS", sub: "R5_SPARKLY" },
    { stage: "14-5", area: 14, main: "R4_PHYS_WEAPON", sub: "R5_PHYS_WEAPON" },
    { stage: "14-6", area: 14, main: "R4_SPARKLY", sub: "R5_SPLENDID" },
    { stage: "14-7", area: 14, main: "R4_SPLENDID", sub: "R5_MAG_WEAPON" },
    { stage: "14-8", area: 14, main: "R4_MAG_WEAPON", sub: "R5_ARMOR" },
    { stage: "14-9", area: 14, main: "R4_MAG_WEAPON", sub: "R5_HAT" },
    { stage: "14-10", area: 14, main: "R4_SPARKLY", sub: "R5_BOOTS" },
    { stage: "15-1", area: 15, main: "R5_PHYS_WEAPON", sub: "R5_SPARKLY" },
    { stage: "15-2", area: 15, main: "R5_SPARKLY", sub: "R5_SPLENDID" },
    { stage: "15-3", area: 15, main: "R5_MAG_WEAPON", sub: "R5_SPLENDID" },
    { stage: "15-4", area: 15, main: "R5_MAG_WEAPON", sub: "R5_ARMOR" },
    { stage: "15-5", area: 15, main: "R5_ARMOR", sub: "R5_HAT" },
    { stage: "15-6", area: 15, main: "R5_HAT", sub: "R5_BOOTS" },
    { stage: "15-7", area: 15, main: "R5_PHYS_WEAPON", sub: "R5_BOOTS" },
    { stage: "15-8", area: 15, main: "R5_PHYS_WEAPON", sub: "R5_SPARKLY" },
    { stage: "15-9", area: 15, main: "R5_SPARKLY", sub: "R5_SPLENDID" },
    { stage: "15-10", area: 15, main: "R5_MAG_WEAPON", sub: "R5_SPLENDID" },
    { stage: "16-1", area: 16, main: "R5_MAG_WEAPON", sub: "R5_ARMOR" },
    { stage: "16-2", area: 16, main: "R5_ARMOR", sub: "R5_HAT" },
    { stage: "16-3", area: 16, main: "R5_HAT", sub: "R5_BOOTS" },
    { stage: "16-4", area: 16, main: "R5_BOOTS", sub: "R5_SPARKLY" },
    { stage: "16-5", area: 16, main: "R5_PHYS_WEAPON", sub: "R5_SPARKLY" },
    { stage: "16-6", area: 16, main: "R5_PHYS_WEAPON", sub: "R5_SPLENDID" },
    { stage: "16-7", area: 16, main: "R5_MAG_WEAPON", sub: "R5_SPLENDID" },
    { stage: "16-8", area: 16, main: "R5_MAG_WEAPON", sub: "R5_ARMOR" },
    { stage: "16-9", area: 16, main: "R5_HAT", sub: "R5_SPARKLY" },
    { stage: "16-10", area: 16, main: "R5_HAT", sub: "R5_BOOTS" },
    { stage: "17-1", area: 17, main: "R5_PHYS_WEAPON", sub: "R6_PHYS_WEAPON" },
    { stage: "17-2", area: 17, main: "R5_SPARKLY", sub: "R6_SPLENDID" },
    { stage: "17-3", area: 17, main: "R5_SPLENDID", sub: "R6_MAG_WEAPON" },
    { stage: "17-4", area: 17, main: "R5_MAG_WEAPON", sub: "R6_ARMOR" },
    { stage: "17-5", area: 17, main: "R5_ARMOR", sub: "R6_HAT" },
    { stage: "17-6", area: 17, main: "R5_HAT", sub: "R6_BOOTS" },
    { stage: "17-7", area: 17, main: "R5_BOOTS", sub: "R6_SPARKLY" },
    { stage: "17-8", area: 17, main: "R5_SPARKLY", sub: "R6_PHYS_WEAPON" },
    { stage: "17-9", area: 17, main: "R5_PHYS_WEAPON", sub: "R6_SPLENDID" },
    { stage: "17-10", area: 17, main: "R5_SPLENDID", sub: "R6_MAG_WEAPON" },
    { stage: "18-1", area: 18, main: "R5_MAG_WEAPON", sub: "R6_ARMOR" },
    { stage: "18-2", area: 18, main: "R5_ARMOR", sub: "R6_HAT" },
    { stage: "18-3", area: 18, main: "R5_HAT", sub: "R6_BOOTS" },
    { stage: "18-4", area: 18, main: "R5_BOOTS", sub: "R6_PHYS_WEAPON" },
    { stage: "18-5", area: 18, main: "R5_SPARKLY", sub: "R6_SPARKLY" },
    { stage: "18-6", area: 18, main: "R5_PHYS_WEAPON", sub: "R6_SPLENDID" },
    { stage: "18-7", area: 18, main: "R5_SPLENDID", sub: "R6_MAG_WEAPON" },
    { stage: "18-8", area: 18, main: "R5_MAG_WEAPON", sub: "R6_ARMOR" },
    { stage: "18-9", area: 18, main: "R5_BOOTS", sub: "R6_HAT" },
    { stage: "18-10", area: 18, main: "R5_PHYS_WEAPON", sub: "R6_BOOTS" },
    { stage: "19-1", area: 19, main: "R6_PHYS_WEAPON", sub: "R6_ARMOR" },
    { stage: "19-2", area: 19, main: "R6_SPARKLY", sub: "R6_SPLENDID" },
    { stage: "19-3", area: 19, main: "R6_ARMOR", sub: "R6_SPLENDID" },
    { stage: "19-4", area: 19, main: "R6_MAG_WEAPON", sub: "R6_ARMOR" },
    { stage: "19-5", area: 19, main: "R6_ARMOR", sub: "R6_HAT" },
    { stage: "19-6", area: 19, main: "R6_HAT", sub: "R6_BOOTS" },
    { stage: "19-7", area: 19, main: "R6_BOOTS", sub: "R6_SPARKLY" },
    { stage: "19-8", area: 19, main: "R6_PHYS_WEAPON", sub: "R6_SPARKLY" },
    { stage: "19-9", area: 19, main: "R6_BOOTS", sub: "R6_SPLENDID" },
    { stage: "19-10", area: 19, main: "R6_MAG_WEAPON", sub: "R6_SPLENDID" },
    { stage: "20-1", area: 20, main: "R6_MAG_WEAPON", sub: "R6_ARMOR" },
    { stage: "20-2", area: 20, main: "R6_ARMOR", sub: "R6_HAT" },
    { stage: "20-3", area: 20, main: "R6_HAT", sub: "R6_BOOTS" },
    { stage: "20-4", area: 20, main: "R6_BOOTS", sub: "R6_SPARKLY" },
    { stage: "20-5", area: 20, main: "R6_PHYS_WEAPON", sub: "R6_SPARKLY" },
    { stage: "20-6", area: 20, main: "R6_PHYS_WEAPON", sub: "R6_SPLENDID" },
    { stage: "20-7", area: 20, main: "R6_MAG_WEAPON", sub: "R6_SPLENDID" },
    { stage: "20-8", area: 20, main: "R6_MAG_WEAPON", sub: "R6_ARMOR" },
    { stage: "20-9", area: 20, main: "R6_HAT", sub: "R6_SPARKLY" },
    { stage: "20-10", area: 20, main: "R6_PHYS_WEAPON", sub: "R6_BOOTS" },
    { stage: "21-1", area: 21, main: "R6_PHYS_WEAPON", sub: "R7_SPLENDID" },
    { stage: "21-2", area: 21, main: "R6_SPARKLY", sub: "R7_SPLENDID" },
    { stage: "21-3", area: 21, main: "R6_SPLENDID", sub: "R7_MAG_WEAPON" },
    { stage: "21-4", area: 21, main: "R6_MAG_WEAPON", sub: "R7_ARMOR" },
    { stage: "21-5", area: 21, main: "R6_ARMOR", sub: "R7_HAT" },
    { stage: "21-6", area: 21, main: "R6_HAT", sub: "R7_BOOTS" },
    { stage: "21-7", area: 21, main: "R6_BOOTS", sub: "R7_PHYS_WEAPON" },
    { stage: "21-8", area: 21, main: "R6_SPARKLY", sub: "R7_SPARKLY" },
    { stage: "21-9", area: 21, main: "R6_PHYS_WEAPON", sub: "R7_SPLENDID" },
    { stage: "21-10", area: 21, main: "R6_SPLENDID", sub: "R7_MAG_WEAPON" },
    { stage: "22-1", area: 22, main: "R6_MAG_WEAPON", sub: "R7_ARMOR" },
    { stage: "22-2", area: 22, main: "R6_ARMOR", sub: "R7_HAT" },
    { stage: "22-3", area: 22, main: "R6_HAT", sub: "R7_BOOTS" },
    { stage: "22-4", area: 22, main: "R6_BOOTS", sub: "R7_SPARKLY" },
    { stage: "22-5", area: 22, main: "R6_SPARKLY", sub: "R7_PHYS_WEAPON" },
    { stage: "22-6", area: 22, main: "R6_PHYS_WEAPON", sub: "R7_SPLENDID" },
    { stage: "22-7", area: 22, main: "R6_SPLENDID", sub: "R7_MAG_WEAPON" },
    { stage: "22-8", area: 22, main: "R6_MAG_WEAPON", sub: "R7_ARMOR" },
    { stage: "22-9", area: 22, main: "R6_SPARKLY", sub: "R7_HAT" },
    { stage: "22-10", area: 22, main: "R6_HAT", sub: "R7_BOOTS" },
    { stage: "23-1", area: 23, main: "R7_PHYS_WEAPON", sub: "R7_ARMOR" },
    { stage: "23-2", area: 23, main: "R7_SPARKLY", sub: "R7_SPLENDID" },
    { stage: "23-3", area: 23, main: "R7_PHYS_WEAPON", sub: "R7_MAG_WEAPON" },
    { stage: "23-4", area: 23, main: "R7_ARMOR", sub: "R7_SPLENDID" },
    { stage: "23-5", area: 23, main: "R7_MAG_WEAPON", sub: "R7_HAT" },
    { stage: "23-6", area: 23, main: "R7_ARMOR", sub: "R7_BOOTS" },
    { stage: "23-7", area: 23, main: "R7_ARMOR", sub: "R7_HAT" },
    { stage: "23-8", area: 23, main: "R7_PHYS_WEAPON", sub: "R7_BOOTS" },
    { stage: "23-9", area: 23, main: "R7_PHYS_WEAPON", sub: "R7_SPLENDID" },
    { stage: "23-10", area: 23, main: "R7_PHYS_WEAPON", sub: "R7_MAG_WEAPON" },
    { stage: "24-1", area: 24, main: "R7_ARMOR", sub: "R7_SPLENDID" },
    { stage: "24-2", area: 24, main: "R7_MAG_WEAPON", sub: "R7_HAT" },
    { stage: "24-3", area: 24, main: "R7_ARMOR", sub: "R7_BOOTS" },
    { stage: "24-4", area: 24, main: "R7_HAT", sub: "R7_SPARKLY" },
    { stage: "24-5", area: 24, main: "R7_PHYS_WEAPON", sub: "R7_BOOTS" },
    { stage: "24-6", area: 24, main: "R7_SPARKLY", sub: "R7_SPLENDID" },
    { stage: "24-7", area: 24, main: "R7_MAG_WEAPON", sub: "R7_SPARKLY" },
    { stage: "24-8", area: 24, main: "R7_ARMOR", sub: "R7_SPLENDID" },
    { stage: "24-9", area: 24, main: "R7_MAG_WEAPON", sub: "R7_HAT" },
    { stage: "24-10", area: 24, main: "R7_PHYS_WEAPON", sub: "R7_BOOTS" },
    { stage: "25-1", area: 25, main: "R7_SPLENDID", sub: "R8_SPARKLY" },
    { stage: "25-2", area: 25, main: "R7_MAG_WEAPON", sub: "R8_SPARKLY" },
    { stage: "25-3", area: 25, main: "R7_ARMOR", sub: "R8_SPLENDID" },
    { stage: "25-4", area: 25, main: "R7_HAT", sub: "R8_MAG_WEAPON" },
    { stage: "25-5", area: 25, main: "R7_BOOTS", sub: "R8_ARMOR" },
    { stage: "25-6", area: 25, main: "R7_SPARKLY", sub: "R8_HAT" },
    { stage: "25-7", area: 25, main: "R7_BOOTS", sub: "R8_BOOTS" },
    { stage: "25-8", area: 25, main: "R7_SPLENDID", sub: "R8_PHYS_WEAPON" },
    { stage: "25-9", area: 25, main: "R7_MAG_WEAPON", sub: "R8_SPARKLY" },
    { stage: "25-10", area: 25, main: "R7_ARMOR", sub: "R8_SPLENDID" },
    { stage: "26-1", area: 26, main: "R7_HAT", sub: "R8_MAG_WEAPON" },
    { stage: "26-2", area: 26, main: "R7_BOOTS", sub: "R8_ARMOR" },
    { stage: "26-3", area: 26, main: "R7_PHYS_WEAPON", sub: "R8_HAT" },
    { stage: "26-4", area: 26, main: "R7_SPARKLY", sub: "R8_BOOTS" },
    { stage: "26-5", area: 26, main: "R7_SPLENDID", sub: "R8_SPARKLY" },
    { stage: "26-6", area: 26, main: "R7_MAG_WEAPON", sub: "R8_PHYS_WEAPON" },
    { stage: "26-7", area: 26, main: "R7_PHYS_WEAPON", sub: "R8_SPLENDID" },
    { stage: "26-8", area: 26, main: "R7_SPARKLY", sub: "R8_MAG_WEAPON" },
    { stage: "26-9", area: 26, main: "R7_PHYS_WEAPON", sub: "R8_ARMOR" },
    { stage: "26-10", area: 26, main: "R7_HAT", sub: "R8_HAT" },
    { stage: "27-1", area: 27, main: "R8_BOOTS", sub: "R8_SPARKLY" },
    { stage: "27-2", area: 27, main: "R8_ARMOR", sub: "R8_SPLENDID" },
    { stage: "27-3", area: 27, main: "R8_MAG_WEAPON", sub: "R8_SPARKLY" },
    { stage: "27-4", area: 27, main: "R8_PHYS_WEAPON", sub: "R8_ARMOR" },
    { stage: "27-5", area: 27, main: "R8_HAT", sub: "R8_SPLENDID" },
    { stage: "27-6", area: 27, main: "R8_PHYS_WEAPON", sub: "R8_MAG_WEAPON" },
    { stage: "27-7", area: 27, main: "R8_ARMOR", sub: "R8_SPLENDID" },
    { stage: "27-8", area: 27, main: "R8_MAG_WEAPON", sub: "R8_HAT" },
    { stage: "27-9", area: 27, main: "R8_ARMOR", sub: "R8_BOOTS" },
    { stage: "27-10", area: 27, main: "R8_PHYS_WEAPON", sub: "R8_HAT" },
    { stage: "28-1", area: 28, main: "R8_PHYS_WEAPON", sub: "R8_BOOTS" },
    { stage: "28-2", area: 28, main: "R8_ARMOR", sub: "R8_SPLENDID" },
    { stage: "28-3", area: 28, main: "R8_PHYS_WEAPON", sub: "R8_MAG_WEAPON" },
    { stage: "28-4", area: 28, main: "R8_PHYS_WEAPON", sub: "R8_ARMOR" },
    { stage: "28-5", area: 28, main: "R8_MAG_WEAPON", sub: "R8_HAT" },
    { stage: "28-6", area: 28, main: "R8_ARMOR", sub: "R8_BOOTS" },
    { stage: "28-7", area: 28, main: "R8_HAT", sub: "R8_SPARKLY" },
    { stage: "28-8", area: 28, main: "R8_BOOTS", sub: "R8_SPARKLY" },
    { stage: "28-9", area: 28, main: "R8_SPARKLY", sub: "R8_SPLENDID" },
    { stage: "28-10", area: 28, main: "R8_PHYS_WEAPON", sub: "R8_MAG_WEAPON" },
    { stage: "29-1", area: 29, main: "R8_SPLENDID", sub: "R9_PHYS_WEAPON" },
    { stage: "29-2", area: 29, main: "R8_PHYS_WEAPON", sub: "R9_SPLENDID" },
    { stage: "29-3", area: 29, main: "R8_SPLENDID", sub: "R9_MAG_WEAPON" },
    { stage: "29-4", area: 29, main: "R8_MAG_WEAPON", sub: "R9_ARMOR" },
    { stage: "29-5", area: 29, main: "R8_ARMOR", sub: "R9_HAT" },
    { stage: "29-6", area: 29, main: "R8_HAT", sub: "R9_BOOTS" },
    { stage: "29-7", area: 29, main: "R8_BOOTS", sub: "R9_SPARKLY" },
    { stage: "29-8", area: 29, main: "R8_PHYS_WEAPON", sub: "R9_SPARKLY" },
    { stage: "29-9", area: 29, main: "R8_SPARKLY", sub: "R9_SPLENDID" },
    { stage: "29-10", area: 29, main: "R8_SPLENDID", sub: "R9_PHYS_WEAPON" },
    { stage: "30-1", area: 30, main: "R8_MAG_WEAPON", sub: "R9_MAG_WEAPON" },
    { stage: "30-2", area: 30, main: "R8_ARMOR", sub: "R9_HAT" },
    { stage: "30-3", area: 30, main: "R8_HAT", sub: "R9_BOOTS" },
    { stage: "30-4", area: 30, main: "R8_BOOTS", sub: "R9_SPARKLY" },
    { stage: "30-5", area: 30, main: "R8_PHYS_WEAPON", sub: "R9_PHYS_WEAPON" },
    { stage: "30-6", area: 30, main: "R8_SPARKLY", sub: "R9_SPLENDID" },
    { stage: "30-7", area: 30, main: "R8_SPLENDID", sub: "R9_MAG_WEAPON" },
    { stage: "30-8", area: 30, main: "R8_MAG_WEAPON", sub: "R9_ARMOR" },
    { stage: "30-9", area: 30, main: "R8_BOOTS", sub: "R9_HAT" },
    { stage: "30-10", area: 30, main: "R8_SPARKLY", sub: "R9_BOOTS" },
];

// 5. 最適周回計算アルゴリズム
// 入力: 
// - apostles: 育成したい使徒リスト [{ id: 1, name: "エピカ", type: "physical", currentRank: 6, targetRank: 8, equipped: [false, false, ...] }, ...]
// - inventory: 現在持っている素材の所持数 { R8_PHYS_WEAPON: 10, ... }
// - maxArea: 解放されている最大エリア (M) (整数)
// - maxStage: 解放されている最大ステージ番号 (N) (整数)
// - rates: { main: 1.0, sub: 1.0 } 1周あたりの期待ドロップ数

function calculateFarmingPlan(
    apostles,
    inventory,
    maxArea,
    maxStage,
    rates = { main: 1.0, sub: 1.0 },
    optimizationSolver
) {
    // 必要な総素材数を算出するマップ
    const totalRequirements = {};

    // すべての使徒について、現在のランクから目標ランクまでの必要素材をツリー状に累積加算する
    apostles.forEach(apostle => {
        const isMagic = apostle.type === "magic";
        
        const curRank = apostle.currentRank;
        const targetRank = apostle.targetRank;
        
        if (curRank === targetRank) {
            // 現在のランク＝目標ランクの場合、現在ランクの未装備部位のみを対象とする (そのランクでのフル装備を目指すなど)
            SLOTS.forEach((slot, idx) => {
                const isEquipped = apostle.equipped && apostle.equipped[idx];
                if (!isEquipped) {
                    addEquipmentMaterials(curRank, slot, isMagic, totalRequirements);
                }
            });
        } else {
            // 現在のランクから目標ランクまでの昇級に必要な素材を累積
            // 1. 現在ランクの未装備部位を揃えて、次のランクへ昇級する
            SLOTS.forEach((slot, idx) => {
                const isEquipped = apostle.equipped && apostle.equipped[idx];
                if (!isEquipped) {
                    addEquipmentMaterials(curRank, slot, isMagic, totalRequirements);
                }
            });

            // 2. 中間ランク（現在ランクの次から、目標ランクの1つ前まで）は、次のランクへ昇級するために6部位すべて必要
            for (let r = curRank + 1; r < targetRank; r++) {
                SLOTS.forEach(slot => {
                    addEquipmentMaterials(r, slot, isMagic, totalRequirements);
                });
            }

            // 3. 目標ランクに到達（昇級）した時点で終了するため、目標ランク自身の装備は不要（計算に含めない）
        }
    });

    // 必要数から所持数を引き、不足数を算出する
    const netRequirements = {};
    for (const key in totalRequirements) {
        const req = totalRequirements[key];
        const owned = inventory[key] || 0;
        const needed = req - owned;
        if (needed > 0) {
            netRequirements[key] = needed;
        }
    }

    const optimized = TrickcalOptimizer.optimizeFarmingPlan({
        needs: netRequirements,
        stages: STAGES_DB,
        maxArea,
        maxStage,
        rates
    }, optimizationSolver);

    const optimizedPlan = optimized.plan.map(item => ({
        ...item,
        mainName: MATERIAL_NAMES[item.main],
        subName: MATERIAL_NAMES[item.sub],
        candy: item.runs * 10,
        expectedMain: Math.round(item.expectedMain * 10) / 10,
        expectedSub: Math.round(item.expectedSub * 10) / 10
    }));

    const unreachableMaterials = optimized.unreachable.map(item => ({
        ...item,
        name: MATERIAL_NAMES[item.key]
    }));

    return {
        requirements: totalRequirements,
        needed: netRequirements,
        plan: optimizedPlan,
        unreachable: unreachableMaterials,
        totalCandy: optimized.totalRuns * 10
    };
}

// 装備と下位依存レシピを再帰的に加算するヘルパー関数
function addEquipmentMaterials(rank, slot, isMagic, reqMap) {
    const key = getMaterialKey(rank, slot, isMagic);
    
    const recipe = RECIPES[rank];
    if (!recipe) return;

    reqMap[key] = (reqMap[key] || 0) + recipe.mainCount;

    if (recipe.subRank && recipe.subCount > 0) {
        const subKey = getMaterialKey(recipe.subRank, slot, isMagic);
        reqMap[subKey] = (reqMap[subKey] || 0) + recipe.subCount;
    }
}

// --- 以下、UIバインディングおよびDOM制御ロジック ---

let activeApostles = []; // 育成リストに入っている使徒データ
let apostleIdCounter = 0;
let userInventoryCache = {}; // ユーザーが入力した所持数を保持するキャッシュ
let optimizerSolverPromise;

function saveActiveApostlesState() {
    TrickcalState.saveActiveApostles(localStorage, activeApostles);
}

function saveInventoryState() {
    TrickcalState.saveInventory(localStorage, userInventoryCache);
}

function invalidateResults() {
    const resultsCard = document.getElementById("results-card");
    if (resultsCard) {
        resultsCard.classList.add("hidden");
    }
}

function updateNoLimitSummaryVisibility(totalCandy, totalCandyNoLimit) {
    const summary = document.getElementById("no-limit-summary");
    if (!summary) {
        return;
    }
    summary.classList.toggle(
        "hidden",
        Number(totalCandy) === Number(totalCandyNoLimit)
    );
}

function bindPersistentSetting(inputId, storageKey) {
    document.getElementById(inputId).addEventListener("input", (event) => {
        localStorage.setItem(storageKey, event.target.value);
        invalidateResults();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    optimizerSolverPromise = TrickcalOptimizer.createHighsSolver(Module, {
        wasmBinary: TrickcalHighsWasm
    });
    const persistentState = TrickcalState.loadPersistentState(localStorage);
    activeApostles = TrickcalState.reconcileApostleTypes(
        persistentState.activeApostles,
        APOSTLES_DB
    );
    userInventoryCache = persistentState.inventory;
    saveActiveApostlesState();
    apostleIdCounter = activeApostles.reduce(
        (maxId, apostle) => Math.max(maxId, apostle.id),
        0
    );

    initApostlesSelect();
    renderApostlesList();
    updateRequiredMaterialsForm();
    initAdvancedSettings();
    
    // ステージクリア状況と期待値設定の復元 (localStorage)
    const savedArea = localStorage.getItem("maxArea");
    const savedStage = localStorage.getItem("maxStage");
    const savedRateMain = localStorage.getItem("rateMain");
    const savedRateSub = localStorage.getItem("rateSub");

    if (savedArea !== null) document.getElementById("max-area-input").value = savedArea;
    if (savedStage !== null) document.getElementById("max-stage-input").value = savedStage;
    if (savedRateMain !== null) document.getElementById("rate-main-input").value = savedRateMain;
    if (savedRateSub !== null) document.getElementById("rate-sub-input").value = savedRateSub;

    // 入力値変更時の自動保存イベント登録
    bindPersistentSetting("max-area-input", "maxArea");
    bindPersistentSetting("max-stage-input", "maxStage");
    bindPersistentSetting("rate-main-input", "rateMain");
    bindPersistentSetting("rate-sub-input", "rateSub");
    
    // 使徒追加ボタンイベント
    document.getElementById("add-apostle-btn").addEventListener("click", addApostleToList);
    // 計算ボタンイベント
    document.getElementById("calculate-btn").addEventListener("click", executeCalculation);
});

// 使徒セレクトボックス (カスタムサジェスト) の初期化と制御
function initApostlesSelect() {
    const input = document.getElementById("apostle-select");
    const list = document.getElementById("apostle-suggest-list");
    let activeIdx = -1;
    let currentSuggestions = [];

    // カタカナからひらがなへの変換
    const kanaToHira = (str) => {
        return str.replace(/[\u30a1-\u30f6]/g, (match) => {
            return String.fromCharCode(match.charCodeAt(0) - 0x60);
        });
    };

    // サジェストの描画
    const renderSuggestions = (filtered) => {
        list.innerHTML = "";
        currentSuggestions = filtered;
        
        if (filtered.length === 0) {
            list.classList.add("hidden");
            return;
        }

        filtered.forEach((ap, idx) => {
            const item = document.createElement("div");
            item.className = "suggest-item";
            if (idx === activeIdx) {
                item.classList.add("active");
            }

            const nameSpan = document.createElement("span");
            nameSpan.textContent = ap.name;

            const hintSpan = document.createElement("span");
            hintSpan.className = "yomi-hint";
            hintSpan.textContent = ap.type === "physical" ? "物理" : "魔法";

            item.appendChild(nameSpan);
            item.appendChild(hintSpan);

            // mousedown にすることで blur より先に選択が実行されるようにする
            item.addEventListener("mousedown", (e) => {
                e.preventDefault();
                selectSuggestion(ap.name);
            });

            list.appendChild(item);
        });

        list.classList.remove("hidden");
    };

    // サジェスト決定
    const selectSuggestion = (name) => {
        input.value = name;
        list.classList.add("hidden");
        activeIdx = -1;
    };

    // あいまい検索フィルタ
    const filterApostles = (query) => {
        const q = query.trim().toLowerCase();
        if (!q) {
            return APOSTLES_DB; // 空の場合は全使徒表示
        }

        const qHira = kanaToHira(q);

        return APOSTLES_DB.filter(ap => {
            const nameHira = kanaToHira(ap.name);
            return ap.name.toLowerCase().includes(q) || 
                   ap.yomi.includes(qHira) || 
                   ap.romaji.includes(q);
        });
    };

    // 入力監視
    input.addEventListener("input", (e) => {
        activeIdx = -1;
        const filtered = filterApostles(e.target.value);
        renderSuggestions(filtered);
    });

    // フォーカス時
    input.addEventListener("focus", () => {
        activeIdx = -1;
        const filtered = filterApostles(input.value);
        renderSuggestions(filtered);
    });

    // フォーカスアウト時
    input.addEventListener("blur", () => {
        list.classList.add("hidden");
    });

    // キーボード制御
    input.addEventListener("keydown", (e) => {
        if (list.classList.contains("hidden")) {
            if (e.key === "Enter" && input.value.trim()) {
                addApostleToList();
                e.preventDefault();
                return;
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                const filtered = filterApostles(input.value);
                renderSuggestions(filtered);
                e.preventDefault();
            }
            return;
        }

        if (e.key === "ArrowDown") {
            activeIdx = (activeIdx + 1) % currentSuggestions.length;
            renderSuggestions(currentSuggestions);
            const activeItem = list.querySelector(".suggest-item.active");
            if (activeItem) activeItem.scrollIntoView({ block: "nearest" });
            e.preventDefault();
        } else if (e.key === "ArrowUp") {
            activeIdx = (activeIdx - 1 + currentSuggestions.length) % currentSuggestions.length;
            renderSuggestions(currentSuggestions);
            const activeItem = list.querySelector(".suggest-item.active");
            if (activeItem) activeItem.scrollIntoView({ block: "nearest" });
            e.preventDefault();
        } else if (e.key === "Enter") {
            const selected = currentSuggestions[activeIdx] || currentSuggestions[0];
            if (selected) {
                selectSuggestion(selected.name);
                addApostleToList();
                e.preventDefault();
            }
        } else if (e.key === "Escape") {
            list.classList.add("hidden");
            activeIdx = -1;
            e.preventDefault();
        }
    });
}

// 動的所持素材入力フォームの生成・同期
function updateRequiredMaterialsForm() {
    const grid = document.getElementById("dynamic-material-grid");
    const emptyMsg = document.getElementById("material-empty-message");

    // 1. 必要とする総素材数を算出する
    const totalRequirements = {};
    activeApostles.forEach(apostle => {
        const isMagic = apostle.type === "magic";
        const curRank = apostle.currentRank;
        const targetRank = apostle.targetRank;
        
        if (curRank === targetRank) {
            SLOTS.forEach((slot, idx) => {
                const isEquipped = apostle.equipped && apostle.equipped[idx];
                if (!isEquipped) {
                    addEquipmentMaterials(curRank, slot, isMagic, totalRequirements);
                }
            });
        } else {
            SLOTS.forEach((slot, idx) => {
                const isEquipped = apostle.equipped && apostle.equipped[idx];
                if (!isEquipped) {
                    addEquipmentMaterials(curRank, slot, isMagic, totalRequirements);
                }
            });
            for (let r = curRank + 1; r < targetRank; r++) {
                SLOTS.forEach(slot => {
                    addEquipmentMaterials(r, slot, isMagic, totalRequirements);
                });
            }
        }
    });

    // 素材キーのソート（部位の並び順を最優先、同じ部位ならランク昇順 [低ランクが左/最初]）
    const requiredKeys = Object.keys(totalRequirements).sort((a, b) => {
        const parseKey = (k) => {
            const m = k.match(/^R(\d+)_(.+)$/);
            if (!m) return { r: 0, s: "" };
            return { r: parseInt(m[1]), s: m[2] };
        };
        const pa = parseKey(a);
        const pb = parseKey(b);
        const sOrder = ["PHYS_WEAPON", "MAG_WEAPON", "ARMOR", "HAT", "BOOTS", "SPARKLY", "SPLENDID"];
        
        const idxA = sOrder.indexOf(pa.s);
        const idxB = sOrder.indexOf(pb.s);
        
        if (idxA !== idxB) {
            return idxA - idxB; // 部位の並び順（昇順）
        }
        return pa.r - pb.r; // 同じ部位ならランク昇順 (低ランクが最初)
    });

    // 必要な素材が0件の場合
    if (requiredKeys.length === 0) {
        grid.innerHTML = "";
        grid.style.display = "none";
        emptyMsg.style.display = "block";
        return;
    }

    // 必要な素材がある場合、入力項目を表示
    grid.style.display = "grid";
    emptyMsg.style.display = "none";
    grid.innerHTML = "";

    requiredKeys.forEach(key => {
        const reqCount = totalRequirements[key];
        const currentVal = userInventoryCache[key] || 0;

        const group = document.createElement("div");
        group.className = "material-input-group";

        const label = document.createElement("label");
        label.setAttribute("for", `input-${key}`);
        label.className = "material-label";
        label.innerHTML = `${MATERIAL_NAMES[key] || key} <span class="req-count">(必要: ${reqCount}枚)</span>`;

        const input = document.createElement("input");
        input.type = "number";
        input.id = `input-${key}`;
        input.value = currentVal;
        input.min = "0";
        input.className = "material-count-input";

        const updateCache = (val) => {
            const num = Math.max(0, val);
            userInventoryCache[key] = num;
            input.value = num;
            saveInventoryState();
            invalidateResults();
        };

        input.addEventListener("input", (e) => {
            updateCache(parseInt(e.target.value) || 0);
        });
        input.addEventListener("blur", () => {
            updateCache(parseInt(input.value) || 0);
        });

        group.appendChild(label);
        group.appendChild(input);
        grid.appendChild(group);
    });
}

// 高度な設定（アコーディオン）制御
function initAdvancedSettings() {
    const toggle = document.getElementById("toggle-advanced-settings");
    const panel = document.getElementById("advanced-settings-panel");
    
    toggle.addEventListener("click", () => {
        panel.classList.toggle("hidden");
        if (panel.classList.contains("hidden")) {
            toggle.textContent = "高度な設定（ドロップ期待値） ▼";
        } else {
            toggle.textContent = "高度な設定（ドロップ期待値） ▲";
        }
    });
}

// 育成リストに使徒を追加
function addApostleToList() {
    const select = document.getElementById("apostle-select");
    const query = select.value.trim().toLowerCase();
    if (!query) {
        alert("使徒の名前を入力または選択してください。");
        return;
    }

    // カタカナからひらがなへの変換ユーティリティ
    const kanaToHira = (str) => {
        return str.replace(/[\u30a1-\u30f6]/g, (match) => {
            return String.fromCharCode(match.charCodeAt(0) - 0x60);
        });
    };
    const qHira = kanaToHira(query);

    // 選択された使徒データがあるか、名前・ひらがな・ローマ字からあいまい解決
    const ap = APOSTLES_DB.find(a => 
        a.name.toLowerCase() === query || 
        a.yomi === qHira || 
        a.romaji === query
    );

    if (!ap) {
        alert("指定された使徒が見つかりません。リストから名前を選択するか、正しい名前を入力してください。");
        return;
    }

    const type = ap.type;
    const apId = ++apostleIdCounter;

    const apostleData = {
        id: apId,
        name: ap.name, // あいまい解決された正式名（カタカナ）をセット
        type: type,
        currentRank: 6, // デフォルト初期ランク
        targetRank: 7,  // デフォルト目標ランク (現在ランク + 1)
        equipped: [false, false, false, false, false, false] // weapon, armor, hat, boots, sparkly, splendid
    };

    activeApostles.push(apostleData);
    saveActiveApostlesState();
    renderApostlesList();
    updateRequiredMaterialsForm();
    invalidateResults();
    
    // 選択をクリア
    select.value = "";
}

// 育成使徒リストのレンダリング
function renderApostlesList() {
    const listContainer = document.getElementById("active-apostles-list");
    listContainer.innerHTML = "";

    if (activeApostles.length === 0) {
        listContainer.innerHTML = '<p class="empty-message">育成する使徒を追加してください。</p>';
        return;
    }

    activeApostles.forEach(ap => {
        const card = document.createElement("div");
        card.className = "apostle-card";
        card.id = `ap-card-${ap.id}`;

        // ヘッダー
        const header = document.createElement("div");
        header.className = "apostle-card-header";
        
        const titleSpan = document.createElement("span");
        titleSpan.className = "apostle-title";
        titleSpan.textContent = ap.name;

        const badge = document.createElement("span");
        badge.className = `apostle-badge ${ap.type}`;
        badge.textContent = ap.type === "physical" ? "物理" : "魔法";
        titleSpan.appendChild(badge);

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn danger";
        deleteBtn.style.width = "auto";
        deleteBtn.style.padding = "4px 8px";
        deleteBtn.style.fontSize = "11px";
        deleteBtn.textContent = "削除";
        deleteBtn.addEventListener("click", () => {
            activeApostles = activeApostles.filter(a => a.id !== ap.id);
            saveActiveApostlesState();
            renderApostlesList();
            updateRequiredMaterialsForm();
            invalidateResults();
        });

        header.appendChild(titleSpan);
        header.appendChild(deleteBtn);

        // ボディ
        const body = document.createElement("div");
        body.className = "apostle-card-body";

        // ランク選択
        const rankGroup = document.createElement("div");
        rankGroup.className = "rank-selector-group";
        
        const curLabel = document.createElement("label");
        curLabel.textContent = "現在:";
        const curSelect = document.createElement("select");
        for (let r = 1; r <= 9; r++) {
            const opt = document.createElement("option");
            opt.value = r;
            opt.textContent = `R${r}`;
            if (r === ap.currentRank) opt.selected = true;
            curSelect.appendChild(opt);
        }
        
        const targetLabel = document.createElement("label");
        targetLabel.textContent = "目標:";
        const targetSelect = document.createElement("select");
        for (let r = 1; r <= 9; r++) {
            const opt = document.createElement("option");
            opt.value = r;
            opt.textContent = `R${r}`;
            if (r === ap.targetRank) opt.selected = true;
            targetSelect.appendChild(opt);
        }

        // ランク変更時のイベント
        curSelect.addEventListener("change", (e) => {
            const newCur = parseInt(e.target.value);
            ap.currentRank = newCur;
            
            // 目標ランクを自動的に「現在ランク + 1」に設定 (最大9)
            const newTarget = Math.min(9, newCur + 1);
            ap.targetRank = newTarget;
            targetSelect.value = newTarget;
            saveActiveApostlesState();
            
            updateEquipCheckboxes(ap, card);
            updateRequiredMaterialsForm();
            invalidateResults();
        });

        targetSelect.addEventListener("change", (e) => {
            const newTarget = parseInt(e.target.value);
            ap.targetRank = newTarget;
            // 現在ランクが目標ランクを上回らないように補正
            if (ap.currentRank > newTarget) {
                ap.currentRank = newTarget;
                curSelect.value = newTarget;
                updateEquipCheckboxes(ap, card);
            }
            saveActiveApostlesState();
            updateRequiredMaterialsForm();
            invalidateResults();
        });

        rankGroup.appendChild(curLabel);
        rankGroup.appendChild(curSelect);
        rankGroup.appendChild(targetLabel);
        rankGroup.appendChild(targetSelect);

        body.appendChild(rankGroup);

        // 現在ランクでの装備チェックボックス
        const equipTitle = document.createElement("div");
        equipTitle.className = "equipment-grid-title";
        equipTitle.textContent = "現在ランクでの装備済みスロット (チェックで除外):";
        body.appendChild(equipTitle);

        const equipGrid = document.createElement("div");
        equipGrid.className = "equipment-grid";
        equipGrid.id = `equip-grid-${ap.id}`;
        
        body.appendChild(equipGrid);

        card.appendChild(header);
        card.appendChild(body);
        listContainer.appendChild(card);

        // 装備チェックボックスの初期描画
        updateEquipCheckboxes(ap, card);
    });
}

// 装備チェックボックスの更新 (六角形レイアウト)
function updateEquipCheckboxes(ap, cardElement) {
    const grid = cardElement.querySelector(`.equipment-grid`);
    grid.innerHTML = "";

    // 中央のほっぺサークルを追加
    const center = document.createElement("div");
    center.className = "apostle-center-circle";
    center.innerHTML = `<span>もちほっぺ</span>`;
    grid.appendChild(center);

    SLOTS.forEach((slot, idx) => {
        const label = document.createElement("label");
        label.className = `equip-checkbox-label slot-${slot}`;
        if (ap.equipped[idx]) {
            label.classList.add("checked");
        }
        
        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.style.display = "none"; // チェックボックス自体は隠してボタン化
        chk.checked = ap.equipped[idx];
        chk.addEventListener("change", (e) => {
            ap.equipped[idx] = e.target.checked;
            if (e.target.checked) {
                label.classList.add("checked");
            } else {
                label.classList.remove("checked");
            }
            saveActiveApostlesState();
            updateRequiredMaterialsForm(); // 所持素材入力欄を即時連動して更新
            invalidateResults();
        });

        label.appendChild(chk);
        
        // スロット名とアイコン（チェック状態によって表示をトグルするためのラッパー）
        const slotContent = document.createElement("span");
        slotContent.className = "slot-content";
        const labelText = slot === "weapon" ? (ap.type === "magic" ? "🔮 武器" : "⚔️ 武器") : SLOT_NAMES[slot];
        slotContent.textContent = labelText;
        label.appendChild(slotContent);

        grid.appendChild(label);
    });
}

// 最適周回計算の実行と描画
async function executeCalculation() {
    if (activeApostles.length === 0) {
        alert("育成リストに使徒を追加してください。");
        return;
    }

    // 入力値の取得
    const maxArea = parseInt(document.getElementById("max-area-input").value || 28);
    const maxStage = parseInt(document.getElementById("max-stage-input").value || 8);
    const rateMain = document.getElementById("rate-main-input").value || "1.0";
    const rateSub = document.getElementById("rate-sub-input").value || "1.0";
    
    // 所持素材データの読み取り (キャッシュからコピー)
    const inventory = { ...userInventoryCache };
    const calculateButton = document.getElementById("calculate-btn");
    const originalButtonText = calculateButton.textContent;
    calculateButton.disabled = true;
    calculateButton.textContent = "計算中...";

    try {
        const optimizationSolver = await optimizerSolverPromise;
        const rates = { main: rateMain, sub: rateSub };

        // 計算の実行 (制限あり)
        const result = calculateFarmingPlan(
            activeApostles,
            inventory,
            maxArea,
            maxStage,
            rates,
            optimizationSolver
        );

        // 計算の実行 (制限なし - 全ステージ解放想定: エリア30, ステージ12)
        const resultNoLimit = calculateFarmingPlan(
            activeApostles,
            inventory,
            30,
            12,
            rates,
            optimizationSolver
        );

        // 結果の描画
        renderResults(result, resultNoLimit.totalCandy);
    } catch (error) {
        console.error(error);
        alert(error instanceof Error
            ? error.message
            : "最適な周回計画を計算できませんでした。");
    } finally {
        calculateButton.disabled = false;
        calculateButton.textContent = originalButtonText;
    }
}

// 計算結果の描画
function renderResults(result, totalCandyNoLimit) {
    const resultsCard = document.getElementById("results-card");
    resultsCard.classList.remove("hidden");

    // サマリー (制限あり、制限なし)
    document.getElementById("res-total-candy").textContent = result.totalCandy;
    document.getElementById("res-total-candy-nolimit").textContent = totalCandyNoLimit;
    updateNoLimitSummaryVisibility(result.totalCandy, totalCandyNoLimit);

    // 周回テーブル
    const tbody = document.getElementById("res-stages-tbody");
    tbody.innerHTML = "";

    if (result.plan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">周回する必要はありません（素材がすでに十分揃っています）。</td></tr>';
    } else {
        result.plan.forEach(p => {
            const tr = document.createElement("tr");
            
            const tdStage = document.createElement("td");
            tdStage.style.fontWeight = "700";
            tdStage.textContent = p.stage;
            
            const tdCandy = document.createElement("td");
            tdCandy.style.fontWeight = "700";
            tdCandy.textContent = `${p.candy} キャンディ`;
            
            const tdDrops = document.createElement("td");
            tdDrops.innerHTML = `
                <div>・${p.mainName} (期待値: <strong>${p.expectedMain}</strong> 枚)</div>
                <div>・${p.subName} (期待値: <strong>${p.expectedSub}</strong> 枚)</div>
            `;

            tr.appendChild(tdStage);
            tr.appendChild(tdCandy);
            tr.appendChild(tdDrops);
            tbody.appendChild(tr);
        });
    }

    // 解放制限警告
    const warningSection = document.getElementById("unreachable-section");
    const warningList = document.getElementById("res-unreachable-list");
    warningList.innerHTML = "";

    if (result.unreachable.length > 0) {
        warningSection.classList.remove("hidden");
        result.unreachable.forEach(item => {
            const li = document.createElement("li");
            li.textContent = `${item.name}: あと ${item.needed} 枚 (この素材がドロップするエリアが未解放です)`;
            warningList.appendChild(li);
        });
    } else {
        warningSection.classList.add("hidden");
    }

    // 結果表示位置へスムーズスクロール
    resultsCard.scrollIntoView({ behavior: "smooth" });
}



