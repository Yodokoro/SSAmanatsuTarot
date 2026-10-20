// 占いの処理はすべてブラウザ内で完結する(サーバー不要)。
// ページを開いたときに13枚を配り、再読み込みするまで同じ結果を保つ。
(function () {
  const spreadView = document.getElementById("spread-view");
  const resultView = document.getElementById("result-view");
  const board = document.getElementById("board");
  const progress = document.getElementById("progress");
  const resultImg = document.getElementById("result-img");
  const resultCard = document.getElementById("result-card");
  const langSelect = document.getElementById("lang-select");
  const zoom = document.getElementById("zoom");
  const zoomImg = document.getElementById("zoom-img");

  // ---------- 言語 ----------
  const STORAGE_KEY = "amanatsu-tarot-lang";

  function loadLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (LANGS.indexOf(saved) >= 0) return saved;
    } catch (e) { /* 保存できない環境では既定の言語 */ }
    return DEFAULT_LANG;
  }

  let lang = loadLang();
  function ui() { return UI[lang]; }
  function text() { return TAROT_TEXT[lang]; }
  function posText(pos) { return text().positions[POSITIONS.indexOf(pos)]; }
  function cardText(card) { return text().cards[card.id]; }

  // ---------- 配る ----------
  // 0 以上 max 未満の乱数(使えれば crypto を使う)
  function randomInt(max) {
    if (window.crypto && window.crypto.getRandomValues) {
      const buf = new Uint32Array(1);
      const limit = Math.floor(0x100000000 / max) * max;
      do { window.crypto.getRandomValues(buf); } while (buf[0] >= limit);
      return buf[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  // Fisher–Yates でシャッフルし、項目の数だけ配る。正位置・逆位置もここで決める。
  function deal() {
    const deck = CARDS.slice();
    for (let i = deck.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return POSITIONS.map(function (pos, i) {
      return { pos: pos, card: deck[i], reversed: randomInt(2) === 1, opened: false, btn: null, label: null };
    });
  }

  const picks = deal();
  let currentPick = null; // 結果画面に出しているカード

  // ---------- 配置画面 ----------
  function updateProgress() {
    const n = picks.filter(function (p) { return p.opened; }).length;
    progress.textContent = n === picks.length
      ? ui().allOpen
      : fill(ui().progress, { n: n, total: picks.length });
  }

  // ラベルを置く向き。上半分はカードの上、それ以外は下。左右はひし形の外側へずらす。
  function labelPlacement(pos) {
    const side = pos.x < 0 ? -1 : pos.x > 0 ? 1 : 0;
    const vert = pos.y < 0 ? "above" : "below";
    return { side: side, vert: vert };
  }

  function updateCardAria(pick) {
    const name = posText(pick.pos).name;
    const label = pick.opened
      ? fill(ui().openAria, { no: pick.pos.no, name: name, card: cardText(pick.card).name })
      : fill(ui().flipAria, { no: pick.pos.no, name: name });
    pick.btn.setAttribute("aria-label", label);
  }

  function buildBoard() {
    picks.forEach(function (pick, i) {
      const pos = pick.pos;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mini";
      btn.style.setProperty("--x", pos.x);
      btn.style.setProperty("--y", pos.y);
      btn.style.zIndex = 10 + i;
      btn.innerHTML =
        '<span class="mini-inner">' +
          '<span class="face back"><span class="mini-no">' + pos.no + "</span></span>" +
          '<span class="face front"></span>' +
        "</span>";
      btn.addEventListener("click", function () { onCardClick(pick); });
      board.appendChild(btn);
      pick.btn = btn;

      const lp = labelPlacement(pos);
      const label = document.createElement("span");
      label.className = "label " + lp.vert + (pos.no === 13 ? " key" : "");
      label.style.setProperty("--x", pos.x);
      label.style.setProperty("--y", pos.y);
      label.style.setProperty("--side", lp.side);
      label.setAttribute("aria-hidden", "true");
      board.appendChild(label);
      pick.label = label;
    });
  }

  function onCardClick(pick) {
    if (pick.opened) {
      openResult(pick);
      return;
    }
    pick.opened = true;
    const btn = pick.btn;
    const img = document.createElement("img");
    img.src = "imgs/" + pick.card.id + ".png";
    img.alt = "";
    if (pick.reversed) img.className = "reversed";
    btn.querySelector(".front").appendChild(img);
    btn.classList.add("flipped");
    btn.style.zIndex = 50 + POSITIONS.indexOf(pick.pos); // めくったカードは手前に出す
    updateCardAria(pick);
    updateProgress();
    setTimeout(function () { openResult(pick); }, 900);
  }

  // ---------- 結果画面 ----------
  function setText(selector, value) {
    resultView.querySelector(selector).textContent = value;
  }

  function renderResult(pick) {
    const c = pick.card;
    const ct = cardText(c);
    const pos = pick.pos;
    const pt = posText(pos);
    const key = pick.reversed ? "rev" : "up";
    const orientation = pick.reversed ? ui().reversed : ui().upright;

    setText(".position-no", pos.no === 13 ? ui().positionKey : fill(ui().positionNo, { no: pos.no }));
    setText(".position-name", fill(ui().positionHead, { name: pt.name, theme: pt.theme }));
    setText(".position-desc", pt.desc);

    resultImg.src = "imgs/" + c.id + ".png";
    resultImg.alt = ct.name + "(" + orientation + ")";
    resultImg.classList.toggle("reversed", pick.reversed);

    const en = resultView.querySelector(".card-en");
    en.textContent = c.en;
    en.hidden = !ui().showEnglishName;
    setText(".card-roman", c.roman);
    setText(".card-name", ct.name);
    setText(".orientation", orientation);
    setText(".specific-text", ct.readings[key][POSITIONS.indexOf(pos)]);
    setText(".keywords", ct.keywords[key]);
    setText(".general-text", ct.meaning[key]);
    resultView.classList.toggle("is-reversed", pick.reversed);
  }

  function openResult(pick) {
    currentPick = pick;
    renderResult(pick);
    history.pushState({ view: "result" }, "");
    spreadView.hidden = true;
    resultView.hidden = false;
    window.scrollTo(0, 0);
  }

  function showSpread() {
    currentPick = null;
    resultView.hidden = true;
    spreadView.hidden = false;
    window.scrollTo(0, 0);
  }

  // 戻るボタンとブラウザの「戻る」を同じ動きにする
  resultView.querySelectorAll("[data-back]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (history.state && history.state.view === "result") history.back();
      else showSpread();
    });
  });
  window.addEventListener("popstate", function () {
    closeZoom();
    if (!resultView.hidden) showSpread();
  });

  // ---------- 拡大表示 ----------
  // カードをクリックすると拡大、もう一度クリックで元に戻す
  function closeZoom() {
    zoom.hidden = true;
    document.body.classList.remove("zoomed");
  }
  resultCard.addEventListener("click", function () {
    zoomImg.src = resultImg.src;
    zoomImg.alt = resultImg.alt;
    zoomImg.classList.toggle("reversed", resultImg.classList.contains("reversed"));
    zoom.hidden = false;
    document.body.classList.add("zoomed");
    zoom.focus();
  });
  zoom.addEventListener("click", closeZoom);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !zoom.hidden) closeZoom();
  });

  // ---------- 言語の反映 ----------
  function applyLang() {
    const u = ui();
    document.documentElement.lang = lang;
    document.title = u.title;
    document.querySelector('meta[name="description"]').setAttribute("content", u.description);
    document.getElementById("lang-label").textContent = u.langLabel;

    // data-i18n="h1.0" のような指定で文言を入れる
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const path = el.getAttribute("data-i18n").split(".");
      let v = u;
      path.forEach(function (k) { v = v[k]; });
      el.textContent = v;
    });

    resultCard.setAttribute("aria-label", u.zoomOpen);
    zoom.setAttribute("aria-label", u.zoomClose);

    picks.forEach(function (pick) {
      pick.label.textContent = posText(pick.pos).name;
      updateCardAria(pick);
    });
    updateProgress();
    if (currentPick) renderResult(currentPick);
  }

  LANGS.forEach(function (code) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = UI[code].label;
    langSelect.appendChild(opt);
  });
  langSelect.value = lang;
  langSelect.addEventListener("change", function () {
    lang = langSelect.value;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* 保存できなくても切り替えは行う */ }
    applyLang();
  });

  // 再読み込み後に履歴が残っていても、配置画面から始める
  if (history.state && history.state.view === "result") history.replaceState(null, "");

  buildBoard();
  applyLang();
})();
