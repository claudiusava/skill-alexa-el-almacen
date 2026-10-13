// Acceso a los datos persistentes del usuario.
// Formato (versión 2): { version: 2, sesiones: número, productos: [{ clave, nombre, cantidad }] }
// Los datos de la versión de 2020 (cajita, name, sessionCounter…) no son fiables
// porque el inventario se compartía entre usuarios, así que se descartan.

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

module.exports = { VERSION, obtenerAlmacen, guardarAlmacen };
