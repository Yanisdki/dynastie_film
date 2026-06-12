
window.addEventListener("load", () => {
    gsap.registerPlugin(ScrollTrigger);

    const section = document.querySelector(".photo-grid");
    const container = document.querySelector(".grid-container");
    const items = gsap.utils.toArray(".photo-grid .grid");

    if (!section || !container || items.length === 0) return;

    // 1. On fige la section parente sur place
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: "top 60%",         // Bloque dès que la section est plein écran
            end: () => `+=${window.innerHeight * 0.65}`, // Durée totale de l'effet (fusion + élévation)
            pin: true,                // Fige l'écran verticalement
            scrub: 1,                 // Animation fluide liée à la molette
                        
            invalidateOnRefresh: true, // Recalcule proprement si on redimensionne
             // <-- Affiche les marqueurs de ScrollTrigger pour le debug (optionnel)
        }

    });

    // Pour éviter les bugs de calcul dus au débordement horizontal de la flexbox,
    // on calcule le centre par rapport à la zone globale de l'écran (window.innerWidth / 2)
    const screenCenterX = window.innerWidth / 2;

    // ==========================================
    // ÉTAPE A : FUSION HORIZONTALE EN BAS
    // ==========================================
    items.forEach((item) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenterX = itemRect.left + itemRect.width / 2;

        // Distance exacte sur l'axe X pour rejoindre le centre de l'écran
        const distanceToCenterX = screenCenterX - itemCenterX;

        tl.to(item, {
            x: distanceToCenterX,
            ease: "power2.inOut"
        }, 0); // "0" pour que toutes les cartes fusionnent en même temps
    });

// ==========================================
    // ÉTAPE B : ÉLÉVATION DE LA PILE + APPARITION DU TEXTE
    // ==========================================
    const textGrid = document.querySelector(".text-grid");

    // On fait monter le conteneur entier
    tl.to(container, {
        y: -100, 
        ease: "power2.out"
    }); 

    // On fait apparaître le texte en même temps (grâce au symbole "<" qui synchronise avec l'étape B)
    if (textGrid) {
        tl.to(textGrid, {
            opacity: 1,
            y: 0,
            ease: "power2.out",
            duration: 1
        }, "<"); // "<" signifie : démarre en même temps que l'animation précédente (l'élévation)
    }
});