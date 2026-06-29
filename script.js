// VK Comments
VK.init({ apiId: 54642529, onlyWidgets: true });
VK.Widgets.Comments('vk_comments', { limit: 5, attach: false });

// Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.log('Service Worker error', err));
    });
}

// Modal helpers
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function openModal(id) { document.getElementById(id).classList.add('open'); }

// Logo popup
document.getElementById('logoBtn').addEventListener('click', () => openModal('logoModal'));

// Language toggle
function setLanguage(lang) {
    document.documentElement.lang = lang;
    localStorage.setItem('lang', lang);
    document.querySelectorAll('[data-ru][data-en]').forEach(el => {
        const text = el.dataset[lang] || el.dataset.ru;
        if (text !== undefined) el.textContent = text;
    });
    document.querySelectorAll('.nav-links a[data-ru][data-en]').forEach(a => {
        a.textContent = a.dataset[lang] || a.dataset.ru;
    });
    document.querySelectorAll('.tool-item span[data-ru][data-en]').forEach(span => {
        span.textContent = span.dataset[lang] || span.dataset.ru;
    });
    updateToastLang();
}

function updateToastLang() {
    const msg = document.querySelector('#toast span[data-ru]');
    if (msg) {
        const currentLang = document.documentElement.lang;
        msg.textContent = msg.dataset[currentLang] || msg.dataset.ru;
    }
}

let currentLang = localStorage.getItem('lang') || 'ru';
setLanguage(currentLang);

document.getElementById('langToggle').addEventListener('click', () => {
    currentLang = currentLang === 'ru' ? 'en' : 'ru';
    setLanguage(currentLang);
});

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
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

// Custom cursor
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
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

// Mobile menu
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');
mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    mobileMenuBtn.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    mobileMenuBtn.classList.remove('open');
}));
document.addEventListener('click', e => {
    if (!document.getElementById('navbar').contains(e.target) && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        mobileMenuBtn.classList.remove('open');
    }
});

// Scroll effects
const revealElements = document.querySelectorAll('.reveal');
window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
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

// Contact form
const contactForm = document.getElementById('contactForm');
const toast = document.getElementById('toast');
if(contactForm) {
    contactForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
        const lang = document.documentElement.lang;
        if (!name || !email || !message) {
            toast.innerHTML = `<span class="toast-dot" style="background:var(--error)"></span> ${lang === 'ru' ? 'Заполните все поля' : 'Fill all fields'}`;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
            return;
        }
        const btn = contactForm.querySelector('button');
        const origText = btn.textContent;
        btn.textContent = lang === 'ru' ? '⏳ Отправка...' : '⏳ Sending...';
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent = origText;
            btn.disabled = false;
            contactForm.reset();
            toast.innerHTML = `<span class="toast-dot"></span> ${lang === 'ru' ? 'Сообщение отправлено!' : 'Message sent!'}`;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }, 1500);
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 90, behavior:'smooth' });
        }
    });
});

// Tools
const toolTranslations = {
    sound: { ru: 'Воспроизвести', en: 'Play' },
    password: { ru: 'Создать', en: 'Generate' },
    todo: { ru: 'Добавить', en: 'Add' },
    todoPlaceholder: { ru: 'Задача...', en: 'Task...' },
    diary: { ru: 'Сохранить', en: 'Save' },
    nickname: { ru: 'Сгенерировать', en: 'Generate' },
    countdown: { ru: 'Запустить', en: 'Start' },
    caesar: { ru: 'Зашифровать', en: 'Encrypt' },
};

