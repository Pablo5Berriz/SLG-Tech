document.addEventListener("DOMContentLoaded", async () => {
    const ctx = document.getElementById("stats-chart").getContext("2d");

    // Applique le mode sombre si activé
    applyDarkMode();

    try {
        // Appel à l'API pour récupérer les données
        const rawData = await fetchData('/crm/statistics/sales-by-category');

        // Transformation des données API en labels et valeurs
        const salesData = {
            labels: Object.keys(rawData), // Les clés deviennent les étiquettes
            values: Object.values(rawData) // Les valeurs deviennent les données
        };

        if (!salesData.labels.length || !salesData.values.length) {
            throw new Error("Les données transformées ne sont pas valides.");
        }

        console.log("Données transformées :", salesData);

        // Génération du graphique
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: salesData.labels, // Étiquettes des catégories ou produits
                datasets: [{
                    label: "Ventes (en unités)",
                    data: salesData.values, // Valeurs correspondantes
                    backgroundColor: [
                        "rgba(255, 99, 132, 0.6)",
                        "rgba(54, 162, 235, 0.6)",
                        "rgba(255, 206, 86, 0.6)",
                        "rgba(75, 192, 192, 0.6)",
                        "rgba(153, 102, 255, 0.6)"
                    ],
                    borderColor: [
                        "rgba(255, 99, 132, 1)",
                        "rgba(54, 162, 235, 1)",
                        "rgba(255, 206, 86, 1)",
                        "rgba(75, 192, 192, 1)",
                        "rgba(153, 102, 255, 1)"
                    ],
                    borderWidth: 1,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "top",
                    },
                    tooltip: {
                        enabled: true,
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "Catégories / Produits",
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: "Ventes (en unités)",
                        },
                        beginAtZero: true,
                    },
                },
            },
        });
    } catch (error) {
        console.error("Erreur lors de la génération du graphique :", error.message);
        alert("Erreur : " + error.message);
    }
});

// Fonction pour récupérer les données via une API
async function fetchData(url) {
    try {
        const response = await fetch(url, { method: 'GET', credentials: 'include' });

        if (!response.ok) {
            throw new Error(`Erreur lors de la requête vers ${url} : ${response.statusText}`);
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