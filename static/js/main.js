gsap.registerPlugin(ScrollTrigger);

// On cible le conteneur qui englobe les deux titres
const TitlesWrapper = document.querySelector(".hero-fullscreen .titles-wrapper");
const Dynastie = document.querySelector(".hero-fullscreen .dynastie-box");
const Film = document.querySelector(".hero-fullscreen .film-box");


const tl = gsap.timeline({
    scrollTrigger: {
        trigger: ".hero-fullscreen",
        start: "top top",
        end: "bottom top",
        scrub: 1.5, // Un peu plus bas pour plus de fluidité visuelle
        pinSpacing: true,
        invalidateOnRefresh: true
    }
});

// 1. On déplace TOUT le bloc d'un coup dans le coin supérieur gauche
tl.to(TitlesWrapper, {
    x: () => {
        const rect = TitlesWrapper.getBoundingClientRect();
        return -(rect.left - 20); // Marge de 20px du bord gauche
    },
    y: () => {
        const rect = TitlesWrapper.getBoundingClientRect();
        return -(rect.top - 20); // Marge de 20px du haut
    },
    scale: 0.2,
    transformOrigin: "left top" // Pivot fixe en haut à gauche
}, 0);

// 2. On rapproche simplement "Film" de "Dynastie" pour compenser l'espace vide du CSS d'origine
tl.to(Film, {
    // Si mobile, x=0, sinon on déplace d'une fraction de la largeur (ex: -60%)
    x: () => window.innerWidth <= 1024 ? 0 : -window.innerWidth * 0.6,
    
    // Même chose pour Y, on utilise une fraction de la hauteur
    y: () => window.innerWidth <= 1024 ? -10 : -window.innerHeight * 0.05,
    
    transformOrigin: "left top"
}, 0);




const WelcomeSection = document.querySelector(".welcome-section");
const WelcomeContent = document.querySelector(".welcome-content");

const welcomeTl = gsap.timeline({
    scrollTrigger: {
        trigger: WelcomeSection,
        start: "top top",
        end: () => `+=${window.innerHeight * 1}`, // Durée totale du blocage à l'écran
        pin: true,                                 // Fige la section au scroll
        scrub: 1,                                  // Animation synchronisée à la molette
        
        invalidateOnRefresh: true               // Recalcule proprement si on redimensionne,
       
    }
});

// [TEMPS 1] : Entrée en Fade-in + Scale qui grandit
// Note : Pense à ajouter `scale: 0.8` dans ton CSS initial pour que l'effet soit visible
welcomeTl.to(WelcomeContent, {
    opacity: 1,
    scale: 1,         // Revient à sa taille normale (100%)
    duration: 2,    
    ease: "power2.out"
});

// (Optionnel) Un tout petit temps de pause pour apprécier le texte au centre
welcomeTl.to({}, { duration: 1 });

// [TEMPS 2] : Le bloc monte vers le haut (Déplacement vertical) et s'efface
welcomeTl.to(WelcomeContent, {
    y: -300,          // Remplace par -100 pour monter (y: 100 le ferait descendre)
         
    duration: 6,
    ease: "power2.in"
});

// ============================================================
// PARALLAXE HERO ÉDITORIAL
// ============================================================

document.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero-editorial');
    const image = document.querySelector('.hero-editorial-image');
    
    if (!hero || !image) return;
    
    const rect = hero.getBoundingClientRect();
    const scrolled = window.scrollY;
    const heroHeight = hero.offsetHeight;
    
    if (rect.top <= 0 && rect.bottom > 0) {
        const progress = Math.min(Math.abs(rect.top) / heroHeight, 1);
        image.style.transform = `scale(1.05) translateY(${progress * 30}px)`;
    }
});