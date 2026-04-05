// ===== UI - Arayüz Yönetimi =====
const UI = {
    currentScreen: 'main-menu',

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenId;
        }
    },

    showMainMenu() {
        this.updateCoinDisplays();
        this.showScreen('main-menu');
        if (typeof Game !== 'undefined') Game.state = 'menu';
    },

    goBack() {
        Sounds.play('click');
        this.showMainMenu();
    },

    startGame() {
        Sounds.play('click');
        this.buildLevelGrid();
        this.showScreen('level-select');
    },

    openShop() {
        Sounds.play('click');
        this.buildShopUI();
        this.showScreen('shop-screen');
    },

    openHangar() {
        Sounds.play('click');
        this.buildHangarUI();
        this.showScreen('hangar-screen');
    },

    updateCoinDisplays() {
        const coins = Storage.getCoins();
        const level = Storage.getMaxLevel();
        document.querySelectorAll('#menu-coins, #ls-coins, #shop-coins, #hangar-coins, #hud-coins').forEach(el => {
            if (el) el.textContent = coins.toLocaleString('tr-TR');
        });
        const lvlEl = document.getElementById('menu-level');
        if (lvlEl) lvlEl.textContent = level;
    },

    // ===== LEVEL GRID =====
    buildLevelGrid() {
        const grid = document.getElementById('level-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const maxUnlocked = Storage.getMaxLevel();

        for (let i = 1; i <= 30; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            const stars = Storage.getStars(i);

            if (i > maxUnlocked) {
                btn.classList.add('locked');
                btn.innerHTML = `<span>${i}</span>`;
            } else {
                if (stars > 0) btn.classList.add('completed');
                const starText = '★'.repeat(stars) + '☆'.repeat(3 - stars);
                btn.innerHTML = `<span>${i}</span><span class="stars">${starText}</span>`;
                btn.onclick = () => {
                    Sounds.play('click');
                    Game.startLevel(i);
                };
            }
            grid.appendChild(btn);
        }
        this.updateCoinDisplays();
    },

    // ===== MAĞAZA UI =====
    buildShopUI() {
        const container = document.getElementById('shop-items');
        if (!container) return;
        container.innerHTML = '';

        Shop.upgrades.forEach(upgrade => {
            const currentLvl = Storage.getUpgrade(upgrade.key);
            const isMax = currentLvl >= upgrade.maxLevel;
            const cost = Shop.getCost(upgrade.key);
            const canAfford = Storage.getCoins() >= cost;

            const item = document.createElement('div');
            item.className = 'shop-item';

            // Level pips
            let pips = '';
            for (let i = 0; i < upgrade.maxLevel; i++) {
                pips += `<div class="shop-level-pip ${i < currentLvl ? 'filled' : ''}"></div>`;
            }

            item.innerHTML = `
                <div class="shop-icon">${upgrade.icon}</div>
                <div class="shop-info">
                    <h3>${upgrade.name} ${isMax ? '(MAX)' : `Lv.${currentLvl}`}</h3>
                    <p>${upgrade.desc} — ${upgrade.effect}</p>
                    <div class="shop-level-bar">${pips}</div>
                </div>
                <button class="shop-buy-btn ${isMax ? 'maxed' : ''}"
                        ${isMax || !canAfford ? 'disabled' : ''}>
                    ${isMax ? '✅ MAX' : `💰 ${cost}`}
                </button>
            `;

            if (!isMax) {
                item.querySelector('.shop-buy-btn').onclick = () => {
                    if (Shop.buy(upgrade.key)) {
                        this.buildShopUI();
                        this.updateCoinDisplays();
                    }
                };
            }

            container.appendChild(item);
        });
        this.updateCoinDisplays();
    },

    // ===== HANGAR UI =====
    buildHangarUI() {
        const container = document.getElementById('hangar-planes');
        if (!container) return;
        container.innerHTML = '';
        const selected = Storage.getSelectedPlane();
        const maxLevel = Storage.getMaxLevel();

        Airplanes.list.forEach(plane => {
            const unlocked = Storage.isPlaneUnlocked(plane.id) || maxLevel >= plane.unlockLevel;
            if (unlocked && !Storage.isPlaneUnlocked(plane.id)) {
                Storage.unlockPlane(plane.id);
            }
            const isSelected = plane.id === selected;

            const item = document.createElement('div');
            item.className = `hangar-item ${isSelected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`;

            // Mini canvas preview
            const previewId = `plane-preview-${plane.id}`;

            item.innerHTML = `
                <canvas id="${previewId}" class="hangar-preview" width="70" height="50"></canvas>
                <div class="hangar-info">
                    <h3>${plane.name}</h3>
                    <p>${unlocked ? plane.desc : `Level ${plane.unlockLevel} gerekli`}</p>
                    <div class="hangar-stats">
                        <span class="hangar-stat">Hız: ${'●'.repeat(Math.round(plane.speed * 3))}${'○'.repeat(5 - Math.round(plane.speed * 3))}</span>
                        <span class="hangar-stat">Süzülme: ${'●'.repeat(Math.round((1.1 - plane.glide) * 8))}${'○'.repeat(5 - Math.round((1.1 - plane.glide) * 8))}</span>
                    </div>
                </div>
                <span class="hangar-badge ${isSelected ? 'active' : 'unlock-info'}">
                    ${isSelected ? '✓ Seçili' : (!unlocked ? '🔒 Lv.' + plane.unlockLevel : 'Seç')}
                </span>
            `;

            if (unlocked && !isSelected) {
                item.onclick = () => {
                    Sounds.play('click');
                    Storage.selectPlane(plane.id);
                    this.buildHangarUI();
                };
            }

            container.appendChild(item);

            // Preview çizimi
            requestAnimationFrame(() => {
                const canvas = document.getElementById(previewId);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, 70, 50);
                    if (unlocked) {
                        Airplanes.drawPreview(ctx, plane.id, 0, 0, 70, 50);
                    } else {
                        ctx.fillStyle = 'rgba(255,255,255,0.1)';
                        ctx.font = '24px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText('?', 35, 33);
                    }
                }
            });
        });
        this.updateCoinDisplays();
    },

    // ===== GAME HUD =====
    showGameHUD(levelNum) {
        const level = Levels.get(levelNum);
        this.showScreen('game-hud');
        document.getElementById('hud-level-num').textContent = levelNum;
        document.getElementById('hud-target').textContent = level.stars[0];
        document.getElementById('hud-distance').textContent = '0';
        document.getElementById('hud-altitude').textContent = '0';
        this.updateCoinDisplays();
    },

    updateHUD(distance, altitude, coins) {
        document.getElementById('hud-distance').textContent = Math.floor(distance);
        document.getElementById('hud-altitude').textContent = Math.floor(altitude);
        document.getElementById('hud-coins').textContent = coins.toLocaleString('tr-TR');
    },

    showPowerIndicator(power, angle) {
        const indicator = document.getElementById('power-indicator');
        const fill = document.getElementById('power-fill');
        const angleEl = document.getElementById('power-angle');
        indicator.style.display = 'flex';
        fill.style.width = `${power * 100}%`;
        angleEl.textContent = `${Math.round((-angle * 180) / Math.PI)}°`;
    },

    hidePowerIndicator() {
        document.getElementById('power-indicator').style.display = 'none';
    },

    // ===== SONUÇ EKRANI =====
    showResult(levelNum, distance, collectedCoins, passed) {
        const level = Levels.get(levelNum);
        const stars = Levels.calculateStars(levelNum, distance);
        const distanceBonus = Math.floor(distance);
        const starBonus = stars === 3 ? 300 : stars === 2 ? 150 : stars === 1 ? 50 : 0;
        const totalEarned = collectedCoins + distanceBonus + starBonus;

        // Kaydet
        Storage.addCoins(totalEarned);
        Storage.setStars(levelNum, stars);
        Storage.addDistance(distance);

        if (passed && levelNum < 30) {
            Storage.unlockLevel(levelNum + 1);
        }

        // UI güncelle
        document.getElementById('result-title').textContent = passed ? 'Level Tamamlandı!' : 'Tekrar Dene!';
        document.getElementById('result-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        document.getElementById('result-stars').style.color = stars > 0 ? '#ffd54f' : '#666';
        document.getElementById('result-distance').textContent = `${Math.floor(distance)}m`;
        document.getElementById('result-collected').textContent = `💰 ${collectedCoins}`;
        document.getElementById('result-bonus').textContent = `💰 ${distanceBonus}`;
        document.getElementById('result-star-bonus').textContent = `💰 ${starBonus}`;
        document.getElementById('result-total').textContent = `💰 ${totalEarned}`;

        const nextBtn = document.getElementById('btn-next-level');
        nextBtn.style.display = (passed && levelNum < 30) ? 'inline-block' : 'none';

        if (passed) Sounds.play('levelup');
        else Sounds.play('land');

        this.showScreen('result-screen');
    }
};
