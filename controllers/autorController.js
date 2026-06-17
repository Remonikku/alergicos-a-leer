const db = require('../config/db');

const listarAutores = async (req, res) => {
    try {
        const [resultados] = await db.query('SELECT * FROM autores ORDER BY apellido ASC, nombre ASC');
        return res.status(200).json(resultados);
    } catch (error) {
        console.error('Error al listar autores:', error);
        return res.status(500).json({ mensaje: 'Error al obtener los autores' });
    }
};

const obtenerAutor = async (req, res) => {
    try {
        const { id } = req.params;
        const [resultados] = await db.query('SELECT * FROM autores WHERE id_autor = ?', [id]);
        if (resultados.length === 0) {
            return res.status(404).json({ mensaje: 'Autor no encontrado' });
        }
        return res.status(200).json(resultados[0]);
    } catch (error) {
        console.error('Error al obtener autor:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el autor' });
    }
};

const agregarAutor = async (req, res) => {
    try {
        const { nombre, apellido, nacionalidad } = req.body;
        if (!nombre || nombre.trim() === '' || !apellido || apellido.trim() === '') {
            return res.status(400).json({ mensaje: 'El nombre y apellido son obligatorios' });
        }
        
        const sql = 'INSERT INTO autores (nombre, apellido, nacionalidad) VALUES (?, ?, ?)';
        const [resultado] = await db.query(sql, [
            nombre.trim(),
            apellido.trim(),
            nacionalidad ? nacionalidad.trim() : null
        ]);
        return res.status(201).json({ mensaje: 'Autor agregado correctamente', id: resultado.insertId });
    } catch (error) {
        console.error('Error al agregar autor:', error);
        return res.status(500).json({ mensaje: 'Error al agregar el autor' });
    }
};

const editarAutor = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, nacionalidad } = req.body;
        if (!nombre || nombre.trim() === '' || !apellido || apellido.trim() === '') {
            return res.status(400).json({ mensaje: 'El nombre y apellido son obligatorios' });
        }
        
        const sql = 'UPDATE autores SET nombre = ?, apellido = ?, nacionalidad = ? WHERE id_autor = ?';
        const [resultado] = await db.query(sql, [
            nombre.trim(),
            apellido.trim(),
            nacionalidad ? nacionalidad.trim() : null,
            id
        ]);
        
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Autor no encontrado' });
        }
        return res.status(200).json({ mensaje: 'Autor editado correctamente' });
    } catch (error) {
        console.error('Error al editar autor:', error);
        return res.status(500).json({ mensaje: 'Error al editar el autor' });
    }
};

const eliminarAutor = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM autores WHERE id_autor = ?';
        const [resultado] = await db.query(sql, [id]);
        
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Autor no encontrado' });
        }
        return res.status(200).json({ mensaje: 'Autor eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar autor:', error);
        return res.status(500).json({ mensaje: 'Error al eliminar el autor. Verifique que no esté asignado a ningún libro.' });
    }
};

module.exports = {
    listarAutores,
    obtenerAutor,
    agregarAutor,
    editarAutor,
    eliminarAutor
};
