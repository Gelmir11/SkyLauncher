// ===== SOUNDS - Web Audio API Ses Sistemi =====
const Sounds = {
    ctx: null,
    enabled: true,

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.enabled = false;
        }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    play(type) {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        switch (type) {
            case 'launch': this._launch(); break;
            case 'coin': this._coin(); break;
            case 'boost': this._boost(); break;
            case 'land': this._land(); break;
            case 'levelup': this._levelup(); break;
            case 'buy': this._buy(); break;
            case 'click': this._click(); break;
            case 'wind': this._wind(); break;
        }
    },

    _tone(freq, duration, type = 'sine', volume = 0.15) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    _launch() {
        this._tone(200, 0.3, 'sawtooth', 0.12);
        setTimeout(() => this._tone(400, 0.2, 'sine', 0.1), 100);
        setTimeout(() => this._tone(600, 0.15, 'sine', 0.08), 200);
    },

    _coin() {
        this._tone(880, 0.08, 'sine', 0.12);
        setTimeout(() => this._tone(1320, 0.12, 'sine', 0.1), 60);
    },

    _boost() {
        this._tone(300, 0.3, 'sawtooth', 0.08);
        this._tone(600, 0.3, 'sine', 0.06);
    },

    _land() {
        this._tone(200, 0.4, 'triangle', 0.1);
        this._tone(100, 0.5, 'sine', 0.08);
    },

    _levelup() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((n, i) => {
            setTimeout(() => this._tone(n, 0.25, 'sine', 0.12), i * 120);
        });
    },

    _buy() {
        this._tone(440, 0.1, 'sine', 0.1);
        setTimeout(() => this._tone(660, 0.15, 'sine', 0.1), 80);
    },

    _click() {
        this._tone(600, 0.05, 'sine', 0.08);
    },

    _wind() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.02;
        }
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        source.buffer = buffer;
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
    }
};
