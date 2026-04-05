// ===== STORAGE - LocalStorage Kayıt Sistemi =====
const Storage = {
    KEY: 'sky_launcher_save',

    defaultData: {
        coins: 500,
        currentLevel: 1,
        maxUnlockedLevel: 1,
        selectedPlane: 0,
        unlockedPlanes: [0],
        upgrades: {
            power: 0,
            aero: 0,
            wind: 0,
            turbo: 0,
            magnet: 0
        },
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
                // Merge with defaults for new fields
                this.data = { ...this.defaultData, ...this.data };
                this.data.upgrades = { ...this.defaultData.upgrades, ...this.data.upgrades };
            } catch (e) {
                this.data = { ...this.defaultData };
            }
        } else {
            this.data = { ...this.defaultData };
        }
        this.save();
    },

    save() {
        localStorage.setItem(this.KEY, JSON.stringify(this.data));
    },

    getCoins() { return this.data.coins; },
    addCoins(amount) { this.data.coins += amount; this.save(); },
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

    getUpgrade(key) { return this.data.upgrades[key] || 0; },
    upgradeLevel(key) {
        this.data.upgrades[key] = (this.data.upgrades[key] || 0) + 1;
        this.save();
    },

    addDistance(d) { this.data.totalDistance += d; this.data.totalFlights++; this.save(); },

    reset() {
        this.data = { ...this.defaultData };
        this.save();
    }
};

Storage.init();
