document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("categories-table");

    // Applique le mode sombre si activé
    applyDarkMode();

    try {
        const categories = await fetchData("/crm/categories");

        tableBody.innerHTML = ""; // Efface les données par défaut

        categories.forEach((category) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${category.id}</td>
                <td>${category.nom}</td>
                <td>
                    <button class="button-edit">Modifier</button>
                    <button class="button-delete">Supprimer</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Erreur lors du chargement des catégories :", error.message);
    }
});

async function fetchData(url) {
    try {
        const response = await fetch(url, { method: "GET", credentials: "include" });
        if (!response.ok) {
            throw new Error(`Erreur lors de la requête : ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error.message);
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