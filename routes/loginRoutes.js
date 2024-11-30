const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Chemin vers le fichier clients.json
const clientsFilePath = path.join(__dirname, '../data/clients.json');

// Fonction pour charger les clients
function loadClients() {
    try {
        const data = fs.readFileSync(clientsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors du chargement des clients :', error.message);
        return [];
    }
}

// Route de connexion
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    const clients = loadClients(); // Charger les clients depuis clients.json
    const client = clients.find((c) => c.email === email);

    if (!client) {
        return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    // Vérifier si le mot de passe correspond
    const isPasswordValid = await bcrypt.compare(password, client.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    // Enregistrer l'utilisateur dans la session
    req.session.user = {
        id: client.id,
        email: client.email,
        name: client.name,
        role: 'admin', // Ajout d'un rôle si nécessaire
    };

    res.status(200).json({ message: 'Connexion réussie.' });
});

// Route de déconnexion
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la déconnexion.' });
        }
        res.status(200).json({ message: 'Déconnexion réussie.' });
    });
});

// Middleware pour protéger les routes
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Accès non autorisé. Veuillez vous connecter.' });
    }
    next();
}

// Route pour vérifier l'état de la session
router.get('/session-status', (req, res) => {
    if (req.session.user) {
        res.status(200).json({ isLoggedIn: true, user: req.session.user });
    } else {
        res.status(401).json({ isLoggedIn: false });
    }
});

module.exports = router;