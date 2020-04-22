const Alexa = require('ask-sdk-core');
const persistence = require('./persistence');
const interceptors = require('./interceptors');




//MENSAJE DE BINVENIDA
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        
        const producto = sessionAttributes['producto'];
       
        return handlerInput.responseBuilder
            .speak(handlerInput.t('MSG_BIENVENIDA'))
            .reprompt(handlerInput.t('MSG_BIENVENIDA'))
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
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = handlerInput.requestEnvelope.request;
        
        const producto = intent.slots.producto.value;
        const cantidad = intent.slots.cantidad.value;
        
        sessionAttributes ['producto']= producto;
        sessionAttributes ['cantidad']= cantidad;
        
        //const producto = sessionAttributes['producto'];
        
        const speechText = handlerInput.t('MSG_PRODUCTOS_REGISTRADOS', cantidad, producto) + handlerInput.t('MSG_ALGO_MAS');
        //let speechText = sessionAttributes.t('MSG_PRODUCTOS_REGISTRADOS', producto);
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};







//SOLICITUD DE LISTAR PRODUCTOS 
const ListarProductosIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ListarProductosIntent';
    },
    handle(handlerInput) {
        
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        
        const producto = sessionAttributes['producto'];
        const cantidad = sessionAttributes['cantidad'];
       
        return handlerInput.responseBuilder
            .speak(handlerInput.t('MSG_LISTAR_PRODUCTOS', cantidad, producto))
            .reprompt(handlerInput.t('MSG_LISTAR_PRODUCTOS'))
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
        const speechText = handlerInput.t('MSG_ERROR');

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};







//INSTANCIAS
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        RegistrarProductoIntentHandler,
        ListarProductosIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler
    )
    .addRequestInterceptors(
        interceptors.LocalizationRequestInterceptor,
        interceptors.LoggingRequestInterceptor,
        interceptors.LoadAttributesRequestInterceptor)
    .addResponseInterceptors(
        interceptors.LoggingResponseInterceptor,
        interceptors.SaveAttributesResponseInterceptor)
    .withPersistenceAdapter(persistence.getpersistenceAdapter())
    .lambda();
    
    
    
    
    
    