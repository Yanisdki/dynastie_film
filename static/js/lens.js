// ===== OBJECTIF D'APPAREIL PHOTO AVEC ROTATION =====
class LensEffect {
    constructor() {
        this.canvas = document.getElementById('lensCanvas');
        this.overlay = document.getElementById('lensOverlay');
        this.ctx = this.canvas.getContext('2d');
        this.isAnimating = false;
        this.targetUrl = null;
        
        this.numBlades = 16;
        this.centerX = 0;
        this.centerY = 0;
        this.radius = 0;
        this.bladeLength = 0;
        this.rotationAngle = 0;
        
        this.init();
        
        if (window.sessionStorage.getItem('lensAnimating')) {
            window.sessionStorage.removeItem('lensAnimating');
            this.startOpenAnimation();
        }
    }
    
    init() {
        if (!this.canvas || !this.overlay) return;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.captureLinks();
        
        // État initial : objectif fermé (trou = 0)
        this.drawLens(0);
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.max(this.canvas.width, this.canvas.height) * 0.7;
        this.bladeLength = this.radius * 1.3;
    }
    
    captureLinks() {
        const links = document.querySelectorAll('a');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                    e.preventDefault();
                    this.startCloseAnimation(href);
                }
            });
        });
    
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', (e) => {
                if (menuToggle.classList.contains('active')) return;
                e.preventDefault();
                e.stopPropagation();
                this.startCloseAnimation('#menu');
            });
        }
    }
    
    startCloseAnimation(url) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.targetUrl = url;
        
        this.overlay.classList.add('active');
        
        setTimeout(() => {
            document.body.classList.add('lens-blur');
        }, 50);
        
        this.rotationAngle = 0;
        
        // FERMETURE : le trou passe de radius à 0
        this.animateCloseLens(() => {
            if (this.targetUrl === '#menu') {
                const menuToggle = document.getElementById('menuToggle');
                const navLinks = document.getElementById('navLinks');
                if (menuToggle && navLinks) {
                    menuToggle.classList.add('active');
                    navLinks.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
                // OUVERTURE : le trou repasse de 0 à radius
                this.animateOpenLens(() => {
                    this.isAnimating = false;
                    document.body.classList.remove('lens-blur');
                    this.overlay.classList.remove('active');
                });
            } else {
                window.sessionStorage.setItem('lensAnimating', 'true');
                window.location.href = this.targetUrl;
            }
        });
    }
    
    startOpenAnimation() {
        this.overlay.classList.add('active');
        document.body.classList.add('lens-blur');
        this.rotationAngle = Math.PI / 3;
        
        this.animateOpenLens(() => {
            this.isAnimating = false;
            document.body.classList.remove('lens-blur');
            this.overlay.classList.remove('active');
        });
    }
    
    // FERMETURE : le trou se ferme (radius → 0)
    animateCloseLens(callback) {
        const duration = 800;
        const startTime = performance.now();
        let animationId = null;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            let progress = Math.min(elapsed / duration, 1);
            
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            // aperture : 1 (ouvert) → 0 (fermé)
            const aperture = 1 - easeProgress;
            // rotation : 0 → maxRotation
            const maxRotation = Math.PI / 3;
            this.rotationAngle = maxRotation * easeProgress;
            
            this.drawLens(aperture);
            
            if (progress < 1) {
                animationId = requestAnimationFrame(animate);
            } else {
                cancelAnimationFrame(animationId);
                this.drawLens(0);
                if (callback) callback();
            }
        };
        
        animationId = requestAnimationFrame(animate);
    }
    
    // OUVERTURE : le trou s'ouvre (0 → radius)
    animateOpenLens(callback) {
        const duration = 800;
        const startTime = performance.now();
        let animationId = null;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            let progress = Math.min(elapsed / duration, 1);
            
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            // aperture : 0 (fermé) → 1 (ouvert)
            const aperture = easeProgress;
            // rotation : maxRotation → 0
            const maxRotation = Math.PI / 3;
            this.rotationAngle = maxRotation * (1 - easeProgress);
            
            this.drawLens(aperture);
            
            if (progress < 1) {
                animationId = requestAnimationFrame(animate);
            } else {
                cancelAnimationFrame(animationId);
                if (callback) callback();
            }
        };
        
        animationId = requestAnimationFrame(animate);
    }
    
    drawLens(aperture) {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fond noir
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (aperture >= 0.99) return;
        
        // Taille du trou : 0 quand fermé, radius quand ouvert
        const currentRadius = this.radius * aperture;
        
        // Créer le trou transparent
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, currentRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Dessiner les lamelles
        this.drawBlades(aperture);
    }
    
    drawBlades(aperture) {
    const angleStep = (Math.PI * 2) / this.numBlades;
    const bladeOpacity = Math.min(1, (1 - aperture) * 1.5);
    if (bladeOpacity <= 0) return;
    
    // innerRadius : taille du trou central
    const innerRadius = this.radius * aperture;
    
    for (let i = 0; i < this.numBlades; i++) {
        // Position de base de la lamelle (réparties régulièrement)
        const bladeCenterAngle = i * angleStep + this.rotationAngle;
        
        // Chaque lamelle a sa propre rotation
        // Plus l'objectif est fermé, plus les lamelles pivotent vers le centre
        const pivotAngle = (1 - aperture) * (Math.PI / 3); // Max 60° de pivot
        
        // Angle de début et fin de la lamelle
        const startAngle = bladeCenterAngle - angleStep/2 - pivotAngle;
        const endAngle = bladeCenterAngle + angleStep/2 + pivotAngle;
        
        // Point extérieur (sur le bord du cercle)
        const outerX1 = this.centerX + Math.cos(startAngle) * this.radius;
        const outerY1 = this.centerY + Math.sin(startAngle) * this.radius;
        const outerX2 = this.centerX + Math.cos(endAngle) * this.radius;
        const outerY2 = this.centerY + Math.sin(endAngle) * this.radius;
        
        // Point intérieur (vers le centre)
        // Plus l'objectif est fermé, plus les pointes vont vers le centre
        const tipDistance = innerRadius + (1 - aperture) * 20;
        const innerX = this.centerX + Math.cos(bladeCenterAngle) * tipDistance;
        const innerY = this.centerY + Math.sin(bladeCenterAngle) * tipDistance;
        
        // Dégradé
        const gradient = this.ctx.createLinearGradient(outerX1, outerY1, innerX, innerY);
        gradient.addColorStop(0, '#777');
        gradient.addColorStop(0.4, '#999');
        gradient.addColorStop(0.7, '#555');
        gradient.addColorStop(1, '#333');
        
        // Dessiner la lamelle (triangle ou trapèze)
        this.ctx.beginPath();
        this.ctx.moveTo(outerX1, outerY1);
        this.ctx.lineTo(outerX2, outerY2);
        this.ctx.lineTo(innerX, innerY);
        this.ctx.closePath();
        
        this.ctx.fillStyle = gradient;
        this.ctx.globalAlpha = bladeOpacity;
        this.ctx.fill();
        
        // Bordure
        this.ctx.strokeStyle = '#888';
        this.ctx.lineWidth = 0.8;
        this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
    
    // Centre noir
    if (innerRadius > 5) {
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, innerRadius - 2, 0, Math.PI * 2);
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fill();
    }
    
    // Bague extérieure
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius + 3, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
}
}

document.addEventListener('DOMContentLoaded', () => {
    window.lensEffect = new LensEffect();
});