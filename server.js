const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');

// Importation des routes
const categoriesRoutes = require('./routes/categoriesRoutes');
const productsRoutes = require('./routes/productsRoutes');
const clientsRoutes = require('./routes/clientsRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const reviewsRoutes = require('./routes/reviewsRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

const verifySession = require("./middleware/verifySession");

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/Images', express.static(path.join(__dirname, 'Images')));
app.use(
    session({
        secret: 'votre_clé_secrète', // Remplacez par une clé sécurisée
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 3600000 }, // 1 heure
    })
);

// Authentification pour les routes protégées
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: "Accès non autorisé. Veuillez vous connecter." });
    }
    next();
}

// Utilisation des routes
app.use('/crm/categories', requireAuth, categoriesRoutes);
app.use('/crm/produits', productsRoutes);
app.use('/crm/clients', requireAuth, clientsRoutes);
app.use('/crm/commandes', requireAuth, ordersRoutes);
app.use('/crm/avis', requireAuth, reviewsRoutes);
app.use('/crm/statistics', requireAuth, statisticsRoutes);
app.use("/crm", verifySession);

// Endpoint de connexion
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    // Charger les clients
    const clients = loadClients(); // Charger les données depuis le fichier clients.json
    const client = clients.find((c) => c.email === email);

    if (!client) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    // Vérification du mot de passe
    bcrypt.compare(password, client.password, (err, isMatch) => {
        if (err || !isMatch) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect." });
        }

        // Enregistrer les informations utilisateur dans la session
        req.session.user = { id: client.id, email: client.email, name: client.name };
        res.status(200).json({ message: "Connexion réussie." });
    });
});

// Route pour la page d'accueil
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Récupérer les catégories
app.get('/api/categories', (req, res) => {
    fs.readFile('./data/categories.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send("Erreur lors de la lecture des données de catégories.");
        res.json(JSON.parse(data));
    });
});

// Route de déconnexion
app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Erreur lors de la déconnexion." });
        }
        res.status(200).json({ message: "Déconnexion réussie." });
    });
});

// Exemple de route protégée
app.get('/crm/dashboard', requireAuth, (req, res) => {
    res.status(200).json({
        message: `Bienvenue ${req.session.user.name} sur le tableau de bord CRM.`,
    });
});

// Charger les données clients depuis clients.json
function loadClients() {
    try {
        const data = fs.readFileSync('./data/clients.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Erreur lors du chargement des clients :", err);
        return [];
    }
}

// Vérification de la session utilisateur
app.get('/api/session-check', (req, res) => {
    if (req.session && req.session.user) {
        return res.status(200).json({ message: 'Session valide.', user: req.session.user });
    }
    return res.status(401).json({ message: 'Session expirée.' });
});

// Chemins vers les fichiers JSON
const clientsFilePath = path.join(__dirname, 'data/clients.json');
const commandesFilePath = path.join(__dirname, 'data/commandes.json');
const cartesFilePath = path.join(__dirname, 'data/cartes.json');



// Route pour créer un compte administrateur
app.post("/api/create-admin", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Tous les champs sont obligatoires." });
    }

    const clients = loadClients();

    // Vérifier si l'email existe déjà
    const existingClient = clients.find((client) => client.email === email);
    if (existingClient) {
        return res.status(409).json({ message: "Cet email est déjà utilisé." });
    }

    try {
        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer le compte administrateur
        const newAdmin = {
            id: Date.now(),
            name,
            email,
            password: hashedPassword,
            role: "admin",
            isLoggedIn: false,
        };

        clients.push(newAdmin);
        saveClients(clients);

        res.status(201).json({ message: "Compte administrateur créé avec succès.", admin: { name, email } });
    } catch (err) {
        console.error("Erreur lors de la création de l'administrateur :", err);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});



// Charger les catégories
app.get('/api/categories', (req, res) => {
    fs.readFile('./data/categories.json', 'utf8', (err, data) => {
        if (err) {
            console.error("Erreur lors de la lecture des catégories :", err.message);
            return res.status(500).json({ message: "Erreur interne du serveur" });
        }
        try {
            const categories = JSON.parse(data);
            res.status(200).json(categories);
        } catch (error) {
            console.error("Erreur lors du parsing des catégories :", error.message);
            res.status(500).json({ message: "Erreur de format des données" });
        }
    });
});

// Charger les produits
app.get('/api/produits', (req, res) => {
    fs.readFile('./data/produits.json', 'utf8', (err, data) => {
        if (err) {
            console.error("Erreur lors de la lecture des produits :", err.message);
            return res.status(500).json({ message: "Erreur interne du serveur" });
        }
        try {
            const produits = JSON.parse(data);
            res.status(200).json(produits);
        } catch (error) {
            console.error("Erreur lors du parsing des produits :", error.message);
            res.status(500).json({ message: "Erreur de format des données" });
        }
    });
});


