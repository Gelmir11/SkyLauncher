// ===== PHYSICS - Fizik Motoru (v3) =====
const Physics = {
    GRAVITY: 0.06,
    AIR_DRAG: 0.998,
    GROUND_Y: 0,
    CEILING_Y: 20, // orijinal tavan
    WIND_CHANGE_INTERVAL: 120,

    windX: 0,
    windY: 0,
    windTimer: 0,
    turbulence: 0,

    init(groundY) {
        this.GROUND_Y = groundY;
        this.CEILING_Y = 20; // orijinal tavan
        this.windX = 0;
        this.windY = 0;
        this.windTimer = 0;
    },

    getUpgradeMultipliers() {
        const planeId = Storage.getSelectedPlane();
        const power = Storage.getUpgrade('power', planeId);
        const aero = Storage.getUpgrade('aero', planeId);
        const wind = Storage.getUpgrade('wind', planeId);
        const turbo = Storage.getUpgrade('turbo', planeId);
        const magnet = Storage.getUpgrade('magnet', planeId);

        return {
            launchPower: 1 + power * 0.12,
            aeroBoost: aero,
            windResistance: 1 - wind * 0.15,
            turboFuel: turbo * 3,
            magnetRange: magnet * 50
        };
    },

    update(plane, levelData) {
        if (!plane.launched || plane.landed) return;

        const mults = this.getUpgradeMultipliers();
        const planeDef = Airplanes.list[Storage.getSelectedPlane()];

        // Rüzgar değişimi
        this.windTimer++;
        if (this.windTimer >= this.WIND_CHANGE_INTERVAL) {
            this.windTimer = 0;
            const windStrength = (levelData.windStrength || 1) * mults.windResistance;
            this.windX = (Math.random() - 0.5) * 2 * windStrength;
            this.windY = (Math.random() - 0.3) * windStrength * 0.5;
            this.turbulence = Math.random() * (levelData.turbulence || 0);
        }

        // Yerçekimi
        const gravityMod = planeDef.glide || 1;
        plane.vy += this.GRAVITY * gravityMod;

        // Hava sürtünmesi
        const baseDragLoss = (1 - this.AIR_DRAG) * (planeDef.drag || 1);
        const aeroReduction = 1 - mults.aeroBoost * 0.08;
        const actualDragLoss = baseDragLoss * Math.max(0.15, aeroReduction);
        const drag = 1 - actualDragLoss;
        plane.vx *= drag;
        plane.vy *= drag;

        // Rüzgar
        plane.vx += this.windX * 0.02;
        plane.vy += this.windY * 0.01;

        // Türbülans
        if (this.turbulence > 0) {
            plane.vx += (Math.random() - 0.5) * this.turbulence * 0.1;
            plane.vy += (Math.random() - 0.5) * this.turbulence * 0.05;
        }

        // Lift
        const speed = Math.sqrt(plane.vx * plane.vx + plane.vy * plane.vy);
        const liftForce = (planeDef.lift || 0) * speed * 0.008;
        if (speed > 1.5) {
            plane.vy -= liftForce;
        }

        // Turbo (azaltılmış güç)
        if (plane.turboFuel > 0 && plane.turboActive) {
            plane.vx += 0.35;
            plane.vy -= 0.1;
            plane.turboFuel -= 0.06;
            if (plane.turboFuel <= 0) {
                plane.turboActive = false;
            }
        }

        // Pozisyon güncelle
        plane.x += plane.vx;
        plane.y += plane.vy;

        // Açı
        plane.angle = Math.atan2(plane.vy, plane.vx);

        // Mesafe & yükseklik
        plane.distance = Math.max(plane.distance, (plane.x - plane.startX) / 10);
        plane.altitude = Math.max(0, (this.GROUND_Y - plane.y) / 10);

        // Yere çarpma
        if (plane.y >= this.GROUND_Y) {
            plane.y = this.GROUND_Y;
            plane.landed = true;
            plane.vy = 0;
            plane.vx *= 0.3;

            // Sekme
            if (Math.abs(plane.vx) > 2) {
                plane.y = this.GROUND_Y - 8;
                plane.vy = -Math.abs(plane.vx) * 0.3;
                plane.vx *= 0.7;
                plane.landed = false;
                plane.bounces = (plane.bounces || 0) + 1;
                if (plane.bounces > 5) plane.landed = true;
            }
        }

        // Tavan — çok yukarıda, yumuşak geri itme
        if (plane.y < this.CEILING_Y) {
            plane.y = this.CEILING_Y;
            plane.vy = Math.abs(plane.vy) * 0.3;
        }

        // Hız çok düşük = iniş
        if (plane.launched && speed < 0.5 && plane.y >= this.GROUND_Y - 5) {
            plane.landed = true;
        }
    },

    launch(plane, angle, power) {
        const mults = this.getUpgradeMultipliers();
        const planeDef = Airplanes.list[Storage.getSelectedPlane()];
        const totalPower = power * mults.launchPower * (planeDef.speed || 1) * 1.2;

        plane.vx = Math.cos(angle) * totalPower;
        plane.vy = Math.sin(angle) * totalPower;
        plane.launched = true;
        plane.startX = plane.x;
        plane.turboFuel = mults.turboFuel;
        plane.maxTurboFuel = mults.turboFuel;
    },

    // Rampa çarpması — uçağa güç ver
    applyRampBoost(plane) {
        plane.vy = -Math.abs(plane.vx) * 0.5 - 3;
        plane.vx *= 1.15;
        plane.bounces = 0;
        plane.landed = false;
    },

    // Kağıt uçak collectible — hafif ekstra itme
    applyPaperBoost(plane) {
        const boost = 0.6 + Math.abs(plane.vx) * 0.05;
        plane.vx += boost;
        plane.vy -= 0.4;
        if (plane.landed) {
            plane.landed = false;
            plane.y = Physics.GROUND_Y - 10;
        }
    }
};
