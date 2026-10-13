// Con cantidad: resta esa cantidad (y elimina el producto si llega a cero).
// Sin cantidad: elimina el producto entero, previa confirmación.

const textos = require('../textos');
const inventario = require('../inventario');
const { obtenerAlmacen, guardarAlmacen } = require('../almacen');
const { esIntent, leerPedido, responder, responderErrorPedido } = require('../comun');

module.exports = {
    canHandle(handlerInput) {
        return esIntent(handlerInput, 'BorrarProductoIntent');
    },
    async handle(handlerInput) {
        const pedido = inventario.interpretarPedido(leerPedido(handlerInput));
        if (pedido.error) return responderErrorPedido(handlerInput, pedido.error);

        const almacen = await obtenerAlmacen(handlerInput);
        const producto = inventario.buscar(almacen.productos, pedido.nombre);
        if (!producto) return responder(handlerInput, textos.noEncontrado(pedido.nombreDicho));

        if (pedido.cantidad !== null) {
            const resultado = inventario.quitar(almacen.productos, pedido.nombre, pedido.cantidad);
            await guardarAlmacen(handlerInput);
            return responder(handlerInput, resultado.estado === 'agotado'
                ? textos.agotado(pedido.dicho, producto.nombre)
                : textos.restado(pedido.dicho, producto.cantidad));
        }

        const { intent } = handlerInput.requestEnvelope.request;
        if (intent.confirmationStatus === 'DENIED') return responder(handlerInput, textos.cancelado);
        if (intent.confirmationStatus !== 'CONFIRMED') {
            const pregunta = textos.confirmarBorrar(producto.nombre, producto.cantidad);
            return handlerInput.responseBuilder
                .speak(pregunta)
                .reprompt(pregunta)
                .addConfirmIntentDirective(intent)
                .getResponse();
        }

        inventario.eliminar(almacen.productos, pedido.nombre);
        await guardarAlmacen(handlerInput);
        return responder(handlerInput, textos.borrado(producto.nombre));
    },
};
