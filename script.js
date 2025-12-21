// --- CONFIG ---
const Config = {
    upgrades: [
        { id: 'u1', name: 'KLIK-START', type: 'cpc', cost: 15, power: 1, desc: '+1 do kliku' },
        { id: 'u2', name: 'AUTO-SCRIPT', type: 'cps', cost: 100, power: 2, desc: '+2 $/sek' },
        { id: 'u3', name: 'GPU MINER', type: 'cps', cost: 1100, power: 10, desc: '+10 $/sek' },
        { id: 'u4', name: 'HAKER', type: 'cpc', cost: 5000, power: 50, desc: '+50 do kliku' },
        { id: 'u5', name: 'SERWEROWNIA', type: 'cps', cost: 20000, power: 150, desc: '+150 $/sek' },
        { id: 'u6', name: 'AI TRADER', type: 'cps', cost: 100000, power: 800, desc: '+800 $/sek' },
        { id: 'u7', name: 'QUANTUM CPU', type: 'cpc', cost: 500000, power: 2000, desc: '+2k do kliku' },
        { id: 'u8', name: 'SATELITA', type: 'cps', cost: 2000000, power: 10000, desc: '+10k $/sek' }
    ],
    accessories: [
        // Dodatki - mają wpływ na CPC i wyglądają inaczej w kodzie
        { id: 'acc1', name: 'CZAPKA PRO', cost: 5000, mult: 1.2, icon: '🧢', desc: '+20% do kasy' },
        { id: 'acc2', name: 'OKULARY SZEFA', cost: 50000, mult: 1.5, icon: '🕶️', desc: '+50% do kasy' },
        { id: 'acc3', name: 'KORONA KRÓLA', cost: 250000, mult: 2.0, icon: '👑', desc: 'x2 do kasy' },
        { id: 'acc4', name: 'MASKA HAKERA', cost: 1000000, mult: 3.5, icon: '🎭', desc: 'x3.5 do kasy' },
        { id: 'acc5', name: 'AUREOLA', cost: 5000000, mult: 5.0, icon: '😇', desc: 'Divine x5' }
    ],
    skins: [
        // Skiny - tylko kolor i mnożnik
        { id: 'green', name: 'DEFAULT GREEN', cost: 0, mult: 1.0, class: 'skin-green' },
        { id: 'blue', name: 'CYBER BLUE', cost: 25000, mult: 1.5, class: 'skin-blue' },
        { id: 'purple', name: 'ULTRA VIOLET', cost: 150000, mult: 3.0, class: 'skin-purple' },
        { id: 'orange', name: 'VOLCANO', cost: 1000000, mult: 8.0, class: 'skin-orange' }
    ],
    premium: [
        // BLACK MARKET - kupowane za RC
        { id: 'pm1', name: 'PERMA BOOST I', cost: 1, mult: 2.0, desc: 'Stałe x2 (nie znika)' },
        { id: 'pm2', name: 'PERMA BOOST II', cost: 5, mult: 5.0, desc: 'Stałe x5 (nie znika)' },
        { id: 'pm3', name: 'PERMA BOOST III', cost: 20, mult: 10.0, desc: 'Stałe x10 (nie znika)' },
        { id: 'pm4', name: 'GOD MODE', cost: 100, mult: 100.0, desc: 'Stałe x100 (nie znika)' }
    ]
};

