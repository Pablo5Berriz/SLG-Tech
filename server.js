require('dotenv').config(); // Charge les variables d'environnement

const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const nodemailer = require("nodemailer");
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Validation des variables d'environnement
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Les variables d'environnement EMAIL_USER et EMAIL_PASS sont requises.");
    process.exit(1);
}

// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

transporter.verify((error, success) => {
    if (error) {
        console.error("Erreur de configuration de Nodemailer :", error);
    } else {
        console.log("Transporteur prêt à envoyer des emails.");
    }
});

// Importation des middlewares
const verifySession = require('./middleware/verifySession');

// Stockage des paniers en mémoire
let carts = {};

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/Images', express.static(path.join(__dirname, 'Images')));
app.use(
    session({
        secret: 'votre_clé_secrète', // Clé secrète pour signer la session
        resave: false, // Évite de sauvegarder la session si elle n'a pas changé
        saveUninitialized: false, // N'enregistre pas une session vide
        cookie: {
            httpOnly: true, // Rend les cookies accessibles uniquement via HTTP (et non via JavaScript)
            secure: false, // Passez à true si vous utilisez HTTPS
            maxAge: 3600000, // 1 heure
        },
    })
);

// Importation des routes
const categoriesRoutes = require('./routes/categoriesRoutes');
const productsRoutes = require('./routes/productsRoutes');
const clientsRoutes = require('./routes/clientsRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const reviewsRoutes = require('./routes/reviewsRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');


// Utilisation des routes
app.use('/api/categories', categoriesRoutes);
app.use('/api/produits', productsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/commandes', ordersRoutes);
app.use('/api/avis', reviewsRoutes);


// Middleware pour vérifier les administrateurs
function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(401).json({ message: "Accès non autorisé. Administrateurs uniquement." });
    }
    next();
}

// Utilisation des routes du CRM
app.use('/crm/categories', requireAuth, categoriesRoutes);
app.use('/crm/produits', productsRoutes);
app.use('/crm/clients', requireAuth, clientsRoutes);
app.use('/crm/commandes', requireAuth, ordersRoutes);
app.use('/crm/avis', requireAuth, reviewsRoutes);
app.use('/crm/statistics', requireAuth, statisticsRoutes);
app.use("/crm", verifySession);


// Authentification pour les routes protégées
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: "Accès non autorisé. Veuillez vous connecter." });
    }
    next();
}


// Route pour le tableau de bord CRM
app.get("/crm/dashboard", requireAdmin, (req, res) => {
    res.status(200).json({ message: "Bienvenue sur le tableau de bord CRM." });
});



