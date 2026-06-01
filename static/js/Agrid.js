window.addEventListener("load", () => {
    gsap.registerPlugin(ScrollTrigger);

    const horizontalSection = document.querySelector(".horizontal-scroll-section");
    const trackTop = document.querySelector(".track-top");
    const trackBottom = document.querySelector(".track-bottom");

    if (!horizontalSection || !trackTop || !trackBottom) return;

    // 1. Position de départ : On pousse les rails à droite de l'écran
    gsap.set([trackTop, trackBottom], {
        x: window.innerWidth
    });

    // 2. Création de la timeline horizontale
    const tlHorizontal = gsap.timeline({
        scrollTrigger: {
            trigger: horizontalSection,
            start: "top top", // S'active pile quand la section est au sommet
            // L'attribut end doit être dynamique et basé sur le rail le plus grand
            end: () => `+=${Math.max(trackTop.scrollWidth, trackBottom.scrollWidth)}`,
            pin: true,        // Fige le scroll vertical
            scrub: 1.5,       // Inertie fluide
            invalidateOnRefresh: true,
            refreshPriority: -1 // Attend que la grille du haut ait fini ses calculs
        }
    });

    // 3. Déplacement des rails avec calcul dynamique en temps réel
    // En passant une fonction () => ... à la propriété x, GSAP recalcule la valeur à la volée !
    tlHorizontal.to(trackTop, { 
        x: () => {
            let maxTrackWidth = Math.max(trackTop.scrollWidth, trackBottom.scrollWidth);
            return -maxTrackWidth;
        }, 
        ease: "none" 
    }, 0)
    .to(trackBottom, { 
        x: () => {
            let maxTrackWidth = Math.max(trackTop.scrollWidth, trackBottom.scrollWidth);
            return -maxTrackWidth;
        }, 
        ease: "none" 
    }, 0);

    // 4. Rafraîchissement global des positions pour synchroniser les deux scripts
    ScrollTrigger.refresh();
});