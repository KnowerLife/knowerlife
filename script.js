// VK Comments уже инициализированы в HTML

// Modal helpers
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function openModal(id) { document.getElementById(id).classList.add('open'); }

// Logo popup
document.getElementById('logoBtn').addEventListener('click', () => openModal('logoModal'));

// Tools handling
document.getElementById('toolGrid').addEventListener('click', (e) => {
    const item = e.target.closest('.tool-item');
    if (!item) return;
    const tool = item.dataset.tool;
    const content = document.getElementById('toolContent');
    content.innerHTML = '';
    switch(tool) {
        case 'sound':
            content.innerHTML = `<h3>🔊 Звук</h3><button class="btn btn-primary" onclick="document.getElementById('click-sound').play()">Воспроизвести</button>`;
            break;
        case 'time':
            const updateTime = () => {
                const el = document.getElementById('liveTime');
                if (el) el.textContent = new Date().toLocaleTimeString();
            };
            content.innerHTML = `<h3>🕒 Текущее время</h3><p id="liveTime" style="font-size:2rem;"></p>`;
            updateTime();
            setInterval(updateTime, 1000);
            break;
        case 'password':
            content.innerHTML = `<h3>🔐 Генератор пароля</h3><input type="number" id="passLength" value="12" min="4" max="32" style="width:80px; margin-right:8px;"><button class="btn btn-primary" onclick="generatePassword()">Создать</button><p id="generatedPass" style="margin-top:16px; font-size:1.2rem;"></p>`;
            window.generatePassword = () => {
                const len = parseInt(document.getElementById('passLength').value) || 12;
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
                let pass = '';
                for(let i=0; i<len; i++) pass += chars.charAt(Math.floor(Math.random()*chars.length));
                document.getElementById('generatedPass').textContent = pass;
            };
            break;
        case 'todo':
            content.innerHTML = `<h3>✅ ToDo-лист</h3><input id="todoInput" placeholder="Задача..." style="flex:1;"><button class="btn btn-primary" onclick="addTodo()">Добавить</button><ul id="todoList" style="list-style:none; padding:0; margin-top:16px;"></ul>`;
            window.addTodo = () => {
                const input = document.getElementById('todoInput');
                const text = input.value.trim();
                if(!text) return;
                const li = document.createElement('li');
                li.innerHTML = `<input type="checkbox" style="margin-right:8px;"> ${text} <button style="margin-left:auto; background:none; border:none; color:var(--error); cursor:pointer;">✕</button>`;
                li.querySelector('button').onclick = () => li.remove();
                document.getElementById('todoList').appendChild(li);
                input.value = '';
            };
            break;
        case 'bitcoin':
            content.innerHTML = `<h3>₿ Bitcoin курс</h3><p id="btcPrice">Загрузка...</p>`;
            fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('btcPrice').textContent = `1 BTC = $${data.bitcoin.usd}`;
                })
                .catch(() => document.getElementById('btcPrice').textContent = 'Не удалось загрузить курс');
            break;
        case 'diary':
            content.innerHTML = `<h3>📓 Дневник</h3><textarea id="diaryEntry" rows="6" style="width:100%; background:var(--bg-tertiary); border:1px solid var(--border-subtle); color:var(--text-primary); padding:12px; border-radius:var(--radius-sm);">${localStorage.getItem('diary') || ''}</textarea><button class="btn btn-primary" style="margin-top:12px;" onclick="localStorage.setItem('diary', document.getElementById('diaryEntry').value); alert('Сохранено!')">Сохранить</button>`;
            break;
        case 'nickname':
            // Сохраняем массивы глобально, чтобы кнопка могла к ним обратиться
            window.nickAdjectives = ['Смелый','Быстрый','Умный','Тихий','Громкий'];
            window.nickNouns = ['Кодер','Аналитик','Мастер','Ниндзя','Гуру'];
            window.generateNickname = () => {
                const adj = window.nickAdjectives[Math.floor(Math.random() * window.nickAdjectives.length)];
                const noun = window.nickNouns[Math.floor(Math.random() * window.nickNouns.length)];
                const num = Math.floor(Math.random() * 100);
                document.getElementById('nickResult').textContent = adj + noun + num;
            };
            content.innerHTML = `
                <h3>🆔 Генератор никнейма</h3>
                <div style="margin-top:16px; display:flex; flex-direction:column; gap:12px;">
                    <p id="nickResult" style="font-size:1.5rem; font-weight:700; text-align:center;"></p>
                    <button class="btn btn-primary" onclick="window.generateNickname()">Сгенерировать</button>
                </div>`;
            window.generateNickname(); // показать сразу
            break;
        case 'countdown':
            content.innerHTML = `<h3>⏳ Таймер события</h3><input type="datetime-local" id="eventDate"><button class="btn btn-primary" style="margin-left:8px;" onclick="startCountdown()">Запустить</button><p id="countdownDisplay" style="margin-top:16px; font-size:1.2rem;"></p>`;
            window.startCountdown = () => {
                const target = new Date(document.getElementById('eventDate').value).getTime();
                const display = document.getElementById('countdownDisplay');
                const timer = setInterval(() => {
                    const now = Date.now();
                    const dist = target - now;
                    if(dist <= 0) { clearInterval(timer); display.textContent = 'Событие наступило!'; return; }
                    const d = Math.floor(dist/(1000*60*60*24));
                    const h = Math.floor((dist%(1000*60*60*24))/(1000*60*60));
                    const m = Math.floor((dist%(1000*60*60))/(1000*60));
                    const s = Math.floor((dist%(1000*60))/1000);
                    display.textContent = `${d}д ${h}ч ${m}м ${s}с`;
                }, 1000);
            };
            break;
        case 'calc':
            content.innerHTML = `<h3>🧮 Калькулятор</h3><input id="calcDisplay" readonly style="width:100%; margin-bottom:12px; text-align:right; font-size:1.5rem; background:var(--bg-tertiary); border:1px solid var(--border-subtle); color:var(--text-primary); padding:12px;"> <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px;">${['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(b => `<button class="btn" style="padding:12px;" onclick="calcInput('${b}')">${b}</button>`).join('')}</div>`;
            window.calcInput = (val) => {
                const disp = document.getElementById('calcDisplay');
                if(val === '=') { try { disp.value = eval(disp.value); } catch { disp.value = 'Ошибка'; } }
                else { disp.value += val; }
            };
            break;
        case 'caesar':
            content.innerHTML = `<h3>🔒 Шифр Цезаря</h3><input id="caesarText" placeholder="Текст" style="width:100%;"><input id="caesarShift" type="number" value="3" style="width:80px;"><button class="btn btn-primary" onclick="caesarCipher()">Зашифровать</button><p id="caesarResult" style="margin-top:12px;"></p>`;
            window.caesarCipher = () => {
                const text = document.getElementById('caesarText').value;
                const shift = parseInt(document.getElementById('caesarShift').value) % 26;
                const res = text.replace(/[a-zA-Z]/g, c => {
                    const base = c.charCodeAt(0) < 97 ? 65 : 97;
                    return String.fromCharCode(((c.charCodeAt(0)-base+shift+26)%26)+base);
                });
                document.getElementById('caesarResult').textContent = res;
            };
            break;
        case 'ai':
            const facts = ['GPT-4 обучался на 570 ГБ текста.','AlphaFold предсказал структуру 200 млн белков.','Нейросети могут создавать музыку и картины.','ChatGPT был запущен в ноябре 2022 года.','Искусственный интеллект помогает диагностировать рак.'];
            content.innerHTML = `<h3>🤖 Факт об AI</h3><p style="font-size:1.2rem;">${facts[Math.floor(Math.random()*facts.length)]}</p>`;
            break;
    }
    openModal('toolModal');
});

