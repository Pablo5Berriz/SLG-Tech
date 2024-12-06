// Définition de la fonction pour mettre à jour l'icône utilisateur
document.addEventListener("DOMContentLoaded", () => {
    const userIconContainer = document.getElementById("user-icon-container");

    if (userIconContainer) {
        updateUserIcon(); // Initialise l'icône utilisateur au chargement
    }

    // Fonction pour mettre à jour l'icône utilisateur
    function updateUserIcon() {
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"; // Vérifie si l'utilisateur est connecté
        const userId = localStorage.getItem("userId"); // Récupère l'ID utilisateur

        if (isLoggedIn) {
            // Charge le panier de l'utilisateur connecté
            loadCart(userId);

            // Affiche l'icône utilisateur avec un menu déroulant
            userIconContainer.innerHTML = `
                <div class="user-menu-container">
                    <i class="fa fa-user user-icon" id="user-icon"></i>
                    <div class="user-menu hidden" id="user-menu">
                        <a href="profile.html" class="menu-item"><i class="fa fa-user"></i> Profil</a>
                        <a href="parametres.html" class="menu-item"><i class="fa fa-cog"></i> Paramètres</a>
                        <a href="#" class="menu-item logout-link"><i class="fa fa-sign-out-alt"></i> Déconnexion</a>
                    </div>
                </div>
            `;

            // Gestion du menu déroulant
            const userIcon = document.getElementById("user-icon");
            const userMenu = document.getElementById("user-menu");

            if (userIcon && userMenu) {
                userIcon.addEventListener("click", () => {
                    userMenu.classList.toggle("hidden"); // Affiche ou masque le menu
                });

                // Fermer le menu si l'utilisateur clique en dehors
                document.addEventListener("click", (event) => {
                    if (!userIconContainer.contains(event.target)) {
                        userMenu.classList.add("hidden");
                    }
                });
            }

            // Gestion de la déconnexion
            const logoutLink = document.querySelector(".logout-link");
            if (logoutLink) {
                logoutLink.addEventListener("click", (e) => {
                    e.preventDefault();
                    logoutUser();
                });
            }
        } else {
            // Affiche l'icône de connexion si l'utilisateur n'est pas connecté
            userIconContainer.innerHTML = `
                <a href="login.html" class="login-link">
                    <i class="fa fa-sign-in-alt"></i>
                </a>
            `;
        }
    }

    // Fonction pour connecter un utilisateur
    window.loginUser = function (username, userId) {
        localStorage.setItem("isLoggedIn", "true"); // Définit l'utilisateur comme connecté
        localStorage.setItem("username", username); // Sauvegarde le nom d'utilisateur
        localStorage.setItem("userId", userId); // Sauvegarde l'ID utilisateur
        console.log("Utilisateur connecté :", username);
        updateUserIcon(); // Met à jour l'icône utilisateur
        window.location.href = "index.html"; // Redirige vers la page d'accueil
    };

    // Fonction pour déconnecter un utilisateur
    window.logoutUser = function () {
        localStorage.setItem("isLoggedIn", "false"); // Définit l'utilisateur comme déconnecté
        localStorage.removeItem("username"); // Supprime les informations de l'utilisateur
        localStorage.removeItem("userId"); // Supprime l'ID utilisateur
        console.log("Utilisateur déconnecté");
        updateUserIcon(); // Met à jour l'icône utilisateur
        window.location.href = "login.html"; // Redirige vers la page de connexion
    };

    // Fonction pour charger le panier depuis le backend
    

    // Vérifie si l'utilisateur est connecté avant de finaliser l'achat
    const confirmOrderButton = document.querySelector("#confirm-order");
    if (confirmOrderButton) {
        confirmOrderButton.addEventListener("click", () => {
            const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
            if (!isLoggedIn) {
                alert("Veuillez vous connecter pour finaliser votre achat.");
                window.location.href = "login.html"; // Redirige vers la page de connexion
            }
        });
    }

    async function loadCart(userId) {
        if (!userId) return;
        try {
            const response = await fetch(`api/cart/${userId}`);
            if (!response.ok) throw new Error("Erreur lors du chargement du panier.");
            const cartData = await response.json();
            console.log("Panier récupéré depuis le backend :", cartData);
    
            // Met à jour le localStorage uniquement si le panier du backend est valide
            if (cartData && cartData.length > 0) {
                localStorage.setItem("cart", JSON.stringify(cartData));
            }
        } catch (error) {
            console.error("Erreur lors de la récupération du panier :", error.message);
        }
    }

    // Fonction pour mettre à jour le nombre de produits dans le panier
    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        console.log("Contenu du panier pour compteur :", cart);
        const totalItems = cart.reduce((sum, product) => sum + product.quantite, 0);
    
        const cartCountElement = document.getElementById("cart-count");
        if (cartCountElement) {
            cartCountElement.textContent = totalItems > 0 ? totalItems : "0";
        }
    }

    // Appelle la fonction au chargement de chaque page
    updateCartCount();

    // Fonction pour ajouter un produit au panier
    window.addToCart = function (product) {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingProduct = cart.find((item) => item.id === product.id);
    
        if (existingProduct) {
            existingProduct.quantite += 1; // Augmente la quantité si le produit existe déjà
        } else {
            cart.push({ ...product, quantite: 1 }); // Ajoute un nouveau produit
        }
    
        localStorage.setItem("cart", JSON.stringify(cart)); // Sauvegarde dans localStorage
        updateCartCount(); // Met à jour le compteur
        alert(`${product.nom} a été ajouté au panier !`);
        console.log("Panier après ajout :", cart); // Log du contenu du panier
    };
});

// Gestion du menu de navigation
document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");

    menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("active");
    });
});

// Fonction générique pour charger les données JSON
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

// Connexion au CRM
const crmAccessBtn = document.getElementById("crm-access-btn");
    if (crmAccessBtn) {
        crmAccessBtn.addEventListener("click", async () => {
            try {
                const response = await fetch("/api/session-check", {
                    method: "GET",
                    credentials: "include",
                });

                if (!response.ok) {
                    throw new Error("Session expirée. Veuillez vous reconnecter.");
                }

                const sessionData = await response.json();
                console.log("Session valide :", sessionData);

                window.location.href = "crmDashboard.html";
            } catch (error) {
                alert(error.message);
                window.location.href = "crmLogin.html";
            }
        });
    }
