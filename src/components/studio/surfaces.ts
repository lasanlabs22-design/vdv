import * as THREE from "three";

// Procedural floor finishes, drawn once on a canvas. They are near-white detail maps: the material colour
// (the tier's or the visitor's floor colour) tints them, so custom colours from the builder still apply.

export type Finish = "marble" | "wood" | "tile";

/** Metres covered by one repeat of each texture. */
export const finishSize: Record<Finish, number> = { marble: 1.2, wood: 1.2, tile: 0.6 };

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function draw(finish: Finish, ctx: CanvasRenderingContext2D, s: number) {
  const r = rng(finish === "marble" ? 11 : finish === "wood" ? 23 : 37);
  if (finish === "marble") {
    ctx.fillStyle = "#fbfaf8";
    ctx.fillRect(0, 0, s, s);
    // Soft clouds, then wide blurred veins, then fine sharp veins on top.
    for (let i = 0; i < 40; i++) {
      const g = ctx.createRadialGradient(r() * s, r() * s, 0, r() * s, r() * s, s * (0.1 + r() * 0.3));
      g.addColorStop(0, `rgba(205,198,188,${0.06 + r() * 0.06})`);
      g.addColorStop(1, "rgba(205,198,188,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    }
    const vein = (width: number, alpha: number, blur: number, tone: string) => {
      ctx.filter = blur ? `blur(${blur}px)` : "none";
      ctx.strokeStyle = `rgba(${tone},${alpha})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      let x = r() * s, y = -20;
      ctx.moveTo(x, y);
      while (y < s + 20) {
        const nx = x + (r() - 0.5) * s * 0.35, ny = y + s * (0.08 + r() * 0.12);
        ctx.quadraticCurveTo(x + (r() - 0.5) * s * 0.3, (y + ny) / 2, nx, ny);
        x = nx;
        y = ny;
      }
      ctx.stroke();
    };
    for (let i = 0; i < 5; i++) vein(10 + r() * 14, 0.12, 8, "150,140,128");
    for (let i = 0; i < 9; i++) vein(1 + r() * 1.6, 0.35, 0, "120,110,100");
    for (let i = 0; i < 3; i++) vein(1.4, 0.45, 0, "190,150,70");
    ctx.filter = "none";
    // Hairline joint between slabs.
    ctx.strokeStyle = "rgba(170,160,150,0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, s - 2, s - 2);
  } else if (finish === "wood") {
    const planks = 6;
    const pw = s / planks;
    for (let p = 0; p < planks; p++) {
      const base = 0.84 + r() * 0.14;
      const c = Math.round(255 * base);
      ctx.fillStyle = `rgb(${c},${Math.round(c * 0.96)},${Math.round(c * 0.9)})`;
      ctx.fillRect(p * pw, 0, pw, s);
      // Long grain lines with gentle waves.
      for (let g = 0; g < 26; g++) {
        ctx.strokeStyle = `rgba(90,60,30,${0.04 + r() * 0.1})`;
        ctx.lineWidth = 0.6 + r() * 1.6;
        ctx.beginPath();
        const x0 = p * pw + r() * pw;
        ctx.moveTo(x0, 0);
        for (let y = 0; y <= s; y += s / 8) ctx.lineTo(x0 + Math.sin(y * 0.02 + g) * (2 + r() * 3), y);
        ctx.stroke();
      }
      // A knot now and then.
      if (r() > 0.55) {
        const kx = p * pw + pw * (0.3 + r() * 0.4), ky = r() * s;
        for (let k = 5; k > 0; k--) {
          ctx.strokeStyle = `rgba(80,50,25,${0.08 + k * 0.02})`;
          ctx.beginPath();
          ctx.ellipse(kx, ky, k * 2.2, k * 5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      // Seams: plank edges and a staggered butt joint.
      ctx.fillStyle = "rgba(60,40,20,0.45)";
      ctx.fillRect(p * pw, 0, 2, s);
      ctx.fillRect(p * pw, ((p * 0.37) % 1) * s, pw, 2);
    }
  } else {
    ctx.fillStyle = "#f6f3ee";
    ctx.fillRect(0, 0, s, s);
    const img = ctx.getImageData(0, 0, s, s);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (r() - 0.5) * 14;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
    ctx.strokeStyle = "rgba(150,140,128,0.7)";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, s - 4, s - 4);
  }
}

const cache = new Map<Finish, THREE.CanvasTexture>();

function base(finish: Finish) {
  let tex = cache.get(finish);
  if (!tex) {
    const s = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = s;
    draw(finish, canvas.getContext("2d")!, s);
    tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    cache.set(finish, tex);
  }
  return tex;
}

/** A floor texture repeated to true scale over a w × d metre floor. */
export function floorMap(finish: Finish, w: number, d: number) {
  const t = base(finish).clone();
  t.repeat.set(w / finishSize[finish], d / finishSize[finish]);
  t.needsUpdate = true;
  return t;
}
