/* =========================================================
   Field: a 3D particle cloud rendered on a 2D canvas.
   Morphs between shapes (sphere, helix, knot, wave, cube,
   galaxy), reacts to the pointer and to scroll velocity.
   ========================================================= */
(() => {
  const TAU = Math.PI * 2;
  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---------- shape generators: each returns Float32Array(N*3) ---------- */
  function sphere(N) {
    const a = new Float32Array(N * 3);
    const ringN = Math.floor(N * 0.24);
    const sN = N - ringN;
    const g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < sN; i++) {
      const y = 1 - (i / (sN - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = g * i;
      const R = 1 + gauss() * 0.012;
      a[i * 3] = Math.cos(th) * r * R;
      a[i * 3 + 1] = y * R;
      a[i * 3 + 2] = Math.sin(th) * r * R;
    }
    const tilt = 0.45;
    for (let i = sN; i < N; i++) {
      const t = rand(0, TAU);
      const R = rand(1.42, 1.9);
      const x = Math.cos(t) * R, z = Math.sin(t) * R, y = gauss() * 0.02;
      a[i * 3] = x;
      a[i * 3 + 1] = y * Math.cos(tilt) - z * Math.sin(tilt);
      a[i * 3 + 2] = y * Math.sin(tilt) + z * Math.cos(tilt);
    }
    return a;
  }

  function helix(N) {
    const a = new Float32Array(N * 3);
    const L = 4, r = 0.55, f = (2.4 * TAU) / L, rungs = 34;
    for (let i = 0; i < N; i++) {
      const kind = i % 5;
      let x, y, z;
      if (kind < 4) {
        const s = kind < 2 ? 0 : Math.PI;
        x = rand(-L / 2, L / 2);
        const ang = x * f + s;
        y = Math.cos(ang) * r + gauss() * 0.035;
        z = Math.sin(ang) * r + gauss() * 0.035;
      } else {
        const k = Math.floor(rand(0, rungs));
        x = -L / 2 + ((k + 0.5) * L) / rungs;
        const ang = x * f, t = rand(-1, 1);
        y = Math.cos(ang) * r * t;
        z = Math.sin(ang) * r * t;
      }
      a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
    }
    return a;
  }

  function knot(N) {
    const a = new Float32Array(N * 3);
    const p = 2, q = 3, s = 0.5;
    for (let i = 0; i < N; i++) {
      const t = rand(0, TAU);
      const r = Math.cos(q * t) + 2;
      const cx = r * Math.cos(p * t) * s, cy = r * Math.sin(p * t) * s, cz = -Math.sin(q * t) * s;
      // random offset inside the tube
      const u = rand(0, TAU), v = Math.acos(rand(-1, 1)), rr = 0.16 * Math.sqrt(Math.random());
      a[i * 3] = cx + rr * Math.sin(v) * Math.cos(u);
      a[i * 3 + 1] = cy + rr * Math.sin(v) * Math.sin(u);
      a[i * 3 + 2] = cz + rr * Math.cos(v);
    }
    return a;
  }

  function wave(N) {
    const a = new Float32Array(N * 3);
    const side = Math.ceil(Math.sqrt(N));
    const S = 2.4;
    for (let i = 0; i < N; i++) {
      const gx = i % side, gz = Math.floor(i / side);
      a[i * 3] = (gx / (side - 1)) * 2 * S - S;
      a[i * 3 + 1] = 0;
      a[i * 3 + 2] = (gz / (side - 1)) * 2 * S - S;
    }
    return a;
  }

  function cube(N) {
    const a = new Float32Array(N * 3);
    const s = 0.9, grid = 4;
    for (let i = 0; i < N; i++) {
      const face = Math.floor(rand(0, 6));
      let u = rand(-1, 1), v = rand(-1, 1);
      if (Math.random() < 0.5) u = Math.round(u * grid) / grid; else v = Math.round(v * grid) / grid;
      let x, y, z;
      switch (face) {
        case 0: x = 1; y = u; z = v; break;
        case 1: x = -1; y = u; z = v; break;
        case 2: y = 1; x = u; z = v; break;
        case 3: y = -1; x = u; z = v; break;
        case 4: z = 1; x = u; y = v; break;
        default: z = -1; x = u; y = v;
      }
      a[i * 3] = x * s; a[i * 3 + 1] = y * s; a[i * 3 + 2] = z * s;
    }
    return a;
  }

  function galaxy(N) {
    const a = new Float32Array(N * 3);
    const arms = 3, maxR = 2.2;
    for (let i = 0; i < N; i++) {
      let x, y, z;
      if (i % 7 === 0) {
        x = gauss() * 0.28; y = gauss() * 0.18; z = gauss() * 0.28;
      } else {
        const r = Math.pow(Math.random(), 0.7) * maxR;
        const arm = i % arms;
        const spread = 0.42 * (1.15 - r / maxR);
        const ang = (arm * TAU) / arms + r * 2.3 + gauss() * spread;
        x = Math.cos(ang) * r;
        z = Math.sin(ang) * r;
        y = gauss() * 0.07 * (1.3 - r / maxR);
      }
      a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
    }
    return a;
  }

  /* ---------- colour ramp: far → near ---------- */
  const STOPS = [[123, 97, 255], [61, 224, 255], [180, 255, 57]];
  function ramp(t) {
    const seg = t < 0.5 ? 0 : 1;
    const k = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    const A = STOPS[seg], B = STOPS[seg + 1];
    return [0, 1, 2].map((j) => Math.round(A[j] + (B[j] - A[j]) * k));
  }

  class Field {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.small = window.matchMedia('(max-width: 768px)').matches;
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const N = (this.N = this.small ? 1500 : 3400);

      this.shapes = {
        sphere: sphere(N), helix: helix(N), knot: knot(N),
        wave: wave(N), cube: cube(N), galaxy: galaxy(N),
      };
      this.pos = new Float32Array(N * 3);
      this.from = new Float32Array(N * 3);
      this.to = null;
      this.shape = null;
      this.delay = new Float32Array(N);
      this.jit = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        this.delay[i] = Math.random() * 0.4;
        this.jit[i * 3] = gauss() * 1.1;
        this.jit[i * 3 + 1] = gauss() * 1.1;
        this.jit[i * 3 + 2] = gauss() * 1.1;
      }
      this.morph = 1;
      this.morphDur = 1.8;
      this.morphStart = 0;

      this.view = { x: 0, y: 0, scale: 1, alpha: 0, wave: 0, tilt: 0.3 };
      this.target = { ...this.view };
      this.mouse = { x: -9999, y: -9999, nx: 0, ny: 0, tnx: 0, tny: 0 };
      this.spin = 0;
      this.vel = 0;
      this.time = 0;

      this.B = 12;
      this.bx = []; this.by = []; this.bs = [];
      this.bc = new Int32Array(this.B);
      this.colors = [];
      for (let b = 0; b < this.B; b++) {
        this.bx.push(new Float32Array(N));
        this.by.push(new Float32Array(N));
        this.bs.push(new Float32Array(N));
        const c = ramp(b / (this.B - 1));
        this.colors.push({ rgb: `rgb(${c[0]},${c[1]},${c[2]})`, a: 0.18 + (b / (this.B - 1)) * 0.8 });
      }

      this.resize = this.resize.bind(this);
      this.loop = this.loop.bind(this);
      this.resize();
      window.addEventListener('resize', this.resize);
      window.addEventListener('pointermove', (e) => {
        this.mouse.x = e.clientX; this.mouse.y = e.clientY;
        this.mouse.tnx = (e.clientX / this.w) * 2 - 1;
        this.mouse.tny = (e.clientY / this.h) * 2 - 1;
      }, { passive: true });
      document.addEventListener('pointerleave', () => { this.mouse.x = this.mouse.y = -9999; });
      this.t0 = performance.now();
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

    setShape(name, view) {
      if (view) Object.assign(this.target, view);
      this.target.wave = name === 'wave' ? 1 : 0;
      if (name === this.shape || !this.shapes[name]) return;
      this.from.set(this.pos);
      this.to = this.shapes[name];
      this.shape = name;
      this.morphStart = this.time;
      this.morph = 0;
    }

    setVelocity(v) { this.vel = v; }

    loop(now) {
      requestAnimationFrame(this.loop);
      const t = (now - this.t0) / 1000;
      const dt = Math.min(0.05, Math.max(0, t - this.time));
      this.time = t;

      // ease view toward target
      const k = 1 - Math.exp(-dt * 2.6);
      const V = this.view, T = this.target;
      V.x += (T.x - V.x) * k; V.y += (T.y - V.y) * k;
      V.scale += (T.scale - V.scale) * k;
      V.alpha += (T.alpha - V.alpha) * k;
      V.wave += (T.wave - V.wave) * k;
      V.tilt += (T.tilt - V.tilt) * k;
      const M = this.mouse;
      M.nx += (M.tnx - M.nx) * k; M.ny += (M.tny - M.ny) * k;

      // morph positions
      if (this.to && this.morph < 1) {
        const mp = clamp((t - this.morphStart) / this.morphDur, 0, 1);
        this.morph = mp;
        const { pos, from, to, delay, jit } = this;
        for (let i = 0, n = this.N; i < n; i++) {
          const local = clamp((mp - delay[i]) / 0.6, 0, 1);
          const e = easeInOut(local);
          const bump = Math.sin(local * Math.PI) * 0.55;
          const i3 = i * 3;
          pos[i3] = from[i3] + (to[i3] - from[i3]) * e + jit[i3] * bump;
          pos[i3 + 1] = from[i3 + 1] + (to[i3 + 1] - from[i3 + 1]) * e + jit[i3 + 1] * bump;
          pos[i3 + 2] = from[i3 + 2] + (to[i3 + 2] - from[i3 + 2]) * e + jit[i3 + 2] * bump;
        }
      }

      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      if (V.alpha < 0.01) return;

      // rotation: base spin + scroll velocity + pointer
      const speed = this.reduced ? 0.02 : 0.12 + Math.min(Math.abs(this.vel) * 0.0005, 1.4);
      this.spin += dt * speed;
      this.vel *= 0.94;
      const ry = this.spin + M.nx * 0.45;
      const rx = V.tilt + M.ny * 0.25;
      const cy_ = Math.cos(ry), sy_ = Math.sin(ry), cx_ = Math.cos(rx), sx_ = Math.sin(rx);

      const S = Math.min(this.w, this.h) * 0.34 * V.scale;
      const ox = this.w / 2 + V.x * this.w, oy = this.h / 2 + V.y * this.h;
      const cam = 3.8;
      const mx = M.x, my = M.y, R = 150, R2 = R * R;
      const waveAmp = V.wave * 0.3;
      const B = this.B, bc = this.bc, bx = this.bx, by = this.by, bs = this.bs, pos = this.pos;
      bc.fill(0);

      for (let i = 0, n = this.N; i < n; i++) {
        const i3 = i * 3;
        const x = pos[i3], z = pos[i3 + 2];
        let y = pos[i3 + 1];
        if (waveAmp > 0.002) y += waveAmp * Math.sin(x * 2.1 + t * 1.3) * Math.cos(z * 1.7 + t * 0.9);

        const x1 = x * cy_ - z * sy_;
        const z1 = x * sy_ + z * cy_;
        const y1 = y * cx_ - z1 * sx_;
        const z2 = y * sx_ + z1 * cx_;
        const d = cam + z2;
        if (d < 0.2) continue;
        const p = cam / d;
        let px = ox + x1 * p * S;
        let py = oy + y1 * p * S;

        const dx = px - mx, dy = py - my, dd = dx * dx + dy * dy;
        if (dd < R2) {
          const dist = Math.sqrt(dd) || 1;
          const f = 1 - dist / R;
          px += (dx / dist) * f * f * 70;
          py += (dy / dist) * f * f * 70;
        }
        if (px < -10 || px > this.w + 10 || py < -10 || py > this.h + 10) continue;

        const b = clamp(((2.4 - z2) / 4.8) * B, 0, B - 1) | 0;
        const c = bc[b]++;
        bx[b][c] = px; by[b][c] = py; bs[b][c] = Math.max(0.7, p * 1.25);
      }

      for (let b = 0; b < B; b++) {
        const n = bc[b];
        if (!n) continue;
        ctx.fillStyle = this.colors[b].rgb;
        ctx.globalAlpha = this.colors[b].a * V.alpha;
        const X = bx[b], Y = by[b], Z = bs[b];
        for (let j = 0; j < n; j++) {
          const s = Z[j];
          ctx.fillRect(X[j] - s / 2, Y[j] - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  window.Field = Field;
})();
