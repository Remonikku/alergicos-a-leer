const db = require('../config/db');

const listarPrestamos = async (req, res) => {
    try {
        // Actualizar automáticamente a atrasado si la fecha de devolución ya pasó y sigue activo
        await db.query(`
            UPDATE prestamos 
            SET estado = 'ATRASADO' 
            WHERE estado = 'ACTIVO' AND fecha_devolucion < CURDATE()
        `);

        const sql = `
            SELECT 
                p.id_prestamo,
                p.nombre_cliente,
                p.fk_id_libro,
                l.titulo AS titulo_libro,
                l.isbn AS isbn_libro,
                DATE_FORMAT(p.fecha_prestamo, '%Y-%m-%d') AS fecha_prestamo,
                DATE_FORMAT(p.fecha_devolucion, '%Y-%m-%d') AS fecha_devolucion,
                p.estado
            FROM prestamos p
            LEFT JOIN libros l ON p.fk_id_libro = l.id_libro
            ORDER BY p.id_prestamo DESC
        `;
        const [resultados] = await db.query(sql);
        return res.status(200).json(resultados);
    } catch (error) {
        console.error('Error al listar préstamos:', error);
        return res.status(500).json({ mensaje: 'Error al obtener los préstamos' });
    }
};

const obtenerPrestamo = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT 
                id_prestamo,
                nombre_cliente,
                fk_id_libro,
                DATE_FORMAT(fecha_prestamo, '%Y-%m-%d') AS fecha_prestamo,
                DATE_FORMAT(fecha_devolucion, '%Y-%m-%d') AS fecha_devolucion,
                estado
            FROM prestamos
            WHERE id_prestamo = ?
        `;
        const [resultados] = await db.query(sql, [id]);
        if (resultados.length === 0) {
            return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
        }
        return res.status(200).json(resultados[0]);
    } catch (error) {
        console.error('Error al obtener préstamo:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el préstamo' });
    }
};

const pedirPrestamo = async (req, res) => {
    let connection;
    try {
        const { nombre_cliente, fk_id_libro, fecha_prestamo, fecha_devolucion } = req.body;
        if (!nombre_cliente || nombre_cliente.trim() === '' || !fk_id_libro) {
            return res.status(400).json({ mensaje: 'El nombre del cliente y el libro son obligatorios' });
        }
        
        connection = await db.getConnection();
        await connection.beginTransaction();
        
        const [resultadosLibro] = await connection.query('SELECT stock, titulo, isbn FROM libros WHERE id_libro = ?', [fk_id_libro]);
        if (resultadosLibro.length === 0) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'El libro seleccionado no existe' });
        }
        
        const libro = resultadosLibro[0];
        if (libro.stock <= 0) {
            await connection.rollback();
            return res.status(400).json({ mensaje: `No queda stock disponible para el libro: "${libro.titulo}"` });
        }
        
        const fechaActual = fecha_prestamo || new Date().toISOString().slice(0, 10);
        let fechaDev = fecha_devolucion;
        if (!fechaDev || fechaDev.trim() === '') {
            const dateObj = new Date(fechaActual);
            dateObj.setDate(dateObj.getDate() + 7); // 7 días de intervalo por defecto
            fechaDev = dateObj.toISOString().slice(0, 10);
        }
        
        // Verificar si la fecha de devolución está en el pasado (atrasado)
        const hoy = new Date().toISOString().slice(0, 10);
        let estadoInicial = "ACTIVO";
        if (fechaDev < hoy) {
            estadoInicial = "ATRASADO";
        }
        
        const sqlPrestamo = 'INSERT INTO prestamos (nombre_cliente, fk_id_libro, fecha_prestamo, fecha_devolucion, estado) VALUES (?, ?, ?, ?, ?)';
        const [resultado] = await connection.query(sqlPrestamo, [nombre_cliente.trim(), fk_id_libro, fechaActual, fechaDev, estadoInicial]);
        
        await connection.query('UPDATE libros SET stock = stock - 1 WHERE id_libro = ?', [fk_id_libro]);
        
        await connection.commit();
        return res.status(201).json({ 
            mensaje: 'Préstamo solicitado correctamente',
            prestamo: {
                id_prestamo: resultado.insertId,
                nombre_cliente: nombre_cliente.trim(),
                fk_id_libro: Number(fk_id_libro),
                titulo_libro: libro.titulo,
                isbn_libro: libro.isbn,
                fecha_prestamo: fechaActual,
                fecha_devolucion: fechaDev,
                estado: estadoInicial
            }
        });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al solicitar préstamo:', error);
        return res.status(500).json({ mensaje: 'Error al procesar el préstamo' });
    } finally {
        if (connection) connection.release();
    }
};

const devolverPrestamo = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await db.getConnection();
        await connection.beginTransaction();
        
        const [resultadosPrestamo] = await connection.query('SELECT fk_id_libro, estado FROM prestamos WHERE id_prestamo = ?', [id]);
        if (resultadosPrestamo.length === 0) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
        }
        
        const prestamo = resultadosPrestamo[0];
        if (prestamo.estado === 'DEVUELTO') {
            await connection.rollback();
            return res.status(400).json({ mensaje: 'Este préstamo ya fue devuelto' });
        }
        
        // Mantener la fecha de devolución límite y solo cambiar estado a DEVUELTO
        await connection.query('UPDATE prestamos SET estado = "DEVUELTO" WHERE id_prestamo = ?', [id]);
        
        await connection.query('UPDATE libros SET stock = stock + 1 WHERE id_libro = ?', [prestamo.fk_id_libro]);
        
        await connection.commit();
        return res.status(200).json({ mensaje: 'Libro devuelto correctamente y stock actualizado' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al devolver préstamo:', error);
        return res.status(500).json({ mensaje: 'Error al registrar la devolución' });
    } finally {
        if (connection) connection.release();
    }
};

const editarPrestamo = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { nombre_cliente, fk_id_libro, fecha_prestamo, fecha_devolucion, estado } = req.body;
        
        if (!nombre_cliente || nombre_cliente.trim() === '' || !fk_id_libro || !fecha_prestamo || !fecha_devolucion || !estado) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }
        
        connection = await db.getConnection();
        await connection.beginTransaction();
        
        const [resultadosOriginal] = await connection.query('SELECT fk_id_libro, estado FROM prestamos WHERE id_prestamo = ?', [id]);
        if (resultadosOriginal.length === 0) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
        }
        
        const original = resultadosOriginal[0];
        const oldBook = original.fk_id_libro;
        const oldState = original.estado;
        const newBook = Number(fk_id_libro);
        
        let newState = estado;
        // Si el estado es activo pero la fecha de vencimiento ya pasó, forzar a atrasado
        const hoy = new Date().toISOString().slice(0, 10);
        if (newState === 'ACTIVO' && fecha_devolucion < hoy) {
            newState = 'ATRASADO';
        }
        
        if (oldState !== 'DEVUELTO') {
            await connection.query('UPDATE libros SET stock = stock + 1 WHERE id_libro = ?', [oldBook]);
        }
        
        if (newState !== 'DEVUELTO') {
            const [resultadosStock] = await connection.query('SELECT stock, titulo FROM libros WHERE id_libro = ?', [newBook]);
            if (resultadosStock.length === 0) {
                await connection.rollback();
                return res.status(404).json({ mensaje: 'El libro seleccionado no existe' });
            }
            const libroInfo = resultadosStock[0];
            if (libroInfo.stock <= 0) {
                await connection.rollback();
                return res.status(400).json({ mensaje: `No hay stock suficiente para el libro "${libroInfo.titulo}"` });
            }
            
            await connection.query('UPDATE libros SET stock = stock - 1 WHERE id_libro = ?', [newBook]);
        }
        
        const sql = `
            UPDATE prestamos 
            SET nombre_cliente = ?, fk_id_libro = ?, fecha_prestamo = ?, fecha_devolucion = ?, estado = ?
            WHERE id_prestamo = ?
        `;
        await connection.query(sql, [
            nombre_cliente.trim(),
            newBook,
            fecha_prestamo,
            fecha_devolucion,
            newState,
            id
        ]);
        
        await connection.commit();
        return res.status(200).json({ mensaje: 'Préstamo editado correctamente' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al editar préstamo:', error);
        return res.status(500).json({ mensaje: 'Error al editar el préstamo' });
    } finally {
        if (connection) connection.release();
    }
};

const eliminarPrestamo = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await db.getConnection();
        await connection.beginTransaction();
        
        const [resultados] = await connection.query('SELECT fk_id_libro, estado FROM prestamos WHERE id_prestamo = ?', [id]);
        if (resultados.length === 0) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
        }
        
        const prestamo = resultados[0];
        
        if (prestamo.estado !== 'DEVUELTO') {
            await connection.query('UPDATE libros SET stock = stock + 1 WHERE id_libro = ?', [prestamo.fk_id_libro]);
        }
        
        await connection.query('DELETE FROM prestamos WHERE id_prestamo = ?', [id]);
        
        await connection.commit();
        return res.status(200).json({ mensaje: 'Préstamo eliminado correctamente' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al eliminar préstamo:', error);
        return res.status(500).json({ mensaje: 'Error al eliminar el préstamo' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    listarPrestamos,
    obtenerPrestamo,
    pedirPrestamo,
    devolverPrestamo,
    editarPrestamo,
    eliminarPrestamo
};
