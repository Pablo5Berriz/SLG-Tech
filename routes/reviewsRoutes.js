const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const reviewsFilePath = path.join(__dirname, '../data/avis.json');

// Charger les avis depuis le fichier JSON
function loadReviews() {
    try {
        if (!fs.existsSync(reviewsFilePath)) {
            // Si le fichier n'existe pas, créer un fichier vide
            fs.writeFileSync(reviewsFilePath, JSON.stringify([], null, 2), 'utf8');
        }
        const data = fs.readFileSync(reviewsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Erreur lors du chargement des avis :", err.message);
        return [];
    }
}

// Sauvegarder les avis dans le fichier JSON
function saveReviews(reviews) {
    try {
        fs.writeFileSync(reviewsFilePath, JSON.stringify(reviews, null, 2), 'utf8');
    } catch (err) {
        console.error("Erreur lors de la sauvegarde des avis :", err.message);
    }
}

// Récupérer tous les avis
router.get('/', (req, res) => {
    const reviews = loadReviews();
    res.status(200).json(reviews);
});

// Ajouter un nouvel avis
router.post('/', (req, res) => {
    const { nom, commentaire, note } = req.body;

    if (!nom || !commentaire || note === undefined || note < 1 || note > 5) {
        return res.status(400).json({ message: "Données d'avis invalides. Nom, commentaire et note (entre 1 et 5) sont requis." });
    }

    const reviews = loadReviews();
    const newReview = { id: Date.now(), nom, commentaire, note, approuvé: false };

    reviews.push(newReview);
    saveReviews(reviews);

    res.status(201).json({ message: "Avis ajouté avec succès.", review: newReview });
});

// Modifier un avis (par exemple, pour l'approuver ou le rejeter)
router.put('/:id', (req, res) => {
    const reviewId = parseInt(req.params.id, 10);
    const { approuvé } = req.body;

    if (approuvé === undefined) {
        return res.status(400).json({ message: "L'état 'approuvé' est requis." });
    }

    const reviews = loadReviews();
    const review = reviews.find(r => r.id === reviewId);

    if (!review) {
        return res.status(404).json({ message: "Avis non trouvé." });
    }

    review.approuvé = approuvé;
    saveReviews(reviews);

    res.status(200).json({ message: "Avis modifié avec succès.", review });
});

// Supprimer un avis
router.delete('/:id', (req, res) => {
    const reviewId = parseInt(req.params.id, 10);

    const reviews = loadReviews();
    const updatedReviews = reviews.filter(r => r.id !== reviewId);

    if (reviews.length === updatedReviews.length) {
        return res.status(404).json({ message: "Avis non trouvé." });
    }

    saveReviews(updatedReviews);
    res.status(200).json({ message: "Avis supprimé avec succès." });
});

module.exports = router;