/**
 * Navigation mobile - Menu Burger
 */
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const navOverlay = document.getElementById('navOverlay');
    const body = document.body;

    // Vérifier si les éléments existent
    if (!navToggle || !navLinks || !navOverlay) return;

    let isMenuOpen = false;

    /**
     * Ouvre le menu
     */
    function openMenu() {
        isMenuOpen = true;
        navToggle.classList.add('active');
        navLinks.classList.add('active');
        navOverlay.classList.add('active');
        body.style.overflow = 'hidden'; // Empêche le scroll
    }

    /**
     * Ferme le menu
     */
    function closeMenu() {
        isMenuOpen = false;
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
        navOverlay.classList.remove('active');
        body.style.overflow = '';
    }

    /**
     * Toggle du menu
     */
    function toggleMenu() {
        isMenuOpen ? closeMenu() : openMenu();
    }

    // ==========================================
    // ÉVÉNEMENTS
    // ==========================================

    // 1. Clic sur le burger
    navToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMenu();
    });

    // 2. Clic sur l'overlay (fond sombre)
    navOverlay.addEventListener('click', closeMenu);

    // 3. Clic sur un lien du menu
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            // Fermer le menu si on est en mobile
            if (window.innerWidth <= 768) {
                closeMenu();
            }
        });
    });

    // 4. Touche Escape pour fermer
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isMenuOpen) {
            closeMenu();
        }
    });

    // 5. Redimensionnement - fermer automatiquement si on passe en desktop
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768 && isMenuOpen) {
                closeMenu();
            }
        }, 250);
    });

    // 6. Détecter les clics en dehors du menu (pour fermeture)
    document.addEventListener('click', function(e) {
        // Si le menu est ouvert et qu'on clique en dehors
        if (isMenuOpen && 
            !navLinks.contains(e.target) && 
            !navToggle.contains(e.target)) {
            closeMenu();
        }
    });

    console.log('✅ Navigation mobile initialisée');
});