const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
const drops = Array(Math.floor(canvas.width/16)).fill(1);
function drawM() {
    ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#0F0'; ctx.font = '15px monospace';
    drops.forEach((y, i) => {
        ctx.fillText("01"[Math.floor(Math.random()*2)], i*16, y*16);
        if(y*16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    });
}
setInterval(drawM, 50);

const Config = {
    upgrades: [
        { id: 'u1', name: 'KLIK_MOD', type: 'cpc', cost: 15, power: 1, desc: 'Więcej kasy za klik' },
        { id: 'u2', name: 'AUTO_BOT', type: 'cps', cost: 100, power: 3, desc: 'Klika za Ciebie' },
        { id: 'u3', name: 'SERVER_V1', type: 'cps', cost: 1000, power: 25, desc: 'Pasywny dochód' },
        { id: 'u4', name: 'CORE_X', type: 'cpc', cost: 8000, power: 120, desc: 'Potężne kliknięcie' },
        { id: 'u5', name: 'GLOBAL_AI', type: 'cps', cost: 60000, power: 750, desc: 'Sieć generuje miliony' }
    ],
    pets: [
        { id: 'p1', name: 'BIT-DOGE', cost: 3000, mult: 1.2, icon: '🐕' },
        { id: 'p2', name: 'TECH-CAT', cost: 20000, mult: 1.6, icon: '🐈' },
        { id: 'p3', name: 'ICE-BEAR', cost: 100000, mult: 2.2, icon: '🐻' },
        { id: 'p4', name: 'ROBO-BUG', cost: 350000, mult: 4.0, icon: '🐞' },
        { id: 'p5', name: 'GOLD-OWL', cost: 1500000, mult: 8.5, icon: '🦉' },
        { id: 'p6', name: 'PHOENIX', cost: 12000000, mult: 25.0, icon: '🔥' }
    ],
    skins: [
        { id: 'green', name: 'NEON GREEN', cost: 0, mult: 1.0, class: 'skin-green' },
        { id: 'blue', name: 'CYBER BLUE', cost: 15000, mult: 2.0, class: 'skin-blue' },
        { id: 'purple', name: 'ULTRA VIOLET', cost: 100000, mult: 4.5, class: 'skin-purple' },
        { id: 'pink', name: 'HOT PINK', cost: 600000, mult: 10.0, class: 'skin-pink' },
        { id: 'orange', name: 'VOLCANO', cost: 3000000, mult: 20.0, class: 'skin-orange' },
        { id: 'red', name: 'HELL ENERGY', cost: 15000000, mult: 60.0, class: 'skin-red' }
    ]
};

let state = { money: 0, counts: {}, bought: ['green'], currentSkin: 'green', tab: 'upgrades' };

const Game = {
    init() {
        this.load();
        Config.upgrades.forEach(u => state.counts[u.id] = state.counts[u.id] || 0);
        UI.render();
        setInterval(() => { state.money += this.getCps()/10; UI.update(); }, 100);
    },
    getMult() {
        let m = 1;
        const skin = Config.skins.find(s => s.id === state.currentSkin);
        if(skin) m *= skin.mult;
        Config.pets.forEach(p => { if(state.bought.includes(p.id)) m *= p.mult; });
        return m;
    },
    getCpc() {
        let b = 1;
        Config.upgrades.filter(u => u.type === 'cpc').forEach(u => b += u.power * state.counts[u.id]);
        return b * this.getMult();
    },
    getCps() {
        let b = 0;
        Config.upgrades.filter(u => u.type === 'cps').forEach(u => b += u.power * state.counts[u.id]);
        return b * this.getMult();
    },
    click(e) {
        const val = this.getCpc(); state.money += val;
        UI.pop(e.clientX, e.clientY, `+$${UI.fmt(val)}`); UI.update();
        this.save();
    },
    buyU(id) {
        const u = Config.upgrades.find(x => x.id === id);
        const cost = Math.floor(u.cost * Math.pow(1.6, state.counts[id]));
        if(state.money >= cost) { state.money -= cost; state.counts[id]++; UI.render(); this.save(); }
    },
    buyS(type, id) {
        const item = Config[type].find(x => x.id === id);
        const owned = state.bought.includes(id);
        if(!owned && state.money >= item.cost) {
            state.money -= item.cost; state.bought.push(id);
            if(type === 'skins') state.currentSkin = id;
            UI.render(); this.save();
        } else if(owned && type === 'skins') { state.currentSkin = id; UI.render(); this.save(); }
    },
    save() { localStorage.setItem('CASH_MASTERS_FINAL', JSON.stringify(state)); },
    load() { const d = localStorage.getItem('CASH_MASTERS_FINAL'); if(d) state = JSON.parse(d); },
    hardReset() { if(confirm("WIPE DATA?")) { localStorage.clear(); location.reload(); } }
};

const UI = {
    fmt(n) { return n >= 1e6 ? (n/1e6).toFixed(1)+'M' : (n >= 1e3 ? (n/1e3).toFixed(1)+'k' : Math.floor(n)); },
    update() {
        document.getElementById('money-display').innerText = '$' + this.fmt(state.money);
        document.getElementById('cpc-val').innerText = this.fmt(Game.getCpc());
        document.getElementById('cps-val').innerText = this.fmt(Game.getCps());
        document.getElementById('mult-val').innerText = 'x' + Game.getMult().toFixed(1);
        document.querySelectorAll('.buy-btn').forEach(btn => {
            const cost = parseInt(btn.dataset.cost);
            if(cost > 0 && state.money >= cost) btn.classList.add('can-afford');
            else btn.classList.remove('can-afford');
        });
    },
    render() {
        const content = document.getElementById('shop-content'); content.innerHTML = '';
        if(state.tab === 'upgrades') {
            Config.upgrades.forEach(u => {
                const cost = Math.floor(u.cost * Math.pow(1.6, state.counts[u.id]));
                content.innerHTML += `<div class="card"><div class="card-info"><h3>${u.name}</h3><p>${u.desc}</p><span class="card-price">$${this.fmt(cost)}</span></div><button class="buy-btn" data-cost="${cost}" onclick="Game.buyU('${u.id}')">BUY</button></div>`;
            });
        } else if(state.tab === 'pets') {
            Config.pets.forEach(p => {
                const owned = state.bought.includes(p.id);
                content.innerHTML += `<div class="card"><div class="card-info"><h3>${p.icon} ${p.name}</h3><p>Boost x${p.mult}</p></div><button class="buy-btn" data-cost="${owned?0:p.cost}" onclick="Game.buyS('pets','${p.id}')">${owned?'MAX':'$'+this.fmt(p.cost)}</button></div>`;
            });
        } else {
            Config.skins.forEach(s => {
                const owned = state.bought.includes(s.id); const active = state.currentSkin === s.id;
                content.innerHTML += `<div class="card"><div class="card-info"><h3>${s.name}</h3><p>Boost x${s.mult}</p></div><button class="buy-btn" data-cost="${owned?0:s.cost}" onclick="Game.buyS('skins','${s.id}')">${active?'ON':(owned?'SET':'$'+this.fmt(s.cost))}</button></div>`;
            });
        }
        document.getElementById('main-button').className = Config.skins.find(s => s.id === state.currentSkin).class;
        const pZone = document.getElementById('pets-zone'); pZone.innerHTML = '';
        Config.pets.forEach(p => { if(state.bought.includes(p.id)) pZone.innerHTML += `<span class="pet-item">${p.icon}</span>`; });
        this.update();
    },
    switchTab(t, btn) {
        state.tab = t; document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); this.render();
        document.querySelector('.shop-list').scrollTop = 0;
    },
    pop(x, y, txt) {
        const d = document.createElement('div'); d.className = 'click-pop';
        d.style.left = x + 'px'; d.style.top = y + 'px'; d.innerText = txt;
        document.body.appendChild(d); setTimeout(() => d.remove(), 600);
    }
};
window.onload = () => Game.init();