// Endpoint pour mettre à jour le stock des produits
app.put('/api/produits/:id/stock', (req, res) => {
    const produitId = parseInt(req.params.id, 10);
    const { quantiteAchetee } = req.body;

    if (isNaN(produitId) || !quantiteAchetee || quantiteAchetee <= 0) {
        return res.status(400).json({ message: 'Données invalides pour la mise à jour du stock.' });
    }

    fs.readFile('./data/produits.json', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ message: "Erreur lors de la lecture des produits." });

        const produits = JSON.parse(data);
        const produit = produits.find(p => p.id === produitId);

        if (!produit) {
            return res.status(404).json({ message: "Produit non trouvé." });
        }

        if (produit.stock < quantiteAchetee) {
            return res.status(400).json({ message: "Stock insuffisant pour cette commande." });
        }

        produit.stock -= quantiteAchetee;

        fs.writeFile('./data/produits.json', JSON.stringify(produits, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).json({ message: "Erreur lors de la sauvegarde des produits." });

            res.status(200).json({ message: "Stock mis à jour avec succès.", produit });
        });
    });
});


app.get('/api/avis', (req, res) => {
    fs.readFile('./data/avis.json', 'utf8', (err, data) => {
        if (err) {
            console.error("Erreur lors de la lecture des avis :", err.message);
            return res.status(500).json({ message: "Erreur interne du serveur" });
        }
        res.status(200).json(JSON.parse(data));
    });
});


