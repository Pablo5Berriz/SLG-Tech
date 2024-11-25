// Définition de la fonction pour mettre à jour l'icône utilisateur
document.addEventListener("DOMContentLoaded", () => {
    const userIconContainer = document.getElementById("user-icon-container");
    if (userIconContainer) {
        updateUserIcon(); // Initialise l'icône utilisateur au chargement
    }

    // Fonction pour mettre à jour l'icône utilisateur
    function updateUserIcon() {
        const userIconContainer = document.getElementById("user-icon-container");
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"; // Vérifie si l'utilisateur est connecté
    
        if (isLoggedIn) {
            userIconContainer.innerHTML = `
                <div class="user-menu-container">
                    <i class="fa fa-user user-icon" id="user-icon"></i>
                    <div class="user-menu hidden" id="user-menu">
                        <a href="profile.html" class="menu-item">Profile</a>
                        <a href="parametres.html" class="menu-item">Paramètres</a>
                    </div>
                </div>
            `;
    
            // Ajouter les gestionnaires d'événements pour le menu déroulant
            const userIcon = document.getElementById("user-icon");
            const userMenu = document.getElementById("user-menu");
    
            userIcon.addEventListener("click", () => {
                userMenu.classList.toggle("hidden"); // Affiche ou masque le menu
            });
    
            // Fermer le menu si l'utilisateur clique en dehors
            document.addEventListener("click", (event) => {
                if (!userIconContainer.contains(event.target)) {
                    userMenu.classList.add("hidden");
                }
            });
        } else {
            userIconContainer.innerHTML = `
                <a href="login.html" class="login-link">
                    <i class="fa fa-sign-in-alt"></i>
                </a>
            `;
        }
    }

    // Lorsqu'un utilisateur réussit à se connecter
    function loginUser() {
        localStorage.setItem("isLoggedIn", "true"); // Définit l'utilisateur comme connecté
        localStorage.setItem("username", "NomUtilisateur"); // Sauvegarde un nom d'utilisateur
        console.log("Utilisateur connecté");
        window.location.href = "index.html"; // Redirige vers la page d'accueil
    }

    // Lors de la déconnexion
    window.logoutUser = function () {
        localStorage.setItem("isLoggedIn", false); // Définit l'utilisateur comme déconnecté
        localStorage.removeItem("username"); // Supprime les informations de l'utilisateur
        if (userIconContainer) updateUserIcon(); // Met à jour l'icône
        window.location.href = "login.html"; // Redirige vers la page de connexion
    };

    console.log(
        "État de connexion :",
        localStorage.getItem("isLoggedIn") === "true" ? "Connecté" : "Non connecté"
    );
});



// Charger les données JSON
async function fetchData(endpoint) {
    try {
        const response = await fetch(`/data/${endpoint}.json`);
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement des données : ${endpoint}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Erreur avec ${endpoint} :`, error.message);
        return null;
    }
}