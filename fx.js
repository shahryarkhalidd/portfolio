/* =========================================================
   FX: scroll-velocity debris layer.
   Fast scrolling spawns light streaks and flying data bits
   that rush past in the direction of travel.
   ========================================================= */
(() => {
  const COLORS = ['#b4ff39', '#3de0ff', '#7b61ff', '#eeece6'];
  const GLYPHS = ['0', '1', '0', '1', '01', '10', '{ }', '</>', '▪', '◆', '✦', 'Σ', 'λ', '⌘', '#'];
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const rand = (a, b) => a + Math.random() * (b - a);

  class FX {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.small = window.matchMedia('(max-width: 768px)').matches;
      this.maxStreaks = this.small ? 50 : 120;
      this.maxBits = this.small ? 60 : 170;
      this.streaks = [];
      this.bits = [];
      this.vel = 0;
      this.accS = 0;
      this.accB = 0;
      this.mouse = { x: -1, y: -1 };
      this.last = performance.now();

      this.resize = this.resize.bind(this);
      this.loop = this.loop.bind(this);
      this.resize();
      window.addEventListener('resize', this.resize);
      window.addEventListener('pointermove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; }, { passive: true });
      requestAnimationFrame(this.loop);
    }

    resize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      this.canvas.width = Math.round(this.w * this.dpr);
      this.canvas.height = Math.round(this.h * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    // px/s, positive when scrolling down
    setVelocity(v) { this.vel = v; }

    spawnStreak(dir, speed) {
      if (this.streaks.length >= this.maxStreaks) return;
      this.streaks.push({
        x: rand(0, this.w),
        y: dir > 0 ? this.h + rand(0, 200) : -rand(0, 200),
        vy: -dir * rand(900, 1500 + speed * 1.2),
        len: Math.min(520, rand(40, 120) + speed * rand(0.06, 0.16)),
        wdt: rand(0.6, 2.2),
        c: pick(COLORS),
        life: 1,
        decay: rand(0.6, 1.2),
      });
    }

    spawnBit(dir, speed) {
      if (this.bits.length >= this.maxBits) return;
      const nearMouse = this.mouse.x >= 0 && Math.random() < 0.45;
      this.bits.push({
        x: nearMouse ? this.mouse.x + rand(-140, 140) : rand(0, this.w),
        y: nearMouse ? this.mouse.y + rand(-140, 140) : (dir > 0 ? rand(this.h * 0.3, this.h + 40) : rand(-40, this.h * 0.7)),
        vx: rand(-80, 80),
        vy: -dir * rand(120, 260 + speed * 0.35),
        rot: rand(-0.6, 0.6),
        vr: rand(-4, 4),
        size: rand(10, 22),
        g: pick(GLYPHS),
        c: pick(COLORS),
        life: 1,
        decay: rand(0.5, 1.1),
      });
    }

    loop(now) {
      requestAnimationFrame(this.loop);
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;

      const speed = Math.abs(this.vel);
      const dir = this.vel >= 0 ? 1 : -1;
      if (speed > 180) {
        this.accS += (speed - 180) * dt * 0.018;
        this.accB += (speed - 180) * dt * 0.01;
        while (this.accS >= 1) { this.spawnStreak(dir, speed); this.accS -= 1; }
        while (this.accB >= 1) { this.spawnBit(dir, speed); this.accB -= 1; }
      } else {
        this.accS = this.accB = 0;
      }
      this.vel *= 0.9;

      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      if (!this.streaks.length && !this.bits.length) return;
      ctx.globalCompositeOperation = 'lighter';

      // streaks
      ctx.lineCap = 'round';
      for (let i = this.streaks.length - 1; i >= 0; i--) {
        const s = this.streaks[i];
        s.y += s.vy * dt;
        s.life -= s.decay * dt;
        if (s.life <= 0 || s.y < -s.len - 300 || s.y > this.h + s.len + 300) { this.streaks.splice(i, 1); continue; }
        const tail = s.y - Math.sign(s.vy) * s.len;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x, tail);
        grad.addColorStop(0, s.c);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = Math.min(1, s.life * 1.4) * 0.85;
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.wdt;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x, tail);
        ctx.stroke();
      }

      // data bits
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = this.bits.length - 1; i >= 0; i--) {
        const b = this.bits[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vy *= 0.985;
        b.rot += b.vr * dt;
        b.life -= b.decay * dt;
        if (b.life <= 0) { this.bits.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, b.life * 1.6);
        ctx.fillStyle = b.c;
        ctx.font = `500 ${b.size}px "JetBrains Mono", monospace`;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillText(b.g, 0, 0);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  window.FX = FX;
})();
