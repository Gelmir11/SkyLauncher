// ===== AIRPLANES - 7 Uçak Tasarımı =====
const Airplanes = {
    list: [
        {
            id: 0,
            name: 'Kağıt Uçak',
            desc: 'Basit ama eğlenceli başlangıç uçağı',
            unlockLevel: 1, // Level 1'den açık
            speed: 1.0,
            drag: 1.0,
            glide: 1.0,
            lift: 0.3,
            color1: '#ffffff',
            color2: '#e0e0e0',
            trailColor: 'rgba(255,255,255,0.3)',
            draw(ctx, x, y, angle, scale = 1) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.scale(scale, scale);
                // Kağıt uçak gövde
                ctx.beginPath();
                ctx.moveTo(25, 0);
                ctx.lineTo(-15, -10);
                ctx.lineTo(-8, 0);
                ctx.lineTo(-15, 10);
                ctx.closePath();
                ctx.fillStyle = this.color1;
                ctx.fill();
                ctx.strokeStyle = '#ccc';
                ctx.lineWidth = 1;
                ctx.stroke();
                // Katlanma çizgisi
                ctx.beginPath();
                ctx.moveTo(25, 0);
                ctx.lineTo(-8, 0);
                ctx.strokeStyle = '#bbb';
                ctx.lineWidth = 0.8;
                ctx.stroke();
                ctx.restore();
            }
        },
        {
            id: 1,
            name: 'Origami Kuş',
            desc: 'Zarif süzülme yeteneği',
            unlockLevel: 50,
            speed: 1.05,
            drag: 0.97,
            glide: 0.9,
            lift: 0.5,
            color1: '#ff7043',
            color2: '#ff5722',
            trailColor: 'rgba(255,112,67,0.3)',
            draw(ctx, x, y, angle, scale = 1) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.scale(scale, scale);
                // Kuş gövde
                ctx.beginPath();
                ctx.moveTo(22, 0);
                ctx.lineTo(5, -6);
                ctx.lineTo(-18, -14);
                ctx.lineTo(-8, 0);
                ctx.lineTo(-18, 14);
                ctx.lineTo(5, 6);
                ctx.closePath();
                ctx.fillStyle = this.color1;
                ctx.fill();
                // Göz
                ctx.beginPath();
                ctx.arc(12, -2, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#333';
                ctx.fill();
                ctx.restore();
            }
        },
        {
            id: 2,
            name: 'Ahşap Planör',
            desc: 'Dengeli ve güçlü uçuş',
            unlockLevel: 150,
            speed: 1.1,
            drag: 0.96,
            glide: 0.85,
            lift: 0.6,
            color1: '#8d6e63',
            color2: '#6d4c41',
            trailColor: 'rgba(141,110,99,0.3)',
            draw(ctx, x, y, angle, scale = 1) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.scale(scale, scale);
                // Gövde
                ctx.beginPath();
                ctx.ellipse(0, 0, 22, 4, 0, 0, Math.PI * 2);
                ctx.fillStyle = this.color1;
                ctx.fill();
                ctx.strokeStyle = this.color2;
                ctx.lineWidth = 1;
                ctx.stroke();
                // Kanatlar
                ctx.beginPath();
                ctx.moveTo(-5, -4);
                ctx.lineTo(-2, -18);
                ctx.lineTo(8, -18);
                ctx.lineTo(5, -4);
                ctx.fillStyle = this.color2;
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-5, 4);
                ctx.lineTo(-2, 18);
                ctx.lineTo(8, 18);
                ctx.lineTo(5, 4);
                ctx.fill();
                // Kuyruk
                ctx.beginPath();
                ctx.moveTo(-20, 0);
                ctx.lineTo(-25, -8);
                ctx.lineTo(-22, 0);
                ctx.lineTo(-25, 8);
                ctx.closePath();
                ctx.fillStyle = this.color1;
                ctx.fill();
                ctx.restore();
            }
        },
        {
            id: 3,
            name: 'Jet Uçak',
            desc: 'Yüksek hız, adrenalin dolu',
            unlockLevel: 250,
            speed: 1.25,
            drag: 0.98,
            glide: 0.95,
            lift: 0.4,
            color1: '#42a5f5',
            color2: '#1976d2',
            trailColor: 'rgba(66,165,245,0.4)',
            draw(ctx, x, y, angle, scale = 1) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.scale(scale, scale);
                // Gövde
                ctx.beginPath();
                ctx.moveTo(28, 0);
                ctx.lineTo(18, -4);
                ctx.lineTo(-18, -5);
                ctx.lineTo(-22, -3);
                ctx.lineTo(-22, 3);
                ctx.lineTo(-18, 5);
                ctx.lineTo(18, 4);
                ctx.closePath();
                ctx.fillStyle = this.color1;
                ctx.fill();
                // Kanatlar (delta)
                ctx.beginPath();
                ctx.moveTo(5, -5);
                ctx.lineTo(-10, -20);
                ctx.lineTo(-15, -18);
                ctx.lineTo(-5, -5);
                ctx.fillStyle = this.color2;
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(5, 5);
                ctx.lineTo(-10, 20);
                ctx.lineTo(-15, 18);
                ctx.lineTo(-5, 5);
                ctx.fill();
                // Kokpit
                ctx.beginPath();
                ctx.ellipse(15, 0, 6, 3, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#bbdefb';
                ctx.fill();
                // Motor alev
                ctx.beginPath();
                ctx.moveTo(-22, -2);
                ctx.lineTo(-30 - Math.random() * 5, 0);
                ctx.lineTo(-22, 2);
                ctx.fillStyle = '#ff9800';
                ctx.fill();
                ctx.restore();
            }
        },
        {
            id: 4,
            name: 'Stealth Bombardıman',
            desc: 'Rüzgar? Hangi rüzgar?',
            unlockLevel: 350,
            speed: 1.15,
            drag: 0.955,
            glide: 0.88,
            lift: 0.55,
            color1: '#37474f',
            color2: '#263238',
            trailColor: 'rgba(55,71,79,0.4)',
            draw(ctx, x, y, angle, scale = 1) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.scale(scale, scale);
                // B-2 benzeri şekil
                ctx.beginPath();
                ctx.moveTo(24, 0);
                ctx.lineTo(10, -6);
                ctx.lineTo(-5, -22);
                ctx.lineTo(-15, -20);
                ctx.lineTo(-20, -8);
                ctx.lineTo(-18, 0);
                ctx.lineTo(-20, 8);
                ctx.lineTo(-15, 20);
                ctx.lineTo(-5, 22);
                ctx.lineTo(10, 6);
                ctx.closePath();
                ctx.fillStyle = this.color1;
                ctx.fill();
                ctx.strokeStyle = this.color2;
                ctx.lineWidth = 1;
                ctx.stroke();
                // Kokpit
                ctx.beginPath();
                ctx.ellipse(10, 0, 5, 2.5, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#546e7a';
                ctx.fill();
                ctx.restore();
            }
        },
        {
            id: 5,
            name: 'Roket Uçak',
            desc: 'TURBO! Ekstra yakıtla uç',
            unlockLevel: 450,
            speed: 1.35,
            drag: 0.985,
            glide: 1.0,
            lift: 0.35,
            color1: '#ef5350',
            color2: '#c62828',
            trailColor: 'rgba(239,83,80,0.5)',
            draw(ctx, x, y, angle, scale = 1) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.scale(scale, scale);
                // Roket gövde
                ctx.beginPath();
                ctx.moveTo(30, 0);
                ctx.quadraticCurveTo(25, -5, 15, -6);
                ctx.lineTo(-15, -5);
                ctx.lineTo(-20, -10);
                ctx.lineTo(-22, -8);
                ctx.lineTo(-18, 0);
                ctx.lineTo(-22, 8);
                ctx.lineTo(-20, 10);
                ctx.lineTo(-15, 5);
                ctx.lineTo(15, 6);
                ctx.quadraticCurveTo(25, 5, 30, 0);
                ctx.fillStyle = this.color1;
                ctx.fill();
                // Beyaz şerit
                ctx.beginPath();
                ctx.moveTo(25, 0);
                ctx.lineTo(-10, -2);
                ctx.lineTo(-10, 2);
                ctx.closePath();
                ctx.fillStyle = '#ffcdd2';
                ctx.fill();
                // Kanatlar
                ctx.beginPath();
                ctx.moveTo(0, -6);
                ctx.lineTo(-8, -16);
                ctx.lineTo(-5, -6);
                ctx.fillStyle = this.color2;
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(0, 6);
                ctx.lineTo(-8, 16);
                ctx.lineTo(-5, 6);
                ctx.fill();
                // Alev
                const flameLen = 8 + Math.random() * 12;
                ctx.beginPath();
                ctx.moveTo(-18, -3);
                ctx.lineTo(-18 - flameLen, 0);
                ctx.lineTo(-18, 3);
                ctx.fillStyle = '#ff9800';
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-18, -1.5);
                ctx.lineTo(-18 - flameLen * 0.6, 0);
                ctx.lineTo(-18, 1.5);
                ctx.fillStyle = '#ffeb3b';
                ctx.fill();
                ctx.restore();
            }
        },
        {
            id: 6,
            name: 'Uzay Mekiği',
            desc: 'Efsanevi! Gökyüzünün efendisi',
            unlockLevel: 550,
            speed: 1.5,
            drag: 0.95,
            glide: 0.82,
            lift: 0.7,
            color1: '#7e57c2',
            color2: '#4a148c',
            trailColor: 'rgba(126,87,194,0.5)',
            draw(ctx, x, y, angle, scale = 1) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.scale(scale, scale);
                // Gövde
                ctx.beginPath();
                ctx.moveTo(32, 0);
                ctx.quadraticCurveTo(28, -6, 20, -7);
                ctx.lineTo(-12, -7);
                ctx.lineTo(-16, -4);
                ctx.lineTo(-16, 4);
                ctx.lineTo(-12, 7);
                ctx.lineTo(20, 7);
                ctx.quadraticCurveTo(28, 6, 32, 0);
                ctx.fillStyle = this.color1;
                ctx.fill();
                ctx.strokeStyle = this.color2;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                // Büyük kanatlar
                ctx.beginPath();
                ctx.moveTo(5, -7);
                ctx.lineTo(-8, -24);
                ctx.lineTo(-18, -22);
                ctx.lineTo(-12, -7);
                ctx.fillStyle = this.color2;
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(5, 7);
                ctx.lineTo(-8, 24);
                ctx.lineTo(-18, 22);
                ctx.lineTo(-12, 7);
                ctx.fill();
                // Kokpit
                ctx.beginPath();
                ctx.ellipse(18, 0, 8, 4, 0, 0, Math.PI * 2);
                const grad = ctx.createLinearGradient(10, 0, 26, 0);
                grad.addColorStop(0, '#ce93d8');
                grad.addColorStop(1, '#e1bee7');
                ctx.fillStyle = grad;
                ctx.fill();
                // Enerji izi
                const flLen = 12 + Math.random() * 15;
                ctx.beginPath();
                ctx.moveTo(-16, -3);
                ctx.lineTo(-16 - flLen, 0);
                ctx.lineTo(-16, 3);
                ctx.fillStyle = '#b388ff';
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-16, -1.5);
                ctx.lineTo(-16 - flLen * 0.7, 0);
                ctx.lineTo(-16, 1.5);
                ctx.fillStyle = '#e1bee7';
                ctx.fill();
                // Yıldız parçacıkları
                for (let i = 0; i < 3; i++) {
                    const sx = -20 - Math.random() * 20;
                    const sy = (Math.random() - 0.5) * 10;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 1 + Math.random(), 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(225,190,231,${0.5 + Math.random() * 0.5})`;
                    ctx.fill();
                }
                ctx.restore();
            }
        }
    ],

    drawPreview(ctx, id, x, y, w, h) {
        const plane = this.list[id];
        if (plane) {
            plane.draw(ctx, x + w / 2, y + h / 2, 0, w / 70);
        }
    }
};
