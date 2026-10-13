const test = require('node:test');
const assert = require('node:assert');
const { lanzamiento, intent, crearSkillDePrueba } = require('./ayudantes');

function guardar(producto, cantidad, opciones) {
    return intent('RegistrarProductoIntent', { producto, cantidad }, opciones);
}

test('primer lanzamiento: bienvenida completa y tarjeta de permiso', async () => {
    const { hablar, persistencia } = crearSkillDePrueba();
    const { response, texto } = await hablar(lanzamiento());
    assert.match(texto, /Con esta skill llevas el inventario/);
    assert.strictEqual(response.card.type, 'AskForPermissionsConsent');
    assert.strictEqual(response.shouldEndSession, false);

    const datos = JSON.parse(persistencia.datos.get('usuario-1'));
    assert.deepStrictEqual(datos, { version: 2, sesiones: 1, productos: [] });

    const segundo = await hablar(lanzamiento());
    assert.match(segundo.texto, /^¡Hola! Puedes guardar/);
    assert.strictEqual(segundo.response.card, undefined);
});

test('lanzamiento con permiso: saluda por el nombre y no lo guarda', async () => {
    const apiClient = {
        invoke: async () => ({ statusCode: 200, headers: [], body: JSON.stringify('Ana') }),
    };
    const { hablar, persistencia } = crearSkillDePrueba({ apiClient });
    await hablar(lanzamiento({ permisos: true }));
    const { texto } = await hablar(lanzamiento({ permisos: true }));
    assert.match(texto, /¡Hola, Ana!/);
    assert.doesNotMatch(persistencia.datos.get('usuario-1'), /Ana/);
});

test('a partir de la cuarta sesión la bienvenida es corta', async () => {
    const { hablar } = crearSkillDePrueba();
    for (let i = 0; i < 3; i += 1) await hablar(lanzamiento());
    const { texto } = await hablar(lanzamiento());
    assert.strictEqual(texto, '¡Hola! ¿Qué quieres hacer?');
});

test('los datos de 2020 se descartan', async () => {
    const { hablar, persistencia } = crearSkillDePrueba();
    persistencia.datos.set('usuario-1', JSON.stringify({
        cajita: [{ cantidad: '5', producto: 'tomates' }], name: 'Ana', sessionCounter: 7,
    }));
    const { texto } = await hablar(intent('ListarProductosIntent'));
    assert.match(texto, /Todavía no tienes ningún producto/);
});

test('guardar, sumar, buscar y listar', async () => {
    const { hablar } = crearSkillDePrueba();
    assert.match((await hablar(guardar('tomates', 3))).texto, /^He guardado 3 tomates\. ¿Qué más/);
    assert.match((await hablar(guardar('un tomate', 2))).texto, /He añadido 2 tomate\. Ahora tienes 5 en total\./);
    assert.match((await hablar(intent('RegistrarProductoIntent', { producto: 'arroz', cantidad: 2, unidad: 'kilos' }))).texto,
        /He guardado 2 kilos de arroz\./);

    assert.match((await hablar(intent('BuscarProductoIntent', { producto: 'Tomate' }))).texto, /De tomates tienes 5\./);
    assert.match((await hablar(intent('BuscarProductoIntent', { producto: 'peras' }))).texto, /No tienes peras en el almacén\./);
    assert.match((await hablar(intent('BuscarProductoIntent', { producto: 'arroz' }))).texto, /De arroz tienes 2 kilos\./);
    assert.match((await hablar(intent('ListarProductosIntent'))).texto, /Tienes 2 productos: arroz: 2 kilos; tomates: 5\./);
});

test('guardar sin cantidad válida pide repetir sin tocar el almacén', async () => {
    const { hablar, persistencia } = crearSkillDePrueba();
    const { texto } = await hablar(guardar('arroz', '?'));
    assert.match(texto, /No he entendido la cantidad/);
    assert.strictEqual(persistencia.datos.size, 0);
});

test('cada usuario tiene su propio almacén', async () => {
    // Regresión: en 2020 el inventario era una variable global compartida.
    const { hablar } = crearSkillDePrueba();
    await hablar(guardar('tomates', 3, { userId: 'ana' }));
    const { texto } = await hablar(intent('ListarProductosIntent', {}, { userId: 'luis' }));
    assert.match(texto, /Todavía no tienes ningún producto/);
});

