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
let autoresSeleccionados = [];
let voucherData = null;
let modalVoucherEl = null;

document.addEventListener('DOMContentLoaded', async () => {
    await validarSesion();
    await Promise.all([
        obtenerGeneros(),
        obtenerAutores(),
        obtenerLibros(),
        obtenerPrestamos(),
        obtenerUsuarios()
    ]);
    inicializarAutocompletarAutores();
    inicializarValidadorISBN();
    inicializarFechaDevolucion();
    inicializarVoucher();
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
    renderAutoresBadges();
}

function renderAutoresBadges() {
    containerLibroAutores.innerHTML = '';
    if (autoresSeleccionados.length === 0) {
        containerLibroAutores.innerHTML = '<span class="text-secondary small italic">Ningún autor seleccionado. Utilice el buscador superior.</span>';
        return;
    }
    autoresSeleccionados.forEach(id => {
        const aut = listaAutores.find(a => a.id_autor === id);
        if (!aut) return;
        const badge = document.createElement('span');
        badge.className = 'badge bg-primary d-flex align-items-center gap-2 p-2 rounded-pill font-monospace';
        badge.innerHTML = `
            ${aut.nombre} ${aut.apellido}
            <button type="button" class="btn-close btn-close-white btn-sm" style="font-size: 0.6rem;" onclick="eliminarAutorSeleccionado(${id})"></button>
        `;
        containerLibroAutores.appendChild(badge);
    });
}

window.eliminarAutorSeleccionado = function(id) {
    autoresSeleccionados = autoresSeleccionados.filter(item => item !== id);
    renderAutoresBadges();
};

formLibro.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (inputLibroIsbn.classList.contains('is-invalid')) {
        mostrarMensaje('Por favor, ingrese un ISBN válido antes de guardar.', 'error');
        return;
    }

    const idsAutoresArr = autoresSeleccionados;
    if (idsAutoresArr.length === 0) {
        mostrarMensaje('Debe seleccionar al menos un autor para el libro', 'error');
        return;
    }

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

        autoresSeleccionados = libro.ids_autores || [];
        renderAutoresBadges();

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
    autoresSeleccionados = [];
    renderAutoresBadges();
    inputLibroIsbn.classList.remove('is-valid', 'is-invalid');
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
        const tr = fila.querySelector('tr');
        fila.querySelector('.col-id').textContent = p.id_prestamo;
        fila.querySelector('.col-cliente').textContent = p.nombre_cliente;
        fila.querySelector('.col-libro').textContent = p.titulo_libro || `ID Libro: ${p.fk_id_libro}`;
        fila.querySelector('.col-fecha-p').textContent = p.fecha_prestamo;
        fila.querySelector('.col-fecha-d').textContent = p.fecha_devolucion;
        
        const colEstado = fila.querySelector('.col-estado');
        let badgeClass = 'bg-success';
        if (p.estado === 'DEVUELTO') {
            badgeClass = 'bg-secondary';
            colEstado.innerHTML = `<span class="badge ${badgeClass} font-monospace small">${p.estado}</span>`;
        } else if (p.estado === 'ATRASADO') {
            badgeClass = 'bg-danger';
            
            // Calcular multa ($500 por cada día de atraso)
            const hoyDate = new Date();
            hoyDate.setHours(0,0,0,0);
            const devDate = new Date(p.fecha_devolucion + 'T00:00:00');
            const diffTime = hoyDate - devDate;
            const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            const multa = diffDays * 500;
            
            colEstado.innerHTML = `
                <span class="badge ${badgeClass} font-monospace small">${p.estado}</span>
                <div class="text-danger small fw-bold mt-1" style="font-size: 0.75rem;">⚠️ Multa: $${multa}<br>(${diffDays} días de retraso)</div>
            `;
            
            // Resaltar fila con borde rojo
            tr.style.outline = '2px solid #ff4d4d';
            tr.style.outlineOffset = '-2px';
        } else {
            colEstado.innerHTML = `<span class="badge ${badgeClass} font-monospace small">${p.estado}</span>`;
        }

        const btnDevolver = fila.querySelector('.btn-devolver');
        if (p.estado === 'ACTIVO' || p.estado === 'ATRASADO') {
            btnDevolver.classList.remove('d-none');
            btnDevolver.addEventListener('click', () => registrarDevolucion(p.id_prestamo));
        }
        
        fila.querySelector('.btn-voucher').addEventListener('click', () => {
            mostrarVoucher({
                id_prestamo: p.id_prestamo,
                nombre_cliente: p.nombre_cliente,
                titulo_libro: p.titulo_libro,
                isbn_libro: p.isbn_libro,
                fecha_prestamo: p.fecha_prestamo,
                fecha_devolucion: p.fecha_devolucion
            });
        });

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
    
    calcularFechaDevolucion(); // Garantizar cálculo
    
    const datos = {
        nombre_cliente: inputPrestamoCliente.value.trim(),
        fk_id_libro: Number(selectPrestamoLibro.value),
        fecha_prestamo: inputPrestamoFechaP.value,
        fecha_devolucion: inputPrestamoFechaD.value,
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
        
        if (metodo === 'POST' && respDatos.prestamo) {
            mostrarVoucher(respDatos.prestamo);
        }
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
    
    const selectIntervalo = document.getElementById('prestamo_intervalo');
    const inputDiasC = document.getElementById('prestamo_dias_c');
    const grupoDiasPersonalizados = document.getElementById('grupo_dias_personalizados');
    
    const diffTime = Math.abs(new Date(p.fecha_devolucion + 'T00:00:00') - new Date(p.fecha_prestamo + 'T00:00:00'));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 7 || diffDays === 14 || diffDays === 30) {
        selectIntervalo.value = String(diffDays);
        grupoDiasPersonalizados.style.display = 'none';
        inputDiasC.required = false;
    } else {
        selectIntervalo.value = 'custom';
        inputDiasC.value = diffDays;
        grupoDiasPersonalizados.style.display = 'block';
        inputDiasC.required = true;
    }
    inputPrestamoFechaD.value = p.fecha_devolucion;
    
    tituloFormPrestamo.textContent = 'Editar Registro Préstamo';
    inputPrestamoCliente.focus();
}

