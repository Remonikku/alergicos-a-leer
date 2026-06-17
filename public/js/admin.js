const urlAuth = '/api/auth';
const urlLibros = '/api/libros';
const urlAutores = '/api/autores';
const urlGeneros = '/api/generos';
const urlPrestamos = '/api/prestamos';
const urlUsuarios = '/api/usuarios';

const adminGreeting = document.getElementById('adminGreeting');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');
const bannerMensaje = document.getElementById('mensaje');

let listaLibros = [];
let listaAutores = [];
let listaGeneros = [];
let listaPrestamos = [];
let listaUsuarios = [];

document.addEventListener('DOMContentLoaded', async () => {
    await validarSesion();
    await Promise.all([
        obtenerGeneros(),
        obtenerAutores(),
        obtenerLibros(),
        obtenerPrestamos(),
        obtenerUsuarios()
    ]);
});

async function validarSesion() {
    try {
        const res = await fetch(`${urlAuth}/me`);
        if (!res.ok) {
            window.location.href = '/login';
            return;
        }
        const user = await res.json();
        adminGreeting.textContent = `Sesión: ${user.nombre_usuario} (${user.rol})`;
        adminGreeting.classList.remove('d-none');
    } catch (err) {
        console.error(err);
        window.location.href = '/login';
    }
}

btnCerrarSesion.addEventListener('click', async () => {
    try {
        await fetch(`${urlAuth}/logout`, { method: 'POST' });
        window.location.href = '/';
    } catch (err) {
        console.error(err);
        mostrarMensaje('Error al cerrar sesión', 'error');
    }
});

function mostrarMensaje(texto, tipo = 'exito') {
    bannerMensaje.textContent = texto;
    bannerMensaje.className = tipo === 'exito' 
        ? 'alert alert-success' 
        : 'alert alert-danger';
    bannerMensaje.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        bannerMensaje.classList.add('d-none');
    }, 4000);
}

const formGenero = document.getElementById('formGenero');
const inputIdGenero = document.getElementById('id_genero');
const inputNombreGenero = document.getElementById('genero_nombre');
const btnCancelarGenero = document.getElementById('btnCancelarGenero');
const cuerpoTablaGeneros = document.getElementById('cuerpoTablaGeneros');
const templateGenero = document.getElementById('filaGeneroTemplate');
const tituloFormGenero = document.getElementById('tituloFormGenero');

async function obtenerGeneros() {
    try {
        const res = await fetch(urlGeneros);
        listaGeneros = await res.json();
        renderGeneros();
        actualizarCombosGeneros();
    } catch (err) {
        console.error(err);
    }
}

function renderGeneros() {
    cuerpoTablaGeneros.innerHTML = '';
    listaGeneros.forEach(gen => {
        const fila = templateGenero.content.cloneNode(true);
        fila.querySelector('.col-id').textContent = gen.id_genero;
        fila.querySelector('.col-nombre').textContent = gen.nombre_genero;
        fila.querySelector('.btn-editar').addEventListener('click', () => cargarGeneroEnFormulario(gen));
        fila.querySelector('.btn-eliminar').addEventListener('click', () => eliminarGenero(gen.id_genero));
        cuerpoTablaGeneros.appendChild(fila);
    });
}

formGenero.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = inputNombreGenero.value.trim();
    const id = inputIdGenero.value;
    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `${urlGeneros}/${id}` : urlGeneros;

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre_genero: nombre })
        });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.mensaje);
        
        mostrarMensaje(datos.mensaje);
        limpiarFormGenero();
        await obtenerGeneros();
    } catch (err) {
        mostrarMensaje(err.message, 'error');
    }
});

btnCancelarGenero.addEventListener('click', limpiarFormGenero);

function cargarGeneroEnFormulario(gen) {
    inputIdGenero.value = gen.id_genero;
    inputNombreGenero.value = gen.nombre_genero;
    tituloFormGenero.textContent = 'Editar Género';
    inputNombreGenero.focus();
}

function limpiarFormGenero() {
    formGenero.reset();
    inputIdGenero.value = '';
    tituloFormGenero.textContent = 'Agregar Género';
}

async function eliminarGenero(id) {
    if (!confirm('¿Seguro que deseas eliminar este género? Se desvinculará de sus libros.')) return;
    try {
        const res = await fetch(`${urlGeneros}/${id}`, { method: 'DELETE' });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.mensaje);
        mostrarMensaje(datos.mensaje);
        await obtenerGeneros();
        await obtenerLibros();
    } catch (err) {
        mostrarMensaje(err.message, 'error');
    }
}

