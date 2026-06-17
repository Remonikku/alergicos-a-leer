const express = require('express');
const path = require('path');
const db = require('./config/db');

const authController = require('./controllers/authController');
const libroController = require('./controllers/libroController');
const autorController = require('./controllers/autorController');
const generoController = require('./controllers/generoController');
const prestamoController = require('./controllers/prestamoController');
const usuarioController = require('./controllers/usuarioController');

const app = express();
const puerto = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', (req, res) => {
    if (authController.estaLogueado()) {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/admin', authController.requiereAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.post('/api/auth/login', authController.login);
app.post('/api/auth/logout', authController.logout);
app.get('/api/auth/me', authController.obtenerUsuarioActual);

app.get('/api/libros', libroController.listarLibros);
app.post('/api/prestamos/public', prestamoController.pedirPrestamo);

app.use('/api', authController.requiereAdmin);

app.get('/api/libros/:id', libroController.obtenerLibro);
app.post('/api/libros', libroController.agregarLibro);
app.put('/api/libros/:id', libroController.editarLibro);
app.delete('/api/libros/:id', libroController.eliminarLibro);

app.get('/api/autores', autorController.listarAutores);
app.get('/api/autores/:id', autorController.obtenerAutor);
app.post('/api/autores', autorController.agregarAutor);
app.put('/api/autores/:id', autorController.editarAutor);
app.delete('/api/autores/:id', autorController.eliminarAutor);

app.get('/api/generos', generoController.listarGeneros);
app.get('/api/generos/:id', generoController.obtenerGenero);
app.post('/api/generos', generoController.agregarGenero);
app.put('/api/generos/:id', generoController.editarGenero);
app.delete('/api/generos/:id', generoController.eliminarGenero);

app.get('/api/prestamos', prestamoController.listarPrestamos);
app.get('/api/prestamos/:id', prestamoController.obtenerPrestamo);
app.post('/api/prestamos', prestamoController.pedirPrestamo);
app.put('/api/prestamos/:id', prestamoController.editarPrestamo);
app.put('/api/prestamos/:id/devolver', prestamoController.devolverPrestamo);
app.delete('/api/prestamos/:id', prestamoController.eliminarPrestamo);

app.get('/api/usuarios', usuarioController.listarUsuarios);
app.get('/api/usuarios/:id', usuarioController.obtenerUsuario);
app.post('/api/usuarios', usuarioController.agregarUsuario);
app.put('/api/usuarios/:id', usuarioController.editarUsuario);
app.delete('/api/usuarios/:id', usuarioController.eliminarUsuario);

const iniciarServidor = async () => {
    try {
        await db.query('SELECT 1');
        app.listen(puerto, () => {
            console.log(`ALOOO EL PROGAMA ESTA WENO LOCOO AQUI LO PUEDES VER http://localhost:3000`);
        });
    } catch (error) {
        console.log('ALO TIENE ERROR EN LA BASE DE DATOS QUIZAS NO LA TIENE PUESTA AUN O ESTA APAGADA');
        console.error(error.message);
    }
};

iniciarServidor();
