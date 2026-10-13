const textos = require('../textos');
const { obtenerAlmacen } = require('../almacen');
const { esIntent, responder } = require('../comun');

module.exports = {
    canHandle(handlerInput) {
        return esIntent(handlerInput, 'ListarProductosIntent');
    },
    async handle(handlerInput) {
        const { productos } = await obtenerAlmacen(handlerInput);
        return responder(handlerInput, productos.length ? textos.listado(productos) : textos.vacio);
    },
};
