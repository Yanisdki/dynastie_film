document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("multistep-form");
    if (!form) return;

    // Éléments DOM
    const steps = Array.from(document.querySelectorAll(".form-step"));
    const nextBtns = document.querySelectorAll(".btn-next");
    const prevBtns = document.querySelectorAll(".btn-prev");
    const progressBar = document.getElementById("progress-bar");
    const djangoSelect = document.querySelector("select[name='prestation_type']");
    const cards = document.querySelectorAll(".prestation-card");
    const optionsMariageOnly = document.getElementById("options-mariage-only");
    const mariageBloc = document.getElementById("conditional-mariage-bloc");
    const joursInput = document.querySelector("input[name='jours_supplementaires']");
    const calendrierContainer = document.getElementById("calendriers-prolongation-container");
    const listeCalendriers = document.getElementById("liste-calendriers");
    const datesCacheesInput = document.getElementById("id_dates_supplementaires");

    let currentStep = 1;
    const todayStr = new Date().toISOString().split('T')[0];
    
    // NOUVEAU : Variable pour stocker les dates prises
    let datesPrises = [];

    // NOUVEAU : Récupération des dates réservées
    fetch('/api/dates-reservees/')
        .then(response => response.json())
        .then(data => { datesPrises = data.dates; });
        console.log("Dates reçues du serveur :", datesPrises);

    // ==========================================
    // 1. GESTION DES CARTES DE PRESTATION
    // ==========================================
    cards.forEach(card => {
        card.addEventListener("click", () => {
            cards.forEach(c => c.classList.remove("card-selected"));
            card.classList.add("card-selected");
            
            const selectedValue = card.getAttribute("data-value");
            if (djangoSelect) {
                djangoSelect.value = selectedValue;
                djangoSelect.dispatchEvent(new Event('change'));
            }

            if (optionsMariageOnly) optionsMariageOnly.style.display = (selectedValue === "MARIAGE") ? "block" : "none";
            if (mariageBloc) mariageBloc.style.display = (selectedValue === "MARIAGE") ? "block" : "none";
        });
    });

    // ==========================================
    // 2. CALENDRIERS ET VALIDATION
    // ==========================================
    function validerEtSauvegarder() {
        const inputs = document.querySelectorAll(".date-prolongation");
        const datePrincipale = document.querySelector("input[name='date_event']")?.value;
        const valeurs = [];
        let estValide = true;

        if (datePrincipale) valeurs.push(datePrincipale);

        inputs.forEach(inp => {
            inp.style.borderColor = "#333";
            if (inp.value) {
                if (valeurs.includes(inp.value) || datesPrises.includes(inp.value)) {
                    inp.style.borderColor = "red";
                    estValide = false;
                }
                valeurs.push(inp.value);
            }
        });

        if (datesCacheesInput) datesCacheesInput.value = JSON.stringify(valeurs.filter(v => v !== datePrincipale));
        return estValide;
    }

    if (joursInput) {
        joursInput.addEventListener("input", () => {
            const nbrJours = parseInt(joursInput.value, 10) || 0;
            listeCalendriers.innerHTML = "";
            
            if (nbrJours > 0) {
                if (calendrierContainer) calendrierContainer.style.display = "block";
                for (let i = 1; i <= nbrJours; i++) {
                    const div = document.createElement("div");
                    div.innerHTML = `<input type="date" class="form-input date-prolongation" min="${todayStr}" required style="width: 100%; padding: 10px; margin-bottom: 10px; background: #111; border: 1px solid #333; color: #fff;">`;
                    
                    div.querySelector("input").addEventListener("change", (e) => {
                        if (!validerEtSauvegarder()) {
                            alert("Attention : cette date est déjà utilisée ou réservée.");
                            e.target.value = "";
                        }
                        mettreAJourPrix();
                    });
                    listeCalendriers.appendChild(div);
                }
            } else {
                if (calendrierContainer) calendrierContainer.style.display = "none";
                if (datesCacheesInput) datesCacheesInput.value = "[]";
            }
            mettreAJourPrix();
        });
    }

    // ==========================================
    // 3. PRIX
    // ==========================================
    function mettreAJourPrix() {
        let total = 0;
        const prestation = djangoSelect ? djangoSelect.value : "";
        const horaire = document.querySelector("#id_mariage_horaire")?.value || "";

        if (prestation === 'MARIAGE') {
            if (horaire === 'STANDARD') total += 60000;
            else if (horaire === 'TOUTE LA JOURNÉE') total += 62000;
            else if (horaire === 'SOIREE') total += 65000;
            }
        else if (prestation === 'CIRCONCISION') total += 60000;
        else if (prestation === 'CLIP_MUSICAL') total += 80000;
        else if (prestation === 'EDITORIAL') total += 40000;
        else if (prestation === 'CORPORATE') total += 50000;
        
        

        const inputsDates = document.querySelectorAll(".date-prolongation");
        let nbrJoursRemplis = 0;
        inputsDates.forEach(inp => { if (inp.value) nbrJoursRemplis++; });
        
        total += (nbrJoursRemplis * 35000);
        
        if (document.querySelector("#id_option_drone")?.checked) total += 20000;
        if (document.querySelector("#id_hors_wilaya")?.checked) total += 3000;

        const affichage = document.querySelector("#total-affichage");
        if (affichage) affichage.innerText = total.toLocaleString() + " DA";
    }

    function remplirRecapitulatif() {
        const recapContainer = document.getElementById("summary-content");
        if (!recapContainer) return;

        const type = djangoSelect?.options[djangoSelect.selectedIndex]?.text || "Non sélectionné";
        const datePrincipale = document.querySelector("input[name='date_event']")?.value || "Non définie";
        const lieu = document.querySelector("input[name='lieu']")?.value || "Non précisé";
        
        let datesSupp = [];
        try { datesSupp = JSON.parse(datesCacheesInput?.value || "[]"); } catch(e) { datesSupp = []; }
        const listeDates = datesSupp.length > 0 ? datesSupp.join(", ") : "Aucune";

        recapContainer.innerHTML = `
            <div style="text-align: left; color: #cdcdcd;">
                <p><strong>Prestation :</strong> ${type}</p>
                <p><strong>Date principale :</strong> ${datePrincipale}</p>
                <p><strong>Lieu :</strong> ${lieu}</p>
                <p><strong>Dates supp :</strong> ${listeDates}</p>
            </div>
        `;
    }

    // ==========================================
    // 4. NAVIGATION
    // ==========================================
