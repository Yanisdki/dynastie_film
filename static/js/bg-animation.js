window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("ambient-bg");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    // Configuration - Ambiance mariage haut de gamme & cinématographique
    const config = {
        particleCount: 80, // Légèrement réduit pour optimiser les calculs des éclats
        flowerCount: 6,
        colors: {
            bg1: { r: 10, g: 10, b: 10 },    /* ICI : Remplace par ton fond sombre si ton site est Dark luxury, ou laisse tes blancs cassés */
            bg2: { r: 20, g: 20, b: 20 },    /* J'ai gardé la structure mais tu peux remettre tes RGB d'origine */
            petals: [
                { r: 255, g: 220, b: 210 }, // Rose poudré
                { r: 255, g: 235, b: 215 }, // Pêche
                { r: 245, g: 225, b: 235 }, // Lavande très clair
                { r: 255, g: 245, b: 225 }  // Crème
            ],
            gold: { r: 181, g: 148, b: 96 },   // Ton Or exact (#b59460) pour matcher tes cartes !
            leaves: { r: 210, g: 225, b: 185 } // Vert sauge pâle
        }
    };

    // Si tu veux garder ton fond clair d'origine, décommente ces lignes :
    config.colors.bg1 = { r: 250, g: 248, b: 245 };
    config.colors.bg2 = { r: 245, g: 240, b: 235 };

    // 1. PÉTALES FLOTTANTS (Inversion du sens pour effet "Lancer de pétales")
    const petals = [];
    for (let i = 0; i < config.particleCount; i++) {
        const color = config.colors.petals[Math.floor(Math.random() * config.colors.petals.length)];
        petals.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height, // Commence en haut
            size: Math.random() * 7 + 4,
            speedY: Math.random() * 0.5 + 0.4, // Vitesse de descente douce
            speedX: (Math.random() - 0.5) * 0.3,
            swing: Math.random() * Math.PI * 2, // Pour l'effet feuille morte / balancement
            swingSpeed: 0.01 + Math.random() * 0.02,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.01,
            alpha: Math.random() * 0.3 + 0.2,
            color: color
        });
    }

    // 2. FLEURS DÉCORATIVES
    const flowers = [];
    for (let i = 0; i < config.flowerCount; i++) {
        flowers.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 50 + Math.random() * 50,
            pulse: Math.random() * Math.PI,
            pulseSpeed: 0.005 + Math.random() * 0.01,
            color: config.colors.petals[Math.floor(Math.random() * config.colors.petals.length)],
            alpha: 0.05 + Math.random() * 0.04
        });
    }

    // 3. ALLIANCES ENTRELACÉES & ANNEAUX (Géométrie Sacrée / Mariage)
    const weddingRings = [];
    for (let i = 0; i < 3; i++) { // 3 paires d'alliances réparties sur l'écran
        const centerX = Math.random() * canvas.width;
        const centerY = Math.random() * canvas.height;
        const baseRadius = 40 + Math.random() * 30;
        weddingRings.push({
            x1: centerX - baseRadius * 0.4, // Alliance Gauche
            y1: centerY,
            x2: centerX + baseRadius * 0.4, // Alliance Droite (croise la première)
            y2: centerY - (Math.random() * 5),
            radius: baseRadius,
            alpha: 0.06 + Math.random() * 0.06,
            pulse: Math.random() * Math.PI
        });
    }

    // 4. POINTS LUMINEUX CINÉMATIQUES (Lens Flares & Éclats à 4 branches)
    const sparkles = [];
    for (let i = 0; i < 80; i++) {
        sparkles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            isLensFlare: Math.random() > 0.6, // 40% des points seront des étoiles lumineuses
            alpha: Math.random() * 0.4,
            flicker: Math.random() * Math.PI * 2,
            flickerSpeed: 0.01 + Math.random() * 0.02
        });
    }

    // Fonctions de dessin personnalisées
    function drawPetal(x, y, size, rotation, color, alpha) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.beginPath();
        // Forme de pétale d'orchidée/rose plus réaliste
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-size, -size, -size, size, 0, size * 1.5);
        ctx.bezierCurveTo(size, size, size, -size, 0, 0);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        ctx.fill();
        ctx.restore();
    }

    // Dessine un éclat lumineux en forme d'étoile à 4 branches (Effet caméra lentille)
    function drawLensFlare(x, y, size, alpha) {
        ctx.save();
        ctx.beginPath();
        // Ligne horizontale de l'éclat
        ctx.moveTo(x - size * 4, y);
        ctx.lineTo(x + size * 4, y);
        // Ligne verticale
        ctx.moveTo(x, y - size * 4);
        ctx.lineTo(x, y + size * 4);
        
        ctx.strokeStyle = `rgba(${config.colors.gold.r}, ${config.colors.gold.g}, ${config.colors.gold.b}, ${alpha * 0.7})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Cœur lumineux au centre
        ctx.beginPath();
        ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
        ctx.restore();
    }

    function animate() {
        // Fond dégradé
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, `rgb(${config.colors.bg1.r}, ${config.colors.bg1.g}, ${config.colors.bg1.b})`);
        gradient.addColorStop(1, `rgb(${config.colors.bg2.r}, ${config.colors.bg2.g}, ${config.colors.bg2.b})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 1. GRANDES FLEURS FILIGRANES
        flowers.forEach(flower => {
            flower.pulse += flower.pulseSpeed;
            const pulseSize = flower.size + Math.sin(flower.pulse) * 3;
            
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + (flower.pulse * 0.05);
                const petalX = flower.x + Math.cos(angle) * pulseSize * 0.4;
                const petalY = flower.y + Math.sin(angle) * pulseSize * 0.4;
                
                ctx.beginPath();
                ctx.ellipse(petalX, petalY, pulseSize * 0.25, pulseSize * 0.35, angle, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${flower.color.r}, ${flower.color.g}, ${flower.color.b}, ${flower.alpha})`;
                ctx.fill();
            }
        });

        // 2. DESSIN DES ALLIANCES ENTRELACÉES
        weddingRings.forEach(ring => {
            ring.pulse += 0.005;
            const currentAlpha = ring.alpha + Math.sin(ring.pulse) * 0.02;

            ctx.lineWidth = 1.2;
            ctx.strokeStyle = `rgba(${config.colors.gold.r}, ${config.colors.gold.g}, ${config.colors.gold.b}, ${currentAlpha})`;

            // Première Alliance
            ctx.beginPath();
            ctx.arc(ring.x1, ring.y1, ring.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Deuxième Alliance entrelacée
            ctx.beginPath();
            ctx.arc(ring.x2, ring.y2, ring.radius, 0, Math.PI * 2);
            ctx.stroke();
        });

        // 3. PÉTALES EN CHUTE ET BALANCEMENT (Lancer de mariage)
        petals.forEach(p => {
            p.y += p.speedY;
            p.swing += p.swingSpeed;
            p.x += p.speedX + Math.sin(p.swing) * 0.3; // Oscillation latérale fluide
            p.rotation += p.rotSpeed;
            
            // Recyclage quand le pétale sort par le bas
            if (p.y > canvas.height + 20) {
                p.y = -20;
                p.x = Math.random() * canvas.width;
            }
            if (p.x < -20) p.x = canvas.width + 20;
            if (p.x > canvas.width + 20) p.x = -20;
            
            drawPetal(p.x, p.y, p.size, p.rotation, p.color, p.alpha);
        });

        // 4. SCINTILLEMENTS ET LENS FLARES CINÉMA
        sparkles.forEach(s => {
            s.flicker += s.flickerSpeed;
            const currentAlpha = Math.max(0.05, Math.min(s.alpha + Math.sin(s.flicker) * 0.15, 0.5));
            
            if (s.isLensFlare) {
                drawLensFlare(s.x, s.y, s.size, currentAlpha);
            } else {
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${config.colors.gold.r}, ${config.colors.gold.g}, ${config.colors.gold.b}, ${currentAlpha})`;
                ctx.fill();
            }
        });

        animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    // À rajouter TOUT EN BAS de ton 'ambient-bg.js' actuel :
window.stopLightBg = function() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        console.log("Animation Claire : STOPPÉE");
    }
};

window.startLightBg = function() {
    // Relance l'animation si on remonte
    cancelAnimationFrame(animationFrameId); 
    animate();
    console.log("Animation Claire : RELANCÉE");
};
});
