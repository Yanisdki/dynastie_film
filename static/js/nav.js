document.addEventListener('DOMContentLoaded', function() {
    
    const burgerWrapper = document.getElementById('burgerWrapper');
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (!burgerWrapper || !menuToggle || !navLinks) return;
    
    // === POSITIONS DU BURGER ===
    let startLeft = 0;
    let endLeft = 0;
    let hasInit = false;
    
    const maxScroll = 400;
    let ticking = false;
    let isMenuOpen = false;
    
    function init() {
        const rect = burgerWrapper.getBoundingClientRect();
        const width = rect.width;
        
        // Position centrée
        startLeft = (window.innerWidth / 2) - (width / 2);
        
        // Position finale : à 30px du bord droit
        endLeft = window.innerWidth - width - 30;
        
        hasInit = true;
        
        // Appliquer la position initiale
        burgerWrapper.style.left = startLeft + 'px';
    }
    
    function update() {
        if (!hasInit) return;
        
        let scrollY = Math.max(0, window.scrollY);
        let progress = Math.min(scrollY / maxScroll, 1);
        
        // Interpolation linéaire
        const currentLeft = startLeft + (endLeft - startLeft) * progress;
        
        burgerWrapper.style.left = currentLeft + 'px';
        
        ticking = false;
    }
    
    function handleScroll() {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }
    
    // === OUVERTURE/FERMETURE DU MENU ===
    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        
        if (isMenuOpen) {
            menuToggle.classList.add('active');
            navLinks.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    // === FERMER LE MENU QUAND ON CLIQUE SUR UN LIEN ===
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (isMenuOpen) toggleMenu();
        });
    });
    
    // === ÉVÉNEMENTS ===
    window.addEventListener('resize', init);
    window.addEventListener('scroll', handleScroll);
    menuToggle.addEventListener('click', toggleMenu);
    
    // INITIALISATION
    init();
    update();
});