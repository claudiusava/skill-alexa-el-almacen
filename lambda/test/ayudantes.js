// Construye peticiones de Alexa mínimas para invocar la skill en los tests.

const { crearSkill } = require('../index');
const { AdaptadorMemoria } = require('../persistencia');

function sobre(request, { userId = 'usuario-1', nueva = true, permisos } = {}) {
    const user = { userId };
    if (permisos) user.permissions = { consentToken: 'token-de-prueba' };
    return {
        version: '1.0',
        session: {
            new: nueva,
            sessionId: 'sesion-1',
            application: { applicationId: 'skill-de-prueba' },
            user,
            attributes: {},
        },
        context: {
            System: {
                application: { applicationId: 'skill-de-prueba' },
                user,
                apiEndpoint: 'https://api.eu.amazonalexa.com',
                apiAccessToken: 'token-de-prueba',
            },
        },
        request: { requestId: 'peticion-1', timestamp: new Date().toISOString(), locale: 'es-ES', ...request },
    };
}

function lanzamiento(opciones) {
    return sobre({ type: 'LaunchRequest' }, opciones);
}

/**
 * Petición de intent. Cada slot puede ser un texto o { valor, resuelto }
 * para simular que Alexa lo ha encontrado en el catálogo del slot.
 */
function intent(nombre, slots = {}, { confirmacion = 'NONE', ...opciones } = {}) {
    const slotsAlexa = {};
    for (const [nombreSlot, dato] of Object.entries(slots)) {
        if (dato === undefined) continue;
        const { valor, resuelto } = typeof dato === 'object' ? dato : { valor: String(dato) };
        const slot = { name: nombreSlot, value: valor, confirmationStatus: 'NONE' };
        if (resuelto) {
            slot.resolutions = {
                resolutionsPerAuthority: [{
                    authority: 'amzn1.er-authority.echo-sdk.test',
                    status: { code: 'ER_SUCCESS_MATCH' },
                    values: [{ value: { name: resuelto, id: resuelto } }],
                }],
            };
        }
        slotsAlexa[nombreSlot] = slot;
    }
    return sobre({
        type: 'IntentRequest',
        dialogState: 'COMPLETED',
        intent: { name: nombre, confirmationStatus: confirmacion, slots: slotsAlexa },
    }, opciones);
}

/** Skill con persistencia en memoria. `hablar` devuelve la respuesta completa y el texto sin SSML. */
function crearSkillDePrueba({ apiClient } = {}) {
    const persistencia = new AdaptadorMemoria();
    const skill = crearSkill({ persistenceAdapter: persistencia, apiClient });
    async function hablar(peticion) {
        const { response } = await skill.invoke(peticion);
        const ssml = response.outputSpeech ? response.outputSpeech.ssml : '';
        const texto = ssml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        return { response, ssml, texto };
    }
    return { skill, persistencia, hablar };
}

module.exports = { lanzamiento, intent, crearSkillDePrueba };
