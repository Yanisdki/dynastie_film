<template>
  <canvas ref="fluidCanvas" class="fixed inset-0 w-screen h-screen pointer-events-none z-40"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const fluidCanvas = ref(null);
let animationFrameId = null;

onMounted(() => {
  const canvas = fluidCanvas.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  function resizeCanvas() {
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }
  resizeCanvas();

  const config = { SPLAT_RADIUS: 0.25 };
  let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let particles = [];

  function generateColor() {
    return {
      r: Math.random() * 1.5,
      g: Math.random() * 1.5,
      b: Math.random() * 2.0
    };
  }

  class FluidParticle {
    constructor(x, y, vx, vy) {
      this.x = x; this.y = y;
      this.vx = vx; this.vy = vy;
      this.alpha = 1.0;
      this.color = generateColor();
    }
    draw() {
      ctx.beginPath();
      let gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 40 * config.SPLAT_RADIUS);
      gradient.addColorStop(0, `rgba(${this.color.r * 150}, ${this.color.g * 100}, ${this.color.b * 255}, ${this.alpha})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.arc(this.x, this.y, 50, 0, Math.PI * 2);
      ctx.fill();
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      this.vx *= 0.96;
      this.vy *= 0.96;
      this.alpha -= 0.015;
    }
  }

  const handleMouseMove = (e) => {
    let vx = (e.clientX - pointer.x) * 0.3;
    let vy = (e.clientY - pointer.y) * 0.3;
    
    for(let i = 0; i < 3; i++) {
      particles.push(new FluidParticle(
        e.clientX + (Math.random() - 0.5) * 20, 
        e.clientY + (Math.random() - 0.5) * 20, 
        vx + (Math.random() - 0.5) * 5, 
        vy + (Math.random() - 0.5) * 5
      ));
    }
    pointer.x = e.clientX; 
    pointer.y = e.clientY;
  };

  // On écoute les mouvements sur la fenêtre globale
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('resize', resizeCanvas);

  function renderFluidSimulation() {
    // Nettoyage avec effet de traînée
    ctx.fillStyle = 'rgba(11, 11, 11, 0.08)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw();
      if (particles[i].alpha <= 0) {
        particles.splice(i, 1);
      }
    }
    animationFrameId = requestAnimationFrame(renderFluidSimulation);
  }

  renderFluidSimulation();

  // Nettoyage automatique quand "enabled" repasse à false (v-if)
  onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('resize', resizeCanvas);
    cancelAnimationFrame(animationFrameId);
  });
});
</script>