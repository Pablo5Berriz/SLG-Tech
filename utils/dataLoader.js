const fs = require('fs');
const path = require('path');

// Fonction pour charger les données depuis un fichier JSON
function loadData(filePath) {
    try {
        const absolutePath = path.resolve(__dirname, filePath);
        const data = fs.readFileSync(absolutePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Erreur lors de la lecture du fichier ${filePath} :`, err.message);
        throw new Error(`Impossible de charger les données du fichier ${filePath}`);
    }
}

module.exports = loadData;