const formAutor = document.getElementById('formAutor');
const inputIdAutor = document.getElementById('id_autor');
const inputNombreAutor = document.getElementById('autor_nombre');
const inputApellidoAutor = document.getElementById('autor_apellido');
const inputNacAutor = document.getElementById('autor_nacionalidad');
const btnCancelarAutor = document.getElementById('btnCancelarAutor');
const cuerpoTablaAutores = document.getElementById('cuerpoTablaAutores');
const templateAutor = document.getElementById('filaAutorTemplate');
const tituloFormAutor = document.getElementById('tituloFormAutor');

async function obtenerAutores() {
    try {
        const res = await fetch(urlAutores);
        listaAutores = await res.json();
        renderAutores();
        actualizarChecklistAutores();
    } catch (err) {
        console.error(err);
    }
}

function renderAutores() {
    cuerpoTablaAutores.innerHTML = '';
    listaAutores.forEach(aut => {
        const fila = templateAutor.content.cloneNode(true);
        fila.querySelector('.col-id').textContent = aut.id_autor;
        fila.querySelector('.col-nombre').textContent = aut.nombre;
        fila.querySelector('.col-apellido').textContent = aut.apellido;
        fila.querySelector('.col-nacionalidad').textContent = aut.nacionalidad || 'N/A';
        fila.querySelector('.btn-editar').addEventListener('click', () => cargarAutorEnFormulario(aut));
        fila.querySelector('.btn-eliminar').addEventListener('click', () => eliminarAutor(aut.id_autor));
        cuerpoTablaAutores.appendChild(fila);
    });
}

formAutor.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = {
        nombre: inputNombreAutor.value.trim(),
        apellido: inputApellidoAutor.value.trim(),
        nacionalidad: inputNacAutor.value.trim()
    };
    const id = inputIdAutor.value;
    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `${urlAutores}/${id}` : urlAutores;

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const respDatos = await res.json();
        if (!res.ok) throw new Error(respDatos.mensaje);
        
        mostrarMensaje(respDatos.mensaje);
        limpiarFormAutor();
        await obtenerAutores();
    } catch (err) {
        mostrarMensaje(err.message, 'error');
    }
});

btnCancelarAutor.addEventListener('click', limpiarFormAutor);

function cargarAutorEnFormulario(aut) {
    inputIdAutor.value = aut.id_autor;
    inputNombreAutor.value = aut.nombre;
    inputApellidoAutor.value = aut.apellido;
    inputNacAutor.value = aut.nacionalidad || '';
    tituloFormAutor.textContent = 'Editar Autor';
    inputNombreAutor.focus();
}

function limpiarFormAutor() {
    formAutor.reset();
    inputIdAutor.value = '';
    tituloFormAutor.textContent = 'Agregar Autor';
}

async function eliminarAutor(id) {
    if (!confirm('¿Seguro que deseas eliminar este autor?')) return;
    try {
        const res = await fetch(`${urlAutores}/${id}`, { method: 'DELETE' });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.mensaje);
        mostrarMensaje(datos.mensaje);
        await obtenerAutores();
        await obtenerLibros();
    } catch (err) {
        mostrarMensaje(err.message, 'error');
    }
}

const formLibro = document.getElementById('formLibro');
const inputIdLibro = document.getElementById('id_libro');
const inputLibroTitulo = document.getElementById('libro_titulo');
const inputLibroIsbn = document.getElementById('libro_isbn');
const inputLibroAnio = document.getElementById('libro_anio');
const inputLibroStock = document.getElementById('libro_stock');
const selectLibroGenero = document.getElementById('libro_genero');
const containerLibroAutores = document.getElementById('libro_autores_container');
const btnCancelarLibro = document.getElementById('btnCancelarLibro');
const cuerpoTablaLibros = document.getElementById('cuerpoTablaLibros');
const templateLibro = document.getElementById('filaLibroTemplate');
const tituloFormLibro = document.getElementById('tituloFormLibro');

async function obtenerLibros() {
    try {
        const res = await fetch(urlLibros);
        listaLibros = await res.json();
        renderLibros();
        actualizarComboLibrosPrestamo();
    } catch (err) {
        console.error(err);
    }
}

