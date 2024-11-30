const fs = require('fs');

function loadJSON(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Erreur lors de la lecture du fichier ${filePath} :`, error.message);
        return [];
    }
}

function saveJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Erreur lors de l'écriture dans le fichier ${filePath} :`, error.message);
    }
}

module.exports = { loadJSON, saveJSON };