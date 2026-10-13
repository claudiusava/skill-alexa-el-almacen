// Todo lo que dice la skill. Los valores que vienen del usuario se escapan
// aquí para que un "&" o un "<" en un nombre no rompan el SSML.

const { cantidadLeida } = require('./inventario');

const SONIDOS = {
    abrir: '<audio src="soundbank://soundlibrary/alarms/beeps_and_bloops/intro_02"/>',
    buscar: '<audio src="soundbank://soundlibrary/cloth_leather_paper/books/books_01"/>',
    borrar: '<audio src="soundbank://soundlibrary/cartoon/amzn_sfx_boing_short_1x_01"/>',
    vaciar: '<audio src="soundbank://soundlibrary/cartoon/amzn_sfx_boing_long_1x_01"/>',
};

function escapar(texto) {
    return String(texto)
        .replace(/&/g, 'y')
        .replace(/[<>"]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function saludo(nombre) {
    return nombre ? `¡Hola, ${escapar(nombre)}!` : '¡Hola!';
}

function enumerar(productos) {
    return productos.map((p) => `${escapar(p.nombre)}: ${cantidadLeida(p)}`).join('; ');
}

function productos(n) {
    return n === 1 ? 'un producto' : `${n} productos`;
}

/** Final de una página de lista: pregunta si seguir o qué más hacer. */
function cierreLista(quedan) {
    return quedan > 0 ? ` Quedan ${quedan} más. ¿Quieres oírlos?` : '';
}

module.exports = {
    escapar,

    bienvenidaPrimeraVez: `${SONIDOS.abrir} ¡Hola! Con esta skill llevas el inventario de tu almacén, tu despensa o tu negocio. `
        + 'Puedes decirme, por ejemplo: guarda tres paquetes de arroz; cuántos tomates tengo; quita dos latas de atún; '
        + 'qué se está acabando; o lista los productos. '
        + 'Si activas el permiso de nombre en la app de Alexa, te saludaré por tu nombre. ¿Qué quieres hacer?',
    bienvenida: (nombre) => `${SONIDOS.abrir} ${saludo(nombre)} Puedes guardar, buscar, quitar o listar productos, `
        + 'preguntar qué se está acabando o vaciar el almacén. ¿Qué quieres hacer?',
    bienvenidaCorta: (nombre) => `${SONIDOS.abrir} ${saludo(nombre)} ¿Qué quieres hacer?`,

    algoMas: '¿Qué más quieres hacer?',
    reprompt: 'Puedes guardar, buscar, quitar o listar productos. Si necesitas ayuda, di ayuda. Para salir, di para. ¿Qué quieres hacer?',

    preguntarCantidad: (nombre) => `¿Qué cantidad de ${escapar(nombre)} quieres guardar?`,
    guardado: (dicho) => `He guardado ${escapar(dicho)}.`,
    sumado: (dicho, producto) => `He añadido ${escapar(dicho)}. Ahora tienes ${cantidadLeida(producto)} en total.`,
    restado: (dicho, producto) => `He quitado ${escapar(dicho)}. `
        + `Te ${producto.cantidad === 1 ? 'queda' : 'quedan'} ${cantidadLeida(producto)}.`,
    agotado: (dicho, nombre) => `${SONIDOS.borrar} He quitado ${escapar(dicho)}. Ya no queda nada de ${escapar(nombre)}, `
        + 'así que lo he borrado del almacén.',
    borrado: (nombre) => `${SONIDOS.borrar} He borrado ${escapar(nombre)} del almacén.`,
    confirmarBorrar: (producto) => `Ahora tienes ${cantidadLeida(producto)} de ${escapar(producto.nombre)}. `
        + '¿Seguro que quieres borrarlo del almacén?',
    noEncontrado: (nombre) => `No tienes ${escapar(nombre)} en el almacén.`,
    encontrado: (producto) => `${SONIDOS.buscar} De ${escapar(producto.nombre)} tienes ${cantidadLeida(producto)}.`,

    vacio: 'Todavía no tienes ningún producto guardado.',
    listado: (total, pagina, quedan) => `Tienes ${productos(total)}`
        + `${quedan > 0 ? `. Te digo los ${pagina.length} primeros` : ''}: ${enumerar(pagina)}.${cierreLista(quedan)}`,
    sinPocoStock: (umbral) => `Ahora mismo no tienes ningún producto con menos de ${umbral} unidades.`,
    pocoStock: (umbral, total, pagina, quedan) => `Con menos de ${umbral} unidades tienes ${productos(total)}`
        + `${quedan > 0 ? `. Te digo los ${pagina.length} primeros` : ''}: ${enumerar(pagina)}.${cierreLista(quedan)}`,
    continuacionLista: (pagina, quedan) => `${enumerar(pagina)}.${cierreLista(quedan)}`,
    finLista: 'Vale.',

    umbralCambiado: (umbral) => `Hecho. A partir de ahora, cuando preguntes qué se está acabando, `
        + `te diré los productos con menos de ${umbral} unidades.`,
    umbralNoValido: 'Necesito un número entero mayor que cero, por ejemplo: avísame cuando queden menos de cinco.',

    deshecho: (descripcion) => `He deshecho lo último: ${escapar(descripcion)}.`,
    nadaQueDeshacer: 'No hay nada que deshacer en esta conversación.',
    operaciones: {
        guardar: (dicho) => `guardar ${dicho}`,
        quitar: (dicho) => `quitar ${dicho}`,
        borrar: (nombre) => `borrar ${nombre}`,
        vaciar: 'vaciar el almacén',
    },

    confirmarVaciar: '¿Seguro que quieres vaciar el almacén? Se borrarán todos los productos.',
    vaciado: `${SONIDOS.vaciar} He vaciado el almacén. Si ha sido sin querer, di: deshaz lo último.`,
    yaVacio: 'El almacén ya estaba vacío.',
    cancelado: 'De acuerdo, no he borrado nada.',

    cantidadNoValida: 'No he entendido la cantidad. Dime un número entero mayor que cero, por ejemplo: guarda tres tomates.',
    productoNoEntendido: 'No he entendido qué producto es. Prueba otra vez, por ejemplo: guarda tres tomates.',

    ayuda: 'Te ayudo a llevar el inventario. Puedes decir: guarda cinco latas de atún; he gastado dos latas de atún; '
        + 'cuántas latas de atún tengo; borra el atún; lista los productos; qué se está acabando; '
        + 'avísame cuando queden menos de cinco; deshaz lo último; o vacía el almacén. ¿Qué quieres hacer?',
    queHacer: '¿Qué quieres hacer? Por ejemplo: guarda tres tomates, o lista los productos.',
    nadaQueRepetir: 'No tengo nada que repetir. ¿Qué quieres hacer?',
    fallback: 'Lo siento, eso no lo sé hacer. Puedes guardar, buscar, quitar o listar productos. ¿Qué quieres hacer?',
    error: 'Lo siento, ha habido un problema. Por favor, inténtalo otra vez.',
    despedida: '¡Hasta luego!',
};
