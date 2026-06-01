document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector(".main-nav");
    let lastScrollY = window.scrollY;

    window.addEventListener("scroll", () => {
        const currentScrollY = window.scrollY;

        // Si on scroll vers le bas et qu'on a dépassé les 100px
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // On cache la nav en la déplaçant vers le haut
            gsap.to(nav, { 
                y: -100, 
                opacity: 0, 
                duration: 0.4, 
                ease: "power2.out" 
            });
        } else {
            // On réaffiche la nav quand on remonte
            gsap.to(nav, { 
                y: 0, 
                opacity: 1, 
                duration: 0.4, 
                ease: "power2.out" 
            });
        }
        
        lastScrollY = currentScrollY;
    });
});