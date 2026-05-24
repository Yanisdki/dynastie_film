// ===== OBJECTIF D'APPAREIL PHOTO AVEC ROTATION =====
class LensEffect {
    constructor() {
        this.canvas = document.getElementById('lensCanvas');
        this.overlay = document.getElementById('lensOverlay');
        this.ctx = this.canvas.getContext('2d');
        this.isAnimating = false;
        this.targetUrl = null;
        
        this.numBlades = 8;
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
        
        // Capture de la page actuelle pour l'effet de transition
        this.captureCurrentPage();
    }
    
    captureCurrentPage() {
        // Capture la page actuelle en image
        const body = document.body;
        const rect = body.getBoundingClientRect();
        
        // Créer un canvas temporaire pour capturer la page
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Dessiner l'arrière-plan actuel
        tempCtx.fillStyle = '#111';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Convertir en image
        this.currentPageImage = tempCanvas;
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
        document.body.classList.add('lens-blur');
        
        this.rotationAngle = 0;
        
        // Fermeture progressive
        this.animateCloseLens(() => {
            if (this.targetUrl === '#menu') {
                const menuToggle = document.getElementById('menuToggle');
                const navLinks = document.getElementById('navLinks');
                if (menuToggle && navLinks) {
                    menuToggle.classList.add('active');
                    navLinks.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
                this.animateOpenLens(() => {
                    this.isAnimating = false;
                    document.body.classList.remove('lens-blur');
                    this.overlay.classList.remove('active');
                });
            } else {
                // Navigation vers la nouvelle page
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
    
    animateCloseLens(callback) {
        const duration = 800;
        const startTime = performance.now();
        let animationId = null;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            let progress = Math.min(elapsed / duration, 1);
            
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const aperture = 1 - easeProgress;
            const maxRotation = Math.PI / 3;
            this.rotationAngle = maxRotation * easeProgress;
            
            // Mettre à jour le flou progressivement
            const blurAmount = (1 - aperture) * 20;
            this.updateBlur(blurAmount);
            
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
    
    animateOpenLens(callback) {
        const duration = 800;
        const startTime = performance.now();
        let animationId = null;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            let progress = Math.min(elapsed / duration, 1);
            
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const aperture = easeProgress;
            const maxRotation = Math.PI / 3;
            this.rotationAngle = maxRotation * (1 - easeProgress);
            
            // Réduire le flou progressivement
            const blurAmount = (1 - aperture) * 20;
            this.updateBlur(blurAmount);
            
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
    
    updateBlur(blurAmount) {
        let style = document.getElementById('lens-blur-style');
        if (!style) {
            style = document.createElement('style');
            style.id = 'lens-blur-style';
            document.head.appendChild(style);
        }
        
        style.textContent = `
            body.lens-blur::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                backdrop-filter: blur(${blurAmount}px);
                background: rgba(0, 0, 0, ${blurAmount / 30});
                z-index: 9998;
                pointer-events: none;
                transition: all 0.02s linear;
            }
        `;
    }
    
    drawLens(aperture) {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fond noir avec opacité progressive
        const darkOpacity = (1 - aperture) * 0.8;
        this.ctx.fillStyle = `rgba(0, 0, 0, ${darkOpacity})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (aperture >= 0.99) return;
        
        // Taille du trou
        const currentRadius = this.radius * aperture;
        
        // Créer le trou transparent (laisse voir la page)
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
        
        const innerRadius = this.radius * aperture;
        
        for (let i = 0; i < this.numBlades; i++) {
            const bladeAngle = i * angleStep + this.rotationAngle;
            const nextAngle = bladeAngle + angleStep;
            
            const x1 = this.centerX + Math.cos(bladeAngle) * this.radius;
            const y1 = this.centerY + Math.sin(bladeAngle) * this.radius;
            const x2 = this.centerX + Math.cos(nextAngle) * this.radius;
            const y2 = this.centerY + Math.sin(nextAngle) * this.radius;
            
            const innerAngle = bladeAngle + angleStep / 2;
            const ix = this.centerX + Math.cos(innerAngle) * innerRadius;
            const iy = this.centerY + Math.sin(innerAngle) * innerRadius;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.lineTo(ix, iy);
            this.ctx.closePath();
            
            this.ctx.fillStyle = '#555';
            this.ctx.globalAlpha = bladeOpacity;
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
        
        // Cercle central
        if (innerRadius > 3) {
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, innerRadius - 2, 0, Math.PI * 2);
            this.ctx.fillStyle = 'black';
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