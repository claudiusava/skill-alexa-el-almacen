const Alexa = require('ask-sdk-core');

//LIBRERIAS DE LOCALIZACIÓN
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

//STRING O MENSAJES 
const languageStrings = require('./localisation');

module.exports = {
    //ESTE INTERCEPTOR DE SOLICITUDES REGISTRARÁ TODAS LAS SOLICITUDES ENTRANTES EN ESTE LAMBDA
 LoggingRequestInterceptor : {
    process(handlerInput) {
        console.log(`Incoming request: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    }
},

//ESTE INTERCEPTOR DE RESPUESTA REGISTRARÁ TODAS LAS RESPUESTAS SALIENTES DE ESTE LAMBDA
 LoggingResponseInterceptor : {
    process(handlerInput, response) {
        console.log(`Outgoing response: ${JSON.stringify(response)}`);
    }
},




//ESTE INTERCEPTOR DE SOLICITUD ENLAZARÁ UNA FUNCIÓN DE TRADCCIÓN 't' AL CONTROLADOR
 LocalizationRequestInterceptor : {
    process(handlerInput) {
        i18n.use(sprintf).init({
            lng: Alexa.getLocale(handlerInput.requestEnvelope),
            overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
            resources: languageStrings
        }).then((t) => {
            handlerInput.t = (...args) => t(...args);
        });
    }
},





//INTERCEPTOR PARA CARGAR ATRIBUTOS PERSISTENTES Y LOS COPIA EN LOS ATRIBUTOS DE SESIÓN 
 LoadAttributesRequestInterceptor : {
    async process(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        if (Alexa.isNewSession(requestEnvelope)){ //is this a new session? this check is not enough if using auto-delegate (more on next module)
            const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
            console.log('Loading from persistent storage: ' + JSON.stringify(persistentAttributes));
            //copy persistent attribute to session attributes
            attributesManager.setSessionAttributes(persistentAttributes); // ALL persistent attributtes are now session attributes
        }
    }
},



//INTERCEPTOR QUE OBTIENE LOS ATRIBUTOS DE SESIÓN Y SI LA SESIÓN VA A TERMINAR, GUARDA LOS ATRIBUTOS DE SESIÓN EN ATRIBUTOS PERSISTENTES
 SaveAttributesResponseInterceptor : {
    async process(handlerInput, response) {
        if (!response) return; // avoid intercepting calls that have no outgoing response due to errors
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const shouldEndSession = (typeof response.shouldEndSession === "undefined" ? true : response.shouldEndSession); //is this a session end?
        if (shouldEndSession || Alexa.getRequestType(requestEnvelope) === 'SessionEndedRequest') { // skill was stopped or timed out
            // we increment a persistent session counter here
            sessionAttributes['sessionCounter'] = sessionAttributes['sessionCounter'] ? sessionAttributes['sessionCounter'] + 1 : 1;
            // we make ALL session attributes persistent
            console.log('Saving to persistent storage:' + JSON.stringify(sessionAttributes));
            attributesManager.setPersistentAttributes(sessionAttributes);
            await attributesManager.savePersistentAttributes();
        }
    }
}

}