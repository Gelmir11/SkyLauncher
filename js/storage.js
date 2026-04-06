// ===== STORAGE - LocalStorage Kayıt Sistemi (v4 - Uçak bazlı level) =====
const Storage = {
    KEY: 'sky_launcher_save_v4',

    defaultData: {
        coins: 500,
        selectedPlane: 0,
        unlockedPlanes: [0],
        // Uçak bazlı upgrade: { planeId: { power:0, aero:0, ... } }
        planeUpgrades: {},
        // Uçak bazlı level: { planeId: { maxLevel:1, stars:{}, currentLevel:1 } }
        planeLevels: {},
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
                if (!this.data.planeLevels) this.data.planeLevels = {};
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

    // === UÇAK BAZLI LEVEL SİSTEMİ ===
    _getPlaneLevels(planeId) {
        if (planeId === undefined) planeId = this.data.selectedPlane;
        if (!this.data.planeLevels[planeId]) {
            this.data.planeLevels[planeId] = { maxLevel: 1, currentLevel: 1, stars: {} };
        }
        return this.data.planeLevels[planeId];
    },

    getLevel(planeId) { return this._getPlaneLevels(planeId).currentLevel; },
    getMaxLevel(planeId) { return this._getPlaneLevels(planeId).maxLevel; },
    setLevel(level, planeId) { this._getPlaneLevels(planeId).currentLevel = level; this.save(); },
    unlockLevel(level, planeId) {
        const pl = this._getPlaneLevels(planeId);
        if (level > pl.maxLevel) {
            pl.maxLevel = level;
            this.save();
        }
    },

    getStars(level, planeId) { return this._getPlaneLevels(planeId).stars[level] || 0; },
    setStars(level, stars, planeId) {
        const pl = this._getPlaneLevels(planeId);
        if (stars > (pl.stars[level] || 0)) {
            pl.stars[level] = stars;
            this.save();
        }
    },

    // Seçili uçağın tüm 50 levelini bitirdi mi?
    isPlaneCompleted(planeId) {
        if (planeId === undefined) planeId = this.data.selectedPlane;
        return this.getMaxLevel(planeId) > 50;
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