function renderLibros() {
    cuerpoTablaLibros.innerHTML = '';
    listaLibros.forEach(lib => {
        const fila = templateLibro.content.cloneNode(true);
        fila.querySelector('.col-id').textContent = lib.id_libro;
        fila.querySelector('.col-isbn').textContent = lib.isbn;
        fila.querySelector('.col-titulo').textContent = lib.titulo;
        fila.querySelector('.col-autores').textContent = lib.autores;
        fila.querySelector('.col-genero').textContent = lib.nombre_genero || 'Sin género';
        fila.querySelector('.col-stock').textContent = lib.stock;
        
        const cellStock = fila.querySelector('.col-stock');
        if (lib.stock === 0) {
            cellStock.className = 'col-stock text-center text-danger fw-bold';
        } else {
            cellStock.className = 'col-stock text-center text-success';
        }

        fila.querySelector('.btn-editar').addEventListener('click', () => cargarLibroEnFormulario(lib.id_libro));
        fila.querySelector('.btn-eliminar').addEventListener('click', () => eliminarLibro(lib.id_libro));
        cuerpoTablaLibros.appendChild(fila);
    });
}

function actualizarCombosGeneros() {
    selectLibroGenero.innerHTML = '<option value="" disabled selected>Seleccione género...</option>';
    listaGeneros.forEach(gen => {
        const option = document.createElement('option');
        option.value = gen.id_genero;
        option.textContent = gen.nombre_genero;
        selectLibroGenero.appendChild(option);
    });
}

function actualizarChecklistAutores() {
    containerLibroAutores.innerHTML = '';
    if (listaAutores.length === 0) {
        containerLibroAutores.innerHTML = '<span class="text-secondary small italic">No hay autores registrados. Créalos primero.</span>';
        return;
    }
    listaAutores.forEach(aut => {
        const div = document.createElement('div');
        div.className = 'form-check form-check-inline m-1';
        div.innerHTML = `
            <input class="form-check-input check-autor" type="checkbox" value="${aut.id_autor}" id="chk_aut_${aut.id_autor}">
            <label class="form-check-label small font-monospace" for="chk_aut_${aut.id_autor}">
                ${aut.nombre} ${aut.apellido}
            </label>
        `;
        containerLibroAutores.appendChild(div);
    });
}

formLibro.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const checkboxes = containerLibroAutores.querySelectorAll('.check-autor:checked');
    const idsAutoresArr = Array.from(checkboxes).map(chk => Number(chk.value));

    const datos = {
        titulo: inputLibroTitulo.value.trim(),
        isbn: inputLibroIsbn.value.trim(),
        anio_publicacion: Number(inputLibroAnio.value),
        fk_id_genero: Number(selectLibroGenero.value),
        stock: Number(inputLibroStock.value),
        ids_autores: idsAutoresArr
    };

    const id = inputIdLibro.value;
    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `${urlLibros}/${id}` : urlLibros;

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const respDatos = await res.json();
        if (!res.ok) throw new Error(respDatos.mensaje);

        mostrarMensaje(respDatos.mensaje);
        limpiarFormLibro();
        await obtenerLibros();
    } catch (err) {
        mostrarMensaje(err.message, 'error');
    }
});

btnCancelarLibro.addEventListener('click', limpiarFormLibro);

async function cargarLibroEnFormulario(id) {
    try {
        const res = await fetch(`${urlLibros}/${id}`);
        const libro = await res.json();
        if (!res.ok) throw new Error(libro.mensaje);

        inputIdLibro.value = libro.id_libro;
        inputLibroTitulo.value = libro.titulo;
        inputLibroIsbn.value = libro.isbn;
        inputLibroAnio.value = libro.anio_publicacion;
        inputLibroStock.value = libro.stock;
        selectLibroGenero.value = libro.fk_id_genero;

        containerLibroAutores.querySelectorAll('.check-autor').forEach(chk => chk.checked = false);

        if (libro.ids_autores) {
            libro.ids_autores.forEach(idAutor => {
                const chk = document.getElementById(`chk_aut_${idAutor}`);
                if (chk) chk.checked = true;
            });
        }

        tituloFormLibro.textContent = 'Editar Libro';
        inputLibroTitulo.focus();
    } catch (err) {
        mostrarMensaje(err.message, 'error');
    }
}

function limpiarFormLibro() {
    formLibro.reset();
    inputIdLibro.value = '';
    tituloFormLibro.textContent = 'Agregar Libro';
    containerLibroAutores.querySelectorAll('.check-autor').forEach(chk => chk.checked = false);
}

async function eliminarLibro(id) {
    if (!confirm('¿Seguro que deseas eliminar este libro? Se eliminarán los préstamos asociados.')) return;
    try {
        const res = await fetch(`${urlLibros}/${id}`, { method: 'DELETE' });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.mensaje);
        mostrarMensaje(datos.mensaje);
        await obtenerLibros();
        await obtenerPrestamos();
    } catch (err) {
        mostrarMensaje(err.message, 'error');
    }
}

