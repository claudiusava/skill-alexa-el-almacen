// Handlers de los intents integrados de Amazon y de las peticiones de sistema.

const Alexa = require('ask-sdk-core');
const textos = require('../textos');
const { esIntent } = require('../comun');

function preguntar(handlerInput, texto) {
    return handlerInput.responseBuilder.speak(texto).reprompt(textos.reprompt).getResponse();
}

const Ayuda = {
    canHandle: (handlerInput) => esIntent(handlerInput, 'AMAZON.HelpIntent'),
    handle: (handlerInput) => preguntar(handlerInput, textos.ayuda),
};

// "Sí" fuera de una confirmación: el usuario quiere seguir.
const Si = {
    canHandle: (handlerInput) => esIntent(handlerInput, 'AMAZON.YesIntent'),
    handle: (handlerInput) => preguntar(handlerInput, textos.queHacer),
};

// "No" a "¿Qué más quieres hacer?", "para", "cancela" o volver al inicio: se despide.
const Salir = {
    canHandle: (handlerInput) => esIntent(handlerInput,
        'AMAZON.NoIntent', 'AMAZON.CancelIntent', 'AMAZON.StopIntent', 'AMAZON.NavigateHomeIntent'),
    handle: (handlerInput) => handlerInput.responseBuilder
        .speak(textos.despedida)
        .withShouldEndSession(true)
        .getResponse(),
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

module.exports = { Ayuda, Si, Salir, Fallback, FinDeSesion, IntentDesconocido, Errores };
