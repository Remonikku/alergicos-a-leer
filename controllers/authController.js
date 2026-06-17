const db = require('../config/db');

let usuarioLogueado = null;

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }

        const sql = 'SELECT id_usuario, nombre_usuario, rol FROM usuarios WHERE nombre_usuario = ? AND password = ?';
        const [resultados] = await db.query(sql, [username.trim(), password]);

        if (resultados.length === 0) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const usuario = resultados[0];

        usuarioLogueado = {
            id_usuario: usuario.id_usuario,
            nombre_usuario: usuario.nombre_usuario,
            rol: usuario.rol
        };

        return res.status(200).json({ mensaje: 'Inicio de sesión correcto', rol: usuario.rol });
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ mensaje: 'Error al iniciar sesión' });
    }
};

const logout = (req, res) => {
    usuarioLogueado = null;
    return res.status(200).json({ mensaje: 'Sesión cerrada correctamente' });
};

const obtenerUsuarioActual = (req, res) => {
    if (usuarioLogueado) {
        return res.status(200).json(usuarioLogueado);
    }
    return res.status(401).json({ mensaje: 'No autenticado' });
};

const requiereAdmin = (req, res, next) => {
    if (!usuarioLogueado) {
        const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
        if (req.xhr || acceptsJson) {
            return res.status(403).json({ mensaje: 'Acceso denegado. Requiere privilegios de Administrador.' });
        }
        return res.redirect('/login');
    }
    next();
};

const estaLogueado = () => {
    return usuarioLogueado !== null;
};

module.exports = {
    login,
    logout,
    obtenerUsuarioActual,
    requiereAdmin,
    estaLogueado
};
