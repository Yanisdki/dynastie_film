// static/js/ambient-bg-dark.js

let darkAnimationFrameId;

window.initDarkBg = function() {
    const canvas = document.getElementById("ambient-bg-dark");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    // On évite de multiplier les écouteurs resize globaux
    window.removeEventListener("resize", resize);
    window.addEventListener("resize", resize);
    resize();

    const config = {
        particleCount: 70, 
        colors: {
            darkBg1: { r: 10, g: 10, b: 10 },
            darkBg2: { r: 18, g: 18, b: 18 },
            petals: [
                { r: 255, g: 220, b: 210 }, 
                { r: 255, g: 235, b: 215 }, 
                { r: 245, g: 225, b: 235 }, 
                { r: 255, g: 245, b: 225 }
            ],
            gold: { r: 181, g: 148, b: 96 }
        }
    };

    // Régénération des tableaux pour le thème sombre
    const petals = [];
    for (let i = 0; i < config.particleCount; i++) {
        petals.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 6 + 4,
            speedY: Math.random() * 0.4 + 0.3 * 1.3, // Plus rapide en sombre
            speedX: (Math.random() - 0.5) * 0.2,
            swing: Math.random() * Math.PI * 2,
            swingSpeed: 0.01 + Math.random() * 0.015,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.01,
            alpha: (Math.random() * 0.25 + 0.15) * 0.7, // Opacité réduite
            color: config.colors.petals[Math.floor(Math.random() * config.colors.petals.length)]
        });
    }

    const sparkles = [];
    for (let i = 0; i < 60; i++) {
        sparkles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            isLensFlare: Math.random() > 0.5,
            alpha: Math.random() * 0.3,
            flicker: Math.random() * Math.PI * 2,
            flickerSpeed: 0.02 + Math.random() * 0.02
        });
    }

    function drawPetal(x, y, size, rotation, color, alpha) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-size, -size, -size, size, 0, size * 1.5); ctx.bezierCurveTo(size, size, size, -size, 0, 0);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`; ctx.fill(); ctx.restore();
    }

    function drawLensFlare(x, y, size, alpha) {
        ctx.save(); ctx.beginPath();
        ctx.moveTo(x - size * 5, y); ctx.lineTo(x + size * 5, y); ctx.moveTo(x, y - size * 5); ctx.lineTo(x, y + size * 5);
        ctx.strokeStyle = `rgba(${config.colors.gold.r}, ${config.colors.gold.g}, ${config.colors.gold.b}, ${alpha * 0.6})`;
        ctx.lineWidth = 0.7; ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`; ctx.fill(); ctx.restore();
    }

    function animateDark() {
        // Rendu du fond Sombre direct
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, `rgb(${config.colors.darkBg1.r}, ${config.colors.darkBg1.g}, ${config.colors.darkBg1.b})`);
        gradient.addColorStop(1, `rgb(${config.colors.darkBg2.r}, ${config.colors.darkBg2.g}, ${config.colors.darkBg2.b})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Pétales sombres
        petals.forEach(p => {
            p.y += p.speedY; p.swing += p.swingSpeed; p.x += p.speedX + Math.sin(p.swing) * 0.2; p.rotation += p.rotSpeed;
            if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
            drawPetal(p.x, p.y, p.size, p.rotation, p.color, p.alpha);
        });

        // Sparkles (Éclat x1.5)
        sparkles.forEach(s => {
            s.flicker += s.flickerSpeed;
            const currentAlpha = Math.max(0.05, Math.min((s.alpha + Math.sin(s.flicker) * 0.15) * 1.5, 0.7));
            if (s.isLensFlare) {
                drawLensFlare(s.x, s.y, s.size, currentAlpha);
            } else {
                ctx.beginPath(); ctx.arc(s.x, s.y, s.size * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${config.colors.gold.r}, ${config.colors.gold.g}, ${config.colors.gold.b}, ${currentAlpha})`;
                ctx.fill();
            }
        });

        darkAnimationFrameId = requestAnimationFrame(animateDark);
    }

    animateDark();
};

window.stopDarkBg = function() {
    if (darkAnimationFrameId) {
        cancelAnimationFrame(darkAnimationFrameId);
        console.log("Animation Sombre : STOPPÉE");
    }
};