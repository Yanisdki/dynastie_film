gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
    
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".flex.flex-col.items-center", 
            start: "top top",
            end: "+=2500", 
            scrub: 1,
            pin: true,
            pinSpacing: true,
            
            pinType: "transform",

            // --- L'APPEL DES DEUX FICHIERS AU MOMENT CONVENU ---
            onEnter: () => {
                // On coupe le clair, on démarre le sombre
                if (window.stopLightBg) window.stopLightBg();
                if (window.initDarkBg) window.initDarkBg();
                document.querySelector('.main-footer')?.classList.add('footer-dark');
            },
            onLeaveBack: () => {
                // On remonte tout en haut : on coupe le sombre, on remet le clair
                if (window.stopDarkBg) window.stopDarkBg();
                if (window.startLightBg) window.startLightBg();
                document.querySelector('.main-footer')?.classList.remove('footer-dark');
            },
            onEnterBack: () => {
                // Sécurité si on revient par le bas de la page
                if (window.stopLightBg) window.stopLightBg();
                if (window.initDarkBg) window.initDarkBg();
            }
        }
    });

    // 1. Réduction mécanique du masque (le fond change via l'appel des scripts au-dessus)
    tl.to("#liquid-mask-container", {
        scale: 0.5,
        borderRadius: "20px",
        filter: "grayscale(100%)",
        ease: "power2.inOut"
    }, 0) 

    .to("#ambient-bg-dark", {
    opacity: 1,
    ease: "power2.inOut"
}, 0)

    // 2. Décalage liquide à gauche
    

    // 3. Entrée de la grille de conseils par la droite
   
});