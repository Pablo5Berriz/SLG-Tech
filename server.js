const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser'); // Nécessaire pour parser les requêtes POST
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialisation du panier
let cart = [];

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/images', express.static(path.join(__dirname, 'images')));

const clientsFilePath = path.join(__dirname, 'clients.json');

const commandesFilePath = path.join(__dirname, 'commandes.json');

const cartesFilePath = path.join(__dirname, 'data/cartes.json');

// Récupérer les catégories
app.get('/api/categories', (req, res) => {
    fs.readFile('./data/categories.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send("Erreur lors de la lecture des données de catégories.");
        res.json(JSON.parse(data));
    });
});


// Récupérer les produits
app.get('/api/produits', (req, res) => {
    fs.readFile('./data/produits.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send("Erreur lors de la lecture des données de produits.");
        res.json(JSON.parse(data));
    });
});


// Récupérer les avis
app.get('/api/avis', (req, res) => {
    fs.readFile('./data/avis.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send("Erreur lors de la lecture des données des avis.");
        res.json(JSON.parse(data));
    });
});


// Récupérer les partenaires
app.get('/api/partenaires', (req, res) => {
    fs.readFile('./data/partenaires.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send("Erreur lors de la lecture des données des partenaires.");
        res.json(JSON.parse(data));
    });
});


// API pour le panier

// Récupérer les produits du panier
app.get('/cart', (req, res) => {
    res.status(200).json(cart);
});

// Ajouter un produit au panier
app.post('/cart', (req, res) => {
    const produit = req.body;

    if (!produit || !produit.id || !produit.nom || produit.quantite === undefined) {
        return res.status(400).json({ message: "Données de produit invalides." });
    }

    const existingProduit = cart.find(item => item.id === produit.id);

    if (existingProduit) {
        existingProduit.quantite += produit.quantite;
    } else {
        cart.push({ ...produit, quantite: produit.quantite });
    }

    res.status(200).json({ message: 'Produit ajouté au panier', cart });
});

app.get('/cart', (req, res) => {
    res.status(200).json(cart);
});

// Supprimer un produit du panier
app.delete('/cart/:id', (req, res) => {
    const produitId = parseInt(req.params.id, 10);

    if (isNaN(produitId)) {
        return res.status(400).json({ message: 'ID de produit invalide.' });
    }

    cart = cart.filter(item => item.id !== produitId);
    res.status(200).json({ message: 'Produit supprimé', cart });
});


// Vider le panier
app.delete('/cart', (req, res) => {
    cart = [];
    res.status(200).json({ message: 'Panier vidé', cart });
});



// Charger les clients depuis le fichier JSON
function loadClients() {
    try {
        if (!fs.existsSync(clientsFilePath)) {
            // Si le fichier n'existe pas, le créer avec un tableau vide
            fs.writeFileSync(clientsFilePath, JSON.stringify([], null, 2), 'utf8');
        }
        const data = fs.readFileSync(clientsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Erreur lors du chargement du fichier clients.json:', err);
        return [];
    }
}


// Endpoint pour créer un compte client
app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }

    const clients = loadClients();
    const existingClient = clients.find(client => client.email === email);

    if (existingClient) {
        return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newClient = { id: Date.now(), name, email, password: hashedPassword, isLoggedIn: false };
        clients.push(newClient);

        saveClients(clients);

        res.status(201).json({ message: 'Compte créé avec succès.', client: { name, email } });
    } catch (error) {
        console.error('Erreur lors de l\'inscription :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});


// Endpoint pour la connexion
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe sont obligatoires.' });
    }

    // Valider le format de l'email
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ message: 'Adresse email invalide.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit comporter au moins 6 caractères.' });
    }

    try {
        const clients = loadClients();
        const client = clients.find(client => client.email === email);

        if (!client) {
            return res.status(401).json({ message: 'Identifiants invalides.' });
        }

        // Vérification du mot de passe (si haché)
        const isPasswordValid = await bcrypt.compare(password, client.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Identifiants invalides.' });
        }

        // Réponse en cas de succès
        res.status(200).json({
            name: client.name,
            email: client.email,
        });
    } catch (error) {
        console.error('Erreur serveur lors de la connexion :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});


// Endpoint pour demander une réinitialisation de mot de passe
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'L\'email est obligatoire.' });
    }

    const clients = loadClients();
    const client = clients.find(client => client.email === email);

    if (!client) {
        return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000;

    client.resetToken = resetToken;
    client.resetTokenExpiry = resetTokenExpiry;

    saveClients(clients);

    res.status(200).json({
        message: 'Un email avec un lien de réinitialisation de mot de passe a été envoyé.',
        resetToken
    });
});


