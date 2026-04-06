// ===== UI - Arayüz Yönetimi (v3) =====
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

    // ===== LEVEL GRID (50 level) =====
    buildLevelGrid() {
        const grid = document.getElementById('level-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const planeId = Storage.getSelectedPlane();
        const planeDef = Airplanes.list[planeId];
        const maxUnlocked = Storage.getMaxLevel(planeId);

        // Uçak başlığı
        const header = document.createElement('div');
        header.className = 'shop-plane-header';
        header.style.gridColumn = '1 / -1';
        header.innerHTML = `<span class="shop-plane-name">🛩️ ${planeDef.name} — Leveller</span>`;
        grid.appendChild(header);

        for (let i = 1; i <= Levels.TOTAL_LEVELS; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            const stars = Storage.getStars(i, planeId);

            if (i > maxUnlocked) {
                btn.classList.add('locked');
                btn.innerHTML = `<span>${i}</span>`;
            } else {
                if (stars > 0) btn.classList.add('completed');
                const filled = '<span class="star-on">★</span>'.repeat(stars);
                const empty = '<span class="star-off">★</span>'.repeat(3 - stars);
                btn.innerHTML = `<span>${i}</span><span class="stars">${filled}${empty}</span>`;
                btn.onclick = () => {
                    Sounds.play('click');
                    Game.startLevel(i);
                };
            }
            grid.appendChild(btn);
        }
        this.updateCoinDisplays();
    },

    // ===== MAĞAZA (uçak bazlı) =====
    buildShopUI() {
        const container = document.getElementById('shop-items');
        if (!container) return;
        container.innerHTML = '';
        const planeId = Storage.getSelectedPlane();
        const planeDef = Airplanes.list[planeId];

        // Hangi uçak için alışveriş yapıldığı
        const header = document.createElement('div');
        header.className = 'shop-plane-header';
        header.innerHTML = `<span class="shop-plane-name">🛩️ ${planeDef.name} için yükseltmeler</span>`;
        container.appendChild(header);

        Shop.upgrades.forEach(upgrade => {
            const currentLvl = Storage.getUpgrade(upgrade.key, planeId);
            const isMax = currentLvl >= upgrade.maxLevel;
            const cost = Shop.getCost(upgrade.key, planeId);
            const canAfford = Storage.getCoins() >= cost;

            const item = document.createElement('div');
            item.className = 'shop-item';

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
                    if (Shop.buy(upgrade.key, planeId)) {
                        this.buildShopUI();
                        this.updateCoinDisplays();
                    }
                };
            }
            container.appendChild(item);
        });
        this.updateCoinDisplays();
    },

    // ===== HANGAR (level kilit sistemi) =====
    buildHangarUI() {
        const container = document.getElementById('hangar-planes');
        if (!container) return;
        container.innerHTML = '';
        const selected = Storage.getSelectedPlane();

        Airplanes.list.forEach(plane => {
            const unlocked = Levels.isPlaneAvailable(plane.id);

            if (unlocked && !Storage.isPlaneUnlocked(plane.id)) {
                Storage.unlockPlane(plane.id);
            }
            const isSelected = plane.id === selected;
            const unlockText = Levels.getPlaneUnlockText(plane.id);
            const planeMaxLvl = Storage.getMaxLevel(plane.id);
            const progressText = unlocked ? `Level ${Math.min(planeMaxLvl, 50)}/50` : unlockText;

            const item = document.createElement('div');
            item.className = `hangar-item ${isSelected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`;

            const previewId = `plane-preview-${plane.id}`;

            item.innerHTML = `
                <canvas id="${previewId}" class="hangar-preview" width="70" height="50"></canvas>
                <div class="hangar-info">
                    <h3>${plane.name}</h3>
                    <p>${unlocked ? plane.desc : unlockText}</p>
                    <div class="hangar-stats">
                        <span class="hangar-stat">Hız: ${'●'.repeat(Math.round(plane.speed * 3))}${'○'.repeat(5 - Math.round(plane.speed * 3))}</span>
                        <span class="hangar-stat">Süzülme: ${'●'.repeat(Math.round((1.1 - plane.glide) * 8))}${'○'.repeat(5 - Math.round((1.1 - plane.glide) * 8))}</span>
                    </div>
                    <div class="hangar-stats"><span class="hangar-stat">${progressText}</span></div>
                </div>
                <span class="hangar-badge ${isSelected ? 'active' : 'unlock-info'}">
                    ${isSelected ? '✓ Seçili' : (!unlocked ? '🔒' : 'Seç')}
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

    updateHUD(distance, altitude, coins, turboFuel, maxTurbo) {
        document.getElementById('hud-distance').textContent = Math.floor(distance);
        document.getElementById('hud-altitude').textContent = Math.floor(altitude);
        document.getElementById('hud-coins').textContent = coins.toLocaleString('tr-TR');

        // Turbo çubuğu
        const turboBar = document.getElementById('turbo-bar-fill');
        const turboContainer = document.getElementById('turbo-bar-container');
        if (turboBar && turboContainer) {
            if (maxTurbo > 0) {
                turboContainer.style.display = 'block';
                const pct = Math.max(0, (turboFuel / maxTurbo) * 100);
                turboBar.style.width = pct + '%';
                turboBar.style.background = pct > 30 ? 'linear-gradient(90deg, #ff9800, #ffeb3b)' : '#f44336';
            } else {
                turboContainer.style.display = 'none';
            }
        }
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
        // Mesafe bonusu: hedef mesafeye oranla, fazlası azalan getiri
        const target = level.stars[0];
        const ratio = Math.min(distance / target, 3); // max 3x hedef kadar sayılır
        const distanceBonus = Math.floor(target * 0.05 * ratio);
        const starBonus = stars === 3 ? 100 : stars === 2 ? 50 : stars === 1 ? 20 : 0;
        const totalEarned = collectedCoins + distanceBonus + starBonus;

        const planeId = Storage.getSelectedPlane();
        Storage.addCoins(totalEarned);
        Storage.setStars(levelNum, stars, planeId);
        Storage.addDistance(distance);

        if (passed) {
            Storage.unlockLevel(levelNum + 1, planeId);
            // 50. level geçilince sonraki uçak açılır
            if (levelNum >= Levels.TOTAL_LEVELS) {
                const nextPlaneId = planeId + 1;
                if (nextPlaneId < Airplanes.list.length && !Storage.isPlaneUnlocked(nextPlaneId)) {
                    Storage.unlockPlane(nextPlaneId);
                }
            }
        }

        document.getElementById('result-title').textContent = passed ? 'Level Tamamlandı!' : 'Tekrar Dene!';
        document.getElementById('result-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        document.getElementById('result-stars').style.color = stars > 0 ? '#ffd54f' : '#666';
        document.getElementById('result-distance').textContent = `${Math.floor(distance)}m`;
        document.getElementById('result-collected').textContent = `💰 ${collectedCoins}`;
        document.getElementById('result-bonus').textContent = `💰 ${distanceBonus}`;
        document.getElementById('result-star-bonus').textContent = `💰 ${starBonus}`;
        document.getElementById('result-total').textContent = `💰 ${totalEarned}`;

        const nextBtn = document.getElementById('btn-next-level');
        nextBtn.style.display = (passed && levelNum < Levels.TOTAL_LEVELS) ? 'inline-block' : 'none';

        if (passed) Sounds.play('levelup');
        else Sounds.play('land');

        this.showScreen('result-screen');
    }
};
