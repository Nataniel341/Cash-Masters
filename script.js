// MATRIX
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

// --- CONFIG ---
const Config = {
    upgrades: [
        { id: 'u1', name: 'KLIK-START', type: 'cpc', cost: 25, power: 1, desc: '+1 do kliku' },
        { id: 'u2', name: 'AUTO-SCRIPT', type: 'cps', cost: 150, power: 2, desc: '+2 $/sek' },
        { id: 'u3', name: 'KOPARKA GPU', type: 'cps', cost: 1200, power: 15, desc: '+15 $/sek' },
        { id: 'u4', name: 'HAKER PC', type: 'cpc', cost: 5000, power: 50, desc: '+50 do kliku' },
        { id: 'u5', name: 'SERWEROWNIA', type: 'cps', cost: 25000, power: 200, desc: '+200 $/sek' },
        { id: 'u6', name: 'AI TRADER', type: 'cps', cost: 150000, power: 1000, desc: '+1k $/sek' },
        { id: 'u7', name: 'QUANTUM CORE', type: 'cpc', cost: 500000, power: 5000, desc: '+5k do kliku' },
        { id: 'u8', name: 'SATELITA', type: 'cps', cost: 2500000, power: 15000, desc: '+15k $/sek' }
    ],
    accessories: [
        { id: 'acc1', name: 'CZAPKA Z DASZKIEM', cost: 5000, mult: 1.1, icon: '🧢', desc: '+10% bonus' },
        { id: 'acc2', name: 'OKULARY BOSS', cost: 25000, mult: 1.25, icon: '🕶️', desc: '+25% bonus' },
        { id: 'acc3', name: 'KORONA KRÓLA', cost: 100000, mult: 1.5, icon: '👑', desc: '+50% bonus' },
        { id: 'acc4', name: 'SŁUCHAWKI PRO', cost: 500000, mult: 2.0, icon: '🎧', desc: '+100% bonus' },
        { id: 'acc5', name: 'AUREOLA', cost: 5000000, mult: 5.0, icon: '😇', desc: 'Divine Power' }
    ],
    skins: [
        { id: 'green', name: 'NEON GREEN', cost: 0, mult: 1.0, class: 'skin-green' },
        { id: 'blue', name: 'CYBER BLUE', cost: 20000, mult: 1.5, class: 'skin-blue' },
        { id: 'purple', name: 'ULTRA VIOLET', cost: 100000, mult: 3.0, class: 'skin-purple' },
        { id: 'pink', name: 'HOT PINK', cost: 500000, mult: 6.0, class: 'skin-pink' },
        { id: 'orange', name: 'VOLCANO', cost: 2500000, mult: 15.0, class: 'skin-orange' },
        { id: 'red', name: 'HELL ENERGY', cost: 15000000, mult: 50.0, class: 'skin-red' }
    ],
    premium: [
        { id: 'pm1', name: 'PERMA BOOST I', cost: 1, mult: 1.5, desc: 'Stały mnożnik x1.5' },
        { id: 'pm2', name: 'PERMA BOOST II', cost: 5, mult: 2.5, desc: 'Stały mnożnik x2.5' },
        { id: 'pm3', name: 'PERMA BOOST III', cost: 25, mult: 5.0, desc: 'Stały mnożnik x5.0' },
        { id: 'pm4', name: 'GOLDEN CLICK', cost: 100, mult: 10.0, desc: 'Stały mnożnik x10.0' }
    ]
};

// --- STATE ---
let state = {
    money: 0,
    counts: {},         // Ilość ulepszeń
    bought: ['green'],  // Kupione ID (skiny, pety, akcesoria)
    premium: [],        // Kupione premium (ID)
    currentSkin: 'green',
    currentAcc: null,
    rebirths: 0,
    rebirthCoins: 0,
    tab: 'upgrades'
};