// ==========================================
    // 4. NAVIGATION (Vérification temps réel)
    // ==========================================
  // ==========================================
    // 4. NAVIGATION (Logique complète et sécurisée)
    // ==========================================
   nextBtns.forEach(btn => btn.addEventListener("click", async () => {
    
    // 1. Validation locale des champs requis (uniquement pour l'étape active)
    const etapeActive = document.querySelector(".form-step.step-active");
    const stepNumber = parseInt(etapeActive.getAttribute("data-step"));

    // Validation spécifique pour l'horaire (Si on est à l'étape où l'horaire apparaît)
    // Ajuste "3" ci-dessous par le numéro réel de l'étape où se trouve le champ mariage_horaire
    if (stepNumber === 3) { 
        const prestation = djangoSelect?.value;
        const horaire = document.querySelector("#id_mariage_horaire")?.value;
        
        if (prestation === 'MARIAGE' && (!horaire || horaire === "")) {
            alert("Veuillez choisir un créneau horaire pour votre mariage.");
            document.querySelector("#id_mariage_horaire").focus();
            return; // Bloque le passage à l'étape suivante
        }
    }

    // Validation standard des autres champs "required" présents dans l'étape active
    // Cette ligne dit : "Vérifie tous les requis, SAUF celui qui s'appelle 'message'"
    const champsRequis = etapeActive.querySelectorAll("[required]:not([name='message'])");
    for (let champ of champsRequis) {
        if (!champ.value || champ.value.trim() === "") {
            alert("Veuillez remplir le champ obligatoire : " + (champ.placeholder || champ.name));
            champ.focus();
            return;
        }
    }

    // 2. Appel serveur unique pour les dates
    const response = await fetch('/api/dates-reservees/');
    const data = await response.json();
    const datesActuelles = data.dates;

    // 3. Validation métier (Dates)
    if (currentStep === 1 || currentStep === 2) {
        const datePrincipale = document.querySelector("input[name='date_event']")?.value;
        if (datePrincipale && datesActuelles.includes(datePrincipale)) {
            alert("Attention : Cette date est déjà réservée par un autre client.");
            return;
        }
    }
    
    if (currentStep === 3) {
        const inputs = document.querySelectorAll(".date-prolongation");
        let conflitServeur = false;
        inputs.forEach(inp => {
            if (inp.value && datesActuelles.includes(inp.value)) {
                inp.style.borderColor = "red";
                conflitServeur = true;
            }
        });
        if (conflitServeur) {
            alert("Une de vos dates supplémentaires a été réservée. Merci de la modifier.");
            return;
        }
        if (!validerEtSauvegarder()) {
            alert("Veuillez corriger les dates (doublons).");
            return;
        }
    }
    
    // 4. Passage à l'étape suivante
    currentStep++;
    if (currentStep === 5) remplirRecapitulatif();
    updateSteps();
}));

    prevBtns.forEach(btn => btn.addEventListener("click", () => {
        currentStep--;
        updateSteps();
    }));

    function updateSteps() {
        steps.forEach((step, idx) => {
            step.classList.toggle("step-active", (idx + 1) === currentStep);
        });
        if (progressBar) progressBar.style.width = `${(currentStep / steps.length) * 100}%`;
    }

    document.querySelectorAll("input, select").forEach(el => {
        el.addEventListener("change", mettreAJourPrix);
    });
function validerEtapeActuelle() {
    const etapeActive = document.querySelector(".form-step.step-active");
    // On cherche tous les champs required dans cette étape uniquement
    const champsRequis = etapeActive.querySelectorAll("[required]");
    
    for (let champ of champsRequis) {
        if (!champ.value || champ.value.trim() === "") {
            alert("Veuillez remplir le champ : " + (champ.placeholder || champ.name));
            champ.focus(); // Là où ton erreur de focus arrivait
            return false;
        }
    }
    return true;
}

});

