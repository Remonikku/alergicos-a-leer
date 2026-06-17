const apiLibrosUrl = '/api/libros';
const apiPrestamosUrl = '/api/prestamos/public';

const formulario = document.getElementById('formularioPrestamo');
const nombreCliente = document.getElementById('nombre_cliente');
const selectLibro = document.getElementById('fk_id_libro');
const cuerpoTabla = document.getElementById('cuerpoTablaLibros');
const templateFila = document.getElementById('filaLibroTemplate');
const sinRegistros = document.getElementById('sinRegistros');
const mensaje = document.getElementById('mensaje');
const btnGuardar = document.getElementById('btnGuardar');

let listaLibros = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarCatalogo();
});

formulario.addEventListener('submit', async (e) => {
    e.preventDefault();
    await solicitarPrestamo();
});

async function cargarCatalogo() {
    try {
        const respuesta = await fetch(apiLibrosUrl);
        const datos = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(datos.mensaje);
        }
        listaLibros = datos;
        mostrarLibros();
        cargarComboLibros();
    } catch (error) {
        mostrarMensaje('No se pudo cargar el catálogo de libros', 'error');
        console.error(error);
    }
}

function mostrarLibros() {
    cuerpoTabla.innerHTML = '';
    if (listaLibros.length === 0) {
        sinRegistros.classList.remove('d-none');
        return;
    }
    sinRegistros.classList.add('d-none');
    
    listaLibros.forEach((libro) => {
        const fila = templateFila.content.cloneNode(true);
        fila.querySelector('.libro-isbn').textContent = libro.isbn;
        fila.querySelector('.libro-titulo').textContent = libro.titulo;
        fila.querySelector('.libro-autores').textContent = libro.autores;
        fila.querySelector('.libro-genero').textContent = libro.nombre_genero || 'Sin género';
        fila.querySelector('.libro-anio').textContent = libro.anio_publicacion;
        
        const cellStock = fila.querySelector('.libro-stock');
        cellStock.textContent = libro.stock;
        
        const btnPedir = fila.querySelector('.btn-pedir');
        
        if (libro.stock <= 0) {
            cellStock.className = 'libro-stock text-center text-danger';
            btnPedir.classList.remove('btn-outline-info');
            btnPedir.classList.add('btn-outline-secondary', 'disabled');
            btnPedir.textContent = 'Agotado';
        } else {
            cellStock.className = 'libro-stock text-center text-success';
            btnPedir.addEventListener('click', () => {
                seleccionarLibro(libro.id_libro);
            });
        }
        cuerpoTabla.appendChild(fila);
    });
}

function cargarComboLibros() {
    selectLibro.innerHTML = '<option value="" disabled selected>Seleccione un libro...</option>';
    listaLibros.forEach((libro) => {
        const option = document.createElement('option');
        option.value = libro.id_libro;
        if (libro.stock <= 0) {
            option.textContent = `${libro.titulo} (Sin Stock)`;
            option.disabled = true;
        } else {
            option.textContent = `${libro.titulo} (${libro.stock} disponibles)`;
        }
        selectLibro.appendChild(option);
    });
}

function seleccionarLibro(idLibro) {
    selectLibro.value = idLibro;
    nombreCliente.focus();
    
    window.scrollTo({
        top: formulario.getBoundingClientRect().top + window.scrollY - 100,
        behavior: 'smooth'
    });
}

async function solicitarPrestamo() {
    const nombre = nombreCliente.value.trim();
    const idLibro = selectLibro.value;
    
    if (nombre === '' || !idLibro) {
        mostrarMensaje('Completa tu nombre y selecciona un libro', 'error');
        return;
    }
    
    const datos = {
        nombre_cliente: nombre,
        fk_id_libro: Number(idLibro)
    };
    
    try {
        btnGuardar.disabled = true;
        const respuesta = await fetch(apiPrestamosUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        
        const resultado = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(resultado.mensaje);
        }
        
        mostrarMensaje(resultado.mensaje, 'exito');
        formulario.reset();
        await cargarCatalogo();
    } catch (error) {
        mostrarMensaje(error.message || 'Error al solicitar el préstamo', 'error');
        console.error(error);
    } finally {
        btnGuardar.disabled = false;
    }
}

function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = tipo === 'exito'
        ? 'alert alert-success'
        : 'alert alert-danger';
    setTimeout(() => {
        mensaje.className = 'alert d-none';
        mensaje.textContent = '';
    }, 4000);
}
