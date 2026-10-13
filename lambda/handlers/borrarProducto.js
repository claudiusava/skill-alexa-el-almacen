// Con cantidad: resta esa cantidad (y elimina el producto si llega a cero).
// Sin cantidad: elimina el producto entero, previa confirmación.
// "Borra todo" o "borra el almacén" pasan a vaciar el almacén.

const textos = require('../textos');
const inventario = require('../inventario');
const { obtenerAlmacen, guardarAlmacen, recordarParaDeshacer } = require('../almacen');
const { esIntent, leerPedido, responder, responderErrorPedido } = require('../comun');

const VACIAR = { name: 'RestaurarAlmacenIntent', confirmationStatus: 'NONE', slots: {} };

module.exports = {
    canHandle(handlerInput) {
        return esIntent(handlerInput, 'BorrarProductoIntent');
    },
    async handle(handlerInput) {
        const datos = leerPedido(handlerInput);
        if (inventario.pideTodo(datos.producto)) {
            return handlerInput.responseBuilder.addDelegateDirective(VACIAR).getResponse();
        }

        const pedido = inventario.interpretarPedido(datos);
        if (pedido.error) return responderErrorPedido(handlerInput, pedido.error);

        const almacen = await obtenerAlmacen(handlerInput);
        const producto = inventario.buscar(almacen.productos, pedido.nombre);
        if (!producto) return responder(handlerInput, textos.noEncontrado(pedido.nombreDicho));

        if (pedido.cantidad !== null) {
            recordarParaDeshacer(handlerInput, almacen, textos.operaciones.quitar(pedido.dicho));
            const resultado = inventario.quitar(almacen.productos, pedido.nombre, pedido.cantidad);
            await guardarAlmacen(handlerInput);
            return responder(handlerInput, resultado.estado === 'agotado'
                ? textos.agotado(pedido.dicho, producto.nombre)
                : textos.restado(pedido.dicho, producto));
        }

        const { intent } = handlerInput.requestEnvelope.request;
        if (intent.confirmationStatus === 'DENIED') return responder(handlerInput, textos.cancelado);
        if (intent.confirmationStatus !== 'CONFIRMED') {
            const pregunta = textos.confirmarBorrar(producto);
            return handlerInput.responseBuilder
                .speak(pregunta)
                .reprompt(pregunta)
                .addConfirmIntentDirective(intent)
                .getResponse();
        }

        recordarParaDeshacer(handlerInput, almacen, textos.operaciones.borrar(producto.nombre));
        inventario.eliminar(almacen.productos, pedido.nombre);
        await guardarAlmacen(handlerInput);
        return responder(handlerInput, textos.borrado(producto.nombre));
    },
};
