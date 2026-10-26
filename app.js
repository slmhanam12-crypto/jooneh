/* جوونه | کد اپ
   همه‌ی محتوا از فایل‌های پوشه‌ی data خوانده می‌شود، پس برای عوض کردن متن‌ها لازم نیست این فایل را ویرایش کنی. */
(() => {
  'use strict';

  /* ---------- ابزارهای کوچک ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
  const fa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const ic = (id, cls = '') => `<svg class="ic ${cls}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
  // برای جستجو: یکسان کردن «ي/ك» عربی، حذف نیم‌فاصله و فاصله و حرکات
  const norm = (s) => String(s || '').toLowerCase()
    .replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/ۀ/g, 'ه')
    .replace(/[\u064B-\u065F\u0640\u200c\u200d\u200e\u200f\s]/g, '');

  /* ---------- ذخیره‌ی علاقه‌مندی‌ها روی خود گوشی ---------- */
  const mem = {};
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return k in mem ? mem[k] : d; } },
    set(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* حالت خصوصی مرورگر */ } }
  };
  const FAV_KEY = 'jooneh:favorites';
  let favs = new Set(store.get(FAV_KEY, []));

  /* ---------- وضعیت ---------- */
  let D = null;                 // داده‌ها
  let navCount = 0;             // چند بار صفحه عوض شده (برای دکمه‌ی بازگشت)
  let lastName = null;          // نام مسیر قبلی
  let homeScroll = 0;
  let F = { step: 0, a: {} };   // وضعیت «گیاه من»
  const byId = (id) => D.plants.find((p) => p.id === id);
  const symLabel = (id) => (D.symptoms.find((s) => s.id === id) || {}).label || id;

  /* ---------- اگر عکسی پیدا نشد ---------- */
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (!t || t.tagName !== 'IMG') return;
    if (t.dataset.fallback) { const f = t.dataset.fallback; delete t.dataset.fallback; t.src = f; }
    else t.style.visibility = 'hidden';
  }, true);

  /* ---------- قطعه‌های مشترک ---------- */
  const heartBtn = (p, cls = '') => {
    const on = favs.has(p.id);
    return `<button class="heart ${cls} ${on ? 'on' : ''}" data-fav="${esc(p.id)}" aria-pressed="${on}" aria-label="${on ? 'برداشتن از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}: ${esc(p.name)}">${ic('heart')}</button>`;
  };
  const plantCard = (p) => `
    <article class="pcard">
      <a href="#/plant/${esc(p.id)}">
        <div class="pimg">${ic('leaf')}<img src="${esc(p.image)}" alt="" loading="lazy"></div>
        <div class="pname">${esc(p.name)}</div>
      </a>${heartBtn(p)}
    </article>`;
  const imgBox = (p) => `<div class="pimg">${ic('leaf')}<img src="${esc(p.image)}" alt="${esc(p.name)}"></div>`;

  const causesHtml = (list) => list.map((c, i) => `
    <div class="cause">
      <div class="cause-head"><span class="num">${fa(i + 1)}</span><b>${esc(c.cause)}</b>${c.badge ? `<span class="chip">${esc(c.badge)}</span>` : ''}</div>
      <div class="lbl">${ic('eye')}چطور بفهمم؟</div>
      <p>${esc(c.check)}</p>
      <div class="fix"><div class="lbl">${ic('wrench')}راه‌حل</div><p>${esc(c.solution)}</p></div>
    </div>`).join('');

  /* ================= صفحه‌ها ================= */

  function viewHome() {
    return {
      title: D.app.name, nav: 'home', back: false,
      html: `
        <label class="search">
          <span class="sr-only">جستجوی گیاه</span>${ic('search')}
          <input id="q" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="جستجوی گیاه…">
        </label>

        <section class="tools" aria-label="ابزارها">
          <a class="tool" href="#/finder">
            <span class="tool-ico">${ic('sprout')}</span>
            <span><h2>گیاه من</h2><p>گیاه مناسب خودتو از اینجا پیدا کن🌻</p></span>
            ${ic('chevron', 'chev')}
          </a>
          <a class="tool tool-wide" href="#/problems">
            <div class="tool-media">${ic('aid')}<img src="images/javoone.jpg" alt=""></div>
            <div class="tool-row">
              <span><h2>مشکلات متداول</h2><p>مشکل گیاهتو بگو راه حلشون بگم 🪴</p></span>
              ${ic('chevron', 'chev')}
            </div>
          </a>
        </section>

        <h2 class="section-title">گیاه‌های ${esc(D.app.name)}</h2>
        <div id="grid" class="grid"></div>
        <p id="no-result" class="empty" hidden>گیاهی با این نام پیدا نشد. اسم دیگری را امتحان کن.</p>

        <section class="contact">
          <a class="btn" href="${esc(D.app.telegram_url)}" target="_blank" rel="noopener">${ic('telegram')}ارتباط با من</a>
          <small>تلگرام: <bdi dir="ltr">@${esc(D.app.telegram_id)}</bdi></small>
        </section>
        <p class="credit">سازنده: ${esc(D.app.creator)}</p>`,
      init() {
        const grid = $('#grid'), none = $('#no-result'), q = $('#q');
        const draw = (text) => {
          const n = norm(text);
          const list = !n ? D.plants : D.plants.filter((p) => norm([p.name, p.id, ...(p.alt || [])].join(' ')).includes(n));
          grid.innerHTML = list.map(plantCard).join('');
          none.hidden = list.length > 0;
        };
        draw('');
        q.addEventListener('input', () => draw(q.value));
      }
    };
  }

  function viewPlant(id) {
    const p = byId(id);
    if (!p) return viewNotFound();
    const care = [['sun', 'نور', p.care.light], ['drop', 'آبیاری', p.care.water], ['pot', 'خاک', p.care.soil], ['thermo', 'دما', p.care.temp]];
    const safeCls = p.pet_safe ? '' : 'warn';
    return {
      title: p.name, nav: null, back: true,
      html: `
        <div class="hero">${imgBox(p)}${heartBtn(p, 'lg')}</div>
        <div class="head">
          <h2>${esc(p.name)}</h2>
          <p>${esc(p.summary)}</p>
          <div class="chips">
            <span class="chip">${ic('leaf')}سطح سختی: ${esc(p.difficulty)}</span>
            <span class="chip">${ic('sun')}نور: ${esc(p.light_label)}</span>
            <span class="chip">${ic('drop')}آب: ${esc(p.water_label)}</span>
            <span class="chip ${safeCls}">${ic(p.pet_safe ? 'check' : 'warn')}${p.pet_safe ? 'بی‌خطر برای حیوان خانگی' : 'سمی برای حیوان خانگی'}</span>
          </div>
        </div>

        <section class="box">
          <h3>${ic('leaf')}نحوه‌ی نگهداری</h3>
          <div class="care-grid">${care.map(([i, t, v]) => `<div class="care-item">${ic(i)}<div><b>${t}</b><span>${esc(v)}</span></div></div>`).join('')}</div>
          <ul class="tips">${p.tips.map((t) => `<li>${ic('check')}<span>${esc(t)}</span></li>`).join('')}</ul>
        </section>

        <section class="box">
          <h3>${ic('aid')}مشکلات رایج</h3>
          <p class="sub" style="margin:0 0 6px">روی نشانه‌ای که می‌بینی بزن تا علت‌های محتمل و راه‌حل‌ها را ببینی.</p>
          ${p.problems.map((s) => `
            <details class="acc"><summary>${esc(symLabel(s.symptom))}</summary>
              <div class="acc-body">${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}${causesHtml(s.causes)}</div>
            </details>`).join('')}
        </section>

        <section class="box">
          <h3>${ic('sprout')}نحوه‌ی قلمه‌زدن و تکثیر</h3>
          ${p.propagation.methods.map((m) => `
            <div class="method"><h4>${esc(m.title)}</h4>
              ${m.steps.length ? `<ol class="steps">${m.steps.map((s, i) => `<li data-n="${fa(i + 1)}"><span>${esc(s)}</span></li>`).join('')}</ol>` : ''}
              ${m.text ? `<p>${esc(m.text)}</p>` : ''}
            </div>`).join('')}
          ${p.propagation.note ? `<p class="note" style="margin:14px 0 0">${esc(p.propagation.note)}</p>` : ''}
        </section>

        <section class="safety ${safeCls}">
          <h3>${ic(p.pet_safe ? 'check' : 'warn')}نکات ایمنی</h3>
          <p>${esc(p.safety)}</p>
          <p class="vet">${esc(D.app.vet_note)}</p>
        </section>`
    };
  }

  function viewFavorites() {
    const list = D.plants.filter((p) => favs.has(p.id));
    return {
      title: 'علاقه‌مندی‌ها', nav: 'favorites', back: false,
      html: list.length ? `
        <p class="sub" style="margin-top:0">${fa(list.length)} گیاه ذخیره کرده‌ای. این فهرست فقط روی همین گوشی می‌ماند.</p>
        <div class="grid">${list.map(plantCard).join('')}</div>` : `
        <div class="empty">
          ${ic('heart')}
          <p class="lead" style="margin-top:12px">هنوز گیاهی ذخیره نکرده‌ای</p>
          <p class="sub" style="margin-top:0">روی قلب هر گیاه بزن تا اینجا بیاید.</p>
          <a class="btn" href="#/">دیدن گیاه‌ها</a>
        </div>`
    };
  }

  /* ---------- مشکلات متداول: گیاه → نشانه → علت و راه‌حل ---------- */
  function viewProblems(plantId, symId) {
    if (!plantId) {
      return {
        title: 'مشکلات متداول', nav: null, back: true,
        html: `<p class="lead">کدام گیاهت مشکل دارد؟</p>
          <div class="pick-grid">${D.plants.map((p) => `<a class="pick" href="#/problems/${esc(p.id)}"><img src="${esc(p.image)}" alt="" loading="lazy">${esc(p.name)}</a>`).join('')}</div>`
      };
    }
    const p = byId(plantId);
    if (!p) return viewNotFound();
    if (!symId) {
      const have = D.symptoms.filter((s) => p.problems.some((x) => x.symptom === s.id));
      return {
        title: 'مشکلات متداول', nav: null, back: true,
        html: `<p class="lead">${esc(p.name)} چه نشانه‌ای دارد؟</p>
          <p class="sub">نشانه‌ای را که روی گیاهت می‌بینی انتخاب کن.</p>
          <div class="list">${have.map((s) => `<a class="opt" href="#/problems/${esc(p.id)}/${esc(s.id)}"><span>${esc(s.label)}</span>${ic('chevron')}</a>`).join('')}</div>
          <p class="sub" style="margin-top:16px">نشانه‌ی گیاهت را نمی‌بینی؟ <a href="#/plant/${esc(p.id)}"><b>مشکلات رایج ${esc(p.name)}</b></a> را بخوان.</p>`
      };
    }
    const prob = p.problems.find((x) => x.symptom === symId);
    if (!prob) return viewNotFound();
    return {
      title: 'علت و راه‌حل', nav: null, back: true,
      html: `<p class="lead">${esc(p.name)}: ${esc(symLabel(symId))}</p>
        ${prob.note ? `<p class="note">${esc(prob.note)}</p>` : ''}
        <p class="sub">علت‌ها از شایع‌ترین به کم‌شایع‌ترین مرتب شده‌اند. بخش «چطور بفهمم؟» را بخوان تا علت درست را پیدا کنی.</p>
        ${causesHtml(prob.causes)}
        <p class="mini-note">${esc(D.app.problems_disclaimer)}</p>
        <div class="nav-row">
          <a class="btn ghost" href="#/problems/${esc(p.id)}">نشانه‌ی دیگر</a>
          <a class="btn" href="#/plant/${esc(p.id)}">راهنمای کامل گیاه</a>
        </div>`
    };
  }

  /* ---------- گیاه من: چند سؤال و پیشنهاد ---------- */
  const LV = { low: 1, medium: 2, high: 3, beginner: 1, some: 2, expert: 3 };

  function scorePlant(p, a) {
    const W = D.finder.weights, f = p.finder;
    let s = 0; const ok = [], warn = [];
    const max = W.light.match + W.place.match + W.effort.match + W.difficulty.match;

    // نور
    if (f.light.includes(a.light)) { s += W.light.match; ok.push('نورش با نور خانه‌ات جور است'); }
    else {
      const d = Math.min(...f.light.map((x) => Math.abs(LV[x] - LV[a.light])));
      s += d === 1 ? W.light.near : W.light.far;
      warn.push(LV[a.light] < Math.min(...f.light.map((x) => LV[x])) ? 'نور خانه‌ات برایش کم است' : 'نور خانه‌ات برایش زیاد است');
    }
    // محل
    if (f.places.includes(a.place)) { s += W.place.match; ok.push('برای جایی که گفتی مناسب است'); }
    else {
      s += W.place.none;
      const opt = D.finder.questions.find((q) => q.id === 'place').options.find((o) => o.value === a.place);
      if (opt && opt.mismatch) warn.push(opt.mismatch);
    }
    // وقت و حوصله
    const dt = f.effort - LV[a.time];
    if (dt <= 0) { s += W.effort.match; ok.push(f.effort === 1 ? 'تقریباً بی‌نیاز از توجه است' : 'با وقتی که داری جور است'); }
    else if (dt === 1) { s += W.effort.near; warn.push('کمی بیشتر از وقتی که داری توجه می‌خواهد'); }
    else { s += W.effort.far; warn.push('توجه زیادی لازم دارد'); }
    // تجربه
    const dd = f.difficulty - LV[a.experience];
    if (dd <= 0) { s += W.difficulty.match; ok.push(f.difficulty === 1 ? 'نگهداری‌اش آسان است' : 'با تجربه‌ات جور است'); }
    else if (dd === 1) { s += W.difficulty.near; warn.push('کمی تجربه می‌خواهد'); }
    else { s += W.difficulty.far; warn.push('برای تجربه‌ی تو سخت است'); }

    return { p, pct: Math.max(0, Math.min(100, Math.round((s / max) * 100))), ok, warn };
  }

  const resCard = (r, low) => `
    <a class="res ${low ? 'low' : ''}" href="#/plant/${esc(r.p.id)}">
      <img src="${esc(r.p.image)}" alt="" loading="lazy">
      <div><h3>${esc(r.p.name)}</h3><span class="pct">${fa(r.pct)}٪ مناسب</span>
        <ul>${r.ok.map((t) => `<li>${ic('check')}${esc(t)}</li>`).join('')}${r.warn.map((t) => `<li class="w">${ic('warn')}${esc(t)}</li>`).join('')}</ul>
      </div>
    </a>`;

  function viewFinder() {
    const Q = D.finder.questions;
    if (F.step < Q.length) {
      const q = Q[F.step];
      return {
        title: 'گیاه من', nav: null, back: true,
        html: `<p class="stepno">سؤال ${fa(F.step + 1)} از ${fa(Q.length)}</p>
          <div class="progress" aria-hidden="true"><i style="width:${(F.step / Q.length) * 100}%"></i></div>
          <p class="lead" style="margin-top:14px">${esc(q.title)}</p>
          <div class="list">${q.options.map((o) => `<button class="opt ${F.a[q.id] === o.value ? 'sel' : ''}" data-act="ans" data-q="${esc(q.id)}" data-v="${esc(o.value)}"><span class="dot"></span><span>${esc(o.label)}</span></button>`).join('')}</div>
          ${F.step > 0 ? `<div class="nav-row"><button class="btn ghost" data-act="prev">سؤال قبلی</button></div>` : ''}`
      };
    }
    const all = D.plants.map((p) => scorePlant(p, F.a));
    const excluded = F.a.pets === 'yes' ? all.filter((r) => !r.p.pet_safe) : [];
    const pool = all.filter((r) => !excluded.includes(r)).sort((x, y) => y.pct - x.pct);
    let good = pool.filter((r) => r.pct >= D.finder.recommend_min_percent);
    let rest = pool.filter((r) => r.pct < D.finder.recommend_min_percent);
    let fallback = false;
    if (!good.length) {   // هیچ گیاهی کاملاً مناسب نیست: فقط نزدیک‌ترین‌های واقعی را نشان بده
      good = rest.filter((r) => r.pct >= 30).slice(0, 3);
      rest = rest.filter((r) => !good.includes(r));
      fallback = true;
    }
    const lead = !fallback ? 'این گیاه‌ها به خانه و سبک زندگی‌ات می‌خورند'
      : good.length ? 'گیاهی کاملاً مناسب پیدا نشد، ولی نزدیک‌ترین‌ها این‌ها هستند'
      : 'برای شرایطی که گفتی، گیاه مناسبی در جوونه پیدا نشد';
    return {
      title: 'گیاه‌های مناسب تو', nav: null, back: true,
      html: `<p class="lead">${lead}</p>
        ${excluded.length ? `<p class="mini-note" style="margin:0 0 6px">${fa(excluded.length)} گیاه چون برای حیوان خانگی یا بچه‌ی کوچک خطر دارند کنار گذاشته شدند.</p>` : ''}
        ${fallback && !good.length ? `<p class="mini-note" style="margin:0 0 6px">اگر بعضی جواب‌ها را عوض کنی (مثلاً نور بیشتر) نتیجه‌ی بهتری می‌گیری. گیاه‌های کمتر مناسب را هم می‌توانی ببینی.</p>` : ''}
        ${good.map((r) => resCard(r)).join('')}
        ${rest.length ? `<details class="more" ${good.length ? '' : 'open'}><summary>گیاه‌های کمتر مناسب (${fa(rest.length)})</summary>${rest.map((r) => resCard(r, true)).join('')}</details>` : ''}
        <div class="nav-row"><button class="btn ghost" data-act="restart">شروع دوباره</button><a class="btn" href="#/">صفحه‌ی اصلی</a></div>`
    };
  }

  function viewNotFound() {
    return { title: 'جوونه', nav: null, back: true, html: `<div class="empty"><p class="lead">این صفحه پیدا نشد</p><a class="btn" href="#/">رفتن به صفحه‌ی اصلی</a></div>` };
  }

  /* ================= مسیریاب ================= */
  function render() {
    const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    const [name, ...args] = parts;
    if (lastName === undefined && name !== undefined) homeScroll = window.scrollY;
    if (name === 'finder' && lastName !== 'finder') F = { step: 0, a: {} };

    let v;
    if (name === undefined) v = viewHome();
    else if (name === 'plant') v = viewPlant(args[0]);
    else if (name === 'favorites') v = viewFavorites();
    else if (name === 'finder') v = viewFinder();
    else if (name === 'problems') v = viewProblems(args[0], args[1]);
    else v = viewNotFound();

    $('#view').innerHTML = v.html;
    if (v.init) v.init();
    $('#page-title').textContent = v.title;
    document.title = v.title === D.app.name ? `${D.app.name} | ${D.app.tagline}` : `${v.title} | ${D.app.name}`;
    $('#back').style.visibility = v.back ? 'visible' : 'hidden';
    $$('.bottom-nav a').forEach((a) => {
      const on = a.dataset.nav === v.nav;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, name === undefined && lastName === 'plant' ? homeScroll : 0);
    lastName = name;
  }

  /* ================= رویدادها ================= */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  function toggleFav(id) {
    const p = byId(id); if (!p) return;
    const on = !favs.has(id);
    on ? favs.add(id) : favs.delete(id);
    store.set(FAV_KEY, Array.from(favs));
    $$(`[data-fav="${id}"]`).forEach((b) => {
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
      b.setAttribute('aria-label', `${on ? 'برداشتن از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}: ${p.name}`);
    });
    toast(on ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها برداشته شد');
    if (location.hash === '#/favorites') render();
  }

  document.addEventListener('click', (e) => {
    const fav = e.target.closest('[data-fav]');
    if (fav) { toggleFav(fav.dataset.fav); return; }
    const act = e.target.closest('[data-act],[data-action]');
    if (!act) return;
    const a = act.dataset.act || act.dataset.action;
    if (a === 'back') { navCount > 0 ? history.back() : (location.hash = '#/'); }
    else if (a === 'ans') { F.a[act.dataset.q] = act.dataset.v; F.step++; render(); }
    else if (a === 'prev') { F.step = Math.max(0, F.step - 1); render(); }
    else if (a === 'restart') { F = { step: 0, a: {} }; render(); }
  });

  window.addEventListener('hashchange', () => { navCount++; render(); });

  /* ================= شروع ================= */
  async function start() {
    try {
      const get = (n) => fetch(`data/${n}.json`).then((r) => { if (!r.ok) throw new Error(n); return r.json(); });
      const [app, plants, symptoms, finder] = await Promise.all(['app', 'plants', 'symptoms', 'finder'].map(get));
      D = { app, plants, symptoms, finder };
    } catch (err) {
      $('#view').innerHTML = `<div class="empty"><p class="lead">اطلاعات اپ بارگذاری نشد</p><p class="sub">اگر فایل index.html را مستقیم از روی گوشی یا کامپیوتر باز کرده‌ای، اپ کار نمی‌کند. باید آن را منتشر کنی یا با یک سرور محلی باز کنی (راهنما در README.md است).</p><button class="btn" onclick="location.reload()">تلاش دوباره</button></div>`;
      return;
    }
    render();
  }
  start();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
  }
})();
