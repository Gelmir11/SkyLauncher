// ===== STORAGE - LocalStorage Kayıt Sistemi (v3 - Uçak bazlı upgrade) =====
const Storage = {
    KEY: 'sky_launcher_save_v3',

    defaultData: {
        coins: 500,
        currentLevel: 1,
        maxUnlockedLevel: 1,
        selectedPlane: 0,
        unlockedPlanes: [0],
        // Uçak bazlı upgrade: { planeId: { power:0, aero:0, ... } }
        planeUpgrades: {},
        levelStars: {},
        totalDistance: 0,
        totalFlights: 0
    },

    data: null,

    init() {
        const saved = localStorage.getItem(this.KEY);
        if (saved) {
            try {
                this.data = JSON.parse(saved);
                this.data = { ...this.defaultData, ...this.data };
                if (!this.data.planeUpgrades) this.data.planeUpgrades = {};
            } catch (e) {
                this.data = JSON.parse(JSON.stringify(this.defaultData));
            }
        } else {
            this.data = JSON.parse(JSON.stringify(this.defaultData));
        }
        this.save();
    },

    save() {
        localStorage.setItem(this.KEY, JSON.stringify(this.data));
    },

    getCoins() { return this.data.coins; },
    addCoins(amount) { this.data.coins += Math.floor(amount); this.save(); },
    spendCoins(amount) {
        if (this.data.coins >= amount) {
            this.data.coins -= amount;
            this.save();
            return true;
        }
        return false;
    },

    getLevel() { return this.data.currentLevel; },
    getMaxLevel() { return this.data.maxUnlockedLevel; },
    setLevel(level) { this.data.currentLevel = level; this.save(); },
    unlockLevel(level) {
        if (level > this.data.maxUnlockedLevel) {
            this.data.maxUnlockedLevel = level;
            this.save();
        }
    },

    getStars(level) { return this.data.levelStars[level] || 0; },
    setStars(level, stars) {
        if (stars > (this.data.levelStars[level] || 0)) {
            this.data.levelStars[level] = stars;
            this.save();
        }
    },

    getSelectedPlane() { return this.data.selectedPlane; },
    selectPlane(id) { this.data.selectedPlane = id; this.save(); },
    isPlaneUnlocked(id) { return this.data.unlockedPlanes.includes(id); },
    unlockPlane(id) {
        if (!this.data.unlockedPlanes.includes(id)) {
            this.data.unlockedPlanes.push(id);
            this.save();
        }
    },

    // === UÇAK BAZLI UPGRADE ===
    _getPlaneUpgrades(planeId) {
        if (planeId === undefined) planeId = this.data.selectedPlane;
        if (!this.data.planeUpgrades[planeId]) {
            this.data.planeUpgrades[planeId] = { power: 0, aero: 0, wind: 0, turbo: 0, magnet: 0 };
        }
        return this.data.planeUpgrades[planeId];
    },

    getUpgrade(key, planeId) {
        return this._getPlaneUpgrades(planeId)[key] || 0;
    },

    upgradeLevel(key, planeId) {
        const ups = this._getPlaneUpgrades(planeId);
        ups[key] = (ups[key] || 0) + 1;
        this.save();
    },

    addDistance(d) { this.data.totalDistance += d; this.data.totalFlights++; this.save(); },

    reset() {
        localStorage.removeItem(this.KEY);
        this.data = JSON.parse(JSON.stringify(this.defaultData));
        this.save();
    }
};

Storage.init();
