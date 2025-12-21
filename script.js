// --- CONFIG ---
const Config = {
    upgrades: [
        { id: 'u1', name: 'KLIK-START', type: 'cpc', cost: 15, power: 1, desc: '+1 do kliku' },
        { id: 'u2', name: 'AUTO-SCRIPT', type: 'cps', cost: 100, power: 2, desc: '+2 $/sek' },
        { id: 'u3', name: 'KOPARKA GPU', type: 'cps', cost: 1100, power: 10, desc: '+10 $/sek' },
        { id: 'u4', name: 'HAKER PC', type: 'cpc', cost: 5000, power: 50, desc: '+50 do kliku' },
        { id: 'u5', name: 'SERWEROWNIA', type: 'cps', cost: 20000, power: 150, desc: '+150 $/sek' },
        { id: 'u6', name: 'AI TRADER', type: 'cps', cost: 100000, power: 800, desc: '+800 $/sek' },
        { id: 'u7', name: 'QUANTUM CORE', type: 'cpc', cost: 500000, power: 2000, desc: '+2k do kliku' },
        { id: 'u8', name: 'SATELITA', type: 'cps', cost: 2000000, power: 10000, desc: '+10k $/sek' }
    ],
    // DODATKI: To są czapki na przycisk
    accessories: [
        { id: 'acc1', name: 'CZAPKA PRO', cost: 5000, mult: 1.2, icon: '🧢', desc: '+20% do kasy' },
        { id: 'acc2', name: 'OKULARY BOSS', cost: 25000, mult: 1.5, icon: '🕶️', desc: '+50% do kasy' },
        { id: 'acc3', name: 'KORONA KRÓLA', cost: 250000, mult: 2.0, icon: '👑', desc: 'x2 do kasy' },
        { id: 'acc4', name: 'MASKA HAKERA', cost: 1000000, mult: 3.5, icon: '🎭', desc: 'x3.5 do kasy' },
        { id: 'acc5', name: 'AUREOLA', cost: 5000000, mult: 5.0, icon: '😇', desc: 'Divine Power' }
    ],
    // NEONY: Zmieniają tylko kolor
    skins: [
        { id: 'green', name: 'NEON GREEN', cost: 0, mult: 1.0, class: 'skin-green' },
        { id: 'blue', name: 'CYBER BLUE', cost: 20000, mult: 1.5, class: 'skin-blue' },
        { id: 'purple', name: 'ULTRA VIOLET', cost: 150000, mult: 3.0, class: 'skin-purple' },
        { id: 'orange', name: 'VOLCANO', cost: 1000000, mult: 8.0, class: 'skin-orange' },
        { id: 'red', name: 'HELL FIRE', cost: 10000000, mult: 25.0, class: 'skin-red' }
    ],
    // BLACK MARKET: Za RC
    premium: [
        { id: 'pm1', name: 'PERMA BOOST I', cost: 1, mult: 2.0, desc: 'Stałe x2 (nie znika)' },
        { id: 'pm2', name: 'PERMA BOOST II', cost: 5, mult: 5.0, desc: 'Stałe x5 (nie znika)' },
        { id: 'pm3', name: 'PERMA BOOST III', cost: 20, mult: 10.0, desc: 'Stałe x10 (nie znika)' },
        { id: 'pm4', name: 'GOD MODE', cost: 100, mult: 100.0, desc: 'Stałe x100 (nie znika)' }
    ]
};

// --- STATE ---
let state = {
    money: 0,
    counts: {},
    bought: ['green'], 
    premium: [],
    currentSkin: 'green',
    currentAcc: null,
    rebirths: 0,
    rebirthCoins: 0,
    tab: 'upgrades' // Domyślna zakładka
};