test('el inventario sobrevive a un reinicio de la Lambda', async () => {
    const primera = crearSkillDePrueba();
    await primera.hablar(guardar('tomates', 3));
    const segunda = crearSkillDePrueba();
    segunda.persistencia.datos = primera.persistencia.datos;
    assert.match((await segunda.hablar(intent('BuscarProductoIntent', { producto: 'tomates' }))).texto, /tienes 3/);
});

test('quitar una cantidad resta, y si no queda nada borra el producto', async () => {
    const { hablar } = crearSkillDePrueba();
    await hablar(guardar('tomates', 5));
    await hablar(guardar('arroz', 2));
    assert.match((await hablar(intent('BorrarProductoIntent', { producto: 'tomates', cantidad: 2 }))).texto,
        /He quitado 2 tomates\. Te quedan 3\./);
    assert.match((await hablar(intent('BorrarProductoIntent', { producto: 'tomates', cantidad: 2 }))).texto,
        /He quitado 2 tomates\. Te queda 1\./);
    assert.match((await hablar(intent('BorrarProductoIntent', { producto: 'tomates', cantidad: 1 }))).texto,
        /Ya no queda nada de tomates/);
    assert.match((await hablar(intent('ListarProductosIntent'))).texto, /Tienes un producto: arroz: 2\./);
});

test('borrar un producto entero pide confirmación', async () => {
    const { hablar } = crearSkillDePrueba();
    await hablar(guardar('tomates', 5));

    const pregunta = await hablar(intent('BorrarProductoIntent', { producto: 'tomates' }));
    assert.match(pregunta.texto, /Ahora tienes 5 de tomates\. ¿Seguro que quieres borrarlo/);
    assert.strictEqual(pregunta.response.directives[0].type, 'Dialog.ConfirmIntent');

    const no = await hablar(intent('BorrarProductoIntent', { producto: 'tomates' }, { confirmacion: 'DENIED' }));
    assert.match(no.texto, /no he borrado nada/);
    assert.match((await hablar(intent('BuscarProductoIntent', { producto: 'tomates' }))).texto, /tienes 5/);

    const si = await hablar(intent('BorrarProductoIntent', { producto: 'tomates' }, { confirmacion: 'CONFIRMED' }));
    assert.match(si.texto, /He borrado tomates del almacén\./);
    assert.match((await hablar(intent('ListarProductosIntent'))).texto, /Todavía no tienes/);
});

test('borrar algo que no existe', async () => {
    const { hablar } = crearSkillDePrueba();
    const { texto } = await hablar(intent('BorrarProductoIntent', { producto: 'peras', cantidad: 1 }));
    assert.match(texto, /No tienes peras en el almacén\./);
});

test('productos con poco stock', async () => {
    const { hablar } = crearSkillDePrueba();
    assert.match((await hablar(intent('ProductosPocoStockIntent'))).texto, /no tienes ningún producto con menos de 10/);
    await hablar(guardar('arroz', 12));
    await hablar(guardar('sal', 2));
    assert.match((await hablar(intent('ProductosPocoStockIntent'))).texto, /Con menos de 10 unidades tienes un producto: sal: 2\./);
});

test('vaciar el almacén respeta la confirmación', async () => {
    const { hablar } = crearSkillDePrueba();
    await hablar(guardar('arroz', 2));

    const sinConfirmar = await hablar(intent('RestaurarAlmacenIntent'));
    assert.strictEqual(sinConfirmar.response.directives[0].type, 'Dialog.ConfirmIntent');

    assert.match((await hablar(intent('RestaurarAlmacenIntent', {}, { confirmacion: 'DENIED' }))).texto, /no he borrado nada/);
    assert.match((await hablar(intent('ListarProductosIntent'))).texto, /arroz: 2/);

    assert.match((await hablar(intent('RestaurarAlmacenIntent', {}, { confirmacion: 'CONFIRMED' }))).texto, /He vaciado el almacén/);
    assert.match((await hablar(intent('RestaurarAlmacenIntent', {}, { confirmacion: 'CONFIRMED' }))).texto, /ya estaba vacío/);
});

