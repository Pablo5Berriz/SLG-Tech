document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Applique le mode sombre si activé
    applyDarkMode();
    
    try {
        const response = await fetch("/api/admin/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
            credentials: "include", // Inclure les cookies pour la session
        });

        if (!response.ok) {
            throw new Error("Email ou mot de passe incorrect.");
        }

        // Rediriger vers le tableau de bord CRM après une connexion réussie
        window.location.href = "crmDashboard.html";
    } catch (error) {
        document.getElementById("error-message").textContent = error.message;
    }
});

// Fonction pour appliquer le mode sombre
function applyDarkMode() {
    const isDarkModeEnabled = localStorage.getItem("darkMode") === "enabled";

    if (isDarkModeEnabled) {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
}
