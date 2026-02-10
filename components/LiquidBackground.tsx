import React, { useEffect, useRef } from 'react';
import { createNoise3D } from 'simplex-noise';

interface Point {
  x: number;
  y: number;
  originX: number;
  originY: number;
}

export const LiquidBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const pointsRef = useRef<Point[]>([]);
  const noise3D = useRef(createNoise3D()).current;
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const config = {
      gridSpacing: 50, 
      noiseScale: 0.001,
      timeSpeed: 0.0002,
      distortionStrength: 20,
      connectionDistance: 80,
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      initPoints();
    };

    const initPoints = () => {
      const points: Point[] = [];
      const cols = Math.ceil(width / config.gridSpacing) + 2;
      const rows = Math.ceil(height / config.gridSpacing) + 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = (i - 1) * config.gridSpacing;
          const y = (j - 1) * config.gridSpacing;
          points.push({ x, y, originX: x, originY: y });
        }
      }
      pointsRef.current = points;
    };

    const animate = () => {
      timeRef.current += config.timeSpeed;
      const time = timeRef.current;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 0.3;

      const points = pointsRef.current;
      const cols = Math.ceil(width / config.gridSpacing) + 2;
      const rows = Math.ceil(height / config.gridSpacing) + 2;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const noiseX = noise3D(p.originX * config.noiseScale, p.originY * config.noiseScale, time);
        const noiseY = noise3D(p.originX * config.noiseScale + 100, p.originY * config.noiseScale, time);
        p.x = p.originX + noiseX * config.distortionStrength;
        p.y = p.originY + noiseY * config.distortionStrength;
      }

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const idx = i * rows + j;
          const p = points[idx];
          if (!p) continue;

          if (i < cols - 1) {
            const rightIdx = (i + 1) * rows + j;
            const neighbor = points[rightIdx];
            if (neighbor) drawLine(ctx, p, neighbor, config.connectionDistance);
          }

          if (j < rows - 1) {
            const bottomIdx = i * rows + (j + 1);
            const neighbor = points[bottomIdx];
            if (neighbor) drawLine(ctx, p, neighbor, config.connectionDistance);
          }
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      animationRef.current = requestAnimationFrame(animate);
    };

    const drawLine = (ctx: CanvasRenderingContext2D, p1: Point, p2: Point, maxDist: number) => {
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (dist > maxDist * 1.3) return;

      let alpha = 1 - (dist / (maxDist * 1.3));
      alpha = alpha * alpha * 0.4;
      if (alpha < 0.02) return;

      ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    };

    resize();
    window.addEventListener('resize', resize);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_80%,#000_100%)]" />
    </div>
  );
};
