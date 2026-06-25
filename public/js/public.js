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
let voucherData = null;
let modalVoucherEl = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarCatalogo();
    inicializarVoucher();
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
        
        if (resultado.prestamo) {
            mostrarVoucher(resultado.prestamo);
        }
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
