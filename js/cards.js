// 言語に関係しない共通データ。文章は js/lang/<言語>.js にあり、ここと同じ並び順。
// 画像は imgs/<id>.png を使う。

// ホロスコープ・スプレッドの13項目。x, y はひし形の中での位置(中心が 0,0)。
const POSITIONS = [
  { no: 1, x: -3, y: 0 },
  { no: 2, x: -2, y: 1 },
  { no: 3, x: -1, y: 2 },
  { no: 4, x: 0, y: 3 },
  { no: 5, x: 1, y: 2 },
  { no: 6, x: 2, y: 1 },
  { no: 7, x: 3, y: 0 },
  { no: 8, x: 2, y: -1 },
  { no: 9, x: 1, y: -2 },
  { no: 10, x: 0, y: -3 },
  { no: 11, x: -1, y: -2 },
  { no: 12, x: -2, y: -1 },
  { no: 13, x: 0, y: 0 },
];

// 大アルカナ22枚
const CARDS = [
  { id: 0, roman: "0", en: "THE FOOL" },
  { id: 1, roman: "I", en: "THE MAGICIAN" },
  { id: 2, roman: "II", en: "THE HIGH PRIESTESS" },
  { id: 3, roman: "III", en: "THE EMPRESS" },
  { id: 4, roman: "IV", en: "THE EMPEROR" },
  { id: 5, roman: "V", en: "THE HIEROPHANT" },
  { id: 6, roman: "VI", en: "THE LOVERS" },
  { id: 7, roman: "VII", en: "THE CHARIOT" },
  { id: 8, roman: "VIII", en: "STRENGTH" },
  { id: 9, roman: "IX", en: "THE HERMIT" },
  { id: 10, roman: "X", en: "WHEEL OF FORTUNE" },
  { id: 11, roman: "XI", en: "JUSTICE" },
  { id: 12, roman: "XII", en: "THE HANGED MAN" },
  { id: 13, roman: "XIII", en: "DEATH" },
  { id: 14, roman: "XIV", en: "TEMPERANCE" },
  { id: 15, roman: "XV", en: "THE DEVIL" },
  { id: 16, roman: "XVI", en: "THE TOWER" },
  { id: 17, roman: "XVII", en: "THE STAR" },
  { id: 18, roman: "XVIII", en: "THE MOON" },
  { id: 19, roman: "XIX", en: "THE SUN" },
  { id: 20, roman: "XX", en: "JUDGEMENT" },
  { id: 21, roman: "XXI", en: "THE WORLD" },
];