test('los nombres con caracteres especiales no rompen el SSML', async () => {
    const { hablar } = crearSkillDePrueba();
    const { ssml } = await hablar(guardar('sal & pimienta <b>', 1));
    assert.match(ssml, /He guardado 1 sal y pimienta b\./);
    assert.doesNotMatch(ssml, /&|<b>/);
});

/** Simula una conversación: los atributos de sesión de cada respuesta van en la siguiente petición. */
function conversacion(skill) {
    let atributos = {};
    return {
        get atributos() { return atributos; },
        async decir(peticion) {
            peticion.session.attributes = atributos;
            peticion.session.new = false;
            const respuesta = await skill.invoke(peticion);
            atributos = respuesta.sessionAttributes;
            const { response } = respuesta;
            return {
                response,
                texto: response.outputSpeech ? response.outputSpeech.ssml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '',
            };
        },
    };
}

test('las listas largas se leen de diez en diez, en orden alfabético', async () => {
    const { skill } = crearSkillDePrueba();
    for (let i = 32; i >= 10; i -= 1) await skill.invoke(guardar(`producto ${i}`, 1));
    const c = conversacion(skill);

    let { texto } = await c.decir(intent('ListarProductosIntent'));
    assert.match(texto, /^Tienes 23 productos\. Te digo los 10 primeros: producto 10: 1;.*producto 19: 1\. Quedan 13 más\. ¿Quieres oírlos\?$/);
    ({ texto } = await c.decir(intent('AMAZON.YesIntent')));
    assert.match(texto, /^producto 20: 1;.*producto 29: 1\. Quedan 3 más\. ¿Quieres oírlos\?$/);
    ({ texto } = await c.decir(intent('AMAZON.YesIntent')));
    assert.strictEqual(texto, 'producto 30: 1; producto 31: 1; producto 32: 1. ¿Qué más quieres hacer?');
    ({ texto } = await c.decir(intent('AMAZON.YesIntent')));
    assert.match(texto, /^¿Qué quieres hacer\?/);

    await c.decir(intent('ListarProductosIntent'));
    ({ texto } = await c.decir(intent('AMAZON.NoIntent')));
    assert.strictEqual(texto, 'Vale. ¿Qué más quieres hacer?');

    // Cualquier otra petición abandona la lista.
    await c.decir(intent('ListarProductosIntent'));
    await c.decir(intent('BuscarProductoIntent', { producto: 'producto 10' }));
    assert.strictEqual(c.atributos.listaPendiente, undefined);
});

test('"un tomate" no necesita preguntar la cantidad', async () => {
    const { hablar } = crearSkillDePrueba();
    const { texto } = await hablar(intent('RegistrarProductoIntent', { producto: 'tomate', uno: { valor: '1', resuelto: 'un' } }));
    assert.match(texto, /^He guardado un tomate\./);
});

test('sin cantidad se pregunta cuánto guardar', async () => {
    const { hablar } = crearSkillDePrueba();
    const { response, texto } = await hablar(intent('RegistrarProductoIntent', { producto: 'tomates' }));
    assert.strictEqual(texto, '¿Qué cantidad de tomates quieres guardar?');
    assert.strictEqual(response.directives[0].type, 'Dialog.ElicitSlot');
    assert.strictEqual(response.directives[0].slotToElicit, 'cantidad');
});

test('"borra todo" pasa a vaciar el almacén', async () => {
    const { hablar } = crearSkillDePrueba();
    const { response } = await hablar(intent('BorrarProductoIntent', { producto: 'todo' }));
    assert.strictEqual(response.directives[0].type, 'Dialog.Delegate');
    assert.strictEqual(response.directives[0].updatedIntent.name, 'RestaurarAlmacenIntent');
});

test('cambiar el umbral de poco stock', async () => {
    const { hablar } = crearSkillDePrueba();
    await hablar(guardar('arroz', 4));
    await hablar(guardar('sal', 2));
    assert.match((await hablar(intent('ConfigurarUmbralIntent', { umbral: 3 }))).texto, /menos de 3 unidades/);
    assert.match((await hablar(intent('ProductosPocoStockIntent'))).texto, /Con menos de 3 unidades tienes un producto: sal: 2\./);
    assert.match((await hablar(intent('ConfigurarUmbralIntent', { umbral: 0 }))).texto, /Necesito un número entero mayor que cero/);
});

