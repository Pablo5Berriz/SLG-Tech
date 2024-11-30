const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Déclaration correcte de produitsFilePath
const productsFilePath = path.join(__dirname, '../data/produits.json');


// Middleware pour vérifier la session
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: "Accès non autorisé. Veuillez vous connecter." });
    }
    next();
}

// Charger les produits
router.get('/', (req, res) => {
    try {
        const produits = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));
        res.status(200).json(produits);
    } catch (error) {
        console.error('Erreur lors de la lecture des produits :', error.message);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

// Route pour récupérer les produits populaires
router.get('/popular', (req, res) => {
    try {
        const commandes = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/commandes.json'), 'utf8'));

        // Comptez les ventes par produit
        const productSales = commandes.reduce((acc, commande) => {
            commande.cart.forEach(item => {
                if (!acc[item.id]) {
                    acc[item.id] = {
                        id: item.id,
                        nom: item.nom,
                        quantite: 0
                    };
                }
                acc[item.id].quantite += item.quantite;
            });
            return acc;
        }, {});

        // Trier les produits par popularité
        const sortedProducts = Object.values(productSales).sort((a, b) => b.quantite - a.quantite);

        res.status(200).json(sortedProducts.slice(0, 5)); // Retourner les 5 produits les plus populaires
    } catch (error) {
        console.error('Erreur lors du chargement des produits populaires :', error.message);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

// Mettre à jour le stock
router.put('/:id/stock', requireAuth, (req, res) => {
    const productId = parseInt(req.params.id, 10);
    const { quantiteAchetee } = req.body;

    if (isNaN(productId) || !quantiteAchetee || quantiteAchetee <= 0) {
        return res.status(400).json({ message: 'Données invalides pour la mise à jour du stock.' });
    }

    try {
        const products = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));
        const product = products.find(p => p.id === productId);

        if (!product) {
            return res.status(404).json({ message: 'Produit non trouvé.' });
        }

        if (product.stock < quantiteAchetee) {
            return res.status(400).json({ message: 'Stock insuffisant.' });
        }

        product.stock -= quantiteAchetee;
        fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2), 'utf8');
        res.status(200).json({ message: 'Stock mis à jour avec succès.', product });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du stock :', error.message);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

module.exports = router;