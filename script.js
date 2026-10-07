(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Текущий год в подвале
    document.getElementById('year').textContent = new Date().getFullYear();

    // ---------- Тема ----------
    const themeToggle = document.querySelector('.theme-toggle');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');

    themeToggle.addEventListener('click', () => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch (e) {}
    });

    // ---------- Шапка и прогресс прокрутки ----------
    const header = document.querySelector('.header');
    const progress = document.querySelector('.scroll-progress');
    let scrollTicking = false;

    const onScroll = () => {
        const max = root.scrollHeight - window.innerHeight;
        progress.style.setProperty('--progress', max > 0 ? window.scrollY / max : 0);
        header.classList.toggle('is-scrolled', window.scrollY > 20);
        scrollTicking = false;
    };
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            scrollTicking = true;
            requestAnimationFrame(onScroll);
        }
    }, { passive: true });
    onScroll();

    // ---------- Мобильное меню ----------
    const nav = document.getElementById('nav');
    const menuToggle = document.querySelector('.menu-toggle');

    const setMenu = (open) => {
        nav.classList.toggle('is-open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
    };
    menuToggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !menuToggle.contains(e.target)) setMenu(false);
    });

    // ---------- Активный пункт меню ----------
    const navLinks = [...nav.querySelectorAll('a')];
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            navLinks.forEach((link) => {
                link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
            });
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach((s) => sectionObserver.observe(s));

    // ---------- Счётчики ----------
    const animateCounter = (el) => {
        const to = Number(el.dataset.to);
        if (reducedMotion) { el.textContent = to; return; }
        const duration = 1600;
        const start = performance.now();
        const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
            if (t < 1) requestAnimationFrame(tick);
        };
        el.textContent = 0;
        requestAnimationFrame(tick);
    };

    // ---------- Появление при прокрутке ----------
    const revealItems = document.querySelectorAll('.reveal');

    // Соседние элементы появляются по очереди
    revealItems.forEach((el) => {
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
        el.style.setProperty('--delay', siblings.indexOf(el) * 0.09 + 's');
    });

    // После появления снимаем служебные классы, чтобы не мешать hover-эффектам
    const finishReveal = (el) => {
        const delay = parseFloat(el.style.getPropertyValue('--delay')) || 0;
        setTimeout(() => {
            el.classList.remove('reveal', 'is-visible');
            el.style.removeProperty('--delay');
        }, 1000 + delay * 1000);
    };

    const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add('is-visible');
            finishReveal(el);
            el.querySelectorAll('.counter').forEach(animateCounter);
            obs.unobserve(el);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach((el) => revealObserver.observe(el));

    const timeline = document.querySelector('.timeline');
    new IntersectionObserver(([entry], obs) => {
        if (entry.isIntersecting) { timeline.classList.add('is-visible'); obs.disconnect(); }
    }, { threshold: 0.2 }).observe(timeline);

    // ---------- Сменяющиеся слова в заголовке ----------
    const rotator = document.querySelector('.rotator');
    const words = ['работу команд', 'редакции', 'обучение', 'процессы', 'медиа'];
    if (rotator && !reducedMotion) {
        let i = 0;
        setInterval(() => {
            rotator.classList.add('is-out');
            setTimeout(() => {
                i = (i + 1) % words.length;
                rotator.textContent = words[i];
                rotator.classList.remove('is-out');
            }, 400);
        }, 2800);
    }

    if (reducedMotion || !finePointer) return;

    // ---------- Курсор: кольцо и мягкое свечение ----------
    const ring = document.querySelector('.cursor-ring');
    const glow = document.querySelector('.cursor-glow');
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...mouse };
    const glowPos = { ...mouse };
    let ringScale = 1;
    const interactive = 'a, button, .chips li';

    window.addEventListener('pointermove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        if (!root.classList.contains('has-cursor')) {
            ringPos.x = glowPos.x = mouse.x;
            ringPos.y = glowPos.y = mouse.y;
            root.classList.add('has-cursor');
        }
    }, { passive: true });

    document.addEventListener('pointerover', (e) => {
        ring.classList.toggle('is-hover', !!e.target.closest(interactive));
    });
    document.addEventListener('pointerdown', () => ring.classList.add('is-down'));
    document.addEventListener('pointerup', () => ring.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => root.classList.remove('has-cursor'));

    const loop = () => {
        ringPos.x += (mouse.x - ringPos.x) * 0.2;
        ringPos.y += (mouse.y - ringPos.y) * 0.2;
        glowPos.x += (mouse.x - glowPos.x) * 0.07;
        glowPos.y += (mouse.y - glowPos.y) * 0.07;
        ringScale += ((ring.classList.contains('is-hover') ? 1.6 : 1) - ringScale) * 0.15;
        ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) scale(${ringScale})`;
        glow.style.transform = `translate3d(${glowPos.x}px, ${glowPos.y}px, 0)`;
        requestAnimationFrame(loop);
    };
    ring.style.transition = 'opacity 0.3s, border-width 0.2s';
    requestAnimationFrame(loop);

    // ---------- Подсветка карточек под курсором ----------
    document.querySelectorAll('.spotlight').forEach((el) => {
        el.addEventListener('pointermove', (e) => {
            const r = el.getBoundingClientRect();
            el.style.setProperty('--mx', e.clientX - r.left + 'px');
            el.style.setProperty('--my', e.clientY - r.top + 'px');
        });
    });

    // ---------- Кнопки слегка тянутся к курсору ----------
    document.querySelectorAll('.magnetic').forEach((el) => {
        el.addEventListener('pointermove', (e) => {
            const r = el.getBoundingClientRect();
            const dx = (e.clientX - r.left - r.width / 2) / r.width;
            const dy = (e.clientY - r.top - r.height / 2) / r.height;
            el.style.transform = `translate(${dx * 8}px, ${dy * 8}px)`;
        });
        el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    // ---------- Фото поворачивается за курсором ----------
    const tilt = document.querySelector('.tilt');
    const hero = document.querySelector('.hero');
    hero.addEventListener('pointermove', (e) => {
        const r = tilt.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
        tilt.style.setProperty('--ry', (dx * 12).toFixed(2) + 'deg');
        tilt.style.setProperty('--rx', (-dy * 12).toFixed(2) + 'deg');
    });
    hero.addEventListener('pointerleave', () => {
        tilt.style.setProperty('--ry', '0deg');
        tilt.style.setProperty('--rx', '0deg');
    });
})();
