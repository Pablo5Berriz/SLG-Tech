const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const commandesFilePath = path.join(__dirname, '../data/commandes.json');
const categoriesFilePath = path.join(__dirname, '../data/categories.json');
// Middleware pour vérifier la session
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: "Accès non autorisé. Veuillez vous connecter." });
    }
    next();
}

// Récupérer toutes les catégories
router.get('/', requireAuth, (req, res) => {
    fs.readFile(categoriesFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Erreur lors de la lecture du fichier categories.json :", err.message);
            return res.status(500).json({ message: "Erreur serveur." });
        }
        const categories = JSON.parse(data);
        res.status(200).json(categories);
    });
});


// Route pour les catégories populaires
router.get('/popular', (req, res) => {
    try {
        const commandes = JSON.parse(fs.readFileSync(commandesFilePath, 'utf8'));

        // Compter les ventes par catégorie
        const categorySales = commandes.reduce((acc, commande) => {
            commande.cart.forEach(item => {
                if (!acc[item.categorie]) {
                    acc[item.categorie] = 0;
                }
                acc[item.categorie] += item.quantite;
            });
            return acc;
        }, {});

        // Trier les catégories par popularité
        const sortedCategories = Object.entries(categorySales)
            .sort(([, a], [, b]) => b - a)
            .map(([categorie, quantite]) => ({ categorie, quantite }));

        res.status(200).json(sortedCategories.slice(0, 5)); // Retourner les 5 catégories les plus populaires
    } catch (error) {
        console.error('Erreur lors du chargement des catégories populaires :', error.message);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});


// Ajouter une nouvelle catégorie
router.post('/', requireAuth, (req, res) => {
    const { nom } = req.body;
    if (!nom) return res.status(400).json({ message: "Le nom de la catégorie est obligatoire." });

    fs.readFile(categoriesFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: "Erreur interne du serveur" });

        const categories = JSON.parse(data);
        const newCategory = { id: Date.now(), nom };
        categories.push(newCategory);

        fs.writeFile(categoriesFilePath, JSON.stringify(categories, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).json({ message: "Erreur lors de l'ajout de la catégorie." });
            res.status(201).json({ message: "Catégorie ajoutée avec succès.", category: newCategory });
        });
    });
});

// Modifier une catégorie
router.put('/:id', requireAuth, (req, res) => {
    const categoryId = parseInt(req.params.id, 10);
    const { nom } = req.body;

    if (!nom) return res.status(400).json({ message: "Le nom de la catégorie est obligatoire." });

    fs.readFile(categoriesFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: "Erreur interne du serveur" });

        const categories = JSON.parse(data);
        const category = categories.find(cat => cat.id === categoryId);

        if (!category) return res.status(404).json({ message: "Catégorie non trouvée." });

        category.nom = nom;

        fs.writeFile(categoriesFilePath, JSON.stringify(categories, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).json({ message: "Erreur lors de la modification de la catégorie." });
            res.status(200).json({ message: "Catégorie modifiée avec succès.", category });
        });
    });
});

// Supprimer une catégorie
router.delete('/:id', requireAuth, (req, res) => {
    const categoryId = parseInt(req.params.id, 10);

    fs.readFile(categoriesFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: "Erreur interne du serveur" });

        const categories = JSON.parse(data);
        const updatedCategories = categories.filter(cat => cat.id !== categoryId);

        if (categories.length === updatedCategories.length) {
            return res.status(404).json({ message: "Catégorie non trouvée." });
        }

        fs.writeFile(categoriesFilePath, JSON.stringify(updatedCategories, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).json({ message: "Erreur lors de la suppression de la catégorie." });
            res.status(200).json({ message: "Catégorie supprimée avec succès." });
        });
    });
});

module.exports = router;