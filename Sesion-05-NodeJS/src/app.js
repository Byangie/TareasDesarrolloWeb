/**
 * Servidor HTTP con Node.js — Tarea Sesión 5
 * Universidad Mariano Gálvez de Guatemala · Desarrollo Web
 *
 * Implementa las funciones marcadas con TODO para que los tests pasen.
 * No cambies los nombres exportados ni su firma.
 *
 * Temas de la sesión aplicados aquí:
 *   - process.argv            → parsearArgumentos
 *   - variables de entorno    → obtenerConfig
 *   - módulo os               → infoSistema
 *   - EventEmitter            → crearLogger
 *   - módulo fs/promises      → leerMensajes / agregarMensaje
 *   - módulo http             → crearServidor / iniciarServidor
 */

import http from 'node:http';
import { EventEmitter } from 'node:events';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

// =====================================================
// Utilidades (ya implementadas — no las modifiques)
// =====================================================

/**
 * Crea un id único para cada mensaje.
 * @returns {string}
 */
export function generarId() {
    return `m-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

/**
 * Lee el body (cuerpo) de una petición HTTP como string.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<string>}
 */
function leerBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => (data += chunk));
        req.on('end', () => resolve(data));
        req.on('error', reject);
    });
}

// =====================================================
// TODO: implementa las siguientes funciones
// =====================================================

/**
 * Parsea los argumentos de la línea de comandos (process.argv).
 * Acepta: --nombre <valor> y --puerto <valor>.
 * Valores por defecto: nombre = "invitado", puerto = 3000.
 *
 * @param {string[]} argv - Arreglo completo (incluye las posiciones 0 y 1).
 * @returns {{ nombre: string, puerto: number }}
 */
export function parsearArgumentos(argv) {
    let nombre = 'invitado';
    let puerto = 3000;

    const indiceNombre = argv.indexOf('--nombre');
    const indicePuerto = argv.indexOf('--puerto');

    if (indiceNombre !== -1 && argv[indiceNombre + 1] && !argv[indiceNombre + 1].startsWith('--')){
        nombre = argv[indiceNombre + 1];
    }

    if (indicePuerto !== -1 && argv[indicePuerto + 1 ] && !argv[indicePuerto + 1].startsWith('--')){
        puerto = Number(argv[indicePuerto + 1]);
    }

    return {nombre, puerto};
}

/**
 * Construye la configuración de la app a partir de variables de entorno.
 * Lee: PORT, NOMBRE_APP y ARCHIVO_DATOS.
 * Valores por defecto: puerto 3000, nombreApp "mensajes-api",
 * archivoDatos "data/mensajes.json".
 *
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ puerto: number, nombreApp: string, archivoDatos: string }}
 */
export function obtenerConfig(env) {
    const puerto = env.PORT ? Number(env.PORT) : 3000;
    const nombreApp = env.NOMBRE_APP || 'mensajes-api';
    const archivoDatos = env.ARCHIVO_DATOS || 'data/mensajes.json';

    return {
        puerto,
        nombreApp,
        archivoDatos
    };
}

/**
 * Devuelve información del sistema usando el módulo os.
 * @returns {{ plataforma: string, nucleos: number, memoriaLibreMB: number, hostname: string }}
 */
export function infoSistema() {
    const plataforma = os.platform();
    const nucleos = os.cpus().length;
    const memoriaLibreMB = Math.round(os.freemem() / 1024 / 1024);
    const hostname = os.hostname();

    return {
        plataforma,
        nucleos,
        memoriaLibreMB,
        hostname
    };
    
}

/**
 * Crea un logger basado en EventEmitter.
 * Devuelve un objeto con dos métodos:
 *   - registrar(mensaje): emite el evento "registro" con la cadena
 *     `[<fecha ISO>] <mensaje>`.
 *   - onRegistro(fn): suscribe fn al evento "registro".
 *
 * @returns {{ registrar: (mensaje: string) => void, onRegistro: (fn: (linea: string) => void) => void }}
 */
export function crearLogger() {
    const emitter = new EventEmitter();

    function registrar(mensaje){
        const fecha = new Date().toISOString();
        const linea = `[${fecha}] ${mensaje}`;

        emitter.emit('registro', linea);

    }

    function onRegistro(fn){
        emitter.on('registro', fn)
    }

    return {
        registrar,
        onRegistro
    };
    
}

/**
 * Lee el arreglo de mensajes desde un archivo JSON.
 * Si el archivo no existe, devuelve []. Si existe pero no es un arreglo, [].
 *
 * @param {string} archivoDatos - Ruta del archivo.
 * @returns {Promise<Array<{id: string, texto: string, fecha: string}>>}
 */
export async function leerMensajes(archivoDatos) {
    try{
        const contenido = await fs.readFile(archivoDatos, 'utf8')
        const mensajes = JSON.parse(contenido);

        if(Array.isArray(mensajes)){
            return mensajes;
        } else{
            return [];
        }
    }
    catch(error){
        return [];
    }
    
}

/**
 * Agrega un mensaje al archivo y lo devuelve.
 * Si el texto es vacío (o solo espacios) devuelve null.
 * Crea el directorio si no existe y escribe el arreglo actualizado.
 *
 * @param {string} archivoDatos - Ruta del archivo.
 * @param {string} texto
 * @returns {Promise<{id: string, texto: string, fecha: string} | null>}
 */
export async function agregarMensaje(archivoDatos, texto) {
    const textoLimpio = texto.trim();

    if(!textoLimpio){
        return null
    }

    const mensajes = await leerMensajes(archivoDatos);

    const nuevoMensaje = {
        id: generarId(),
        texto: textoLimpio,
        fecha : new Date().toISOString()
    };
    
    mensajes.push(nuevoMensaje);
    
    const contenido = JSON.stringify(mensajes);

    await fs.mkdir(path.dirname(archivoDatos), {recursive: true});
    await fs.writeFile(archivoDatos, contenido, 'utf8');

    return nuevoMensaje;
}

/**
 * Crea un servidor HTTP (sin escuchar aún) con estas rutas:
 *   GET  /            → 200 { mensaje, hora, sistema }
 *   GET  /mensajes    → 200 [ ...mensajes ]
 *   POST /mensajes    → 201 { nuevo mensaje }  (body JSON: { texto })
 *                      400 si falta el texto · 500 en caso de error
 *   cualquier otra    → 404 { error }
 *
 * @param {{ archivoDatos?: string, nombreApp?: string, logger?: ReturnType<typeof crearLogger> }} [config]
 * @returns {import('node:http').Server}
 */
export function crearServidor(config = {}) {
    const archivoDatos = config.archivoDatos || 'data/mensajes.json';
    const nombreApp = config.nombreApp || 'mensajes-api';
    const logger = config.logger || crearLogger();

    const servidor = http.createServer(async (req, res) => {

        logger.registrar(`${req.method} ${req.url}`);

        if(req.method === 'GET' && req.url === '/'){
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');

            const respuesta = {
                mensaje: `Bienvenido a ${nombreApp}`,
                hora:new Date().toISOString() ,
                sistema: infoSistema()
            };

            return res.end(JSON.stringify(respuesta));
        }

        if(req.method === 'GET' && req.url === '/mensajes'){
            const mensajes = await leerMensajes(archivoDatos);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');

            return res.end(JSON.stringify(mensajes));

        }

        if(req.method === 'POST' && req.url === '/mensajes'){
            try
            {
                const body = await leerBody(req);
                const datos = JSON.parse(body);

                if(!datos.texto || !datos.texto.trim()){
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');

                    return res.end(JSON.stringify({
                        error: 'El texto es obligatorio'
                    }));

                    
                }

                const nuevoMensaje = await agregarMensaje(archivoDatos, datos.texto);

                res.statusCode = 201;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(nuevoMensaje));

            } catch(error){
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');

                return res.end(JSON.stringify({
                    error: 'Error interno del servidor'
                }));
            }
        }

        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');

        return res.end(JSON.stringify({
            error: 'Ruta no encontrada'
        }));

    });

    return servidor;
}

/**
 * Crea y arranca el servidor en el puerto indicado por config.puerto.
 * Al arrancar, registra en el logger: "Servidor en http://localhost:<puerto>".
 *
 * @param {{ puerto?: number, archivoDatos?: string, nombreApp?: string, logger?: ReturnType<typeof crearLogger> }} [config]
 * @returns {import('node:http').Server}
 */
export function iniciarServidor(config = {}) {
    const puerto = config.puerto ?? 3000;
    const logger = config.logger || crearLogger();

    const servidor = crearServidor({
        ...config,
        logger
    });

    servidor.listen(puerto, () => {
        logger.registrar(`Servidor en http://localhost:${puerto}`);

    });

    return servidor;
}

