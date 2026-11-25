// File: src/components/ui/CrawlingPythonBg.tsx
import React, { useEffect, useRef } from 'react';

interface SpineNode {
  x: number;
  y: number;
}

export const CrawlingPythonBg: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let animationFrameId = 0;
    let width = 0;
    let height = 0;

    const segmentCount = 44;
    const segmentSpacing = 11;
    const nodes: SpineNode[] = [];

    // Steering & slither state
    let headX = 240;
    let headY = 220;
    let angle = 0.25;
    let targetAngle = 0.25;
    let steerTimer = 0;
    let phase = 0;

    const initNodes = (w: number, h: number) => {
      headX = w * 0.22;
      headY = h * 0.34;
      angle = 0.15;
      targetAngle = 0.15;
      nodes.length = 0;
      for (let i = 0; i < segmentCount; i++) {
        nodes.push({
          x: headX - Math.cos(angle) * i * segmentSpacing,
          y: headY - Math.sin(angle) * i * segmentSpacing,
        });
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (nodes.length === 0) {
        initNodes(width, height);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Sinusoidal slither wave
      phase += dt * 7.2;
      steerTimer -= dt;

      // Gentle wandering + soft boundary turn-around so it stays in frame
      const margin = 110;
      if (headX < margin) {
        targetAngle = 0 + (Math.random() - 0.5) * 0.8;
      } else if (headX > width - margin) {
        targetAngle = Math.PI + (Math.random() - 0.5) * 0.8;
      } else if (headY < margin) {
        targetAngle = Math.PI * 0.5 + (Math.random() - 0.5) * 0.8;
      } else if (headY > height - margin) {
        targetAngle = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.8;
      } else if (steerTimer <= 0) {
        steerTimer = 1.1 + Math.random() * 1.6;
        targetAngle += (Math.random() - 0.5) * 1.45;
      }

      // Smooth angular interpolation
      const angleDiff = Math.atan2(
        Math.sin(targetAngle - angle),
        Math.cos(targetAngle - angle)
      );
      angle += angleDiff * Math.min(1, dt * 2.6);

      const slitherOffset = Math.sin(phase) * 2.35;
      const moveAngle = angle + slitherOffset * 0.22;
      const speed = 115; // px per second

      headX += Math.cos(moveAngle) * speed * dt;
      headY += Math.sin(moveAngle) * speed * dt;

      nodes[0].x = headX;
      nodes[0].y = headY;

      // Follow-the-leader constraint with subtle lateral undulation along the body
      for (let i = 1; i < nodes.length; i++) {
        const prev = nodes[i - 1];
        const curr = nodes[i];
        const dx = prev.x - curr.x;
        const dy = prev.y - curr.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const segAngle = Math.atan2(dy, dx);
        const perpAngle = segAngle + Math.PI / 2;
        const wave = Math.sin(phase - i * 0.34) * 1.15;

        const targetX = prev.x - (dx / dist) * segmentSpacing + Math.cos(perpAngle) * wave;
        const targetY = prev.y - (dy / dist) * segmentSpacing + Math.sin(perpAngle) * wave;

        curr.x += (targetX - curr.x) * Math.min(1, dt * 22);
        curr.y += (targetY - curr.y) * Math.min(1, dt * 22);
      }

      ctx.clearRect(0, 0, width, height);

      // Read theme accent & subtle colors dynamically
      const styles = getComputedStyle(document.documentElement);
      const accentColor =
        styles.getPropertyValue('--accent').trim() || '#e07a38';
      const subtleColor =
        styles.getPropertyValue('--text-muted').trim() || '#9ca3af';

      ctx.save();
      ctx.globalAlpha = 0.24;

      // Draw body from tail to neck so head sits cleanly on top
      for (let i = nodes.length - 1; i >= 1; i--) {
        const n = nodes[i];
        const progress = 1 - i / (nodes.length - 1); // 1 near head, 0 at tail tip
        const radius = Math.max(2.2, 13.5 * Math.pow(progress, 0.72));

        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = i % 4 === 0 ? accentColor : subtleColor;
        ctx.fill();

        // Python-like saddle pattern bands every few segments
        if (i > 2 && i < nodes.length - 2 && i % 3 === 0) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius * 0.62, 0, Math.PI * 2);
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }

      // Draw tapered python head
      const head = nodes[0];
      const neck = nodes[1];
      const headAngle = Math.atan2(head.y - neck.y, head.x - neck.x);

      ctx.save();
      ctx.translate(head.x, head.y);
      ctx.rotate(headAngle);

      ctx.beginPath();
      ctx.ellipse(2, 0, 16.5, 11.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();

      // Subtle eyes
      ctx.fillStyle = '#0b0c0e';
      ctx.beginPath();
      ctx.arc(6.5, -5.2, 2, 0, Math.PI * 2);
      ctx.arc(6.5, 5.2, 2, 0, Math.PI * 2);
      ctx.fill();

      // Occasional flicking forked tongue
      const tongueFlick = Math.sin(phase * 1.7);
      if (tongueFlick > 0.65) {
        const len = 7 + (tongueFlick - 0.65) * 20;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(17, 0);
        ctx.lineTo(17 + len, 0);
        ctx.lineTo(17 + len + 4, -3);
        ctx.moveTo(17 + len, 0);
        ctx.lineTo(17 + len + 4, 3);
        ctx.stroke();
      }

      ctx.restore();
      ctx.restore();

      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
};

export default CrawlingPythonBg;
