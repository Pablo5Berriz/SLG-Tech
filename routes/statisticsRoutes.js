const express = require('express');
const router = express.Router();
const verifySession = require('../middleware/verifySession'); // Remplace verifyToken par verifySession
const loadData = require('../utils/dataLoader');

const path = require('path');
const commandesFilePath = path.join(__dirname, '../data/commandes.json');

// Route pour les statistiques des ventes par catégorie
router.get('/sales-by-category', verifySession, (req, res) => {
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