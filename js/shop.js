// ===== SHOP - Uçak Bazlı Mağaza Sistemi (v3) =====
const Shop = {
    upgrades: [
        {
            key: 'power', name: 'Motor Gücü', icon: '🚀',
            desc: 'Fırlatma hızını artırır', maxLevel: 10,
            baseCost: 100, costMultiplier: 1.5, effect: '+%10 fırlatma gücü'
        },
        {
            key: 'aero', name: 'Aerodinamik', icon: '💨',
            desc: 'Hava sürtünmesini azaltır', maxLevel: 10,
            baseCost: 120, costMultiplier: 1.5, effect: '-%8 hava direnci'
        },
        {
            key: 'wind', name: 'Rüzgar Kalkanı', icon: '🛡️',
            desc: 'Rüzgar etkisini azaltır', maxLevel: 5,
            baseCost: 200, costMultiplier: 1.8, effect: '-%10 rüzgar etkisi'
        },
        {
            key: 'turbo', name: 'Turbo Yakıt', icon: '⚡',
            desc: 'Havadayken ekstra itme (Boşluk)', maxLevel: 5,
            fixedCosts: [1000, 2000, 5000, 15000, 35000], effect: '+3 turbo yakıt'
        },
        {
            key: 'magnet', name: 'Para Mıknatısı', icon: '🧲',
            desc: 'Yakındaki paraları çeker', maxLevel: 5,
            baseCost: 250, costMultiplier: 1.8, effect: '+50px çekim'
        }
    ],

    // Seçili uçağın upgrade maliyeti
    getCost(upgradeKey, planeId) {
        if (planeId === undefined) planeId = Storage.getSelectedPlane();
        const upgrade = this.upgrades.find(u => u.key === upgradeKey);
        if (!upgrade) return Infinity;
        const currentLevel = Storage.getUpgrade(upgradeKey, planeId);
        if (currentLevel >= upgrade.maxLevel) return 0;
        if (upgrade.fixedCosts) return upgrade.fixedCosts[currentLevel];
        return Math.round(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
    },

    canBuy(upgradeKey, planeId) {
        if (planeId === undefined) planeId = Storage.getSelectedPlane();
        const cost = this.getCost(upgradeKey, planeId);
        const upgrade = this.upgrades.find(u => u.key === upgradeKey);
        const currentLevel = Storage.getUpgrade(upgradeKey, planeId);
        return cost > 0 && currentLevel < upgrade.maxLevel && Storage.getCoins() >= cost;
    },

    buy(upgradeKey, planeId) {
        if (planeId === undefined) planeId = Storage.getSelectedPlane();
        if (!this.canBuy(upgradeKey, planeId)) return false;
        const cost = this.getCost(upgradeKey, planeId);
        if (Storage.spendCoins(cost)) {
            Storage.upgradeLevel(upgradeKey, planeId);
            Sounds.play('buy');
            return true;
        }
        return false;
    },

    isMaxed(upgradeKey, planeId) {
        if (planeId === undefined) planeId = Storage.getSelectedPlane();
        const upgrade = this.upgrades.find(u => u.key === upgradeKey);
        return Storage.getUpgrade(upgradeKey, planeId) >= upgrade.maxLevel;
    }
};
