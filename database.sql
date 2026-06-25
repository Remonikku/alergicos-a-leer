SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS Libreria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE Libreria;
ALTER DATABASE Libreria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS prestamos;
DROP TABLE IF EXISTS libros_autores;
DROP TABLE IF EXISTS autores;
DROP TABLE IF EXISTS libros;
DROP TABLE IF EXISTS generos;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
    id_usuario int AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario varchar(200) NOT NULL UNIQUE,
    password varchar(255) NOT NULL,
    rol ENUM('CLIENTE','ADMIN') DEFAULT 'ADMIN'
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE generos (
    id_genero int PRIMARY KEY AUTO_INCREMENT,
    nombre_genero VARCHAR(100) NOT NULL UNIQUE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE libros (
    id_libro int AUTO_INCREMENT PRIMARY KEY,
    titulo varchar(200) NOT NULL,
    isbn varchar(20) UNIQUE NOT NULL,
    anio_publicacion int NOT NULL,
    fk_id_genero int NOT NULL, 
    stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
    CONSTRAINT ID_GENERO_LIBROS FOREIGN KEY (fk_id_genero) REFERENCES generos(id_genero) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE autores (
    id_autor int AUTO_INCREMENT PRIMARY KEY,
    nombre varchar(100) NOT NULL,
    apellido varchar(100) NOT NULL,
    nacionalidad varchar(50)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE libros_autores (
    fk_id_libro int NOT NULL,
    fk_id_autor int NOT NULL,
    PRIMARY KEY (fk_id_libro, fk_id_autor),
    FOREIGN KEY (fk_id_libro) REFERENCES libros(id_libro) ON DELETE CASCADE,
    FOREIGN KEY (fk_id_autor) REFERENCES autores(id_autor) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE prestamos (
    id_prestamo int AUTO_INCREMENT PRIMARY KEY,
    nombre_cliente varchar(200) NOT NULL,
    fk_id_libro int NOT NULL,
    fecha_prestamo date NOT NULL,
    fecha_devolucion date NOT NULL,
    estado ENUM('ACTIVO','DEVUELTO','ATRASADO') DEFAULT 'ACTIVO', 
    FOREIGN KEY (fk_id_libro) REFERENCES libros(id_libro) ON DELETE CASCADE,
    CHECK (fecha_devolucion >= fecha_prestamo)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO usuarios (nombre_usuario, password, rol) VALUES
('admin', 'admin123', 'ADMIN'),
('supervisor', 'super123', 'ADMIN');

INSERT INTO generos (nombre_genero) VALUES
('Novela'),
('Ficción'),
('Fantasía'),
('Terror');

INSERT INTO autores (nombre, apellido, nacionalidad) VALUES
('Gabriel', 'García Márquez', 'Colombiana'),
('J.K.', 'Rowling', 'Británica'),
('George R.R.', 'Martin', 'Estadounidense'),
('Stephen', 'King', 'Estadounidense');

INSERT INTO libros (titulo, isbn, anio_publicacion, fk_id_genero, stock) VALUES
('Cien años de soledad', '978-0307474728', 1967, 1, 5),
('Harry Potter y la piedra filosofal', '978-8449336249', 1997, 3, 3),
('Canción de hielo y fuego: Juego de Tronos', '978-8496208964', 1996, 3, 0),
('El resplandor', '978-8497593717', 1977, 4, 2);

INSERT INTO libros_autores (fk_id_libro, fk_id_autor) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4);

INSERT INTO prestamos (nombre_cliente, fk_id_libro, fecha_prestamo, fecha_devolucion, estado) VALUES
('Juan Pérez', 1, '2026-06-10', '2026-06-17', 'ACTIVO'),
('María Gómez', 4, '2026-06-12', '2026-06-15', 'DEVUELTO');
