// ===== LEVELS - 30 Level Tanımları =====
const Levels = {
    list: [],

    init() {
        this.list = [];
        for (let i = 1; i <= 30; i++) {
            this.list.push(this._generateLevel(i));
        }
    },

    _generateLevel(num) {
        // Zorluk kademeli artar
        const difficulty = 1 + (num - 1) * 0.12;
        const baseDistance = 50 + num * 35;

        // Yıldız hedefleri
        const star1 = Math.round(baseDistance * 0.6);
        const star2 = Math.round(baseDistance * 0.85);
        const star3 = Math.round(baseDistance * 1.1);

        // Rüzgar ve engeller kademeli artar
        const windStrength = Math.min(0.3 + num * 0.08, 3.0);
        const turbulence = Math.min(num * 0.05, 1.5);
        const coinCount = 5 + Math.floor(num * 1.5);
        const boostCount = Math.max(0, Math.floor((num - 3) / 4));
        const obstacleCount = Math.max(0, Math.floor((num - 5) / 3));

        // Arkaplan renkleri (gün batımı efekti ilerledikçe)
        const themes = [
            { sky1: '#4fc3f7', sky2: '#0288d1', ground: '#4caf50', name: 'Sabah' },         // 1-5
            { sky1: '#81d4fa', sky2: '#0277bd', ground: '#66bb6a', name: 'Öğle' },           // 6-10
            { sky1: '#ffcc02', sky2: '#ff9800', ground: '#8d6e63', name: 'İkindi' },         // 11-15
            { sky1: '#ff7043', sky2: '#d84315', ground: '#795548', name: 'Gün Batımı' },     // 16-20
            { sky1: '#5c6bc0', sky2: '#1a237e', ground: '#37474f', name: 'Gece' },           // 21-25
            { sky1: '#1a0033', sky2: '#4a148c', ground: '#263238', name: 'Uzay' }            // 26-30
        ];
        const themeIdx = Math.min(Math.floor((num - 1) / 5), themes.length - 1);
        const theme = themes[themeIdx];

        return {
            num,
            name: `Level ${num}`,
            targetDistance: baseDistance,
            stars: [star1, star2, star3],
            windStrength,
            turbulence,
            difficulty,
            coinCount,
            boostCount,
            obstacleCount,
            theme
        };
    },

    get(levelNum) {
        return this.list[levelNum - 1] || this.list[0];
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

    generateCoins(levelNum, canvasWidth, canvasHeight) {
        const level = this.get(levelNum);
        const coins = [];
        const groundY = canvasHeight * 0.78;
        const maxDist = level.targetDistance * 15; // piksel cinsinden tahmini mesafe

        for (let i = 0; i < level.coinCount; i++) {
            coins.push({
                x: 200 + Math.random() * maxDist,
                y: groundY * 0.2 + Math.random() * groundY * 0.6,
                radius: 12,
                value: 10 + Math.floor(Math.random() * 5) * 10,
                collected: false,
                bobOffset: Math.random() * Math.PI * 2,
                rotation: 0
            });
        }
        return coins;
    },

    generateBoosts(levelNum, canvasWidth, canvasHeight) {
        const level = this.get(levelNum);
        const boosts = [];
        const groundY = canvasHeight * 0.78;
        const maxDist = level.targetDistance * 15;

        for (let i = 0; i < level.boostCount; i++) {
            boosts.push({
                x: 300 + Math.random() * maxDist * 0.8,
                y: groundY * 0.15 + Math.random() * groundY * 0.5,
                width: 60,
                height: 30,
                active: true
            });
        }
        return boosts;
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
    }
};

Levels.init();
