const textos = require('../textos');
const inventario = require('../inventario');
const { obtenerAlmacen, guardarAlmacen, recordarParaDeshacer } = require('../almacen');
const { esIntent, leerPedido, responder, responderErrorPedido } = require('../comun');

module.exports = {
    canHandle(handlerInput) {
        return esIntent(handlerInput, 'RegistrarProductoIntent');
    },
    async handle(handlerInput) {
        const pedido = inventario.interpretarPedido(leerPedido(handlerInput));
        if (pedido.error) return responderErrorPedido(handlerInput, pedido.error);

        // "Guarda tomates": falta la cantidad, se pregunta y Alexa vuelve con el intent completo.
        if (pedido.cantidad === null) {
            const pregunta = textos.preguntarCantidad(pedido.nombreDicho);
            return handlerInput.responseBuilder
                .speak(pregunta)
                .reprompt(pregunta)
                .addElicitSlotDirective('cantidad', handlerInput.requestEnvelope.request.intent)
                .getResponse();
        }

        const almacen = await obtenerAlmacen(handlerInput);
        recordarParaDeshacer(handlerInput, almacen, textos.operaciones.guardar(pedido.dicho));
        const { producto, nuevo } = inventario.anadir(almacen.productos, pedido.nombre, pedido.cantidad, pedido.unidad);
        await guardarAlmacen(handlerInput);

        return responder(handlerInput, nuevo
            ? textos.guardado(pedido.dicho)
            : textos.sumado(pedido.dicho, producto));
    },
};