// Récupérer les partenaires
app.get('/api/partenaires', (req, res) => {
    fs.readFile('./data/partenaires.json', 'utf8', (err, data) => {
        if (err) {
            console.error("Erreur lors de la lecture des partenaires :", err.message);
            return res.status(500).json({ message: "Erreur interne du serveur" });
        }
        res.status(200).json(JSON.parse(data));
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

    // Validation des données du produit
    if (!produit || !produit.id || !produit.nom || produit.quantite === undefined || isNaN(produit.quantite)) {
        return res.status(400).json({ message: "Données de produit invalides." });
    }

    produit.quantite = parseInt(produit.quantite, 10); // Convertir en entier

    const existingProduit = cart.find(item => item.id === produit.id);

    if (existingProduit) {
        existingProduit.quantite += produit.quantite;
    } else {
        cart.push({ ...produit, quantite: produit.quantite });
    }

    res.status(200).json({ message: 'Produit ajouté au panier', cart });
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


// Endpoint pour mettre à jour l'adresse' utilisateur
app.put('/api/clients/:email', (req, res) => {
    const { email } = req.params;
    const { address } = req.body;

    if (!address || !address.address || !address.city || !address.postalCode) {
        return res.status(400).json({ message: 'Adresse invalide.' });
    }

    const clients = loadClients();
    const client = clients.find(c => c.email === email);

    if (!client) {
        return res.status(404).json({ message: 'Client non trouvé.' });
    }

    client.address = address; // Mettre à jour l'adresse
    saveClients(clients);

    res.status(200).json(client); // Retourner les données mises à jour
});


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

        const isPasswordValid = await bcrypt.compare(password, client.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Identifiants invalides.' });
        }

        // Retourner userId et les autres informations nécessaires
        res.status(200).json({
            id: client.id, // Ajout du userId
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
app.delete('/api/clients/:email', (req, res) => {
    const { email } = req.params;

    if (!email) {
        console.error("Aucun email fourni pour la suppression.");
        return res.status(400).json({ message: "L'email est requis pour supprimer un compte." });
    }

    const clients = loadClients();
    const updatedClients = clients.filter(client => client.email !== email);

    if (clients.length === updatedClients.length) {
        console.error(`Utilisateur avec l'email ${email} non trouvé.`);
        return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    try {
        saveClients(updatedClients);
        console.log(`Compte avec l'email ${email} supprimé avec succès.`);
        res.status(200).json({ message: 'Compte supprimé avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des clients :', error.message);
        res.status(500).json({ message: 'Erreur interne lors de la suppression du compte.' });
    }
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
app.get('/api/clients/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10); // Convertir en entier
    console.log('Requête pour userId:', userId);

    const clients = loadClients(); // Charger les clients
    const client = clients.find(client => client.id === userId); // Trouver le client par userId

    if (!client) {
        console.log('Client non trouvé pour cet userId:', userId);
        return res.status(404).json({ message: 'Client non trouvé.' });
    }

    res.status(200).json(client); // Retourner les informations du client
});


// Endpoint pour récupérer les informations du client connecté
app.get('/api/profile', (req, res) => {
    const { userId } = req.query; // Récupérer userId depuis la requête

    console.log("Requête reçue pour le profil :", userId);

    if (!userId) {
        return res.status(400).json({ message: "L'ID utilisateur est requis pour récupérer le profil." });
    }

    const clients = loadClients();
    const client = clients.find(c => c.id === parseInt(userId, 10)); // Comparer avec l'ID utilisateur

    if (!client) {
        console.log("Client non trouvé pour cet ID :", userId);
        return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    res.status(200).json(client);
});


// Endpoint pour mettre à jour les informations utilisateur
app.put('/api/profile', (req, res) => {
    const { userId } = req.query; // Assurez-vous que c'est bien userId ici
    const { name, phone, address } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "L'ID utilisateur est requis pour mettre à jour le profil." });
    }

    const clients = loadClients();
    const client = clients.find(c => c.id === parseInt(userId, 10)); // Vérifiez que id est utilisé correctement

    if (!client) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Validation de l'adresse
    if (address && (!address.address || !address.city || !address.postalCode)) {
        return res.status(400).json({ message: "Adresse invalide. Tous les champs sont obligatoires." });
    }

    // Mettre à jour les informations
    if (name) client.name = name;
    if (phone) client.phone = phone;
    if (address) {
        client.address = {
            address: address.address,
            city: address.city,
            postalCode: address.postalCode,
        };
    }

    saveClients(clients); // Sauvegarder les modifications

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
    console.log('Requête reçue pour commandes, userId :', userId); // Log pour débogage

    if (isNaN(userId)) {
        console.error('ID utilisateur invalide :', req.params.userId);
        return res.status(400).json({ message: 'ID utilisateur invalide.' });
    }

    const commandes = loadCommandes();
    console.log('Commandes chargées :', commandes); // Log des données chargées

    const userCommandes = commandes.filter(commande => commande.user_id === userId);
    console.log('Commandes pour userId :', userId, userCommandes); // Log des commandes trouvées

    if (userCommandes.length === 0) {
        console.error('Aucune commande trouvée pour userId :', userId);
        return res.status(404).json({ message: 'Aucune commande trouvée pour cet utilisateur.' });
    }

    res.status(200).json(userCommandes);
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


// Endpoint pour ajouter une nouvelle commande
app.post('/api/commandes', (req, res) => {
    const { userId, orderNumber, cart, total, paymentMethod, deliveryAddress } = req.body;

    if (!userId || !orderNumber || !cart || !total || !paymentMethod || !deliveryAddress) {
        return res.status(400).json({ message: 'Toutes les informations sont obligatoires.' });
    }

    const commandes = loadCommandes();

    const newOrder = {
        id: Date.now(),
        user_id: userId, // Associer la commande au userId
        orderNumber,
        cart,
        total,
        paymentMethod,
        deliveryAddress,
        date: new Date().toISOString(),
    };

    commandes.push(newOrder);
    fs.writeFileSync(commandesFilePath, JSON.stringify(commandes, null, 2), 'utf8');

    res.status(201).json({ message: 'Commande ajoutée avec succès.', commande: newOrder });
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


/// Endpoint pour récupérer les cartes d'un utilisateur
app.get('/api/cartes/:userId', (req, res) => {
    const userId = parseInt(req.params.userId, 10); // Convertir en entier

    if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID utilisateur invalide.' });
    }

    const cartes = loadCartes().filter(carte => carte.user_id === userId); // Filtrer les cartes par userId

    if (cartes.length === 0) {
        return res.status(404).json({ message: 'Aucune carte trouvée pour cet utilisateur.' });
    }

    res.status(200).json(cartes); // Retourner les cartes
});


// Endpoint pour ajouter une nouvelle carte
app.post('/api/cartes', (req, res) => {
    const { userId, cardHolder, cardNumber, expiryDate, isDefault } = req.body;

    if (!userId || !cardHolder || !cardNumber || !expiryDate) {
        return res.status(400).json({ message: 'Toutes les informations sont obligatoires.' });
    }

    const cartes = loadCartes();

    if (isDefault) {
        // Marquer toutes les cartes existantes de cet utilisateur comme non par défaut
        cartes.forEach(carte => {
            if (carte.user_id === userId) carte.isDefault = false;
        });
    }

    const newCard = {
        id: Date.now(),
        user_id: userId,
        cardHolder,
        cardNumber,
        expiryDate,
        isDefault,
    };

    cartes.push(newCard);
    fs.writeFileSync(cartesFilePath, JSON.stringify(cartes, null, 2), 'utf8');

    res.status(201).json({ message: 'Carte ajoutée avec succès.', carte: newCard });
});


// Supprimer une carte par ID
app.delete('/api/cartes/:id', (req, res) => {
    const carteId = parseInt(req.params.id, 10);

    if (isNaN(carteId)) {
        return res.status(400).json({ message: 'ID invalide.' });
    }

    const cartes = loadCartes();
    const updatedCartes = cartes.filter(carte => carte.id !== carteId); // Filtrer les cartes par ID

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
app.listen(PORT, () => {
    console.log(`SLG Tech API en écoute sur http://localhost:${PORT}`);
});
