// "Deshaz lo último": restaura los productos tal como estaban antes de la última
// operación de esta conversación (guardar, quitar, borrar o vaciar).

const textos = require('../textos');
const { obtenerAlmacen, guardarAlmacen } = require('../almacen');
const { esIntent, responder } = require('../comun');

module.exports = {
    canHandle(handlerInput) {
        return esIntent(handlerInput, 'DeshacerIntent');
    },
    async handle(handlerInput) {
        const sesion = handlerInput.attributesManager.getSessionAttributes();
        if (!sesion.deshacer) return responder(handlerInput, textos.nadaQueDeshacer);

        const almacen = await obtenerAlmacen(handlerInput);
        almacen.productos = sesion.deshacer.productos;
        await guardarAlmacen(handlerInput);
        const { descripcion } = sesion.deshacer;
        delete sesion.deshacer;
        return responder(handlerInput, textos.deshecho(descripcion));
    },
};
