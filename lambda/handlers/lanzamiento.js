const Alexa = require('ask-sdk-core');
const textos = require('../textos');
const { obtenerAlmacen, guardarAlmacen } = require('../almacen');

const PERMISO_NOMBRE = 'alexa::profile:given_name:read';

/** Nombre del usuario si ha concedido el permiso; null en cualquier otro caso. */
async function leerNombre(handlerInput) {
    const { permissions } = handlerInput.requestEnvelope.context.System.user;
    if (!permissions || !permissions.consentToken) return null;
    try {
        const ups = handlerInput.serviceClientFactory.getUpsServiceClient();
        return (await ups.getProfileGivenName()) || null;
    } catch (error) {
        console.warn(`No se pudo leer el nombre (${error.statusCode || error.name})`);
        return null;
    }
}

module.exports = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const almacen = await obtenerAlmacen(handlerInput);
        almacen.sesiones += 1;
        await guardarAlmacen(handlerInput);

        const nombre = await leerNombre(handlerInput);
        const primeraVez = almacen.sesiones === 1;
        if (!nombre && primeraVez) {
            handlerInput.responseBuilder.withAskForPermissionsConsentCard([PERMISO_NOMBRE]);
        }

        let texto = textos.bienvenidaCorta(nombre);
        if (primeraVez) texto = textos.bienvenidaPrimeraVez;
        else if (almacen.sesiones <= 3) texto = textos.bienvenida(nombre);

        return handlerInput.responseBuilder
            .speak(texto)
            .reprompt(textos.reprompt)
            .getResponse();
    },
};
