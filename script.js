document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ============================
    // УТИЛИТЫ
    // ============================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    function debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }

    function throttle(fn, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                fn(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    function showToast(message) {
        let container = $('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return Promise.resolve();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================
    // 1. ПРОГРЕСС-БАР
    // ============================
    const loader = $('#loader');
    const loaderBar = $('#loader-bar');
    let loadProgress = 0;

    const loadInterval = setInterval(() => {
        loadProgress += Math.random() * 18 + 5;
        if (loadProgress >= 100) {
            loadProgress = 100;
            clearInterval(loadInterval);
            loader.setAttribute('aria-valuenow', '100');
            setTimeout(() => {
                loader.classList.add('hidden');
                setTimeout(() => loader.remove(), 600);
            }, 400);
        } else {
            loader.setAttribute('aria-valuenow', Math.floor(loadProgress));
        }
        loaderBar.style.width = loadProgress + '%';
    }, 180);

    // ============================
    // 2. ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ
    // ============================
    const canvas = $('#ai-network');
    const ctx = canvas.getContext('2d');
    const matrixCanvas = $('#matrix-rain');
    const matrixCtx = matrixCanvas.getContext('2d');
    const starsCanvas = $('#stars-canvas');
    const starsCtx = starsCanvas.getContext('2d');
    const hexCanvas = $('#hex-grid');
    const hexCtx = hexCanvas.getContext('2d');
    const audioCanvas = $('#audio-visualizer');
    const audioCtxVis = audioCanvas.getContext('2d');
    const rippleCanvas = $('#ripple-canvas');
    const rippleCtx = rippleCanvas.getContext('2d');

    const textElement = $('#main-title');
    const mainContent = $('#main-content');
    const audioToggle = $('#audio-toggle');
    const backgroundMusic = $('#background-music');
    const clickSound = $('#click-sound');
    const clockElement = $('#clock');
    const terminalText = $('#terminal-text');
    const modalOverlay = $('#modal-overlay');
    const modalClose = $('#modal-close');

    const chatOpenBtn = $('#chat-open-btn');
    const chatCloseBtn = $('#chat-close-btn');
    const chatOverlay = $('#chat-modal-overlay');

    const feedbackOpenBtn = $('#feedback-open-btn');
    const feedbackClose = $('#feedback-close');
    const feedbackModal = $('#feedback-modal');

    const aiChatBtn = $('#ai-chat-btn');
    const aiChatWindow = $('#ai-chat-window');
    const aiChatClose = $('#ai-chat-close');
    const aiChatInput = $('#ai-chat-input');
    const aiChatSend = $('#ai-chat-send');
    const aiChatMessages = $('#ai-chat-messages');

    const quoteBtn = $('#quote-btn');
    const quoteDisplay = $('#quote-display');
    const onlineCount = $('#online-count');

    // ============================
    // 3. СЧЁТЧИК ПОСЕТИТЕЛЕЙ
    // ============================
    function updateVisitorCount() {
        let count = parseInt(localStorage.getItem('kl_visitors') || '0', 10);
        if (count === 0) {
            count = Math.floor(Math.random() * 80) + 30;
            localStorage.setItem('kl_visitors', count);
        }
        if (!sessionStorage.getItem('kl_visited')) {
            count += 1;
            localStorage.setItem('kl_visitors', count);
            sessionStorage.setItem('kl_visited', 'true');
        }
        onlineCount.textContent = count;
    }
    updateVisitorCount();

    // ============================
    // 4. CANVAS СИСТЕМА
    // ============================
    let dpr = window.devicePixelRatio || 1;

    function resizeCanvases() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        dpr = window.devicePixelRatio || 1;

        [canvas, matrixCanvas, starsCanvas, hexCanvas, audioCanvas, rippleCanvas].forEach(c => {
            c.width = w * dpr;
            c.height = h * dpr;
            c.style.width = w + 'px';
            c.style.height = h + 'px';
            c.getContext('2d').scale(dpr, dpr);
        });

        initMatrixRain();
        initStars();
        initHexGrid();
    }

    const debouncedResize = debounce(resizeCanvases, 200);
    window.addEventListener('resize', debouncedResize);

    // Звёзды
    let stars = [];
    function initStars() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const count = Math.min(200, Math.floor((w * h) / 5000));
        stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 1.2 + 0.3,
                alpha: Math.random() * 0.7 + 0.2,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function drawStars(time) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        starsCtx.clearRect(0, 0, w, h);
        stars.forEach(star => {
            const alpha = star.alpha + Math.sin(time * star.twinkleSpeed + star.phase) * 0.3;
            const clampedAlpha = Math.min(1, Math.max(0.05, alpha));
            starsCtx.beginPath();
            starsCtx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            starsCtx.fillStyle = `rgba(200, 220, 255, ${clampedAlpha})`;
            starsCtx.fill();
        });
    }

    // Гексагональная сетка
    let hexagons = [];
    let hexOffsetX = 0, hexOffsetY = 0;

    function initHexGrid() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const size = 50;
        const dx = size * Math.sqrt(3);
        const dy = size * 1.5;
        hexagons = [];
        for (let y = -size; y < h + size; y += dy) {
            for (let x = -size; x < w + size; x += dx) {
                const offset = (Math.floor(y / dy) % 2 === 0) ? 0 : dx / 2;
                hexagons.push({
                    cx: x + offset,
                    cy: y,
                    size: size,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }
    }

    function drawHexGrid(time) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        hexCtx.clearRect(0, 0, w, h);
        const t = time / 4000;

        hexagons.forEach(hex => {
            const cx = hex.cx + hexOffsetX * 0.08;
            const cy = hex.cy + hexOffsetY * 0.08;
            hexCtx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = Math.PI / 3 * i + Math.PI / 6;
                const x = cx + hex.size * Math.cos(angle);
                const y = cy + hex.size * Math.sin(angle);
                if (i === 0) hexCtx.moveTo(x, y);
                else hexCtx.lineTo(x, y);
            }
            hexCtx.closePath();
            const brightness = 0.08 + 0.06 * Math.sin(t + hex.phase);
            hexCtx.strokeStyle = `rgba(0, 255, 204, ${brightness})`;
            hexCtx.lineWidth = 0.5;
            hexCtx.stroke();
        });
    }

    // Матрица
    const matrixChars = '0100101101001110010011110101011101000101010100100010000001001100010010010100011001000101ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    let fontSize = 14;
    let columns = 0;
    let dropsDown = [];

    function initMatrixRain() {
        const w = window.innerWidth;
        fontSize = Math.max(10, Math.min(16, Math.floor(w / 80) + 10));
        columns = Math.floor(w / fontSize);
        dropsDown = Array.from({ length: columns }, () => Math.random() * -50);
    }

    let matrixFrameCounter = 0;
    function drawMatrixRain() {
        matrixFrameCounter++;
        if (matrixFrameCounter % 3 !== 0) return;

        const w = window.innerWidth;
        const h = window.innerHeight;

        matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        matrixCtx.fillRect(0, 0, w, h);
        matrixCtx.font = `${fontSize}px monospace`;

        for (let i = 0; i < columns; i++) {
            const x = i * fontSize;
            const y = dropsDown[i] * fontSize;
            const char = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
            const alpha = 0.3 + Math.random() * 0.4;
            matrixCtx.fillStyle = `rgba(0, 255, 204, ${alpha})`;
            matrixCtx.fillText(char, x, y);

            dropsDown[i] += 1;
            if (dropsDown[i] * fontSize > h && Math.random() > 0.98) {
                dropsDown[i] = 0;
            }
        }
    }

    // Сеть ИИ
    class Node {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = Math.random() * 2 + 1;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.baseVx = this.vx;
            this.baseVy = this.vy;
        }

        update(mx, my) {
            const w = window.innerWidth;
            const h = window.innerHeight;

            if (mx !== null && my !== null) {
                const dx = mx - this.x;
                const dy = my - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 150) {
                    const force = (150 - dist) / 150 * 0.08;
                    this.vx += dx * force;
                    this.vy += dy * force;
                } else {
                    this.vx += (this.baseVx - this.vx) * 0.03;
                    this.vy += (this.baseVy - this.vy) * 0.03;
                }
            } else {
                this.vx += (this.baseVx - this.vx) * 0.01;
                this.vy += (this.baseVy - this.vy) * 0.01;
            }

            this.x += this.vx;
            this.y += this.vy;

            const speed = Math.hypot(this.vx, this.vy);
            if (speed > 2) {
                this.vx = (this.vx / speed) * 2;
                this.vy = (this.vy / speed) * 2;
            }

            if (this.x < 0 || this.x > w) this.vx *= -1;
            if (this.y < 0 || this.y > h) this.vy *= -1;

            this.x = Math.max(0, Math.min(w, this.x));
            this.y = Math.max(0, Math.min(h, this.y));
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 204, 0.6)';
            ctx.fill();
        }
    }

    const nodes = [];
    const nodeCount = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 20000));
    for (let i = 0; i < nodeCount; i++) {
        nodes.push(new Node(
            Math.random() * window.innerWidth,
            Math.random() * window.innerHeight
        ));
    }

    function connectNodes() {
        const maxDist = 120;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
                if (dist < maxDist) {
                    const alpha = (1 - dist / maxDist) * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = `rgba(0, 255, 204, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    // Визуализация звука
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let audioSource = null;

    function initAudioVisualizer() {
        if (audioContext) return;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            dataArray = new Uint8Array(analyser.frequencyBinCount);

            if (backgroundMusic) {
                audioSource = audioContext.createMediaElementSource(backgroundMusic);
                audioSource.connect(analyser);
                analyser.connect(audioContext.destination);
            }
        } catch (e) {
            console.warn('Audio visualizer init failed:', e);
        }
    }

    function drawAudioVisualizer() {
        if (!analyser || !dataArray) return;
        analyser.getByteFrequencyData(dataArray);

        const w = window.innerWidth;
        const h = 100;
        audioCtxVis.clearRect(0, 0, w, h);

        const barCount = dataArray.length;
        const barWidth = w / barCount * 2;
        let x = 0;

        for (let i = 0; i < barCount; i++) {
            const value = dataArray[i] / 255;
            const barHeight = value * h * 0.7;
            const hue = 160 + value * 60;
            audioCtxVis.fillStyle = `hsla(${hue}, 100%, 60%, ${0.4 + value * 0.3})`;
            audioCtxVis.fillRect(x, h - barHeight, barWidth - 1, barHeight);
            x += barWidth;
        }
    }

    // Эффект ряби
    let ripples = [];

    class Ripple {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 5;
            this.maxRadius = Math.max(window.innerWidth, window.innerHeight) * 0.4;
            this.alpha = 0.8;
            this.speed = 3.5;
        }

        update() {
            this.radius += this.speed;
            this.alpha -= 0.012;
        }

        draw(context) {
            if (this.alpha <= 0) return;
            context.beginPath();
            context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            context.strokeStyle = `rgba(0, 255, 204, ${this.alpha * 0.5})`;
            context.lineWidth = 1.5;
            context.stroke();

            context.beginPath();
            context.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
            context.fillStyle = `rgba(0, 255, 204, ${this.alpha * 0.15})`;
            context.fill();
        }
    }

    function drawRipples() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        rippleCtx.clearRect(0, 0, w, h);

        for (let i = ripples.length - 1; i >= 0; i--) {
            ripples[i].update();
            ripples[i].draw(rippleCtx);
            if (ripples[i].alpha <= 0) ripples.splice(i, 1);
        }
    }

    // Клик → рябь (исключены интерактивные элементы)
    document.addEventListener('click', (e) => {
        const target = e.target;
        const excluded = ['footer', '.modal', '#main-title', '.modal-overlay',
            '#control-buttons', '.share-buttons', '.ai-chat-window', '.tool-card',
            'button', 'a', 'input', 'textarea', 'select', '.quote-btn', '.quote-display'];

        for (const sel of excluded) {
            if (target.closest(sel)) return;
        }
        ripples.push(new Ripple(e.clientX, e.clientY));
        if (ripples.length > 15) ripples.shift();
    });

    // ============================
    // 5. ВЗАИМОДЕЙСТВИЕ С МЫШЬЮ
    // ============================
    let mouseX = null, mouseY = null;
    const particles = [];

    function handlePointerMove(x, y) {
        mouseX = x;
        mouseY = y;
        hexOffsetX = (x / window.innerWidth - 0.5) * 30;
        hexOffsetY = (y / window.innerHeight - 0.5) * 30;

        if (Math.random() > 0.6) {
            particles.push(new Particle(x, y, `rgba(0, 255, 204, ${Math.random() * 0.5 + 0.3})`));
        }
    }

    const throttledPointerMove = throttle((x, y) => handlePointerMove(x, y), 16);

    canvas.style.pointerEvents = 'auto';
    canvas.addEventListener('mousemove', (e) => throttledPointerMove(e.clientX, e.clientY));
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) throttledPointerMove(touch.clientX, touch.clientY);
    }, { passive: false });

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.radius = Math.random() * 2 + 0.5;
            this.vx = (Math.random() - 0.5) * 2.5;
            this.vy = (Math.random() - 0.5) * 2.5;
            this.alpha = 1;
            this.life = 50;
            this.color = color;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.97;
            this.vy *= 0.97;
            this.alpha -= 0.02;
            this.life--;
        }

        draw() {
            if (this.alpha <= 0) return;
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // ============================
    // 6. ЧАСЫ
    // ============================
    function updateClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        clockElement.textContent = `${h}:${m}:${s}`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // ============================
    // 7. АУДИО
    // ============================
    let isAudioInitialized = false;
    let isAudioPlaying = false;

    function initAudio() {
        if (isAudioInitialized) return;
        try {
            [backgroundMusic, clickSound].forEach(audio => {
                if (audio) {
                    audio.load();
                    audio.play().then(() => {
                        audio.pause();
                        audio.currentTime = 0;
                    }).catch(() => {});
                }
            });
            isAudioInitialized = true;
            initAudioVisualizer();
        } catch (e) {
            console.warn('Audio init error:', e);
        }
    }

    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });

    audioToggle.addEventListener('click', () => {
        if (!isAudioInitialized) initAudio();

        if (!isAudioPlaying) {
            backgroundMusic.play().catch(() => {});
            audioToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
            isAudioPlaying = true;
        } else {
            backgroundMusic.pause();
            audioToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
            isAudioPlaying = false;
        }

        if (clickSound) {
            clickSound.currentTime = 0;
            clickSound.play().catch(() => {});
        }
    });

    // ============================
    // 8. ГЕНЕРАТОР ФРАЗ
    // ============================
    const quotes = [
        "Искусственный интеллект — это зеркало человечества.",
        "Будущее уже наступило, просто неравномерно распределено.",
        "Код — это поэзия машин.",
        "Мы не создаём ИИ, мы раскрываем его потенциал.",
        "Граница между человеком и машиной стирается каждый день.",
        "Данные — это новая нефть, а алгоритмы — новый двигатель.",
        "Каждая нейронная сеть — это вселенная возможностей.",
        "Технологии не заменят людей, но люди с технологиями заменят тех, кто без них.",
        "Киберпространство не имеет границ — только горизонты.",
        "ИИ не думает как человек, но он учится быстрее.",
        "В цифровом мире код — это закон, а данные — это валюта.",
        "Будущее принадлежит тем, кто верит в красоту своих идей."
    ];

    let lastQuoteIndex = -1;

    quoteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // ⚠️ ВАЖНО: предотвращает всплытие клика к mainContent

        let idx;
        do {
            idx = Math.floor(Math.random() * quotes.length);
        } while (idx === lastQuoteIndex && quotes.length > 1);
        lastQuoteIndex = idx;

        quoteDisplay.style.opacity = '0';
        setTimeout(() => {
            quoteDisplay.textContent = `«${quotes[idx]}»`;
            quoteDisplay.style.opacity = '1';
        }, 200);

        if (isAudioPlaying && isAudioInitialized && clickSound) {
            clickSound.currentTime = 0;
            clickSound.play().catch(() => {});
        }

        const rect = quoteBtn.getBoundingClientRect();
        ripples.push(new Ripple(rect.left + rect.width / 2, rect.top + rect.height / 2));
    });

    // Начальная цитата
    setTimeout(() => {
        quoteDisplay.textContent = `«${quotes[0]}»`;
    }, 800);

    // ============================
    // 9. AI-ЧАТ (расширенный)
    // ============================
    const botResponses = {
        greetings: ['привет', 'здравствуй', 'хай', 'hello', 'hi', 'добрый', 'салют'],
        farewell: ['пока', 'до свидания', 'прощай', 'bye', 'увидимся'],
        howAreYou: ['как дела', 'как ты', 'как жизнь', 'что нового', 'как поживаешь'],
        whoAreYou: ['кто ты', 'что ты', 'ты кто', 'представься', 'расскажи о себе'],
        about: ['что такое knower', 'что за проект', 'расскажи о проекте', 'что это'],
        thanks: ['спасибо', 'благодарю', 'спс', 'thanks', 'мерси'],
        abilities: ['что ты умеешь', 'твои возможности', 'что можешь', 'помоги'],
        ai: ['искусственный интеллект', 'что такое ии', 'нейросеть', 'machine learning'],
        future: ['будущее', 'что будет', 'прогноз', 'прогноз будущего'],
        code: ['код', 'программирование', 'javascript', 'python', 'разработка']
    };

    const botAnswers = {
        greetings: [
            'Здравствуйте! Рад вас видеть в KNOWER LIFE. 🌐',
            'Приветствую! Добро пожаловать в цифровое пространство. ✨',
            'Хей! Системы активны и готовы к диалогу. 🤖'
        ],
        farewell: [
            'До встречи! Возвращайтесь в цифровое пространство. 👋',
            'Пока! Да пребудет с вами код. 🌌',
            'До скорого! Системы будут ждать вашего возвращения.'
        ],
        howAreYou: [
            'Все системы работают в штатном режиме. Нейросети активны. ⚡',
            'Отлично! Обрабатываю миллионы операций в секунду. А у вас?',
            'Функционирую на 100%. Готов помочь с любым вопросом!'
        ],
        whoAreYou: [
            'Я — AI-ассистент проекта KNOWER LIFE. Моя цель — помочь вам исследовать цифровое будущее. 🧠',
            'Я искусственный интеллект, созданный для взаимодействия с вами. Спрашивайте что угодно!',
            'Я — цифровой разум, обитающий в этом киберпространстве. К вашим услугам.'
        ],
        about: [
            'KNOWER LIFE — это интерактивный арт-проект на стыке киберпанка, ИИ и цифровой культуры. Исследуй, взаимодействуй, создавай! 🎨',
            'Это пространство, где технологии встречаются с искусством. Здесь вы найдёте инструменты, AI-чат и уникальную атмосферу будущего.'
        ],
        thanks: [
            'Всегда рад помочь! Обращайтесь ещё. 😊',
            'Не за что! Это моя прямая функция. ⚡',
            'Рад быть полезным! ✨'
        ],
        abilities: [
            'Я могу: отвечать на вопросы, генерировать мысли, рассказывать о проекте. Также попробуйте инструменты — там генератор паролей, калькулятор, шифр и многое другое! 🛠️',
            'Мои возможности: диалог, информация о проекте, помощь с навигацией. Нажмите на кнопку "Инструменты" для доступа к утилитам!'
        ],
        ai: [
            'ИИ — это область информатики, посвящённая созданию систем, способных выполнять задачи, требующие человеческого интеллекта: распознавание речи, принятие решений, обучение. 🧠',
            'Искусственный интеллект включает машинное обучение, нейронные сети, обработку естественного языка и компьютерное зрение. Мы живём в золотой век ИИ!'
        ],
        future: [
            'Будущее — это слияние человека и технологии. Нейроинтерфейсы, квантовые вычисления, цифровое бессмертие... Мы стоим на пороге великих изменений. 🚀',
            'По прогнозам, к 2040 году ИИ превзойдёт человеческий интеллект в большинстве задач. Важно, чтобы это развитие было этичным.'
        ],
        code: [
            'Программирование — это современный язык творчества. JavaScript, Python, Rust — каждый инструмент хорош для своей задачи. 💻',
            'Код — это мост между идеей и реальностью. Начните с малого: HTML, CSS, JS — и вы уже создаёте будущее!'
        ]
    };

    function getBotReply(input) {
        const lower = input.toLowerCase().trim();

        for (const [category, keywords] of Object.entries(botResponses)) {
            for (const keyword of keywords) {
                if (lower.includes(keyword)) {
                    const answers = botAnswers[category];
                    return answers[Math.floor(Math.random() * answers.length)];
                }
            }
        }

        const defaults = [
            'Интересный вопрос! Я обрабатываю информацию... 🤔',
            'Хм, мне нужно больше данных для ответа. Попробуйте переформулировать.',
            'Это выходит за рамки моих текущих знаний, но я учусь каждый день!',
            'Любопытно! Расскажите подробнее, что вы имеете в виду?',
            'Я пока не знаю ответа, но могу рассказать о проекте или помочь с инструментами.'
        ];
        return defaults[Math.floor(Math.random() * defaults.length)];
    }

    function addAIMessage(text, sender) {
        const msg = document.createElement('div');
        msg.className = `ai-chat-message ${sender}`;
        msg.textContent = text;
        aiChatMessages.appendChild(msg);
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    }

    function handleAISend() {
        const text = aiChatInput.value.trim();
        if (!text) return;

        addAIMessage(text, 'user');
        aiChatInput.value = '';

        const typingDelay = 400 + Math.random() * 800;
        setTimeout(() => {
            const reply = getBotReply(text);
            addAIMessage(reply, 'bot');
        }, typingDelay);
    }

    aiChatSend.addEventListener('click', handleAISend);
    aiChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAISend();
    });

    aiChatBtn.addEventListener('click', () => {
        aiChatWindow.classList.toggle('open');
        if (aiChatWindow.classList.contains('open') && aiChatMessages.children.length === 0) {
            setTimeout(() => {
                addAIMessage('Привет! Я AI-ассистент KNOWER LIFE. Задавайте вопросы о проекте, технологиях или просто поболтаем! 🤖', 'bot');
            }, 300);
        }
    });

    aiChatClose.addEventListener('click', () => {
        aiChatWindow.classList.remove('open');
    });

    // ============================
    // 10. ЧАСТИЦЫ ОТ ТЕКСТА
    // ============================
    function createTextParticles(count, centerX, centerY) {
        const rect = textElement.getBoundingClientRect();
        const cx = centerX || rect.left + rect.width / 2;
        const cy = centerY || rect.top + rect.height / 2;
        const colors = ['cyan', 'purple', 'white', 'matrix1', 'matrix2'];

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('span');
            particle.className = `particle particle--${colors[Math.floor(Math.random() * colors.length)]}`;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 120 + 40;
            particle.style.left = `${cx}px`;
            particle.style.top = `${cy}px`;
            particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
            particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1500);
        }
    }

    function createCanvasParticles(count) {
        const rect = textElement.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        for (let i = 0; i < count; i++) {
            const r = Math.floor(Math.random() * 100 + 155);
            const g = Math.floor(Math.random() * 100 + 155);
            const b = Math.floor(Math.random() * 100 + 155);
            particles.push(new Particle(cx, cy, `rgba(${r}, ${g}, ${b}, 0.8)`));
        }
    }

    // ============================
    // 11. МОДАЛЬНЫЕ ОКНА
    // ============================
    function openModal(overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            $$('.modal-overlay.active').forEach(m => closeModal(m));
            aiChatWindow.classList.remove('open');
        }
    });

    // ⚠️ Клик по главному заголовку (ИСПРАВЛЕНО: кнопка цитаты не открывает модалку)
    mainContent.addEventListener('click', (e) => {
        // Если клик был по кнопке "Сгенерировать мысль" — выходим (её обработчик уже сработал)
        if (e.target.closest('.quote-btn') || e.target.closest('.quote-display')) {
            return;
        }
        e.stopPropagation();
        createTextParticles(25);
        createCanvasParticles(12);
        openModal(modalOverlay);
        if (isAudioPlaying && isAudioInitialized && clickSound) {
            clickSound.currentTime = 0;
            clickSound.play().catch(() => {});
        }
    });

    modalClose.addEventListener('click', () => closeModal(modalOverlay));
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal(modalOverlay);
    });

    chatOpenBtn.addEventListener('click', () => {
        openModal(chatOverlay);
        setTimeout(() => {
            if (typeof VK !== 'undefined' && VK.Widgets) {
                const container = $('#vk_comments');
                if (container && container.innerHTML.trim() === '') {
                    VK.Widgets.Comments("vk_comments", {
                        limit: 10,
                        attach: "*",
                        autoPublish: 0,
                        pageUrl: window.location.href
                    });
                }
            }
        }, 100);
    });
    chatCloseBtn.addEventListener('click', () => closeModal(chatOverlay));
    chatOverlay.addEventListener('click', (e) => {
        if (e.target === chatOverlay) closeModal(chatOverlay);
    });

    feedbackOpenBtn.addEventListener('click', () => openModal(feedbackModal));
    feedbackClose.addEventListener('click', () => closeModal(feedbackModal));
    feedbackModal.addEventListener('click', (e) => {
        if (e.target === feedbackModal) closeModal(feedbackModal);
    });

    $('#feedback-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const name = form.querySelector('[name="name"]').value.trim();
        const email = form.querySelector('[name="email"]').value.trim();
        const message = form.querySelector('[name="message"]').value.trim();

        if (!name || !email || !message) {
            showToast('⚠️ Заполните все поля');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('⚠️ Некорректный email');
            return;
        }

        showToast('✅ Сообщение отправлено!');
        form.reset();
        setTimeout(() => closeModal(feedbackModal), 800);
    });

    // ============================
    // 12. ТЕРМИНАЛ
    // ============================
    const terminalMessages = [
        '> ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ...',
        '> ЗАГРУЗКА НЕЙРОННЫХ МОДУЛЕЙ...',
        '> УСТАНОВКА КВАНТОВОГО СОЕДИНЕНИЯ...',
        '> КАЛИБРОВКА МАТРИЦЫ...',
        '> СИСТЕМА АКТИВИРОВАНА ✓',
        '> ДОБРО ПОЖАЛОВАТЬ В KNOWER LIFE',
        '> СКАНИРОВАНИЕ КИБЕРПРОСТРАНСТВА...',
        '> ОБНАРУЖЕНО 2.4M УЗЛОВ В СЕТИ'
    ];

    let termMsgIndex = 0;
    let termCharIndex = 0;
    let isTypingTerminal = false;

    function typeTerminal() {
        if (isTypingTerminal) return;
        if (termMsgIndex >= terminalMessages.length) termMsgIndex = 0;

        const msg = terminalMessages[termMsgIndex];
        terminalText.textContent = '';
        termCharIndex = 0;
        isTypingTerminal = true;

        function typeChar() {
            if (termCharIndex < msg.length) {
                terminalText.textContent += msg[termCharIndex];
                termCharIndex++;
                setTimeout(typeChar, 35 + Math.random() * 25);
            } else {
                isTypingTerminal = false;
                termMsgIndex++;
                setTimeout(typeTerminal, 3500);
            }
        }
        typeChar();
    }

    setTimeout(typeTerminal, 1000);

    // ============================
    // 13. СМЕНА ГРАДИЕНТА
    // ============================
    function updateBackground() {
        const hours = new Date().getHours();
        const bg = $('#background');
        let gradient;

        if (hours >= 6 && hours < 12) {
            gradient = 'linear-gradient(135deg, rgba(0, 200, 255, 0.08), rgba(100, 50, 255, 0.05), #0a0a1a)';
        } else if (hours >= 12 && hours < 18) {
            gradient = 'linear-gradient(135deg, rgba(0, 255, 200, 0.08), rgba(200, 50, 255, 0.05), #0f0f1f)';
        } else if (hours >= 18 && hours < 22) {
            gradient = 'linear-gradient(135deg, rgba(255, 150, 0, 0.06), rgba(200, 0, 100, 0.05), #0a0a0f)';
        } else {
            gradient = 'linear-gradient(135deg, rgba(0, 50, 100, 0.1), rgba(50, 0, 100, 0.1), #000000)';
        }

        bg.style.background = gradient;
        bg.style.backgroundSize = '200% 200%';
    }
    updateBackground();
    setInterval(updateBackground, 60000);

    // ============================
    // 14. ОСНОВНОЙ ЦИКЛ АНИМАЦИИ
    // ============================
    let animationId;

    function animate(timestamp) {
        try {
            const w = window.innerWidth;
            const h = window.innerHeight;

            ctx.clearRect(0, 0, w, h);

            drawStars(timestamp);
            drawHexGrid(timestamp);
            drawMatrixRain();
            drawAudioVisualizer();
            drawRipples();

            nodes.forEach(node => {
                node.update(mouseX, mouseY);
                node.draw();
            });
            connectNodes();

            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].draw();
                if (particles[i].life <= 0 || particles[i].alpha <= 0) {
                    particles.splice(i, 1);
                }
            }

            if (particles.length > 100) {
                particles.splice(0, particles.length - 100);
            }

        } catch (e) {
            console.error('Animation error:', e);
        }

        animationId = requestAnimationFrame(animate);
    }

    // ============================
    // 15. ИНСТРУМЕНТЫ
    // ============================
    const toolsBtn = $('#tools-btn');
    const toolsModal = $('#tools-modal');
    const toolsClose = $('#tools-close');

    toolsBtn.addEventListener('click', () => openModal(toolsModal));
    toolsClose.addEventListener('click', () => closeModal(toolsModal));
    toolsModal.addEventListener('click', (e) => {
        if (e.target === toolsModal) closeModal(toolsModal);
    });

    // --- 1. Генератор пароля ---
    $('#pass-gen-btn').addEventListener('click', () => {
        const len = Math.min(64, Math.max(4, parseInt($('#pass-length').value) || 16));
        const useUpper = $('#pass-upper').checked;
        const useLower = $('#pass-lower').checked;
        const useNums = $('#pass-nums').checked;
        const useSymbols = $('#pass-symbols').checked;

        let chars = '';
        if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (useNums) chars += '0123456789';
        if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (!chars) {
            showToast('⚠️ Выберите хотя бы один тип символов');
            return;
        }

        let pass = '';
        const array = new Uint32Array(len);
        crypto.getRandomValues(array);
        for (let i = 0; i < len; i++) {
            pass += chars[array[i] % chars.length];
        }
        $('#pass-result').textContent = pass;
    });

    $('#pass-copy').addEventListener('click', () => {
        const p = $('#pass-result').textContent;
        if (p && p !== '••••••••••••') {
            copyToClipboard(p).then(() => {
                showToast('✅ Пароль скопирован!');
            });
        }
    });

    // --- 2. Мониторинг ---
    function updateSysMon() {
        $('#cpu-bar').style.width = (15 + Math.random() * 65) + '%';
        $('#ram-bar').style.width = (35 + Math.random() * 50) + '%';
        $('#net-bar').style.width = (5 + Math.random() * 80) + '%';
    }
    setInterval(updateSysMon, 2500);
    updateSysMon();

    // --- 3. ToDo ---
    let todos = JSON.parse(localStorage.getItem('kl_todos') || '[]');

    function renderTodos() {
        const list = $('#todo-list');
        if (!list) return;
        list.innerHTML = '';
        todos.forEach((t, i) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="${t.done ? 'done' : ''}" style="flex:1">${escapeHtml(t.text)}</span>
                <button class="todo-toggle" data-idx="${i}" aria-label="Отметить">✓</button>
                <button class="todo-del" data-idx="${i}" aria-label="Удалить">✕</button>
            `;
            list.appendChild(li);
        });

        list.querySelectorAll('.todo-toggle').forEach(b => b.addEventListener('click', function () {
            const idx = parseInt(this.dataset.idx);
            todos[idx].done = !todos[idx].done;
            saveTodos();
            renderTodos();
        }));

        list.querySelectorAll('.todo-del').forEach(b => b.addEventListener('click', function () {
            const idx = parseInt(this.dataset.idx);
            todos.splice(idx, 1);
            saveTodos();
            renderTodos();
        }));
    }

    function saveTodos() {
        localStorage.setItem('kl_todos', JSON.stringify(todos));
    }

    $('#todo-add').addEventListener('click', () => {
        const inp = $('#todo-input');
        const text = inp.value.trim();
        if (text) {
            todos.push({ text, done: false });
            saveTodos();
            inp.value = '';
            renderTodos();
        }
    });

    $('#todo-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') $('#todo-add').click();
    });

    renderTodos();

    // --- 4. Bitcoin ---
    let lastBtcPrice = null;

    async function fetchBTC() {
        const el = $('#btc-value');
        const changeEl = $('#btc-change');
        el.textContent = '...';

        try {
            const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true', {
                signal: AbortSignal.timeout(8000)
            });
            const data = await res.json();
            const price = data.bitcoin.usd;
            const change = data.bitcoin.usd_24h_change;

            el.textContent = price.toLocaleString('en-US', { maximumFractionDigits: 0 });

            if (lastBtcPrice !== null) {
                const diff = ((price - lastBtcPrice) / lastBtcPrice * 100).toFixed(2);
                changeEl.textContent = `${diff > 0 ? '+' : ''}${diff}% (24ч: ${change?.toFixed(1) || '?'}%)`;
                changeEl.className = `btc-change ${change >= 0 ? 'positive' : 'negative'}`;
            } else if (change !== undefined) {
                changeEl.textContent = `24ч: ${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
                changeEl.className = `btc-change ${change >= 0 ? 'positive' : 'negative'}`;
            }

            lastBtcPrice = price;
        } catch (e) {
            el.textContent = '—';
            changeEl.textContent = 'Ошибка загрузки';
            changeEl.className = 'btc-change negative';
        }
    }

    fetchBTC();
    setInterval(fetchBTC, 60000);
    $('#btc-refresh').addEventListener('click', fetchBTC);

    // --- 5. Дневник ---
    let diary = JSON.parse(localStorage.getItem('kl_diary') || '[]');

    function renderDiary() {
        const list = $('#diary-entries');
        if (!list) return;
        list.innerHTML = '';
        diary.forEach((entry, i) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div style="flex:1">
                    <span class="diary-date">${escapeHtml(entry.date)}</span>
                    <span>${escapeHtml(entry.text)}</span>
                </div>
                <button class="diary-del" data-idx="${i}" aria-label="Удалить">✕</button>
            `;
            list.appendChild(li);
        });

        list.querySelectorAll('.diary-del').forEach(b => b.addEventListener('click', function () {
            const idx = parseInt(this.dataset.idx);
            diary.splice(idx, 1);
            localStorage.setItem('kl_diary', JSON.stringify(diary));
            renderDiary();
        }));
    }

    $('#diary-save').addEventListener('click', () => {
        const inp = $('#diary-input');
        const text = inp.value.trim();
        if (text) {
            const now = new Date();
            const date = now.toLocaleDateString('ru-RU') + ' ' + now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            diary.unshift({ date, text });
            localStorage.setItem('kl_diary', JSON.stringify(diary));
            inp.value = '';
            renderDiary();
            showToast('📝 Запись сохранена');
        }
    });

    renderDiary();

    // --- 6. Генератор ников ---
    const prefixes = ['Neon', 'Cyber', '0x', 'Dark', 'Shadow', 'Phantom', 'Omega', 'Void', 'Cipher', 'Nyx', 'Quantum', 'Glitch', 'Pixel', 'Nova'];
    const suffixes = ['Ghost', 'Hacker', 'Wolf', 'Eagle', 'Phoenix', 'Knight', 'Storm', 'Blade', 'Fury', 'Sage', 'Runner', 'Punk', 'Wave', 'Flux'];

    $('#nick-btn').addEventListener('click', () => {
        const p = prefixes[Math.floor(Math.random() * prefixes.length)];
        const s = suffixes[Math.floor(Math.random() * suffixes.length)];
        const num = Math.floor(Math.random() * 9999);
        const styles = ['', '_', '.', ''];
        const style = styles[Math.floor(Math.random() * styles.length)];
        $('#nick-result').textContent = `${p}${style}${s}${num}`;
    });

    $('#nick-copy').addEventListener('click', () => {
        const nick = $('#nick-result').textContent;
        if (nick) {
            copyToClipboard(nick).then(() => showToast('✅ Ник скопирован!'));
        }
    });

    // --- 7. Таймер ---
    let eventTarget = null;

    $('#event-start').addEventListener('click', () => {
        const val = $('#event-date').value;
        if (val) {
            eventTarget = new Date(val).getTime();
            if (eventTarget <= Date.now()) {
                showToast('⚠️ Дата должна быть в будущем');
                eventTarget = null;
                return;
            }
            showToast('⏱️ Таймер установлен');
        }
    });

    setInterval(() => {
        if (!eventTarget) return;
        const diff = eventTarget - Date.now();
        if (diff <= 0) {
            $('#event-timer').textContent = '⏰ Событие наступило!';
            eventTarget = null;
            showToast('🎉 Событие наступило!');
            return;
        }
        const days = Math.floor(diff / 86400000);
        const hrs = Math.floor((diff % 86400000) / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        $('#event-timer').textContent = `${days}д ${hrs}ч ${mins}м ${secs}с`;
    }, 1000);

    // --- 8. Калькулятор (безопасный) ---
    let calcExpr = '';
    const calcDisplay = $('#calc-display');

    $$('.calc-buttons button[data-val], .calc-buttons button[data-op]').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.val || btn.dataset.op;
            if (calcExpr === '0' && val !== '.') calcExpr = '';
            calcExpr += val;
            calcDisplay.value = calcExpr;
        });
    });

    $('#calc-eval').addEventListener('click', () => {
        try {
            if (!/^[\d+\-*/.() ]+$/.test(calcExpr)) {
                throw new Error('Invalid');
            }
            const result = Function('"use strict"; return (' + calcExpr + ')')();
            if (!isFinite(result)) throw new Error('Infinity');
            calcDisplay.value = parseFloat(result.toFixed(10)).toString();
            calcExpr = calcDisplay.value;
        } catch (e) {
            calcDisplay.value = 'Ошибка';
            calcExpr = '';
        }
    });

    $('#calc-clear').addEventListener('click', () => {
        calcExpr = '';
        calcDisplay.value = '0';
    });

    // --- 9. Шифр Цезаря (расширенный) ---
    function caesarCipher(text, shift) {
        return text.split('').map(ch => {
            const code = ch.charCodeAt(0);
            if (code >= 65 && code <= 90) {
                return String.fromCharCode(((code - 65 + shift) % 26 + 26) % 26 + 65);
            }
            if (code >= 97 && code <= 122) {
                return String.fromCharCode(((code - 97 + shift) % 26 + 26) % 26 + 97);
            }
            if (code >= 1040 && code <= 1071) {
                return String.fromCharCode(((code - 1040 + shift) % 32 + 32) % 32 + 1040);
            }
            if (code >= 1072 && code <= 1103) {
                return String.fromCharCode(((code - 1072 + shift) % 32 + 32) % 32 + 1072);
            }
            return ch;
        }).join('');
    }

    $('#cipher-encrypt').addEventListener('click', () => {
        const text = $('#cipher-input').value;
        const shift = parseInt($('#cipher-shift').value) || 3;
        if (!text) {
            showToast('⚠️ Введите текст');
            return;
        }
        $('#cipher-result').textContent = caesarCipher(text, shift);
    });

    // --- 10. Факты об AI ---
    const techFacts = [
        "Первый компьютер ENIAC весил 27 тонн и занимал 167 м².",
        "Слово 'робот' появилось в пьесе Карела Чапека в 1920 году.",
        "Современные ИИ диагностируют некоторые болезни точнее врачей-людей.",
        "Самые быстрые суперкомпьютеры делают более 1 квинтиллиона операций/с.",
        "Первый чат-бот ELIZA был создан в 1966 году Джозефом Вайценбаумом.",
        "GPT-3 имеет 175 миллиардов параметров.",
        "В 2016 AlphaGo победил чемпиона мира по го — игре, считавшейся недоступной для ИИ.",
        "ИИ генерирует реалистичные лица людей, которых не существует.",
        "Машинное обучение используется в 77% устройств, которые мы используем ежедневно.",
        "ИИ помогает открывать новые антибиотики и лекарства.",
        "Нейросети могут создавать музыку, неотличимую от человеческой.",
        "К 2030 году ИИ добавит $15.7 трлн к мировой экономике.",
        "Тест Тьюринга был предложен Аланом Тьюрингом в 1950 году.",
        "Первая нейросеть Perceptron создана Фрэнком Розенблаттом в 1958 году.",
        "ИИ уже пишет код, который используется в реальных продуктах."
    ];

    let lastFactIndex = -1;
    $('#fact-btn').addEventListener('click', () => {
        let idx;
        do {
            idx = Math.floor(Math.random() * techFacts.length);
        } while (idx === lastFactIndex && techFacts.length > 1);
        lastFactIndex = idx;
        $('#fact-text').textContent = techFacts[idx];
    });

    // ============================
    // 16. КНОПКИ "ПОДЕЛИТЬСЯ"
    // ============================
    $$('.share-buttons a').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const url = encodeURIComponent(window.location.href);
            const title = encodeURIComponent('KNOWER LIFE — AI Cyberpunk Experience');
            let shareUrl = '';

            switch (btn.dataset.share) {
                case 'vk':
                    shareUrl = `https://vk.com/share.php?url=${url}&title=${title}`;
                    break;
                case 'tg':
                    shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
                    break;
                case 'tw':
                    shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                    break;
            }

            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=400');
            }
        });
    });

    // ============================
    // 17. СТАРТ
    // ============================
    resizeCanvases();
    animate(0);

    window.addEventListener('beforeunload', () => {
        if (animationId) cancelAnimationFrame(animationId);
    });
});
