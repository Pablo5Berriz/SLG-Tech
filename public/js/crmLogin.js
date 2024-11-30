document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error("Email ou mot de passe incorrect.");
        }

        window.location.href = "crmDashboard.html"; // Redirige vers le tableau de bord
    } catch (error) {
        alert(error.message);
    }
});