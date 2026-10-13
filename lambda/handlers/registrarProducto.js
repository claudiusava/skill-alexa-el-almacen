const textos = require('../textos');
const inventario = require('../inventario');
const { obtenerAlmacen, guardarAlmacen } = require('../almacen');
const { esIntent, leerPedido, responder, responderErrorPedido } = require('../comun');

module.exports = {
    canHandle(handlerInput) {
        return esIntent(handlerInput, 'RegistrarProductoIntent');
    },
    async handle(handlerInput) {
        const pedido = inventario.interpretarPedido(leerPedido(handlerInput));
        if (pedido.error) return responderErrorPedido(handlerInput, pedido.error);
        if (pedido.cantidad === null) return responderErrorPedido(handlerInput, 'cantidad');

        const almacen = await obtenerAlmacen(handlerInput);
        const { producto, nuevo } = inventario.anadir(almacen.productos, pedido.nombre, pedido.cantidad);
        await guardarAlmacen(handlerInput);

        return responder(handlerInput, nuevo
            ? textos.guardado(pedido.dicho)
            : textos.sumado(pedido.dicho, producto.cantidad));
    },
};
