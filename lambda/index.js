const Alexa = require('ask-sdk-core');

//LIBRERIAS DE LOCALIZACIÓN
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

//STRING O MENSAJES 
const languageStrings = require('./localisation');

//VARIABLE DE PERSISTENCIA
var persistenceAdapter = getPersistenceAdapter();


//ARRAYLIST
let cajita = [];




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
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RegistrarProductoIntent';
    },
    handle(handlerInput) {
        
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();
        const sessionAttributes = attributesManager.getSessionAttributes();
        const intent = handlerInput.requestEnvelope.request.intent;
        
        
        sessionAttributes ['cantidadCapturar'] = cantidadCapturar;
        sessionAttributes ['productoCapturar'] = productoCapturar;
        sessionAttributes ['cajita'] = cajita;
        
        let speechText = '';
        

        function Producto(cantidad, producto){
            this.cantidad = cantidad;
            this.producto = producto;
        }
        var cantidadCapturar = intent.slots.cantidad.value;
        var productoCapturar = intent.slots.producto.value;
        
        var nuevoProducto = new Producto(cantidadCapturar, productoCapturar);
        
        
        var busqueda = productoCapturar;
        var sumador = cantidadCapturar;
        var encontrado = -1;

        for(var i =0; i< cajita.length; i++ )
        {
        if(cajita[i].producto === busqueda) {
         encontrado = i;
         break;
        }
        }

        if( encontrado === -1 ){
        cajita.push(nuevoProducto);
        speechText = handlerInput.t('MSG_PRODUCTOS_REGISTRADOS',cantidadCapturar, productoCapturar) + handlerInput.t('MSG_ALGO_MAS');
        }else{
	    var base = parseInt(cajita[encontrado].cantidad);
	    var sumando =  parseInt(sumador);
	    var suma = sumando + base;
        cajita[encontrado].cantidad = suma;
        speechText = handlerInput.t('MSG_CANTIDAD_SUMADA', cantidadCapturar, productoCapturar, cajita[encontrado].cantidad)
        }

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
    
    let speechText = '';
    
    if(cajita.length === 0){
    speechText = handlerInput.t('MSG_NO_HAY_PRODUCTOS');       
    }else{
    var i, j, x = "";
    for (i in cajita) {
        x += cajita[i].cantidad + " ";
        x += cajita[i].producto + ", ";
    }
    speechText = handlerInput.t('MSG_LISTAR_PRODUCTOS') + handlerInput.t(x);
    }

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};







//SOLICITUD DE BUSCAR PRODUCTO
const BuscarProductoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'BuscarProductoIntent';
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const intent = handlerInput.requestEnvelope.request.intent;
    
    let speechText = '';
   
    var busqueda = intent.slots.productoBuscar.value;
    
    var encontrado = -1;
    
    for(var i =0; i< cajita.length; i++ )
        {
        if(cajita[i].producto === busqueda) {
         encontrado = i;
         break;
        }
        }

    if(encontrado === -1){
    speechText = handlerInput.t('MSG_PRODUCTO_NO_ENCONTRADO', busqueda);
    }else{
    speechText = handlerInput.t('MSG_PRODUCTO_ENCONTRADO', cajita[encontrado].cantidad, busqueda);
    }

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};







//SOLICITUD DE BORRAR PRODUCTO
const BorrarProductoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'BorrarProductoIntent';
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const intent = handlerInput.requestEnvelope.request.intent;
    
    let speechText = '';
   
    var busqueda = intent.slots.productoBorrar.value;
    var restador = intent.slots.cantidadBorrar.value;
    
    var encontrado = -1;
    
    for(var i =0; i< cajita.length; i++ )
        {
        if(cajita[i].producto === busqueda) {
         encontrado = i;
         break;
        }
        }

    if(encontrado === -1){
    speechText = handlerInput.t('MSG_PRODUCTO_NO_ENCONTRADO', busqueda);
    }else{
        var base = parseInt(cajita[encontrado].cantidad);
	    var restando =  parseInt(restador);
	    var resta = base - restando;
	    
	    if (resta<=0){
	        cajita.splice(1,1);
	        speechText = handlerInput.t()
	    }else{
            speechText = handlerInput.t('', cajita[encontrado].cantidad, busqueda);
	    }
	        
	    }
    

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
        BuscarProductoIntentHandler,
        BorrarProductoIntentHandler,
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
    .lambda();