// --- STATE MANAGER ---
let state = {
    money: 0,
    counts: {},
    bought: ['green'], 
    premium: [],
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
        
        setInterval(() => { state.money += this.getCps()/10; UI.update(); }, 100);
        setInterval(() => this.save(), 5000);
    },

    getRebirthCost() {
        // Koszt rośnie: 1M, 3M, 9M, 27M...
        return 1000000 * Math.pow(3, state.rebirths);
    },

    getMult() {
        let m = 1;
        const skin = Config.skins.find(s => s.id === state.currentSkin);
        if(skin) m *= skin.mult;
        
        if(state.currentAcc) {
            const acc = Config.accessories.find(a => a.id === state.currentAcc);
            if(acc) m *= acc.mult;
        }
        
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
        else {
            // Skiny i Akcesoria
            const list = tab === 'accessories' ? Config.accessories : Config.skins;
            const item = list.find(x => x.id === id);
            const owned = state.bought.includes(id);

            if(!owned && state.money >= item.cost) {
                state.money -= item.cost; 
                state.bought.push(id);
                if(tab === 'skins') state.currentSkin = id;
                if(tab === 'accessories') state.currentAcc = id;
                UI.render(); this.save();
            } else if(owned) {
                if(tab === 'skins') state.currentSkin = id;
                if(tab === 'accessories') state.currentAcc = (state.currentAcc === id ? null : id);
                UI.render(); this.save();
            }
        }
    },

    attemptRebirth() {
        const cost = this.getRebirthCost();
        if(state.money >= cost) {
            const reward = 1 + Math.floor(state.money / (cost * 2)); // Bonus za nadmiar kasy
            
            if(confirm(`WYKONAĆ REBIRTH #${state.rebirths + 1}?\n\nKoszt: $${UI.fmt(cost)}\nNagroda: ${reward} Rebirth Coins\n\nStracisz kasę i ulepszenia, ale zyskasz RC do Black Marketu!`)) {
                
                // RESET
                state.money = 0;
                state.counts = {};
                Config.upgrades.forEach(u => state.counts[u.id] = 0);
                state.bought = ['green'];
                state.currentSkin = 'green';
                state.currentAcc = null;
                
                // ZYSK
                state.rebirths++;
                state.rebirthCoins += reward;
                
                this.save();
                location.reload();
            }
        }
    },

    save() { localStorage.setItem('CM_GAME_V1_5', JSON.stringify(state)); },
    load() { const d = localStorage.getItem('CM_GAME_V1_5'); if(d) state = JSON.parse(d); },
    hardReset() { if(confirm("USUNĄĆ WSZYSTKO? TO JEST HARD RESET.")) { localStorage.clear(); location.reload(); } }
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

        // Rebirth Button Logic
        const rebZone = document.getElementById('rebirth-zone');
        const nextCost = Game.getRebirthCost();
        
        if(state.money >= nextCost) {
            rebZone.style.display = 'block';
            document.getElementById('next-rebirth-cost').innerText = this.fmt(nextCost);
            // Wylicz nagrodę
            const reward = 1 + Math.floor(state.money / (nextCost * 2));
            document.getElementById('rebirth-reward-val').innerText = reward;
        } else {
            rebZone.style.display = 'none';
        }

        // Przyciski - odświeżanie stanu
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
        const { tab } = state;
        
        if(tab === 'upgrades') {
            Config.upgrades.forEach(u => {
                const cost = Math.floor(u.cost * Math.pow(1.6, state.counts[u.id]));
                content.innerHTML += `
                    <div class="card">
                        <div class="card-info"><h3>${u.name} <span style="color:#666">(Lvl ${state.counts[u.id]})</span></h3><p>${u.desc}</p><span class="card-price">$${this.fmt(cost)}</span></div>
                        <button class="buy-btn" data-type="upgrades" data-cost="${cost}" onclick="Game.buy('upgrades','${u.id}')">KUP</button>
                    </div>`;
            });
        } 
        else if (tab === 'accessories') {
            Config.accessories.forEach(a => {
                const owned = state.bought.includes(a.id);
                const active = state.currentAcc === a.id;
                content.innerHTML += `
                    <div class="card card-acc">
                        <div class="card-info"><h3>${a.icon} ${a.name}</h3><p>${a.desc}</p><span class="card-price">${owned ? 'POSIADASZ' : '$'+this.fmt(a.cost)}</span></div>
                        <button class="buy-btn" data-type="accessories" data-cost="${owned?0:a.cost}" onclick="Game.buy('accessories','${a.id}')">${active?'ZDEJMIJ':(owned?'ZAŁÓŻ':'KUP')}</button>
                    </div>`;
            });
        } 
        else if (tab === 'skins') {
            Config.skins.forEach(s => {
                const owned = state.bought.includes(s.id);
                const active = state.currentSkin === s.id;
                content.innerHTML += `
                    <div class="card card-skin">
                        <div class="card-info"><h3>${s.name}</h3><p>Mnożnik x${s.mult}</p><span class="card-price">${owned ? 'POSIADASZ' : '$'+this.fmt(s.cost)}</span></div>
                        <button class="buy-btn" data-type="skins" data-cost="${owned?0:s.cost}" onclick="Game.buy('skins','${s.id}')">${active?'AKTYWNY':(owned?'WYBIERZ':'KUP')}</button>
                    </div>`;
            });
        } 
        else if (tab === 'premium') {
            Config.premium.forEach(p => {
                const owned = state.premium.includes(p.id);
                content.innerHTML += `
                    <div class="card card-premium">
                        <div class="card-info"><h3>🟣 ${p.name}</h3><p>${p.desc}</p><span class="card-price price-rc">${p.cost} RC</span></div>
                        <button class="buy-btn" data-type="premium" data-cost="${owned?9999:p.cost}" ${owned?'disabled':''} onclick="Game.buy('premium','${p.id}')">${owned?'KUPIONE':'KUP'}</button>
                    </div>`;
            });
        }

        // Renderowanie wyglądu
        const activeSkin = Config.skins.find(s => s.id === state.currentSkin);
        if(activeSkin) document.getElementById('main-button').className = activeSkin.class;
        
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
        document.body.appendChild(d); setTimeout(() => d.remove(), 800);
    }
};

// Start
window.onload = () => Game.init();