function limpiarFormPrestamo() {
    formPrestamo.reset();
    inputIdPrestamo.value = '';
    document.getElementById('prestamo_intervalo').value = '7';
    document.getElementById('grupo_dias_personalizados').style.display = 'none';
    document.getElementById('prestamo_dias_c').required = false;
    tituloFormPrestamo.textContent = 'Registrar Préstamo Manual';
    
    const hoy = new Date().toISOString().slice(0, 10);
    document.getElementById('prestamo_fecha_p').value = hoy;
    calcularFechaDevolucion();
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

// ==========================================
// Nuevas funciones de validación e inicialización
// ==========================================

function inicializarAutocompletarAutores() {
    const inputAutoresBusqueda = document.getElementById('libro_autores_input');
    const dropdownAutores = document.getElementById('autores_dropdown');
    
    function mostrarTodosLosAutores() {
        dropdownAutores.innerHTML = '';
        const filtro = inputAutoresBusqueda.value.toLowerCase().trim();
        const autoresFiltrados = listaAutores.filter(aut => {
            const nombreCompleto = `${aut.nombre} ${aut.apellido}`.toLowerCase();
            return nombreCompleto.includes(filtro);
        });
        
        if (autoresFiltrados.length === 0) {
            dropdownAutores.innerHTML = '<div class="dropdown-item text-secondary disabled py-2">No se encontraron autores</div>';
            dropdownAutores.style.display = 'block';
            return;
        }
        
        autoresFiltrados.forEach(aut => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'dropdown-item text-white py-2 border-bottom border-secondary border-opacity-25';
            
            const yaSeleccionado = autoresSeleccionados.includes(aut.id_autor);
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center font-monospace small">
                    <span>${aut.nombre} ${aut.apellido}</span>
                    ${yaSeleccionado ? '<span class="badge bg-success rounded-pill font-monospace" style="font-size: 0.6rem;">Seleccionado</span>' : ''}
                </div>
            `;
            
            item.addEventListener('click', () => {
                if (!yaSeleccionado) {
                    autoresSeleccionados.push(aut.id_autor);
                    renderAutoresBadges();
                }
                inputAutoresBusqueda.value = '';
                dropdownAutores.style.display = 'none';
            });
            dropdownAutores.appendChild(item);
        });
        
        dropdownAutores.style.display = 'block';
    }
    
    inputAutoresBusqueda.addEventListener('click', mostrarTodosLosAutores);
    inputAutoresBusqueda.addEventListener('input', mostrarTodosLosAutores);
    
    document.addEventListener('click', (e) => {
        if (e.target !== inputAutoresBusqueda && e.target !== dropdownAutores && !dropdownAutores.contains(e.target)) {
            dropdownAutores.style.display = 'none';
        }
    });
}

function validarISBN(isbn) {
    const clean = isbn.replace(/[- ]/g, "");
    if (clean.length === 10) {
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            const digit = parseInt(clean[i]);
            if (isNaN(digit)) return false;
            sum += digit * (10 - i);
        }
        let last = clean[9].toUpperCase();
        let lastVal = 0;
        if (last === 'X') {
            lastVal = 10;
        } else {
            lastVal = parseInt(last);
            if (isNaN(lastVal)) return false;
        }
        sum += lastVal;
        return sum % 11 === 0;
    } else if (clean.length === 13) {
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(clean[i]);
            if (isNaN(digit)) return false;
            sum += digit * (i % 2 === 0 ? 1 : 3);
        }
        const check = parseInt(clean[12]);
        if (isNaN(check)) return false;
        const calcCheck = (10 - (sum % 10)) % 10;
        return calcCheck === check;
    }
    return false;
}

function inicializarValidadorISBN() {
    inputLibroIsbn.addEventListener('input', () => {
        const val = inputLibroIsbn.value.trim();
        if (val === '') {
            inputLibroIsbn.classList.remove('is-valid', 'is-invalid');
            return;
        }
        if (validarISBN(val)) {
            inputLibroIsbn.classList.add('is-valid');
            inputLibroIsbn.classList.remove('is-invalid');
        } else {
            inputLibroIsbn.classList.add('is-invalid');
            inputLibroIsbn.classList.remove('is-valid');
        }
    });
}

function calcularFechaDevolucion() {
    const fechaP = inputPrestamoFechaP.value;
    if (!fechaP) return;
    
    const selectIntervalo = document.getElementById('prestamo_intervalo');
    const inputDiasC = document.getElementById('prestamo_dias_c');
    let dias = 7;
    if (selectIntervalo.value === 'custom') {
        dias = parseInt(inputDiasC.value) || 0;
    } else {
        dias = parseInt(selectIntervalo.value) || 7;
    }
    
    const date = new Date(fechaP + 'T00:00:00');
    date.setDate(date.getDate() + dias);
    
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    
    inputPrestamoFechaD.value = `${anio}-${mes}-${dia}`;
}

function inicializarFechaDevolucion() {
    const selectIntervalo = document.getElementById('prestamo_intervalo');
    const inputDiasC = document.getElementById('prestamo_dias_c');
    const grupoDiasPersonalizados = document.getElementById('grupo_dias_personalizados');
    
    selectIntervalo.addEventListener('change', () => {
        if (selectIntervalo.value === 'custom') {
            grupoDiasPersonalizados.style.display = 'block';
            inputDiasC.required = true;
        } else {
            grupoDiasPersonalizados.style.display = 'none';
            inputDiasC.required = false;
        }
        calcularFechaDevolucion();
    });
    
    inputDiasC.addEventListener('input', calcularFechaDevolucion);
    inputPrestamoFechaP.addEventListener('change', calcularFechaDevolucion);
    
    const hoy = new Date().toISOString().slice(0, 10);
    inputPrestamoFechaP.value = hoy;
    calcularFechaDevolucion();
}

function mostrarVoucher(prestamo) {
    voucherData = prestamo;
    document.getElementById('contenidoVoucher').innerHTML = `
        <div class="p-3 border border-secondary rounded bg-black text-start font-monospace">
            <h6 class="text-center fw-bold text-success mb-3">🎫 VOUCHER DE PRÉSTAMO</h6>
            <p class="mb-1"><strong>Folio Préstamo:</strong> #${prestamo.id_prestamo}</p>
            <p class="mb-1"><strong>Cliente:</strong> ${prestamo.nombre_cliente}</p>
            <p class="mb-1"><strong>Libro:</strong> ${prestamo.titulo_libro}</p>
            <p class="mb-1"><strong>ISBN:</strong> ${prestamo.isbn_libro || '-'}</p>
            <p class="mb-1"><strong>F. Préstamo:</strong> ${prestamo.fecha_prestamo}</p>
            <p class="mb-1"><strong>F. Devolución Obligatoria:</strong> <span class="text-warning fw-bold">${prestamo.fecha_devolucion}</span></p>
            <hr class="border-secondary my-2">
            <p class="small text-center text-secondary mb-0">Por favor, devuelva el libro a tiempo para evitar multas de $500 por día de atraso.</p>
        </div>
    `;
    modalVoucherEl.show();
}

function inicializarVoucher() {
    modalVoucherEl = new bootstrap.Modal(document.getElementById('modalVoucher'));
    
    document.getElementById('btnDescargarPDF').addEventListener('click', () => {
        if (!voucherData) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 140]
        });
        
        // Dibujar un bloque de encabezado azul/gris oscuro premium
        doc.setFillColor(33, 37, 41);
        doc.rect(0, 0, 80, 25, "F");
        
        // Título del encabezado
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("ALÉRGICOS A LEER", 40, 10, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text("VOUCHER DE PRÉSTAMO OFICIAL", 40, 16, { align: "center" });
        
        // Resetear color de texto
        doc.setTextColor(33, 37, 41);
        
        let y = 35;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`Folio Préstamo: #${voucherData.id_prestamo}`, 10, y);
        
        // Línea divisoria
        y += 3;
        doc.setDrawColor(200, 200, 200);
        doc.line(10, y, 70, y);
        
        y += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("CLIENTE:", 10, y);
        doc.setFont("helvetica", "normal");
        doc.text(voucherData.nombre_cliente, 30, y);
        
        y += 6;
        doc.setFont("helvetica", "bold");
        doc.text("LIBRO:", 10, y);
        doc.setFont("helvetica", "normal");
        const splitTitle = doc.splitTextToSize(voucherData.titulo_libro, 40);
        if (splitTitle.length > 1) {
            splitTitle.forEach((line, index) => {
                doc.text(line, 30, y);
                if (index < splitTitle.length - 1) y += 5;
            });
        } else {
            doc.text(voucherData.titulo_libro, 30, y);
        }
        
        y += 8;
        doc.setFont("helvetica", "bold");
        doc.text("ISBN:", 10, y);
        doc.setFont("helvetica", "normal");
        doc.text(voucherData.isbn_libro || '-', 30, y);
        
        y += 6;
        doc.setFont("helvetica", "bold");
        doc.text("PRÉSTAMO:", 10, y);
        doc.setFont("helvetica", "normal");
        doc.text(voucherData.fecha_prestamo, 30, y);
        
        y += 6;
        doc.setFont("helvetica", "bold");
        doc.text("VENCE EL:", 10, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(220, 53, 69); // Rojo para alertar fecha de devolución
        doc.text(voucherData.fecha_devolucion, 30, y);
        
        // Restaurar color
        doc.setTextColor(33, 37, 41);
        
        // Pie de página
        y += 10;
        doc.setDrawColor(200, 200, 200);
        doc.line(10, y, 70, y);
        
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text("Por favor, devuelva el libro en el plazo establecido.", 40, y, { align: "center" });
        y += 4;
        doc.text("Evite multas de $500 por cada día de atraso.", 40, y, { align: "center" });
        y += 6;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 167, 69); // Verde para el agradecimiento
        doc.text("¡Gracias por su preferencia!", 40, y, { align: "center" });
        
        doc.save(`Voucher_Prestamo_${voucherData.id_prestamo}.pdf`);
    });
}
