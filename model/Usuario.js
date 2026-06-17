class Usuario {
    constructor(id_usuario, nombre_usuario, password, rol = 'ADMIN') {
        this.id_usuario = id_usuario;
        this.nombre_usuario = nombre_usuario;
        this.password = password;
        this.rol = rol;
    }
}

module.exports = Usuario;
