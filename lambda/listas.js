// Lectura de listas por páginas: se leen TAMANO_PAGINA productos y, si quedan
// más, se pregunta "¿Quieres oírlos?". La posición se guarda en la sesión y la
// usan los handlers de "sí" y "no".

const textos = require('./textos');
const inventario = require('./inventario');
const { obtenerAlmacen, umbralDe } = require('./almacen');
const { responder, preguntar } = require('./comun');

const TAMANO_PAGINA = 10;
const PREGUNTA_SEGUIR = '¿Quieres oír los siguientes productos?';

function productosDeLista(almacen, tipo) {
    const lista = tipo === 'pocoStock'
        ? inventario.conPocoStock(almacen.productos, umbralDe(almacen))
        : almacen.productos;
    return inventario.ordenados(lista);
}

function responderPagina(handlerInput, texto, quedan, siguiente) {
    const sesion = handlerInput.attributesManager.getSessionAttributes();
    if (quedan > 0) {
        sesion.listaPendiente = siguiente;
        return preguntar(handlerInput, texto, PREGUNTA_SEGUIR);
    }
    delete sesion.listaPendiente;
    return responder(handlerInput, texto);
}

/** Lee la primera página de la lista `tipo` ('todos' o 'pocoStock'). */
async function leerLista(handlerInput, tipo) {
    const almacen = await obtenerAlmacen(handlerInput);
    const lista = productosDeLista(almacen, tipo);
    if (!lista.length) {
        return responder(handlerInput, tipo === 'pocoStock' ? textos.sinPocoStock(umbralDe(almacen)) : textos.vacio);
    }
    const pagina = lista.slice(0, TAMANO_PAGINA);
    const quedan = lista.length - pagina.length;
    const texto = tipo === 'pocoStock'
        ? textos.pocoStock(umbralDe(almacen), lista.length, pagina, quedan)
        : textos.listado(lista.length, pagina, quedan);
    return responderPagina(handlerInput, texto, quedan, { tipo, desde: TAMANO_PAGINA });
}

function hayListaPendiente(handlerInput) {
    return Boolean(handlerInput.attributesManager.getSessionAttributes().listaPendiente);
}

/** Lee la siguiente página de la lista que quedó a medias. */
async function continuarLista(handlerInput) {
    const { tipo, desde } = handlerInput.attributesManager.getSessionAttributes().listaPendiente;
    const almacen = await obtenerAlmacen(handlerInput);
    const lista = productosDeLista(almacen, tipo);
    const pagina = lista.slice(desde, desde + TAMANO_PAGINA);
    if (!pagina.length) return responderPagina(handlerInput, textos.finLista, 0);
    const quedan = Math.max(lista.length - desde - pagina.length, 0);
    return responderPagina(handlerInput, textos.continuacionLista(pagina, quedan), quedan,
        { tipo, desde: desde + TAMANO_PAGINA });
}

function abandonarLista(handlerInput) {
    delete handlerInput.attributesManager.getSessionAttributes().listaPendiente;
}

module.exports = { TAMANO_PAGINA, leerLista, hayListaPendiente, continuarLista, abandonarLista };
