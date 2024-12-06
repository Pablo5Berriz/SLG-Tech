document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("commandes-table");

    // Applique le mode sombre si activé
    applyDarkMode();

    try {
        // Appel API pour récupérer les commandes
        const commandes = await fetchData("/crm/commandes");

        tableBody.innerHTML = ""; // Efface les données par défaut

        commandes.forEach((commande) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${commande.id}</td>
                <td>${commande.user_id}</td>
                <td>${commande.orderNumber}</td>
                <td>${commande.paymentMethod}</td>
                <td>${commande.total} CAD</td>
                <td>${commande.deliveryAddress}</td>
                <td>${commande.date}</td>
                <td>
                    <button onclick="viewCommande(${commande.id})" class="button-read">Voir</button>
                    <button onclick="deleteCommande(${commande.id})" class="button-delete">Supprimer</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Erreur lors du chargement des commandes :", error.message);
    }
});

// Fonction pour afficher les détails d'une commande
function viewCommande(id) {
    alert(`Afficher les détails de la commande ${id}`);
    // Implémentez ici la redirection ou l'ouverture d'une modale
}

// Fonction pour supprimer une commande
function deleteCommande(id) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la commande ${id} ?`)) {
        fetch(`/crm/commandes/${id}`, { method: "DELETE" })
            .then((response) => {
                if (response.ok) {
                    alert(`Commande ${id} supprimée avec succès.`);
                    location.reload(); // Recharge la page
                } else {
                    alert(`Erreur lors de la suppression de la commande ${id}.`);
                }
            })
            .catch((error) => console.error("Erreur lors de la suppression :", error));
    }
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