// ============================
// 16. ИНСТРУМЕНТЫ (10 функций)
// ============================

// Кнопка открытия модалки инструментов
const toolsBtn = document.getElementById('tools-btn');
const toolsModal = document.getElementById('tools-modal');
const toolsClose = document.getElementById('tools-close');

toolsBtn.addEventListener('click', () => {
    openModal(toolsModal);
});
toolsClose.addEventListener('click', () => closeModal(toolsModal));
toolsModal.addEventListener('click', (e) => { if (e.target === toolsModal) closeModal(toolsModal); });

// 1. Генератор пароля
document.getElementById('pass-gen-btn').addEventListener('click', () => {
    const len = parseInt(document.getElementById('pass-length').value) || 12;
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
    let pass = '';
    for (let i = 0; i < len; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    document.getElementById('pass-result').textContent = pass;
});
document.getElementById('pass-copy').addEventListener('click', () => {
    const p = document.getElementById('pass-result').textContent;
    if (p) {
        navigator.clipboard.writeText(p).then(() => {
            const el = document.getElementById('pass-result');
            el.textContent = '✅ скопировано!';
            setTimeout(() => el.textContent = p, 1000);
        });
    }
});

// 2. Мониторинг системы
function updateSysMon() {
    document.getElementById('cpu-bar').style.width = (20 + Math.random() * 60) + '%';
    document.getElementById('ram-bar').style.width = (40 + Math.random() * 50) + '%';
    document.getElementById('net-bar').style.width = (10 + Math.random() * 70) + '%';
}
setInterval(updateSysMon, 2000);
updateSysMon();

// 3. ToDo-лист
let todos = JSON.parse(localStorage.getItem('todo_list') || '[]');
function renderTodos() {
    const list = document.getElementById('todo-list');
    list.innerHTML = todos.map((t, i) =>
        `<li>
            <span class="${t.done ? 'done' : ''}">${t.text}</span>
            <button data-idx="${i}" class="todo-toggle">✓</button>
            <button data-idx="${i}" class="todo-del">✕</button>
        </li>`
    ).join('');
    list.querySelectorAll('.todo-toggle').forEach(b => b.addEventListener('click', function() {
        const idx = parseInt(this.dataset.idx);
        todos[idx].done = !todos[idx].done;
        localStorage.setItem('todo_list', JSON.stringify(todos));
        renderTodos();
    }));
    list.querySelectorAll('.todo-del').forEach(b => b.addEventListener('click', function() {
        const idx = parseInt(this.dataset.idx);
        todos.splice(idx, 1);
        localStorage.setItem('todo_list', JSON.stringify(todos));
        renderTodos();
    }));
}
document.getElementById('todo-add').addEventListener('click', () => {
    const inp = document.getElementById('todo-input');
    if (inp.value.trim()) {
        todos.push({ text: inp.value.trim(), done: false });
        localStorage.setItem('todo_list', JSON.stringify(todos));
        inp.value = '';
        renderTodos();
    }
});
renderTodos();

// 4. Курс Bitcoin
async function fetchBTC() {
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const data = await res.json();
        document.getElementById('btc-value').textContent = data.bitcoin.usd.toFixed(2);
    } catch(e) { document.getElementById('btc-value').textContent = '—'; }
}
fetchBTC();
setInterval(fetchBTC, 30000);
document.getElementById('btc-refresh').addEventListener('click', fetchBTC);

// 5. Дневник мыслей
let diary = JSON.parse(localStorage.getItem('diary') || '[]');
function renderDiary() {
    const list = document.getElementById('diary-entries');
    list.innerHTML = diary.map((entry, i) =>
        `<li>
            <span class="diary-date">${entry.date}</span> ${entry.text}
            <button data-idx="${i}" class="diary-del">✕</button>
        </li>`
    ).join('');
    list.querySelectorAll('.diary-del').forEach(b => b.addEventListener('click', function() {
        const idx = parseInt(this.dataset.idx);
        diary.splice(idx, 1);
        localStorage.setItem('diary', JSON.stringify(diary));
        renderDiary();
    }));
}
document.getElementById('diary-save').addEventListener('click', () => {
    const inp = document.getElementById('diary-input');
    if (inp.value.trim()) {
        const now = new Date();
        const date = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
        diary.unshift({ date, text: inp.value.trim() });
        localStorage.setItem('diary', JSON.stringify(diary));
        inp.value = '';
        renderDiary();
    }
});
renderDiary();

