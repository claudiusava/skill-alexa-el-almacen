// "Avísame cuando queden menos de cinco": cambia el umbral de poco stock del usuario.

const textos = require('../textos');
const { obtenerAlmacen, guardarAlmacen } = require('../almacen');
const { esIntent, leerSlot, responder, preguntar } = require('../comun');

module.exports = {
    canHandle(handlerInput) {
        return esIntent(handlerInput, 'ConfigurarUmbralIntent');
    },
    async handle(handlerInput) {
        const umbral = Number(leerSlot(handlerInput, 'umbral').valor);
        if (!Number.isInteger(umbral) || umbral < 1) return preguntar(handlerInput, textos.umbralNoValido);

        const almacen = await obtenerAlmacen(handlerInput);
        almacen.umbral = umbral;
        await guardarAlmacen(handlerInput);
        return responder(handlerInput, textos.umbralCambiado(umbral));
    },
};
