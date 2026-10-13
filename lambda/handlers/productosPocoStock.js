const { leerLista } = require('../listas');
const { esIntent } = require('../comun');

module.exports = {
    canHandle(handlerInput) {
        return esIntent(handlerInput, 'ProductosPocoStockIntent');
    },
    handle(handlerInput) {
        return leerLista(handlerInput, 'pocoStock');
    },
};
