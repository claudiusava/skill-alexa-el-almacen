// Vacía el almacén. El modelo de interacción pide confirmación; si por algún
// motivo llega sin ella, se pide aquí antes de borrar nada.

const textos = require('../textos');
const { obtenerAlmacen, guardarAlmacen, recordarParaDeshacer } = require('../almacen');
const { esIntent, responder } = require('../comun');

module.exports = {
    canHandle(handlerInput) {
        return esIntent(handlerInput, 'RestaurarAlmacenIntent');
    },
    async handle(handlerInput) {
        const { intent } = handlerInput.requestEnvelope.request;
        if (intent.confirmationStatus === 'DENIED') return responder(handlerInput, textos.cancelado);
        if (intent.confirmationStatus !== 'CONFIRMED') {
            return handlerInput.responseBuilder
                .speak(textos.confirmarVaciar)
                .reprompt(textos.confirmarVaciar)
                .addConfirmIntentDirective(intent)
                .getResponse();
        }

        const almacen = await obtenerAlmacen(handlerInput);
        if (!almacen.productos.length) return responder(handlerInput, textos.yaVacio);

        recordarParaDeshacer(handlerInput, almacen, textos.operaciones.vaciar);
        almacen.productos = [];
        await guardarAlmacen(handlerInput);
        return responder(handlerInput, textos.vaciado);
    },
};
