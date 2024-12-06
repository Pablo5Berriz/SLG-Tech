document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("produits-table");

    // Applique le mode sombre si activé
    applyDarkMode();

    try {
        const produits = await fetchData("/crm/produits");

        tableBody.innerHTML = ""; // Efface les données par défaut

        produits.forEach((produit) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${produit.id}</td>
                <td>${produit.nom}</td>
                <td>${produit.description}</td>
                <td>${produit.prix} CAD</td>
                <td>${produit.stock}</td>
                <td>
                    <button class="button-edit">Modifier</button>
                    <button class="button-delete">Supprimer</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Erreur lors du chargement des produits :", error.message);
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