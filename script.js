document.addEventListener('DOMContentLoaded', () => {
    // Основной canvas для анимации AI-сети
    const canvas = document.getElementById('ai-network');
    const ctx = canvas.getContext('2d');
    if (!ctx) console.error('Ошибка: не удалось получить контекст для ai-network canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Canvas для эффекта матричного дождя
    const matrixCanvas = document.getElementById('matrix-rain');
    const matrixCtx = matrixCanvas.getContext('2d');
    if (!matrixCtx) console.error('Ошибка: не удалось получить контекст для matrix-rain canvas');
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;

    class Node {
        constructor(x, y) {
            this.x = x;
            this.y = y;
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

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
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

    // Настройка эффекта матричного дождя
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    const fontSize = 14;
    const columns = matrixCanvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(0);

    // Функция отрисовки матричного дождя
    function drawMatrixRain() {
        matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        matrixCtx.fillStyle = '#00ffcc';
        matrixCtx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
            const char = chars.charAt(Math.floor(Math.random() * chars.length));
            matrixCtx.fillText(char, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    const nodes = [];
    const particles = [];
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

    let mouseX = null, mouseY = null;
    canvas.addEventListener('mousemove', (e) => {
        console.log('Mouse moved:', e.clientX, e.clientY); // Для диагностики
        mouseX = e.clientX;
        mouseY = e.clientY;
        for (let i = 0; i < 2; i++) {
            particles.push(new Particle(mouseX, mouseY, `rgba(${Math.random() * 255}, 0, ${Math.random() * 255}, 0.8)`));
        }
    });

    // Основной цикл анимации
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMatrixRain();
        nodes.forEach(node => {
            node.update(mouseX, mouseY);
            node.draw();
        });
        particles.forEach((particle, index) => {
            particle.update();
            particle.draw();
            if (particle.life <= 0) particles.splice(index, 1);
        });
        connectNodes();
        requestAnimationFrame(animate);
    }
    animate();

    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        matrixCanvas.width = window.innerWidth;
        matrixCanvas.height = window.innerHeight;
        drops.fill(0);
        drops.length = Math.floor(matrixCanvas.width / fontSize);
    });

    // Воспроизведение аудио
    const warpSound = document.getElementById('warp-sound');
    const backgroundMusic = document.getElementById('background-music');
    const hoverSound = document.getElementById('hover-sound');
    const clickSound = document.getElementById('click-sound');

    // Функция для безопасного воспроизведения аудио
    function playSound(audio) {
        if (audio.readyState >= 2) { // HAVE_ENOUGH_DATA
            audio.play().catch(e => console.error(`Ошибка воспроизведения ${audio.id}:`, e));
        } else {
            console.warn(`Аудио ${audio.id} ещё не готово`);
        }
    }

    // Переключение звука
    const audioToggle = document.getElementById('audio-toggle');
    let isAudioPlaying = false;
    audioToggle.addEventListener('click', () => {
        console.log('Кнопка звука нажата'); // Для диагностики
        if (!isAudioPlaying) {
            playSound(warpSound);
            playSound(backgroundMusic);
            audioToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
            isAudioPlaying = true;
        } else {
            backgroundMusic.pause();
            audioToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
            isAudioPlaying = false;
        }
        playSound(clickSound);
    });

    // Удаляем автоматическое воспроизведение по клику на документ
    // document.addEventListener('click', () => { ... }); // Закомментировано

    // Частицы и звуки для текста
    const textElement = document.getElementById('knower-life');
    textElement.addEventListener('mouseenter', () => {
        createTextParticles(10);
        playSound(hoverSound);
    });
    textElement.addEventListener('click', () => {
        createTextParticles(20);
        createCanvasParticles(10);
        playSound(clickSound);
    });

    function createTextParticles(count) {
        const rect = textElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const colors = ['cyan', 'purple', 'white'];
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('span');
            particle.className = `particle particle--${colors[Math.floor(Math.random() * 3)]}`;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1500);
        }
    }

    function createCanvasParticles(count) {
        const rect = textElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(centerX, centerY, `rgba(${Math.random() * 255}, 0, ${Math.random() * 255}, 0.8)`));
        }
    }

    // Звук при наведении на ссылки футера
    document.querySelectorAll('footer a').forEach(link => {
        link.addEventListener('mouseenter', () => {
            playSound(hoverSound);
        });
    });
});
