/* TheGrindSociety - Shared App Logic */
(function () {
  const STORAGE = {
    user: 'tgs_user',
    profile: 'tgs_profile',
    subs: 'tgs_subs',
    progress: 'tgs_progress',
    habits: 'tgs_habits',
    challenges: 'tgs_challenges',
  };

  // ---------- Auth ----------
  const Auth = {
    current() {
      try { return JSON.parse(localStorage.getItem(STORAGE.user) || 'null'); } catch { return null; }
    },
    login(email, password, remember = true) {
      const users = JSON.parse(localStorage.getItem('tgs_users') || '{}');
      if (users[email] && users[email].password === password) {
        const u = { email, name: users[email].name, joined: users[email].joined };
        const store = remember ? localStorage : sessionStorage;
        store.setItem(STORAGE.user, JSON.stringify(u));
        return u;
      }
      return null;
    },
    signup(name, email, password) {
      const users = JSON.parse(localStorage.getItem('tgs_users') || '{}');
      if (users[email]) return null;
      users[email] = { name, password, joined: new Date().toISOString() };
      localStorage.setItem('tgs_users', JSON.stringify(users));
      const u = { email, name, joined: users[email].joined };
      localStorage.setItem(STORAGE.user, JSON.stringify(u));
      return u;
    },
    logout() {
      localStorage.removeItem(STORAGE.user);
      sessionStorage.removeItem(STORAGE.user);
      window.location.href = 'index.html';
    },
    require() {
      const u = this.current();
      if (!u) {
        window.location.href = 'login.html';
        return null;
      }
      return u;
    }
  };

  // ---------- Profile ----------
  const Profile = {
    get() { try { return JSON.parse(localStorage.getItem(STORAGE.profile) || 'null'); } catch { return null; } },
    set(p) { localStorage.setItem(STORAGE.profile, JSON.stringify(p)); },
    bmi(p) {
      if (!p || !p.weight || !p.height) return null;
      const m = p.height / 100;
      return (p.weight / (m * m)).toFixed(1);
    },
    bodyType(p) {
      if (!p) return 'mesomorph';
      const bmi = parseFloat(this.bmi(p));
      if (bmi < 19) return 'ectomorph';
      if (bmi > 26) return 'endomorph';
      return 'mesomorph';
    },
    bmr(p) {
      if (!p) return 0;
      // Mifflin-St Jeor
      const s = (p.sex || 'male') === 'male' ? 5 : -161;
      return Math.round(10 * p.weight + 6.25 * p.height - 5 * (p.age || 25) + s);
    },
    tdee(p) {
      const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.9 };
      return Math.round(this.bmr(p) * (factors[p?.activity] || 1.55));
    },
    macroSplit(p) {
      const tdee = this.tdee(p);
      let target = tdee;
      if (p?.goal === 'fat-loss') target = tdee - 500;
      if (p?.goal === 'muscle-gain') target = tdee + 350;
      const protein = Math.round((p?.weight || 70) * 2);
      const fats = Math.round((target * 0.25) / 9);
      const carbs = Math.round((target - (protein * 4 + fats * 9)) / 4);
      return { calories: target, protein, carbs, fats };
    }
  };

  // ---------- Subscriptions ----------
  const Subs = {
    all() { try { return JSON.parse(localStorage.getItem(STORAGE.subs) || '[]'); } catch { return []; } },
    has(section) { return this.all().includes(section); },
    add(section) {
      const list = this.all();
      if (!list.includes(section)) list.push(section);
      localStorage.setItem(STORAGE.subs, JSON.stringify(list));
    }
  };

  // ---------- Challenges ----------
  const Challenges = {
    list() { try { return JSON.parse(localStorage.getItem(STORAGE.challenges) || '[]'); } catch { return []; } },
    join(id) {
      const list = this.list();
      if (!list.find(c => c.id === id)) {
        list.push({ id, joined: new Date().toISOString(), progress: Math.floor(Math.random() * 30) + 5 });
        localStorage.setItem(STORAGE.challenges, JSON.stringify(list));
      }
    },
    isJoined(id) { return !!this.list().find(c => c.id === id); }
  };

  // ---------- Toast ----------
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }

  // ---------- Logo ----------
  const logoMark = (prefix = '') =>
    `<img class="logo-svg" src="${prefix}Logo.png" alt="TheGrindSociety" />`;

  // ---------- Theme ----------
  const Theme = {
    get() { return localStorage.getItem('tgs_theme') || 'dark'; },
    set(t) {
      localStorage.setItem('tgs_theme', t);
      document.documentElement.setAttribute('data-theme', t);
      const ic = document.querySelector('.theme-toggle .knob');
      if (ic) ic.textContent = t === 'light' ? '☀' : '🌙';
    },
    toggle() { this.set(this.get() === 'dark' ? 'light' : 'dark'); },
    init() {
      const t = this.get();
      document.documentElement.setAttribute('data-theme', t);
    }
  };
  Theme.init(); // apply before render to prevent flash

  // ---------- Navbar render ----------
  function renderNavbar(active = '') {
    const u = Auth.current();
    const links = [
      { href: 'beginner.html', label: 'Beginner', key: 'beginner' },
      { href: 'sections/nutrition.html', label: 'Nutrition', key: 'nutrition' },
      { href: 'sections/workout.html', label: 'Workouts', key: 'workout' },
      { href: 'sections/recovery.html', label: 'Recovery', key: 'recovery' },
      { href: 'trainers.html', label: 'Trainers', key: 'trainers' },
      { href: 'leaderboard.html', label: 'Leaderboard', key: 'leaderboard' },
    ];
    const isSub = window.location.pathname.includes('/sections/');
    const prefix = isSub ? '../' : '';
    const themeIcon = Theme.get() === 'light' ? '☀' : '🌙';
    const html = `
      <nav class="nav">
        <div class="container" style="display:flex;align-items:center;justify-content:space-between;height:68px;gap:1.2rem;">
          <a class="logo" href="${prefix}index.html">
            ${logoMark(prefix)}
            <span>TheGrindSociety</span>
          </a>
          <div class="nav-links hide-mobile" style="display:flex;gap:1.4rem;">
            ${links.map(l => `<a class="nav-link ${active === l.key ? 'active' : ''}" href="${prefix}${l.href}">${l.label}</a>`).join('')}
          </div>
          <div style="display:flex;gap:0.6rem;align-items:center;">
            <button class="theme-toggle" aria-label="Toggle theme" onclick="TGS.toggleTheme()">
              <span class="knob">${themeIcon}</span>
            </button>
            ${u ? `
              <a class="nav-link hide-mobile" href="${prefix}dashboard.html">Dashboard</a>
              <div class="avatar" title="${u.name}" onclick="window.location.href='${prefix}dashboard.html'" style="cursor:pointer;">${(u.name || 'U')[0].toUpperCase()}</div>
              <button class="btn btn-ghost hide-mobile" onclick="TGS.Auth.logout()" style="padding:0.5rem 1rem;font-size:0.85rem;">Logout</button>
            ` : `
              <a class="btn btn-ghost hide-mobile" href="${prefix}login.html" style="padding:0.5rem 1rem;font-size:0.85rem;">Login</a>
              <a class="btn btn-primary" href="${prefix}signup.html" style="padding:0.5rem 1.2rem;font-size:0.85rem;">Join Now</a>
            `}
          </div>
        </div>
      </nav>
    `;
    const slot = document.getElementById('nav-slot');
    if (slot) slot.innerHTML = html;
  }

  function renderFooter() {
    const slot = document.getElementById('footer-slot');
    const isSub = window.location.pathname.includes('/sections/');
    const prefix = isSub ? '../' : '';
    if (slot) slot.innerHTML = `
      <footer class="footer">
        <div class="container">
          <div style="display:flex;justify-content:center;align-items:center;gap:0.6rem;margin-bottom:1rem;">
            <a class="logo" href="${prefix}index.html">${logoMark(prefix)}<span>TheGrindSociety</span></a>
          </div>
          <div style="opacity:0.7;font-size:0.9rem;letter-spacing:0.15em;text-transform:uppercase;">Discipline · Strength · Transformation</div>
          <div style="display:flex;justify-content:center;gap:1.2rem;margin:1.2rem 0;flex-wrap:wrap;font-size:0.85rem;">
            <a href="${prefix}trainers.html" style="color:var(--muted);text-decoration:none;">Hire a Trainer</a>
            <a href="${prefix}become-trainer.html" style="color:var(--muted);text-decoration:none;">Become a Trainer</a>
            <a href="${prefix}leaderboard.html" style="color:var(--muted);text-decoration:none;">Leaderboard</a>
            <a href="${prefix}dashboard.html" style="color:var(--muted);text-decoration:none;">Dashboard</a>
          </div>
          <div style="margin-top:0.5rem;font-size:0.8rem;opacity:0.5;">© 2026 TheGrindSociety. All rights reserved.</div>
        </div>
      </footer>
    `;
  }

  // ---------- Module sidebar ----------
  function renderModuleSidebar(active) {
    const items = [
      { id: 'nutrition', label: 'Nutrition', icon: '🥗' },
      { id: 'workout', label: 'Workout Styles', icon: '💪' },
      { id: 'recovery', label: 'Recovery', icon: '😴' },
      { id: 'mental', label: 'Mental Fitness', icon: '🧠' },
      { id: 'supplements', label: 'Supplements', icon: '💊' },
      { id: 'tracking', label: 'Tracking', icon: '📊' },
      { id: 'lifestyle', label: 'Lifestyle', icon: '🏃' },
    ];
    return `
      <aside class="sidebar glass">
        <h4>Sections</h4>
        ${items.map(i => `<a class="${active === i.id ? 'active' : ''}" href="${i.id}.html"><span>${i.icon}</span><span>${i.label}</span></a>`).join('')}
        <h4 style="margin-top:1.5rem;">Account</h4>
        <a href="../dashboard.html"><span>📈</span><span>Dashboard</span></a>
        <a href="../leaderboard.html"><span>🏆</span><span>Leaderboard</span></a>
      </aside>
    `;
  }

  // ---------- Subscribe modal ----------
  function showSubscribeModal(sectionKey, sectionLabel, price) {
    const amount = price || 299;
    const root = document.createElement('div');
    root.className = 'modal-backdrop';
    root.innerHTML = `
      <div class="modal" style="position:relative;">
        <button class="close" aria-label="Close">×</button>
        <div style="text-align:center;">
          <div style="font-size:2.2rem;margin-bottom:0.5rem;">⚡</div>
          <h3>Unlock ${sectionLabel}</h3>
          <p style="color:var(--muted);margin:0 0 1.5rem;">Personalized for your body, goals, and experience. One-time unlock — yours forever.</p>
          <div class="glass" style="padding:1.4rem;margin-bottom:1.5rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
              <span style="font-size:0.85rem;color:var(--muted);">${sectionLabel} Pro</span>
              <span class="badge badge-pro">PRO</span>
            </div>
            <div style="font-family:'Bebas Neue',sans-serif;font-size:2.6rem;line-height:1;">₹${amount}<span style="font-size:0.9rem;color:var(--muted);font-family:Inter;"> / one-time</span></div>
          </div>
          <form id="pay-form" style="text-align:left;">
            <div class="form-group"><label>Card Number</label><input type="text" placeholder="4242 4242 4242 4242" required></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div class="form-group"><label>Expiry</label><input type="text" placeholder="MM/YY" required></div>
              <div class="form-group"><label>CVV</label><input type="text" placeholder="123" required></div>
            </div>
            <button type="submit" class="btn btn-primary pulse" style="width:100%;margin-top:0.5rem;">Pay ₹${amount} & Unlock</button>
          </form>
          <div style="font-size:0.75rem;color:var(--muted);margin-top:1rem;">🔒 Mock UI — no real payment is processed.</div>
        </div>
      </div>
    `;
    document.body.appendChild(root);
    root.querySelector('.close').onclick = () => root.remove();
    root.addEventListener('click', e => { if (e.target === root) root.remove(); });
    root.querySelector('#pay-form').onsubmit = e => {
      e.preventDefault();
      Subs.add(sectionKey);
      root.remove();
      toast(`✓ ${sectionLabel} unlocked!`);
      setTimeout(() => location.reload(), 700);
    };
  }

  // ---------- Render locked overlay or content based on subscription ----------
  function maybeShowLocked(sectionKey, sectionLabel, mountId, price) {
    if (Subs.has(sectionKey) || !document.getElementById(mountId)) return false;
    const amount = price || 299;
    const el = document.getElementById(mountId);
    el.innerHTML = `
      <div class="locked-section">
        <div class="lock-icon">🔒</div>
        <h3 style="margin:0 0 0.5rem;">Personalized ${sectionLabel} Plan</h3>
        <p style="color:var(--muted);max-width:480px;margin:0 auto 1.5rem;">Built around your body, goals, and experience. One-time ₹${amount} unlock.</p>
        <button class="btn btn-primary pulse" onclick="TGS.showSubscribeModal('${sectionKey}','${sectionLabel}', ${amount})">Unlock for ₹${amount}</button>
      </div>
    `;
    return true;
  }

  // ---------- Animate on scroll ----------
  function observeFadeIn() {
    const els = document.querySelectorAll('[data-fade]');
    if (!('IntersectionObserver' in window)) {
      els.forEach(e => e.classList.add('fade-in'));
      return;
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('fade-in');
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.1 });
    els.forEach(e => obs.observe(e));
  }

  // ---------- Quote system ----------
  const QUOTE_DB = {
    homepage: [
      { t: 'Discipline is choosing between what you want now and what you want most.', a: 'Abraham Lincoln' },
      { t: 'The only bad workout is the one that didn\'t happen.', a: 'Fitness Proverb' },
      { t: 'Strength does not come from physical capacity. It comes from indomitable will.', a: 'Mahatma Gandhi' },
      { t: 'The body achieves what the mind believes.', a: 'Napoleon Hill' },
      { t: 'You don\'t have to be extreme, just consistent.', a: 'James Clear' },
      { t: 'The pain you feel today will be the strength you feel tomorrow.', a: 'Arnold Schwarzenegger' },
    ],
    sections: {
      nutrition:   { t: 'Take care of your body. It\'s the only place you have to live.', a: 'Jim Rohn' },
      workout:     { t: 'Success usually comes to those who are too busy to be looking for it.', a: 'Henry Ford' },
      recovery:    { t: 'Sleep is the best meditation.', a: 'Dalai Lama' },
      mental:      { t: 'Whether you think you can or you think you can\'t, you\'re right.', a: 'Henry Ford' },
      supplements: { t: 'Knowledge is power, but only if applied.', a: 'Tony Robbins' },
      tracking:    { t: 'What gets measured gets managed.', a: 'Peter Drucker' },
      lifestyle:   { t: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', a: 'Aristotle' },
    },
    contextual: {
      'fat-loss': [
        { t: 'It never gets easier. You just get better.', a: 'Jordan Hoechlin' },
        { t: 'A year from now you may wish you had started today.', a: 'Karen Lamb' },
      ],
      'muscle-gain': [
        { t: 'The last three or four reps is what makes the muscle grow.', a: 'Arnold Schwarzenegger' },
        { t: 'Hard work beats talent when talent doesn\'t work hard.', a: 'Tim Notke' },
      ],
      'strength': [
        { t: 'Strength is the product of struggle.', a: 'Napoleon Hill' },
        { t: 'No one ever drowned in sweat.', a: 'Lou Holtz' },
      ],
      'maintenance': [
        { t: 'Excellence is not a destination; it is a continuous journey.', a: 'Brian Tracy' },
        { t: 'Small daily improvements lead to staggering long-term results.', a: 'Robin Sharma' },
      ],
      'completion': [
        { t: 'You did the work. Now own it.', a: 'TGS' },
        { t: 'The reward of training is who you become.', a: 'Anonymous' },
      ],
      'comeback': [
        { t: 'Fall seven times, stand up eight.', a: 'Japanese Proverb' },
        { t: 'It\'s not whether you get knocked down; it\'s whether you get up.', a: 'Vince Lombardi' },
      ]
    }
  };

  const Quotes = {
    forSection(key) { return QUOTE_DB.sections[key]; },
    homepageList() { return QUOTE_DB.homepage; },
    contextualForGoal(goal) {
      return (QUOTE_DB.contextual[goal] || QUOTE_DB.contextual['maintenance'])[0];
    },
    pickContextual(kind) {
      const list = QUOTE_DB.contextual[kind] || [];
      return list[Math.floor(Math.random() * list.length)] || null;
    },
    all() {
      return [
        ...QUOTE_DB.homepage,
        ...Object.values(QUOTE_DB.sections),
        ...Object.values(QUOTE_DB.contextual).flat()
      ];
    },
    saved() { try { return JSON.parse(localStorage.getItem('tgs_quotes') || '[]'); } catch { return []; } },
    isSaved(q) { return this.saved().some(s => s.t === q.t); },
    save(q) {
      const list = this.saved();
      if (!list.some(s => s.t === q.t)) {
        list.unshift({ t: q.t, a: q.a, ts: new Date().toISOString() });
        localStorage.setItem('tgs_quotes', JSON.stringify(list));
        return true;
      }
      return false;
    },
    unsave(q) {
      const list = this.saved().filter(s => s.t !== q.t);
      localStorage.setItem('tgs_quotes', JSON.stringify(list));
    },
    async share(q) {
      const text = `"${q.t}" — ${q.a}\n\n— via TheGrindSociety`;
      if (navigator.share) {
        try { await navigator.share({ text, title: 'TheGrindSociety' }); return 'shared'; }
        catch { /* user canceled */ return 'canceled'; }
      }
      try {
        await navigator.clipboard.writeText(text);
        return 'copied';
      } catch {
        return 'failed';
      }
    },
    render(q, opts = {}) {
      if (!q) return '';
      const compact = opts.compact ? ' compact' : '';
      const id = 'q_' + Math.random().toString(36).slice(2, 9);
      setTimeout(() => bindActions(id, q), 0);
      const isSaved = this.isSaved(q);
      return `
        <div class="quote-card${compact}" data-qid="${id}">
          <p class="text">${escapeHtml(q.t)}</p>
          <span class="author">— ${escapeHtml(q.a)}</span>
          <div class="actions">
            <button class="quote-action save-btn ${isSaved ? 'saved' : ''}" data-act="save">
              <span class="ic">${isSaved ? '★' : '☆'}</span>
              <span>${isSaved ? 'Saved' : 'Save'}</span>
            </button>
            <button class="quote-action" data-act="share"><span>🔗</span><span>Share</span></button>
          </div>
        </div>`;
    },
    renderBreak(q) {
      if (!q) return '';
      return `
        <div class="quote-break" data-fade>
          <span class="divider"></span>
          <div class="text">"${escapeHtml(q.t)}"</div>
          <div class="author">— ${escapeHtml(q.a)}</div>
          <span class="divider"></span>
        </div>`;
    }
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function bindActions(id, q) {
    const root = document.querySelector(`[data-qid="${id}"]`);
    if (!root) return;
    root.querySelectorAll('[data-act]').forEach(b => {
      b.addEventListener('click', async (e) => {
        e.preventDefault();
        const act = b.dataset.act;
        if (act === 'save') {
          if (Quotes.isSaved(q)) {
            Quotes.unsave(q);
            b.classList.remove('saved');
            b.querySelector('.ic').textContent = '☆';
            b.querySelector('span:last-child').textContent = 'Save';
            toast('Quote removed');
          } else {
            Quotes.save(q);
            b.classList.add('saved');
            b.querySelector('.ic').textContent = '★';
            b.querySelector('span:last-child').textContent = 'Saved';
            toast('★ Quote saved');
          }
        } else if (act === 'share') {
          const r = await Quotes.share(q);
          if (r === 'copied') toast('Copied to clipboard');
          else if (r === 'shared') toast('Shared');
          else if (r === 'failed') toast('Share unavailable');
        }
      });
    });
  }

  // Hero quote rotator
  function rotateHeroQuotes(mountId, intervalMs = 6000) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    const quotes = Quotes.homepageList();
    let i = 0;
    const dotsHtml = quotes.map((_, idx) => `<span data-i="${idx}" class="${idx===0?'active':''}"></span>`).join('');
    const render = (idx) => {
      mount.classList.add('fade');
      setTimeout(() => {
        mount.querySelector('.text').textContent = '“' + quotes[idx].t + '”';
        mount.querySelector('.author').textContent = '— ' + quotes[idx].a;
        mount.querySelectorAll('.hero-quote-dots span').forEach((d, di) => d.classList.toggle('active', di === idx));
        mount.classList.remove('fade');
      }, 400);
    };
    mount.innerHTML = `
      <p class="text">“${escapeHtml(quotes[0].t)}”</p>
      <div class="author">— ${escapeHtml(quotes[0].a)}</div>
      <div class="hero-quote-dots">${dotsHtml}</div>
    `;
    mount.querySelectorAll('.hero-quote-dots span').forEach(d => {
      d.addEventListener('click', () => { i = +d.dataset.i; render(i); resetTimer(); });
    });
    let timer;
    const resetTimer = () => { clearInterval(timer); timer = setInterval(() => { i = (i + 1) % quotes.length; render(i); }, intervalMs); };
    resetTimer();
  }

  // ==================== TRAINERS DATABASE ====================
  const TRAINERS = [
    { id: 't1', name: 'Aarav Khanna', city: 'Mumbai', photo: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=600&q=80', specs: ['fat-loss','hypertrophy'], exp: 8, certs: ['NSCA-CPT','ISSA'], rating: 4.9, reviews: 247, pricing: { online: 1499, plans: 799, offline: 3500 }, modes: ['online','plans','offline'], bio: 'Former national-level powerlifter. 8 years coaching busy professionals to fat-loss + lean muscle.', verified: true, langs: ['English','Hindi'], avail: 'Mon–Sat · 6 AM – 10 PM' },
    { id: 't2', name: 'Priya Iyer', city: 'Bangalore', photo: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=600&q=80', specs: ['yoga','rehab','mobility'], exp: 12, certs: ['RYT-500','ACE'], rating: 4.95, reviews: 412, pricing: { online: 1299, plans: 699, offline: 2500 }, modes: ['online','plans','offline'], bio: 'Yoga + functional movement specialist. Rehab-friendly programming.', verified: true, langs: ['English','Tamil','Hindi'], avail: 'Daily · 5 AM – 8 PM' },
    { id: 't3', name: 'Rohan Mehta', city: 'Pune', photo: 'https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=600&q=80', specs: ['muscle-gain','strength','calisthenics'], exp: 6, certs: ['ACE','K11'], rating: 4.7, reviews: 152, pricing: { online: 999, plans: 599, offline: 2000 }, modes: ['online','plans'], bio: 'Calisthenics + strength coach. Built 200+ home-gym athletes.', verified: true, langs: ['English','Hindi','Marathi'], avail: 'Mon–Sun · 6 AM – 11 PM' },
    { id: 't4', name: 'Aisha Khan', city: 'Delhi', photo: 'https://images.unsplash.com/photo-1601412436009-d964bd02edbc?w=600&q=80', specs: ['fat-loss','women-fitness','hiit'], exp: 5, certs: ['ACE','NASM'], rating: 4.85, reviews: 189, pricing: { online: 1199, plans: 699, offline: 2800 }, modes: ['online','plans','offline'], bio: 'Specialized in postpartum + women-led fat-loss programs.', verified: true, langs: ['English','Hindi','Urdu'], avail: 'Mon–Fri · 6 AM – 9 PM' },
    { id: 't5', name: 'Vikram Joshi', city: 'Hyderabad', photo: 'https://images.unsplash.com/photo-1583500178690-f7fd39f6a44e?w=600&q=80', specs: ['bodybuilding','contest-prep','muscle-gain'], exp: 14, certs: ['ISSA','PNCB'], rating: 4.92, reviews: 378, pricing: { online: 2499, plans: 1499, offline: 5000 }, modes: ['online','plans','offline'], bio: 'IFBB Pro. Contest prep + advanced bodybuilding for serious athletes.', verified: true, langs: ['English','Hindi','Telugu'], avail: 'Mon–Sat · 5 AM – 9 PM' },
    { id: 't6', name: 'Sneha Rao', city: 'Chennai', photo: 'https://images.unsplash.com/photo-1571019613540-996a8a3a7d39?w=600&q=80', specs: ['cardio','marathon','endurance'], exp: 7, certs: ['ACE','RRCA'], rating: 4.75, reviews: 134, pricing: { online: 999, plans: 549, offline: 2200 }, modes: ['online','plans'], bio: 'Endurance + marathon coach. From couch to 42K in 6 months.', verified: false, langs: ['English','Tamil'], avail: 'Daily · 5 AM – 8 PM' },
    { id: 't7', name: 'Karan Singh', city: 'Chandigarh', photo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80', specs: ['powerlifting','strength'], exp: 10, certs: ['NSCA-CSCS'], rating: 4.88, reviews: 198, pricing: { online: 1799, plans: 999, offline: 4000 }, modes: ['online','plans','offline'], bio: 'Powerlifting coach. Squat, bench, deadlift PRs guaranteed in 12 weeks.', verified: true, langs: ['English','Hindi','Punjabi'], avail: 'Mon–Sat · 6 AM – 10 PM' },
    { id: 't8', name: 'Neha Pillai', city: 'Kochi', photo: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80', specs: ['yoga','meditation','flexibility'], exp: 9, certs: ['RYT-500','YACEP'], rating: 4.96, reviews: 521, pricing: { online: 899, plans: 499, offline: 1800 }, modes: ['online','plans','offline'], bio: 'Ashtanga + Hatha. Build your home practice + mental fitness.', verified: true, langs: ['English','Malayalam'], avail: 'Daily · 5 AM – 8 PM' },
    { id: 't9', name: 'Ishaan Reddy', city: 'Hyderabad', photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=600&q=80', specs: ['crossfit','functional','hiit'], exp: 6, certs: ['CF-L2','NSCA'], rating: 4.7, reviews: 112, pricing: { online: 1299, plans: 699, offline: 2500 }, modes: ['online','plans','offline'], bio: 'CrossFit Level 2. Functional fitness for athletes, lawyers, dads.', verified: true, langs: ['English','Telugu','Hindi'], avail: 'Mon–Sat · 5 AM – 10 PM' },
    { id: 't10', name: 'Tara Bhatt', city: 'Mumbai', photo: 'https://images.unsplash.com/photo-1609899537878-88d5ba429bdf?w=600&q=80', specs: ['nutrition','women-fitness'], exp: 8, certs: ['Precision Nutrition L2','ISSA-Nutrition'], rating: 4.9, reviews: 287, pricing: { online: 1599, plans: 599, offline: 0 }, modes: ['online','plans'], bio: 'Sports nutritionist. Custom macros for athletes, vegetarians, busy moms.', verified: true, langs: ['English','Hindi','Marathi'], avail: 'Mon–Fri · 9 AM – 7 PM' },
    { id: 't11', name: 'Dhruv Bansal', city: 'Jaipur', photo: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=80', specs: ['calisthenics','mobility','bodyweight'], exp: 5, certs: ['ACSM','ACE'], rating: 4.78, reviews: 96, pricing: { online: 799, plans: 449, offline: 1800 }, modes: ['online','plans','offline'], bio: 'Bodyweight movement coach. Master pull-ups → muscle-ups → planche.', verified: false, langs: ['English','Hindi'], avail: 'Daily · 6 AM – 10 PM' },
    { id: 't12', name: 'Meera Patel', city: 'Ahmedabad', photo: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&q=80', specs: ['mental','meditation','breathwork'], exp: 11, certs: ['NLP','MBSR'], rating: 4.93, reviews: 318, pricing: { online: 1099, plans: 599, offline: 0 }, modes: ['online','plans'], bio: 'Mental fitness + meditation coach. From burnt-out execs to elite athletes.', verified: true, langs: ['English','Gujarati','Hindi'], avail: 'Mon–Sat · 7 AM – 8 PM' },
    { id: 't13', name: 'Reyansh Kapoor', city: 'Gurgaon', photo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80', specs: ['hypertrophy','men-aesthetics'], exp: 7, certs: ['ACE','NASM'], rating: 4.82, reviews: 178, pricing: { online: 1399, plans: 749, offline: 3000 }, modes: ['online','plans','offline'], bio: 'Aesthetics-first hypertrophy. Built for the camera, not just the gym.', verified: true, langs: ['English','Hindi'], avail: 'Mon–Sat · 5 AM – 11 PM' },
    { id: 't14', name: 'Saanvi Iyer', city: 'Bangalore', photo: 'https://images.unsplash.com/photo-1518310383802-640c2de311b6?w=600&q=80', specs: ['rehab','physiotherapy','mobility'], exp: 9, certs: ['BPT','MIAP'], rating: 4.94, reviews: 256, pricing: { online: 1499, plans: 0, offline: 2800 }, modes: ['online','offline'], bio: 'Physiotherapist + movement coach. Recovery from injury, lasting strength.', verified: true, langs: ['English','Tamil','Kannada'], avail: 'Mon–Sat · 9 AM – 7 PM' },
    { id: 't15', name: 'Avni Khurana', city: 'Delhi', photo: 'https://images.unsplash.com/photo-1607962837359-5e7e89f86776?w=600&q=80', specs: ['dance-fitness','cardio','fat-loss'], exp: 4, certs: ['Zumba','ACE'], rating: 4.65, reviews: 78, pricing: { online: 599, plans: 399, offline: 1500 }, modes: ['online','plans','offline'], bio: 'Dance + HIIT. Make cardio addictive, not punishment.', verified: false, langs: ['English','Hindi'], avail: 'Mon–Sun · 6 AM – 10 PM' },
    { id: 't16', name: 'Rudra Saxena', city: 'Lucknow', photo: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&q=80', specs: ['running','endurance','marathon'], exp: 8, certs: ['RRCA','ACE'], rating: 4.8, reviews: 145, pricing: { online: 999, plans: 549, offline: 2000 }, modes: ['online','plans','offline'], bio: 'Sub-3 marathoner. Build the engine. Train smart, race faster.', verified: true, langs: ['English','Hindi'], avail: 'Daily · 5 AM – 9 PM' },
  ];

  const Trainers = {
    all() { return TRAINERS; },
    byId(id) { return TRAINERS.find(t => t.id === id); },
    filter({ mode, goal, minRating, maxBudget, verifiedOnly, search } = {}) {
      const q = (search || '').toLowerCase().trim();
      return TRAINERS.filter(t => {
        if (mode && !t.modes.includes(mode)) return false;
        if (goal && !t.specs.some(s => s.includes(goal) || goal.includes(s))) return false;
        if (minRating && t.rating < minRating) return false;
        if (verifiedOnly && !t.verified) return false;
        if (maxBudget) {
          const minPrice = Math.min(...Object.values(t.pricing).filter(p => p > 0));
          if (minPrice > maxBudget) return false;
        }
        if (q) {
          const hay = `${t.name} ${t.city} ${t.specs.join(' ')} ${t.bio}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    },
    suggestForUser(profile) {
      if (!profile?.goal) return TRAINERS.filter(t => t.verified).slice(0, 3);
      const goalKeywords = {
        'fat-loss': ['fat-loss','cardio','hiit','women-fitness','dance-fitness'],
        'muscle-gain': ['muscle-gain','hypertrophy','bodybuilding','men-aesthetics'],
        'strength': ['strength','powerlifting','bodybuilding'],
        'maintenance': ['hypertrophy','functional','mobility','calisthenics']
      };
      const kw = goalKeywords[profile.goal] || [];
      const scored = TRAINERS.map(t => {
        let score = t.rating * 10;
        if (t.verified) score += 5;
        const matches = t.specs.filter(s => kw.some(k => s.includes(k) || k.includes(s))).length;
        score += matches * 25;
        if (profile.experience === 'beginner' && t.exp < 8) score += 5;
        if (profile.experience === 'advanced' && t.exp >= 8) score += 5;
        return { t, score, matches };
      }).sort((a, b) => b.score - a.score);
      return scored.slice(0, 4);
    },
    stars(rating) {
      const full = Math.floor(rating);
      const half = rating - full >= 0.5;
      return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
    }
  };

  // ==================== TRAINER APPLICATIONS (mock backend) ====================
  const Applications = {
    all() { try { return JSON.parse(localStorage.getItem('tgs_apps') || '[]'); } catch { return []; } },
    submit(data) {
      const list = this.all();
      const app = { id: 'a' + Date.now(), status: 'review', submittedAt: new Date().toISOString(), ...data };
      list.unshift(app);
      localStorage.setItem('tgs_apps', JSON.stringify(list));
      return app;
    },
    update(id, patch) {
      const list = this.all();
      const i = list.findIndex(a => a.id === id);
      if (i === -1) return null;
      list[i] = { ...list[i], ...patch, updatedAt: new Date().toISOString() };
      localStorage.setItem('tgs_apps', JSON.stringify(list));
      return list[i];
    },
    forCurrentUser() {
      const u = Auth.current();
      if (!u) return null;
      return this.all().find(a => a.email === u.email) || null;
    }
  };

  // ==================== BOOKINGS ====================
  const Bookings = {
    all() { try { return JSON.parse(localStorage.getItem('tgs_bookings') || '[]'); } catch { return []; } },
    create({ trainerId, mode, weeks, total, notes }) {
      const list = this.all();
      const b = { id: 'b' + Date.now(), trainerId, mode, weeks, total, notes, status: 'confirmed', when: new Date().toISOString() };
      list.unshift(b);
      localStorage.setItem('tgs_bookings', JSON.stringify(list));
      return b;
    }
  };

  // ==================== SEARCH INDEX ====================
  // Each entry: { title, snippet, section, url, level, tier, icon, kw }
  const SEARCH_INDEX = [
    // Foods
    { title: 'Chicken Breast', snippet: '31g protein · 165 kcal per 100g · the gold standard for lean protein.', section: 'nutrition', url: 'sections/nutrition.html', level: 'beginner', tier: 'free', icon: '🍗', kw: 'chicken protein meat lean' },
    { title: 'Whey Protein', snippet: '90g protein per 100g powder · post-workout staple.', section: 'nutrition', url: 'sections/nutrition.html', level: 'beginner', tier: 'free', icon: '🥛', kw: 'whey protein supplement powder' },
    { title: 'Paneer', snippet: '18g protein, 21g fat per 100g · best vegetarian protein option.', section: 'nutrition', url: 'sections/nutrition.html', level: 'beginner', tier: 'free', icon: '🧀', kw: 'paneer vegetarian protein dairy indian' },
    { title: 'Tofu', snippet: '17g protein, 8g fat per 100g · plant-based complete protein.', section: 'nutrition', url: 'sections/nutrition.html', level: 'beginner', tier: 'free', icon: '🟦', kw: 'tofu vegan plant protein soy' },
    { title: 'Lentils', snippet: '9g protein, 20g carbs per 100g cooked · plant protein staple.', section: 'nutrition', url: 'sections/nutrition.html', level: 'beginner', tier: 'free', icon: '🫘', kw: 'lentils dal vegetarian vegan protein' },
    { title: 'Salmon', snippet: '25g protein, 13g fat (mostly omega-3) per 100g.', section: 'nutrition', url: 'sections/nutrition.html', level: 'beginner', tier: 'free', icon: '🐟', kw: 'salmon fish omega-3 protein' },
    { title: 'Greek Yogurt', snippet: '10g protein, low fat · ideal evening snack.', section: 'nutrition', url: 'sections/nutrition.html', level: 'beginner', tier: 'free', icon: '🥣', kw: 'yogurt dairy probiotic protein snack' },
    { title: 'Calorie Calculator', snippet: 'Mifflin-St Jeor TDEE + macro split for your goal.', section: 'nutrition', url: 'sections/nutrition.html#cal-form', level: 'beginner', tier: 'free', icon: '🧮', kw: 'calorie macro tdee calculator bmr' },
    { title: 'Bulking · Cutting · Maintenance', snippet: 'Three goal frameworks. Pick the one that fits your moment.', section: 'nutrition', url: 'sections/nutrition.html', level: 'intermediate', tier: 'free', icon: '⚡', kw: 'bulking cutting maintenance diet phase' },
    { title: 'High Protein Vegetarian Plan', snippet: 'Custom 7-day veg plan with paneer, tofu, lentils, dairy.', section: 'nutrition', url: 'sections/nutrition.html#plan-form', level: 'intermediate', tier: 'premium', icon: '🥗', kw: 'vegetarian veg paneer tofu high protein plan' },
    { title: 'Personalized Meal Plan', snippet: '7-day meal plan + grocery list + prep schedule for ₹299.', section: 'nutrition', url: 'sections/nutrition.html#plan-form', level: 'beginner', tier: 'premium', icon: '🔓', kw: 'meal plan custom personalized grocery' },
    // Workouts
    { title: 'Back Squat', snippet: 'King of leg lifts. 4×5–8 reps. Quads + glutes + core.', section: 'workout', url: 'sections/workout.html', level: 'intermediate', tier: 'free', icon: '🏋️', kw: 'squat barbell legs quads compound' },
    { title: 'Deadlift', snippet: '3×3–5 heavy. Posterior chain. Bar over mid-foot.', section: 'workout', url: 'sections/workout.html', level: 'intermediate', tier: 'free', icon: '🏋️', kw: 'deadlift back hamstrings strength' },
    { title: 'Bench Press', snippet: '4×6–8. Chest/triceps. Retract scapula, slight arch.', section: 'workout', url: 'sections/workout.html', level: 'beginner', tier: 'free', icon: '💪', kw: 'bench press chest barbell' },
    { title: 'Pull-Up', snippet: '4×AMRAP. Lats. Chin over bar, no swing.', section: 'workout', url: 'sections/workout.html', level: 'intermediate', tier: 'free', icon: '🤸', kw: 'pullup back lats bodyweight calisthenics' },
    { title: 'Workout Split Generator', snippet: '3 / 4 / 5 / 6-day splits by goal and experience.', section: 'workout', url: 'sections/workout.html', level: 'beginner', tier: 'free', icon: '🛠️', kw: 'split generator weekly schedule program' },
    { title: 'Hypertrophy Programming', snippet: '8–12 reps · 65–80% 1RM · 60–90s rest.', section: 'workout', url: 'sections/workout.html', level: 'intermediate', tier: 'free', icon: '📊', kw: 'hypertrophy reps sets bodybuilding' },
    { title: 'HIIT', snippet: '20–40s on, 10–60s off. Conditioning + fat burn.', section: 'workout', url: 'sections/workout.html', level: 'beginner', tier: 'free', icon: '⚡', kw: 'hiit cardio interval intensity fat loss' },
    { title: '12-Week Custom Program', snippet: 'Progressive overload, weekly progression, deload schedule.', section: 'workout', url: 'sections/workout.html#plan-form', level: 'intermediate', tier: 'premium', icon: '🔓', kw: 'custom program 12 week personalized progressive' },
    // Recovery
    { title: 'Sleep Stages (N1-N3, REM)', snippet: 'Deep sleep = anabolic. REM = brain detox. Both non-negotiable.', section: 'recovery', url: 'sections/recovery.html', level: 'beginner', tier: 'free', icon: '😴', kw: 'sleep stages rem deep n1 n2 n3' },
    { title: 'Cold Therapy', snippet: '3-min plunge / shower @ 10–14°C. Mood + alertness.', section: 'recovery', url: 'sections/recovery.html', level: 'intermediate', tier: 'free', icon: '🧊', kw: 'cold plunge shower ice therapy' },
    { title: 'Sauna Protocol', snippet: '15–20 min @ 80°C, 2–4× per week. Heat shock proteins.', section: 'recovery', url: 'sections/recovery.html', level: 'intermediate', tier: 'free', icon: '🔥', kw: 'sauna heat therapy hot' },
    { title: 'Mobility Flow', snippet: '10-min daily routine. Hips, T-spine, ankles.', section: 'recovery', url: 'sections/recovery.html', level: 'beginner', tier: 'free', icon: '🧘', kw: 'mobility flexibility stretch flow' },
    // Mental
    { title: 'Box Breathing', snippet: '4-4-4-4 cycle. Used by Navy SEALs. Anxiety control.', section: 'mental', url: 'sections/mental.html', level: 'beginner', tier: 'free', icon: '🌬️', kw: 'box breathing anxiety navy seal breathwork' },
    { title: 'Meditation Library', snippet: '9 protocols: vipassana, mantra, body scan, NSDR…', section: 'mental', url: 'sections/mental.html', level: 'beginner', tier: 'free', icon: '🧘', kw: 'meditation library vipassana mantra' },
    { title: 'Atomic Habits Framework', snippet: 'James Clear\'s 4 laws: obvious, attractive, easy, satisfying.', section: 'lifestyle', url: 'sections/lifestyle.html', level: 'beginner', tier: 'free', icon: '🧠', kw: 'atomic habits james clear 4 laws' },
    { title: 'Visualization', snippet: '5 min before training. Same neural firing as doing the rep.', section: 'mental', url: 'sections/mental.html', level: 'intermediate', tier: 'free', icon: '👁️', kw: 'visualization mental imagery sports psychology' },
    // Supplements
    { title: 'Creatine Monohydrate', snippet: '5g daily. The most-studied sup on Earth. ★★★★★.', section: 'supplements', url: 'sections/supplements.html', level: 'beginner', tier: 'free', icon: '💊', kw: 'creatine monohydrate atp strength' },
    { title: 'Caffeine', snippet: '3–6 mg/kg, 30–45 min pre-WO. Performance peak.', section: 'supplements', url: 'sections/supplements.html', level: 'beginner', tier: 'free', icon: '☕', kw: 'caffeine pre workout stimulant' },
    { title: 'Vitamin D3 + K2', snippet: '2000–5000 IU + 100 mcg with morning fat. Hormones.', section: 'supplements', url: 'sections/supplements.html', level: 'beginner', tier: 'free', icon: '☀️', kw: 'vitamin d3 k2 hormones immune' },
    { title: 'Magnesium Glycinate', snippet: '400mg pre-bed. Sleep + recovery.', section: 'supplements', url: 'sections/supplements.html', level: 'beginner', tier: 'free', icon: '🌙', kw: 'magnesium glycinate sleep recovery' },
    { title: 'Custom Supplement Stack', snippet: 'Brand picks + monthly cost + cycling plan.', section: 'supplements', url: 'sections/supplements.html#plan-form', level: 'intermediate', tier: 'premium', icon: '🔓', kw: 'custom stack supplement brand budget' },
    // Tracking
    { title: 'Body Measurement Protocol', snippet: 'Anatomical landmarks for chest, waist, hips, arms.', section: 'tracking', url: 'sections/tracking.html', level: 'beginner', tier: 'free', icon: '📏', kw: 'measurement chest waist hips arms protocol' },
    { title: 'Progress Photo SOP', snippet: 'Same time, lighting, pose, outfit. Compare 4-weekly.', section: 'tracking', url: 'sections/tracking.html', level: 'beginner', tier: 'free', icon: '📸', kw: 'progress photo before after sop' },
    { title: 'HRV', snippet: 'Recovery state metric. Train hard if up.', section: 'tracking', url: 'sections/tracking.html', level: 'advanced', tier: 'free', icon: '💓', kw: 'hrv heart rate variability recovery' },
    // Lifestyle
    { title: 'Hydration Formula', snippet: '35 ml/kg + 500 ml per hour of training.', section: 'lifestyle', url: 'sections/lifestyle.html', level: 'beginner', tier: 'free', icon: '💧', kw: 'hydration water formula' },
    { title: '10K Steps', snippet: 'NEAT booster. 300–500 kcal/day. Mood + BP.', section: 'lifestyle', url: 'sections/lifestyle.html', level: 'beginner', tier: 'free', icon: '👟', kw: '10k steps walking neat' },
    { title: 'Posture Reset', snippet: '5-min routine. Chin tucks, wall angels, T-spine.', section: 'lifestyle', url: 'sections/lifestyle.html', level: 'beginner', tier: 'free', icon: '🪑', kw: 'posture reset desk job' },
    // Trainers (cross-search)
    { title: 'Hire a Trainer', snippet: 'Online · Plans-only · Offline. Filter by goal, budget, rating.', section: 'trainers', url: 'trainers.html', level: 'beginner', tier: 'free', icon: '🧑‍🏫', kw: 'hire trainer coach online offline plans' },
    { title: 'Become a Trainer', snippet: 'Apply if certified or experienced. Approval in 48h.', section: 'trainers', url: 'become-trainer.html', level: 'advanced', tier: 'free', icon: '🎓', kw: 'become trainer apply coach earnings' },
  ];

  const Search = {
    index() { return SEARCH_INDEX; },
    query(q, filters = {}) {
      const term = (q || '').toLowerCase().trim();
      if (!term && !Object.values(filters).some(Boolean)) return [];
      let results = SEARCH_INDEX.filter(it => {
        if (filters.section && it.section !== filters.section) return false;
        if (filters.level && it.level !== filters.level) return false;
        if (filters.tier && it.tier !== filters.tier) return false;
        if (!term) return true;
        const hay = `${it.title} ${it.snippet} ${it.kw}`.toLowerCase();
        return hay.includes(term);
      });
      if (term) {
        results = results.map(r => {
          const h = `${r.title} ${r.kw}`.toLowerCase();
          let score = 0;
          if (r.title.toLowerCase().includes(term)) score += 10;
          if (h.includes(term)) score += 4;
          term.split(/\s+/).forEach(t => { if (t && h.includes(t)) score += 2; });
          return { ...r, _score: score };
        }).sort((a, b) => b._score - a._score);
      }
      return results.slice(0, 30);
    },
    highlight(text, term) {
      if (!term) return escapeHtml(text);
      const parts = String(text).split(new RegExp(`(${escapeRegex(term)})`, 'ig'));
      return parts.map(p => p.toLowerCase() === term.toLowerCase() ? `<mark>${escapeHtml(p)}</mark>` : escapeHtml(p)).join('');
    },
    mount(rootId, opts = {}) {
      const root = document.getElementById(rootId);
      if (!root) return;
      const section = opts.section || '';
      const isSub = window.location.pathname.includes('/sections/');
      const prefix = isSub ? '../' : '';
      const placeholder = section ? `Search anything about ${section}…` : 'Search anything on TheGrindSociety…';
      root.innerHTML = `
        <div class="smart-search">
          <div class="ss-bar">
            <span class="icon">🔍</span>
            <input id="${rootId}-input" type="search" placeholder="${escapeHtml(placeholder)}" autocomplete="off" />
            <button class="clear" id="${rootId}-clear" aria-label="Clear" style="display:none;">×</button>
          </div>
          <div class="ss-filters" id="${rootId}-filters">
            <span style="font-size:0.7rem;letter-spacing:0.15em;color:var(--muted);text-transform:uppercase;align-self:center;">Filter:</span>
            <div class="chip active" data-fkey="level" data-fval="">All Levels</div>
            <div class="chip" data-fkey="level" data-fval="beginner">Beginner</div>
            <div class="chip" data-fkey="level" data-fval="intermediate">Intermediate</div>
            <div class="chip" data-fkey="level" data-fval="advanced">Advanced</div>
            <span style="width:1px;background:var(--border);height:18px;margin:0 0.4rem;"></span>
            <div class="chip active" data-fkey="tier" data-fval="">All Access</div>
            <div class="chip" data-fkey="tier" data-fval="free">Free</div>
            <div class="chip" data-fkey="tier" data-fval="premium">Premium</div>
          </div>
          <div class="ss-results" id="${rootId}-results"></div>
        </div>
      `;
      const input = document.getElementById(rootId + '-input');
      const clear = document.getElementById(rootId + '-clear');
      const results = document.getElementById(rootId + '-results');
      const filters = { level: '', tier: '' };
      const sectionPin = section ? { section } : {};

      const render = () => {
        const q = input.value.trim();
        clear.style.display = q ? 'inline-block' : 'none';
        if (!q) { results.classList.remove('open'); results.innerHTML = ''; return; }
        const items = Search.query(q, { ...filters, ...sectionPin });
        if (items.length === 0) {
          results.innerHTML = `<div class="ss-empty">No matches for <strong>"${escapeHtml(q)}"</strong>. Try fewer words.</div>`;
        } else {
          // Group by section
          const groups = {};
          items.forEach(i => { (groups[i.section] = groups[i.section] || []).push(i); });
          const SECTION_LABEL = { nutrition:'🥗 Nutrition', workout:'💪 Workouts', recovery:'😴 Recovery', mental:'🧠 Mental', supplements:'💊 Supplements', tracking:'📊 Tracking', lifestyle:'🏃 Lifestyle', trainers:'🧑‍🏫 Trainers' };
          let html = '';
          Object.entries(groups).forEach(([sec, list]) => {
            html += `<div class="ss-group">${SECTION_LABEL[sec] || sec}</div>`;
            list.forEach(it => {
              html += `
                <a class="ss-item" href="${prefix}${it.url}">
                  <div class="icon">${it.icon}</div>
                  <div>
                    <div class="title">${Search.highlight(it.title, q)}</div>
                    <div class="meta">${Search.highlight(it.snippet, q)}</div>
                  </div>
                  <div class="badges">
                    <span class="ss-tag">${it.level}</span>
                    <span class="ss-tag ${it.tier === 'premium' ? 'premium' : ''}">${it.tier}</span>
                  </div>
                </a>`;
            });
          });
          results.innerHTML = html;
        }
        results.classList.add('open');
      };
      input.addEventListener('input', render);
      input.addEventListener('focus', render);
      input.addEventListener('keydown', e => {
        if (e.key === 'Escape') { input.value = ''; render(); input.blur(); }
      });
      clear.addEventListener('click', () => { input.value = ''; input.focus(); render(); });
      // Filter chips
      document.querySelectorAll(`#${rootId}-filters .chip`).forEach(ch => ch.addEventListener('click', () => {
        const k = ch.dataset.fkey, v = ch.dataset.fval;
        document.querySelectorAll(`#${rootId}-filters .chip[data-fkey="${k}"]`).forEach(x => x.classList.remove('active'));
        ch.classList.add('active');
        filters[k] = v;
        render();
      }));
      // Click outside closes
      document.addEventListener('click', e => {
        if (!root.contains(e.target)) results.classList.remove('open');
      });
    }
  };
  function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // ==================== CHAT (mock) ====================
  const Chat = {
    history(trainerId) { try { return JSON.parse(localStorage.getItem('tgs_chat_' + trainerId) || '[]'); } catch { return []; } },
    push(trainerId, msg) {
      const list = this.history(trainerId);
      list.push(msg);
      localStorage.setItem('tgs_chat_' + trainerId, JSON.stringify(list));
    }
  };

  // ==================== BEGINNER ====================
  const Beginner = {
    get() { try { return JSON.parse(localStorage.getItem('tgs_beginner') || 'null'); } catch { return null; } },
    set(b) { localStorage.setItem('tgs_beginner', JSON.stringify(b)); },
    has() { return !!this.get(); },
    pathLabel(b) {
      b = b || this.get() || {};
      const goal = b.goal || 'fitness';
      const map = { 'fat-loss': 'Beginner Fat Loss Path', 'muscle-gain': 'Beginner Muscle Gain Path', 'fitness': 'General Fitness Path' };
      return map[goal] || 'General Fitness Path';
    },
    todayPlan(b) {
      b = b || this.get() || { goal: 'fitness', where: 'gym' };
      const where = b.where === 'home' ? 'home' : 'gym';
      const goal = b.goal || 'fitness';
      const plans = {
        'fat-loss-gym': {
          title: "Today's Plan — Fat Loss, Gym",
          warmup: ['5 min easy walk on treadmill', '10 arm circles each direction', '10 bodyweight squats'],
          main: ['10 min steady walk (incline 3)', '8 chest press machine (light)', '8 lat pulldown (light)', '12 bodyweight squats', '20 sec plank x2'],
          cooldown: ['5 min slow walk', 'Stretch hamstrings 30s each leg', 'Stretch chest in doorway 30s']
        },
        'fat-loss-home': {
          title: "Today's Plan — Fat Loss, Home",
          warmup: ['Walk in place 3 min', 'Arm swings 20', 'Hip circles 10 each side'],
          main: ['10 squats', '8 incline pushups (against wall/counter)', '20 marching in place', '20 sec plank', 'Repeat circuit 2x'],
          cooldown: ['5 min walk outside', 'Stretch hamstrings + chest 30s each']
        },
        'muscle-gain-gym': {
          title: "Today's Plan — Muscle Gain, Gym",
          warmup: ['5 min easy bike or walk', '10 arm circles', '10 bodyweight squats', '5 pushups (knees ok)'],
          main: ['Chest press machine: 3 sets of 8 (light, focus form)', 'Lat pulldown: 3 sets of 8', 'Leg press: 3 sets of 10', 'Seated cable row: 2 sets of 10'],
          cooldown: ['5 min slow walk', 'Stretch chest, lats, quads — 30s each']
        },
        'muscle-gain-home': {
          title: "Today's Plan — Muscle Gain, Home",
          warmup: ['Jog in place 2 min', 'Arm circles 20', '10 bodyweight squats'],
          main: ['Pushups (knees if needed): 3 sets of 8', 'Bodyweight squats: 3 sets of 12', 'Glute bridges: 3 sets of 12', 'Superman holds: 2 sets of 20s'],
          cooldown: ['Stretch chest, hamstrings, hip flexors — 30s each']
        },
        'fitness-gym': {
          title: "Today's Plan — General Fitness, Gym",
          warmup: ['5 min walk on treadmill', 'Arm + leg swings 20 each'],
          main: ['10 min steady cardio (bike or walk)', '8 chest press machine', '8 lat pulldown', '10 leg press', '20 sec plank x2'],
          cooldown: ['5 min slow walk', 'Full body stretch 5 min']
        },
        'fitness-home': {
          title: "Today's Plan — General Fitness, Home",
          warmup: ['March in place 3 min', 'Arm circles 20'],
          main: ['10 squats', '8 incline pushups', '10 glute bridges', '20 sec plank', 'Repeat 2-3 rounds'],
          cooldown: ['Walk 5 min', 'Stretch full body']
        }
      };
      return plans[`${goal}-${where}`] || plans['fitness-gym'];
    },
    roadmap() {
      return [
        { week: 1, title: 'Show Up', focus: 'Just being there. Learn the layout.', tasks: ['Visit the gym 3 times', 'Walk through every section once', 'Complete one full Day 1 plan', 'Try one cardio machine'] },
        { week: 2, title: 'Form First', focus: 'Master 5 basic movements with light weight.', tasks: ['Train 3 times this week', 'Learn squat, push, pull, hinge, plank', 'Use lighter weights than you think', 'Watch one form video before each session'] },
        { week: 3, title: 'Build the Routine', focus: 'Same days, same time, no excuses.', tasks: ['Pick fixed gym days', 'Train 4 times this week', 'Track your weights in a notes app', 'Drink water through every session'] },
        { week: 4, title: 'Push the Bar', focus: 'Small progressive overload.', tasks: ['Add 2.5kg to one main lift', 'Train 4 times', 'Try one new machine you avoided', 'Take a progress photo'] }
      ];
    },
    progress() { try { return JSON.parse(localStorage.getItem('tgs_roadmap') || '{}'); } catch { return {}; } },
    toggleTask(weekIdx, taskIdx) {
      const p = this.progress();
      const key = `${weekIdx}-${taskIdx}`;
      p[key] = !p[key];
      localStorage.setItem('tgs_roadmap', JSON.stringify(p));
      Badges.checkAll();
      return p[key];
    },
    isTaskDone(weekIdx, taskIdx) { return !!this.progress()[`${weekIdx}-${taskIdx}`]; }
  };

  // ==================== STREAKS ====================
  const Streaks = {
    get() { try { return JSON.parse(localStorage.getItem('tgs_streak') || 'null'); } catch { return null; } },
    set(s) { localStorage.setItem('tgs_streak', JSON.stringify(s)); },
    today() { return new Date().toISOString().slice(0, 10); },
    daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); },
    checkIn() {
      const s = this.get() || { count: 0, last: null, best: 0, history: [] };
      const t = this.today();
      if (s.last === t) return s; // already checked in
      const gap = s.last ? this.daysBetween(s.last, t) : 1;
      if (gap === 1) s.count += 1;
      else s.count = 1;
      s.last = t;
      s.best = Math.max(s.best || 0, s.count);
      s.history = (s.history || []).concat(t).slice(-30);
      this.set(s);
      Badges.checkAll();
      return s;
    },
    current() {
      const s = this.get();
      if (!s) return 0;
      const gap = this.daysBetween(s.last, this.today());
      return gap > 1 ? 0 : s.count;
    }
  };

  // ==================== BADGES ====================
  const BADGE_DEFS = [
    { id: 'first-step', icon: '👟', name: 'First Step', desc: 'Completed the beginner wizard', check: () => Beginner.has() },
    { id: 'first-workout', icon: '🏋️', name: 'First Workout', desc: 'Checked in for your first session', check: () => (Streaks.get()?.count || 0) >= 1 },
    { id: 'week-streak', icon: '🔥', name: '7-Day Streak', desc: 'Showed up 7 days in a row', check: () => (Streaks.get()?.best || 0) >= 7 },
    { id: 'two-week', icon: '⚡', name: '14-Day Warrior', desc: 'Two-week streak', check: () => (Streaks.get()?.best || 0) >= 14 },
    { id: 'roadmap-w1', icon: '📍', name: 'Week 1 Cleared', desc: 'All Week 1 tasks done', check: () => {
      const r = Beginner.progress();
      return [0,1,2,3].every(i => r[`0-${i}`]);
    } },
    { id: 'roadmap-w2', icon: '🎯', name: 'Form Master', desc: 'All Week 2 tasks done', check: () => {
      const r = Beginner.progress();
      return [0,1,2,3].every(i => r[`1-${i}`]);
    } },
    { id: 'fearless', icon: '💪', name: 'Fearless', desc: 'Read every Common Fear', check: () => (JSON.parse(localStorage.getItem('tgs_fears_read') || '[]') || []).length >= 8 },
    { id: 'machine-savvy', icon: '⚙️', name: 'Machine Savvy', desc: 'Studied 5 machines', check: () => (JSON.parse(localStorage.getItem('tgs_machines_read') || '[]') || []).length >= 5 }
  ];
  const Badges = {
    defs: BADGE_DEFS,
    earned() { try { return JSON.parse(localStorage.getItem('tgs_badges') || '[]'); } catch { return []; } },
    has(id) { return this.earned().includes(id); },
    award(id) {
      const list = this.earned();
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem('tgs_badges', JSON.stringify(list));
        const def = BADGE_DEFS.find(b => b.id === id);
        if (def) toast(`${def.icon}  Badge unlocked: ${def.name}`);
      }
    },
    checkAll() {
      BADGE_DEFS.forEach(b => { if (!this.has(b.id) && b.check()) this.award(b.id); });
    },
    markRead(kind, key) {
      const k = `tgs_${kind}_read`;
      const list = (() => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } })();
      if (!list.includes(key)) { list.push(key); localStorage.setItem(k, JSON.stringify(list)); }
      this.checkAll();
    }
  };

  // ==================== AI GYM BUDDY (rule-based) ====================
  const Buddy = {
    rules: [
      { keys: ['judge', 'judg', 'staring', 'watch me', 'people look', 'awkward', 'embarrass'],
        reply: "Honest truth: 95% of people in the gym are buried in their own playlist or counting their reps. Nobody is studying you. The 5% who notice are usually rooting for new lifters. Show up in clean clothes, do your thing, leave. That's it." },
      { keys: ['scared', 'afraid', 'nervous', 'anxious', 'first time', 'first day'],
        reply: "Day 1 nerves are normal — every single person in there had a first day. Walk in, do an easy 10-minute warmup on the treadmill, try one machine you understand, leave. Goal of Day 1 is just *finishing* Day 1. Your second visit will already feel different." },
      { keys: ['eat', 'food', 'meal', 'nutrition', 'protein', 'diet'],
        reply: () => {
          const p = Profile.get();
          if (!p) return "Quick rule of thumb: 1g of protein per pound of bodyweight, plenty of veggies, water before sugar. Set up your profile in onboarding for personalized macros.";
          const m = Profile.macroSplit(p);
          return `Based on your profile:\n• Calories: ~${m.calories}/day\n• Protein: ${m.protein}g (chicken, eggs, paneer, dal, whey)\n• Carbs: ${m.carbs}g (rice, oats, fruit, roti)\n• Fats: ${m.fats}g (nuts, ghee, olive oil)\n\nDon't overthink it. Hit protein, drink water, sleep 7+ hours.`;
        } },
      { keys: ['form', 'correct', 'right way', 'how to do', 'technique'],
        reply: "Beginner form checklist for any lift:\n1. Start lighter than your ego wants\n2. Move slow on the way down (3 seconds), controlled on the way up\n3. Full range of motion > more weight\n4. If you can't do 8 clean reps, drop the weight\n5. Watch one demo video before you try a new exercise\n\nCheck the Machine Guide page for step-by-step on each machine." },
      { keys: ['tired', 'sore', 'rest', 'day off', 'pain', 'hurt'],
        reply: "Soreness 1-2 days after a session is normal — that's your muscles adapting. Sharp pain during a movement is not. Rules:\n• Sore = light walk, stretching, sleep\n• Sharp pain = stop, ice, see a doctor if it persists\n• 1-2 rest days per week is part of the plan, not a failure" },
      { keys: ['motivat', 'lazy', 'lost', 'give up', 'quit', "don't feel"],
        reply: "Motivation is a liar — discipline is the answer. Tricks that work:\n• Pack your gym bag the night before\n• Commit to *just walking in* — once you're there, you'll train\n• Track your streak; don't break the chain\n• Find one song that flips a switch in you, save it for the walk in\n\nYou don't have to feel like it. You just have to go." },
      { keys: ['machine', 'equipment', 'how use'],
        reply: "Open the Machine Guide on the beginner page — it has each machine with muscles worked, 3-step usage, and common mistakes. Quick rule: every machine has a placard with instructions and a body diagram. Read it, set the seat to your height, start with the lowest plate." },
      { keys: ['skinny', 'thin', 'small', 'underweight'],
        reply: "Hardgainer playbook:\n• Eat in a calorie surplus (your TDEE + 300-500)\n• Lift heavy compounds (squat, bench, row, press) 3x/week\n• 1g protein per pound of bodyweight\n• Sleep 8 hours\n• Be patient — visible muscle takes 8-12 weeks of consistency\n\nYou will *not* get bulky by accident. It takes years." },
      { keys: ['fat', 'overweight', 'lose weight', 'big'],
        reply: "Fat loss playbook:\n• Calorie deficit (your TDEE − 400-500)\n• Walk 8-10k steps daily — this matters more than cardio sessions\n• Lift weights so you lose fat, not muscle\n• Protein at every meal (keeps you full)\n• Trust the process — 0.5-1kg/week is the right pace" },
      { keys: ['wear', 'clothes', 'outfit', 'shoes'],
        reply: "Keep it simple:\n• Comfortable t-shirt + shorts/track pants you can move in\n• Closed athletic shoes (running shoes are fine to start)\n• A small towel + 1L water bottle\n\nDon't buy fancy gear before you've trained for a month. Earn it." },
      { keys: ['gym etiquette', 'rules', 'etiquette', 'do not'],
        reply: "Gym etiquette quick list:\n✅ Wipe down equipment after use\n✅ Re-rack your weights\n✅ Let people work in between sets\n✅ Keep music in your headphones\n❌ Don't film others\n❌ Don't hog machines on your phone\n❌ Don't drop dumbbells unless it's an emergency" }
    ],
    greet() {
      const u = Auth.current();
      const name = u?.name?.split(' ')[0] || 'friend';
      return `Hey ${name} — I'm your gym buddy. Ask me anything (no judgment).\n\nTry: "I feel awkward at the gym", "what should I eat?", "how do I do it right?", "I'm losing motivation", or "what should I wear?"`;
    },
    reply(text) {
      const t = (text || '').toLowerCase();
      for (const rule of this.rules) {
        if (rule.keys.some(k => t.includes(k))) {
          return typeof rule.reply === 'function' ? rule.reply() : rule.reply;
        }
      }
      return "I'm a simple buddy with limits — I don't have a real brain yet. Try asking me about: gym fears, what to eat, form/technique, rest & soreness, losing motivation, machines, what to wear, or etiquette.";
    },
    history() { try { return JSON.parse(localStorage.getItem('tgs_buddy_chat') || '[]'); } catch { return []; } },
    push(msg) {
      const list = this.history();
      list.push(msg);
      localStorage.setItem('tgs_buddy_chat', JSON.stringify(list.slice(-50)));
    },
    clear() { localStorage.removeItem('tgs_buddy_chat'); }
  };

  // ==================== FLOATING WIDGETS ====================
  function injectFloatingWidgets() {
    if (document.getElementById('tgs-fab-stack')) return;
    const isWizard = window.location.pathname.includes('beginner-wizard');
    if (isWizard) return; // don't clutter the wizard
    const isSub = window.location.pathname.includes('/sections/');
    const prefix = isSub ? '../' : '';
    const stack = document.createElement('div');
    stack.id = 'tgs-fab-stack';
    stack.innerHTML = `
      <button class="tgs-fab tgs-fab-plan" aria-label="Today's plan" title="Tell me what to do today">
        <span style="font-size:1.4rem;">🎯</span>
      </button>
      <button class="tgs-fab tgs-fab-buddy" aria-label="AI Gym Buddy" title="Ask your gym buddy">
        <span style="font-size:1.4rem;">💬</span>
      </button>
    `;
    document.body.appendChild(stack);
    document.querySelector('.tgs-fab-plan').addEventListener('click', () => showTodayPlan(prefix));
    document.querySelector('.tgs-fab-buddy').addEventListener('click', () => showBuddy());
  }

  function showTodayPlan(prefix = '') {
    const b = Beginner.get();
    const plan = Beginner.todayPlan(b);
    const hasBeginner = !!b;
    const html = `
      <div class="modal-backdrop" id="tgs-plan-modal">
        <div class="modal" style="max-width:560px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem;">
            <div>
              <div style="color:#9aa6ff;letter-spacing:0.18em;text-transform:uppercase;font-size:0.75rem;font-weight:700;">Today's Plan</div>
              <h3 class="display" style="font-size:1.8rem;margin:0.3rem 0 0;">${plan.title}</h3>
            </div>
            <button class="tgs-x" onclick="document.getElementById('tgs-plan-modal').remove()">×</button>
          </div>
          ${!hasBeginner ? `<p style="color:var(--muted);font-size:0.9rem;margin:0 0 1rem;">Take the beginner wizard for a plan tuned to you. <a href="${prefix}beginner-wizard.html" style="color:#9aa6ff;">Start it →</a></p>` : ''}
          <div class="plan-block">
            <div class="plan-h">🔥 Warmup (5 min)</div>
            <ul>${plan.warmup.map(x => `<li>${x}</li>`).join('')}</ul>
          </div>
          <div class="plan-block">
            <div class="plan-h">💪 Main Workout (15-20 min)</div>
            <ul>${plan.main.map(x => `<li>${x}</li>`).join('')}</ul>
          </div>
          <div class="plan-block">
            <div class="plan-h">🧘 Cooldown (5 min)</div>
            <ul>${plan.cooldown.map(x => `<li>${x}</li>`).join('')}</ul>
          </div>
          <button class="btn btn-primary" id="tgs-checkin-btn" style="width:100%;margin-top:1.2rem;">I did it — Check in 🔥</button>
        </div>
      </div>
    `;
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstElementChild);
    document.getElementById('tgs-checkin-btn').addEventListener('click', () => {
      const s = Streaks.checkIn();
      toast(`🔥 Streak: ${s.count} day${s.count > 1 ? 's' : ''}!`);
      document.getElementById('tgs-plan-modal').remove();
    });
  }

  function showBuddy() {
    let modal = document.getElementById('tgs-buddy-modal');
    if (modal) { modal.remove(); return; }
    const html = `
      <div class="tgs-buddy-panel" id="tgs-buddy-modal">
        <div class="tgs-buddy-head">
          <div style="display:flex;align-items:center;gap:0.6rem;">
            <div class="tgs-buddy-avatar">💪</div>
            <div>
              <div style="font-weight:700;">Gym Buddy</div>
              <div style="font-size:0.72rem;color:var(--muted);">Ask anything · No judgment</div>
            </div>
          </div>
          <button class="tgs-x" onclick="document.getElementById('tgs-buddy-modal').remove()">×</button>
        </div>
        <div class="tgs-buddy-msgs" id="tgs-buddy-msgs"></div>
        <div class="tgs-buddy-quick">
          <button data-q="I feel awkward at the gym">😬 Feeling awkward</button>
          <button data-q="What should I eat today?">🍽️ Nutrition</button>
          <button data-q="Am I doing the form correctly?">📏 Form check</button>
          <button data-q="I lost motivation">⚡ Motivation</button>
        </div>
        <form class="tgs-buddy-form" id="tgs-buddy-form">
          <input id="tgs-buddy-input" type="text" placeholder="Type your question..." autocomplete="off"/>
          <button type="submit" class="btn btn-primary" style="padding:0.6rem 1rem;font-size:0.85rem;">Send</button>
        </form>
      </div>
    `;
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstElementChild);
    const msgs = document.getElementById('tgs-buddy-msgs');
    const history = Buddy.history();
    const renderMsg = m => {
      const div = document.createElement('div');
      div.className = 'tgs-buddy-msg ' + (m.from === 'user' ? 'me' : 'buddy');
      div.textContent = m.text;
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    };
    if (history.length === 0) {
      renderMsg({ from: 'buddy', text: Buddy.greet() });
    } else {
      history.forEach(renderMsg);
    }
    const send = (text) => {
      if (!text.trim()) return;
      const u = { from: 'user', text };
      renderMsg(u);
      Buddy.push(u);
      setTimeout(() => {
        const r = { from: 'buddy', text: Buddy.reply(text) };
        renderMsg(r);
        Buddy.push(r);
      }, 350);
    };
    document.getElementById('tgs-buddy-form').addEventListener('submit', e => {
      e.preventDefault();
      const inp = document.getElementById('tgs-buddy-input');
      send(inp.value);
      inp.value = '';
    });
    document.querySelectorAll('.tgs-buddy-quick button').forEach(btn => {
      btn.addEventListener('click', () => send(btn.dataset.q));
    });
  }

  // ---------- Public API ----------
  window.TGS = {
    Auth, Profile, Subs, Challenges, Quotes, Trainers, Applications, Bookings, Search, Chat,
    Theme, Beginner, Streaks, Badges, Buddy,
    toggleTheme: () => Theme.toggle(),
    toast, renderNavbar, renderFooter, renderModuleSidebar,
    showSubscribeModal, maybeShowLocked, observeFadeIn,
    rotateHeroQuotes,
    logoMark,
    showTodayPlan, showBuddy
  };

  // Auto-init
  document.addEventListener('DOMContentLoaded', () => {
    const active = document.body.dataset.nav || '';
    renderNavbar(active);
    renderFooter();
    observeFadeIn();
    injectFloatingWidgets();
    Badges.checkAll();
    // Auto-mount any smart-search slots
    document.querySelectorAll('[data-search-mount]').forEach(el => {
      const id = el.id || ('ss-' + Math.random().toString(36).slice(2, 8));
      el.id = id;
      Search.mount(id, { section: el.dataset.searchMount || '' });
    });
  });
})();
