class Prestamo {
    constructor(id_prestamo, nombre_cliente, fk_id_libro, fecha_prestamo, fecha_devolucion, estado = 'ACTIVO') {
        this.id_prestamo = id_prestamo;
        this.nombre_cliente = nombre_cliente;
        this.fk_id_libro = fk_id_libro;
        this.fecha_prestamo = fecha_prestamo;
        this.fecha_devolucion = fecha_devolucion;
        this.estado = estado;
    }
}

module.exports = Prestamo;
