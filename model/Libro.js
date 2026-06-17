class Libro {
    constructor(id_libro, titulo, isbn, anio_publicacion, fk_id_genero, stock) {
        this.id_libro = id_libro;
        this.titulo = titulo;
        this.isbn = isbn;
        this.anio_publicacion = anio_publicacion;
        this.fk_id_genero = fk_id_genero;
        this.stock = stock;
    }
}

module.exports = Libro;
