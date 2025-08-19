document.addEventListener('DOMContentLoaded', () => {
    // Основной canvas для анимации AI-сети
    const canvas = document.getElementById('ai-network');
    const ctx = canvas.getContext('2d');
    if (!ctx) console.error('Ошибка: не удалось получить контекст для ai-network canvas');
    else console.log('Контекст ai-network успешно инициализирован');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Canvas для эффекта матричного дождя
    const matrixCanvas = document.getElementById('matrix-rain');
    const matrixCtx = matrixCanvas.getContext('2d');
    if (!matrixCtx) console.error('Ошибка: не удалось получить контекст для matrix-rain canvas');
    else console.log('Контекст matrix-rain успешно инициализирован');
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    console.log('Инициализация matrixCanvas:', matrixCanvas.width, matrixCanvas.height);

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
    const chars = '0100101101001110010011110101011101000101010100100010000001001100010010010100011001000101ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    const fontSize = 14;
    const columns = Math.floor(matrixCanvas.width / fontSize);
    const dropsDown = Array(columns).fill(0); // Падающие сверху
    const speedsDown = Array(columns).fill(1); // Скорость сверху вниз
    const textElement = document.getElementById('knower-life');

    // Функция отрисовки матричного дождя
    function drawMatrixRain() {
        try {
            if (!matrixCtx) {
                console.error('matrixCtx не инициализирован');
                return;
            }
            matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
            matrixCtx.font = `${fontSize}px monospace`;

            // Проверяем загрузку textElement
            if (!textElement) {
                console.error('textElement не найден');
                return;
            }
            const rect = textElement.getBoundingClientRect();
            console.log('Координаты текста:', rect.left, rect.right, rect.top, rect.bottom);

            for (let i = 0; i < columns; i++) {
                const x = i * fontSize;
                const yDown = dropsDown[i] * fontSize;
                const char = chars.charAt(Math.floor(Math.random() * chars.length));

                // Проверяем, находится ли символ в области текста
                const isInTextArea = x >= rect.left && x <= rect.right && yDown >= rect.top && yDown <= rect.bottom;

                matrixCtx.fillStyle = isInTextArea
                    ? `rgba(0, 255, 204, ${Math.random() * 0.3 + 0.2})` // Полупрозрачные "внутри"
                    : `rgba(0, 255, 204, ${Math.random() * 0.7 + 0.3})`; // Яркие "сверху"
                speedsDown[i] = isInTextArea ? 0.5 : 1;

                matrixCtx.fillText(char, x, yDown);
                dropsDown[i] += speedsDown[i];

                if (dropsDown[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                    dropsDown[i] = 0;
                    speedsDown[i] = 1;
                }
            }
            console.log('drawMatrixRain выполнен, колонн:', columns);
        } catch (e) {
            console.error('Ошибка в drawMatrixRain:', e);
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
            particles.push(new Particle(mouseX, mouseY, `rgba(0, 255, 204, ${Math.random() * 0.4 + 0.4})`));
        }
    });

    // Основной цикл анимации
    function animate() {
        try {
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
        } catch (e) {
            console.error('Ошибка в animate:', e);
        }
    }
    animate();

    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        matrixCanvas.width = window.innerWidth;
        matrixCanvas.height = window.innerHeight;
        dropsDown.fill(0);
        speedsDown.fill(1);
        dropsDown.length = Math.floor(matrixCanvas.width / fontSize);
        speedsDown.length = Math.floor(matrixCanvas.width / fontSize);
        console.log('Размеры canvas обновлены:', matrixCanvas.width, matrixCanvas.height);
    });

    // Воспроизведение аудио
    const backgroundMusic = document.getElementById('background-music');
    const clickSound = document.getElementById('click-sound');

    // Проверка загрузки аудиофайлов
    [backgroundMusic, clickSound].forEach(audio => {
        audio.addEventListener('loadeddata', () => {
            console.log(`Аудио ${audio.id} загружено`);
        });
        audio.addEventListener('error', (e) => {
            console.error(`Ошибка загрузки аудио ${audio.id}:`, e);
        });
    });

    // Функция для воспроизведения аудио
    function playSound(audio) {
        audio.currentTime = 0; // Сбрасываем для повторного воспроизведения
        audio.play().catch(e => console.error(`Ошибка воспроизведения ${audio.id}:`, e));
    }

    // Инициализация аудио после первого взаимодействия
    let isAudioInitialized = false;
    document.addEventListener('click', () => {
        if (!isAudioInitialized) {
            console.log('Инициализация аудио при первом клике');
            [backgroundMusic, clickSound].forEach(audio => {
                audio.load(); // Принудительная загрузка
                console.log(`Принудительная загрузка ${audio.id}`);
            });
            isAudioInitialized = true;
        }
    }, { once: true });

    // Переключение звука
    const audioToggle = document.getElementById('audio-toggle');
    let isAudioPlaying = false;
    audioToggle.addEventListener('click', () => {
        console.log('Кнопка звука нажата'); // Для диагностики
        const rect = audioToggle.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        createTextParticles(5, centerX, centerY); // Частицы при клике
        if (!isAudioPlaying) {
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

    // Частицы и звуки для текста
    textElement.addEventListener('click', () => {
        createTextParticles(20);
        createCanvasParticles(10);
        if (isAudioPlaying && isAudioInitialized) {
            playSound(clickSound); // Воспроизводим только если звук включен и инициализирован
        }
    });

    function createTextParticles(count, centerX, centerY) {
        const rect = centerX ? { left: centerX - 50, top: centerY - 50, width: 100, height: 100 } : textElement.getBoundingClientRect();
        centerX = centerX || rect.left + rect.width / 2;
        centerY = centerY || rect.top + rect.height / 2;
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
});
