// Handlers de los intents integrados de Amazon y de las peticiones de sistema.

const Alexa = require('ask-sdk-core');
const textos = require('../textos');
const { esIntent, responder, preguntar } = require('../comun');
const { hayListaPendiente, continuarLista, abandonarLista } = require('../listas');

function despedirse(handlerInput) {
    return handlerInput.responseBuilder
        .speak(textos.despedida)
        .withShouldEndSession(true)
        .getResponse();
}

const Ayuda = {
    canHandle: (handlerInput) => esIntent(handlerInput, 'AMAZON.HelpIntent'),
    handle: (handlerInput) => preguntar(handlerInput, textos.ayuda),
};

// "Sí": sigue leyendo una lista a medias o, si no hay ninguna, pregunta qué hacer.
const Si = {
    canHandle: (handlerInput) => esIntent(handlerInput, 'AMAZON.YesIntent'),
    handle(handlerInput) {
        if (hayListaPendiente(handlerInput)) return continuarLista(handlerInput);
        return preguntar(handlerInput, textos.queHacer);
    },
};

// "No": deja una lista a medias o, si no hay ninguna, responde a "¿Qué más quieres hacer?" y se despide.
const No = {
    canHandle: (handlerInput) => esIntent(handlerInput, 'AMAZON.NoIntent'),
    handle(handlerInput) {
        if (hayListaPendiente(handlerInput)) {
            abandonarLista(handlerInput);
            return responder(handlerInput, textos.finLista);
        }
        return despedirse(handlerInput);
    },
};

// "Para", "cancela" o volver al inicio.
const Salir = {
    canHandle: (handlerInput) => esIntent(handlerInput,
        'AMAZON.CancelIntent', 'AMAZON.StopIntent', 'AMAZON.NavigateHomeIntent'),
    handle: despedirse,
};

// "Repite": vuelve a decir la última respuesta, que guarda el interceptor GuardarUltimaRespuesta.
const Repetir = {
    canHandle: (handlerInput) => esIntent(handlerInput, 'AMAZON.RepeatIntent'),
    handle(handlerInput) {
        const { ultimaRespuesta } = handlerInput.attributesManager.getSessionAttributes();
        if (!ultimaRespuesta) return preguntar(handlerInput, textos.nadaQueRepetir);
        return preguntar(handlerInput, ultimaRespuesta.texto, ultimaRespuesta.reprompt);
    },
};

const Fallback = {
    canHandle: (handlerInput) => esIntent(handlerInput, 'AMAZON.FallbackIntent'),
    handle: (handlerInput) => preguntar(handlerInput, textos.fallback),
};

const FinDeSesion = {
    canHandle: (handlerInput) => Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest',
    handle(handlerInput) {
        const { reason, error } = handlerInput.requestEnvelope.request;
        if (error) console.warn(`Sesión terminada (${reason}): ${error.type} ${error.message}`);
        return handlerInput.responseBuilder.getResponse();
    },
};

// Cualquier intent sin handler propio (no debería ocurrir) recibe la respuesta de fallback.
const IntentDesconocido = {
    canHandle: (handlerInput) => Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest',
    handle(handlerInput) {
        console.warn(`Intent sin handler: ${Alexa.getIntentName(handlerInput.requestEnvelope)}`);
        return preguntar(handlerInput, textos.fallback);
    },
};

const Errores = {
    canHandle: () => true,
    handle(handlerInput, error) {
        console.error('Error no controlado:', error);
        return preguntar(handlerInput, textos.error);
    },
};

module.exports = {
    Ayuda, Si, No, Salir, Repetir, Fallback, FinDeSesion, IntentDesconocido, Errores,
};