// 6. Генератор хакерских ников
const prefixes = ['Neon', 'Cyber', '0x', 'Dark', 'Shadow', 'Phantom', 'Omega', 'Void', 'Cipher', 'Nyx'];
const suffixes = ['Ghost', 'Hacker', 'Wolf', 'Eagle', 'Phoenix', 'Knight', 'Storm', 'Blade', 'Fury', 'Sage'];
document.getElementById('nick-btn').addEventListener('click', () => {
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    const num = Math.floor(Math.random() * 1000);
    document.getElementById('nick-result').textContent = `${p}_${s}_${num}`;
});

// 7. Обратный отсчёт до события
let eventTarget = null;
document.getElementById('event-start').addEventListener('click', () => {
    const val = document.getElementById('event-date').value;
    if (val) eventTarget = new Date(val).getTime();
});
setInterval(() => {
    if (!eventTarget) return;
    const diff = eventTarget - Date.now();
    if (diff <= 0) { document.getElementById('event-timer').textContent = '⏰ Событие наступило!'; return; }
    const days = Math.floor(diff / (1000*60*60*24));
    const hrs = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
    const mins = Math.floor((diff % (1000*60*60)) / (1000*60));
    const secs = Math.floor((diff % (1000*60)) / 1000);
    document.getElementById('event-timer').textContent = `${days}д ${hrs}ч ${mins}м ${secs}с`;
}, 1000);

// 8. Кибер-калькулятор
let calcDisplay = document.getElementById('calc-display');
let calcExpr = '';
document.querySelectorAll('.calc-buttons button[data-val], .calc-buttons button[data-op]').forEach(btn => {
    btn.addEventListener('click', () => {
        const val = btn.dataset.val || btn.dataset.op;
        calcExpr += val;
        calcDisplay.value = calcExpr;
    });
});
document.getElementById('calc-eval').addEventListener('click', () => {
    try {
        const result = Function('"use strict"; return (' + calcExpr + ')')();
        calcDisplay.value = result;
        calcExpr = result.toString();
    } catch(e) {
        calcDisplay.value = 'Ошибка';
        calcExpr = '';
    }
});
document.getElementById('calc-clear').addEventListener('click', () => {
    calcExpr = '';
    calcDisplay.value = '';
});

// 9. Шифр Цезаря
function caesar(text, shift) {
    return text.split('').map(ch => {
        if (ch.match(/[a-z]/i)) {
            const code = ch.charCodeAt(0);
            const base = (code >= 65 && code <= 90) ? 65 : 97;
            return String.fromCharCode(((code - base + shift) % 26) + base);
        }
        return ch;
    }).join('');
}
document.getElementById('cipher-encrypt').addEventListener('click', () => {
    const text = document.getElementById('cipher-input').value;
    const shift = parseInt(document.getElementById('cipher-shift').value) || 3;
    document.getElementById('cipher-result').textContent = caesar(text, shift);
});

// 10. Случайный факт об AI
const techFacts = [
    "Первый компьютер весил 27 тонн.",
    "Слово 'робот' появилось в 1920 году.",
    "ИИ способен диагностировать болезни точнее врачей.",
    "Самый быстрый суперкомпьютер делает 200 квадриллионов операций в секунду.",
    "Первая нейросеть была создана в 1958 году.",
    "ИИ может предсказывать погоду с точностью 90%.",
    "В 2016 году ИИ победил чемпиона мира по го.",
    "ИИ генерирует реалистичные изображения, видео и тексты.",
    "Алгоритмы машинного обучения используются в поисковых системах.",
    "ИИ помогает в разработке новых лекарств."
];
document.getElementById('fact-btn').addEventListener('click', () => {
    const idx = Math.floor(Math.random() * techFacts.length);
    document.getElementById('fact-text').textContent = techFacts[idx];
});
