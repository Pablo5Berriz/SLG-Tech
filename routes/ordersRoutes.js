const express = require('express');
const router = express.Router();
const loadData = require('../utils/dataLoader');
const path = require('path');

const commandesFilePath = path.join(__dirname, '../data/commandes.json');

// Middleware de vérification de session
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: "Accès non autorisé. Veuillez vous connecter." });
    }
    next();
}

// Route pour récupérer les commandes
router.get('/', requireAuth, (req, res) => {
    try {
        const commandes = loadData(commandesFilePath);
        res.status(200).json(commandes);
    } catch (error) {
        console.error("Erreur lors du chargement des commandes :", error.message);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

// Route pour les statistiques des ventes par catégorie
router.get('/statistics/sales-by-category', requireAuth, (req, res) => {
    try {
        const commandes = loadData(commandesFilePath);

        // Compter les ventes par catégorie
        const salesByCategory = commandes.reduce((acc, commande) => {
            commande.cart.forEach(item => {
                if (!acc[item.categorie]) {
                    acc[item.categorie] = 0;
                }
                acc[item.categorie] += item.quantite;
            });
            return acc;
        }, {});

        res.status(200).json(salesByCategory);
    } catch (error) {
        console.error("Erreur lors de la génération des statistiques de ventes :", error.message);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

module.exports = router;