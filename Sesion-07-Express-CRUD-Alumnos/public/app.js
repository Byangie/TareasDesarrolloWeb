/**
 * app.js — Lógica del sitio (Fetch + Dialogs)
 * Tarea Sesión 7 · Desarrollo Web · UMG
 *
 * TODO: implementa las funciones marcadas. La API exige el header
 * `x-api-key` en las operaciones de escritura (POST, PUT, DELETE).
 */

const API = '/alumnos';
const API_KEY = 'umg-2026'; // debe coincidir con config.env

// Helper ya resuelto: cabeceras para las peticiones
const cabeceras = (conJson = true) => ({
    ...(conJson ? { 'Content-Type': 'application/json' } : {}),
    'x-api-key': API_KEY,
});

// Referencias del DOM (ya resueltas)
const tabla = document.querySelector('#tablaAlumnos tbody');
const mensaje = document.querySelector('#mensaje');
const dialogoForm = document.querySelector('#dialogoForm');
const dialogoEliminar = document.querySelector('#dialogoEliminar');
const form = document.querySelector('#formAlumno');
const tituloForm = document.querySelector('#tituloForm');
const nombreEliminar = document.querySelector('#nombreEliminar');

let idEnEdicion = null;        // null = crear | string = editar
let idAEliminar = null;

/**
 * TODO: GET /alumnos y pinta las filas en la tabla.
 * Cada fila debe incluir botones "Editar" y "Eliminar".
 */
async function cargarAlumnos() {
    const respuesta = await fetch(API);
    const alumnos = await respuesta.json();

    tabla.innerHTML = alumnos.map((alumno) => {
        return `
            <tr>
                <td>${alumno.id}</td>
                <td>${alumno.nombre}</td>
                <td>${alumno.apellido}</td>
                <td>${alumno.email}</td>
                <td>${alumno.edad}</td>
                <td>
                    <button type="button" class="btnEditar" data-id="${alumno.id}">
                        Editar
                    </button>
                    <button type="button" class="btnEliminar" data-id="${alumno.id}">
                        Eliminar
                    </button>

                </td>
            </tr>
        `;
    }).join('');

    document.querySelectorAll('.btnEditar').forEach((boton) => {
        boton.addEventListener('click', () => {
            abrirDialogoEditar(boton.dataset.id);
        });
    });

    document.querySelectorAll('.btnEliminar').forEach((boton) => {
        boton.addEventListener('click', () => {
            eliminarAlumno(boton.dataset.id);
        });
    });
}

/**
 * TODO: limpia el formulario, pone el título "Nuevo alumno",
 * idEnEdicion = null y abre dialogoForm con showModal().
 */
function abrirDialogoNuevo() {
    form.reset();
    tituloForm.textContent = 'Nuevo alumno';
    idEnEdicion = null;
    dialogoForm.showModal();
}

/**
 * TODO: precarga los datos del alumno en el formulario,
 * guarda su id en idEnEdicion, cambia el título a "Editar alumno"
 * y abre dialogoForm.
 */
async function abrirDialogoEditar(id) {
    const respuesta = await fetch(`${API}/${id}`);
    const alumno = await respuesta.json();

    form.elements.nombre.value = alumno.nombre;
    form.elements.apellido.value = alumno.apellido;
    form.elements.email.value = alumno.email;
    form.elements.edad.value = alumno.edad;

    idEnEdicion = id;
    tituloForm.textContent = 'Editar alumno';
    dialogoForm.showModal();
}

/**
 * TODO: lee los campos del formulario y llama a la API.
 *   - Si idEnEdicion es null → POST /alumnos            (201)
 *   - Si hay id             → PUT /alumnos/:id          (200)
 * Usa cabeceras() y JSON.stringify(). Al terminar: cierra el dialog,
 * recarga la lista y muestra un mensaje.
 */
async function guardarAlumno(event) {
    event.preventDefault();

    const datos = {
        nombre: form.elements.nombre.value,
        apellido: form.elements.apellido.value,
        email: form.elements.email.value,
        edad: form.elements.edad.value
            ? Number(form.elements.edad.value)
            : undefined
    };
    
    const metodo = idEnEdicion === null ? 'POST' : 'PUT';

    const url = idEnEdicion === null 
        ? API
        : `${API}/${idEnEdicion}`;

    const respuesta = await fetch(url, {
        method: metodo,
        headers: cabeceras(),
        body: JSON.stringify(datos)
    });

    if (!respuesta.ok){
        mostrarMensaje('No se pudo guarda el alumno', 'error');
        return;
    }

    dialogoForm.close();
    await cargarAlumnos();
    mostrarMensaje('Alumno guardado correctamente');
}

/**
 * TODO: abre dialogoEliminar guardando el id, y al confirmar hace
 * DELETE /alumnos/:id con cabeceras(false). Luego recarga y avisa.
 */
function eliminarAlumno(id) {
    idAEliminar = id;
    dialogoEliminar.showModal();

}

/**
 * TODO: helper para mostrar mensajes (error en rojo, éxito en verde).
 */
function mostrarMensaje(texto, tipo = 'ok') {
    mensaje.textContent = texto;
    mensaje.className = tipo;
    
}

// ============================================================
// Conexión de eventos (TODO: completa lo que falte)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // TODO: botón "Nuevo alumno" → abrirDialogoNuevo()
    document.querySelector('#btnNuevo')
        .addEventListener('click', abrirDialogoNuevo);
    // TODO: form submit → guardarAlumno(event)
    form.addEventListener('submit', guardarAlumno);
    // TODO: botón cancelar → dialogoForm.close()
    document.querySelector('#btnCancelar')
        .addEventListener('click', () => dialogoForm.close());

    // TODO: botón cancelar eliminar → dialogoEliminar.close()
    document.querySelector('#btnCancelarEliminar')
        .addEventListener('click',() => dialogoEliminar.close());
    // TODO: botón confirmar eliminar → ejecutar el DELETE
    document.querySelector('#btnConfirmarEliminar')
        .addEventListener('click', async () => {
            const respuesta = await fetch(`${API}/${idAEliminar}`, {
                method: 'DELETE',
                headers: cabeceras(false)     
            });

            if(!respuesta.ok){
                mostrarMensaje('No se pudo eliminar el alumno', 'error');
                return;
            }

            dialogoEliminar.close();
            await cargarAlumnos();
            mostrarMensaje('Alumno eliminado correctamente');

        });
    // TODO: llamar cargarAlumnos() al iniciar
    cargarAlumnos();
});
