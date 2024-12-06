document.addEventListener("DOMContentLoaded", () => {
    const darkModeToggle = document.getElementById("dark-mode");
    const timezoneSelect = document.getElementById("timezone");
    const languageSelect = document.getElementById("language");

    // Traductions disponibles
    const translations = {
        fr: {
            title: "CRM - Paramètres",
            subtitle: "Gérez les configurations générales de votre CRM.",
            generalSettings: "Paramètres généraux",
            shopName: "Nom de la boutique :",
            email: "Email de contact :",
            phone: "Téléphone :",
            timezone: "Fuseau horaire :",
            language: "Langue :",
            saveChanges: "Enregistrer les modifications",
            darkMode: "Activer le mode sombre",
            notifications: "Notifications",
            emailNotifications: "Activer les notifications par email",
            smsNotifications: "Activer les notifications par SMS",
            saveNotifications: "Enregistrer les notifications",
            advancedSettings: "Configurations avancées",
            autoBackup: "Activer la sauvegarde automatique",
            backupNow: "Sauvegarder maintenant",
            restoreDefaults: "Restaurer les paramètres par défaut"
        },
        en: {
            title: "CRM - Settings",
            subtitle: "Manage your CRM's general settings.",
            generalSettings: "General Settings",
            shopName: "Shop Name:",
            email: "Contact Email:",
            phone: "Phone:",
            timezone: "Time Zone:",
            language: "Language:",
            saveChanges: "Save Changes",
            darkMode: "Enable Dark Mode",
            notifications: "Notifications",
            emailNotifications: "Enable Email Notifications",
            smsNotifications: "Enable SMS Notifications",
            saveNotifications: "Save Notifications",
            advancedSettings: "Advanced Settings",
            autoBackup: "Enable Auto Backup",
            backupNow: "Backup Now",
            restoreDefaults: "Restore Defaults"
        },
        es: {
            title: "CRM - Configuraciones",
            subtitle: "Administre las configuraciones generales de su CRM.",
            generalSettings: "Configuraciones Generales",
            shopName: "Nombre de la tienda:",
            email: "Correo de contacto:",
            phone: "Teléfono:",
            timezone: "Zona Horaria:",
            language: "Idioma:",
            saveChanges: "Guardar Cambios",
            darkMode: "Activar Modo Oscuro",
            notifications: "Notificaciones",
            emailNotifications: "Activar Notificaciones por Correo",
            smsNotifications: "Activar Notificaciones por SMS",
            saveNotifications: "Guardar Notificaciones",
            advancedSettings: "Configuraciones Avanzadas",
            autoBackup: "Activar Respaldo Automático",
            backupNow: "Hacer Respaldo",
            restoreDefaults: "Restaurar Configuraciones"
        }
    };

    // Charger les fuseaux horaires dynamiquement
    const timezones = Intl.supportedValuesOf("timeZone");
    timezones.forEach((tz) => {
        const option = document.createElement("option");
        option.value = tz;
        option.textContent = tz;
        timezoneSelect.appendChild(option);
    });

    // Charger les paramètres sauvegardés
    loadSettings();
    applyLanguage();

    // Sauvegarder les paramètres généraux
    document.getElementById("general-settings").addEventListener("submit", (e) => {
        e.preventDefault();
        const settings = {
            shopName: document.getElementById("shop-name").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            timezone: timezoneSelect.value,
            language: languageSelect.value
        };
        localStorage.setItem("crmSettings", JSON.stringify(settings));
        alert("Les paramètres ont été enregistrés !");
        applyLanguage(); // Appliquer la langue immédiatement
    });

    // Mode sombre
    darkModeToggle.addEventListener("change", () => {
        document.body.classList.toggle("dark-mode", darkModeToggle.checked);
        localStorage.setItem("darkMode", darkModeToggle.checked ? "enabled" : "disabled");
    });

    // Charger le mode sombre
    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark-mode");
        darkModeToggle.checked = true;
    }

    // Charger les paramètres sauvegardés
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem("crmSettings"));
        if (settings) {
            document.getElementById("shop-name").value = settings.shopName || "";
            document.getElementById("email").value = settings.email || "";
            document.getElementById("phone").value = settings.phone || "";
            timezoneSelect.value = settings.timezone || "";
            languageSelect.value = settings.language || "fr";
        }
    }

    // Appliquer la langue
    function applyLanguage() {
        const settings = JSON.parse(localStorage.getItem("crmSettings"));
        const language = settings?.language || "fr";
        const translation = translations[language];
    
        // Vérification et mise à jour des textes
        const title = document.querySelector("h1");
        if (title) title.textContent = translation.title;
    
        const subtitle = document.querySelector("p");
        if (subtitle) subtitle.textContent = translation.subtitle;
    
        // Paramètres généraux
        const shopNameLabel = document.querySelector("label[for='shop-name']");
        if (shopNameLabel) shopNameLabel.textContent = translation.shopName;
    
        const emailLabel = document.querySelector("label[for='email']");
        if (emailLabel) emailLabel.textContent = translation.email;
    
        const phoneLabel = document.querySelector("label[for='phone']");
        if (phoneLabel) phoneLabel.textContent = translation.phone;
    
        const timezoneLabel = document.querySelector("label[for='timezone']");
        if (timezoneLabel) timezoneLabel.textContent = translation.timezone;
    
        const languageLabel = document.querySelector("label[for='language']");
        if (languageLabel) languageLabel.textContent = translation.language;
    
        const saveChangesButton = document.querySelector("button[type='submit']");
        if (saveChangesButton) saveChangesButton.textContent = translation.saveChanges;
    
        // Mode sombre
        const darkModeHeading = document.querySelector("h2:nth-of-type(2)");
        if (darkModeHeading) darkModeHeading.textContent = translation.darkMode;
    
        // Notifications
        const notificationsHeading = document.querySelector("h2:nth-of-type(3)");
        if (notificationsHeading) notificationsHeading.textContent = translation.notifications;
    
        const emailNotificationsLabel = document.querySelector("label[for='email-notifications']");
        if (emailNotificationsLabel) emailNotificationsLabel.textContent = translation.emailNotifications;
    
        const smsNotificationsLabel = document.querySelector("label[for='sms-notifications']");
        if (smsNotificationsLabel) smsNotificationsLabel.textContent = translation.smsNotifications;
    
        const saveNotificationsButton = document.querySelector("#notification-settings button");
        if (saveNotificationsButton) saveNotificationsButton.textContent = translation.saveNotifications;
    
        // Configurations avancées
        const advancedSettingsHeading = document.querySelector("h2:nth-of-type(4)");
        if (advancedSettingsHeading) advancedSettingsHeading.textContent = translation.advancedSettings;
    
        const autoBackupLabel = document.querySelector("label[for='auto-backup']");
        if (autoBackupLabel) autoBackupLabel.textContent = translation.autoBackup;
    
        const backupNowButton = document.getElementById("backup-now");
        if (backupNowButton) backupNowButton.textContent = translation.backupNow;
    
        const restoreDefaultsButton = document.getElementById("restore-defaults");
        if (restoreDefaultsButton) restoreDefaultsButton.textContent = translation.restoreDefaults;
    }

    // Sauvegarde et restauration
    document.getElementById("backup-now").addEventListener("click", () => {
        alert("Sauvegarde effectuée avec succès !");
    });

    document.getElementById("restore-defaults").addEventListener("click", () => {
        if (confirm("Êtes-vous sûr de vouloir restaurer les paramètres par défaut ?")) {
            localStorage.removeItem("crmSettings");
            alert("Les paramètres ont été restaurés.");
            window.location.reload();
        }
    });
});