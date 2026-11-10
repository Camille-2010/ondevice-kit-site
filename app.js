/* ============================================================
   OnDevice Kit 官网 — 交互
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 滚动进度 + 导航状态 ---------- */
  var progress = document.getElementById("progress");
  var nav = document.getElementById("nav");

  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? window.scrollY / h : 0;
    progress.style.width = (p * 100).toFixed(2) + "%";
    nav.classList.toggle("stuck", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 滚动显现 ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* 锚点直达时（带 hash 打开），目标区块必须立刻可见 ——
     否则浏览器在 reveal 元素（opacity:0）上定位，滚动到位后内容却是空的。 */
  function revealIn(root) {
    (root || document).querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("in");
      io.unobserve(el);
    });
  }

  function scrollToY(y) {
    var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(0, Math.max(0, Math.min(y, max)));
  }

  function jumpTo(id, smooth) {
    var t = document.querySelector(id);
    if (!t) return;
    revealIn(t);
    var y = t.getBoundingClientRect().top + window.scrollY - 78;
    if (smooth) {
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    } else {
      // 精确定位：临时关掉 CSS 平滑滚动，否则 scrollTo 的目标坐标会被插值
      document.documentElement.classList.add("no-smooth");
      scrollToY(y);
      requestAnimationFrame(function () {
        document.documentElement.classList.remove("no-smooth");
      });
    }
  }

  if (location.hash) {
    // 定位需要准确的布局坐标，因此先让所有 reveal 元素立即就位（去掉 transform），
    // 否则 getBoundingClientRect 拿到的是动画中途的偏移值。
    document.documentElement.classList.add("no-smooth", "no-anim");
    var tries = 0;
    function locate() {
      revealIn(document);
      void document.body.offsetHeight;   // 强制 reflow
      var t = document.querySelector(location.hash);
      if (t) {
        var y = t.getBoundingClientRect().top + window.scrollY - 78;
        scrollToY(y);
      }
      tries++;
      if (tries < 5) requestAnimationFrame(locate);
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { requestAnimationFrame(locate); });
    } else {
      requestAnimationFrame(locate);
    }
    window.addEventListener("load", function () { requestAnimationFrame(locate); });
    // 定位完成后再恢复动画
    setTimeout(function () { document.documentElement.classList.remove("no-anim"); }, 900);
  }

  /* ---------- 能力卡展开 ---------- */
  var cards = document.querySelectorAll(".wcard");
  cards.forEach(function (c) {
    c.addEventListener("click", function () {
      // 用户手动点过的卡打标：滚到中部时的自动展开/合上不再碰它
      c.dataset.userToggled = "1";
      c.classList.toggle("open");
    });
  });

  /* ---------- 手机端：卡片滚到屏幕中部自动展开，翻过去自动合上 ----------
     · 仅 ≤820px 生效（matchMedia 门控），桌面保持纯手动
     · 用中部带 IntersectionObserver（上下各收 42%）：进带展开、出带合上
     · 展开前先跑一次按压回弹动画（pressed → springing），模拟"点了一下"
     · 用户手动点过的卡（userToggled）完全交给用户 */
  var pressPulse = function (el) {
    if (el.classList.contains("springing")) return;
    el.classList.add("pressed");
    setTimeout(function () {
      el.classList.remove("pressed");
      el.classList.add("springing");
      setTimeout(function () { el.classList.remove("springing"); }, 560);
    }, 130);
  };
  var mqMobile = window.matchMedia("(max-width: 820px)");
  var midBand = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var el = e.target;
      if (el.dataset.userToggled) return;
      if (e.isIntersecting) {
        if (!el.classList.contains("open")) {
          el.classList.add("open");
          pressPulse(el);
        }
      } else if (el.classList.contains("open")) {
        el.classList.remove("open");
      }
    });
  }, { rootMargin: "-42% 0px -42% 0px", threshold: 0 });
  function syncCardObserver() {
    if (mqMobile.matches) {
      cards.forEach(function (c) { midBand.observe(c); });
    } else {
      cards.forEach(function (c) { midBand.unobserve(c); });
    }
  }
  syncCardObserver();
  if (mqMobile.addEventListener) mqMobile.addEventListener("change", syncCardObserver);
  else mqMobile.addListener(syncCardObserver);

  /* 有角标（实验性 / 提示）的卡片：标题让出右侧空间。
     CSS :has() 在旧浏览器无效，这里用 JS 兜底。 */
  cards.forEach(function (c) {
    if (c.querySelector(".w-flag")) c.classList.add("has-flag");
  });

  /* ---------- 移动端：抽屉菜单 ---------- */
  var burger = document.getElementById("navBurger");
  var sheet = document.getElementById("navSheet");

  function setSheet(open) {
    if (!sheet || !burger) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      sheet.hidden = false;
      // 强制 reflow，保证 opacity 过渡生效
      void sheet.offsetWidth;
      sheet.classList.add("in");
      document.body.style.overflow = "hidden";
    } else {
      sheet.classList.remove("in");
      document.body.style.overflow = "";
      window.setTimeout(function () {
        if (!sheet.classList.contains("in")) sheet.hidden = true;
      }, 320);
    }
  }

  if (burger && sheet) {
    burger.addEventListener("click", function () {
      setSheet(burger.getAttribute("aria-expanded") !== "true");
    });
    sheet.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        // 先解锁滚动再跳锚点，否则 body overflow:hidden 会吃掉滚动
        setSheet(false);
        document.body.style.overflow = "";
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setSheet(false);
    });
  }

  /* 移动端底部操作栏已移除（2026-11-08） */

  /* ---------- 可点击卡片的按压回弹 ----------
     :active 无法控制"松手"的时机（手指滑出元素时状态会乱跳），
     所以用 pointer 事件自己管：
       pointerdown  → 加 .pressed（缩进去）
       pointerup    → 换 .springing（跑弹性动画），动画结束自动清类
     只动 transform，不改背景色 —— 整卡白闪那种观感很粗糙。

     用事件委托而不是逐元素绑定：截图缩略图、轮播点等是 JS 动态
     生成的，逐个绑定会漏掉它们。 */
  var PRESS_SEL = [
    ".wcard", ".cap", ".pal", ".dl-item", ".eng", ".fb-layer", ".tool",
    ".style-card", ".shot-list button", ".shot-thumb", ".shot-nav button",
    ".nav-cta", ".nav-sheet-in a", ".qq-btn"
  ].join(",");

  function pressTarget(el) {
    return el && el.closest ? el.closest(PRESS_SEL) : null;
  }

  document.addEventListener("pointerdown", function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    var el = pressTarget(e.target);
    if (!el) return;
    if (el.classList.contains("springing")) return;
    clearTimeout(el.__springTimer);
    el.classList.remove("springing");
    el.classList.add("pressed");
  }, true);

  function endPress(e) {
    var el = e ? pressTarget(e.target) : null;
    if (!el) return;
    if (!el.classList.contains("pressed")) return;
    el.classList.remove("pressed");
    el.classList.add("springing");
    clearTimeout(el.__springTimer);
    el.__springTimer = setTimeout(function () {
      el.classList.remove("springing");
    }, 560);
  }

  document.addEventListener("pointerup", endPress, true);
  document.addEventListener("pointercancel", endPress, true);
  // 手指滑出元素时也要收尾（按键已松开才算"按住"）
  document.addEventListener("pointerleave", function (e) {
    if (!e.buttons) endPress(e);
  }, true);
  // 键盘激活时也给个反馈
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var el = pressTarget(e.target);
    if (!el) return;
    clearTimeout(el.__springTimer);
    el.classList.remove("springing");
    el.classList.add("pressed");
  }, true);
  document.addEventListener("keyup", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    endPress(e);
  }, true);

  /* ---------- 深度实现：切页 ---------- */
  var navBtns = document.querySelectorAll("#deepNav button");
  var panes = document.querySelectorAll(".pane");
  var metersIn = {};

  function showPane(id) {
    navBtns.forEach(function (b) { b.classList.toggle("on", b.dataset.pane === id); });
    panes.forEach(function (p) { p.classList.toggle("on", p.id === id); });
    var pane = document.getElementById(id);
    if (pane && !metersIn[id]) {
      metersIn[id] = true;
      pane.querySelectorAll(".meter-fill").forEach(function (f, i) {
        setTimeout(function () { f.style.width = f.dataset.w + "%"; }, 120 * i);
      });
    }
  }
  navBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      showPane(b.dataset.pane);
      /* 窄屏下标签条是横向滚动的，切换后把当前项滚进可视区 */
      if (b.scrollIntoView) {
        try { b.scrollIntoView({ block: "nearest", inline: "center" }); } catch (e) { /* 老浏览器忽略 */ }
      }
    });
  });

  /* ---------- 设备档位：真实矩阵 ---------- */
  var ram = document.getElementById("ram");
  var soc = document.getElementById("soc");
  var isa = document.getElementById("isa");
  var tierName = document.getElementById("tierName");
  var tierDesc = document.getElementById("tierDesc");
  var tierBadge = document.getElementById("tierBadge");
  var recList = document.getElementById("recList");
  var matrixBody = document.getElementById("tierMatrix");

  var SOC_LABEL = ["入门", "中端", "高端", "旗舰"];
  var ISA_LABEL = ["基础", "含 dotprod", "含 i8mm / sve2"];

  /* 内存档 × SoC 档 → 设备档位（对齐源码 deviceRules 的 tier_matrix 结构） */
  var RAM_BANDS = [
    { max: 4, label: "< 4GB" },
    { max: 6, label: "4–6GB" },
    { max: 8, label: "6–8GB" },
    { max: 12, label: "8–12GB" },
    { max: Infinity, label: "12GB+" }
  ];
  var MATRIX = [
    /* lt-4 */  ["low", "low", "low", "low"],
    /* 4-6  */  ["low", "low", "mid", "mid"],
    /* 6-8  */  ["low", "mid", "high", "high"],
    /* 8-12 */  ["mid", "high", "high", "flagship"],
    /* 12+  */  ["mid", "high", "high", "flagship"]
  ];
  var TIERS = {
    low: {
      name: "入门档位 · low", color: "#f59e0b",
      desc: "认不出强 SoC，模型开在 CPU 上。推荐轻量模型与保守量化，宁可慢也别崩。",
      recs: [
        ["推荐模型", "gemma-3-1b · bonsai-1.7b Q1_0"],
        ["视觉模型", "lfm2-vl-1.6b（多模态）"],
        ["文生图", "SD 1.5 · 省内存量化档"],
        ["上下文长度", "2048"]
      ]
    },
    mid: {
      name: "中端档位 · mid", color: "#10b981",
      desc: "主流中端机档位。默认启用 GPU 加速，可跑 3B 级模型与轻量视觉任务。",
      recs: [
        ["推荐模型", "smollm3-3b · lfm2-2.6b · qwen3-1.7b"],
        ["视觉模型", "lfm2-vl-1.6b（多模态）"],
        ["文生图", "SD 1.5 / SDXL · 高质量档"],
        ["上下文长度", "4096"]
      ]
    },
    high: {
      name: "高端档位 · high", color: "#3b82f6",
      desc: "旗舰 SoC 或大内存组合。可承载 7B 级模型与完整多模态管线，超分与出图均有较好表现。",
      recs: [
        ["推荐模型", "gemma-3-4b · bonsai-8b · phi-4-mini"],
        ["视觉模型", "gemma-4-e2b（多模态）"],
        ["文生图", "SDXL / FLUX · 高质量档"],
        ["上下文长度", "8192"]
      ]
    },
    flagship: {
      name: "旗舰档位 · flagship", color: "#a855f7",
      desc: "完整旗舰配置。解锁全部加速后端与高级参数：推测解码、Flash Attention、多图多模态。",
      recs: [
        ["推荐模型", "gemma-3-4b · lfm2.5-8b-a1b · qwen3.5-4b"],
        ["视觉模型", "gemma-4-e4b（多模态）"],
        ["文生图", "FLUX · 高质量档"],
        ["上下文长度", "16384+"]
      ]
    }
  };
  var TIER_CLASS = { low: "t-low", mid: "t-mid", high: "t-high", flagship: "t-flagship" };

  function ramBandIdx(r) {
    for (var i = 0; i < RAM_BANDS.length; i++) if (r <= RAM_BANDS[i].max) return i;
    return RAM_BANDS.length - 1;
  }

  function renderMatrix() {
    var html = RAM_BANDS.map(function (b, i) {
      var tds = MATRIX[i].map(function (t) {
        return '<td class="' + TIER_CLASS[t] + '">' + t + "</td>";
      }).join("");
      return "<tr><td>" + b.label + "</td>" + tds + "</tr>";
    }).join("");
    matrixBody.innerHTML = html;
  }
  renderMatrix();

  function render() {
    var r = +ram.value, s = +soc.value, i = +isa.value;
    document.getElementById("ramV").textContent = r;
    document.getElementById("socV").textContent = SOC_LABEL[s];
    document.getElementById("isaV").textContent = ISA_LABEL[i];

    // 指令集提升一档认知度：含 i8mm/sve2 直接视为旗舰 SoC
    var effectiveSoc = i === 2 ? 3 : s;
    var key = MATRIX[ramBandIdx(r)][effectiveSoc];
    var t = TIERS[key];
    tierName.textContent = t.name;
    tierDesc.textContent = t.desc;
    tierBadge.style.background = t.color + "22";
    tierBadge.style.color = t.color;
    tierBadge.querySelector(".dot").style.background = t.color;

    recList.innerHTML = t.recs.map(function (x) {
      return "<li><b>" + x[0] + "</b><span>" + x[1] + "</span></li>";
    }).join("");
  }
  [ram, soc, isa].forEach(function (el) { el.addEventListener("input", render); });
  render();

  /* ---------- 真机截图轮播 ---------- */
  var SHOTS = [
    { file: "home",     title: "首页",       desc: "八宫格入口 + 状态仪表。顶部横幅可轮播，底部是四个主标签，首页实时显示各类模型数量、内存占用与云端连通状态。" },
    { file: "chat",     title: "对话",       desc: "可切换角色的多轮对话。工具调用、思考过程与用量统计都在气泡里，模型能力不匹配时会在发送前提示。" },
    { file: "vision",   title: "图像识别",   desc: "选图后交给本地多模态模型。视觉投影层单独绑定与管理，缺投影层时会明确告诉你是哪种情况。" },
    { file: "tts",      title: "语音合成",   desc: "四个引擎可选，音色可试听可更换，语速可调。为对话自动配音时会在生成过程中就开口。" },
    { file: "tts2",     title: "音色转换",   desc: "变调半音数、检索比例可调，本地与云端两种模式分开。已保存的角色包可以直接选用。" },
    { file: "gsv",      title: "GPT-SoVITS", desc: "端侧 ONNX 推理的模型管理。共享 BERT 与每音色权重分开显示，状态一目了然。" },
    { file: "models",   title: "模型管理",   desc: "按你的机型档位推荐可用模型，标注体积与能力标签，点下载即可，下载走断点续传与国内镜像。" },
    { file: "settings", title: "系统设置",   desc: "算力分配、内存策略、KV 缓存类型、密钥管理都在这里。所有密钥存系统钥匙串。" }
  ];

  var shotScreen = document.getElementById("shotScreen");
  var shotTitle = document.getElementById("shotTitle");
  var shotDesc = document.getElementById("shotDesc");
  var shotList = document.getElementById("shotList");
  var shotNav = document.getElementById("shotNav");
  var shotStrip = document.getElementById("shotStrip");
  var shotImgs = shotScreen ? Array.prototype.slice.call(shotScreen.querySelectorAll("img")) : [];
  var shotIdx = 0;
  var shotTimer = null;

  function showShot(i, userAction) {
    shotIdx = (i + SHOTS.length) % SHOTS.length;
    var s = SHOTS[shotIdx];
    shotImgs.forEach(function (img, k) { img.classList.toggle("on", k === shotIdx); });
    if (shotTitle) shotTitle.textContent = s.title;
    if (shotDesc) shotDesc.textContent = s.desc;
    if (shotList) {
      shotList.querySelectorAll("button").forEach(function (b, k) {
        b.classList.toggle("on", k === shotIdx);
      });
    }
    if (shotNav) {
      shotNav.querySelectorAll("button").forEach(function (b, k) {
        b.classList.toggle("on", k === shotIdx);
      });
    }
    if (shotStrip) {
      shotStrip.querySelectorAll("button").forEach(function (b, k) {
        b.classList.toggle("on", k === shotIdx);
      });
    }
    if (userAction) restartShotTimer();
  }

  function restartShotTimer() {
    if (shotTimer) clearInterval(shotTimer);
    shotTimer = setInterval(function () { showShot(shotIdx + 1); }, 6000);
  }

  if (shotNav) {
    SHOTS.forEach(function (s, i) {
      var b = document.createElement("button");
      b.setAttribute("aria-label", s.title);
      if (i === 0) b.className = "on";
      b.addEventListener("click", function () { showShot(i, true); });
      shotNav.appendChild(b);
    });
  }

  if (shotStrip) {
    SHOTS.forEach(function (s, i) {
      var b = document.createElement("button");
      b.className = "shot-thumb" + (i === 0 ? " on" : "");
      b.setAttribute("aria-label", s.title);
      var img = document.createElement("img");
      img.src = "assets/shots/" + s.file + ".jpg";
      img.alt = s.title;
      img.loading = "lazy";
      b.appendChild(img);
      b.addEventListener("click", function () { showShot(i, true); });
      shotStrip.appendChild(b);
    });
  }

  if (shotList) {
    shotList.querySelectorAll("button").forEach(function (b, i) {
      b.addEventListener("click", function () { showShot(i, true); });
    });
  }

  // 进入视口才开始自动轮播，离开则停掉，避免无谓开销
  var shotsSec = document.getElementById("screens");
  var shotsStarted = false;
  var shotsObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        if (!shotsStarted) { shotsStarted = true; restartShotTimer(); }
      } else if (shotTimer) {
        clearInterval(shotTimer);
        shotTimer = null;
      }
    });
  }, { threshold: 0.25 });
  if (shotsSec) shotsObs.observe(shotsSec);

  /* ---------- 手机操作演示 ---------- */
  var miniScreen = document.querySelector(".mini-screen");
  var cursor = document.getElementById("mCursor");
  var miniItems = Array.prototype.slice.call(document.querySelectorAll(".mini-item"));
  var phoneSec = document.getElementById("agents");
  var phonePlayed = false;

  function runPhoneDemo() {
    if (!miniScreen || !cursor) return;
    miniItems.forEach(function (it) { it.classList.remove("tapped"); });
    // 依次点击第 2、4、6 项
    var seq = [1, 3, 5];
    var step = 0;
    function next() {
      if (step >= seq.length) {
        cursor.style.opacity = "0";
        return;
      }
      var idx = seq[step];
      var el = miniItems[idx];
      var rect = el.getBoundingClientRect();
      var srect = miniScreen.getBoundingClientRect();
      var x = rect.left - srect.left + rect.width / 2 - 10;
      var y = rect.top - srect.top + rect.height / 2 - 10;
      cursor.style.opacity = "1";
      cursor.style.left = x + "px";
      cursor.style.top = y + "px";

      // 涟漪
      setTimeout(function () {
        var rip = document.createElement("div");
        rip.className = "mini-ripple";
        rip.style.left = (x - 7) + "px";
        rip.style.top = (y - 7) + "px";
        miniScreen.appendChild(rip);
        setTimeout(function () { rip.remove(); }, 1500);
        el.classList.add("tapped");
      }, 880);

      step++;
      setTimeout(next, 1650);
    }
    setTimeout(next, 350);
  }

  var phoneObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && !phonePlayed) {
        phonePlayed = true;
        setTimeout(runPhoneDemo, 400);
      }
    });
  }, { threshold: 0.35 });
  if (phoneSec) phoneObs.observe(phoneSec);

  /* ---------- 终端演示 ---------- */
  var termBody = document.getElementById("termBody");
  var SCRIPT = [
    { t: "cmd", c: "安装 Linux 沙箱 · Alpine 3.21 (3.8 MB)" },
    { t: "out", c: "阿里云镜像下载 → SHA-256 校验通过 → 解包 rootfs" },
    { t: "out", c: "写入 DNS 与镜像源，proot 用户态映射，无需 root" },
    { t: "cmd", c: "apk update && apk add --no-cache python3" },
    { t: "out", c: "5564 个软件包可用 · python3 安装完成 (49 MB)" },
    { t: "cmd", c: "python3 -c \"print('hello from on-device linux')\"" },
    { t: "type", c: "hello from on-device linux" },
    { t: "out", c: "沙箱就绪 · Agent 新增 shell 能力：grep / find / python3" }
  ];
  var ti = 0, ci = 0, cur = null;

  function termAdd(cls, text, caret) {
    var row = document.createElement("div");
    row.className = "term-line";
    var pre = document.createElement("span");
    pre.className = cls === "cmd" ? "term-prompt" : "term-out";
    pre.textContent = cls === "cmd" ? ">" : "";
    var body = document.createElement("span");
    body.className = cls === "cmd" ? "term-cmd" : "term-out";
    body.textContent = text;
    row.appendChild(pre);
    row.appendChild(body);
    if (caret) {
      var c = document.createElement("span");
      c.className = "cursor";
      body.appendChild(c);
    }
    termBody.appendChild(row);
    termBody.scrollTop = termBody.scrollHeight;
    return body;
  }

  function step() {
    if (ti >= SCRIPT.length) {
      var again = document.createElement("div");
      again.className = "term-line";
      again.innerHTML = '<span class="term-prompt">&gt;</span><span class="term-cmd"></span>';
      termBody.appendChild(again);
      var c2 = again.querySelector(".term-cmd");
      var cc = document.createElement("span");
      cc.className = "cursor";
      c2.appendChild(cc);
      return;
    }
    var s = SCRIPT[ti];
    if (s.t === "type") {
      if (!cur) { cur = termAdd("type", "", true); cur.__txt = ""; }
      cur.__txt += s.c[ci++];
      cur.childNodes[0].nodeValue = cur.__txt;
      if (ci < s.c.length) { setTimeout(step, 18); return; }
      cur = null; ti++; ci = 0;
      setTimeout(step, 380);
      return;
    }
    termAdd(s.t, s.c, false);
    ti++;
    setTimeout(step, s.t === "cmd" ? 420 : 300);
  }

  var termSec = document.getElementById("demo");
  var termStarted = false;
  var termObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && !termStarted) {
        termStarted = true;
        setTimeout(step, 260);
      }
    });
  }, { threshold: 0.3 });
  if (termSec) termObs.observe(termSec);

  /* ---------- 数字滚动 ---------- */
  var stats = document.querySelectorAll(".stat b");
  var statObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      var target = +el.textContent;
      if (!target) { statObs.unobserve(el); return; }
      var start = null;
      function tick(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / 900, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      statObs.unobserve(el);
    });
  }, { threshold: 0.6 });
  stats.forEach(function (s) { statObs.observe(s); });

  /* ---------- 平滑锚点 ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      e.preventDefault();
      jumpTo(id, true);
      // 同步地址栏，不触发浏览器原生跳转
      if (history.replaceState) history.replaceState(null, "", id);
    });
  });

  /* ---------- QQ 交流群弹窗（对齐 App 的 QQGroupModal） ----------
     · 点按二维码 -> mqqapi:// 唤起 QQ 群资料卡
     · 长按(>=500ms) -> 复制群号，且不再触发点按跳转
     · 点遮罩 / 关闭按钮 / Esc 关闭；焦点回到触发元素；Tab 锁在弹窗内 */
  (function () {
    var GROUP = "1135341430";
    var LINK = "mqqapi://card/show_pslcard?src_type=internal&version=1&card_type=group&source=qrcode&uin=" + GROUP;
    var modal = document.getElementById("qqModal");
    var qr = document.getElementById("qqQr");
    var toastEl = document.getElementById("qqToast");
    if (!modal || !qr) return;
    var lastFocus = null, toastTimer = null, holdTimer = null;
    var longFired = false, startX = 0, startY = 0;

    function toast(msg) {
      if (!toastEl) return;
      toastEl.textContent = msg;
      toastEl.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2400);
    }
    function fallbackCopy() {
      var ta = document.createElement("textarea");
      ta.value = GROUP;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
    /* 反馈必须即时：先同步试 execCommand（多数浏览器可用），
       失败再走 Clipboard API；并给 Promise 加超时，避免挂起时用户长按后毫无提示。 */
    function copyGroup() {
      var okText = "群号 " + GROUP + " 已复制";
      var failText = "复制失败，群号：" + GROUP;
      if (fallbackCopy()) { toast(okText); return; }
      if (!(navigator.clipboard && window.isSecureContext)) { toast(failText); return; }
      var settled = false;
      function done(ok) {
        if (settled) return;
        settled = true;
        toast(ok ? okText : failText);
      }
      setTimeout(function () { done(false); }, 600);
      navigator.clipboard.writeText(GROUP).then(
        function () { done(true); },
        function () { done(false); }
      );
    }
    function openQQ() {
      var left = false;
      function onVis() { if (document.hidden) left = true; }
      document.addEventListener("visibilitychange", onVis);
      toast("正在打开 QQ…");
      try { window.location.href = LINK; } catch (e) { /* 桌面浏览器可能拒绝自定义协议 */ }
      setTimeout(function () {
        document.removeEventListener("visibilitychange", onVis);
        if (!left && !document.hidden) toast("未检测到 QQ，可长按二维码或点「复制群号」");
      }, 1400);
    }
    function setOpen(open) {
      if (open) {
        lastFocus = document.activeElement;
        modal.hidden = false;
        document.body.classList.add("qq-locked");
        var c = document.getElementById("qqClose");
        if (c && c.focus) c.focus();
      } else {
        modal.hidden = true;
        document.body.classList.remove("qq-locked");
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }
    }
    document.querySelectorAll("[data-qq-open]").forEach(function (el) {
      el.addEventListener("click", function (e) { e.preventDefault(); setOpen(true); });
    });
    document.querySelectorAll("[data-qq-close]").forEach(function (el) {
      el.addEventListener("click", function () { setOpen(false); });
    });
    document.getElementById("qqCopy").addEventListener("click", copyGroup);

    /* 长按判定：pointerdown 起表，移动 >10px 或抬手即取消；长按后置位阻止随后的 click */
    qr.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      longFired = false;
      startX = e.clientX; startY = e.clientY;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(function () { longFired = true; copyGroup(); }, 500);
    });
    qr.addEventListener("pointermove", function (e) {
      if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) clearTimeout(holdTimer);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (t) {
      qr.addEventListener(t, function () { clearTimeout(holdTimer); });
    });
    qr.addEventListener("click", function (e) {
      if (longFired) { e.preventDefault(); e.stopPropagation(); longFired = false; return; }
      openQQ();
    });
    qr.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    qr.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openQQ(); }
    });

    document.addEventListener("keydown", function (e) {
      if (modal.hidden) return;
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "Tab") return;
      var f = modal.querySelectorAll("button, [role='button'], a[href]");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  })();

})();
