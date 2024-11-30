document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Vérifiez si une session utilisateur existe côté serveur
        const response = await fetch("/api/session-check", { method: "GET" });

        if (response.status === 401) {
            throw new Error("Session expirée. Veuillez vous reconnecter.");
        }

        await init(); // Charger les données de la page
    } catch (error) {
        alert(error.message);
        window.location.href = "crmLogin.html"; // Rediriger vers la page de connexion
    }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
        await fetch("/api/logout", { method: "POST" });
        alert("Vous avez été déconnecté.");
        window.location.href = "crmLogin.html";
    } catch (error) {
        console.error("Erreur lors de la déconnexion :", error);
    }
});

// Initialiser la page
async function init() {
    try {
        await loadCounts(); // Charger les statistiques principales
        await loadPopularCategories(); // Charger les catégories populaires
        await loadPopularProducts(); // Charger les produits populaires
        await generateSalesChart(); // Générer le diagramme des ventes
    } catch (error) {
        console.error("Erreur lors de l'initialisation :", error.message);
    }
}

// Charger les statistiques
async function loadCounts() {
    try {
        const counts = await Promise.all([
            fetchData("/crm/categories"),
            fetchData("/crm/produits"),
            fetchData("/crm/clients"),
            fetchData("/crm/commandes"),
            fetchData("/crm/avis"),
        ]);

        if (!counts.every((data) => data)) {
            throw new Error("Erreur lors du chargement des données.");
        }

        document.getElementById("categories-count").textContent = `${counts[0].length} Catégories`;
        document.getElementById("produits-count").textContent = `${counts[1].length} Produits`;
        document.getElementById("clients-count").textContent = `${counts[2].length} Clients`;
        document.getElementById("commandes-count").textContent = `${counts[3].length} Commandes`;
        document.getElementById("avis-count").textContent = `${counts[4].length} Avis`;
    } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
    }
}

// Charger les catégories populaires
async function loadPopularCategories() {
    try {
        const categories = await fetchData('/crm/categories/popular');
        const container = document.getElementById('popular-categories');
        container.innerHTML = '';

        categories.forEach((category) => {
            const div = document.createElement('div');
            div.textContent = `${category.categorie} - Ventes : ${category.quantite}`;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des catégories populaires :', error.message);
    }
}

// Charger les produits populaires
async function loadPopularProducts() {
    try {
        const produits = await fetchData('/crm/produits/popular');
        const container = document.getElementById('popular-products');
        container.innerHTML = '';

        produits.forEach((produit) => {
            const div = document.createElement('div');
            div.textContent = `${produit.nom} - Ventes : ${produit.quantite}`;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des produits populaires :', error.message);
    }
}

async function generateSalesChart() {
    const salesData = await fetchData('/crm/statistics/sales-by-category');
    const ctx = document.getElementById('sales-chart').getContext('2d');

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(salesData),
            datasets: [{
                data: Object.values(salesData),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
            },
        },
    });
}

// Récupérer les données via session
async function fetchData(url) {
    try {
        const response = await fetch(url, { method: 'GET', credentials: 'include' });

        if (!response.ok) {
            throw new Error(`Erreur lors de la requête vers ${url}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Erreur avec fetchData :", error.message);
        throw error;
    }
}