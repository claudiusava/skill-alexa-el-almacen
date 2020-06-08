const Alexa = require('ask-sdk-core');

//PERSISTENCIAS
const persistence = require('./persistence');
//INTERCEPTORES
const interceptors = require ('./interceptors');


//ARRAYLIST DE TODOS LOS PRODUCTOS
let cajita = [];
let cajitaPocaCantidad = []; 

//SOLICITAR PERMISO PARA GUARDAR EL NOMBRE DE USUARIO
const GIVEN_NAME_PERMISSION = ['alexa::profile:given_name:read'];

//MENSAJE DE BINVENIDA
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        
        const {attributesManager, serviceClientFactory, requestEnvelope} = handlerInput;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        
        
        let speechText = '';
        
        const producto = sessionAttributes['producto'];
        const contadorSesion = sessionAttributes['sessionCounter']
        
        
        if(!sessionAttributes['name']){
            try {
                const {permissions} = requestEnvelope.context.System.user;
                if(!permissions)
                    throw { statusCode: 401, message: 'No permissions available' };
                const upsServiceClient = serviceClientFactory.getUpsServiceClient();
                const profileName = await upsServiceClient.getProfileGivenName();
                if (profileName) {
                  sessionAttributes['name'] = profileName;
                }

            } catch (error) {
                console.log(JSON.stringify(error));
                if (error.statusCode === 401 || error.statusCode === 403) {
                    handlerInput.responseBuilder.withAskForPermissionsConsentCard(GIVEN_NAME_PERMISSION);
                }
            }
        }

        const name = sessionAttributes['name'] ? sessionAttributes['name'] : ' ';
        
        
        if(!sessionAttributes['sessionCounter'] && !sessionAttributes['name']){
            speechText = handlerInput.t('MSG_BIENVENIDA_CON_INFO_PERMISO_NOMBRE');
        }else if(contadorSesion < 3){
            speechText = handlerInput.t('MSG_BIENVENIDA', name);
        }else{
            speechText = handlerInput.t('MSG_BIENVENIDA_CORTO', name);
        }
    
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('MSG_REPROMPT'))
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
        speechText = handlerInput.t('MSG_CANTIDAD_SUMADA', cantidadCapturar, productoCapturar, cajita[encontrado].cantidad) + handlerInput.t('MSG_ALGO_MAS');
        }

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('MSG_REPROMPT'))
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
    speechText = handlerInput.t('MSG_NO_HAY_PRODUCTOS') + handlerInput.t('MSG_ALGO_MAS');       
    }else{
    var i, x = "";
    for (i in cajita) {
        x += cajita[i].cantidad + " ";
        x += cajita[i].producto + ", ";
    }
    speechText = handlerInput.t('MSG_LISTAR_PRODUCTOS') + handlerInput.t(x + '. ') + handlerInput.t('MSG_ALGO_MAS');
    }

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('MSG_REPROMPT'))
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
    speechText = handlerInput.t('MSG_PRODUCTO_NO_ENCONTRADO', busqueda) + handlerInput.t('MSG_ALGO_MAS');
    }else{
    speechText = handlerInput.t('MSG_PRODUCTO_ENCONTRADO', cajita[encontrado].cantidad, busqueda) + handlerInput.t('MSG_ALGO_MAS');
    }

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('MSG_REPROMPT'))
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
    var restador = intent.slots.cantidadProductoBorrar.value;
    
    var encontrado = -1;
    
    for(var i =0; i< cajita.length; i++ )
        {
        if(cajita[i].producto === busqueda) {
         encontrado = i;
         break;
        }
        }

    if(encontrado === -1){
    speechText = handlerInput.t('MSG_PRODUCTO_NO_ENCONTRADO', busqueda) + handlerInput.t('MSG_ALGO_MAS');
    }else{
        var base = parseInt(cajita[encontrado].cantidad);
	    var restando =  parseInt(restador);
	    var resta = base - restando;
	    
	    if (resta<=0){
	                function removeItemFromArr (arr, item) {
                    var i = arr.indexOf(item);
                    arr.splice(i, 1);
                    }
                    removeItemFromArr(cajita, busqueda);
	        speechText = handlerInput.t('MSG_PRODUCTO_BORRADO', busqueda) + handlerInput.t('MSG_ALGO_MAS');
	    }else{
	        cajita[encontrado].cantidad = resta;
            speechText = handlerInput.t('MSG_CANTIDAD_RESTADA',restador, busqueda, cajita[encontrado].cantidad) + handlerInput.t('MSG_ALGO_MAS');
	    }
	    }

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('MSG_REPROMPT'))
            .getResponse();
    }
};










//SOLICITUD DE LISTAR PRODUCTOS CON POCO STOCK
const ProductosPocoStockIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ProductosPocoStockIntent';
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const intent = handlerInput.requestEnvelope.request.intent;
    
    let speechText = '';
    
    if(cajita.length===0){
        speechText = handlerInput.t('MSG_NO_HAY_PRODUCTOS_CON_POCO_STOCK') + handlerInput.t('MSG_ALGO_MAS');
    }else{
        cajitaPocaCantidad = [];
        for (var i=0; i<cajita.length; i++) {
            if(cajita[i].cantidad<10){
                cajitaPocaCantidad.push(cajita[i].cantidad + ' ' + cajita[i].producto);
            }
        }
    }
    
    if(cajitaPocaCantidad.length === 0){
    speechText = handlerInput.t('MSG_NO_HAY_PRODUCTOS_CON_POCO_STOCK') + handlerInput.t('MSG_ALGO_MAS');       
    }else{
    var a, x = "";
    for (a in cajitaPocaCantidad) {
        x += cajitaPocaCantidad[a] + ", ";
    }
    speechText = handlerInput.t('MSG_LISTAR_PRODUCTOS_CON_POCO_STOCK') + handlerInput.t(x + '. ') + handlerInput.t('MSG_ALGO_MAS');
    }
    
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('MSG_REPROMPT'))
            .getResponse();
    }
};













//SOLICITUD DE RESTAURAR ALMACEN
const RestaurarAlmacenIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RestaurarAlmacenIntent';
    },
    handle(handlerInput) {
    
        cajita = [];
        cajitaPocaCantidad = [];
        
        let speechText = handlerInput.t('MSG_ALMACEN_RESTAURADO') + handlerInput.t('MSG_ALGO_MAS');

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('MSG_REPROMPT'))
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
            .reprompt(handlerInput.t('MSG_REPROMPT'))
            .getResponse();
    }
};






//MENSAJE DE FALLBACK POR SI NO HA ENTENDIDO LO QUE HAS DICHO
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speechText = handlerInput.t('MSG_FALLBACK');

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('MSG_REPROMPT'))
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
        const speechText = handlerInput.t('MSG_DESPEDIDA');
        return handlerInput.responseBuilder
            .speak(speechText)
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










// MENSAJE DE ERROR SI NO SE ENCUENTRA LA SOLICITUD, NO SE HA IMPLEMENTADO UN CONTROLADOR O NO ESTÁ INSTANCIADA
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speechText = handlerInput.t('MSG_ERROR');

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('MSG_REPROMPT'))
            .getResponse();
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
        ProductosPocoStockIntentHandler,
        RestaurarAlmacenIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
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
    .withPersistenceAdapter(persistence.getPersistenceAdapter())
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();