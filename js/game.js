// ===== GAME - Ana Oyun Döngüsü (v3) =====
const Game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    state: 'menu',
    currentLevel: 1,
    cameraX: 0,
    groundY: 0,
    frameCount: 0,

    plane: {
        x: 0, y: 0, vx: 0, vy: 0, angle: 0,
        launched: false, landed: false,
        distance: 0, altitude: 0, startX: 0,
        turboFuel: 0, maxTurboFuel: 0,
        turboActive: false, bounces: 0
    },

    drag: { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 },

    coins: [],
    boosts: [],
    obstacles: [],
    ramps: [],
    paperPlanes: [],
    collectedCoins: 0,
    comboCount: 0,
    comboTimer: 0,
    lastCoinGenX: 0, // dinamik para üretimi için

    clouds: [],
    bgLayers: [],
    stars: [],

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Mouse — sürükle bırak düzeltmesi: document üzerinden dinle
        this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e.clientX, e.clientY));
        document.addEventListener('mousemove', (e) => this.onPointerMove(e.clientX, e.clientY));
        document.addEventListener('mouseup', () => this.onPointerUp());

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
        document.addEventListener('touchmove', (e) => {
            if (this.drag.active) e.preventDefault();
            if (e.touches[0]) this.onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
        document.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.onPointerUp();
        }, { passive: false });

        // Turbo
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.state === 'flying') {
                e.preventDefault();
                if (this.plane.turboFuel > 0) this.plane.turboActive = true;
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') this.plane.turboActive = false;
        });

        Sounds.init();
        this.canvas.addEventListener('click', () => Sounds.resume(), { once: true });
        this._generateBackground();
        UI.showMainMenu();
        UI.updateCoinDisplays();
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

    // ===== LEVEL =====
    startLevel(levelNum) {
        this.currentLevel = levelNum;
        Storage.setLevel(levelNum);
        this.state = 'ready';
        this.cameraX = 0;
        this.collectedCoins = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.frameCount = 0;
        this.lastCoinGenX = 0;

        this.plane = {
            x: 120, y: this.groundY - 5,
            vx: 0, vy: 0, angle: 0,
            launched: false, landed: false,
            distance: 0, altitude: 0, startX: 120,
            turboFuel: 0, maxTurboFuel: 0,
            turboActive: false, bounces: 0
        };

        this.coins = Levels.generateCoins(levelNum, this.width, this.height);
        this.boosts = Levels.generateBoosts(levelNum, this.width, this.height);
        this.obstacles = Levels.generateObstacles(levelNum, this.width, this.height);
        this.ramps = Levels.generateRamps(levelNum, this.width, this.height);
        this.paperPlanes = Levels.generatePaperPlanes(levelNum, this.width, this.height);

        Particles.clear();
        Physics.init(this.groundY);
        this._generateBackground();
        UI.showGameHUD(levelNum);
    },

    retryLevel() { Sounds.play('click'); this.startLevel(this.currentLevel); },
    nextLevel() {
        Sounds.play('click');
        if (this.currentLevel < Levels.TOTAL_LEVELS) this.startLevel(this.currentLevel + 1);
        else UI.showMainMenu();
    },

    // ===== SÜRÜKLE-BIRAK (düzeltilmiş) =====
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
            const dx = this.drag.startX - this.drag.currentX;
            const dy = this.drag.startY - this.drag.currentY;
            // Mesafe ne kadar büyük olursa güç o kadar fazla (ekran boyutuna orantılı)
            const maxDragDist = Math.min(this.width, this.height) * 0.4;
            const rawDist = Math.sqrt(dx * dx + dy * dy);
            const power = Math.min(rawDist / maxDragDist, 1);
            const angle = -Math.atan2(dy, dx);
            UI.showPowerIndicator(power, angle);
        }
    },

    onPointerUp() {
        if (!this.drag.active || this.state !== 'aiming') return;
        this.drag.active = false;

        const dx = this.drag.startX - this.drag.currentX;
        const dy = this.drag.startY - this.drag.currentY;
        const maxDragDist = Math.min(this.width, this.height) * 0.4;
        const rawDist = Math.sqrt(dx * dx + dy * dy);
        const power = Math.min(rawDist / maxDragDist, 1) * 18;
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
            const levelData = Levels.get(this.currentLevel);
            Physics.update(this.plane, levelData);

            // Kamera — daha agresif takip
            const targetCamX = this.plane.x - this.width * 0.25;
            const camSpeed = Math.min(0.25, 0.08 + Math.abs(this.plane.vx) * 0.01);
            this.cameraX += (targetCamX - this.cameraX) * camSpeed;
            if (this.cameraX < 0) this.cameraX = 0;

            // İz
            if (this.frameCount % 2 === 0) {
                const planeDef = Airplanes.list[Storage.getSelectedPlane()];
                Particles.add(this.plane.x, this.plane.y, 'trail', { color: planeDef.trailColor, count: 1 });
            }

            // Turbo efekti
            if (this.plane.turboActive && this.plane.turboFuel > 0) {
                Particles.add(this.plane.x - 15, this.plane.y, 'boost', { count: 2 });
            }

            this._checkCoinCollision();
            this._checkBoostCollision();
            this._checkObstacleCollision();
            this._checkRampCollision();
            this._checkPaperPlaneCollision();
            this._dynamicCoinGeneration();

            if (this.comboTimer > 0) {
                this.comboTimer--;
                if (this.comboTimer <= 0) this.comboCount = 0;
            }

            UI.updateHUD(
                this.plane.distance, this.plane.altitude,
                Storage.getCoins(),
                this.plane.turboFuel, this.plane.maxTurboFuel
            );

            // İniş
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

        // Kuşlar hareketli
        if (this.state === 'flying' || this.state === 'ready') {
            for (const obs of this.obstacles) {
                if (obs.type === 'bird' && !obs.hit) obs.x += obs.vx;
            }
        }

        Particles.update();
    },

    // === DİNAMİK PARA ÜRETİMİ (800m+ sorunu çözümü) ===
    _dynamicCoinGeneration() {
        const currentX = this.plane.x;
        const genThreshold = 800; // her 800px'de yeni paralar
        if (currentX > this.lastCoinGenX + genThreshold) {
            this.lastCoinGenX = currentX;
            const count = 3 + Math.floor(Math.random() * 4);
            for (let i = 0; i < count; i++) {
                this.coins.push({
                    x: currentX + 200 + Math.random() * 600,
                    y: this.groundY * 0.1 + Math.random() * this.groundY * 0.65,
                    radius: 12,
                    value: 5 + Math.floor(Math.random() * 3) * 5,
                    collected: false,
                    bobOffset: Math.random() * Math.PI * 2,
                    rotation: 0
                });
            }
            // Arada kağıt uçak da ekle
            if (Math.random() > 0.4) {
                this.paperPlanes.push({
                    x: currentX + 300 + Math.random() * 500,
                    y: this.groundY * 0.15 + Math.random() * this.groundY * 0.5,
                    radius: 18,
                    collected: false,
                    bobOffset: Math.random() * Math.PI * 2,
                    rotation: 0
                });
            }
            // Arada rampa ekle
            if (Math.random() > 0.5) {
                this.ramps.push({
                    x: currentX + 400 + Math.random() * 400,
                    y: this.groundY,
                    width: 80, height: 30,
                    used: false
                });
            }
        }
    },

    _checkCoinCollision() {
        const magnetRange = Physics.getUpgradeMultipliers().magnetRange;
        for (const coin of this.coins) {
            if (coin.collected) continue;
            const dx = this.plane.x - coin.x;
            const dy = this.plane.y - coin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

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
                    fontSize: 14 + multiplier * 2, count: 1
                });
            }
        }
    },

    _checkBoostCollision() {
        for (const boost of this.boosts) {
            if (!boost.active) continue;
            if (this.plane.x > boost.x - boost.width / 2 && this.plane.x < boost.x + boost.width / 2 &&
                this.plane.y > boost.y - boost.height / 2 && this.plane.y < boost.y + boost.height / 2) {
                boost.active = false;
                this.plane.vx *= 1.6;
                this.plane.vy *= 0.5;
                Sounds.play('boost');
                Particles.add(boost.x, boost.y, 'star', { count: 12, color: '#00e5ff' });
            }
        }
    },

    _checkObstacleCollision() {
        for (const obs of this.obstacles) {
            if (obs.hit) continue;
            const dx = this.plane.x - obs.x;
            const dy = this.plane.y - obs.y;
            if (Math.sqrt(dx * dx + dy * dy) < obs.width) {
                obs.hit = true;
                if (obs.type === 'bird') { this.plane.vx *= 0.6; this.plane.vy += 2; }
                else { this.plane.vx *= 0.85; }
                Sounds.play('wind');
            }
        }
    },

    // === RAMPA ÇARPMASI ===
    _checkRampCollision() {
        for (const ramp of this.ramps) {
            if (ramp.used) continue;
            // Uçak yere yakın ve rampa alanında mı?
            if (this.plane.y >= this.groundY - 20 &&
                this.plane.x > ramp.x - ramp.width / 2 &&
                this.plane.x < ramp.x + ramp.width / 2 &&
                Math.abs(this.plane.vx) > 1) {
                ramp.used = true;
                Physics.applyRampBoost(this.plane);
                Sounds.play('boost');
                Particles.add(ramp.x, ramp.y - 10, 'star', { count: 10, color: '#ffd54f' });
                // sadece yıldız efekti, yazı yok
            }
        }
    },

    // === KAĞIT UÇAK COLLECTİBLE ===
    _checkPaperPlaneCollision() {
        for (const pp of this.paperPlanes) {
            if (pp.collected) continue;
            const dx = this.plane.x - pp.x;
            const dy = this.plane.y - pp.y;
            if (Math.sqrt(dx * dx + dy * dy) < pp.radius + 15) {
                pp.collected = true;
                Physics.applyPaperBoost(this.plane);
                Sounds.play('boost');
                Particles.add(pp.x, pp.y, 'star', { count: 15, color: '#88ccff' });
            }
        }
    },

    // ===== RENDER =====
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        const levelData = this.state !== 'menu' ? Levels.get(this.currentLevel) : Levels.get(1);

        this._drawBackground(ctx, levelData);
        this._drawGround(ctx, levelData);
        this._drawRamps(ctx);

        if (this.state === 'ready' || this.state === 'aiming') this._drawLaunchPad(ctx);
        if (this.state === 'aiming' && this.drag.active) this._drawAimLine(ctx);

        this._drawBoosts(ctx);
        this._drawCoins(ctx);
        this._drawPaperPlanes(ctx);
        this._drawObstacles(ctx);

        if (this.state !== 'menu') this._drawPlane(ctx);
        if (this.state === 'flying') this._drawWindIndicator(ctx);

        Particles.draw(ctx, this.cameraX);
    },

    // ===== İYİLEŞTİRİLMİŞ ARKA PLAN =====
    _drawBackground(ctx, levelData) {
        const theme = levelData.theme;

        // Gökyüzü gradyan
        const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
        grad.addColorStop(0, theme.sky1);
        grad.addColorStop(1, theme.sky2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Yıldızlar (gece temaları)
        const themeIdx = Math.floor((this.currentLevel - 1) / 5);
        if (themeIdx >= 4) {
            for (const star of this.stars) {
                const sx = ((star.x - this.cameraX * 0.02) % (this.width + 100) + this.width + 100) % (this.width + 100);
                const flicker = 0.5 + Math.sin(this.frameCount * star.speed + star.phase) * 0.5;
                ctx.beginPath();
                ctx.arc(sx, star.y, star.size * flicker, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${0.3 + flicker * 0.7})`;
                ctx.fill();
            }
        }

        // Dağlar — 3 katmanlı parallax (prosedürel sinüs)
        const layerConfigs = [
            { parallax: 0.04, baseH: 90, color: this.bgLayers[0]?.color || '#1a3a2a', alpha: 0.35, freq1: 0.003, freq2: 0.008 },
            { parallax: 0.08, baseH: 65, color: this.bgLayers[1]?.color || '#2d5a3d', alpha: 0.5, freq1: 0.005, freq2: 0.012 },
            { parallax: 0.13, baseH: 40, color: this.bgLayers[2]?.color || '#3d7a50', alpha: 0.7, freq1: 0.007, freq2: 0.02 }
        ];
        for (const lc of layerConfigs) {
            const offsetX = this.cameraX * lc.parallax;
            ctx.save();
            ctx.globalAlpha = lc.alpha;
            ctx.fillStyle = lc.color;
            ctx.beginPath();
            ctx.moveTo(0, this.groundY);
            for (let x = 0; x <= this.width; x += 4) {
                const wx = x + offsetX;
                const h = lc.baseH *
                    (0.5 + 0.3 * Math.sin(wx * lc.freq1) + 0.2 * Math.sin(wx * lc.freq2 + 1.5));
                ctx.lineTo(x, this.groundY - h);
            }
            ctx.lineTo(this.width, this.groundY);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // Bulutlar — detaylı
        for (const cloud of this.clouds) {
            const cx = ((cloud.x - this.cameraX * cloud.speed) % (this.width + 300) + this.width + 300) % (this.width + 300) - 150;
            ctx.save();
            ctx.globalAlpha = cloud.opacity;

            // Gölge
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            for (const blob of cloud.blobs) {
                ctx.beginPath();
                ctx.ellipse(cx + blob.ox + 3, cloud.y + blob.oy + 3, blob.rx, blob.ry, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // Ana bulut
            const cloudGrad = ctx.createRadialGradient(cx, cloud.y - 5, 5, cx, cloud.y, cloud.mainR * 1.5);
            cloudGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
            cloudGrad.addColorStop(1, 'rgba(220,230,240,0.6)');
            ctx.fillStyle = cloudGrad;
            for (const blob of cloud.blobs) {
                ctx.beginPath();
                ctx.ellipse(cx + blob.ox, cloud.y + blob.oy, blob.rx, blob.ry, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    },

    _drawGround(ctx, levelData) {
        const theme = levelData.theme;

        // Ana zemin gradyan
        const gGrad = ctx.createLinearGradient(0, this.groundY, 0, this.height);
        gGrad.addColorStop(0, theme.ground);
        gGrad.addColorStop(1, theme.groundDark || theme.ground);
        ctx.fillStyle = gGrad;
        ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);

        // Çim dokusu
        ctx.strokeStyle = this._adjustColor(theme.ground, 20);
        ctx.lineWidth = 1.5;
        for (let i = 0; i < this.width + 30; i += 12) {
            const wx = i + ((this.cameraX * 0.5) % 12);
            const actualX = (i - (this.cameraX * 0.5) % 12 + 1200) % this.width;
            const h = 4 + Math.sin(wx * 0.2) * 3 + Math.sin(wx * 0.07) * 2;
            ctx.beginPath();
            ctx.moveTo(actualX, this.groundY);
            ctx.quadraticCurveTo(actualX - 1, this.groundY - h * 0.6, actualX - 2, this.groundY - h);
            ctx.stroke();
        }

        // Hedef çizgileri
        if (this.state !== 'menu') {
            const level = Levels.get(this.currentLevel);
            const colors = ['#ff9800', '#ffd54f', '#00e676'];
            for (let s = 0; s < 3; s++) {
                const targetX = this.plane.startX + level.stars[s] * 10 - this.cameraX;
                if (targetX > -50 && targetX < this.width + 50) {
                    ctx.save();
                    ctx.setLineDash([8, 6]);
                    ctx.strokeStyle = colors[s];
                    ctx.globalAlpha = 0.35;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(targetX, 0);
                    ctx.lineTo(targetX, this.groundY);
                    ctx.stroke();
                    ctx.globalAlpha = 0.6;
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

    // === RAMPALAR ===
    _drawRamps(ctx) {
        for (const ramp of this.ramps) {
            const sx = ramp.x - this.cameraX;
            if (sx < -100 || sx > this.width + 100) continue;

            ctx.save();
            ctx.translate(sx, ramp.y);

            // Rampa gövde
            ctx.beginPath();
            ctx.moveTo(-ramp.width / 2, 0);
            ctx.lineTo(-ramp.width / 2 + 10, -ramp.height);
            ctx.lineTo(ramp.width / 2, -ramp.height * 0.4);
            ctx.lineTo(ramp.width / 2, 0);
            ctx.closePath();

            const rampGrad = ctx.createLinearGradient(0, -ramp.height, 0, 0);
            rampGrad.addColorStop(0, ramp.used ? '#666' : '#ff9800');
            rampGrad.addColorStop(1, ramp.used ? '#444' : '#e65100');
            ctx.fillStyle = rampGrad;
            ctx.fill();
            ctx.strokeStyle = ramp.used ? '#555' : '#fff3e0';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Şerit çizgiler
            if (!ramp.used) {
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    const lx = -ramp.width / 2 + 15 + i * 15;
                    ctx.beginPath();
                    ctx.moveTo(lx, -2);
                    ctx.lineTo(lx + 5, -ramp.height * 0.7);
                    ctx.stroke();
                }
            }

            // Ok işareti
            if (!ramp.used) {
                const bounce = Math.sin(this.frameCount * 0.08) * 3;
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('↗', 0, -ramp.height - 5 + bounce);
            }
            ctx.restore();
        }
    },

    // === KAĞIT UÇAK COLLECTİBLE ÇİZİMİ ===
    _drawPaperPlanes(ctx) {
        for (const pp of this.paperPlanes) {
            if (pp.collected) continue;
            const sx = pp.x - this.cameraX;
            if (sx < -40 || sx > this.width + 40) continue;

            const bob = Math.sin(this.frameCount * 0.05 + pp.bobOffset) * 6;
            pp.rotation += 0.02;

            ctx.save();
            ctx.translate(sx, pp.y + bob);
            ctx.rotate(Math.sin(pp.rotation) * 0.2);

            // Glow
            ctx.beginPath();
            ctx.arc(0, 0, pp.radius + 6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100,200,255,0.15)';
            ctx.fill();

            // Daire arka plan
            ctx.beginPath();
            ctx.arc(0, 0, pp.radius, 0, Math.PI * 2);
            const ppGrad = ctx.createRadialGradient(0, -3, 3, 0, 0, pp.radius);
            ppGrad.addColorStop(0, 'rgba(130,210,255,0.9)');
            ppGrad.addColorStop(1, 'rgba(50,150,220,0.7)');
            ctx.fillStyle = ppGrad;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Kağıt uçak simgesi
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-6, -6);
            ctx.lineTo(-3, 0);
            ctx.lineTo(-6, 6);
            ctx.closePath();
            ctx.fill();

            // + işareti
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px Nunito';
            ctx.textAlign = 'center';
            // yazı yok, sadece simge
            ctx.restore();
        }
    },

    _drawLaunchPad(ctx) {
        const px = this.plane.x - this.cameraX;
        const py = this.groundY;

        ctx.fillStyle = '#546e7a';
        ctx.fillRect(px - 30, py - 3, 60, 6);
        ctx.fillStyle = '#ff9800';
        ctx.fillRect(px - 25, py - 4, 50, 2);

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
        const maxDragDist = Math.min(this.width, this.height) * 0.4;
        const power = Math.min(Math.sqrt(dx * dx + dy * dy) / maxDragDist, 1);
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = `rgba(255,255,255,${0.3 + power * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        const lineLen = 80 + power * 120;
        ctx.lineTo(px + Math.cos(-angle) * lineLen, py + Math.sin(-angle) * lineLen);
        ctx.stroke();
        ctx.setLineDash([]);

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
            ctx.beginPath();
            ctx.arc(0, 0, coin.radius + 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,213,79,0.2)';
            ctx.fill();
            const scaleX = Math.abs(Math.cos(coin.rotation));
            ctx.scale(scaleX || 0.1, 1);
            ctx.beginPath();
            ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
            const cg = ctx.createRadialGradient(0, -3, 2, 0, 0, coin.radius);
            cg.addColorStop(0, '#fff176'); cg.addColorStop(0.5, '#ffd54f'); cg.addColorStop(1, '#f9a825');
            ctx.fillStyle = cg;
            ctx.fill();
            ctx.strokeStyle = '#f57f17'; ctx.lineWidth = 1.5; ctx.stroke();
            if (scaleX > 0.3) {
                ctx.fillStyle = '#f57f17'; ctx.font = `bold ${coin.radius}px Fredoka One`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 1);
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
            ctx.beginPath();
            ctx.roundRect(-boost.width / 2 - 5, -boost.height / 2 - 5, boost.width + 10, boost.height + 10, 10);
            ctx.fillStyle = `rgba(0,229,255,${glow * 0.2})`;
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(-boost.width / 2, -boost.height / 2, boost.width, boost.height, 8);
            ctx.fillStyle = `rgba(0,229,255,${0.15 + glow * 0.1})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(0,229,255,${0.6 + glow * 0.4})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('⚡', 0, 0);
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
                ctx.beginPath();
                ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#455a64';
                ctx.fill();
            } else {
                ctx.globalAlpha = 0.7;
                ctx.fillStyle = '#90a4ae';
                ctx.beginPath();
                ctx.ellipse(0, 0, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath(); ctx.ellipse(-15, 5, 20, 12, 0, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(12, 3, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 0.5 + Math.sin(this.frameCount * 0.1) * 0.3;
                ctx.fillStyle = '#ff5722'; ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center'; ctx.fillText('⚠', 0, -obs.height / 2 - 8);
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
        ctx.beginPath(); ctx.roundRect(wx - 30, wy - 20, 60, 40, 8); ctx.fill();
        ctx.fillStyle = '#88ccff'; ctx.font = 'bold 12px Nunito'; ctx.textAlign = 'center';
        ctx.fillText('Rüzgar', wx, wy - 5);
        const arrowLen = Physics.windX * 15;
        ctx.strokeStyle = Physics.windX > 0 ? '#ff9800' : '#4fc3f7';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(wx - arrowLen, wy + 10); ctx.lineTo(wx + arrowLen, wy + 10); ctx.stroke();
        const tipDir = Physics.windX > 0 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(wx + arrowLen, wy + 10);
        ctx.lineTo(wx + arrowLen - tipDir * 6, wy + 6);
        ctx.lineTo(wx + arrowLen - tipDir * 6, wy + 14);
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle; ctx.fill();
        ctx.restore();
    },

    // ===== İYİLEŞTİRİLMİŞ ARKA PLAN ÜRETİCİ =====
    _generateBackground() {
        // Detaylı bulutlar
        this.clouds = [];
        for (let i = 0; i < 12; i++) {
            const mainR = 25 + Math.random() * 40;
            const blobCount = 3 + Math.floor(Math.random() * 4);
            const blobs = [];
            for (let b = 0; b < blobCount; b++) {
                blobs.push({
                    ox: (Math.random() - 0.5) * mainR * 1.8,
                    oy: (Math.random() - 0.5) * mainR * 0.5,
                    rx: mainR * (0.5 + Math.random() * 0.5),
                    ry: mainR * (0.3 + Math.random() * 0.3)
                });
            }
            this.clouds.push({
                x: Math.random() * this.width * 3,
                y: 40 + Math.random() * this.groundY * 0.45,
                mainR,
                blobs,
                speed: 0.03 + Math.random() * 0.12,
                opacity: 0.25 + Math.random() * 0.35
            });
        }

        // 3 katmanlı dağ
        this.bgLayers = [];
        const layerColors = ['#1a3a2a', '#2d5a3d', '#3d7a50'];
        for (let layer = 0; layer < 3; layer++) {
            const points = [];
            const count = 30 + layer * 10;
            for (let i = 0; i < count; i++) {
                points.push({
                    x: i * (this.width * 3 / count),
                    h: (30 + Math.random() * (100 - layer * 25)) * (1 - layer * 0.2)
                });
            }
            this.bgLayers.push({ points, color: layerColors[layer] });
        }

        // Yıldızlar
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * this.width * 3,
                y: Math.random() * this.groundY * 0.6,
                size: 0.5 + Math.random() * 2.5,
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

window.addEventListener('DOMContentLoaded', () => Game.init());