const Game = {
    init() {
        this.load();
        Config.upgrades.forEach(u => state.counts[u.id] = state.counts[u.id] || 0);
        UI.render();
        
        setInterval(() => { 
            state.money += this.getCps()/10; 
            UI.update(); 
        }, 100);
        setInterval(() => this.save(), 5000); // Auto-save
    },

    getMult() {
        let m = 1;
        // Skin
        const skin = Config.skins.find(s => s.id === state.currentSkin);
        if(skin) m *= skin.mult;
        // Akcesorium
        if(state.currentAcc) {
            const acc = Config.accessories.find(a => a.id === state.currentAcc);
            if(acc) m *= acc.mult;
        }
        // Premium (Permanentne)
        Config.premium.forEach(p => { if(state.premium.includes(p.id)) m *= p.mult; });
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
        const val = this.getCpc();
        state.money += val;
        UI.pop(e.clientX, e.clientY, `+$${UI.fmt(val)}`);
        UI.update();
        this.save();
    },

    buy(type, id) {
        // Logika kupna zależna od typu
        if(type === 'upgrades') {
            const u = Config.upgrades.find(x => x.id === id);
            const cost = Math.floor(u.cost * Math.pow(1.65, state.counts[id])); // Nowy balans 1.65
            if(state.money >= cost) { state.money -= cost; state.counts[id]++; UI.render(); this.save(); }
        } else if (type === 'premium') {
            const item = Config.premium.find(x => x.id === id);
            if(!state.premium.includes(id) && state.rebirthCoins >= item.cost) {
                state.rebirthCoins -= item.cost;
                state.premium.push(id);
                UI.render(); this.save();
            }
        } else {
            // Skiny i Akcesoria
            const list = type === 'accessories' ? Config.accessories : Config.skins;
            const item = list.find(x => x.id === id);
            const owned = state.bought.includes(id);

            if(!owned && state.money >= item.cost) {
                state.money -= item.cost; 
                state.bought.push(id);
                if(type === 'skins') state.currentSkin = id;
                if(type === 'accessories') state.currentAcc = id;
                UI.render(); this.save();
            } else if(owned) {
                if(type === 'skins') state.currentSkin = id;
                if(type === 'accessories') state.currentAcc = (state.currentAcc === id ? null : id); // Toggle off
                UI.render(); this.save();
            }
        }
    },

    doRebirth() {
        if(state.money < 1000000) return;
        
        const earnedCoins = Math.floor(state.money / 1000000);
        
        if(confirm(`REBIRTH? Stracisz kasę i ulepszenia, ale zyskasz ${earnedCoins} Rebirth Coins i stały dostęp do Black Market.`)) {
            // HARD RESET CZĘŚCIOWY
            state.money = 0;
            state.counts = {};
            Config.upgrades.forEach(u => state.counts[u.id] = 0);
            state.bought = ['green']; // Reset skinów/akcesoriów
            state.currentSkin = 'green';
            state.currentAcc = null;
            
            // NAGRODY
            state.rebirths++;
            state.rebirthCoins += earnedCoins;
            
            this.save();
            location.reload(); // Odśwież dla efektu
        }
    },

    save() { localStorage.setItem('CM_UPDATE_V1', JSON.stringify(state)); },
    load() { const d = localStorage.getItem('CM_UPDATE_V1'); if(d) state = JSON.parse(d); },
    hardReset() { if(confirm("FULL WIPE? Kasuje wszystko, nawet Rebirth.")) { localStorage.clear(); location.reload(); } }
};

