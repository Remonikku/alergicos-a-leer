const db = require('../config/db');

const listarUsuarios = async (req, res) => {
    try {
        const [resultados] = await db.query('SELECT id_usuario, nombre_usuario, rol FROM usuarios ORDER BY id_usuario ASC');
        return res.status(200).json(resultados);
    } catch (error) {
        console.error('Error al listar usuarios:', error);
        return res.status(500).json({ mensaje: 'Error al obtener los usuarios' });
    }
};

const obtenerUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const [resultados] = await db.query('SELECT id_usuario, nombre_usuario, rol FROM usuarios WHERE id_usuario = ?', [id]);
        if (resultados.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        return res.status(200).json(resultados[0]);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el usuario' });
    }
};

const agregarUsuario = async (req, res) => {
    try {
        const { nombre_usuario, password, rol } = req.body;
        if (!nombre_usuario || nombre_usuario.trim() === '' || !password || password.trim() === '') {
            return res.status(400).json({ mensaje: 'El nombre de usuario y contraseña son obligatorios' });
        }
        
        const [existente] = await db.query('SELECT id_usuario FROM usuarios WHERE nombre_usuario = ?', [nombre_usuario.trim()]);
        if (existente.length > 0) {
            return res.status(400).json({ mensaje: 'El nombre de usuario ya está registrado' });
        }
        
        const sql = 'INSERT INTO usuarios (nombre_usuario, password, rol) VALUES (?, ?, ?)';
        const [resultado] = await db.query(sql, [nombre_usuario.trim(), password, rol || 'ADMIN']);
        return res.status(201).json({ mensaje: 'Usuario agregado correctamente', id: resultado.insertId });
    } catch (error) {
        console.error('Error al agregar usuario:', error);
        return res.status(500).json({ mensaje: 'Error al agregar el usuario' });
    }
};

const editarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_usuario, password, rol } = req.body;
        if (!nombre_usuario || nombre_usuario.trim() === '') {
            return res.status(400).json({ mensaje: 'El nombre de usuario es obligatorio' });
        }
        
        const [existente] = await db.query('SELECT id_usuario FROM usuarios WHERE nombre_usuario = ? AND id_usuario != ?', [nombre_usuario.trim(), id]);
        if (existente.length > 0) {
            return res.status(400).json({ mensaje: 'El nombre de usuario ya está registrado por otro usuario' });
        }
        
        let sql;
        let params;
        if (password && password.trim() !== '') {
            sql = 'UPDATE usuarios SET nombre_usuario = ?, password = ?, rol = ? WHERE id_usuario = ?';
            params = [nombre_usuario.trim(), password, rol || 'ADMIN', id];
        } else {
            sql = 'UPDATE usuarios SET nombre_usuario = ?, rol = ? WHERE id_usuario = ?';
            params = [nombre_usuario.trim(), rol || 'ADMIN', id];
        }
        
        const [resultado] = await db.query(sql, params);
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        return res.status(200).json({ mensaje: 'Usuario editado correctamente' });
    } catch (error) {
        console.error('Error al editar usuario:', error);
        return res.status(500).json({ mensaje: 'Error al editar el usuario' });
    }
};

const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [totalAdmins] = await db.query('SELECT COUNT(*) AS total FROM usuarios WHERE rol = "ADMIN"');
        const [usuarioEliminar] = await db.query('SELECT rol FROM usuarios WHERE id_usuario = ?', [id]);
        
        if (usuarioEliminar.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        
        if (usuarioEliminar[0].rol === 'ADMIN' && totalAdmins[0].total <= 1) {
            return res.status(400).json({ mensaje: 'No puedes eliminar al único administrador del sistema' });
        }
        
        const sql = 'DELETE FROM usuarios WHERE id_usuario = ?';
        await db.query(sql, [id]);
        return res.status(200).json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        return res.status(500).json({ mensaje: 'Error al eliminar el usuario' });
    }
};

module.exports = {
    listarUsuarios,
    obtenerUsuario,
    agregarUsuario,
    editarUsuario,
    eliminarUsuario
};
