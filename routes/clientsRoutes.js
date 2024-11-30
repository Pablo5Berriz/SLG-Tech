const express = require('express');
const path = require('path');
const { loadJSON, saveJSON } = require('../utils/fileHelpers');
const bcrypt = require('bcrypt');
const router = express.Router();

const clientsFilePath = path.join(__dirname, '../data/clients.json');

// Récupérer tous les clients
router.get('/', (req, res) => {
    try {
        const clients = loadJSON(clientsFilePath);
        res.json(clients);
    } catch (error) {
        console.error('Erreur lors de la récupération des clients :', error.message);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

// Créer un client
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }

    try {
        const clients = loadJSON(clientsFilePath);
        const existingClient = clients.find(client => client.email === email);

        if (existingClient) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newClient = { id: Date.now(), name, email, password: hashedPassword };
        clients.push(newClient);

        saveJSON(clientsFilePath, clients);
        res.status(201).json({ message: 'Compte créé avec succès.', client: { name, email } });
    } catch (error) {
        console.error('Erreur lors de l\'inscription :', error.message);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

module.exports = router;