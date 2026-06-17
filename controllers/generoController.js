const db = require('../config/db');

const listarGeneros = async (req, res) => {
    try {
        const [resultados] = await db.query('SELECT * FROM generos ORDER BY id_genero ASC');
        return res.status(200).json(resultados);
    } catch (error) {
        console.error('Error al listar géneros:', error);
        return res.status(500).json({ mensaje: 'Error al obtener los géneros' });
    }
};

const obtenerGenero = async (req, res) => {
    try {
        const { id } = req.params;
        const [resultados] = await db.query('SELECT * FROM generos WHERE id_genero = ?', [id]);
        if (resultados.length === 0) {
            return res.status(404).json({ mensaje: 'Género no encontrado' });
        }
        return res.status(200).json(resultados[0]);
    } catch (error) {
        console.error('Error al obtener género:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el género' });
    }
};

const agregarGenero = async (req, res) => {
    try {
        const { nombre_genero } = req.body;
        if (!nombre_genero || nombre_genero.trim() === '') {
            return res.status(400).json({ mensaje: 'El nombre del género es obligatorio' });
        }
        
        const sql = 'INSERT INTO generos (nombre_genero) VALUES (?)';
        const [resultado] = await db.query(sql, [nombre_genero.trim()]);
        return res.status(201).json({ mensaje: 'Género agregado correctamente', id: resultado.insertId });
    } catch (error) {
        console.error('Error al agregar género:', error);
        return res.status(500).json({ mensaje: 'Error al agregar el género' });
    }
};

const editarGenero = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_genero } = req.body;
        if (!nombre_genero || nombre_genero.trim() === '') {
            return res.status(400).json({ mensaje: 'El nombre del género es obligatorio' });
        }
        
        const sql = 'UPDATE generos SET nombre_genero = ? WHERE id_genero = ?';
        const [resultado] = await db.query(sql, [nombre_genero.trim(), id]);
        
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Género no encontrado' });
        }
        return res.status(200).json({ mensaje: 'Género editado correctamente' });
    } catch (error) {
        console.error('Error al editar género:', error);
        return res.status(500).json({ mensaje: 'Error al editar el género' });
    }
};

const eliminarGenero = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM generos WHERE id_genero = ?';
        const [resultado] = await db.query(sql, [id]);
        
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Género no encontrado' });
        }
        return res.status(200).json({ mensaje: 'Género eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar género:', error);
        return res.status(500).json({ mensaje: 'Error al eliminar el género. Verifique que no esté asignado a ningún libro.' });
    }
};

module.exports = {
    listarGeneros,
    obtenerGenero,
    agregarGenero,
    editarGenero,
    eliminarGenero
};
