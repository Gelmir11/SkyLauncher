// ===== LEVELS - 50 Level + Rampa + Kağıt Uçak Collectible (v3) =====
const Levels = {
    TOTAL_LEVELS: 400, // 8 uçak × 50 level
    list: [],

    // Uçak açılma seviyeleri: her 50 levelde yeni uçak
    PLANE_UNLOCK_LEVELS: [1, 51, 101, 151, 201, 251, 301, 351],

    init() {
        this.list = [];
        for (let i = 1; i <= this.TOTAL_LEVELS; i++) {
            this.list.push(this._generateLevel(i));
        }
    },

    _generateLevel(num) {
        // Hedef mesafeler daha uzun
        const baseDistance = 150 + num * 60 + Math.pow(num, 1.4) * 5;

        const star1 = Math.round(baseDistance * 0.65);
        const star2 = Math.round(baseDistance * 0.85);
        const star3 = Math.round(baseDistance * 1.15);

        const windStrength = Math.min(0.3 + num * 0.06, 3.0);
        const turbulence = Math.min(num * 0.04, 1.5);
        const coinCount = 8 + Math.floor(num * 1.2);
        // boostCount kaldırıldı
        const obstacleCount = Math.max(0, Math.floor((num - 5) / 4));
        const rampCount = Math.max(1, Math.floor(num / 6));
        const paperPlaneCount = Math.max(1, Math.floor(num / 4));

        const themes = [
            { sky1: '#87CEEB', sky2: '#4682B4', ground: '#4caf50', groundDark: '#388e3c', name: 'Sabah' },
            { sky1: '#5dade2', sky2: '#2471a3', ground: '#66bb6a', groundDark: '#43a047', name: 'Öğle' },
            { sky1: '#f0b27a', sky2: '#e67e22', ground: '#a0522d', groundDark: '#8b4513', name: 'İkindi' },
            { sky1: '#e74c3c', sky2: '#922b21', ground: '#795548', groundDark: '#5d4037', name: 'Gün Batımı' },
            { sky1: '#2c3e50', sky2: '#1a252f', ground: '#37474f', groundDark: '#263238', name: 'Alacakaranlık' },
            { sky1: '#1a1a3e', sky2: '#0d0d26', ground: '#1a237e', groundDark: '#0d1642', name: 'Gece' },
            { sky1: '#0a001a', sky2: '#1a0033', ground: '#1b0033', groundDark: '#0d001a', name: 'Derin Uzay' },
            { sky1: '#1a0a2e', sky2: '#2d1b4e', ground: '#311b92', groundDark: '#1a0e52', name: 'Nebula' },
            { sky1: '#004d40', sky2: '#00251a', ground: '#1b5e20', groundDark: '#0d3311', name: 'Aurora' },
            { sky1: '#b71c1c', sky2: '#4a0000', ground: '#3e2723', groundDark: '#1b0f0b', name: 'Mars' }
        ];
        const themeIdx = Math.min(Math.floor((num - 1) / 5), themes.length - 1);

        return {
            num,
            name: `Level ${num}`,
            targetDistance: Math.round(baseDistance),
            stars: [star1, star2, star3],
            windStrength,
            turbulence,
            coinCount,
            // boostCount kaldırıldı
            obstacleCount,
            rampCount,
            paperPlaneCount,
            theme: themes[themeIdx]
        };
    },

    get(levelNum) {
        return this.list[Math.min(levelNum - 1, this.list.length - 1)] || this.list[0];
    },

    calculateStars(levelNum, distance) {
        const level = this.get(levelNum);
        if (distance >= level.stars[2]) return 3;
        if (distance >= level.stars[1]) return 2;
        if (distance >= level.stars[0]) return 1;
        return 0;
    },

    isLevelPassed(levelNum, distance) {
        const level = this.get(levelNum);
        return distance >= level.stars[0];
    },

    getPlaneUnlockLevel(planeId) {
        return this.PLANE_UNLOCK_LEVELS[planeId] || 9999;
    },

    isPlaneAvailable(planeId) {
        const requiredLevel = this.getPlaneUnlockLevel(planeId);
        return Storage.getMaxLevel() >= requiredLevel;
    },

    // === Dinamik obje üretimi (mesafeye göre) ===
    generateCoins(levelNum, canvasWidth, canvasHeight, startDist, endDist) {
        const level = this.get(levelNum);
        const coins = [];
        const groundY = canvasHeight * 0.78;
        const start = startDist || 150;
        const end = endDist || level.targetDistance * 15;

        for (let i = 0; i < level.coinCount; i++) {
            coins.push({
                x: start + Math.random() * (end - start),
                y: groundY * 0.1 + Math.random() * groundY * 0.65,
                radius: 12,
                value: 5 + Math.floor(Math.random() * 3) * 5, // 5-15 arası (azaltılmış)
                collected: false,
                bobOffset: Math.random() * Math.PI * 2,
                rotation: 0
            });
        }
        return coins;
    },

    // generateBoosts kaldırıldı — BOOST sistemi silindi
    generateBoosts() { return [];
    },

    generateObstacles(levelNum, canvasWidth, canvasHeight) {
        const level = this.get(levelNum);
        const obstacles = [];
        const groundY = canvasHeight * 0.78;
        const maxDist = level.targetDistance * 15;

        for (let i = 0; i < level.obstacleCount; i++) {
            const type = Math.random() > 0.5 ? 'bird' : 'cloud';
            obstacles.push({
                x: 400 + Math.random() * maxDist,
                y: groundY * 0.1 + Math.random() * groundY * 0.65,
                width: type === 'bird' ? 30 : 60,
                height: type === 'bird' ? 20 : 40,
                type,
                vx: type === 'bird' ? -0.5 - Math.random() : 0,
                hit: false
            });
        }
        return obstacles;
    },

    generateRamps(levelNum, canvasWidth, canvasHeight) {
        const level = this.get(levelNum);
        const ramps = [];
        const groundY = canvasHeight * 0.78;
        const maxDist = level.targetDistance * 15;

        for (let i = 0; i < level.rampCount; i++) {
            ramps.push({
                x: 400 + (i + 1) * (maxDist / (level.rampCount + 1)) + (Math.random() - 0.5) * 200,
                y: groundY,
                width: 80,
                height: 30,
                used: false
            });
        }
        return ramps;
    },

    generatePaperPlanes(levelNum, canvasWidth, canvasHeight) {
        const level = this.get(levelNum);
        const papers = [];
        const groundY = canvasHeight * 0.78;
        const maxDist = level.targetDistance * 15;

        for (let i = 0; i < level.paperPlaneCount; i++) {
            // Tamamen rastgele pozisyon
            papers.push({
                x: 200 + Math.random() * maxDist,
                y: groundY * 0.05 + Math.random() * groundY * 0.72,
                radius: 18,
                collected: false,
                bobOffset: Math.random() * Math.PI * 2,
                rotation: 0
            });
        }
        return papers;
    }
};

Levels.init();
