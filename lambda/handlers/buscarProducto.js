const textos = require('../textos');
const inventario = require('../inventario');
const { obtenerAlmacen } = require('../almacen');
const { esIntent, leerPedido, responder, responderErrorPedido } = require('../comun');

module.exports = {
    canHandle(handlerInput) {
        return esIntent(handlerInput, 'BuscarProductoIntent');
    },
    async handle(handlerInput) {
        const pedido = inventario.interpretarPedido(leerPedido(handlerInput));
        if (pedido.error) return responderErrorPedido(handlerInput, pedido.error);

        const almacen = await obtenerAlmacen(handlerInput);
        const producto = inventario.buscar(almacen.productos, pedido.nombre);
        return responder(handlerInput, producto
            ? textos.encontrado(producto.nombre, producto.cantidad)
            : textos.noEncontrado(pedido.nombreDicho));
    },
};
