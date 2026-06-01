document.addEventListener('DOMContentLoaded', function() {
    
    const dynastieBox = document.querySelector('.dynastie-box');
    const filmBox = document.querySelector('.film-box');
    const dynastieTitle = document.querySelector('.dynastie-title');
    const filmTitle = document.querySelector('.film-title');
    
    if (!dynastieBox || !filmBox) return;
    
    // Positions initiales (seront remplies après le chargement)
    let startDynastieLeft = 0, startDynastieTop = 0;
    let startFilmLeft = 0, startFilmTop = 0;
    let startDynastieSize = 0, startFilmSize = 0;
    
    // Positions finales
    const endLeftD = 30;
    const endLeftF = 75;
    const endDynastieTop = 30;
    const endFilmTop = 60;
    const endSize = 30;
    
    const maxScroll = 400;
    
    // Flag pour savoir si on a déjà capturé les positions initiales
    let hasInitialPositions = false;
    
    function getInitialPositions() {
        // Ne capturer qu'une seule fois, après que le CSS a tout positionné
        if (hasInitialPositions) return;
        
        const dynastieRect = dynastieBox.getBoundingClientRect();
        startDynastieLeft = dynastieRect.left;
        startDynastieTop = dynastieRect.top;
        
        const filmRect = filmBox.getBoundingClientRect();
        startFilmLeft = filmRect.left;
        startFilmTop = filmRect.top;
        
        startDynastieSize = parseFloat(getComputedStyle(dynastieTitle).fontSize);
        startFilmSize = parseFloat(getComputedStyle(filmTitle).fontSize);
        
        hasInitialPositions = true;
        
        console.log('Positions initiales capturées:', {
            dynastie: { left: startDynastieLeft, top: startDynastieTop },
            film: { left: startFilmLeft, top: startFilmTop }
        });
    }
    
    function updateTitles() {
        // Ne rien faire tant qu'on n'a pas les positions initiales
        if (!hasInitialPositions) return;
        
        let scrollY = window.scrollY;
        if (scrollY < 0) scrollY = 0;
        
        let progress = Math.min(scrollY / maxScroll, 1);
        
        // Si progress = 0, on n'applique aucun style (on laisse le CSS)
        if (progress === 0) {
            // Remettre à zéro les styles inline
            dynastieBox.style.left = '';
            dynastieBox.style.top = '';
            dynastieBox.style.right = '';
            dynastieBox.style.bottom = '';
            
            filmBox.style.left = '';
            filmBox.style.top = '';
            filmBox.style.right = '';
            filmBox.style.bottom = '';
            
            dynastieTitle.style.fontSize = '';
            filmTitle.style.fontSize = '';
            return;
        }
        
        // DYNASTIE
        const currentDynastieLeft = (endLeftD * progress) + (startDynastieLeft * (1 - progress));
        const currentDynastieTop = (endDynastieTop * progress) + (startDynastieTop * (1 - progress));
        
        dynastieBox.style.left = `${currentDynastieLeft}px`;
        dynastieBox.style.top = `${currentDynastieTop}px`;
        dynastieBox.style.right = 'auto';
        dynastieBox.style.bottom = 'auto';
        
        // FILM
        const currentFilmLeft = (endLeftF * progress) + (startFilmLeft * (1 - progress));
        const currentFilmTop = (endFilmTop * progress) + (startFilmTop * (1 - progress));
        
        filmBox.style.left = `${currentFilmLeft}px`;
        filmBox.style.top = `${currentFilmTop}px`;
        filmBox.style.right = 'auto';
        filmBox.style.bottom = 'auto';
        
        // Tailles
        const currentDynastieSize = (endSize * progress) + (startDynastieSize * (1 - progress));
        const currentFilmSize = (endSize * progress) + (startFilmSize * (1 - progress));
        
        dynastieTitle.style.fontSize = `${currentDynastieSize}px`;
        filmTitle.style.fontSize = `${currentFilmSize}px`;
    }
    
    // Attendre que tout soit chargé (images, polices, etc.)
    window.addEventListener('load', function() {
        // Attendre un peu plus pour que les animations CSS soient terminées
        setTimeout(() => {
            getInitialPositions();
            // Forcer une mise à jour pour que progress = 0 au début
            updateTitles();
        }, 100);
    });
    
    // Écouter le scroll
    window.addEventListener('scroll', () => requestAnimationFrame(updateTitles));
    
    // Recalculer les positions au redimensionnement
    window.addEventListener('resize', function() {
        hasInitialPositions = false;
        setTimeout(() => {
            getInitialPositions();
            updateTitles();
        }, 100);
    });
});