app.post("/crm/admin-only-action", requireAdmin, (req, res) => {
    res.status(200).json({ message: "Action réservée aux administrateurs effectuée." });
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
app.get("/api/session-check", (req, res) => {
    if (req.session && req.session.user) {
        return res.status(200).json({
            message: "Session valide.",
            user: req.session.user, // Retourne l'utilisateur connecté
        });
    }
    return res.status(401).json({ message: "Session expirée." });
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


// Route pour la connexion pour l'administrateur
app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;

    const clients = loadClients();
    const admin = clients.find((c) => c.email === email && c.role === "admin");

    if (!admin) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    bcrypt.compare(password, admin.password, (err, isMatch) => {
        if (err || !isMatch) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect." });
        }

        req.session.user = { id: admin.id, email: admin.email, role: admin.role };
        console.log("Session après connexion (admin) :", req.session);

        res.status(200).json({ message: "Connexion réussie.", role: "admin" });
    });
});


// Endpoint pour traiter le formulaire de contact
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }

    try {
        const mailOptions = {
            from: `"SLG Tech Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `[Contact] ${subject}`,
            text: `De: ${name} (${email})\n\n${message}`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Message envoyé avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email :', error.message);
        res.status(500).json({ message: 'Erreur lors de l\'envoi du message.' });
    }
});


// Endpoint pour envoyer un email de remerciement
app.post('/api/send-thank-you-email', async (req, res) => {
    const { email, orderNumber, cart, total } = req.body;

    if (!email || !orderNumber || !cart || !total) {
        return res.status(400).json({ message: 'Données manquantes.' });
    }

    try {
        const mailOptions = {
            from: `"SLG Tech" <${process.env.EMAIL_USER}>`,
            to: clients.email,
            subject: 'Merci pour votre commande !',
            html: `
                <h1>Merci pour votre commande !</h1>
                <p>Votre numéro de commande est : <strong>${orderNumber}</strong></p>
                <p>Voici un résumé de vos articles :</p>
                <ul>
                    ${cart.map(item => `<li>${item.nom} - Quantité : ${item.quantite} - Prix : ${item.prix.toFixed(2)} CAD</li>`).join('')}
                </ul>
                <p>Total : <strong>${total.toFixed(2)} CAD</strong></p>
            `,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email envoyé avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email :', error.message);
        res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email.' });
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
app.put('/api/produits/:id/stock', verifySession, (req, res) => {
    const produitId = parseInt(req.params.id, 10);
    const { quantiteAchetee } = req.body;

    if (isNaN(produitId) || !quantiteAchetee || quantiteAchetee <= 0) {
        return res.status(400).json({ message: 'Données invalides pour la mise à jour du stock.' });
    }

    fs.readFile('./data/produits.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: "Erreur lors de la lecture des produits." });
        }

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
            if (err) {
                return res.status(500).json({ message: "Erreur lors de la sauvegarde des produits." });
            }

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
app.get("/api/cart/:userId", (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    // Exemple : récupération du panier dans une base de données ou fichier JSON
    const cartData = carts[userId] || [];
    res.status(200).json(cartData);
});

// Route pour ajouter un produit au panier
app.post('/cart', (req, res) => {
    const produit = req.body;

    // Validation des données du produit
    if (!produit || !produit.id || !produit.nom || produit.quantite === undefined || isNaN(produit.quantite)) {
        return res.status(400).json({ message: "Données de produit invalides." });
    }

    produit.quantite = parseInt(produit.quantite, 10); // Convertir en entier

    const existingProduit = carts.find(item => item.id === produit.id);

    if (existingProduit) {
        existingProduit.quantite += produit.quantite;
    } else {
        carts.push({ ...produit, quantite: produit.quantite });
    }

    res.status(200).json({ message: 'Produit ajouté au panier', carts });
});


// Route pour supprimer un produit spécifique du panier
app.delete('/cart/:id', (req, res) => {
    const produitId = parseInt(req.params.id, 10);

    if (isNaN(produitId)) {
        return res.status(400).json({ message: 'ID de produit invalide.' });
    }

    carts = carts.filter(item => item.id !== produitId);
    res.status(200).json({ message: 'Produit supprimé', carts });
});

// Route pour vider complètement le panier
app.delete('/cart', (req, res) => {
    carts = [];
    res.status(200).json({ message: 'Panier vidé', carts });
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


// Endpoint pour la connexion du client
app.post("/api/client/login", (req, res) => {
    const { email, password } = req.body;

    // Charger les clients
    const clients = loadClients(); // Charger les données depuis clients.json
    const client = clients.find((c) => c.email === email && (!c.role || c.role !== "admin"));

    if (!client) {
        console.log(`Utilisateur non trouvé pour l'email : ${email}`);
        return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    console.log("Utilisateur trouvé :", client);

    // Vérification du mot de passe
    bcrypt.compare(password, client.password, (err, isMatch) => {
        if (err) {
            console.error("Erreur bcrypt :", err);
            return res.status(500).json({ message: "Erreur interne du serveur." });
        }
        if (!isMatch) {
            console.log(`Mot de passe incorrect pour : ${email}`);
            return res.status(401).json({ message: "Email ou mot de passe incorrect." });
        }

        console.log("Connexion réussie pour :", client.email);
        res.status(200).json({
            id: client.id,
            name: client.name,
            email: client.email,
            message: "Connexion réussie.",
        });
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

    if (isNaN(userId)) {
        console.error("ID utilisateur invalide :", req.params.userId);
        return res.status(400).json({ message: "ID utilisateur invalide." });
    }

    const client = loadClients().find((c) => c.id === userId);
    if (!client) {
        console.error("Client non trouvé pour cet ID :", userId);
        return res.status(404).json({ message: "Client non trouvé." });
    }

    res.status(200).json(client);
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

    const commandes = loadCommandes().filter((c) => c.user_id === userId);
    if (!commandes.length) {
        console.error("Aucune commande trouvée pour cet utilisateur :", userId);
        return res.status(404).json({ message: "Aucune commande trouvée." });
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

    const userCards = loadCartes().filter(carte => carte.user_id === userId); // Filtrer les cartes par userId

    if (userCards.length === 0) {
        return res.status(404).json({ message: 'Aucune carte trouvée pour cet utilisateur.' });
    }

    res.status(200).json(userCards); // Retourner les cartes
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
<<<<<<< HEAD
});
=======
});
>>>>>>> 9fad80b (Mis à jour)