// Endpoint pour réinitialiser le mot de passe
app.post('/api/reset-password', (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Le token et le nouveau mot de passe sont obligatoires.' });
    }

    const clients = loadClients();
    const client = clients.find(
        client => client.resetToken === token && client.resetTokenExpiry > Date.now()
    );

    if (!client) {
        return res.status(400).json({ message: 'Token invalide ou expiré.' });
    }

    client.password = newPassword;
    client.resetToken = null;
    client.resetTokenExpiry = null;

    saveClients(clients);

    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.' });
});


// Endpoint pour changer le mot de passe
app.post('/api/change-password', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email et nouveau mot de passe requis.' });
    }

    const clients = loadClients();
    const client = clients.find(client => client.email === email);
    if (!client) {
        return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    client.password = password;
    saveClients(clients);

    res.status(200).json({ message: 'Mot de passe mis à jour avec succès.' });
});


// Endpoint pour supprimer un compte
app.delete('/api/delete-account/:email', (req, res) => {
    const { email } = req.params;
    const clients = loadClients();
    const updatedClients = clients.filter(client => client.email !== email);

    if (clients.length === updatedClients.length) {
        return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    saveClients(updatedClients);
    res.status(200).json({ message: 'Compte supprimé avec succès.' });
});


// Sauvegarder les clients dans le fichier JSON
function saveClients(clients) {
    try {
        fs.writeFileSync(clientsFilePath, JSON.stringify(clients, null, 2), 'utf8');
    } catch (err) {
        console.error('Erreur lors de la sauvegarde dans le fichier clients.json:', err);
    }
}


// Endpoint pour récupérer tous les clients (pour le debug)
app.get('/api/clients', (req, res) => {
    const clients = loadClients();
    res.json(clients);
});


// Endpoint pour récupérer un client spécifique
app.get('/api/clients/:email', (req, res) => {
    const { email } = req.params;
    const clients = loadClients();
    const client = clients.find(client => client.email === email);

    if (!client) {
        return res.status(404).json({ message: 'Client non trouvé.' });
    }

    res.status(200).json(client);
});


// Endpoint pour récupérer les informations du client connecté
app.get('/api/profile', (req, res) => {
    const { email } = req.query; // L'email est utilisé comme identifiant unique

    if (!email) {
        return res.status(400).json({ message: "L'email est requis pour récupérer le profil." });
    }

    const clients = loadClients();
    const client = clients.find(c => c.email === email);

    if (!client) {
        return res.status(404).json({ message: "Client non trouvé." });
    }

    res.status(200).json(client);
});


// Endpoint pour mettre à jour les informations utilisateur
app.put('/api/profile', (req, res) => {
    const { email } = req.query;
    const { name, phone, address } = req.body;

    if (!email) {
        return res.status(400).json({ message: "L'email est requis pour mettre à jour le profil." });
    }

    const clients = loadClients();
    const client = clients.find(c => c.email === email);

    if (!client) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Mettre à jour les informations
    if (name) client.name = name;
    if (phone) client.phone = phone;
    if (address) client.address = address;

    saveClients(clients);

    res.status(200).json({ message: "Profil mis à jour avec succès.", client });
});


// Charger les commandes
function loadCommandes() {
    try {
        const data = fs.readFileSync(commandesFilePath, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// Sauvegarder les commandes d'un utilisateur
function saveCommandes(commandes) {
    fs.writeFileSync(commandesFilePath, JSON.stringify(commandes, null, 2));
}

// Endpoint pour récupérer les commandes
app.get('/api/commandes/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const commandes = loadCommandes().filter(commande => commande.user_id === userId);

    if (commandes.length === 0) {
        return res.status(404).json({ message: 'Aucune commande trouvée pour cet utilisateur.' });
    }

    res.status(200).json(commandes);
});

// Endpoint pour annuler une commande
app.delete('/api/commandes/:id', (req, res) => {
    const commandes = loadCommandes();
    const updatedCommandes = commandes.filter(order => order.id !== parseInt(req.params.id, 10));

    if (updatedCommandes.length === commandes.length) {
        return res.status(404).json({ message: "Commande non trouvée." });
    }

    saveCommandes(updatedCommandes);
    res.status(200).json({ message: "Commande annulée avec succès." });
});


// Charger les cartes depuis le fichier JSON
function loadCartes() {
    try {
        const data = fs.readFileSync(cartesFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Erreur lors du chargement des cartes :', err);
        return [];
    }
}

// Endpoint pour récupérer les cartes d'un utilisateur
app.get('/api/cartes/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const cartes = loadCartes().filter(carte => carte.user_id === userId);

    if (cartes.length === 0) {
        return res.status(404).json({ message: 'Aucune carte trouvée pour cet utilisateur.' });
    }

    res.status(200).json(cartes);
});

const stripe = require('stripe')('sk_test_51QP8bAP6GGtLgXluEnpTPjbUzWRkWZOGZT7Blm7XmaBQKWp9uLgSBMO9JunsTWDbKgs8PN7EGP2iIaAGjsrqpEwV006cksNLvk');

// Ajouter une carte
app.post('/api/cartes', async (req, res) => {
    const { userId, nom_sur_la_carte, numero, exp_month, exp_year } = req.body;

    if (!userId || !nom_sur_la_carte || !numero || !exp_month || !exp_year) {
        return res.status(400).json({ message: 'Toutes les informations sont obligatoires.' });
    }

    try {
        // Créer un token avec Stripe
        const token = await stripe.tokens.create({
            card: {
                number: numero,
                exp_month: exp_month,
                exp_year: exp_year,
                name: nom_sur_la_carte
            }
        });

        // Ajouter la carte au fichier JSON
        const cartes = loadCartes();
        const nouvelleCarte = {
            id: Date.now(),
            user_id: userId,
            nom_sur_la_carte,
            numero_tronque: `**** **** **** ${numero.slice(-4)}`,
            date_expiration: `${exp_month}/${exp_year}`,
            token: token.id
        };

        cartes.push(nouvelleCarte);
        fs.writeFileSync(cartesFilePath, JSON.stringify(cartes, null, 2), 'utf8');

        res.status(201).json({ message: 'Carte ajoutée avec succès.', carte: nouvelleCarte });
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la carte :', error);
        res.status(500).json({ message: 'Erreur interne.' });
    }
});

// Supprimer une carte par ID
app.delete('/api/cartes/:id', (req, res) => {
    const carteId = parseInt(req.params.id, 10);

    if (isNaN(carteId)) {
        return res.status(400).json({ message: 'ID invalide.' });
    }

    const cartes = loadCartes();
    const updatedCartes = cartes.filter(carte => carte.id !== carteId);

    if (cartes.length === updatedCartes.length) {
        return res.status(404).json({ message: 'Carte non trouvée.' });
    }

    fs.writeFileSync(cartesFilePath, JSON.stringify(updatedCartes, null, 2), 'utf8');
    res.status(200).json({ message: 'Carte supprimée avec succès.' });
});


// Endpoint pour récupérer un produit
app.post('/api/commandes/:id/retrieve', (req, res) => {
    const commandes = loadCommandes();
    const order = commandes.find(order => order.id === parseInt(req.params.id, 10));

    if (!order) {
        return res.status(404).json({ message: "Commande non trouvée." });
    }

    order.status = "Récupéré";
    saveCommandes(commandes);
    res.status(200).json({ message: "Commande marquée comme récupérée." });
});


// Middleware pour gérer les erreurs globales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`SLG Tech API en écoute sur http://localhost:${port}`);
});
