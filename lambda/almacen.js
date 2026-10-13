// Acceso a los datos persistentes del usuario.
// Formato (versión 2): { version: 2, sesiones, umbral?, productos: [{ clave, nombre, cantidad, unidad? }] }
// Los datos de la versión de 2020 (cajita, name, sessionCounter…) no son fiables
// porque el inventario se compartía entre usuarios, así que se descartan.

const { UMBRAL_POCO_STOCK } = require('./inventario');

const VERSION = 2;

async function obtenerAlmacen(handlerInput) {
    const { attributesManager } = handlerInput;
    const datos = await attributesManager.getPersistentAttributes();
    if (datos && datos.version === VERSION) return datos;

    const nuevo = { version: VERSION, sesiones: 0, productos: [] };
    attributesManager.setPersistentAttributes(nuevo);
    return nuevo;
}

async function guardarAlmacen(handlerInput) {
    await handlerInput.attributesManager.savePersistentAttributes();
}

function umbralDe(almacen) {
    return almacen.umbral || UMBRAL_POCO_STOCK;
}

/**
 * Guarda en la sesión una copia de los productos antes de modificarlos, para
 * poder decir "deshaz lo último". Solo se recuerda la última operación.
 */
function recordarParaDeshacer(handlerInput, almacen, descripcion) {
    const sesion = handlerInput.attributesManager.getSessionAttributes();
    sesion.deshacer = { descripcion, productos: JSON.parse(JSON.stringify(almacen.productos)) };
}

module.exports = { VERSION, obtenerAlmacen, guardarAlmacen, umbralDe, recordarParaDeshacer };
