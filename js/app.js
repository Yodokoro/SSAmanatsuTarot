// 占いの処理はすべてブラウザ内で完結する(サーバー不要)。
(function () {
  const startScreen = document.getElementById("start");
  const startBtn = document.getElementById("start-btn");
  const questionInput = document.getElementById("question");
  const pickScreen = document.getElementById("pick");
  const deckEl = document.getElementById("deck");
  const resultScreen = document.getElementById("result");
  const chosenCard = document.getElementById("chosen-card");
  const chosenImg = document.getElementById("chosen-img");
  const resultBody = document.getElementById("result-body");
  const shownQuestions = document.querySelectorAll(".shown-question");
  const retryBtn = document.getElementById("retry");

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

  // Fisher–Yates シャッフル。正位置・逆位置もここで決める。
  function shuffleDeck() {
    const a = CARDS.map(function (card) {
      return { card: card, reversed: randomInt(2) === 1 };
    });
    for (let i = a.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function show(screen) {
    [startScreen, pickScreen, resultScreen].forEach(function (s) { s.hidden = s !== screen; });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setQuestion() {
    const q = questionInput.value.trim();
    shownQuestions.forEach(function (el) {
      el.textContent = q ? "「" + q + "」" : "";
      el.hidden = !q;
    });
  }

  function layDeck() {
    const deck = shuffleDeck();
    deckEl.innerHTML = "";
    deck.forEach(function (pick, i) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "deck-card";
      btn.style.animationDelay = i * 0.03 + "s";
      btn.setAttribute("aria-label", (i + 1) + "枚目のカードを選ぶ");
      btn.innerHTML = '<span class="card-back" aria-hidden="true"><span class="back-mark">✦</span></span>';
      btn.addEventListener("click", function () { choose(btn, pick); });
      deckEl.appendChild(btn);
    });
  }

  function choose(btn, pick) {
    if (deckEl.classList.contains("chosen")) return;
    deckEl.classList.add("chosen");
    btn.classList.add("selected");

    // 画像を先に読み込み始める
    const c = pick.card;
    chosenImg.src = "imgs/" + c.id + ".png";
    chosenImg.alt = c.name + (pick.reversed ? "(逆位置)" : "(正位置)");
    chosenImg.classList.toggle("reversed", pick.reversed);
    chosenCard.classList.remove("flipped");
    resultBody.hidden = true;
    fillResult(pick);

    setTimeout(function () {
      show(resultScreen);
      // 表示されてからめくる
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { chosenCard.classList.add("flipped"); });
      });
      setTimeout(function () { resultBody.hidden = false; }, 750);
    }, 600);
  }

  function fillResult(pick) {
    const c = pick.card;
    resultBody.classList.toggle("is-reversed", pick.reversed);
    resultBody.querySelector(".roman").textContent = c.roman;
    resultBody.querySelector(".name").textContent = c.name;
    resultBody.querySelector(".orientation").textContent = pick.reversed ? "逆位置" : "正位置";
    resultBody.querySelector(".en").textContent = c.en;
    resultBody.querySelector(".meaning").textContent = pick.reversed ? c.reversed : c.upright;
  }

  startBtn.addEventListener("click", function () {
    setQuestion();
    deckEl.classList.remove("chosen");
    layDeck();
    show(pickScreen);
  });

  retryBtn.addEventListener("click", function () {
    show(startScreen);
  });
})();
