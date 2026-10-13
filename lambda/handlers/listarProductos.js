const { leerLista } = require('../listas');
const { esIntent } = require('../comun');

module.exports = {
    canHandle(handlerInput) {
        return esIntent(handlerInput, 'ListarProductosIntent');
    },
    handle(handlerInput) {
        return leerLista(handlerInput, 'todos');
    },
};