document.getElementById('toolGrid').addEventListener('click', (e) => {
    const item = e.target.closest('.tool-item');
    if (!item) return;
    const tool = item.dataset.tool;
    const content = document.getElementById('toolContent');
    content.innerHTML = '';
    const l = document.documentElement.lang || 'ru';
    switch(tool) {
        case 'sound':
            content.innerHTML = `<h3>🔊 ${l === 'ru' ? 'Звук' : 'Sound'}</h3><button class="btn btn-primary" onclick="document.getElementById('click-sound').play()">${toolTranslations.sound[l]}</button>`;
            break;
        case 'time':
            content.innerHTML = `<h3>🕒 ${l === 'ru' ? 'Текущее время' : 'Current Time'}</h3><p id="liveTime" style="font-size:2rem;"></p>`;
            const updateTime = () => { const el = document.getElementById('liveTime'); if (el) el.textContent = new Date().toLocaleTimeString(); };
            updateTime();
            setInterval(updateTime, 1000);
            break;
        case 'password':
            content.innerHTML = `<h3>🔐 ${l === 'ru' ? 'Генератор пароля' : 'Password Generator'}</h3><input type="number" id="passLength" value="12" min="4" max="32" style="width:80px; margin-right:8px;"><button class="btn btn-primary" onclick="generatePassword()">${toolTranslations.password[l]}</button><p id="generatedPass" style="margin-top:16px; font-size:1.2rem;"></p>`;
            window.generatePassword = () => {
                const len = parseInt(document.getElementById('passLength').value) || 12;
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
                let pass = '';
                for(let i=0; i<len; i++) pass += chars.charAt(Math.floor(Math.random()*chars.length));
                document.getElementById('generatedPass').textContent = pass;
            };
            break;
        case 'todo':
            content.innerHTML = `<h3>✅ ToDo-лист</h3><input id="todoInput" placeholder="${toolTranslations.todoPlaceholder[l]}"><button class="btn btn-primary" onclick="addTodo()">${toolTranslations.todo[l]}</button><ul id="todoList" style="list-style:none; padding:0; margin-top:16px;"></ul>`;
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
            content.innerHTML = `<h3>₿ Bitcoin</h3><p id="btcPrice">${l === 'ru' ? 'Загрузка...' : 'Loading...'}</p>`;
            fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
                .then(r => r.json())
                .then(data => { document.getElementById('btcPrice').textContent = `1 BTC = $${data.bitcoin.usd}`; })
                .catch(() => { document.getElementById('btcPrice').textContent = l === 'ru' ? 'Не удалось загрузить курс' : 'Failed to load rate'; });
            break;
        case 'diary':
            content.innerHTML = `<h3>📓 ${l === 'ru' ? 'Дневник' : 'Diary'}</h3><textarea id="diaryEntry" rows="6" style="width:100%; background:var(--bg-tertiary); border:1px solid var(--border-subtle); color:var(--text-primary); padding:12px; border-radius:var(--radius-sm);">${localStorage.getItem('diary') || ''}</textarea><button class="btn btn-primary" style="margin-top:12px;" onclick="localStorage.setItem('diary', document.getElementById('diaryEntry').value); alert('${l === 'ru' ? 'Сохранено!' : 'Saved!'}')">${toolTranslations.diary[l]}</button>`;
            break;
        case 'nickname':
            const adjectives = l === 'ru' ? ['Смелый','Быстрый','Умный','Тихий','Громкий'] : ['Brave','Fast','Smart','Quiet','Loud'];
            const nouns = l === 'ru' ? ['Кодер','Аналитик','Мастер','Ниндзя','Гуру'] : ['Coder','Analyst','Master','Ninja','Guru'];
            window.generateNickname = () => {
                const a = adjectives[Math.floor(Math.random() * adjectives.length)];
                const n = nouns[Math.floor(Math.random() * nouns.length)];
                const num = Math.floor(Math.random() * 100);
                document.getElementById('nickResult').textContent = a + n + num;
            };
            content.innerHTML = `<h3>🆔 ${l === 'ru' ? 'Генератор никнейма' : 'Nickname Generator'}</h3><div style="margin-top:16px; display:flex; flex-direction:column; gap:12px;"><p id="nickResult" style="font-size:1.5rem; font-weight:700; text-align:center;"></p><button class="btn btn-primary" onclick="window.generateNickname()">${toolTranslations.nickname[l]}</button></div>`;
            window.generateNickname();
            break;
        case 'countdown':
            content.innerHTML = `<h3>⏳ ${l === 'ru' ? 'Таймер события' : 'Event Timer'}</h3><input type="datetime-local" id="eventDate"><button class="btn btn-primary" style="margin-left:8px;" onclick="startCountdown()">${toolTranslations.countdown[l]}</button><p id="countdownDisplay" style="margin-top:16px; font-size:1.2rem;"></p>`;
            window.startCountdown = () => {
                const target = new Date(document.getElementById('eventDate').value).getTime();
                const display = document.getElementById('countdownDisplay');
                const timer = setInterval(() => {
                    const now = Date.now();
                    const dist = target - now;
                    if(dist <= 0) { clearInterval(timer); display.textContent = l === 'ru' ? 'Событие наступило!' : 'Event reached!'; return; }
                    const d = Math.floor(dist/(1000*60*60*24));
                    const h = Math.floor((dist%(1000*60*60*24))/(1000*60*60));
                    const m = Math.floor((dist%(1000*60*60))/(1000*60));
                    const s = Math.floor((dist%(1000*60))/1000);
                    display.textContent = `${d}д ${h}ч ${m}м ${s}с`;
                }, 1000);
            };
            break;
        case 'calc':
            content.innerHTML = `<h3>🧮 ${l === 'ru' ? 'Калькулятор' : 'Calculator'}</h3><input id="calcDisplay" readonly style="width:100%; margin-bottom:12px; text-align:right; font-size:1.5rem; background:var(--bg-tertiary); border:1px solid var(--border-subtle); color:var(--text-primary); padding:12px;"> <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px;">${['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(b => `<button class="btn" style="padding:12px;" onclick="calcInput('${b}')">${b}</button>`).join('')}</div>`;
            window.calcInput = (val) => {
                const disp = document.getElementById('calcDisplay');
                if(val === '=') { try { disp.value = eval(disp.value); } catch { disp.value = 'Error'; } }
                else { disp.value += val; }
            };
            break;
        case 'caesar':
            content.innerHTML = `<h3>🔒 ${l === 'ru' ? 'Шифр Цезаря' : 'Caesar Cipher'}</h3><input id="caesarText" placeholder="${l === 'ru' ? 'Текст' : 'Text'}" style="width:100%;"><input id="caesarShift" type="number" value="3" style="width:80px;"><button class="btn btn-primary" onclick="caesarCipher()">${toolTranslations.caesar[l]}</button><p id="caesarResult" style="margin-top:12px;"></p>`;
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
            const facts = l === 'ru' 
                ? ['GPT-4 обучался на 570 ГБ текста.','AlphaFold предсказал структуру 200 млн белков.','Нейросети могут создавать музыку и картины.','ChatGPT был запущен в ноябре 2022 года.','Искусственный интеллект помогает диагностировать рак.']
                : ['GPT-4 was trained on 570 GB of text.','AlphaFold predicted the structure of 200 million proteins.','Neural networks can create music and paintings.','ChatGPT was launched in November 2022.','AI helps diagnose cancer.'];
            content.innerHTML = `<h3>🤖 ${l === 'ru' ? 'Факт об AI' : 'AI Fact'}</h3><p style="font-size:1.2rem;">${facts[Math.floor(Math.random()*facts.length)]}</p>`;
            break;
    }
    openModal('toolModal');
});

// Share buttons
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
