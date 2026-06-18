document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ============================
    // 1. ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ
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
    const terminalElement = document.getElementById('terminal');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');

    // Элементы чата
    const chatOpenBtn = document.getElementById('chat-open-btn');
    const chatCloseBtn = document.getElementById('chat-close-btn');
    const chatOverlay = document.getElementById('chat-modal-overlay');
    const giscusContainer = document.getElementById('giscus-container');

    // ============================
    // 2. КОНФИГУРАЦИЯ GISCUS (ЗАМЕНИТЕ НА СВОИ ЗНАЧЕНИЯ)
    // ============================
    const GISCUS_CONFIG = {
        repo: 'https://github.com/KnowerLife/knowerlife',          // Ваш репозиторий
        repoId: 'R_kgDOPf9skg',                    // ID репозитория (получить на giscus.app)
        categoryId: 'DIC_kwDOPf9sks4C_ZjY',               // ID категории
        mapping: 'pathname',                     // Способ привязки к странице
        strict: '0',
        reactionsEnabled: '1',
        emitMetadata: '0',
        inputPosition: 'bottom',
        theme: 'dark',                           // dark, dark_dimmed, dark_high_contrast
        lang: 'ru',
        loading: 'lazy'
    };

    // ============================
    // 3. РАЗМЕРЫ CANVAS
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

    // ============================
    // 4. ЗВЁЗДЫ
    // ============================
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

    // ============================
    // 5. ГЕКСАГОНАЛЬНАЯ СЕТКА
    // ============================
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
    // 6. МАТРИЧНЫЙ ДОЖДЬ
    // ============================
    const chars = '0100101101001110010011110101011101000101010100100010000001001100010010010100011001000101ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    let fontSize = 14;
    let columns = 0;
    let dropsDown = [];
    let speedsDown = [];

    function initMatrixRain() {
        fontSize = Math.min(14, Math.floor(matrixCanvas.width / 80) + 10);
        columns = Math.floor(matrixCanvas.width / fontSize);
        dropsDown = Array(columns).fill(0);
        speedsDown = Array(columns).fill(1);
    }

    let matrixFrameCounter = 0;
    function drawMatrixRain() {
        matrixFrameCounter++;
        if (matrixFrameCounter % 2 !== 0) return;
        matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        matrixCtx.font = `${fontSize}px monospace`;
        if (!textElement) return;
        const rect = textElement.getBoundingClientRect();

        for (let i = 0; i < columns; i++) {
            const x = i * fontSize;
            const yDown = dropsDown[i] * fontSize;
            const char = chars.charAt(Math.floor(Math.random() * chars.length));
            const isInTextArea = x >= rect.left && x <= rect.right && yDown >= rect.top && yDown <= rect.bottom;
            matrixCtx.fillStyle = isInTextArea
                ? `rgba(0, 255, 204, ${Math.random() * 0.3 + 0.2})`
                : `rgba(0, 255, 204, ${Math.random() * 0.7 + 0.3})`;
            matrixCtx.fillText(char, x, yDown);
            dropsDown[i] += (isInTextArea ? 0.5 : 1);
            if (dropsDown[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                dropsDown[i] = 0;
                speedsDown[i] = 1;
            }
        }
    }

    // ============================
    // 7. СЕТЬ ИИ
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
    // 8. ВИЗУАЛИЗАЦИЯ ЗВУКА
    // ============================
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let audioSource = null;

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
    // 9. ЭФФЕКТ РЯБИ
    // ============================
    let ripples = [];
    class Ripple {
        constructor(x, y) {
            this.x = x;
            this.y = y;
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
        if (target.closest('footer') || target.closest('.modal') || target.closest('#main-title') || target.closest('.chat-modal-overlay') || target.closest('#chat-open-btn')) return;
        ripples.push(new Ripple(e.clientX, e.clientY));
        if (ripples.length > 20) ripples.shift();
    });

    // ============================
    // 10. ТЕРМИНАЛ
    // ============================
    const terminalMessages = [
        '> Инициализация нейросети...',
        '> Загрузка модулей: 100%',
        '> Установка связи с сервером...',
        '> Добро пожаловать в Knower Life',
        '> Искусственный интеллект активен',
        '> Данные синхронизированы',
        '> Будущее начинается здесь'
    ];
    let terminalIndex = 0;
    let charIndex = 0;
    let isTyping = false;

    function typeNextMessage() {
        if (isTyping) return;
        if (terminalIndex >= terminalMessages.length) terminalIndex = 0;
        const msg = terminalMessages[terminalIndex];
        terminalElement.textContent = '';
        charIndex = 0;
        isTyping = true;
        function typeChar() {
            if (charIndex < msg.length) {
                terminalElement.textContent += msg[charIndex];
                charIndex++;
                setTimeout(typeChar, 50 + Math.random() * 30);
            } else {
                isTyping = false;
                terminalIndex++;
                setTimeout(typeNextMessage, 4000);
            }
        }
        typeChar();
    }

    // ============================
    // 11. ВЗАИМОДЕЙСТВИЕ С МЫШЬЮ/ТАЧ
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

    canvas.addEventListener('mousemove', (e) => {
        handlePointerMove(e.clientX, e.clientY);
    });
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
    // 12. ЧАСЫ
    // ============================
    function updateClock() {
        const now = new Date();
        clockElement.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // ============================
    // 13. АУДИО
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
                }).catch(e => console.warn('Аудио инициализация:', e));
            }
        });
        isAudioInitialized = true;
        try {
            initAudioVisualizer();
        } catch (e) { console.warn('Визуализатор звука не доступен'); }
    }

    document.addEventListener('click', initAudio, { once: true });

    audioToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isAudioInitialized) {
            initAudio();
            setTimeout(() => toggleAudio(), 100);
        } else {
            toggleAudio();
        }
    });

    function toggleAudio() {
        if (!isAudioInitialized) return;
        if (!isAudioPlaying) {
            backgroundMusic.play().catch(e => console.error('Ошибка воспроизведения музыки:', e));
            audioToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
            audioToggle.setAttribute('aria-pressed', 'true');
            isAudioPlaying = true;
        } else {
            backgroundMusic.pause();
            audioToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
            audioToggle.setAttribute('aria-pressed', 'false');
            isAudioPlaying = false;
        }
        clickSound.currentTime = 0;
        clickSound.play().catch(e => console.warn('Не удалось воспроизвести click:', e));
    }

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
    // 15. МОДАЛЬНОЕ ОКНО (о проекте)
    // ============================
    function openModal() {
        modalOverlay.classList.add('active');
    }
    function closeModal() {
        modalOverlay.classList.remove('active');
    }
    mainTitle.addEventListener('click', (e) => {
        e.stopPropagation();
        createTextParticles(30);
        createCanvasParticles(15);
        openModal();
        if (isAudioPlaying && isAudioInitialized) {
            clickSound.currentTime = 0;
            clickSound.play().catch(e => console.warn('click sound:', e));
        }
    });
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // ============================
    // 16. УПРАВЛЕНИЕ ЧАТОМ (GISCUS)
    // ============================
    let giscusLoaded = false;

    function loadGiscus() {
        if (giscusLoaded) return;
        giscusLoaded = true;

        // Очищаем контейнер на случай, если там что-то было
        giscusContainer.innerHTML = '';

        // Создаём скрипт Giscus
        const script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        script.setAttribute('data-repo', GISCUS_CONFIG.repo);
        script.setAttribute('data-repo-id', GISCUS_CONFIG.repoId);
        script.setAttribute('data-category', GISCUS_CONFIG.category);
        script.setAttribute('data-category-id', GISCUS_CONFIG.categoryId);
        script.setAttribute('data-mapping', GISCUS_CONFIG.mapping);
        script.setAttribute('data-strict', GISCUS_CONFIG.strict);
        script.setAttribute('data-reactions-enabled', GISCUS_CONFIG.reactionsEnabled);
        script.setAttribute('data-emit-metadata', GISCUS_CONFIG.emitMetadata);
        script.setAttribute('data-input-position', GISCUS_CONFIG.inputPosition);
        script.setAttribute('data-theme', GISCUS_CONFIG.theme);
        script.setAttribute('data-lang', GISCUS_CONFIG.lang);
        script.setAttribute('data-loading', GISCUS_CONFIG.loading);
        script.setAttribute('crossorigin', 'anonymous');
        script.async = true;

        // Добавляем скрипт в контейнер
        giscusContainer.appendChild(script);

        // Добавляем небольшой лоадер
        const loader = document.createElement('div');
        loader.style.cssText = `
            text-align: center;
            padding: 40px 0;
            color: rgba(0,255,204,0.5);
            font-family: 'Roboto', sans-serif;
        `;
        loader.textContent = 'Загрузка обсуждения...';
        giscusContainer.prepend(loader);

        // Удаляем лоадер после загрузки Giscus (через MutationObserver)
        const observer = new MutationObserver(() => {
            if (giscusContainer.querySelector('.giscus')) {
                const l = giscusContainer.querySelector('div:first-child');
                if (l && l.textContent.includes('Загрузка')) {
                    l.remove();
                }
                observer.disconnect();
            }
        });
        observer.observe(giscusContainer, { childList: true, subtree: true });

        // Fallback: удалить лоадер через 8 секунд
        setTimeout(() => {
            const l = giscusContainer.querySelector('div:first-child');
            if (l && l.textContent.includes('Загрузка')) {
                l.remove();
            }
        }, 8000);
    }

    function openChat() {
        chatOverlay.classList.add('active');
        loadGiscus(); // Загружаем Giscus при открытии
        // Добавляем рябь на кнопке
        if (typeof ripples !== 'undefined') {
            const rect = chatOpenBtn.getBoundingClientRect();
            ripples.push(new Ripple(rect.left + rect.width/2, rect.top + rect.height/2));
        }
    }

    function closeChat() {
        chatOverlay.classList.remove('active');
    }

    chatOpenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openChat();
    });

    chatCloseBtn.addEventListener('click', closeChat);

    chatOverlay.addEventListener('click', (e) => {
        if (e.target === chatOverlay) closeChat();
    });

    // ============================
    // 17. ОСНОВНОЙ ЦИКЛ
    // ============================
    function animate() {
        try {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            drawStars();
            drawHexGrid();
            drawMatrixRain();
            drawAudioVisualizer();
            drawRipples();

            nodes.forEach(node => {
                node.update(mouseX, mouseY);
                node.draw();
            });

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.update();
                p.draw();
                if (p.life <= 0) particles.splice(i, 1);
            }

            connectNodes();

            requestAnimationFrame(animate);
        } catch (e) {
            console.error('Ошибка в animate:', e);
        }
    }

    // ============================
    // 18. СТАРТ
    // ============================
    resizeCanvases();
    animate();
    setTimeout(typeNextMessage, 1000);

    window.addEventListener('resize', resizeCanvases);
});
