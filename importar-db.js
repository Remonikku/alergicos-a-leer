const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function importar() {
    try {
        console.log("Iniciando importación de la base de datos...");
        const sqlPath = path.join(__dirname, 'database.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Separar las sentencias por punto y coma, ignorando los que están dentro de comillas
        const sentencias = sqlContent
            .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`Se encontraron ${sentencias.length} sentencias SQL para ejecutar.`);

        for (let i = 0; i < sentencias.length; i++) {
            const sql = sentencias[i];
            try {
                await db.query(sql);
            } catch (err) {
                console.error(`Error al ejecutar la sentencia #${i + 1}:`);
                console.error(sql);
                console.error("Detalle del error:", err.message);
                throw err;
            }
        }

        console.log("¡Base de datos importada correctamente con codificación UTF-8!");
        process.exit(0);
    } catch (err) {
        console.error("Error durante la importación:", err);
        process.exit(1);
    }
}

importar();
