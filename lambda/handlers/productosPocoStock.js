const textos = require('../textos');
const inventario = require('../inventario');
const { obtenerAlmacen } = require('../almacen');
const { esIntent, responder } = require('../comun');

module.exports = {
    canHandle(handlerInput) {
        return esIntent(handlerInput, 'ProductosPocoStockIntent');
    },
    async handle(handlerInput) {
        const { productos } = await obtenerAlmacen(handlerInput);
        const umbral = inventario.UMBRAL_POCO_STOCK;
        const escasos = inventario.conPocoStock(productos, umbral);
        return responder(handlerInput, escasos.length
            ? textos.pocoStock(umbral, escasos)
            : textos.sinPocoStock(umbral));
    },
};
