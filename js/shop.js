// ===== SHOP - Mağaza Sistemi =====
const Shop = {
    upgrades: [
        {
            key: 'power',
            name: 'Motor Gücü',
            icon: '🚀',
            desc: 'Fırlatma hızını artırır',
            maxLevel: 10,
            baseCost: 100,
            costMultiplier: 1.5,
            effect: '+%10 fırlatma gücü'
        },
        {
            key: 'aero',
            name: 'Aerodinamik',
            icon: '💨',
            desc: 'Hava sürtünmesini azaltır',
            maxLevel: 10,
            baseCost: 120,
            costMultiplier: 1.5,
            effect: '-%6 hava direnci'
        },
        {
            key: 'wind',
            name: 'Rüzgar Kalkanı',
            icon: '🛡️',
            desc: 'Rüzgar etkisini azaltır',
            maxLevel: 5,
            baseCost: 200,
            costMultiplier: 1.8,
            effect: '-%12 rüzgar etkisi'
        },
        {
            key: 'turbo',
            name: 'Turbo Yakıt',
            icon: '⚡',
            desc: 'Havadayken ekstra itme (Boşluk tuşu)',
            maxLevel: 5,
            baseCost: 300,
            costMultiplier: 2.0,
            effect: '+2 turbo yakıt'
        },
        {
            key: 'magnet',
            name: 'Para Mıknatısı',
            icon: '🧲',
            desc: 'Yakındaki paraları çeker',
            maxLevel: 5,
            baseCost: 250,
            costMultiplier: 1.8,
            effect: '+40px çekim mesafesi'
        }
    ],

    getCost(upgradeKey) {
        const upgrade = this.upgrades.find(u => u.key === upgradeKey);
        if (!upgrade) return Infinity;
        const currentLevel = Storage.getUpgrade(upgradeKey);
        if (currentLevel >= upgrade.maxLevel) return 0;
        return Math.round(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
    },

    canBuy(upgradeKey) {
        const cost = this.getCost(upgradeKey);
        const upgrade = this.upgrades.find(u => u.key === upgradeKey);
        const currentLevel = Storage.getUpgrade(upgradeKey);
        return cost > 0 && currentLevel < upgrade.maxLevel && Storage.getCoins() >= cost;
    },

    buy(upgradeKey) {
        if (!this.canBuy(upgradeKey)) return false;
        const cost = this.getCost(upgradeKey);
        if (Storage.spendCoins(cost)) {
            Storage.upgradeLevel(upgradeKey);
            Sounds.play('buy');
            return true;
        }
        return false;
    },

    isMaxed(upgradeKey) {
        const upgrade = this.upgrades.find(u => u.key === upgradeKey);
        return Storage.getUpgrade(upgradeKey) >= upgrade.maxLevel;
    }
};
