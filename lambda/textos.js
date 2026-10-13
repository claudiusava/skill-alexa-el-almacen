// Todo lo que dice la skill. Los valores que vienen del usuario se escapan
// aquí para que un "&" o un "<" en un nombre no rompan el SSML.

const SONIDOS = {
    abrir: '<audio src="soundbank://soundlibrary/alarms/beeps_and_bloops/intro_02"/>',
    buscar: '<audio src="soundbank://soundlibrary/cloth_leather_paper/books/books_01"/>',
    borrar: '<audio src="soundbank://soundlibrary/cartoon/amzn_sfx_boing_short_1x_01"/>',
    vaciar: '<audio src="soundbank://soundlibrary/cartoon/amzn_sfx_boing_long_1x_01"/>',
};

// Límite de productos leídos de una vez, para no superar el tamaño máximo de respuesta.
const MAX_PRODUCTOS_LEIDOS = 40;

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
    const leidos = productos.slice(0, MAX_PRODUCTOS_LEIDOS)
        .map((p) => `${escapar(p.nombre)}: ${p.cantidad}`)
        .join('; ');
    const resto = productos.length - MAX_PRODUCTOS_LEIDOS;
    return resto > 0 ? `${leidos}; y ${resto} productos más` : leidos;
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

    guardado: (dicho) => `He guardado ${escapar(dicho)}.`,
    sumado: (dicho, total) => `He añadido ${escapar(dicho)}. Ahora tienes ${total} en total.`,
    restado: (dicho, quedan) => `He quitado ${escapar(dicho)}. Te quedan ${quedan}.`,
    agotado: (dicho, nombre) => `${SONIDOS.borrar} He quitado ${escapar(dicho)}. Ya no queda nada de ${escapar(nombre)}, `
        + 'así que lo he borrado del almacén.',
    borrado: (nombre) => `${SONIDOS.borrar} He borrado ${escapar(nombre)} del almacén.`,
    confirmarBorrar: (nombre, cantidad) => `Ahora tienes ${cantidad} de ${escapar(nombre)}. ¿Seguro que quieres borrarlo del almacén?`,
    noEncontrado: (nombre) => `No tienes ${escapar(nombre)} en el almacén.`,
    encontrado: (nombre, cantidad) => `${SONIDOS.buscar} De ${escapar(nombre)} tienes ${cantidad}.`,

    vacio: 'Todavía no tienes ningún producto guardado.',
    listado: (productos) => (productos.length === 1
        ? `Tienes un producto: ${enumerar(productos)}.`
        : `Tienes ${productos.length} productos: ${enumerar(productos)}.`),
    sinPocoStock: (umbral) => `Ahora mismo no tienes ningún producto con menos de ${umbral} unidades.`,
    pocoStock: (umbral, productos) => `Con menos de ${umbral} unidades tienes: ${enumerar(productos)}.`,

    confirmarVaciar: '¿Seguro que quieres vaciar el almacén? Se borrarán todos los productos.',
    vaciado: `${SONIDOS.vaciar} He vaciado el almacén.`,
    yaVacio: 'El almacén ya estaba vacío.',
    cancelado: 'De acuerdo, no he borrado nada.',

    cantidadNoValida: 'No he entendido la cantidad. Dime un número entero mayor que cero, por ejemplo: guarda tres tomates.',
    productoNoEntendido: 'No he entendido qué producto es. Prueba otra vez, por ejemplo: guarda tres tomates.',

    ayuda: 'Te ayudo a llevar el inventario. Puedes decir: guarda cinco latas de atún; he gastado dos latas de atún; '
        + 'cuántas latas de atún tengo; borra el atún; lista los productos; qué se está acabando, '
        + 'para oír los que tienen menos de diez unidades; o vacía el almacén. ¿Qué quieres hacer?',
    queHacer: '¿Qué quieres hacer? Por ejemplo: guarda tres tomates, o lista los productos.',
    fallback: 'Lo siento, eso no lo sé hacer. Puedes guardar, buscar, quitar o listar productos. ¿Qué quieres hacer?',
    error: 'Lo siento, ha habido un problema. Por favor, inténtalo otra vez.',
    despedida: '¡Hasta luego!',
};
