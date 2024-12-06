document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("clients-table");

    // Applique le mode sombre si activé
    applyDarkMode();
    
    try {
        const clients = await fetchData("/crm/clients");

        tableBody.innerHTML = ""; // Efface les données par défaut

        clients.forEach((client) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${client.id}</td>
                <td>${client.name}</td>
                <td>${client.email}</td>
                <td>${client.phone}</td>
                <td><button class="button-read">Voir</button></td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Erreur lors du chargement des clients :", error.message);
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