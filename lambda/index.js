// Punto de entrada de la skill "Almacén".

const Alexa = require('ask-sdk-core');
const { crearAdaptadorPersistencia } = require('./persistencia');
const sistema = require('./handlers/sistema');

const INTENTS_DE_LISTA = ['AMAZON.YesIntent', 'AMAZON.NoIntent', 'AMAZON.RepeatIntent'];

const RegistroPeticiones = {
    process(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        const intent = request.intent ? ` ${request.intent.name}` : '';
        const dialogo = request.dialogState ? ` (${request.dialogState})` : '';
        console.log(`Petición: ${request.type}${intent}${dialogo}`);
    },
};

// Una lista leída a medias solo se continúa si lo siguiente es "sí", "no" o "repite".
const OlvidarListaPendiente = {
    process(handlerInput) {
        const { requestEnvelope, attributesManager } = handlerInput;
        const esIntentDeLista = Alexa.getRequestType(requestEnvelope) === 'IntentRequest'
            && INTENTS_DE_LISTA.includes(Alexa.getIntentName(requestEnvelope));
        if (!esIntentDeLista) delete attributesManager.getSessionAttributes().listaPendiente;
    },
};

// Guarda lo último que se ha dicho para poder responder a "repite".
const GuardarUltimaRespuesta = {
    process(handlerInput, response) {
        if (!response || !response.outputSpeech || !response.reprompt || response.directives) return;
        const sinSpeak = (ssml) => ssml.replace(/^<speak>|<\/speak>$/g, '');
        handlerInput.attributesManager.getSessionAttributes().ultimaRespuesta = {
            texto: sinSpeak(response.outputSpeech.ssml),
            reprompt: sinSpeak(response.reprompt.outputSpeech.ssml),
        };
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
            require('./handlers/configurarUmbral'),
            require('./handlers/deshacer'),
            sistema.Ayuda,
            sistema.Si,
            sistema.No,
            sistema.Salir,
            sistema.Repetir,
            sistema.Fallback,
            sistema.FinDeSesion,
            sistema.IntentDesconocido, // siempre el último: atiende cualquier intent
        )
        .addErrorHandlers(sistema.Errores)
        .addRequestInterceptors(RegistroPeticiones, OlvidarListaPendiente)
        .addResponseInterceptors(GuardarUltimaRespuesta)
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
