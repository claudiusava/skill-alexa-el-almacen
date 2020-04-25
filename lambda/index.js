const Alexa = require('ask-sdk-core');

//LIBRERIAS DE LOCALIZACIÓN
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

//STRING O MENSAJES 
const languageStrings = require('./localisation');

//VARIABLE DE PERSISTENCIA
var persistenceAdapter = getPersistenceAdapter();


//ARRAYLIST
var cajita = [];



//FUNCION DE PERSISTENCIA
function getPersistenceAdapter(tableName) {
    // This function is an indirect way to detect if this is part of an Alexa-Hosted skill
    function isAlexaHosted() {
        return process.env.S3_PERSISTENCE_BUCKET;
    }
    if (isAlexaHosted()) {
        const {S3PersistenceAdapter} = require('ask-sdk-s3-persistence-adapter');
        return new S3PersistenceAdapter({
            bucketName: process.env.S3_PERSISTENCE_BUCKET
        });
    } else {
        // IMPORTANT: don't forget to give DynamoDB access to the role you're using to run this lambda (via IAM policy)
        const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
        return new DynamoDbPersistenceAdapter({
            tableName: tableName || 'el_almacen',
            createTable: true
        });
    }
}






//MENSAJE DE BINVENIDA
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let speechText = '';
        
        const producto = sessionAttributes['producto'];
        
        speechText = handlerInput.t('MSG_BIENVENIDA');
       
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};









//SOLICITUD DE REGISTRAR PRODUCTO
const RegistrarProductoIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CreateEntitiesIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const {intent} = handlerInput.requestEnvelope.request;
        
        let speakOutput = handlerInput.t('MSG_ERROR');
        
        if(intent.slots.dynamicEntity.confirmationStatus !== 'CONFIRMED') {
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        }
        
        if(!sessionAttributes['entities'])
            sessionAttributes['entities'] = [];
        
        const dynamicEntity = intent.slots.dynamicEntity.value;
        sessionAttributes['entities'].push(dynamicEntity);
        addDynamicEntities(handlerInput.responseBuilder, 'MyEntities', sessionAttributes['entities']);
        
        speakOutput = handlerInput.t('MSG_PRODUCTO_REGISTRADO') + handlerInput.t('MSG_AYUDA');

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(handlerInput.t('MSG_AYUDA'))
            .getResponse();
    }
};







//SOLICITUD DE LISTAR PRODUCTOS
const ListarProductosIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CheckEntitiesIntent';
    },
    handle(handlerInput) {
        const {intent} = handlerInput.requestEnvelope.request;
        
        const entity = intent.slots.entity.value;
        const slotValues = getStaticAndDynamicSlotValuesFromSlot(intent.slots.entity);
        
        let speakOutput ;
        
        if (slotValues.static.statusCode === 'ER_SUCCESS_MATCH') {
            speakOutput = entity + handlerInput.t('IS_STATIC_MSG');
        } else
        if (slotValues.dynamic.statusCode === 'ER_SUCCESS_MATCH') {
            speakOutput = entity + handlerInput.t('IS_DYNAMIC_MSG');
        } else {
            speakOutput = entity + handlerInput.t('NOT_MATCHED_MSG');
        }
        
        
        return handlerInput.responseBuilder
            .speak(speakOutput + handlerInput.t('HELP2_MSG'))
            .reprompt(handlerInput.t('HELP2_MSG'))
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















function addDynamicEntities(responseBuilder, slotType, entities) {
    let updateEntitiesDirective = {
      type: 'Dialog.UpdateDynamicEntities',
      updateBehavior: 'REPLACE',
      types: [
        {
          name: slotType,
          values: [] // we fill this array with the entities below
        }
      ]
    };
    entities.map((entity) => updateEntitiesDirective.types[0].values.push(
        {
            id: entity.replace(/\s/gi, "_"),
            name: {
                value: entity
            }
        }
    ));
    console.log(JSON.stringify(updateEntitiesDirective));
    responseBuilder.addDirective(updateEntitiesDirective);
}

const getStaticAndDynamicSlotValues = function(slots) {
    const slotValues = {}
    for (let slot in slots) {
        slotValues[slot] = getStaticAndDynamicSlotValuesFromSlot(slots[slot]);
    }
    return slotValues;
}

const getStaticAndDynamicSlotValuesFromSlot = function(slot) {

    const result = {
        name: slot.name,
        value: slot.value
    };

    if (((slot.resolutions || {}).resolutionsPerAuthority || [])[0] || {}) {
        slot.resolutions.resolutionsPerAuthority.forEach((authority) => {
            const slotValue = {
                authority: authority.authority,
                statusCode: authority.status.code,
                synonym: slot.value || undefined,
                resolvedValues: slot.value
            };
            if (authority.values && authority.values.length > 0) {
                slotValue.resolvedValues = [];

                authority.values.forEach((value) => {
                    slotValue.resolvedValues.push(value);
                });

            }

            if (authority.authority.includes('amzn1.er-authority.echo-sdk.dynamic')) {
                result.dynamic = slotValue;
            } else {
                result.static = slotValue;
            }
        });
    }
    return result;
};




















//ESTE INTERCEPTOR DE SOLICITUD ENLAZARÁ UNA FUNCIÓN DE TRADCCIÓN 't' AL CONTROLADOR
const LocalizationRequestInterceptor = {
    process(handlerInput) {
        i18n.use(sprintf).init({
            lng: Alexa.getLocale(handlerInput.requestEnvelope),
            overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
            resources: languageStrings
        }).then((t) => {
            handlerInput.t = (...args) => t(...args);
        });
    }
};





//INTERCEPTOR PARA CARGAR ATRIBUTOS PERSISTENTES Y LOS COPIA EN LOS ATRIBUTOS DE SESIÓN 
const LoadAttributesRequestInterceptor = {
    async process(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        if (Alexa.isNewSession(requestEnvelope)){ //is this a new session? this check is not enough if using auto-delegate (more on next module)
            const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
            console.log('Loading from persistent storage: ' + JSON.stringify(persistentAttributes));
            //copy persistent attribute to session attributes
            attributesManager.setSessionAttributes(persistentAttributes); // ALL persistent attributtes are now session attributes
        }
    }
};

//INTERCEPTOR QUE OBTIENE LOS ATRIBUTOS DE SESIÓN Y SI LA SESIÓN VA A TERMINAR, GUARDA LOS ATRIBUTOS DE SESIÓN EN ATRIBUTOS PERSISTENTES
const SaveAttributesResponseInterceptor = {
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
        LocalizationRequestInterceptor,
        LoggingRequestInterceptor,
        LoadAttributesRequestInterceptor)
    .addResponseInterceptors(
        LoggingResponseInterceptor,
        SaveAttributesResponseInterceptor)
    .withPersistenceAdapter(persistenceAdapter)
    .withCustomUserAgent('cookbook/dynamic-entities/v1')
    .lambda();
    
    