const Game = {
    init() {
        this.load();
        Config.upgrades.forEach(u => state.counts[u.id] = state.counts[u.id] || 0);
        UI.render();
        
        setInterval(() => { state.money += this.getCps()/10; UI.update(); }, 100);
        setInterval(() => this.save(), 5000);
    },

    getRebirthCost() {
        // Cena startuje od 1M i rośnie x3 za każdym razem
        return 1000000 * Math.pow(3, state.rebirths);
    },

    getMult() {
        let m = 1;
        // Skin Bonus
        const skin = Config.skins.find(s => s.id === state.currentSkin);
        if(skin) m *= skin.mult;
        // Accessory Bonus
        if(state.currentAcc) {
            const acc = Config.accessories.find(a => a.id === state.currentAcc);
            if(acc) m *= acc.mult;
        }
        // Premium Bonus
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
    },

    buy(tab, id) {
        if(tab === 'upgrades') {
            const u = Config.upgrades.find(x => x.id === id);
            const cost = Math.floor(u.cost * Math.pow(1.6, state.counts[id]));
            if(state.money >= cost) { state.money -= cost; state.counts[id]++; UI.render(); this.save(); }
        } 
        else if (tab === 'premium') {
            const item = Config.premium.find(x => x.id === id);
            if(!state.premium.includes(id) && state.rebirthCoins >= item.cost) {
                state.rebirthCoins -= item.cost;
                state.premium.push(id);
                UI.render(); this.save();
            }
        } 
        else if (tab === 'accessories') {
            const item = Config.accessories.find(x => x.id === id);
            const owned = state.bought.includes(id);
            if(!owned && state.money >= item.cost) {
                state.money -= item.cost;
                state.bought.push(id);
                state.currentAcc = id; // Auto equip po kupnie
                UI.render(); this.save();
            } else if (owned) {
                // Toggle: jeśli masz na sobie to zdejmij, jak nie to załóż
                state.currentAcc = (state.currentAcc === id ? null : id);
                UI.render(); this.save();
            }
        }
        else if (tab === 'skins') {
            const item = Config.skins.find(x => x.id === id);
            const owned = state.bought.includes(id);
            if(!owned && state.money >= item.cost) {
                state.money -= item.cost;
                state.bought.push(id);
                state.currentSkin = id;
                UI.render(); this.save();
            } else if (owned) {
                state.currentSkin = id;
                UI.render(); this.save();
            }
        }
    },

    attemptRebirth() {
        const cost = this.getRebirthCost();
        if(state.money >= cost) {
            const reward = 1 + Math.floor(state.money / (cost * 1.5));
            if(confirm(`REBIRTH? Koszt: ${UI.fmt(cost)}. Nagroda: ${reward} RC.`)) {
                state.money = 0;
                state.counts = {};
                Config.upgrades.forEach(u => state.counts[u.id] = 0);
                state.bought = ['green'];
                state.currentSkin = 'green';
                state.currentAcc = null;
                
                state.rebirths++;
                state.rebirthCoins += reward;
                this.save();
                location.reload();
            }
        }
    },

    save() { localStorage.setItem('CM_FIXED_V2', JSON.stringify(state)); },
    load() { const d = localStorage.getItem('CM_FIXED_V2'); if(d) state = JSON.parse(d); },
    hardReset() { if(confirm("HARD RESET?")) { localStorage.clear(); location.reload(); } }
};