const formPrestamo = document.getElementById('formPrestamo');
const inputIdPrestamo = document.getElementById('id_prestamo');
const inputPrestamoCliente = document.getElementById('prestamo_cliente');
const selectPrestamoLibro = document.getElementById('prestamo_libro');
const selectPrestamoEstado = document.getElementById('prestamo_estado');
const inputPrestamoFechaP = document.getElementById('prestamo_fecha_p');
const inputPrestamoFechaD = document.getElementById('prestamo_fecha_d');
const btnCancelarPrestamo = document.getElementById('btnCancelarPrestamo');
const cuerpoTablaPrestamos = document.getElementById('cuerpoTablaPrestamos');
const templatePrestamo = document.getElementById('filaPrestamoTemplate');
const tituloFormPrestamo = document.getElementById('tituloFormPrestamo');

async function obtenerPrestamos() {
    try {
        const res = await fetch(urlPrestamos);
        listaPrestamos = await res.json();
        renderPrestamos();
    } catch (err) {
        console.error(err);
    }
}

function renderPrestamos() {
    cuerpoTablaPrestamos.innerHTML = '';
    listaPrestamos.forEach(p => {
        const fila = templatePrestamo.content.cloneNode(true);
        fila.querySelector('.col-id').textContent = p.id_prestamo;
        fila.querySelector('.col-cliente').textContent = p.nombre_cliente;
        fila.querySelector('.col-libro').textContent = p.titulo_libro || `ID Libro: ${p.fk_id_libro}`;
        fila.querySelector('.col-fecha-p').textContent = p.fecha_prestamo;
        fila.querySelector('.col-fecha-d').textContent = p.fecha_devolucion || '-';
        
        const colEstado = fila.querySelector('.col-estado');
        let badgeClass = 'bg-success';
        if (p.estado === 'DEVUELTO') badgeClass = 'bg-secondary';
        else if (p.estado === 'ATRASADO') badgeClass = 'bg-danger';
        colEstado.innerHTML = `<span class="badge ${badgeClass} font-monospace small">${p.estado}</span>`;

        const btnDevolver = fila.querySelector('.btn-devolver');
        if (p.estado === 'ACTIVO' || p.estado === 'ATRASADO') {
            btnDevolver.classList.remove('d-none');
            btnDevolver.addEventListener('click', () => registrarDevolucion(p.id_prestamo));
        }

        fila.querySelector('.btn-editar').addEventListener('click', () => cargarPrestamoEnFormulario(p));
        fila.querySelector('.btn-eliminar').addEventListener('click', () => eliminarPrestamo(p.id_prestamo));
        cuerpoTablaPrestamos.appendChild(fila);
    });
}

function actualizarComboLibrosPrestamo() {
    selectPrestamoLibro.innerHTML = '<option value="" disabled selected>Seleccione libro...</option>';
    listaLibros.forEach(lib => {
        const option = document.createElement('option');
        option.value = lib.id_libro;
        option.textContent = `${lib.titulo} (Stock: ${lib.stock})`;
        selectPrestamoLibro.appendChild(option);
    });
}

formPrestamo.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = {
        nombre_cliente: inputPrestamoCliente.value.trim(),
        fk_id_libro: Number(selectPrestamoLibro.value),
        fecha_prestamo: inputPrestamoFechaP.value,
        fecha_devolucion: inputPrestamoFechaD.value ? inputPrestamoFechaD.value : null,
        estado: selectPrestamoEstado.value
    };

    const id = inputIdPrestamo.value;
    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `${urlPrestamos}/${id}` : urlPrestamos;

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const respDatos = await res.json();
        if (!res.ok) throw new Error(respDatos.mensaje);

        mostrarMensaje(respDatos.mensaje);
        limpiarFormPrestamo();
        await obtenerPrestamos();
        await obtenerLibros();
    } catch (err) {
        mostrarMensaje(err.message, 'error');
    }
});

btnCancelarPrestamo.addEventListener('click', limpiarFormPrestamo);

function cargarPrestamoEnFormulario(p) {
    inputIdPrestamo.value = p.id_prestamo;
    inputPrestamoCliente.value = p.nombre_cliente;
    selectPrestamoLibro.value = p.fk_id_libro;
    selectPrestamoEstado.value = p.estado;
    inputPrestamoFechaP.value = p.fecha_prestamo;
    inputPrestamoFechaD.value = p.fecha_devolucion || '';
    
    tituloFormPrestamo.textContent = 'Editar Registro Préstamo';
    inputPrestamoCliente.focus();
}

