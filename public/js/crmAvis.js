document.addEventListener("DOMContentLoaded", async () => {
    const avisList = document.getElementById("avis-list");

    // Applique le mode sombre si activé
    applyDarkMode();

    try {
        // Appel API pour récupérer les avis
        const avis = await fetchData("/crm/avis");

        avisList.innerHTML = ""; // Efface les données par défaut

        avis.forEach((avisItem) => {
            const listItem = document.createElement("li", "span.stars", "span.text");
            listItem.innerHTML = `
                <strong>${avisItem.nom}</strong> : 
                <span class="stars">${renderStars(avisItem.note)}<span> - 
                <span class="text">"${avisItem.commentaire}"<span>
            `;
            avisList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Erreur lors du chargement des avis :", error.message);
    }
});

// Fonction pour générer les étoiles en fonction de la note
function renderStars(rating) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? "★" : "☆";
    }
    return stars;
}

// Fonction pour récupérer les données depuis une API
async function fetchData(url) {
    try {
        const response = await fetch(url, { method: "GET", credentials: "include" });
        if (!response.ok) {
            throw new Error(`Erreur lors de la requête : ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Erreur avec fetchData :", error.message);
        throw error;
    }
}

// Fonction pour appliquer le mode sombre
function applyDarkMode() {
    const isDarkModeEnabled = localStorage.getItem("darkMode") === "enabled";

    if (isDarkModeEnabled) {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
}