const UI = {
    fmt(n) { return n >= 1e6 ? (n/1e6).toFixed(2)+'M' : (n >= 1e3 ? (n/1e3).toFixed(1)+'k' : Math.floor(n)); },
    
    update() {
        document.getElementById('money-display').innerText = '$' + this.fmt(state.money);
        document.getElementById('cpc-val').innerText = this.fmt(Game.getCpc());
        document.getElementById('cps-val').innerText = this.fmt(Game.getCps());
        document.getElementById('mult-val').innerText = 'x' + Game.getMult().toFixed(1);
        document.getElementById('rc-val').innerText = state.rebirthCoins;
        document.getElementById('reb-val').innerText = state.rebirths;

        const nextCost = Game.getRebirthCost();
        const rebZone = document.getElementById('rebirth-zone');
        if(state.money >= nextCost) {
            rebZone.style.display = 'block';
            document.getElementById('next-rebirth-cost').innerText = this.fmt(nextCost);
            const reward = 1 + Math.floor(state.money / (nextCost * 1.5));
            document.getElementById('rebirth-reward-val').innerText = reward;
        } else {
            rebZone.style.display = 'none';
        }
        
        // Aktualizacja widoczności przycisków w czasie rzeczywistym
        document.querySelectorAll('.buy-btn').forEach(btn => {
            if(btn.disabled) return;
            const cost = parseFloat(btn.dataset.cost);
            const type = btn.dataset.type;
            
            if(type === 'premium') {
                if(state.rebirthCoins >= cost) btn.classList.add('can-afford-premium');
                else btn.classList.remove('can-afford-premium');
            } else {
                if(state.money >= cost) btn.classList.add('can-afford');
                else btn.classList.remove('can-afford');
            }
        });
    },

    render() {
        const content = document.getElementById('shop-content'); 
        content.innerHTML = '';
        
        // --- KLUCZOWY FIX: RÓŻNE PĘTLE DLA RÓŻNYCH ZAKŁADEK ---
        switch(state.tab) {
            
            case 'upgrades':
                Config.upgrades.forEach(u => {
                    const cost = Math.floor(u.cost * Math.pow(1.6, state.counts[u.id]));
                    content.innerHTML += `
                        <div class="card">
                            <div class="card-info">
                                <h3>⚡ ${u.name} <small>(Lvl ${state.counts[u.id]})</small></h3>
                                <p>${u.desc}</p>
                                <span class="card-price">$${this.fmt(cost)}</span>
                            </div>
                            <button class="buy-btn" data-type="upgrades" data-cost="${cost}" 
                                onclick="Game.buy('upgrades','${u.id}')">KUP</button>
                        </div>`;
                });
                break;

            case 'accessories':
                Config.accessories.forEach(a => {
                    const owned = state.bought.includes(a.id);
                    const active = state.currentAcc === a.id;
                    content.innerHTML += `
                        <div class="card card-acc">
                            <div class="card-info">
                                <h3>${a.icon} ${a.name}</h3>
                                <p>${a.desc}</p>
                                <span class="card-price">${owned ? 'POSIADASZ' : '$'+this.fmt(a.cost)}</span>
                            </div>
                            <button class="buy-btn" data-type="accessories" data-cost="${owned?0:a.cost}" 
                                onclick="Game.buy('accessories','${a.id}')">
                                ${active ? 'ZDEJMIJ ❌' : (owned ? 'ZAŁÓŻ ✅' : 'KUP')}
                            </button>
                        </div>`;
                });
                break;

            case 'skins':
                Config.skins.forEach(s => {
                    const owned = state.bought.includes(s.id);
                    const active = state.currentSkin === s.id;
                    content.innerHTML += `
                        <div class="card card-skin">
                            <div class="card-info">
                                <h3>🎨 ${s.name}</h3>
                                <p>Mnożnik x${s.mult}</p>
                                <span class="card-price">${owned ? 'POSIADASZ' : '$'+this.fmt(s.cost)}</span>
                            </div>
                            <button class="buy-btn" data-type="skins" data-cost="${owned?0:s.cost}" 
                                onclick="Game.buy('skins','${s.id}')">
                                ${active ? 'AKTYWNY' : (owned ? 'WYBIERZ' : 'KUP')}
                            </button>
                        </div>`;
                });
                break;

            case 'premium':
                Config.premium.forEach(p => {
                    const owned = state.premium.includes(p.id);
                    content.innerHTML += `
                        <div class="card card-premium">
                            <div class="card-info">
                                <h3>🟣 ${p.name}</h3>
                                <p>${p.desc}</p>
                                <span class="card-price price-rc">${p.cost} RC</span>
                            </div>
                            <button class="buy-btn" data-type="premium" data-cost="${owned?9999:p.cost}" 
                                ${owned ? 'disabled' : ''}
                                onclick="Game.buy('premium','${p.id}')">
                                ${owned ? 'KUPIONE' : 'KUP'}
                            </button>
                        </div>`;
                });
                break;
        }

        // Renderowanie wyglądu przycisku
        const activeSkin = Config.skins.find(s => s.id === state.currentSkin);
        if(activeSkin) document.getElementById('main-button').className = activeSkin.class;
        
        // Renderowanie wyglądu dodatku
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
        // Przewiń listę na górę po zmianie
        const list = document.querySelector('.shop-list');
        if(list) list.scrollTop = 0;
    },

    pop(x, y, txt) {
        const d = document.createElement('div'); d.className = 'click-pop';
        d.style.left = x + 'px'; d.style.top = y + 'px'; d.innerText = txt;
        document.body.appendChild(d); setTimeout(() => d.remove(), 800);
    }
};

// MATRIX BG
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

window.onload = () => Game.init();
