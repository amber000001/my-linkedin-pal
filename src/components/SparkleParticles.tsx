import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  fadeSpeed: number;
  rotation: number;
  rotationSpeed: number;
  type: "star" | "dot" | "cross";
  color: string;
  life: number;
  maxLife: number;
}

const COLORS = [
  "hsl(280, 70%, 75%)",
  "hsl(45, 90%, 65%)",
  "hsl(320, 60%, 75%)",
  "hsl(200, 70%, 70%)",
  "hsl(270, 60%, 80%)",
];

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) {
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size * 0.4;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / spikes;
    if (i === 0) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.restore();
}

function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(-size, 0);
  ctx.lineTo(size, 0);
  ctx.moveTo(0, -size);
  ctx.lineTo(0, size);
  ctx.restore();
}

export function SparkleParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawnParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height + canvas.height * 0.1,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -(Math.random() * 0.6 + 0.2),
      opacity: 0,
      fadeSpeed: Math.random() * 0.008 + 0.004,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.03,
      type: (["star", "dot", "cross"] as const)[Math.floor(Math.random() * 3)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 0,
      maxLife: Math.random() * 120 + 80,
    });

    // Pre-seed particles spread across the canvas
    for (let i = 0; i < 60; i++) {
      const p = spawnParticle();
      p.life = Math.random() * p.maxLife;
      p.opacity = Math.sin((p.life / p.maxLife) * Math.PI) * 0.7;
      particlesRef.current.push(p);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles
      if (particlesRef.current.length < 80 && Math.random() < 0.3) {
        particlesRef.current.push(spawnParticle());
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life++;
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        p.opacity = Math.sin((p.life / p.maxLife) * Math.PI) * 0.75;

        if (p.life >= p.maxLife) return false;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.strokeStyle = p.color;
        ctx.fillStyle = p.color;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;

        if (p.type === "star") {
          drawStar(ctx, p.x, p.y, p.size * 1.5, p.rotation);
          ctx.fill();
        } else if (p.type === "dot") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawCross(ctx, p.x, p.y, p.size * 1.2, p.rotation);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.restore();
        return true;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
