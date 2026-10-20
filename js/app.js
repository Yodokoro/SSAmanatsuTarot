// 占いの処理はすべてブラウザ内で完結する(サーバー不要)。
// ページを開いたときに13枚を配り、再読み込みするまで同じ結果を保つ。
(function () {
  const spreadView = document.getElementById("spread-view");
  const resultView = document.getElementById("result-view");
  const board = document.getElementById("board");
  const progress = document.getElementById("progress");
  const resultImg = document.getElementById("result-img");

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
      return { pos: pos, card: deck[i], reversed: randomInt(2) === 1, opened: false };
    });
  }

  const picks = deal();

  function updateProgress() {
    const n = picks.filter(function (p) { return p.opened; }).length;
    progress.textContent = n === picks.length
      ? "すべてのカードがひらきました"
      : "めくったカード " + n + " / " + picks.length;
  }

  // ラベルを置く向き。上半分はカードの上、それ以外は下。左右はひし形の外側へずらす。
  function labelPlacement(pos) {
    const side = pos.x < 0 ? -1 : pos.x > 0 ? 1 : 0;
    const vert = pos.y < 0 ? "above" : "below";
    return { side: side, vert: vert };
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
      btn.setAttribute("aria-label", pos.no + "番 " + pos.name + "のカードをめくる");
      btn.innerHTML =
        '<span class="mini-inner">' +
          '<span class="face back"><span class="mini-no">' + pos.no + "</span></span>" +
          '<span class="face front"></span>' +
        "</span>";
      btn.addEventListener("click", function () { onCardClick(btn, pick); });
      board.appendChild(btn);

      const lp = labelPlacement(pos);
      const label = document.createElement("span");
      label.className = "label " + lp.vert + (pos.no === 13 ? " key" : "");
      label.style.setProperty("--x", pos.x);
      label.style.setProperty("--y", pos.y);
      label.style.setProperty("--side", lp.side);
      label.textContent = pos.name;
      label.setAttribute("aria-hidden", "true");
      board.appendChild(label);
    });
  }

  function onCardClick(btn, pick) {
    if (pick.opened) {
      openResult(pick);
      return;
    }
    pick.opened = true;
    const front = btn.querySelector(".front");
    const img = document.createElement("img");
    img.src = "imgs/" + pick.card.id + ".png";
    img.alt = "";
    if (pick.reversed) img.className = "reversed";
    front.appendChild(img);
    btn.classList.add("flipped");
    btn.style.zIndex = 50 + POSITIONS.indexOf(pick.pos); // めくったカードは手前に出す
    btn.setAttribute("aria-label", pick.pos.no + "番 " + pick.pos.name + ":" + pick.card.name + "(結果を見る)");
    updateProgress();
    setTimeout(function () { openResult(pick); }, 900);
  }

  function setText(selector, text) {
    resultView.querySelector(selector).textContent = text;
  }

  function openResult(pick) {
    const c = pick.card;
    const pos = pick.pos;
    const key = pick.reversed ? "rev" : "up";
    const idx = POSITIONS.indexOf(pos);

    setText(".position-no", pos.no === 13 ? "13 ・ 全体" : pos.no + " / 12");
    setText(".position-name", pos.name + "  ―  " + pos.theme);
    setText(".position-desc", pos.desc);

    resultImg.src = "imgs/" + c.id + ".png";
    resultImg.alt = c.name + (pick.reversed ? "(逆位置)" : "(正位置)");
    resultImg.classList.toggle("reversed", pick.reversed);

    setText(".card-en", c.en);
    setText(".card-roman", c.roman);
    setText(".card-name", c.name);
    setText(".orientation", pick.reversed ? "逆位置" : "正位置");
    setText(".specific-text", c.readings[key][idx]);
    setText(".keywords", c.keywords[key]);
    setText(".general-text", c.meaning[key]);
    resultView.classList.toggle("is-reversed", pick.reversed);

    history.pushState({ view: "result" }, "");
    showResult();
  }

  function showResult() {
    spreadView.hidden = true;
    resultView.hidden = false;
    window.scrollTo(0, 0);
  }

  function showSpread() {
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

  // カードをクリックすると拡大、もう一度クリックで元に戻す
  const zoom = document.getElementById("zoom");
  const zoomImg = document.getElementById("zoom-img");
  function closeZoom() {
    zoom.hidden = true;
    document.body.classList.remove("zoomed");
  }
  document.getElementById("result-card").addEventListener("click", function () {
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

  // 再読み込み後に履歴が残っていても、配置画面から始める
  if (history.state && history.state.view === "result") history.replaceState(null, "");

  buildBoard();
  updateProgress();
})();
