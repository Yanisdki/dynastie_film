document.addEventListener('DOMContentLoaded', () => {
    const stars = document.querySelectorAll('.star');
    const ratingInput = document.getElementById('selectedRating');

    // On applique l'état sélectionné par défaut (5 étoiles) au démarrage
    updateStars(ratingInput.value);

    stars.forEach(star => {
        // Clic sur une étoile
        star.addEventListener('click', () => {
            const value = star.getAttribute('data-value');
            ratingInput.value = value; // Assigne la valeur au champ Django caché
            updateStars(value);
        });
    });

    function updateStars(ratingValue) {
        stars.forEach(star => {
            const starValue = star.getAttribute('data-value');
            // Si la valeur de l'étoile est inférieure ou égale à la note choisie, on l'allume
            if (parseInt(starValue) <= parseInt(ratingValue)) {
                star.classList.add('selected');
            } else {
                star.classList.remove('selected');
            }
        });
    }
});