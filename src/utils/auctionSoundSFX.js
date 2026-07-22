// Web Audio API Sound Effects Synthesizer for IPL Auction Broadcast
class AuctionSoundManager {
    constructor() {
        this.audioCtx = null;
        this.enabled = true;

        // Auto-unlock Web Audio API context on first user interaction
        if (typeof window !== "undefined") {
            const unlock = () => {
                if (!this.enabled) return;
                this.init();
                if (this.audioCtx) {
                    if (this.audioCtx.state === "running") {
                        removeListeners();
                    } else {
                        this.audioCtx.resume()
                            .then(() => {
                                if (this.audioCtx.state === "running") {
                                    removeListeners();
                                }
                            })
                            .catch((err) => {
                                console.warn("AudioContext resume failed on user gesture:", err);
                            });
                    }
                }
            };

            const removeListeners = () => {
                window.removeEventListener("click", unlock);
                window.removeEventListener("touchstart", unlock);
                window.removeEventListener("keydown", unlock);
            };

            window.addEventListener("click", unlock);
            window.addEventListener("touchstart", unlock);
            window.addEventListener("keydown", unlock);
        }
    }

    init() {
        if (!this.enabled) return;
        if (!this.audioCtx && typeof window !== "undefined") {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();
            }
        }
        if (this.audioCtx && this.audioCtx.state === "suspended") {
            this.audioCtx.resume().catch((err) => {
                console.warn("AudioContext resume error in init:", err);
            });
        }
    }

    setEnabled(value) {
        this.enabled = Boolean(value);
        console.log("[AudioSoundManager] setEnabled called with:", value, "this.enabled is:", this.enabled);
        if (this.enabled) {
            this.init();
        } else if (this.audioCtx && this.audioCtx.state === "running") {
            try {
                this.audioCtx.suspend();
            } catch (e) {
                console.warn("Audio suspend error:", e);
            }
        }
    }

    // Bid Placement Chime
    playBidSound() {
        console.log("[AudioSoundManager] playBidSound called. this.enabled =", this.enabled);
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.audioCtx || this.audioCtx.state !== "running") return;

            const now = this.audioCtx.currentTime;

            // Oscillator 1 - Bright High Note
            const osc1 = this.audioCtx.createOscillator();
            const gain1 = this.audioCtx.createGain();
            osc1.type = "sine";
            osc1.frequency.setValueAtTime(587.33, now); // D5
            osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

            gain1.gain.setValueAtTime(0.15, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc1.connect(gain1);
            gain1.connect(this.audioCtx.destination);
            osc1.start(now);
            osc1.stop(now + 0.25);

            // Oscillator 2 - Sub Warmth
            const osc2 = this.audioCtx.createOscillator();
            const gain2 = this.audioCtx.createGain();
            osc2.type = "triangle";
            osc2.frequency.setValueAtTime(293.66, now); // D4
            gain2.gain.setValueAtTime(0.1, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc2.connect(gain2);
            gain2.connect(this.audioCtx.destination);
            osc2.start(now);
            osc2.stop(now + 0.2);
        } catch (e) {
            console.warn("Audio play error:", e);
        }
    }

    // Countdown Urgency Tick
    playTickSound(isUrgent = false) {
        console.log("[AudioSoundManager] playTickSound called. this.enabled =", this.enabled);
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.audioCtx || this.audioCtx.state !== "running") return;

            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = isUrgent ? "sawtooth" : "sine";
            osc.frequency.setValueAtTime(isUrgent ? 880 : 440, now);
            osc.frequency.exponentialRampToValueAtTime(isUrgent ? 1200 : 220, now + 0.05);

            gain.gain.setValueAtTime(isUrgent ? 0.2 : 0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.06);
        } catch (e) {
            console.warn("Audio play error:", e);
        }
    }

    // Gavel / Sold Hammer Impact
    playHammerSound() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.audioCtx || this.audioCtx.state !== "running") return;

            const now = this.audioCtx.currentTime;

            // Low thud
            const thud = this.audioCtx.createOscillator();
            const thudGain = this.audioCtx.createGain();
            thud.type = "triangle";
            thud.frequency.setValueAtTime(150, now);
            thud.frequency.exponentialRampToValueAtTime(30, now + 0.2);

            thudGain.gain.setValueAtTime(0.3, now);
            thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            thud.connect(thudGain);
            thudGain.connect(this.audioCtx.destination);
            thud.start(now);
            thud.stop(now + 0.25);

            // Wood snap click
            const snap = this.audioCtx.createOscillator();
            const snapGain = this.audioCtx.createGain();
            snap.type = "square";
            snap.frequency.setValueAtTime(1200, now);
            snap.frequency.exponentialRampToValueAtTime(400, now + 0.04);

            snapGain.gain.setValueAtTime(0.2, now);
            snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            snap.connect(snapGain);
            snapGain.connect(this.audioCtx.destination);
            snap.start(now);
            snap.stop(now + 0.05);
        } catch (e) {
            console.warn("Audio play error:", e);
        }
    }

    // Sold Victory Fanfare
    playSoldFanfare() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.audioCtx || this.audioCtx.state !== "running") return;

            const now = this.audioCtx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 Arpeggio

            notes.forEach((freq, idx) => {
                const noteTime = now + (idx * 0.08);
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();

                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.2, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(noteTime);
                osc.stop(noteTime + 0.35);
            });
        } catch (e) {
            console.warn("Audio play error:", e);
        }
    }

    // Unsold Soft Tone
    playUnsoldSound() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.audioCtx || this.audioCtx.state !== "running") return;

            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.4);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.45);
        } catch (e) {
            console.warn("Audio play error:", e);
        }
    }
}

export const auctionSound = new AuctionSoundManager();
