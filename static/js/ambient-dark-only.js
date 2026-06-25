// static/js/ambient-dark-only.js
// FOND SOMBRE UNIQUEMENT - Pas de fade, pas de transition

(function() {
    'use strict';

    let animationFrameId;
    let isAnimating = false;

    function initDarkCanvas() {
        const canvas = document.getElementById("ambient-dark-only");
        if (!canvas) {
            console.warn("❌ Canvas #ambient-dark-only non trouvé");
            return;
        }

        console.log("✅ Fond sombre unique - DÉMARRÉ");
        const ctx = canvas.getContext("2d");
        let isMobile = window.innerWidth < 768;

        // Redimensionnement
        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            isMobile = window.innerWidth < 768;
        }

        window.addEventListener("resize", resize);
        resize();

        // ===== CONFIGURATION =====
        const config = {
            particleCount: isMobile ? 35 : 70,
            colors: {
                bg1: { r: 8, g: 8, b: 8 },      // Noir profond
                bg2: { r: 18, g: 18, b: 18 },    // Gris très foncé
                bg3: { r: 25, g: 22, b: 20 },    // Légèrement chaud
                petals: [
                    { r: 255, g: 220, b: 210 }, 
                    { r: 255, g: 235, b: 215 }, 
                    { r: 245, g: 225, b: 235 }, 
                    { r: 255, g: 245, b: 225 }
                ],
                gold: { r: 181, g: 148, b: 96 },
                white: { r: 255, g: 255, b: 255 }
            }
        };

        // ===== PÉTALES =====
        const petals = [];
        for (let i = 0; i < config.particleCount; i++) {
            const color = config.colors.petals[Math.floor(Math.random() * config.colors.petals.length)];
            petals.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * 6 + 3,
                speedY: Math.random() * 0.3 + 0.2,
                speedX: (Math.random() - 0.5) * 0.15,
                swing: Math.random() * Math.PI * 2,
                swingSpeed: 0.008 + Math.random() * 0.012,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.008,
                alpha: (Math.random() * 0.2 + 0.1) * 0.8,
                color: color
            });
        }

        // ===== ÉTINCELLES DORÉES =====
        const sparkles = [];
        const sparkleCount = isMobile ? 30 : 55;
        for (let i = 0; i < sparkleCount; i++) {
            sparkles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                isLensFlare: Math.random() > 0.6,
                alpha: Math.random() * 0.4 + 0.1,
                flicker: Math.random() * Math.PI * 2,
                flickerSpeed: 0.015 + Math.random() * 0.025
            });
        }

        // ===== ANNEAUX DÉCORATIFS =====
        const rings = [];
        const ringCount = isMobile ? 1 : 3;
        for (let i = 0; i < ringCount; i++) {
            rings.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: 30 + Math.random() * 40,
                alpha: 0.03 + Math.random() * 0.05,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: 0.005 + Math.random() * 0.01,
                rotation: Math.random() * Math.PI * 2
            });
        }

        // ===== FONCTIONS DE DESSIN =====
        function drawPetal(x, y, size, rotation, color, alpha) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-size, -size * 0.8, -size, size * 0.8, 0, size * 1.2);
            ctx.bezierCurveTo(size, size * 0.8, size, -size * 0.8, 0, 0);
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
            ctx.fill();
            ctx.restore();
        }

        function drawLensFlare(x, y, size, alpha) {
            ctx.save();
            ctx.globalAlpha = alpha;
            
            // Croix lumineuse
            ctx.beginPath();
            ctx.moveTo(x - size * 4, y);
            ctx.lineTo(x + size * 4, y);
            ctx.moveTo(x, y - size * 4);
            ctx.lineTo(x, y + size * 4);
            ctx.strokeStyle = `rgba(${config.colors.gold.r}, ${config.colors.gold.g}, ${config.colors.gold.b}, 0.6)`;
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Cœur lumineux
            ctx.beginPath();
            ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 0.8);
            gradient.addColorStop(0, `rgba(255, 255, 255, 0.9)`);
            gradient.addColorStop(1, `rgba(${config.colors.gold.r}, ${config.colors.gold.g}, ${config.colors.gold.b}, 0.3)`);
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.restore();
        }

        function drawRing(x, y, radius, alpha, rotation) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = `rgba(${config.colors.gold.r}, ${config.colors.gold.g}, ${config.colors.gold.b}, 0.5)`;
            ctx.lineWidth = 1.2;
            
            // Anneau principal
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Petit anneau intérieur
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${config.colors.gold.r}, ${config.colors.gold.g}, ${config.colors.gold.b}, 0.3)`;
            ctx.lineWidth = 0.8;
            ctx.stroke();

            ctx.restore();
        }

        // ===== ANIMATION =====
        function animateDark() {
            // Fond
            const gradient = ctx.createRadialGradient(
                canvas.width * 0.5, canvas.height * 0.4, 0,
                canvas.width * 0.5, canvas.height * 0.4, canvas.width * 0.8
            );
            gradient.addColorStop(0, `rgb(${config.colors.bg3.r}, ${config.colors.bg3.g}, ${config.colors.bg3.b})`);
            gradient.addColorStop(0.5, `rgb(${config.colors.bg1.r}, ${config.colors.bg1.g}, ${config.colors.bg1.b})`);
            gradient.addColorStop(1, `rgb(${config.colors.bg2.r}, ${config.colors.bg2.g}, ${config.colors.bg2.b})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Anneaux
            rings.forEach(ring => {
                ring.pulse += ring.pulseSpeed;
                ring.rotation += 0.001;
                const pulseAlpha = ring.alpha + Math.sin(ring.pulse) * 0.02;
                drawRing(ring.x, ring.y, ring.radius, pulseAlpha, ring.rotation);
            });

            // Pétales
            petals.forEach(p => {
                p.y += p.speedY;
                p.swing += p.swingSpeed;
                p.x += p.speedX + Math.sin(p.swing) * 0.2;
                p.rotation += p.rotSpeed;

                if (p.y > canvas.height + 20) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                }
                if (p.x < -20) p.x = canvas.width + 20;
                if (p.x > canvas.width + 20) p.x = -20;

                drawPetal(p.x, p.y, p.size, p.rotation, p.color, p.alpha);
            });

            // Étincelles
            sparkles.forEach(s => {
                s.flicker += s.flickerSpeed;
                const currentAlpha = Math.max(0.05, Math.min(
                    s.alpha + Math.sin(s.flicker) * 0.15, 
                    0.6
                ));

                if (s.isLensFlare) {
                    drawLensFlare(s.x, s.y, s.size * 1.2, currentAlpha);
                } else {
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.size * 0.6, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${config.colors.gold.r}, ${config.colors.gold.g}, ${config.colors.gold.b}, ${currentAlpha})`;
                    ctx.fill();
                    
                    // Glow autour
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.size * 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${config.colors.gold.r}, ${config.colors.gold.g}, ${config.colors.gold.b}, ${currentAlpha * 0.15})`;
                    ctx.fill();
                }
            });

            animationFrameId = requestAnimationFrame(animateDark);
        }

        animateDark();
        isAnimating = true;
    }

    // ===== EXPOSITION =====
    window.initDarkOnly = function() {
        if (!isAnimating) {
            initDarkCanvas();
        }
    };

    window.stopDarkOnly = function() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            isAnimating = false;
            console.log("✅ Fond sombre unique - ARRÊTÉ");
        }
    };

    // ===== AUTO-LANCEMENT =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initDarkCanvas();
        });
    } else {
        initDarkCanvas();
    }

})();