const UI = {
    fmt(n) { return n >= 1e6 ? (n/1e6).toFixed(2)+'M' : (n >= 1e3 ? (n/1e3).toFixed(1)+'k' : Math.floor(n)); },
    
    update() {
        document.getElementById('money-display').innerText = '$' + this.fmt(state.money);
        document.getElementById('cpc-val').innerText = this.fmt(Game.getCpc());
        document.getElementById('cps-val').innerText = this.fmt(Game.getCps());
        document.getElementById('mult-val').innerText = 'x' + Game.getMult().toFixed(1);
        document.getElementById('rc-display').innerText = state.rebirthCoins;
        document.getElementById('rebirth-count').innerText = state.rebirths;

        // Rebirth Button Logic
        const rBtn = document.getElementById('rebirth-btn-container');
        if(state.money >= 1000000) {
            rBtn.style.display = 'block';
            document.getElementById('potential-rc').innerText = Math.floor(state.money / 1000000);
        } else {
            rBtn.style.display = 'none';
        }

        // Check Affordability
        document.querySelectorAll('.buy-btn').forEach(btn => {
            const cost = parseInt(btn.dataset.cost);
            const type = btn.dataset.type;
            if(type === 'premium') {
                if(state.rebirthCoins >= cost) btn.classList.add('can-afford-premium');
                else btn.classList.remove('can-afford-premium');
            } else {
                if(cost > 0 && state.money >= cost) btn.classList.add('can-afford');
                else btn.classList.remove('can-afford');
            }
        });
    },

    render() {
        const content = document.getElementById('shop-content'); content.innerHTML = '';
        
        if(state.tab === 'upgrades') {
            Config.upgrades.forEach(u => {
                const cost = Math.floor(u.cost * Math.pow(1.65, state.counts[u.id]));
                content.innerHTML += `<div class="card"><div class="card-info"><h3>${u.name} (Lvl ${state.counts[u.id]})</h3><p>${u.desc}</p><span class="card-price">$${this.fmt(cost)}</span></div><button class="buy-btn" data-type="upgrades" data-cost="${cost}" onclick="Game.buy('upgrades','${u.id}')">KUP</button></div>`;
            });
        } else if (state.tab === 'accessories') {
            Config.accessories.forEach(a => {
                const owned = state.bought.includes(a.id);
                const active = state.currentAcc === a.id;
                content.innerHTML += `<div class="card"><div class="card-info"><h3>${a.icon} ${a.name}</h3><p>${a.desc}</p></div><button class="buy-btn" data-type="accessories" data-cost="${owned?0:a.cost}" onclick="Game.buy('accessories','${a.id}')">${active?'ZDEJMIJ':(owned?'ZAŁÓŻ':'$'+this.fmt(a.cost))}</button></div>`;
            });
        } else if (state.tab === 'skins') {
            Config.skins.forEach(s => {
                const owned = state.bought.includes(s.id);
                const active = state.currentSkin === s.id;
                content.innerHTML += `<div class="card"><div class="card-info"><h3>${s.name}</h3><p>Mnożnik x${s.mult}</p></div><button class="buy-btn" data-type="skins" data-cost="${owned?0:s.cost}" onclick="Game.buy('skins','${s.id}')">${active?'AKTYWNY':(owned?'WYBIERZ':'$'+this.fmt(s.cost))}</button></div>`;
            });
        } else if (state.tab === 'premium') {
            Config.premium.forEach(p => {
                const owned = state.premium.includes(p.id);
                content.innerHTML += `<div class="card premium-card"><div class="card-info"><h3>🟣 ${p.name}</h3><p>${p.desc}</p><span class="card-price price-rc">${p.cost} RC</span></div><button class="buy-btn" data-type="premium" data-cost="${owned?999999:p.cost}" ${owned?'disabled':''} onclick="Game.buy('premium','${p.id}')">${owned?'POSIADASZ':'KUP'}</button></div>`;
            });
        }

        // Render Visuals
        const activeSkin = Config.skins.find(s => s.id === state.currentSkin);
        document.getElementById('main-button').className = activeSkin.class;
        
        const accDisplay = document.getElementById('accessory-display');
        accDisplay.innerHTML = '';
        if(state.currentAcc) {
            const acc = Config.accessories.find(a => a.id === state.currentAcc);
            if(acc) accDisplay.innerHTML = acc.icon;
        }

        this.update();
    },

    switchTab(t, btn) {
        state.tab = t; 
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); 
        this.render();
        document.querySelector('.shop-list').scrollTop = 0;
    },

    pop(x, y, txt) {
        const d = document.createElement('div'); d.className = 'click-pop';
        d.style.left = x + 'px'; d.style.top = y + 'px'; d.innerText = txt;
        d.style.color = 'white'; document.body.appendChild(d);
        setTimeout(() => d.remove(), 600);
    }
};

window.onload = () => Game.init();
