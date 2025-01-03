const Alexa = require('ask-sdk-core');
const persistence = require('./persistence');
const interceptors = require('./interceptors');

// Constantes
const GIVEN_NAME_PERMISSION = ['alexa::profile:given_name:read'];

// Handler de bienvenida
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const { attributesManager, serviceClientFactory, requestEnvelope } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();

        let speechText = '';
        const contadorSesion = sessionAttributes.sessionCounter || 0;

        if (!sessionAttributes.name) {
            try {
                const { permissions } = requestEnvelope.context.System.user;
                if (!permissions) throw { statusCode: 401, message: 'No permissions available' };

                const upsServiceClient = serviceClientFactory.getUpsServiceClient();
                const profileName = await upsServiceClient.getProfileGivenName();
                if (profileName) sessionAttributes.name = profileName;

            } catch (error) {
                console.log(JSON.stringify(error));
                if (error.statusCode === 401 || error.statusCode === 403) {
                    handlerInput.responseBuilder.withAskForPermissionsConsentCard(GIVEN_NAME_PERMISSION);
                }
            }
        }

        const name = sessionAttributes.name || 'usuario';
        if (!contadorSesion) {
            speechText = handlerInput.t('MSG_BIENVENIDA_CON_INFO_PERMISO_NOMBRE');
        } else if (contadorSesion < 3) {
            speechText = handlerInput.t('MSG_BIENVENIDA', name);
        } else {
            speechText = handlerInput.t('MSG_BIENVENIDA_CORTO', name);
        }

        sessionAttributes.sessionCounter = contadorSesion + 1;
        attributesManager.setSessionAttributes(sessionAttributes);

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('MSG_REPROMPT'))
            .getResponse();
    }
};

// Handler para registrar producto
const RegistrarProductoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'RegistrarProductoIntent';
    },
    handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const intent = handlerInput.requestEnvelope.request.intent;

        const cantidadCapturar = parseInt(intent.slots.cantidad.value);
        const productoCapturar = intent.slots.producto.value;

        if (!cantidadCapturar || !productoCapturar) {
            return handlerInput.responseBuilder
                .speak('Por favor, proporciona una cantidad y un producto válido.')
                .reprompt('¿Qué producto y cantidad quieres registrar?')
                .getResponse();
        }

        sessionAttributes.cajita = sessionAttributes.cajita || [];
        const index = sessionAttributes.cajita.findIndex(item => item.producto === productoCapturar);

        let speechText = '';
        if (index === -1) {
            sessionAttributes.cajita.push({ cantidad: cantidadCapturar, producto: productoCapturar });
            speechText = handlerInput.t('MSG_PRODUCTOS_REGISTRADOS', cantidadCapturar, productoCapturar) +
                handlerInput.t('MSG_ALGO_MAS');
        } else {
            sessionAttributes.cajita[index].cantidad += cantidadCapturar;
            speechText = handlerInput.t('MSG_CANTIDAD_SUMADA', cantidadCapturar, productoCapturar, sessionAttributes.cajita[index].cantidad) +
                handlerInput.t('MSG_ALGO_MAS');
        }

        attributesManager.setSessionAttributes(sessionAttributes);
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('MSG_REPROMPT'))
            .getResponse();
    }
};

// Handler para listar productos
const ListarProductosIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'ListarProductosIntent';
    },
    handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();

        const cajita = sessionAttributes.cajita || [];
        let speechText = '';

        if (cajita.length === 0) {
            speechText = handlerInput.t('MSG_NO_HAY_PRODUCTOS') + handlerInput.t('MSG_ALGO_MAS');
        } else {
            const listado = cajita.map(item => `${item.cantidad} ${item.producto}`).join(', ');
            speechText = handlerInput.t('MSG_LISTAR_PRODUCTOS') + listado + handlerInput.t('MSG_ALGO_MAS');
        }

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('MSG_REPROMPT'))
            .getResponse();
    }
};

// Handler para buscar producto
const BuscarProductoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'BuscarProductoIntent';
    },
    handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const intent = handlerInput.requestEnvelope.request.intent;

        const busqueda = intent.slots.productoBuscar.value;
        const cajita = sessionAttributes.cajita || [];

        let speechText = '';
        const producto = cajita.find(item => item.producto === busqueda);

        if (!producto) {
            speechText = handlerInput.t('MSG_PRODUCTO_NO_ENCONTRADO', busqueda) + handlerInput.t('MSG_ALGO_MAS');
        } else {
            speechText = handlerInput.t('MSG_PRODUCTO_ENCONTRADO', producto.cantidad, busqueda) + handlerInput.t('MSG_ALGO_MAS');
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
        const speakOutput = You just triggered ${intentName};

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
        console.log(Error handled: ${error.stack});
        const speechText = handlerInput.t('MSG_ERROR');

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('MSG_REPROMPT'))
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        RegistrarProductoIntentHandler,
        ListarProductosIntentHandler,
        BuscarProductoIntentHandler,
        // ... Añadir otros handlers aquí
    )
    .addErrorHandlers(
        {
            canHandle() {
                return true;
            },
            handle(handlerInput, error) {
                console.log(`Error handled: ${error.stack}`);
                return handlerInput.responseBuilder
                    .speak('Lo siento, ocurrió un error. Intenta de nuevo más tarde.')
                    .getResponse();
            }
        }
    )
    .addRequestInterceptors(
        interceptors.LocalizationRequestInterceptor,
        interceptors.LoggingRequestInterceptor,
        interceptors.LoadAttributesRequestInterceptor
    )
    .addResponseInterceptors(
        interceptors.LoggingResponseInterceptor,
        interceptors.SaveAttributesResponseInterceptor
    )
    .withPersistenceAdapter(persistence.getPersistenceAdapter())
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();
