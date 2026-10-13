// Punto de entrada de la skill "Almacén".

const Alexa = require('ask-sdk-core');
const { crearAdaptadorPersistencia } = require('./persistencia');
const sistema = require('./handlers/sistema');

const RegistroPeticiones = {
    process(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        const intent = request.intent ? ` ${request.intent.name}` : '';
        const dialogo = request.dialogState ? ` (${request.dialogState})` : '';
        console.log(`Petición: ${request.type}${intent}${dialogo}`);
    },
};

/**
 * Construye la skill. Los tests le pasan una persistencia en memoria y un
 * cliente de API falso; en Lambda se usan los valores por defecto.
 */
function crearSkill({
    persistenceAdapter = crearAdaptadorPersistencia(),
    apiClient = new Alexa.DefaultApiClient(),
} = {}) {
    return Alexa.SkillBuilders.custom()
        .addRequestHandlers(
            require('./handlers/lanzamiento'),
            require('./handlers/registrarProducto'),
            require('./handlers/borrarProducto'),
            require('./handlers/buscarProducto'),
            require('./handlers/listarProductos'),
            require('./handlers/productosPocoStock'),
            require('./handlers/restaurarAlmacen'),
            sistema.Ayuda,
            sistema.Si,
            sistema.Salir,
            sistema.Fallback,
            sistema.FinDeSesion,
            sistema.IntentDesconocido, // siempre el último: atiende cualquier intent
        )
        .addErrorHandlers(sistema.Errores)
        .addRequestInterceptors(RegistroPeticiones)
        .withPersistenceAdapter(persistenceAdapter)
        .withApiClient(apiClient)
        .withCustomUserAgent('almacen-skill/2')
        .create();
}

let skill;

exports.handler = async (event, context) => {
    skill = skill || crearSkill();
    return skill.invoke(event, context);
};

exports.crearSkill = crearSkill;
