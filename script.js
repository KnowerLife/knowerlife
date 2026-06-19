document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ============================
    // 1. ПРОГРЕСС-БАР
    // ============================
    const loaderBar = document.getElementById('loader-bar');
    let loadProgress = 0;
    const loadInterval = setInterval(() => {
        loadProgress += Math.random() * 15;
        if (loadProgress >= 100) {
            loadProgress = 100;
            clearInterval(loadInterval);
            setTimeout(() => {
                document.getElementById('loader').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('loader').style.display = 'none';
                }, 500);
            }, 300);
        }
        loaderBar.style.width = loadProgress + '%';
    }, 200);

    // ============================
    // 2. ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ
    // ============================
    const canvas = document.getElementById('ai-network');
    const ctx = canvas.getContext('2d');
    const matrixCanvas = document.getElementById('matrix-rain');
    const matrixCtx = matrixCanvas.getContext('2d');
    const starsCanvas = document.getElementById('stars-canvas');
    const starsCtx = starsCanvas.getContext('2d');
    const hexCanvas = document.getElementById('hex-grid');
    const hexCtx = hexCanvas.getContext('2d');
    const audioCanvas = document.getElementById('audio-visualizer');
    const audioCtxVis = audioCanvas.getContext('2d');
    const rippleCanvas = document.getElementById('ripple-canvas');
    const rippleCtx = rippleCanvas.getContext('2d');

    const textElement = document.getElementById('knower-life');
    const mainTitle = document.getElementById('main-title');
    const audioToggle = document.getElementById('audio-toggle');
    const backgroundMusic = document.getElementById('background-music');
    const clickSound = document.getElementById('click-sound');
    const clockElement = document.getElementById('clock');
    const terminalText = document.getElementById('terminal-text');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');

    const chatOpenBtn = document.getElementById('chat-open-btn');
    const chatCloseBtn = document.getElementById('chat-close-btn');
    const chatOverlay = document.getElementById('chat-modal-overlay');

    const feedbackOpenBtn = document.getElementById('feedback-open-btn');
    const feedbackClose = document.getElementById('feedback-close');
    const feedbackModal = document.getElementById('feedback-modal');

    const aiChatBtn = document.getElementById('ai-chat-btn');
    const aiChatWindow = document.getElementById('ai-chat-window');
    const aiChatClose = document.getElementById('ai-chat-close');
    const aiChatInput = document.getElementById('ai-chat-input');
    const aiChatSend = document.getElementById('ai-chat-send');
    const aiChatMessages = document.getElementById('ai-chat-messages');

    const quoteBtn = document.getElementById('quote-btn');
    const quoteDisplay = document.getElementById('quote-display');
    const onlineCount = document.getElementById('online-count');

    // ============================
    // 3. РЕАЛЬНЫЙ СЧЁТЧИК ПОСЕТИТЕЛЕЙ
    // ============================
    function updateRealVisitorCount() {
        let count = localStorage.getItem('knowerlife_visitors');
        if (!count) {
            count = Math.floor(Math.random() * 100) + 20;
            localStorage.setItem('knowerlife_visitors', count);
        } else {
            count = parseInt(count, 10);
            if (!sessionStorage.getItem('knowerlife_visited')) {
                count += 1;
                localStorage.setItem('knowerlife_visitors', count);
                sessionStorage.setItem('knowerlife_visited', 'true');
            }
        }
        onlineCount.textContent = count;
    }
    updateRealVisitorCount();

    // ============================
    // 4. CANVAS (звёзды, сетка, матрица, ИИ-сеть, визуализация, рябь)
    // ============================
    function resizeCanvases() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        [canvas, matrixCanvas, starsCanvas, hexCanvas, audioCanvas, rippleCanvas].forEach(c => {
            c.width = w;
            c.height = h;
        });
        initMatrixRain();
        initStars();
        initHexGrid();
    }
    window.addEventListener('resize', resizeCanvases);

    // Звёзды
    let stars = [];
    function initStars() {
        const count = Math.floor((starsCanvas.width * starsCanvas.height) / 3000);
        stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * starsCanvas.width,
                y: Math.random() * starsCanvas.height,
                r: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.8 + 0.2,
                speed: Math.random() * 0.01 + 0.005
            });
        }
    }
    function drawStars() {
        starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
        stars.forEach(star => {
            star.alpha += (Math.random() - 0.5) * 0.02;
            star.alpha = Math.min(1, Math.max(0.1, star.alpha));
            starsCtx.beginPath();
            starsCtx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            starsCtx.fillStyle = `rgba(200, 220, 255, ${star.alpha})`;
            starsCtx.fill();
        });
    }

    // Гексагональная сетка
    let hexagons = [];
    let hexOffsetX = 0, hexOffsetY = 0;
    function initHexGrid() {
        const w = hexCanvas.width, h = hexCanvas.height;
        const size = 40;
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
    function drawHexGrid() {
        hexCtx.clearRect(0, 0, hexCanvas.width, hexCanvas.height);
        const time = Date.now() / 3000;
        hexagons.forEach(hex => {
            const cx = hex.cx + hexOffsetX * 0.1;
            const cy = hex.cy + hexOffsetY * 0.1;
            hexCtx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = Math.PI / 3 * i + Math.PI / 6;
                const x = cx + hex.size * Math.cos(angle);
                const y = cy + hex.size * Math.sin(angle);
                if (i === 0) hexCtx.moveTo(x, y);
                else hexCtx.lineTo(x, y);
            }
            hexCtx.closePath();
            const brightness = 0.15 + 0.1 * Math.sin(time + hex.phase);
            hexCtx.strokeStyle = `rgba(0, 255, 204, ${brightness})`;
            hexCtx.lineWidth = 0.8;
            hexCtx.stroke();
        });
    }

    // ============================
    // 5. МАТРИЦА (исправлена: яркая, медленное затухание)
    // ============================
    const chars = '0100101101001110010011110101011101000101010100100010000001001100010010010100011001000101ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    let fontSize = 14, columns = 0, dropsDown = [], speedsDown = [];
    function initMatrixRain() {
        fontSize = Math.min(16, Math.floor(matrixCanvas.width / 70) + 12);
        columns = Math.floor(matrixCanvas.width / fontSize);
        dropsDown = Array(columns).fill(0);
        speedsDown = Array(columns).fill(1);
    }
    let matrixFrameCounter = 0;
    function drawMatrixRain() {
        matrixFrameCounter++;
        if (matrixFrameCounter % 2 !== 0) return;
        // медленное затухание
        matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.02)';
        matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        matrixCtx.font = `${fontSize}px monospace`;

        for (let i = 0; i < columns; i++) {
            const x = i * fontSize;
            const yDown = dropsDown[i] * fontSize;
            const char = chars.charAt(Math.floor(Math.random() * chars.length));
            // яркие символы
            matrixCtx.fillStyle = `rgba(0, 255, 204, ${Math.random() * 0.5 + 0.5})`;
            matrixCtx.fillText(char, x, yDown);
            dropsDown[i] += 1;
            if (dropsDown[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                dropsDown[i] = 0;
            }
        }
    }

    // ============================
    // 6. СЕТЬ ИИ
    // ============================
    class Node {
        constructor(x, y) {
            this.x = x; this.y = y;
            this.radius = Math.random() * 2 + 1;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.baseSpeedX = this.speedX;
            this.baseSpeedY = this.speedY;
        }
        update(mouseX, mouseY) {
            if (mouseX !== null && mouseY !== null) {
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 150) {
                    const force = (150 - dist) / 150 * 0.1;
                    this.speedX += dx * force;
                    this.speedY += dy * force;
                } else {
                    this.speedX += (this.baseSpeedX - this.speedX) * 0.05;
                    this.speedY += (this.baseSpeedY - this.speedY) * 0.05;
                }
            }
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 204, 0.5)';
            ctx.fill();
        }
    }
    const nodes = [];
    for (let i = 0; i < 50; i++) {
        nodes.push(new Node(Math.random() * canvas.width, Math.random() * canvas.height));
    }
    function connectNodes() {
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = `rgba(0, 255, 204, ${1 - dist / 100})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    // ============================
    // 7. ВИЗУАЛИЗАЦИЯ ЗВУКА
    // ============================
    let audioContext = null, analyser = null, dataArray = null, audioSource = null;
    function initAudioVisualizer() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
        }
        if (!audioSource && backgroundMusic) {
            audioSource = audioContext.createMediaElementSource(backgroundMusic);
            audioSource.connect(analyser);
            analyser.connect(audioContext.destination);
        }
    }
    function drawAudioVisualizer() {
        if (!analyser || !dataArray) return;
        analyser.getByteFrequencyData(dataArray);
        const w = audioCanvas.width, h = audioCanvas.height;
        audioCtxVis.clearRect(0, 0, w, h);
        const barWidth = w / dataArray.length * 2.5;
        let x = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const value = dataArray[i] / 255;
            const barHeight = value * h * 0.8;
            const hue = 160 + value * 60;
            audioCtxVis.fillStyle = `hsla(${hue}, 100%, 60%, 0.7)`;
            audioCtxVis.fillRect(x, h - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }

    // ============================
    // 8. ЭФФЕКТ РЯБИ
    // ============================
    let ripples = [];
    class Ripple {
        constructor(x, y) {
            this.x = x; this.y = y;
            this.radius = 5;
            this.maxRadius = Math.max(window.innerWidth, window.innerHeight) * 0.5;
            this.alpha = 1;
            this.speed = 4;
        }
        update() {
            this.radius += this.speed;
            this.alpha -= 0.015;
        }
        draw(ctx) {
            if (this.alpha <= 0) return;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 255, 204, ${this.alpha * 0.6})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 204, ${this.alpha * 0.2})`;
            ctx.fill();
        }
    }
    function drawRipples() {
        rippleCtx.clearRect(0, 0, rippleCanvas.width, rippleCanvas.height);
        for (let i = ripples.length - 1; i >= 0; i--) {
            const r = ripples[i];
            r.update();
            r.draw(rippleCtx);
            if (r.alpha <= 0) ripples.splice(i, 1);
        }
    }
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.closest('footer') || target.closest('.modal') || target.closest('#main-title') ||
            target.closest('.modal-overlay') || target.closest('#control-buttons') ||
            target.closest('.share-buttons') || target.closest('.ai-chat-window')) return;
        ripples.push(new Ripple(e.clientX, e.clientY));
        if (ripples.length > 20) ripples.shift();
    });

    // ============================
    // 9. ВЗАИМОДЕЙСТВИЕ С МЫШЬЮ
    // ============================
    let mouseX = null, mouseY = null;
    const particles = [];
    function handlePointerMove(x, y) {
        mouseX = x;
        mouseY = y;
        hexOffsetX = (x / window.innerWidth - 0.5) * 40;
        hexOffsetY = (y / window.innerHeight - 0.5) * 40;
        for (let i = 0; i < 2; i++) {
            particles.push(new Particle(mouseX, mouseY, `rgba(0, 255, 204, ${Math.random() * 0.4 + 0.4})`));
        }
    }
    canvas.addEventListener('mousemove', (e) => handlePointerMove(e.clientX, e.clientY));
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) handlePointerMove(touch.clientX, touch.clientY);
    }, { passive: false });
    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        if (touch) handlePointerMove(touch.clientX, touch.clientY);
    });

    class Particle {
        constructor(x, y, color) {
            this.x = x; this.y = y;
            this.radius = Math.random() * 2 + 1;
            this.speedX = (Math.random() - 0.5) * 3;
            this.speedY = (Math.random() - 0.5) * 3;
            this.alpha = 1;
            this.life = 60;
            this.color = color;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.alpha -= 0.016;
            this.life--;
        }
        draw() {
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // ============================
    // 10. ЧАСЫ
    // ============================
    function updateClock() {
        const now = new Date();
        clockElement.textContent = now.toTimeString().split(' ')[0];
    }
    setInterval(updateClock, 1000);
    updateClock();

    // ============================
    // 11. АУДИО
    // ============================
    let isAudioInitialized = false;
    let isAudioPlaying = false;
    function initAudio() {
        if (isAudioInitialized) return;
        [backgroundMusic, clickSound].forEach(audio => {
            audio.load();
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                }).catch(e => console.warn('Audio init:', e));
            }
        });
        isAudioInitialized = true;
        try { initAudioVisualizer(); } catch (e) {}
    }
    document.addEventListener('click', initAudio, { once: true });

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
        clickSound.currentTime = 0;
        clickSound.play().catch(() => {});
    });

    // ============================
    // 12. ГЕНЕРАТОР ФРАЗ
    // ============================
    const quotes = [
        "Искусственный интеллект — это зеркало человечества.",
        "Будущее уже наступило, просто неравномерно распределено.",
        "Код — это поэзия машин.",
        "Мы не создаём ИИ, мы раскрываем его.",
        "Граница между человеком и машиной стирается."
    ];
    let lastQuote = '';
    quoteBtn.addEventListener('click', () => {
        let q;
        do { q = quotes[Math.floor(Math.random() * quotes.length)]; }
        while (q === lastQuote && quotes.length > 1);
        lastQuote = q;
        quoteDisplay.textContent = `«${q}»`;
        quoteDisplay.style.opacity = 0;
        setTimeout(() => { quoteDisplay.style.opacity = 1; }, 50);
        if (isAudioPlaying && isAudioInitialized) {
            clickSound.currentTime = 0;
            clickSound.play().catch(() => {});
        }
        const rect = quoteBtn.getBoundingClientRect();
        ripples.push(new Ripple(rect.left + rect.width/2, rect.top + rect.height/2));
    });
    setTimeout(() => {
        quoteDisplay.textContent = '«' + quotes[0] + '»';
    }, 500);

    // ============================
    // 13. AI-ЧАТ
    // ============================
    const botAnswers = {
        'привет': 'Здравствуйте! Рад вас видеть.',
        'как дела': 'Все системы работают штатно.',
        'кто ты': 'Я — искусственный помощник.',
        'что такое knower life': 'Это проект будущего.',
        'спасибо': 'Всегда рад помочь!',
        'пока': 'До встречи!'
    };
    function getBotReply(input) {
        const lower = input.toLowerCase();
        for (const [key, reply] of Object.entries(botAnswers)) {
            if (lower.includes(key)) return reply;
        }
        return 'Интересный вопрос! Я подумаю над этим.';
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
        setTimeout(() => {
            const reply = getBotReply(text);
            addAIMessage(reply, 'bot');
        }, 300 + Math.random() * 500);
    }
    aiChatSend.addEventListener('click', handleAISend);
    aiChatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAISend(); });
    aiChatBtn.addEventListener('click', () => {
        aiChatWindow.classList.toggle('open');
        if (aiChatWindow.classList.contains('open') && aiChatMessages.children.length === 0) {
            addAIMessage('Привет! Я AI-ассистент. Задавайте вопросы.', 'bot');
        }
    });
    aiChatClose.addEventListener('click', () => aiChatWindow.classList.remove('open'));

    // ============================
    // 14. ЧАСТИЦЫ ОТ ТЕКСТА
    // ============================
    function createTextParticles(count, centerX, centerY) {
        const rect = centerX ? { left: centerX - 50, top: centerY - 50, width: 100, height: 100 } : textElement.getBoundingClientRect();
        const cx = centerX || rect.left + rect.width / 2;
        const cy = centerY || rect.top + rect.height / 2;
        const colors = ['cyan', 'purple', 'white', 'matrix1', 'matrix2'];
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('span');
            particle.className = `particle particle--${colors[Math.floor(Math.random() * colors.length)]}`;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 50;
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
            const r = Math.floor(Math.random() * 200 + 55);
            const g = Math.floor(Math.random() * 200 + 55);
            const b = Math.floor(Math.random() * 200 + 55);
            particles.push(new Particle(cx, cy, `rgba(${r}, ${g}, ${b}, 0.8)`));
        }
    }

    // ============================
    // 15. МОДАЛЬНЫЕ ОКНА
    // ============================
    function openModal(overlay) { overlay.classList.add('active'); }
    function closeModal(overlay) { overlay.classList.remove('active'); }

    mainTitle.addEventListener('click', (e) => {
        e.stopPropagation();
        createTextParticles(30);
        createCanvasParticles(15);
        openModal(modalOverlay);
        if (isAudioPlaying && isAudioInitialized) {
            clickSound.currentTime = 0;
            clickSound.play().catch(() => {});
        }
    });
    modalClose.addEventListener('click', () => closeModal(modalOverlay));
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(modalOverlay); });

    chatOpenBtn.addEventListener('click', () => {
        openModal(chatOverlay);
        setTimeout(() => {
            if (typeof VK !== 'undefined' && VK.Widgets) {
                const container = document.getElementById('vk_comments');
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
    chatOverlay.addEventListener('click', (e) => { if (e.target === chatOverlay) closeModal(chatOverlay); });

    feedbackOpenBtn.addEventListener('click', () => openModal(feedbackModal));
    feedbackClose.addEventListener('click', () => closeModal(feedbackModal));
    feedbackModal.addEventListener('click', (e) => { if (e.target === feedbackModal) closeModal(feedbackModal); });
    document.getElementById('feedback-form').addEventListener('submit', () => {
        if (isAudioPlaying && isAudioInitialized) {
            clickSound.currentTime = 0;
            clickSound.play().catch(() => {});
        }
        setTimeout(() => closeModal(feedbackModal), 500);
    });

    // ============================
    // 16. ТЕРМИНАЛ (бегущая строка)
    // ============================
    const terminalMessages = [
        '> ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ...',
        '> ЗАГРУЗКА МОДУЛЕЙ ИИ...',
        '> УСТАНОВКА СОЕДИНЕНИЯ...',
        '> СИСТЕМА АКТИВИРОВАНА',
        '> ДОБРО ПОЖАЛОВАТЬ В KNOWER LIFE'
    ];
    let msgIndex = 0, charIndex = 0, isTypingTerminal = false;
    function typeTerminal() {
        if (isTypingTerminal) return;
        if (msgIndex >= terminalMessages.length) msgIndex = 0;
        const msg = terminalMessages[msgIndex];
        terminalText.textContent = '';
        charIndex = 0;
        isTypingTerminal = true;
        function typeChar() {
            if (charIndex < msg.length) {
                terminalText.textContent += msg[charIndex];
                charIndex++;
                setTimeout(typeChar, 40 + Math.random() * 30);
            } else {
                isTypingTerminal = false;
                msgIndex++;
                setTimeout(typeTerminal, 3000);
            }
        }
        typeChar();
    }
    setTimeout(typeTerminal, 600);

    // ============================
    // 17. СМЕНА ГРАДИЕНТА
    // ============================
    function updateBackground() {
        const hours = new Date().getHours();
        const bg = document.getElementById('background');
        if (hours >= 6 && hours < 12) {
            bg.style.background = 'linear-gradient(135deg, rgba(0, 200, 255, 0.15), rgba(100, 50, 255, 0.1), #0a0a1a)';
        } else if (hours >= 12 && hours < 18) {
            bg.style.background = 'linear-gradient(135deg, rgba(0, 255, 200, 0.15), rgba(200, 50, 255, 0.1), #0f0f1f)';
        } else if (hours >= 18 && hours < 22) {
            bg.style.background = 'linear-gradient(135deg, rgba(255, 150, 0, 0.15), rgba(200, 0, 100, 0.1), #0a0a0f)';
        } else {
            bg.style.background = 'linear-gradient(135deg, rgba(0, 50, 100, 0.2), rgba(50, 0, 100, 0.2), #000000)';
        }
    }
    updateBackground();
    setInterval(updateBackground, 60000);

    // ============================
    // 18. ОСНОВНОЙ ЦИКЛ
    // ============================
    function animate() {
        try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawStars();
            drawHexGrid();
            drawMatrixRain();
            drawAudioVisualizer();
            drawRipples();
            nodes.forEach(node => { node.update(mouseX, mouseY); node.draw(); });
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.update();
                p.draw();
                if (p.life <= 0) particles.splice(i, 1);
            }
            connectNodes();
            requestAnimationFrame(animate);
        } catch (e) { console.error('animate error:', e); }
    }

    // ============================
    // 19. СТАРТ
    // ============================
    resizeCanvases();
    animate();
    window.addEventListener('resize', resizeCanvases);
});