test('deshacer lo último restaura los productos', async () => {
    const { skill } = crearSkillDePrueba();
    const c = conversacion(skill);
    assert.match((await c.decir(intent('DeshacerIntent'))).texto, /No hay nada que deshacer/);

    await c.decir(guardar('arroz', 4));
    await c.decir(guardar('arroz', 2));
    assert.match((await c.decir(intent('DeshacerIntent'))).texto, /He deshecho lo último: guardar 2 arroz\./);
    assert.match((await c.decir(intent('BuscarProductoIntent', { producto: 'arroz' }))).texto, /tienes 4\./);

    await c.decir(intent('RestaurarAlmacenIntent', {}, { confirmacion: 'CONFIRMED' }));
    assert.match((await c.decir(intent('DeshacerIntent'))).texto, /He deshecho lo último: vaciar el almacén\./);
    assert.match((await c.decir(intent('ListarProductosIntent'))).texto, /arroz: 4/);
    assert.match((await c.decir(intent('DeshacerIntent'))).texto, /No hay nada que deshacer/);
});

test('con un almacén muy grande no se guarda copia para deshacer', async () => {
    const { skill, persistencia } = crearSkillDePrueba();
    const productos = Array.from({ length: 300 }, (_, i) => ({ clave: `p${i}`, nombre: `producto ${i}`, cantidad: 1 }));
    persistencia.datos.set('usuario-1', JSON.stringify({ version: 2, sesiones: 1, productos }));
    const c = conversacion(skill);
    await c.decir(guardar('arroz', 1));
    assert.strictEqual(c.atributos.deshacer, undefined);
    assert.match((await c.decir(intent('DeshacerIntent'))).texto, /No hay nada que deshacer/);
});

test('repite vuelve a decir la última respuesta', async () => {
    const { skill } = crearSkillDePrueba();
    const c = conversacion(skill);
    assert.match((await c.decir(intent('AMAZON.RepeatIntent'))).texto, /No tengo nada que repetir/);
    await c.decir(guardar('arroz', 4));
    assert.strictEqual((await c.decir(intent('AMAZON.RepeatIntent'))).texto, 'He guardado 4 arroz. ¿Qué más quieres hacer?');
});

test('ayuda, sí, fallback e intent desconocido mantienen la sesión abierta', async () => {
    const { hablar } = crearSkillDePrueba();
    for (const [nombre, esperado] of [
        ['AMAZON.HelpIntent', /Te ayudo a llevar el inventario/],
        ['AMAZON.YesIntent', /¿Qué quieres hacer\?/],
        ['AMAZON.FallbackIntent', /eso no lo sé hacer/],
        ['IntentInventado', /eso no lo sé hacer/],
    ]) {
        const { response, texto } = await hablar(intent(nombre));
        assert.match(texto, esperado, nombre);
        assert.strictEqual(response.shouldEndSession, false, nombre);
    }
});

test('no, para, cancela y volver al inicio se despiden', async () => {
    const { hablar } = crearSkillDePrueba();
    for (const nombre of ['AMAZON.NoIntent', 'AMAZON.StopIntent', 'AMAZON.CancelIntent', 'AMAZON.NavigateHomeIntent']) {
        const { response, texto } = await hablar(intent(nombre));
        assert.strictEqual(texto, '¡Hasta luego!', nombre);
        assert.strictEqual(response.shouldEndSession, true, nombre);
    }
});

test('un error en la persistencia da una respuesta amable', async () => {
    const { hablar, persistencia } = crearSkillDePrueba();
    persistencia.getAttributes = async () => { throw new Error('S3 caído'); };
    const errorOriginal = console.error;
    console.error = () => {};
    try {
        const { texto } = await hablar(intent('ListarProductosIntent'));
        assert.match(texto, /ha habido un problema/);
    } finally {
        console.error = errorOriginal;
    }
});
