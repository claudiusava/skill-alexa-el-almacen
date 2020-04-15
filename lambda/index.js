const Alexa = require('ask-sdk-core');

const i18n = require('i18next');

const languageStrings = {
    es:{
    translation: {
      MSG_BIENVENIDA:  'Hola! Puedes guardar, listar, buscar o eliminar. ¿Qué deseas hacer?',
      MSG_PRODUCTO_REGISTRADO: 'Hecho! ¿Quiéres hacer algo más?',
      MSG_AYUDA: 'Esta es una skill que puede memorizar los productos de tu almacen. Puedes probar a guardar un producto, listar todos los que tienes, buscar por nombre para recordarte los que quedan o eliminarlos. Prueba a decirme lo que deseas.',
      MSG_REFLACTOR: 'Acabas de activar %s',
      MSG_FALLBACK: 'Lo siento, no se nada sobre eso. Por favor inténtalo otra vez.',
      MSG_ERROR: 'Lo siento, ha habido un problema. Por favor inténtalo otra vez.',
      MSG_DESPEDIDA: 'Hasta luego!'
    }
  }
}








//MENSAJE DE BINVENIDA
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = handlerInput.t('MSG_BIENVENIDA');
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};









//SOLICITUD DE REGISTRAR PRODUCTO
const RegistrarProductoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RegistrarProductoIntent';
    },
    handle(handlerInput) {
        const speechText = handlerInput.t('MSG_PRODUCTO_REGISTRADO');
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
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
        const speechText = handlerInput.t('MSG_AYUDA');

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
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
        const speakOutput = 'Hasta luego!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};










//SOLICITUD DE FINALIZAR SESION
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};









//EL REFLECTOR DE INTENCIÓN SE UTILIZA PARA PROBAR Y DEPURAR MODELOS DE INTERCACIÓN.
//SIMPLEMENTE REPETIRÁ LA INTENCIÓN QUE DIJO EL USUARIO. PUEDES CREAR MANEJADORES PERSONALIZADOS
//PARA SUS INTENCIONES DEFINIENDOLAS ARRIBA, LEGO TAMBIÉN AGREGÁNDOLOS A LA SOLICITUD.
//CADENA DEL CONTROLADOR A CONTINUACIÓN.
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










// MENSAJE DE ERROR SINO SE ENCUENTRA LA SOLICITUD, NO SE HA IMPLEMENTADO UN CONTROLADOR O NO ESTÁ INSTANCIADA
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speechText = handlerInput.t('WELCOME_MSG');

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};












//ESTE INTERCEPTOR DE SOLICITUDES REGISTRARÁ TODAS LAS SOLICITUDES ENTRANTES EN ESTE LAMBDA
const LoggingRequestInterceptor = {
    process(handlerInput) {
        console.log(`Incoming request: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    }
};











//ESTE INTERCEPTOR DE RESPUESTA REGISTRARÁ TODAS LAS RESPUESTAS SALIENTES DE ESTE LAMBDA
const LoggingResponseInterceptor = {
    process(handlerInput, response) {
        console.log(`Outgoing response: ${JSON.stringify(response)}`);
    }
};










//ESTE INTERCEPTOR DE SOLICITUD ENLAZARÁ UNA FUNCIÓN DE TRADCCIÓN 't' AL CONTROLADOR
const LocalisationRequestInterceptor = {
    process(handlerInput) {
        i18n.init({
            lng: Alexa.getLocale(handlerInput.requestEnvelope),
            resources: languageStrings
        }).then((t) => {
            handlerInput.t = (...args) => t(...args);
        });
    }
};









//INSTANCIAS
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        RegistrarProductoIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler
    )
     .addRequestInterceptors(
        LocalisationRequestInterceptor,
        LoggingRequestInterceptor)
    .lambda();
    
    
    
    
    
    
    
    
    
    
