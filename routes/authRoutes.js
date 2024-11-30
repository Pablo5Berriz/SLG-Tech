const express = require('express');
const bcrypt = require('bcrypt'); // Utilisé pour sécuriser les mots de passe
const session = require('express-session');

const router = express.Router();

// Exemple de base de données fictive d'administrateurs
const admins = [
    {
        id: 1,
        username: 'admin',
        password: '$2b$10$Z7FfXIcBi.ZjL2P5uUoXZ.eYTPc8jGgCR0KlNLEhO/j07j08f9Ium', // Mot de passe hashé ("admin123")
        role: 'admin',
    },
];

// Configuration de la session (doit être ajouté dans votre fichier principal si ce n'est pas fait)
router.use(
    session({
        secret: 'votre_clé_secrète', // Remplacez par une clé plus sécurisée
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 3600000 }, // Durée de vie de la session : 1 heure
    })
);

// Endpoint de connexion
router.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    // Validation des champs
    if (!username || !password) {
        return res.status(400).json({ message: "Nom d'utilisateur et mot de passe requis." });
    }

    // Recherche de l'utilisateur
    const user = admins.find((admin) => admin.username === username);
    if (!user) {
        return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect." });
    }

    // Vérification du mot de passe
    const passwordValid = await bcrypt.compare(password, user.password); // Utilisez bcrypt pour comparer
    if (!passwordValid) {
        return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect." });
    }

    // Création de la session
    req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
    };

    res.status(200).json({ message: "Connexion réussie." });
});


// Endpoint de vérification de session
router.get('/api/session-check', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ message: "Session expirée." });
    }
    res.status(200).json({ message: "Session active." });
});


// Endpoint de déconnexion
router.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erreur lors de la déconnexion :', err.message);
            return res.status(500).json({ message: 'Erreur lors de la déconnexion.' });
        }
        res.status(200).json({ message: 'Déconnexion réussie.' });
    });
});

// Middleware pour protéger les routes (à utiliser si nécessaire)
const verifySession = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ message: "Accès non autorisé. Veuillez vous connecter." });
    }
    next();
};

module.exports = { router, verifySession };