// Share buttons – теперь используются реальные ссылки, оставлены только соцсети
function share(network) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    const links = {
        vk: `https://vk.com/share.php?url=${url}&title=${title}`,
        telegram: `https://t.me/share/url?url=${url}&text=${title}`,
        twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
        whatsapp: `https://wa.me/?text=${title}%20${url}`
    };
    window.open(links[network], '_blank');
}

// Core functionality (курсор, тема, меню, скролл, форма)
(function() {
    const navbar = document.getElementById('navbar');
    const navLinks = document.getElementById('navLinks');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const themeToggle = document.getElementById('themeToggle');
    const cursorDot = document.getElementById('cursorDot');
    const cursorRing = document.getElementById('cursorRing');
    const contactForm = document.getElementById('contactForm');
    const toast = document.getElementById('toast');
    const revealElements = document.querySelectorAll('.reveal');
    const html = document.documentElement;

    const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    themeToggle.addEventListener('click', () => {
        const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('portfolio-theme', next);
        themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
    });

    let mouseX=0, mouseY=0, ringX=0, ringY=0;
    document.addEventListener('mousemove', e => {
        mouseX=e.clientX; mouseY=e.clientY;
        cursorDot.style.left = mouseX-4+'px';
        cursorDot.style.top = mouseY-4+'px';
    });
    function animateRing() {
        ringX += (mouseX-ringX)*0.2; ringY += (mouseY-ringY)*0.2;
        cursorRing.style.left = ringX-18+'px'; cursorRing.style.top = ringY-18+'px';
        requestAnimationFrame(animateRing);
    }
    animateRing();
    document.querySelectorAll('a,button,.card,.btn,input,textarea,.hero-card,.contact-info-item,.stat-card,.tool-item').forEach(el => {
        el.addEventListener('mouseenter',() => cursorRing.classList.add('hover'));
        el.addEventListener('mouseleave',() => cursorRing.classList.remove('hover'));
    });

    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        mobileMenuBtn.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        mobileMenuBtn.classList.remove('open');
    }));
    document.addEventListener('click', e => {
        if (!navbar.contains(e.target) && navLinks.classList.contains('open')) {
            navLinks.classList.remove('open');
            mobileMenuBtn.classList.remove('open');
        }
    });

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
        updateActiveNav();
        revealElements.forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight-80) el.classList.add('visible');
        });
    });
    function updateActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        let current = 'hero';
        sections.forEach(sec => { if (sec.getBoundingClientRect().top <= 150) current = sec.id; });
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.section === current));
    }
    window.dispatchEvent(new Event('scroll'));

    if(contactForm) {
        contactForm.addEventListener('submit', e => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();
            if (!name || !email || !message) {
                toast.innerHTML = '<span class="toast-dot" style="background:var(--error)"></span> Заполните все поля';
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
                return;
            }
            const btn = contactForm.querySelector('button');
            const origText = btn.textContent;
            btn.textContent = '⏳ Отправка...';
            btn.disabled = true;
            setTimeout(() => {
                btn.textContent = origText;
                btn.disabled = false;
                contactForm.reset();
                toast.innerHTML = '<span class="toast-dot"></span> Сообщение отправлено!';
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
            }, 1500);
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 90, behavior:'smooth' });
            }
        });
    });
})();
