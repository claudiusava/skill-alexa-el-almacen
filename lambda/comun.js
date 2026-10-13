// Utilidades compartidas por los handlers.

const Alexa = require('ask-sdk-core');
const textos = require('./textos');

function esIntent(handlerInput, ...nombres) {
    const { requestEnvelope } = handlerInput;
    return Alexa.getRequestType(requestEnvelope) === 'IntentRequest'
        && nombres.includes(Alexa.getIntentName(requestEnvelope));
}

/** Devuelve { valor, resuelto }: lo que dijo el usuario y, si coincide con el catálogo del slot, su valor canónico. */
function leerSlot(handlerInput, nombre) {
    const slot = Alexa.getSlot(handlerInput.requestEnvelope, nombre);
    if (!slot || !slot.value) return { valor: undefined, resuelto: undefined };

    const autoridades = (slot.resolutions && slot.resolutions.resolutionsPerAuthority) || [];
    const coincidencia = autoridades.find((a) => a.status && a.status.code === 'ER_SUCCESS_MATCH');
    return {
        valor: slot.value,
        resuelto: coincidencia ? coincidencia.values[0].value.name : undefined,
    };
}

/** Lee producto, cantidad y unidad de la petición en el formato que espera inventario.interpretarPedido. */
function leerPedido(handlerInput) {
    const producto = leerSlot(handlerInput, 'producto');
    const unidad = leerSlot(handlerInput, 'unidad');
    return {
        producto: producto.valor,
        productoResuelto: producto.resuelto,
        cantidad: leerSlot(handlerInput, 'cantidad').valor,
        unidad: unidad.valor,
        unidadResuelta: unidad.resuelto,
    };
}

/** Responde y deja la sesión abierta preguntando qué más hacer. */
function responder(handlerInput, texto) {
    return handlerInput.responseBuilder
        .speak(`${texto} ${textos.algoMas}`)
        .reprompt(textos.reprompt)
        .getResponse();
}

/** Respuesta para un pedido que interpretarPedido no ha podido entender. */
function responderErrorPedido(handlerInput, error) {
    const texto = error === 'cantidad' ? textos.cantidadNoValida : textos.productoNoEntendido;
    return handlerInput.responseBuilder.speak(texto).reprompt(textos.reprompt).getResponse();
}

module.exports = { esIntent, leerSlot, leerPedido, responder, responderErrorPedido };