function limpiarFormPrestamo() {
    formPrestamo.reset();
    inputIdPrestamo.value = '';
    tituloFormPrestamo.textContent = 'Registrar Préstamo Manual';
}

async function registrarDevolucion(id) {
    if (!confirm('¿Desea registrar la devolución de este libro ahora?')) return;
    try {
        const res = await fetch(`${urlPrestamos}/${id}/devolver`, { method: 'PUT' });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.mensaje);

        mostrarMensaje(datos.mensaje);
        await obtenerPrestamos();
        await obtenerLibros();
    } catch (err) {
        mostrarMensaje(err.message, 'error');
    }
}

async function eliminarPrestamo(id) {
    if (!confirm('¿Seguro que deseas eliminar este préstamo? Si estaba ACTIVO se reintegrará el stock del libro.')) return;
    try {
        const res = await fetch(`${urlPrestamos}/${id}`, { method: 'DELETE' });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.mensaje);
        mostrarMensaje(datos.mensaje);
        await obtenerPrestamos();
        await obtenerLibros();
    } catch (err) {
        mostrarMensaje(err.message, 'error');
    }
}

const formUsuario = document.getElementById('formUsuario');
const inputIdUsuario = document.getElementById('id_usuario');
const inputUsuarioNombre = document.getElementById('usuario_nombre');
const inputUsuarioPass = document.getElementById('usuario_pass');
const lblUsuarioPass = document.getElementById('lblUsuarioPass');
const btnCancelarUsuario = document.getElementById('btnCancelarUsuario');
const cuerpoTablaUsuarios = document.getElementById('cuerpoTablaUsuarios');
const templateUsuario = document.getElementById('filaUsuarioTemplate');
const tituloFormUsuario = document.getElementById('tituloFormUsuario');

async function obtenerUsuarios() {
    try {
        const res = await fetch(urlUsuarios);
        listaUsuarios = await res.json();
        renderUsuarios();
    } catch (err) {
        console.error(err);
    }
}

function renderUsuarios() {
    cuerpoTablaUsuarios.innerHTML = '';
    listaUsuarios.forEach(user => {
        const fila = templateUsuario.content.cloneNode(true);
        fila.querySelector('.col-id').textContent = user.id_usuario;
        fila.querySelector('.col-nombre').textContent = user.nombre_usuario;
        fila.querySelector('.col-rol').textContent = user.rol;
        fila.querySelector('.btn-editar').addEventListener('click', () => cargarUsuarioEnFormulario(user));
        fila.querySelector('.btn-eliminar').addEventListener('click', () => eliminarUsuario(user.id_usuario));
        cuerpoTablaUsuarios.appendChild(fila);
    });
}

formUsuario.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = {
        nombre_usuario: inputUsuarioNombre.value.trim(),
        password: inputUsuarioPass.value,
        rol: 'ADMIN'
    };

    const id = inputIdUsuario.value;
    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `${urlUsuarios}/${id}` : urlUsuarios;

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const respDatos = await res.json();
        if (!res.ok) throw new Error(respDatos.mensaje);

        mostrarMensaje(respDatos.mensaje);
        limpiarFormUsuario();
        await obtenerUsuarios();
    } catch (err) {
        mostrarMensaje(err.message, 'error');
    }
});

btnCancelarUsuario.addEventListener('click', limpiarFormUsuario);

function cargarUsuarioEnFormulario(user) {
    inputIdUsuario.value = user.id_usuario;
    inputUsuarioNombre.value = user.nombre_usuario;
    inputUsuarioPass.value = '';
    inputUsuarioPass.required = false;
    lblUsuarioPass.textContent = 'Nueva Contraseña (dejar en blanco para no modificar)';
    
    tituloFormUsuario.textContent = 'Editar Administrador';
    inputUsuarioNombre.focus();
}

function limpiarFormUsuario() {
    formUsuario.reset();
    inputIdUsuario.value = '';
    inputUsuarioPass.required = true;
    lblUsuarioPass.textContent = 'Contraseña';
    tituloFormUsuario.textContent = 'Agregar Administrador';
}

async function eliminarUsuario(id) {
    if (!confirm('¿Seguro que deseas eliminar este administrador?')) return;
    try {
        const res = await fetch(`${urlUsuarios}/${id}`, { method: 'DELETE' });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.mensaje);
        mostrarMensaje(datos.mensaje);
        await obtenerUsuarios();
    } catch (err) {
        mostrarMensaje(err.message, 'error');
    }
}
