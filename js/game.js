// ===== GAME - Ana Oyun Döngüsü =====
const Game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    state: 'menu', // menu, ready, aiming, flying, landed
    currentLevel: 1,
    cameraX: 0,
    groundY: 0,
    frameCount: 0,

    // Uçak durumu
    plane: {
        x: 0, y: 0,
        vx: 0, vy: 0,
        angle: 0,
        launched: false,
        landed: false,
        distance: 0,
        altitude: 0,
        startX: 0,
        turboFuel: 0,
        turboActive: false,
        bounces: 0
    },

    // Sürükle-bırak
    drag: {
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0
    },

    // Level objeleri
    coins: [],
    boosts: [],
    obstacles: [],
    collectedCoins: 0,
    comboCount: 0,
    comboTimer: 0,

    // Arka plan
    clouds: [],
    mountains: [],
    stars: [],

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input olayları
        this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e.clientX, e.clientY));
        this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e.clientX, e.clientY));
        this.canvas.addEventListener('mouseup', () => this.onPointerUp());
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this.onPointerDown(t.clientX, t.clientY);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this.onPointerMove(t.clientX, t.clientY);
        }, { passive: false });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.onPointerUp();
        }, { passive: false });

        // Turbo (boşluk tuşu)
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.state === 'flying') {
                e.preventDefault();
                if (this.plane.turboFuel > 0) {
                    this.plane.turboActive = true;
                }
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.plane.turboActive = false;
            }
        });

        // Ses başlat
        Sounds.init();
        this.canvas.addEventListener('click', () => Sounds.resume(), { once: true });

        // Arka plan oluştur
        this._generateBackground();

        // UI
        UI.showMainMenu();
        UI.updateCoinDisplays();

        // Ana döngü
        this.loop();
    },

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.groundY = this.height * 0.78;
        Physics.init(this.groundY);
    },

    // ===== LEVEL YÖNETİMİ =====
    startLevel(levelNum) {
        this.currentLevel = levelNum;
        Storage.setLevel(levelNum);
        this.state = 'ready';
        this.cameraX = 0;
        this.collectedCoins = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.frameCount = 0;

        // Uçağı sıfırla
        this.plane = {
            x: 120,
            y: this.groundY - 5,
            vx: 0, vy: 0,
            angle: 0,
            launched: false,
            landed: false,
            distance: 0,
            altitude: 0,
            startX: 120,
            turboFuel: 0,
            turboActive: false,
            bounces: 0
        };

        // Level objelerini oluştur
        this.coins = Levels.generateCoins(levelNum, this.width, this.height);
        this.boosts = Levels.generateBoosts(levelNum, this.width, this.height);
        this.obstacles = Levels.generateObstacles(levelNum, this.width, this.height);

        // Parçacıkları temizle
        Particles.clear();
        Physics.init(this.groundY);

        // Arka planı yenile
        this._generateBackground();

        UI.showGameHUD(levelNum);
    },

    retryLevel() {
        Sounds.play('click');
        this.startLevel(this.currentLevel);
    },

    nextLevel() {
        Sounds.play('click');
        if (this.currentLevel < 30) {
            this.startLevel(this.currentLevel + 1);
        } else {
            UI.showMainMenu();
        }
    },

    // ===== INPUT =====
    onPointerDown(x, y) {
        if (this.state === 'menu') return;
        Sounds.resume();

        if (this.state === 'ready') {
            this.state = 'aiming';
            this.drag.active = true;
            this.drag.startX = x;
            this.drag.startY = y;
            this.drag.currentX = x;
            this.drag.currentY = y;
        }
    },

    onPointerMove(x, y) {
        if (this.drag.active && this.state === 'aiming') {
            this.drag.currentX = x;
            this.drag.currentY = y;

            // Güç ve açıyı hesapla
            const dx = this.drag.startX - this.drag.currentX;
            const dy = this.drag.startY - this.drag.currentY;
            const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 200, 1);
            const angle = -Math.atan2(dy, dx);

            UI.showPowerIndicator(power, angle);
        }
    },

    onPointerUp() {
        if (!this.drag.active || this.state !== 'aiming') return;
        this.drag.active = false;

        const dx = this.drag.startX - this.drag.currentX;
        const dy = this.drag.startY - this.drag.currentY;
        const rawPower = Math.sqrt(dx * dx + dy * dy) / 200;
        const power = Math.min(rawPower, 1) * 18; // max hız
        const angle = -Math.atan2(dy, dx);

        if (power > 1) {
            Physics.launch(this.plane, angle, power);
            this.state = 'flying';
            Sounds.play('launch');
        } else {
            this.state = 'ready';
        }

        UI.hidePowerIndicator();
    },

    // ===== ANA DÖNGÜ =====
    loop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.loop());
    },

    update() {
        this.frameCount++;

        if (this.state === 'flying') {
            // Fizik güncelle
            const levelData = Levels.get(this.currentLevel);
            Physics.update(this.plane, levelData);

            // Kamera takibi
            const targetCamX = this.plane.x - this.width * 0.3;
            this.cameraX += (targetCamX - this.cameraX) * 0.08;
            if (this.cameraX < 0) this.cameraX = 0;

            // Uçak izi
            if (this.frameCount % 2 === 0) {
                const planeDef = Airplanes.list[Storage.getSelectedPlane()];
                Particles.add(this.plane.x, this.plane.y, 'trail', {
                    color: planeDef.trailColor,
                    count: 1
                });
            }

            // Turbo efekti
            if (this.plane.turboActive && this.plane.turboFuel > 0) {
                Particles.add(this.plane.x - 15, this.plane.y, 'boost', { count: 2 });
            }

            // Para toplama
            this._checkCoinCollision();

            // Boost kontrolü
            this._checkBoostCollision();

            // Engel kontrolü
            this._checkObstacleCollision();

            // Combo timer
            if (this.comboTimer > 0) {
                this.comboTimer--;
                if (this.comboTimer <= 0) this.comboCount = 0;
            }

            // HUD güncelle
            UI.updateHUD(this.plane.distance, this.plane.altitude, Storage.getCoins());

            // Uçak yere indi mi?
            if (this.plane.landed) {
                this.state = 'landed';
                Sounds.play('land');
                Particles.add(this.plane.x, this.groundY, 'land', { count: 15 });

                setTimeout(() => {
                    const passed = Levels.isLevelPassed(this.currentLevel, this.plane.distance);
                    UI.showResult(this.currentLevel, this.plane.distance, this.collectedCoins, passed);
                }, 800);
            }
        }

        // Engelleri güncelle (kuşlar hareket eder)
        if (this.state === 'flying' || this.state === 'ready') {
            for (const obs of this.obstacles) {
                if (obs.type === 'bird' && !obs.hit) {
                    obs.x += obs.vx;
                }
            }
        }

        // Parçacık güncelle
        Particles.update();
    },

    _checkCoinCollision() {
        const magnetRange = Physics.getUpgradeMultipliers().magnetRange;

        for (const coin of this.coins) {
            if (coin.collected) continue;

            const dx = this.plane.x - coin.x;
            const dy = this.plane.y - coin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Mıknatıs etkisi
            if (magnetRange > 0 && dist < magnetRange) {
                coin.x += dx * 0.08;
                coin.y += dy * 0.08;
            }

            if (dist < coin.radius + 15) {
                coin.collected = true;
                this.comboCount++;
                this.comboTimer = 60;
                const multiplier = Math.min(this.comboCount, 5);
                const earnedValue = coin.value * multiplier;
                this.collectedCoins += earnedValue;

                Sounds.play('coin');
                Particles.add(coin.x, coin.y, 'coin', { count: 8 });
                Particles.add(coin.x, coin.y - 20, 'text', {
                    text: `+${earnedValue}${multiplier > 1 ? ` x${multiplier}` : ''}`,
                    color: multiplier > 1 ? '#ff9800' : '#ffd54f',
                    fontSize: 14 + multiplier * 2,
                    count: 1
                });
            }
        }
    },

    _checkBoostCollision() {
        for (const boost of this.boosts) {
            if (!boost.active) continue;

            if (this.plane.x > boost.x - boost.width / 2 &&
                this.plane.x < boost.x + boost.width / 2 &&
                this.plane.y > boost.y - boost.height / 2 &&
                this.plane.y < boost.y + boost.height / 2) {
                boost.active = false;
                this.plane.vx *= 1.6;
                this.plane.vy *= 0.5;
                Sounds.play('boost');
                Particles.add(boost.x, boost.y, 'star', {
                    count: 12,
                    color: '#00e5ff'
                });
            }
        }
    },

    _checkObstacleCollision() {
        for (const obs of this.obstacles) {
            if (obs.hit) continue;

            const dx = this.plane.x - obs.x;
            const dy = this.plane.y - obs.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < obs.width) {
                obs.hit = true;
                if (obs.type === 'bird') {
                    this.plane.vx *= 0.6;
                    this.plane.vy += 2;
                } else {
                    // Bulut - yavaşlatma
                    this.plane.vx *= 0.85;
                }
                Sounds.play('wind');
            }
        }
    },

    // ===== RENDER =====
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const levelData = this.state !== 'menu'
            ? Levels.get(this.currentLevel)
            : Levels.get(1);

        // Arka plan
        this._drawBackground(ctx, levelData);

        // Zemin
        this._drawGround(ctx, levelData);

        // Fırlatma platformu
        if (this.state === 'ready' || this.state === 'aiming') {
            this._drawLaunchPad(ctx);
        }

        // Nişan çizgisi
        if (this.state === 'aiming' && this.drag.active) {
            this._drawAimLine(ctx);
        }

        // Boost zonları
        this._drawBoosts(ctx);

        // Paralar
        this._drawCoins(ctx);

        // Engeller
        this._drawObstacles(ctx);

        // Uçak
        if (this.state !== 'menu') {
            this._drawPlane(ctx);
        }

        // Rüzgar göstergesi
        if (this.state === 'flying') {
            this._drawWindIndicator(ctx);
        }

        // Parçacıklar
        Particles.draw(ctx, this.cameraX);
    },

    _drawBackground(ctx, levelData) {
        const theme = levelData.theme;

        // Gökyüzü gradyanı
        const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
        grad.addColorStop(0, theme.sky1);
        grad.addColorStop(1, theme.sky2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Yıldızlar (gece temaları için)
        const themeIdx = Math.floor((this.currentLevel - 1) / 5);
        if (themeIdx >= 4) {
            for (const star of this.stars) {
                const sx = ((star.x - this.cameraX * 0.02) % this.width + this.width) % this.width;
                const flicker = 0.5 + Math.sin(this.frameCount * star.speed + star.phase) * 0.5;
                ctx.beginPath();
                ctx.arc(sx, star.y, star.size * flicker, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${0.4 + flicker * 0.6})`;
                ctx.fill();
            }
        }

        // Dağlar (parallax)
        ctx.fillStyle = this._adjustColor(theme.ground, -30);
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        for (const m of this.mountains) {
            const mx = ((m.x - this.cameraX * 0.15) % (this.width * 2) + this.width * 2) % (this.width * 2);
            ctx.lineTo(mx, this.groundY - m.height);
        }
        ctx.lineTo(this.width, this.groundY);
        ctx.closePath();
        ctx.fill();

        // Bulutlar
        for (const cloud of this.clouds) {
            const cx = ((cloud.x - this.cameraX * cloud.speed) % (this.width + 200) + this.width + 200) % (this.width + 200) - 100;
            ctx.save();
            ctx.globalAlpha = cloud.opacity;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(cx, cloud.y, cloud.w, cloud.h, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx - cloud.w * 0.5, cloud.y + 5, cloud.w * 0.6, cloud.h * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + cloud.w * 0.4, cloud.y + 3, cloud.w * 0.5, cloud.h * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },

    _drawGround(ctx, levelData) {
        const theme = levelData.theme;

        // Ana zemin
        ctx.fillStyle = theme.ground;
        ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);

        // Zemin çim çizgileri
        ctx.strokeStyle = this._adjustColor(theme.ground, 15);
        ctx.lineWidth = 2;
        for (let i = 0; i < this.width; i += 20) {
            const offsetX = ((i - this.cameraX * 0.5) % this.width + this.width) % this.width;
            const h = 5 + Math.sin(i * 0.3) * 3;
            ctx.beginPath();
            ctx.moveTo(offsetX, this.groundY);
            ctx.lineTo(offsetX - 2, this.groundY - h);
            ctx.stroke();
        }

        // Hedef mesafe çizgisi
        if (this.state !== 'menu') {
            const level = Levels.get(this.currentLevel);
            for (let s = 0; s < 3; s++) {
                const targetX = this.plane.startX + level.stars[s] * 10 - this.cameraX;
                if (targetX > -50 && targetX < this.width + 50) {
                    const colors = ['#ff9800', '#ffd54f', '#00e676'];
                    ctx.save();
                    ctx.setLineDash([8, 6]);
                    ctx.strokeStyle = colors[s];
                    ctx.globalAlpha = 0.4;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(targetX, 0);
                    ctx.lineTo(targetX, this.groundY);
                    ctx.stroke();
                    // Etiket
                    ctx.globalAlpha = 0.7;
                    ctx.setLineDash([]);
                    ctx.fillStyle = colors[s];
                    ctx.font = 'bold 11px Nunito';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${'★'.repeat(s + 1)} ${level.stars[s]}m`, targetX, 20);
                    ctx.restore();
                }
            }
        }
    },

    _drawLaunchPad(ctx) {
        const px = this.plane.x - this.cameraX;
        const py = this.groundY;

        // Platform
        ctx.fillStyle = '#546e7a';
        ctx.fillRect(px - 30, py - 3, 60, 6);
        ctx.fillStyle = '#ff9800';
        ctx.fillRect(px - 25, py - 4, 50, 2);

        // "Sürükle" yazısı
        if (this.state === 'ready') {
            const pulse = 0.6 + Math.sin(this.frameCount * 0.05) * 0.4;
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Nunito';
            ctx.textAlign = 'center';
            ctx.fillText('← Sürükle & Bırak →', px, py - 40);
            ctx.font = '13px Nunito';
            ctx.fillStyle = '#88ccff';
            ctx.fillText('Geri çek ve bırak!', px, py - 22);
            ctx.restore();
        }
    },

    _drawAimLine(ctx) {
        const px = this.plane.x - this.cameraX;
        const py = this.plane.y;

        const dx = this.drag.startX - this.drag.currentX;
        const dy = this.drag.startY - this.drag.currentY;
        const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 200, 1);
        const angle = Math.atan2(dy, dx);

        // Nişan çizgisi
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = `rgba(255,255,255,${0.3 + power * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        const lineLen = 80 + power * 120;
        ctx.lineTo(
            px + Math.cos(-angle) * lineLen,
            py + Math.sin(-angle) * lineLen
        );
        ctx.stroke();
        ctx.setLineDash([]);

        // Ok ucu
        const tipX = px + Math.cos(-angle) * lineLen;
        const tipY = py + Math.sin(-angle) * lineLen;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
        ctx.fillStyle = power > 0.7 ? '#ff5722' : power > 0.3 ? '#ffd54f' : '#00e676';
        ctx.fill();
        ctx.restore();
    },

    _drawCoins(ctx) {
        for (const coin of this.coins) {
            if (coin.collected) continue;
            const sx = coin.x - this.cameraX;
            if (sx < -30 || sx > this.width + 30) continue;

            const bob = Math.sin(this.frameCount * 0.06 + coin.bobOffset) * 5;
            coin.rotation += 0.04;

            ctx.save();
            ctx.translate(sx, coin.y + bob);

            // Glow
            ctx.beginPath();
            ctx.arc(0, 0, coin.radius + 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,213,79,0.2)';
            ctx.fill();

            // Para
            const scaleX = Math.abs(Math.cos(coin.rotation));
            ctx.scale(scaleX || 0.1, 1);
            ctx.beginPath();
            ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
            const coinGrad = ctx.createRadialGradient(0, -3, 2, 0, 0, coin.radius);
            coinGrad.addColorStop(0, '#fff176');
            coinGrad.addColorStop(0.5, '#ffd54f');
            coinGrad.addColorStop(1, '#f9a825');
            ctx.fillStyle = coinGrad;
            ctx.fill();
            ctx.strokeStyle = '#f57f17';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // $ işareti
            if (scaleX > 0.3) {
                ctx.fillStyle = '#f57f17';
                ctx.font = `bold ${coin.radius}px Fredoka One`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('$', 0, 1);
            }
            ctx.restore();
        }
    },

    _drawBoosts(ctx) {
        for (const boost of this.boosts) {
            if (!boost.active) continue;
            const sx = boost.x - this.cameraX;
            if (sx < -80 || sx > this.width + 80) continue;

            const glow = 0.6 + Math.sin(this.frameCount * 0.08) * 0.4;

            ctx.save();
            ctx.translate(sx, boost.y);

            // Glow arka plan
            ctx.beginPath();
            ctx.roundRect(-boost.width / 2 - 5, -boost.height / 2 - 5, boost.width + 10, boost.height + 10, 10);
            ctx.fillStyle = `rgba(0,229,255,${glow * 0.2})`;
            ctx.fill();

            // Çerçeve
            ctx.beginPath();
            ctx.roundRect(-boost.width / 2, -boost.height / 2, boost.width, boost.height, 8);
            ctx.fillStyle = `rgba(0,229,255,${0.15 + glow * 0.1})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(0,229,255,${0.6 + glow * 0.4})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            // ⚡ simgesi
            ctx.fillStyle = '#00e5ff';
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡ BOOST', 0, 0);

            ctx.restore();
        }
    },

    _drawObstacles(ctx) {
        for (const obs of this.obstacles) {
            if (obs.hit) continue;
            const sx = obs.x - this.cameraX;
            if (sx < -60 || sx > this.width + 60) continue;

            ctx.save();
            ctx.translate(sx, obs.y);

            if (obs.type === 'bird') {
                // Kuş
                const wing = Math.sin(this.frameCount * 0.15) * 8;
                ctx.fillStyle = '#37474f';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(-10, -wing - 5, -15, -wing);
                ctx.quadraticCurveTo(-5, -2, 0, 0);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(10, -wing - 5, 15, -wing);
                ctx.quadraticCurveTo(5, -2, 0, 0);
                ctx.fill();
                // Gövde
                ctx.beginPath();
                ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#455a64';
                ctx.fill();
            } else {
                // Bulut (engel)
                ctx.globalAlpha = 0.7;
                ctx.fillStyle = '#90a4ae';
                ctx.beginPath();
                ctx.ellipse(0, 0, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(-15, 5, 20, 12, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(12, 3, 16, 10, 0, 0, Math.PI * 2);
                ctx.fill();
                // ⚠ işareti
                ctx.globalAlpha = 0.5 + Math.sin(this.frameCount * 0.1) * 0.3;
                ctx.fillStyle = '#ff5722';
                ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('⚠', 0, -obs.height / 2 - 8);
            }
            ctx.restore();
        }
    },

    _drawPlane(ctx) {
        const planeDef = Airplanes.list[Storage.getSelectedPlane()];
        const screenX = this.plane.x - this.cameraX;
        const screenY = this.plane.y;

        // Gölge
        if (this.plane.y < this.groundY - 5) {
            const shadowY = this.groundY + 2;
            const shadowScale = Math.max(0.2, 1 - (this.groundY - this.plane.y) / 500);
            ctx.save();
            ctx.globalAlpha = 0.2 * shadowScale;
            ctx.beginPath();
            ctx.ellipse(screenX, shadowY, 20 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.restore();
        }

        planeDef.draw(ctx, screenX, screenY, this.plane.angle);
    },

    _drawWindIndicator(ctx) {
        if (Math.abs(Physics.windX) < 0.05) return;

        ctx.save();
        ctx.globalAlpha = 0.6;
        const wx = this.width - 80;
        const wy = 70;

        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.roundRect(wx - 30, wy - 20, 60, 40, 8);
        ctx.fill();

        ctx.fillStyle = '#88ccff';
        ctx.font = 'bold 12px Nunito';
        ctx.textAlign = 'center';
        ctx.fillText('Rüzgar', wx, wy - 5);

        // Ok
        const arrowLen = Physics.windX * 15;
        ctx.strokeStyle = Physics.windX > 0 ? '#ff9800' : '#4fc3f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(wx - arrowLen, wy + 10);
        ctx.lineTo(wx + arrowLen, wy + 10);
        ctx.stroke();

        // Ok ucu
        const tipDir = Physics.windX > 0 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(wx + arrowLen, wy + 10);
        ctx.lineTo(wx + arrowLen - tipDir * 6, wy + 6);
        ctx.lineTo(wx + arrowLen - tipDir * 6, wy + 14);
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();

        ctx.restore();
    },

    // ===== ARKA PLAN OLUŞTUR =====
    _generateBackground() {
        this.clouds = [];
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: Math.random() * this.width * 2,
                y: 50 + Math.random() * this.groundY * 0.5,
                w: 30 + Math.random() * 50,
                h: 15 + Math.random() * 20,
                speed: 0.05 + Math.random() * 0.15,
                opacity: 0.2 + Math.random() * 0.4
            });
        }

        this.mountains = [];
        for (let i = 0; i < 20; i++) {
            this.mountains.push({
                x: i * (this.width * 2 / 20) + Math.random() * 100,
                height: 30 + Math.random() * 80
            });
        }

        this.stars = [];
        for (let i = 0; i < 60; i++) {
            this.stars.push({
                x: Math.random() * this.width * 3,
                y: Math.random() * this.groundY * 0.6,
                size: 0.5 + Math.random() * 2,
                speed: 0.02 + Math.random() * 0.05,
                phase: Math.random() * Math.PI * 2
            });
        }
    },

    _adjustColor(hex, amount) {
        let r = parseInt(hex.slice(1, 3), 16) + amount;
        let g = parseInt(hex.slice(3, 5), 16) + amount;
        let b = parseInt(hex.slice(5, 7), 16) + amount;
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        return `rgb(${r},${g},${b})`;
    }
};

// Sayfa yüklenince başlat
window.addEventListener('DOMContentLoaded', () => Game.init());
