import { useEffect, useRef, useState } from "react";

interface Props {
  scene?: string;
  showMechanism?: boolean;
  showForceBalance?: boolean;
  showStorm?: boolean;
  showGrounding?: boolean;
  showShielding?: boolean;
  interactive?: boolean;
  showElectronTransfer?: boolean;
  showFactory?: boolean;
  showParticles?: boolean;
  showFreeCharges?: boolean;
  animated?: boolean;
  showBeforeAfter?: boolean;
  showInduction?: boolean;
  showAttraction?: boolean;
  onContextChange?: (ctx: string) => void;
}

const W = 700, H = 440;

export default function ImmersiveElectrostatics({
  scene = "van-de-graaff",
  showMechanism = true,
  showForceBalance = false,
  showStorm = true,
  showGrounding = true,
  showShielding = true,
  showElectronTransfer = true,
  showFactory = true,
  showParticles = true,
  showFreeCharges = true,
  animated = true,
  showBeforeAfter = true,
  showInduction = true,
  showAttraction = true,
  onContextChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  // Scene-specific state
  const [vdgCharge, setVdgCharge] = useState(0);
  const [dropVelocity, setDropVelocity] = useState(0);
  const [dropY, setDropY] = useState(150);
  const [fieldOn, setFieldOn] = useState(true);
  const [phase, setPhase] = useState<"before" | "after">("before");

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      timeRef.current += 0.016;
      draw(timeRef.current);
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [scene, vdgCharge, fieldOn, phase, dropY]);

  function draw(t: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);

    switch (scene) {
      case "van-de-graaff": drawVanDeGraaff(ctx, t); break;
      case "millikan": drawMillikan(ctx, t); break;
      case "lightning-rod": drawLightningRod(ctx, t); break;
      case "faraday-cage": drawFaradayCage(ctx, t); break;
      case "triboelectric": drawTriboelectric(ctx, t); break;
      case "precipitator": drawPrecipitator(ctx, t); break;
      case "induction": drawInduction(ctx, t); break;
      case "quantization": drawQuantization(ctx, t); break;
      case "conservation": drawConservation(ctx, t); break;
      case "comb-paper": drawCombPaper(ctx, t); break;
      default: drawVanDeGraaff(ctx, t);
    }
  }

  // ── Van de Graaff Generator ─────────────────────────────────────────────
  function drawVanDeGraaff(ctx: CanvasRenderingContext2D, t: number) {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#1a1030"); sky.addColorStop(1, "#0d0820");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // Lab floor
    const floor = ctx.createLinearGradient(0, H - 60, 0, H);
    floor.addColorStop(0, "#1a1a2e"); floor.addColorStop(1, "#111120");
    ctx.fillStyle = floor; ctx.fillRect(0, H - 60, W, 60);
    ctx.strokeStyle = "rgba(100,100,200,0.3)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H - 60); ctx.lineTo(W, H - 60); ctx.stroke();

    const vdgX = W / 2;

    // Column (insulating pillar)
    const colGrad = ctx.createLinearGradient(vdgX - 18, 0, vdgX + 18, 0);
    colGrad.addColorStop(0, "#2a1a40"); colGrad.addColorStop(0.5, "#3d2a60"); colGrad.addColorStop(1, "#2a1a40");
    ctx.fillStyle = colGrad;
    ctx.fillRect(vdgX - 18, H - 60 - 220, 36, 220);
    ctx.strokeStyle = "rgba(150,100,200,0.3)"; ctx.lineWidth = 1;
    ctx.strokeRect(vdgX - 18, H - 60 - 220, 36, 220);

    // Animated belt
    const beltSpeed = 0.8;
    for (let i = 0; i < 8; i++) {
      const frac = ((t * beltSpeed + i / 8) % 1);
      const by = H - 60 - 220 + frac * 220;
      ctx.fillStyle = "rgba(150,120,60,0.6)";
      ctx.fillRect(vdgX - 6, by - 5, 12, 10);
      // Charge marks on belt going up (left side = going up)
      if (frac < 0.5) {
        ctx.fillStyle = "rgba(255,200,100,0.6)";
        ctx.font = "10px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("+", vdgX - 10, by + 4);
      }
    }

    // Dome (metal sphere)
    const domeR = 80;
    const domeY = H - 60 - 220 - domeR + 10;
    const chargeLevel = (Math.sin(t * 0.3) + 1) / 2;
    const domeGlow = ctx.createRadialGradient(vdgX - 20, domeY - 20, 10, vdgX, domeY, domeR);
    domeGlow.addColorStop(0, `rgba(255,220,100,${0.1 + chargeLevel * 0.3})`);
    domeGlow.addColorStop(0.6, `rgba(200,170,80,${0.05 + chargeLevel * 0.1})`);
    domeGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = domeGlow;
    ctx.beginPath(); ctx.arc(vdgX, domeY, domeR + 30, 0, Math.PI * 2); ctx.fill();

    const metalGrad = ctx.createRadialGradient(vdgX - 25, domeY - 25, 5, vdgX, domeY, domeR);
    metalGrad.addColorStop(0, "#ffe080"); metalGrad.addColorStop(0.3, "#d4aa50");
    metalGrad.addColorStop(0.7, "#8a6820"); metalGrad.addColorStop(1, "#5a4010");
    ctx.fillStyle = metalGrad;
    ctx.beginPath(); ctx.arc(vdgX, domeY, domeR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(255,220,100,${0.4 + chargeLevel * 0.4})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(vdgX, domeY, domeR, 0, Math.PI * 2); ctx.stroke();

    // + charges on dome surface (accumulate with time)
    const numCharges = Math.floor(6 + chargeLevel * 8);
    for (let i = 0; i < numCharges; i++) {
      const angle = (2 * Math.PI * i) / numCharges + t * 0.1;
      const sx = vdgX + domeR * Math.cos(angle), sy = domeY + domeR * Math.sin(angle);
      ctx.fillStyle = "rgba(255,230,100,0.9)";
      ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("+", sx, sy + 4);
    }

    // Spark discharge (when charge is high)
    if (chargeLevel > 0.85) {
      const sparkLen = 50 + Math.random() * 30;
      const sparkAngle = Math.random() * 2 * Math.PI;
      ctx.strokeStyle = `rgba(255,255,200,${0.5 + Math.random() * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let sx = vdgX + domeR * Math.cos(sparkAngle), sy2 = domeY + domeR * Math.sin(sparkAngle);
      ctx.moveTo(sx, sy2);
      for (let s = 0; s < 8; s++) {
        sx += (Math.random() - 0.5) * 15 + sparkLen / 8 * Math.cos(sparkAngle);
        sy2 += (Math.random() - 0.5) * 15 + sparkLen / 8 * Math.sin(sparkAngle);
        ctx.lineTo(sx, sy2);
      }
      ctx.stroke();
    }

    // Voltage label
    const voltage = (chargeLevel * 2.5).toFixed(1);
    ctx.fillStyle = "#ffdd60"; ctx.font = "bold 16px monospace"; ctx.textAlign = "center";
    ctx.fillText(`${voltage} MV`, vdgX, domeY - domeR - 15);

    // Labels
    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "bold 13px sans-serif";
    ctx.fillText("Van de Graaff Generator", vdgX, H - 30);
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "11px sans-serif";
    ctx.fillText("Belt carries + charges to dome → voltage builds up to millions of volts", vdgX, H - 12);

    // Mechanism labels
    ctx.fillStyle = "rgba(150,100,200,0.8)"; ctx.font = "11px sans-serif"; ctx.textAlign = "left";
    ctx.fillText("Insulating", vdgX + 25, H - 60 - 110);
    ctx.fillText("column", vdgX + 25, H - 60 - 95);
    ctx.fillStyle = "rgba(150,120,60,0.8)";
    ctx.fillText("Rotating belt", vdgX - 90, H - 60 - 100);
    ctx.fillStyle = "#ffdd60";
    ctx.fillText("Metal dome", vdgX + domeR + 10, domeY);
    ctx.fillText("(+ charges accumulate)", vdgX + domeR + 10, domeY + 15);
  }

  // ── Millikan Oil Drop ───────────────────────────────────────────────────
  function drawMillikan(ctx: CanvasRenderingContext2D, t: number) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0a0e1a"); bg.addColorStop(1, "#0d1525");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const chamberX = W / 2 - 130, chamberW = 260, chamberY = 60, chamberH = 280;

    // Plates
    const plateColor = ctx.createLinearGradient(chamberX, 0, chamberX + chamberW, 0);
    plateColor.addColorStop(0, "#1a3050"); plateColor.addColorStop(1, "#2a4060");
    ctx.fillStyle = plateColor;
    ctx.fillRect(chamberX, chamberY, chamberW, 18); // top plate (-)
    ctx.fillRect(chamberX, chamberY + chamberH - 18, chamberW, 18); // bottom plate (+)

    // Plate labels
    ctx.fillStyle = "#4488ff"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left";
    ctx.fillText("− − − − − − − −  (−plate)", chamberX + 5, chamberY + 13);
    ctx.fillStyle = "#ff8844";
    ctx.fillText("+ + + + + + + +  (+plate)", chamberX + 5, chamberY + chamberH - 4);

    // Electric field arrows (upward, from + to - convention: force on −charge goes down, on +charge goes up)
    if (fieldOn) {
      for (let x = chamberX + 30; x < chamberX + chamberW - 20; x += 50) {
        const frac = (t * 0.15 + x * 0.005) % 1;
        const fy = chamberY + chamberH - 20 - frac * (chamberH - 40);
        drawArrow(ctx, x, fy + 20, x, fy - 20, "rgba(100,200,255,0.5)");
      }
      ctx.fillStyle = "rgba(100,200,255,0.7)"; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
      ctx.fillText("E ↑", chamberX - 5, chamberY + chamberH / 2);
    }

    // Oil drops
    const drops = [
      { y: 0.3, q: -1, label: "q = −e", vy: 0.002 },
      { y: 0.55, q: -2, label: "q = −2e", vy: -0.001 },
      { y: 0.7, q: -3, label: "q = −3e", vy: -0.003 },
    ];

    for (const drop of drops) {
      const dy = chamberY + 20 + drop.y * (chamberH - 40);
      const dx = chamberX + chamberW / 2;

      // Drop
      const dGrad = ctx.createRadialGradient(dx - 3, dy - 3, 1, dx, dy, 9);
      dGrad.addColorStop(0, "#ffe090"); dGrad.addColorStop(1, "#d47820");
      ctx.fillStyle = dGrad;
      ctx.beginPath(); ctx.arc(dx, dy, 9, 0, Math.PI * 2); ctx.fill();

      // Gravity arrow (down)
      drawArrow(ctx, dx, dy + 10, dx, dy + 28, "rgba(255,100,100,0.8)");
      ctx.fillStyle = "#ff8080"; ctx.font = "9px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("F_g ↓", dx + 25, dy + 22);

      // Electric force arrow (up for negative charges in upward E)
      if (fieldOn) {
        drawArrow(ctx, dx, dy - 10, dx, dy - 28, "rgba(100,220,100,0.8)");
        ctx.fillStyle = "#80ff80"; ctx.font = "9px sans-serif";
        ctx.fillText("F_E ↑", dx + 25, dy - 18);
      }

      // Label
      ctx.fillStyle = "rgba(255,220,100,0.9)"; ctx.font = "bold 10px monospace";
      ctx.fillText(drop.label, dx - 45, dy + 4);
    }

    // Balanced drop indicator
    ctx.fillStyle = "rgba(100,255,100,0.8)"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Balanced: qE = mg  →  q = mg/E = ne", W / 2, H - 60);
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "11px sans-serif";
    ctx.fillText("All measured charges are multiples of e = 1.6×10⁻¹⁹ C → Charge Quantization!", W / 2, H - 40);
    ctx.fillText("Millikan (1909): Nobel Prize 1923", W / 2, H - 22);
  }

  // ── Lightning Rod ───────────────────────────────────────────────────────
  function drawLightningRod(ctx: CanvasRenderingContext2D, t: number) {
    // Storm sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#0a0a15"); sky.addColorStop(0.5, "#151525"); sky.addColorStop(1, "#1a1a35");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // Lightning flashes in background
    if (Math.sin(t * 2.3) > 0.8) {
      ctx.fillStyle = "rgba(200,200,255,0.1)";
      ctx.fillRect(0, 0, W, H);
    }

    // Clouds
    for (let c = 0; c < 3; c++) {
      const cx2 = 150 + c * 200, cy2 = 60 + c * 15;
      ctx.fillStyle = `rgba(40,40,80,${0.8 + 0.2 * Math.sin(t + c)})`;
      ctx.beginPath(); ctx.arc(cx2, cy2, 55, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx2 + 40, cy2 + 10, 40, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx2 - 30, cy2 + 10, 35, 0, Math.PI * 2); ctx.fill();
      // Negative charges in cloud
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = "#8888ff"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("−", cx2 - 30 + i * 20, cy2 + 15);
      }
    }

    // Ground
    const groundGrad = ctx.createLinearGradient(0, H - 70, 0, H);
    groundGrad.addColorStop(0, "#1a2a10"); groundGrad.addColorStop(1, "#0d1508");
    ctx.fillStyle = groundGrad; ctx.fillRect(0, H - 70, W, 70);

    // Building
    ctx.fillStyle = "#1a1a2a";
    ctx.fillRect(W / 2 - 60, H - 70 - 160, 120, 160);
    ctx.fillStyle = "#222235";
    // Windows
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const wx = W / 2 - 40 + col * 28, wy = H - 70 - 140 + row * 35;
        ctx.fillStyle = Math.random() > 0.7 ? "rgba(255,220,100,0.6)" : "rgba(60,60,100,0.5)";
        ctx.fillRect(wx, wy, 18, 22);
      }
    }

    // Lightning rod
    ctx.strokeStyle = "#c0c0c0"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(W / 2, H - 70 - 160); ctx.lineTo(W / 2, H - 70 - 200); ctx.stroke();
    // Sharp tip glow (corona discharge)
    const tipGlow = ctx.createRadialGradient(W / 2, H - 70 - 200, 0, W / 2, H - 70 - 200, 20);
    tipGlow.addColorStop(0, `rgba(200,200,255,${0.3 + 0.3 * Math.sin(t * 5)})`);
    tipGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = tipGlow;
    ctx.beginPath(); ctx.arc(W / 2, H - 70 - 200, 20, 0, Math.PI * 2); ctx.fill();

    // Lightning bolt striking rod
    if (Math.sin(t * 1.5) > 0.75) {
      drawLightningBolt(ctx, W / 2, 50, W / 2, H - 70 - 200);
    }

    // Grounding wire
    ctx.strokeStyle = "#c0c090"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(W / 2 + 2, H - 70 - 160); ctx.lineTo(W / 2 + 2, H - 70 + 20); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#c0c090"; ctx.font = "10px sans-serif"; ctx.textAlign = "left";
    ctx.fillText("Ground wire", W / 2 + 10, H - 60);

    // Labels
    ctx.fillStyle = "#80aaff"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Lightning Rod — Electrostatic Protection", W / 2, H - 8);
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "10px sans-serif";
    ctx.fillText("Sharp tip: high charge density → attracts lightning → safely conducts to Earth", W / 2, H + 8);
  }

  function drawLightningBolt(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    ctx.beginPath(); ctx.moveTo(x1, y1);
    let x = x1, y = y1;
    const steps = 12;
    for (let i = 1; i <= steps; i++) {
      x = x1 + (x2 - x1) * (i / steps) + (Math.random() - 0.5) * 40;
      y = y1 + (y2 - y1) * (i / steps);
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(255,255,200,0.9)"; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 8; ctx.stroke();
    ctx.strokeStyle = "rgba(200,200,255,0.2)"; ctx.lineWidth = 16; ctx.stroke();
  }

  // ── Faraday Cage ─────────────────────────────────────────────────────────
  function drawFaradayCage(ctx: CanvasRenderingContext2D, t: number) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#050a14"); bg.addColorStop(1, "#0a1520");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // External field arrows (horizontal, from left)
    for (let y = 60; y < H - 40; y += 45) {
      drawArrow(ctx, 20, y, 120, y, "rgba(255,200,100,0.5)");
      drawArrow(ctx, W - 120, y, W - 20, y, "rgba(255,200,100,0.5)");
    }
    ctx.fillStyle = "rgba(255,200,100,0.7)"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "left";
    ctx.fillText("External E →", 20, 30);

    // Cage (conducting mesh)
    const cageX = W / 2 - 140, cageY = 80, cageW = 280, cageH = 250;
    ctx.strokeStyle = "rgba(180,160,80,0.9)"; ctx.lineWidth = 3;
    ctx.strokeRect(cageX, cageY, cageW, cageH);

    // Mesh pattern inside cage walls
    ctx.strokeStyle = "rgba(180,160,80,0.4)"; ctx.lineWidth = 1;
    for (let x = cageX; x <= cageX + cageW; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, cageY); ctx.lineTo(x, cageY + cageH); ctx.stroke();
    }
    for (let y = cageY; y <= cageY + cageH; y += 25) {
      ctx.beginPath(); ctx.moveTo(cageX, y); ctx.lineTo(cageX + cageW, y); ctx.stroke();
    }

    // Inside — NO field
    ctx.fillStyle = "rgba(10,20,40,0.5)";
    ctx.fillRect(cageX + 3, cageY + 3, cageW - 6, cageH - 6);

    // "E = 0 inside" indicator
    ctx.fillStyle = "rgba(100,220,100,0.9)"; ctx.font = "bold 18px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("E = 0", cageX + cageW / 2, cageY + cageH / 2 - 10);
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "13px sans-serif";
    ctx.fillText("(inside cage)", cageX + cageW / 2, cageY + cageH / 2 + 12);

    // Person inside cage (safe from lightning)
    const px2 = cageX + cageW / 2;
    const py2 = cageY + cageH - 60;
    // Head
    ctx.fillStyle = "#ffccaa"; ctx.beginPath(); ctx.arc(px2, py2, 15, 0, Math.PI * 2); ctx.fill();
    // Body
    ctx.fillStyle = "#2244aa";
    ctx.fillRect(px2 - 10, py2 + 15, 20, 35);
    // Arms up (happy)
    ctx.strokeStyle = "#2244aa"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px2 - 10, py2 + 25); ctx.lineTo(px2 - 25, py2 + 15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px2 + 10, py2 + 25); ctx.lineTo(px2 + 25, py2 + 15); ctx.stroke();
    ctx.fillStyle = "#ffaa00"; ctx.font = "18px sans-serif"; ctx.fillText("😊", px2 - 9, py2 + 10);

    // Induced charges on cage walls
    const chargeCount = 8;
    for (let i = 0; i < chargeCount; i++) {
      const frac = i / chargeCount;
      // − on left wall, + on right wall
      ctx.fillStyle = "#8888ff"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("−", cageX + 5, cageY + 20 + frac * (cageH - 40));
      ctx.fillStyle = "#ff8844";
      ctx.fillText("+", cageX + cageW - 5, cageY + 20 + frac * (cageH - 40));
    }

    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Faraday Cage — Electromagnetic Shielding", W / 2, H - 30);
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "11px sans-serif";
    ctx.fillText("Induced charges on conductor surface cancel external field inside. Used in: MRI, cars, elevators", W / 2, H - 12);
  }

  // ── Triboelectric Charging ───────────────────────────────────────────────
  function drawTriboelectric(ctx: CanvasRenderingContext2D, t: number) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0a0e1a"); bg.addColorStop(1, "#0d1525");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const rubbing = Math.sin(t * 1.5);
    const isRubbing = rubbing > 0;
    const rubOffset = rubbing * 15;

    // Glass rod
    const rodX = W / 2 - 100 + rubOffset, rodY = 120;
    const rodGrad = ctx.createLinearGradient(rodX, rodY, rodX + 180, rodY);
    rodGrad.addColorStop(0, "#88aacc"); rodGrad.addColorStop(0.5, "#aaccee"); rodGrad.addColorStop(1, "#88aacc");
    ctx.fillStyle = rodGrad;
    roundRect2(ctx, rodX, rodY, 180, 30, 8); ctx.fill();
    ctx.strokeStyle = "rgba(150,180,220,0.6)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Glass Rod", rodX + 90, rodY + 19);

    // Silk cloth
    const silkX = W / 2 - 80 - rubOffset, silkY = 170;
    const silkColors = ["#cc4466", "#ee6688", "#ff88aa"];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = silkColors[i];
      ctx.fillRect(silkX + i * 50, silkY, 50, 60);
    }
    ctx.strokeStyle = "#cc2244"; ctx.lineWidth = 1;
    for (let x = silkX; x < silkX + 150; x += 10) {
      ctx.beginPath(); ctx.moveTo(x, silkY); ctx.lineTo(x, silkY + 60); ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Silk Cloth", silkX + 75, silkY + 40);

    // Electron transfer (when rubbing)
    if (isRubbing && showElectronTransfer) {
      for (let i = 0; i < 5; i++) {
        const ex = rodX + 30 + i * 30, ey = 160 + Math.sin(t * 4 + i) * 8;
        ctx.fillStyle = "#4488ff";
        ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#88aaff"; ctx.font = "8px sans-serif"; ctx.fillText("e⁻", ex - 4, ey - 6);
      }
    }

    // Result: rod becomes +, silk becomes -
    const cx2 = W / 2;
    const resultY = 280;
    // Charged glass rod
    ctx.fillStyle = rodGrad;
    roundRect2(ctx, cx2 - 250, resultY, 180, 30, 8); ctx.fill();
    ctx.strokeStyle = "rgba(150,180,220,0.6)"; ctx.lineWidth = 2; ctx.stroke();
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = "#ffaa40"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("+", cx2 - 230 + i * 28, resultY + 19);
    }
    ctx.fillStyle = "#ffaa40"; ctx.font = "bold 11px sans-serif";
    ctx.fillText("Glass rod → POSITIVE", cx2 - 160, resultY + 45);

    // Charged silk
    ctx.fillStyle = "#cc4466";
    ctx.fillRect(cx2 + 50, resultY, 150, 60);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = "#8888ff"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("−", cx2 + 70 + i * 20, resultY + 30);
    }
    ctx.fillStyle = "#8888ff"; ctx.font = "bold 11px sans-serif";
    ctx.fillText("Silk cloth → NEGATIVE", cx2 + 125, resultY + 78);

    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Rubbing transfers electrons from glass to silk", cx2, H - 45);
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "11px sans-serif";
    ctx.fillText("Glass loses e⁻ → becomes +ve | Silk gains e⁻ → becomes −ve", cx2, H - 28);
    ctx.fillText("Total charge = 0 (conservation of charge)", cx2, H - 11);
  }

  // ── Electrostatic Precipitator ───────────────────────────────────────────
  function drawPrecipitator(ctx: CanvasRenderingContext2D, t: number) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#151015"); sky.addColorStop(1, "#1a0a0a");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // Factory building
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(50, H - 180, 180, 180);
    ctx.fillStyle = "#333";
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(65 + i * 50, H - 160, 30, 40);
    }

    // Smokestacks
    for (let s = 0; s < 2; s++) {
      const sx = 120 + s * 80;
      ctx.fillStyle = "#444";
      ctx.fillRect(sx - 15, H - 280, 30, 100);
    }

    // Precipitator unit
    const precX = 280, precY = 100, precW = 200, precH = H - 160;
    ctx.fillStyle = "rgba(40,50,70,0.9)";
    ctx.fillRect(precX, precY, precW, precH);
    ctx.strokeStyle = "rgba(100,150,200,0.5)"; ctx.lineWidth = 2;
    ctx.strokeRect(precX, precY, precW, precH);

    // Collection plates inside
    for (let p = 0; p < 4; p++) {
      const px2 = precX + 25 + p * 45;
      ctx.fillStyle = "rgba(100,150,200,0.4)";
      ctx.fillRect(px2, precY + 10, 8, precH - 20);
      ctx.fillStyle = p % 2 === 0 ? "#ff8844" : "#4488ff";
      ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(p % 2 === 0 ? "+" : "−", px2 + 4, precY + precH / 2);
    }

    // Smoke particles flowing through
    for (let i = 0; i < 20; i++) {
      const py = precY + 10 + (((t * 0.1 + i * 0.05) % 1) * (precH - 20));
      const px2 = precX + 10 + (i % 5) * 40;
      const charged = i % 3 === 0;
      // Particle drifts toward plate if charged
      const drift = charged ? Math.sin(t + i) * 8 : 0;
      ctx.fillStyle = charged ? "rgba(255,150,50,0.8)" : "rgba(120,100,80,0.6)";
      ctx.beginPath(); ctx.arc(px2 + drift, py, 3, 0, Math.PI * 2); ctx.fill();
    }

    // Clean air exit
    ctx.fillStyle = "rgba(100,200,150,0.5)";
    ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("CLEAN AIR", precX + precW / 2, precY - 10);

    // Dirty air entry
    ctx.fillStyle = "rgba(150,100,50,0.7)";
    ctx.fillText("DIRTY SMOKE →", 160, H - 200);

    // Labels
    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "bold 12px sans-serif";
    ctx.fillText("Electrostatic Precipitator", precX + precW / 2, H - 30);
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "10px sans-serif";
    ctx.fillText("High voltage charges smoke particles → attracted to collection plates", W / 2, H - 12);

    // Right side clean air
    const cleanX = precX + precW + 30;
    const skyGrad = ctx.createLinearGradient(cleanX, 0, W - 20, 0);
    skyGrad.addColorStop(0, "rgba(100,200,150,0.1)"); skyGrad.addColorStop(1, "rgba(100,200,150,0.05)");
    ctx.fillStyle = skyGrad; ctx.fillRect(cleanX, precY, W - cleanX - 20, precH);
    ctx.fillStyle = "rgba(100,200,150,0.6)"; ctx.font = "11px sans-serif";
    ctx.fillText("Clean air", cleanX + 40, precY + precH / 2);
  }

  // ── Induction ─────────────────────────────────────────────────────────────
  function drawInduction(ctx: CanvasRenderingContext2D, t: number) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#050a14"); bg.addColorStop(1, "#0a1520");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const rodDist = 150 + 80 * Math.abs(Math.sin(t * 0.4));
    const rodX = 80, sphereX = 80 + rodDist, sphereY = H / 2, sphereR = 60;

    // Charged rod (approaching)
    ctx.fillStyle = "#88aacc";
    roundRect2(ctx, rodX - 20, sphereY - 80, 40, 160, 8); ctx.fill();
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = "#ffaa40"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("+", rodX, sphereY - 60 + i * 22);
    }
    ctx.fillStyle = "#ffaa40"; ctx.font = "bold 11px sans-serif";
    ctx.fillText("+ve rod", rodX, sphereY + 95);

    // Motion arrow
    drawArrow(ctx, rodX + 30, sphereY, rodX + 55, sphereY, "rgba(255,200,100,0.7)");

    // Conductor sphere
    const sGrad = ctx.createRadialGradient(sphereX - 15, sphereY - 15, 5, sphereX, sphereY, sphereR);
    sGrad.addColorStop(0, "#3a4060"); sGrad.addColorStop(1, "#1a2035");
    ctx.fillStyle = sGrad;
    ctx.beginPath(); ctx.arc(sphereX, sphereY, sphereR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(100,150,200,0.6)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sphereX, sphereY, sphereR, 0, Math.PI * 2); ctx.stroke();

    // Free charges in conductor
    const closeness = Math.max(0, 1 - rodDist / 200);
    const nearX = sphereX - sphereR * 0.6;
    const farX = sphereX + sphereR * 0.6;

    // Negative charges drift toward rod (+rod → − attracted → near side)
    for (let i = 0; i < 5; i++) {
      const y = sphereY - 30 + i * 15;
      const nx = nearX - closeness * 20;
      ctx.fillStyle = "#8888ff"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("−", nx, y + 4);
    }
    // Positive charges on far side
    for (let i = 0; i < 5; i++) {
      const y = sphereY - 30 + i * 15;
      const fx = farX + closeness * 20;
      ctx.fillStyle = "#ffaa40"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("+", fx, y + 4);
    }

    // Attraction force
    if (closeness > 0.3) {
      drawArrow(ctx, sphereX - sphereR - 5, sphereY, rodX + 25, sphereY, "rgba(255,100,100,0.5)");
      ctx.fillStyle = "rgba(255,100,100,0.7)"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("Attractive force", (sphereX - sphereR + rodX + 25) / 2, sphereY - 10);
    }

    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Electrostatic Induction — Without Contact", W / 2, H - 40);
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "10px sans-serif";
    ctx.fillText("Charged rod approaches → free electrons in conductor rearrange → induced charges appear", W / 2, H - 22);
    ctx.fillText("Net charge of conductor remains zero. Remove rod → charges redistribute back.", W / 2, H - 6);
  }

  // ── Charge Quantization ──────────────────────────────────────────────────
  function drawQuantization(ctx: CanvasRenderingContext2D, t: number) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#050a14"); bg.addColorStop(1, "#0a1520");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const charges = [
      { q: 1, y: 90, label: "q = 1e = 1.6×10⁻¹⁹ C" },
      { q: 2, y: 160, label: "q = 2e = 3.2×10⁻¹⁹ C" },
      { q: 3, y: 230, label: "q = 3e = 4.8×10⁻¹⁹ C" },
      { q: 5, y: 300, label: "q = 5e = 8.0×10⁻¹⁹ C" },
    ];

    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Charge Quantization: q = ne  (n = integer)", W / 2, 40);

    for (const c of charges) {
      const cx2 = 150;
      // Draw n electrons
      for (let i = 0; i < c.q; i++) {
        const ex = cx2 + i * 28, ey = c.y;
        ctx.fillStyle = "#4488ff"; ctx.beginPath(); ctx.arc(ex, ey, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("e", ex, ey + 4);
      }
      // = sign
      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "20px sans-serif";
      ctx.fillText("→", cx2 + c.q * 28 + 10, c.y + 7);
      // Total charge box
      ctx.fillStyle = "rgba(10,30,60,0.8)"; ctx.strokeStyle = "rgba(100,200,255,0.3)";
      roundRect2(ctx, cx2 + c.q * 28 + 40, c.y - 18, 250, 36, 6);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#64c8ff"; ctx.font = "bold 12px monospace"; ctx.textAlign = "left";
      ctx.fillText(c.label, cx2 + c.q * 28 + 50, c.y + 6);
    }

    ctx.fillStyle = "rgba(255,220,100,0.8)"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("e = 1.6 × 10⁻¹⁹ C (elementary charge)", W / 2, H - 45);
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "11px sans-serif";
    ctx.fillText("Charge is NOT continuous — it only comes in discrete multiples of e", W / 2, H - 28);
    ctx.fillText("Proven by Millikan (1909) | q can never be 1.5e or 2.7e", W / 2, H - 11);
  }

  // ── Conservation of Charge ───────────────────────────────────────────────
  function drawConservation(ctx: CanvasRenderingContext2D, t: number) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#050a14"); bg.addColorStop(1, "#0a1520");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const showAfterSec = phase === "after";

    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Conservation of Charge: Total charge is always constant", W / 2, 30);

    const by = H / 2;
    // Before
    ctx.fillStyle = "rgba(5,15,30,0.8)"; ctx.strokeStyle = "rgba(100,200,255,0.2)";
    roundRect2(ctx, 40, by - 80, 260, 160, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("BEFORE", 170, by - 55);

    // Object A: +5e, Object B: -2e
    ctx.beginPath(); ctx.arc(120, by - 15, 30, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,80,80,0.3)"; ctx.fill();
    ctx.strokeStyle = "#ff4444"; ctx.stroke();
    ctx.fillStyle = "#ff8080"; ctx.font = "bold 11px sans-serif";
    ctx.fillText("+5e", 120, by - 11);
    ctx.fillText("Object A", 120, by + 25);

    ctx.beginPath(); ctx.arc(230, by - 15, 30, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(80,80,255,0.3)"; ctx.fill();
    ctx.strokeStyle = "#4488ff"; ctx.stroke();
    ctx.fillStyle = "#8888ff"; ctx.font = "bold 11px sans-serif";
    ctx.fillText("−2e", 230, by - 11);
    ctx.fillText("Object B", 230, by + 25);

    ctx.fillStyle = "#ffdd60"; ctx.font = "bold 12px monospace";
    ctx.fillText("Total = +5e + (−2e) = +3e", 170, by + 55);

    // After (transfer charge)
    ctx.fillStyle = "rgba(5,15,30,0.8)"; ctx.strokeStyle = "rgba(100,200,100,0.3)";
    roundRect2(ctx, 400, by - 80, 260, 160, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("AFTER (they touch & separate)", 530, by - 55);

    ctx.beginPath(); ctx.arc(460, by - 15, 30, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,150,80,0.3)"; ctx.fill();
    ctx.strokeStyle = "#ff8844"; ctx.stroke();
    ctx.fillStyle = "#ffaa80"; ctx.font = "bold 11px sans-serif";
    ctx.fillText("+1e", 460, by - 11);
    ctx.fillText("Object A", 460, by + 25);

    ctx.beginPath(); ctx.arc(590, by - 15, 30, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(150,150,255,0.3)"; ctx.fill();
    ctx.strokeStyle = "#8888ff"; ctx.stroke();
    ctx.fillStyle = "#aaaaff"; ctx.font = "bold 11px sans-serif";
    ctx.fillText("+2e", 590, by - 11);
    ctx.fillText("Object B", 590, by + 25);

    ctx.fillStyle = "#80ff80"; ctx.font = "bold 12px monospace";
    ctx.fillText("Total = +1e + (+2e) = +3e ✓", 530, by + 55);

    // Arrow between
    drawArrow(ctx, 310, by - 10, 390, by - 10, "rgba(255,255,100,0.7)");
    ctx.fillStyle = "#ffff60"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("touch &\nseparate", 350, by - 22);

    ctx.fillStyle = "rgba(100,255,100,0.8)"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Total charge BEFORE = Total charge AFTER = +3e  ✓", W / 2, H - 35);
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "11px sans-serif";
    ctx.fillText("Charge is NEVER created or destroyed — only transferred", W / 2, H - 18);
  }

  // ── Comb and Paper ────────────────────────────────────────────────────────
  function drawCombPaper(ctx: CanvasRenderingContext2D, t: number) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0f1020"); bg.addColorStop(1, "#1a1535");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Table surface
    const tableGrad = ctx.createLinearGradient(0, H - 100, 0, H);
    tableGrad.addColorStop(0, "#3a2a1a"); tableGrad.addColorStop(1, "#2a1a0a");
    ctx.fillStyle = tableGrad; ctx.fillRect(0, H - 100, W, 100);
    ctx.strokeStyle = "rgba(150,100,50,0.4)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H - 100); ctx.lineTo(W, H - 100); ctx.stroke();

    const combX = 200 + 80 * Math.abs(Math.sin(t * 0.6));
    const combY = H - 100 - 140;
    const closeness = Math.max(0, 1 - Math.abs(combX - 350) / 150);

    // Comb (charged)
    ctx.fillStyle = "#333";
    ctx.fillRect(combX - 15, combY, 30, 80);
    // Comb teeth
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(combX - 12 + i * 4, combY + 80, 3, 20);
    }
    // − charges on comb
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = "#8888ff"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("−", combX - 5 + i * 5, combY + 40 + i * 10);
    }
    ctx.fillStyle = "#8888ff"; ctx.font = "10px sans-serif";
    ctx.fillText("Charged comb", combX, combY - 12);
    ctx.fillText("(−ve after rubbing hair)", combX, combY - 0);

    // Paper bits on table
    for (let i = 0; i < 8; i++) {
      const px2 = 320 + i * 22;
      const attract = closeness * 25 * Math.max(0, 1 - Math.abs(px2 - combX) / 100);
      const py = H - 100 - 15 - attract;
      const paperRot = attract * 0.1 * (i % 2 === 0 ? 1 : -1);

      ctx.save();
      ctx.translate(px2, py);
      ctx.rotate(paperRot);
      ctx.fillStyle = "rgba(240,235,220,0.9)";
      ctx.fillRect(-8, -4, 16, 8);
      // Induced charges — − on far side, + on near side (toward comb)
      if (attract > 5) {
        ctx.fillStyle = "#8888ff"; ctx.font = "8px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("−", combX < px2 ? -6 : 6, 3);
        ctx.fillStyle = "#ff8844";
        ctx.fillText("+", combX < px2 ? 6 : -6, 3);
      }
      ctx.restore();
    }

    // Attraction force arrows
    if (closeness > 0.3) {
      for (let i = 0; i < 4; i++) {
        const px2 = 330 + i * 30;
        const dist = Math.abs(px2 - combX);
        if (dist < 120) {
          drawArrow(ctx, px2, H - 120, combX > px2 ? px2 + 15 : px2 - 15, H - 120, "rgba(255,150,100,0.6)");
        }
      }
    }

    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Comb Attracts Paper — Everyday Electrostatics!", W / 2, H - 45);
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "11px sans-serif";
    ctx.fillText("Charged comb induces opposite charge on near side of paper → attraction (induction)", W / 2, H - 28);
    ctx.fillText("Paper is neutral overall, but near side is +ve → net attraction to −ve comb", W / 2, H - 11);
  }

  function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 3) return;
    const ux = dx / len, uy = dy / len;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 7 * ux + 3 * uy, y2 - 7 * uy - 3 * ux);
    ctx.lineTo(x2 - 7 * ux - 3 * uy, y2 - 7 * uy + 3 * ux);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }

  function roundRect2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  useEffect(() => {
    const info: Record<string, string> = {
      "van-de-graaff": "Van de Graaff generator: belt carries charges to dome, building up millions of volts through continuous charge transfer.",
      "millikan": "Millikan oil drop: electric force balances gravity. qE = mg → q = mg/E = ne. Proves charge quantization.",
      "lightning-rod": "Lightning rod: sharp tip has high charge density → attracts lightning → safe discharge to earth.",
      "faraday-cage": "Faraday cage: conducting enclosure shields interior. Induced surface charges cancel external field inside. E = 0 inside.",
      "triboelectric": "Triboelectric charging: rubbing transfers electrons. Glass rod loses e⁻ (becomes +ve), silk gains e⁻ (becomes −ve).",
      "precipitator": "Electrostatic precipitator: charges smoke particles with high voltage → attracted to collection plates → clean air.",
      "induction": "Electrostatic induction: charged rod approaches conductor → free electrons rearrange → induced charges appear without contact.",
      "quantization": "Charge quantization: q = ne. Charge only exists as integer multiples of e = 1.6×10⁻¹⁹ C.",
      "conservation": "Conservation of charge: total charge in isolated system is constant. Charges transfer but are never created or destroyed.",
      "comb-paper": "Charged comb near paper: induces +ve charge on near side → net attractive force. Everyday electrostatics.",
    };
    onContextChange?.(info[scene] || `Electrostatics scene: ${scene}`);
  }, [scene]);

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-2xl" />
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3">
        <p className="text-xs text-gray-300 leading-relaxed">
          <span className="text-yellow-400 font-bold">Real World: </span>
          {{
            "van-de-graaff": "Van de Graaff generators are used in particle accelerators and physics demonstrations. They can build up to 5 million volts!",
            "millikan": "Millikan's 1909 experiment determined the exact charge of an electron (e = 1.6×10⁻¹⁹ C) and proved charge quantization. Nobel Prize 1923.",
            "lightning-rod": "Lightning rods (invented by Benjamin Franklin, 1752) work by concentrating charge at their sharp tips, creating a preferred path for lightning strikes.",
            "faraday-cage": "Faraday cages are used in: MRI machines (shield patients from RF), cars (protect from lightning), microwave ovens (keep radiation inside), screened rooms.",
            "triboelectric": "Triboelectric effect is the source of static cling, photocopiers, inkjet printers, and Van de Graaff generators. The triboelectric series ranks materials by tendency to gain/lose electrons.",
            "precipitator": "Electrostatic precipitators remove 99%+ of particulate pollution from power plant and industrial chimney emissions, significantly reducing air pollution.",
            "induction": "Electrostatic induction explains why a charged balloon sticks to a neutral wall, how dust attracts to charged screens, and how electrostatic painting works.",
            "quantization": "Every proton has charge +e, every electron −e. You can never have half an electron's charge. This is a fundamental law of nature.",
            "conservation": "Conservation of charge is one of the most fundamental laws in physics. It holds in all known physical processes including nuclear reactions and particle annihilation.",
            "comb-paper": "This simple experiment demonstrates three concepts at once: charging by friction (comb rubbed on hair), electrostatic induction (near-side polarization), and Coulomb attraction.",
          }[scene] || ""}
        </p>
      </div>
    </div>
  );
}
