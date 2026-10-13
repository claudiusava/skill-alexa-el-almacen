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
    assert.match((await hablar(intent('ListarProductosIntent'))).texto, /Tienes 2 productos: tomates: 5; arroz: 2\./);
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
    assert.match((await hablar(intent('BorrarProductoIntent', { producto: 'tomates', cantidad: 3 }))).texto,
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
    assert.match((await hablar(intent('ProductosPocoStockIntent'))).texto, /Con menos de 10 unidades tienes: sal: 2\./);
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

test('las listas largas se cortan', async () => {
    const { hablar } = crearSkillDePrueba();
    for (let i = 0; i < 45; i += 1) await hablar(guardar(`producto ${i}`, 1));
    assert.match((await hablar(intent('ListarProductosIntent'))).texto, /Tienes 45 productos: .*; y 5 productos más\./);
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
