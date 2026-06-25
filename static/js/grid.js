window.addEventListener("load", () => {
    gsap.registerPlugin(ScrollTrigger);
    
    if (window.matchMedia("(max-width: 768px)").matches) return;

    const section = document.querySelector(".photo-grid");
    const container = document.querySelector(".grid-container");
    const items = gsap.utils.toArray(".photo-grid .grid");

    if (!section || !container || items.length === 0) return;

    // ==========================================
    // Fonction pour calculer les valeurs dynamiquement
    // ==========================================
    function getResponsiveValues() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Facteurs d'adaptation selon la résolution
        let scaleFactor = 1;
        let elevationFactor = 1;
        let durationFactor = 1;
        
        // Ajustements pour différentes résolutions
        if (screenWidth <= 1024) {
            // Petit écran desktop
            scaleFactor = 0.85;
            elevationFactor = 0.7;
            durationFactor = 0.8;
        } else if (screenWidth <= 1366) {
            // Écran moyen
            scaleFactor = 0.95;
            elevationFactor = 0.85;
            durationFactor = 0.9;
        } else if (screenWidth <= 1920) {
            // Grand écran standard
            scaleFactor = 1;
            elevationFactor = 1;
            durationFactor = 1;
        } else {
            // Très grand écran (4K+)
            scaleFactor = 1.1;
            elevationFactor = 1.2;
            durationFactor = 1.1;
        }
        
        return { scaleFactor, elevationFactor, durationFactor };
    }

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: "top 60%",
            end: () => `+=${window.innerHeight * 0.65}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
        }
    });

    // Récupérer les valeurs adaptatives
    const { scaleFactor, elevationFactor, durationFactor } = getResponsiveValues();

    // ==========================================
    // FUSION ADAPTATIVE
    // ==========================================
    const containerRect = container.getBoundingClientRect();
    const containerCenterX = containerRect.left + containerRect.width / 2;

    items.forEach((item, index) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenterX = itemRect.left + itemRect.width / 2;

        // Distance adaptée au facteur d'échelle
        const distanceToCenterX = (containerCenterX - itemCenterX) * scaleFactor;
        
        // Délai progressif pour un effet plus organique
        const delay = index * 0.02;

        tl.to(item, {
            x: distanceToCenterX,
            ease: "power2.inOut",
            scale: 0.95 + (1 - scaleFactor) * 0.1,
            rotation: 0.3 * (1 - scaleFactor),
            duration: 0.8 * durationFactor,
        }, delay);
    });

    // ==========================================
    // ÉLÉVATION ADAPTATIVE
    // ==========================================
    const textGrid = document.querySelector(".text-grid");
    const elevationDistance = window.innerHeight * 0.08 * elevationFactor;

    tl.to(container, {
        y: -elevationDistance,
        ease: "power2.out",
        scale: 1 + (1 - scaleFactor) * 0.02,
        duration: 0.8 * durationFactor,
    }); 

    if (textGrid) {
        tl.to(textGrid, {
            opacity: 1,
            y: 0,
            ease: "power2.out",
            duration: 0.6 * durationFactor,
        }, "<");
    }

    // ==========================================
    // REFRESH AU REDIMENSIONNEMENT
    // ==========================================
    let resizeTimeout;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            ScrollTrigger.refresh();
        }, 200);
    });
});