// ===== PARTICLES - Parçacık Efektleri =====
const Particles = {
    list: [],

    add(x, y, type, options = {}) {
        const count = options.count || 5;
        for (let i = 0; i < count; i++) {
            let p = null;
            switch (type) {
                case 'trail':
                    p = {
                        x, y,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        life: 30 + Math.random() * 20,
                        maxLife: 50,
                        size: 2 + Math.random() * 3,
                        color: options.color || 'rgba(255,255,255,0.3)',
                        type: 'trail'
                    };
                    break;
                case 'coin':
                    p = {
                        x, y,
                        vx: (Math.random() - 0.5) * 4,
                        vy: -2 - Math.random() * 3,
                        life: 40,
                        maxLife: 40,
                        size: 3 + Math.random() * 3,
                        color: '#ffd54f',
                        type: 'coin'
                    };
                    break;
                case 'star':
                    p = {
                        x, y,
                        vx: (Math.random() - 0.5) * 6,
                        vy: -3 - Math.random() * 4,
                        life: 50,
                        maxLife: 50,
                        size: 2 + Math.random() * 4,
                        color: options.color || '#ffd54f',
                        type: 'star',
                        rotation: Math.random() * Math.PI * 2,
                        rotSpeed: (Math.random() - 0.5) * 0.2
                    };
                    break;
                case 'boost':
                    p = {
                        x, y,
                        vx: -3 - Math.random() * 4,
                        vy: (Math.random() - 0.5) * 2,
                        life: 20 + Math.random() * 10,
                        maxLife: 30,
                        size: 4 + Math.random() * 4,
                        color: '#ff9800',
                        type: 'boost'
                    };
                    break;
                case 'land':
                    p = {
                        x, y,
                        vx: (Math.random() - 0.5) * 5,
                        vy: -1 - Math.random() * 4,
                        life: 30 + Math.random() * 20,
                        maxLife: 50,
                        size: 3 + Math.random() * 5,
                        color: '#8d6e63',
                        type: 'land'
                    };
                    break;
                case 'text':
                    p = {
                        x, y,
                        vx: 0,
                        vy: -1.5,
                        life: 60,
                        maxLife: 60,
                        text: options.text || '+10',
                        color: options.color || '#ffd54f',
                        fontSize: options.fontSize || 18,
                        type: 'text'
                    };
                    this.list.push(p);
                    return; // text sadece 1 tane
            }
            if (p) this.list.push(p);
        }
    },

    update() {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const p = this.list[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            if (p.type === 'coin' || p.type === 'land' || p.type === 'star') {
                p.vy += 0.08;
            }

            if (p.rotation !== undefined) {
                p.rotation += p.rotSpeed;
            }

            if (p.life <= 0) {
                this.list.splice(i, 1);
            }
        }
    },

    draw(ctx, cameraX) {
        for (const p of this.list) {
            const alpha = Math.max(0, p.life / p.maxLife);
            const screenX = p.x - cameraX;

            if (p.type === 'text') {
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.font = `bold ${p.fontSize}px 'Fredoka One', cursive`;
                ctx.fillStyle = p.color;
                ctx.textAlign = 'center';
                ctx.fillText(p.text, screenX, p.y);
                ctx.restore();
                continue;
            }

            if (p.type === 'star') {
                ctx.save();
                ctx.translate(screenX, p.y);
                ctx.rotate(p.rotation);
                ctx.globalAlpha = alpha;
                this._drawStar(ctx, 0, 0, p.size, p.color);
                ctx.restore();
                continue;
            }

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(screenX, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();
        }
    },

    _drawStar(ctx, x, y, size, color) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    },

    clear() {
        this.list = [];
    }
};
