// Este ejemplo demuestra las intenciones de manejo de una habilidad de Alexa usando el kit de habilidades de Alexa SDK (v2).
// Visite https://alexa.design/cookbook para ver ejemplos adicionales sobre la implementación de slots, gestión de diálogos.
// Persistencia de sesión, llamadas de API y más.
const Alexa = require('ask-sdk-core');


//LIBRERIA PARA LOCALIZAR INTERCEPTORES 
const i18n = require('i18next');


//MENSAJES
const languageStrings = {
    es:{
        translation: {
            MSG_BIENVENIDA: 'Bienvenido! ¿Qué deseas hacer: guardar, encontrar o listar un objeto?',
            MSG_GUARDAR: '¿Que vas a guardar?'
        }
    }
}


//SOLICITUD DE LANZAMIENTO
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAtributes();
        const speakOutput = handlerInput.t('MSG_BIENVENIDA');
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};



//SOLICITUD DE GUARDAR 
const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};



//SOLICITUD DE AYUDA
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};



//SOLICITUD DE CANCELAR
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};


//SOLICITUD DE FINALIZAR SESIÓN
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Cualquier lógica de limpieza va aquí.
        return handlerInput.responseBuilder.getResponse();
    }
};




// El reflector de intención se utiliza para probar y depurar modelos de interacción.
// Simplemente repetirá la intención que dijo el usuario. Puedes crear manejadores personalizados.
// para sus intenciones definiéndolas anteriormente, y luego agregándolas a la solicitud
// cadena de manejador debajo.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};



// Manejo de errores genérico para capturar cualquier sintaxis o errores de enrutamiento. Si recibes un error
// indicando que no se encuentra la cadena del controlador de solicitudes, no ha implementado un controlador para
// la intención se invoca o la incluye en el generador de habilidades a continuación.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};




//INTERCEPTOR DE LANZAMIENTO
const LocalisationRequestInterceptor = {
    process(handlerInput) {
        i18n.init({
            lng: Alexa.getLocale(handlerInput.requestEnvelope),
            resources: languageStrings}).then((t) => {handlerInput.t = (...args) => t(...args);
        });
    }
};



// SkillBuilder actúa como el punto de entrada para su habilidad, enrutando todas las solicitudes y respuestas
// cargas útiles a los controladores anteriores. Asegúrese de que haya nuevos manipuladores o interceptores que haya
// definidos se incluyen a continuación. El orden importa: se procesan de arriba a abajo.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // asegúrese de que IntentReflectorHandler sea el último para que no anule sus manejadores de intención personalizados
    )
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(LocalisationRequestInterceptor)
    .lambda();
    
    
    
    
    
    
    
