document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialisation GLightbox
    GLightbox({ selector: '.glightbox', touchNavigation: true, loop: true });

    // 2. Initialisation Swiper
    new Swiper('.swiper', {
        loop: true,
        autoplay: { delay: 5000, disableOnInteraction: false },
        effect: 'fade',
        fadeEffect: { crossFade: true },
        speed: 1000,
    });

    // 3. Observateur unique et optimisé
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Animation d'apparition
                entry.target.classList.add('is-visible');
                
                // Gestion vidéo si elle existe
                const vid = entry.target.querySelector('.portfolio-video');
                if (vid) vid.play().catch(() => {});
            } else {
                // Optionnel : tu peux retirer 'is-visible' ici si tu veux que l'animation se rejoue
                // entry.target.classList.remove('is-visible');
                
                // Gestion vidéo si elle existe
                const vid = entry.target.querySelector('.portfolio-video');
                if (vid) {
                    vid.pause();
                    vid.currentTime = 0;
                }
            }
        });
    }, { threshold: 0.3 });

    // On observe chaque carte une seule fois
    document.querySelectorAll('.portfolio-card').forEach(card => observer.observe(card));
});