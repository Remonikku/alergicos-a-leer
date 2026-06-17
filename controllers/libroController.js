const db = require('../config/db');

const listarLibros = async (req, res) => {
    try {
        const sql = `
            SELECT 
                l.id_libro,
                l.titulo,
                l.isbn,
                l.anio_publicacion,
                l.fk_id_genero,
                g.nombre_genero,
                l.stock,
                COALESCE(GROUP_CONCAT(CONCAT(a.nombre, ' ', a.apellido) SEPARATOR ', '), 'Sin Autor') AS autores,
                COALESCE(GROUP_CONCAT(a.id_autor), '') AS ids_autores
            FROM libros l
            LEFT JOIN generos g ON l.fk_id_genero = g.id_genero
            LEFT JOIN libros_autores la ON l.id_libro = la.fk_id_libro
            LEFT JOIN autores a ON la.fk_id_autor = a.id_autor
            GROUP BY l.id_libro
            ORDER BY l.titulo ASC
        `;
        const [resultados] = await db.query(sql);
        return res.status(200).json(resultados);
    } catch (error) {
        console.error('Error al listar libros:', error);
        return res.status(500).json({ mensaje: 'Error al obtener los libros' });
    }
};

const obtenerLibro = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT 
                l.id_libro,
                l.titulo,
                l.isbn,
                l.anio_publicacion,
                l.fk_id_genero,
                l.stock,
                COALESCE(GROUP_CONCAT(a.id_autor), '') AS ids_autores
            FROM libros l
            LEFT JOIN libros_autores la ON l.id_libro = la.fk_id_libro
            LEFT JOIN autores a ON la.fk_id_autor = a.id_autor
            WHERE l.id_libro = ?
            GROUP BY l.id_libro
        `;
        const [resultados] = await db.query(sql, [id]);
        if (resultados.length === 0) {
            return res.status(404).json({ mensaje: 'Libro no encontrado' });
        }
        
        const libro = resultados[0];
        libro.ids_autores = libro.ids_autores ? libro.ids_autores.split(',').map(Number) : [];
        
        return res.status(200).json(libro);
    } catch (error) {
        console.error('Error al obtener libro:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el libro' });
    }
};

const agregarLibro = async (req, res) => {
    let connection;
    try {
        const { titulo, isbn, anio_publicacion, fk_id_genero, stock, ids_autores } = req.body;
        
        if (!titulo || !isbn || !anio_publicacion || !fk_id_genero || stock === undefined) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }
        
        if (Number(stock) < 0) {
            return res.status(400).json({ mensaje: 'El stock no puede ser negativo' });
        }
        
        const [existente] = await db.query('SELECT id_libro FROM libros WHERE isbn = ?', [isbn.trim()]);
        if (existente.length > 0) {
            return res.status(400).json({ mensaje: 'El ISBN ingresado ya está registrado por otro libro' });
        }
        
        connection = await db.getConnection();
        await connection.beginTransaction();
        
        const sqlLibro = 'INSERT INTO libros (titulo, isbn, anio_publicacion, fk_id_genero, stock) VALUES (?, ?, ?, ?, ?)';
        const [resultadoLibro] = await connection.query(sqlLibro, [
            titulo.trim(),
            isbn.trim(),
            Number(anio_publicacion),
            Number(fk_id_genero),
            Number(stock)
        ]);
        
        const idLibro = resultadoLibro.insertId;
        
        if (ids_autores && Array.isArray(ids_autores) && ids_autores.length > 0) {
            for (const idAutor of ids_autores) {
                await connection.query('INSERT INTO libros_autores (fk_id_libro, fk_id_autor) VALUES (?, ?)', [idLibro, idAutor]);
            }
        }
        
        await connection.commit();
        return res.status(201).json({ mensaje: 'Libro agregado correctamente', id: idLibro });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al agregar libro:', error);
        return res.status(500).json({ mensaje: 'Error al agregar el libro' });
    } finally {
        if (connection) connection.release();
    }
};

const editarLibro = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { titulo, isbn, anio_publicacion, fk_id_genero, stock, ids_autores } = req.body;
        
        if (!titulo || !isbn || !anio_publicacion || !fk_id_genero || stock === undefined) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }
        
        if (Number(stock) < 0) {
            return res.status(400).json({ mensaje: 'El stock no puede ser negativo' });
        }
        
        const [existente] = await db.query('SELECT id_libro FROM libros WHERE isbn = ? AND id_libro != ?', [isbn.trim(), id]);
        if (existente.length > 0) {
            return res.status(400).json({ mensaje: 'El ISBN ingresado ya está registrado por otro libro' });
        }
        
        connection = await db.getConnection();
        await connection.beginTransaction();
        
        const sqlLibro = 'UPDATE libros SET titulo = ?, isbn = ?, anio_publicacion = ?, fk_id_genero = ?, stock = ? WHERE id_libro = ?';
        const [resultadoUpdate] = await connection.query(sqlLibro, [
            titulo.trim(),
            isbn.trim(),
            Number(anio_publicacion),
            Number(fk_id_genero),
            Number(stock),
            id
        ]);
        
        if (resultadoUpdate.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'Libro no encontrado' });
        }
        
        await connection.query('DELETE FROM libros_autores WHERE fk_id_libro = ?', [id]);
        
        if (ids_autores && Array.isArray(ids_autores) && ids_autores.length > 0) {
            for (const idAutor of ids_autores) {
                await connection.query('INSERT INTO libros_autores (fk_id_libro, fk_id_autor) VALUES (?, ?)', [id, idAutor]);
            }
        }
        
        await connection.commit();
        return res.status(200).json({ mensaje: 'Libro editado correctamente' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al editar libro:', error);
        return res.status(500).json({ mensaje: 'Error al editar el libro' });
    } finally {
        if (connection) connection.release();
    }
};

const eliminarLibro = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM libros WHERE id_libro = ?';
        const [resultado] = await db.query(sql, [id]);
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Libro no encontrado' });
        }
        return res.status(200).json({ mensaje: 'Libro eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar libro:', error);
        return res.status(500).json({ mensaje: 'Error al eliminar el libro' });
    }
};

module.exports = {
    listarLibros,
    obtenerLibro,
    agregarLibro,
    editarLibro,
    eliminarLibro
};
