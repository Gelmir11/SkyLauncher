// ===== PHYSICS - Fizik Motoru =====
const Physics = {
    GRAVITY: 0.15,
    AIR_DRAG: 0.998,
    GROUND_Y: 0, // Canvas'a göre ayarlanacak
    WIND_CHANGE_INTERVAL: 120, // frame

    windX: 0,
    windY: 0,
    windTimer: 0,
    turbulence: 0,

    init(groundY) {
        this.GROUND_Y = groundY;
        this.windX = 0;
        this.windY = 0;
        this.windTimer = 0;
    },

    getUpgradeMultipliers() {
        const power = Storage.getUpgrade('power');
        const aero = Storage.getUpgrade('aero');
        const wind = Storage.getUpgrade('wind');
        const turbo = Storage.getUpgrade('turbo');
        const magnet = Storage.getUpgrade('magnet');

        return {
            launchPower: 1 + power * 0.10,
            dragReduction: 1 - aero * 0.06,
            windResistance: 1 - wind * 0.12,
            turboFuel: turbo * 2,
            magnetRange: magnet * 40
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
            this.turbulence = Math.random() * levelData.turbulence || 0;
        }

        // Yerçekimi
        const gravityMod = planeDef.glide || 1;
        plane.vy += this.GRAVITY * gravityMod;

        // Hava sürtünmesi
        const drag = this.AIR_DRAG * (mults.dragReduction) * (planeDef.drag || 1);
        plane.vx *= drag;
        plane.vy *= drag;

        // Rüzgar etkisi
        plane.vx += this.windX * 0.02;
        plane.vy += this.windY * 0.01;

        // Türbülans
        if (this.turbulence > 0) {
            plane.vx += (Math.random() - 0.5) * this.turbulence * 0.1;
            plane.vy += (Math.random() - 0.5) * this.turbulence * 0.05;
        }

        // Lift (kaldırma kuvveti) - hız yeterli ise
        const speed = Math.sqrt(plane.vx * plane.vx + plane.vy * plane.vy);
        const liftForce = (planeDef.lift || 0) * speed * 0.003;
        if (speed > 2) {
            plane.vy -= liftForce;
        }

        // Turbo
        if (plane.turboFuel > 0 && plane.turboActive) {
            plane.vx += 0.5;
            plane.vy -= 0.1;
            plane.turboFuel -= 0.1;
            if (plane.turboFuel <= 0) {
                plane.turboActive = false;
            }
        }

        // Pozisyon güncelle
        plane.x += plane.vx;
        plane.y += plane.vy;

        // Açı hesapla
        plane.angle = Math.atan2(plane.vy, plane.vx);

        // Mesafe hesapla
        plane.distance = Math.max(plane.distance, (plane.x - plane.startX) / 10);
        plane.altitude = Math.max(0, (this.GROUND_Y - plane.y) / 10);

        // Yere çarpma kontrolü
        if (plane.y >= this.GROUND_Y) {
            plane.y = this.GROUND_Y;
            plane.landed = true;
            plane.vy = 0;
            plane.vx *= 0.3;

            // Sekme efekti (hız yeterli ise)
            if (Math.abs(plane.vx) > 3) {
                plane.y = this.GROUND_Y - 5;
                plane.vy = -Math.abs(plane.vx) * 0.2;
                plane.vx *= 0.6;
                plane.landed = false;
                plane.bounces = (plane.bounces || 0) + 1;
                if (plane.bounces > 3) plane.landed = true;
            }
        }

        // Tavan kontrolü
        if (plane.y < 20) {
            plane.y = 20;
            plane.vy = Math.abs(plane.vy) * 0.5;
        }

        // Hız çok düşük = iniş
        if (plane.launched && speed < 0.5 && plane.y >= this.GROUND_Y - 5) {
            plane.landed = true;
        }
    },

    launch(plane, angle, power) {
        const mults = this.getUpgradeMultipliers();
        const planeDef = Airplanes.list[Storage.getSelectedPlane()];
        const totalPower = power * mults.launchPower * (planeDef.speed || 1);

        plane.vx = Math.cos(angle) * totalPower;
        plane.vy = Math.sin(angle) * totalPower;
        plane.launched = true;
        plane.startX = plane.x;
        plane.turboFuel = mults.turboFuel;
    }
};
