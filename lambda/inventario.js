// Lógica pura del inventario: no depende de Alexa ni de la persistencia.
// Un inventario es un array de productos { clave, nombre, cantidad }.

const UMBRAL_POCO_STOCK = 10;

const ARTICULOS = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al']);
const CONECTORES = new Set(['de', 'del', 'con', 'sin', 'para', 'en', 'y', 'a', 'al']);

// Formas habladas de cada unidad -> unidad canónica.
const UNIDADES = {
    kilo: 'kilo', kilos: 'kilo', kilogramo: 'kilo', kilogramos: 'kilo', kg: 'kilo',
    gramo: 'gramo', gramos: 'gramo',
    litro: 'litro', litros: 'litro',
    paquete: 'paquete', paquetes: 'paquete', pack: 'paquete', packs: 'paquete',
    caja: 'caja', cajas: 'caja',
    bote: 'bote', botes: 'bote', tarro: 'bote', tarros: 'bote',
    lata: 'lata', latas: 'lata',
    botella: 'botella', botellas: 'botella',
    bolsa: 'bolsa', bolsas: 'bolsa',
    saco: 'saco', sacos: 'saco',
    rollo: 'rollo', rollos: 'rollo',
    bandeja: 'bandeja', bandejas: 'bandeja',
    brik: 'brik', briks: 'brik', brick: 'brik', bricks: 'brik',
    garrafa: 'garrafa', garrafas: 'garrafa',
    docena: 'docena', docenas: 'docena',
    unidad: 'unidad', unidades: 'unidad',
};

// Unidades que multiplican la cantidad en lugar de describir el envase.
const MULTIPLICADORES = { docena: 12 };

/** Minúsculas, sin acentos ni signos, con espacios simples. */
function normalizarTexto(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

/** Quita artículos y espacios sobrantes al principio, conservando acentos: "los tomates" -> "tomates". */
function limpiarNombre(texto) {
    const palabras = String(texto || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
    while (palabras.length > 1 && ARTICULOS.has(normalizarTexto(palabras[0]))) {
        palabras.shift();
    }
    return palabras.join(' ');
}

/**
 * Reduce una palabra a una raíz común para singular y plural:
 * tomate/tomates -> tomat, limón/limones -> limon, nuez/nueces -> nuec.
 * Solo se usa para comparar, nunca se le dice al usuario.
 */
function raiz(palabra) {
    if (CONECTORES.has(palabra)) return palabra;
    let r = palabra;
    if (r.length > 3 && r.endsWith('s')) r = r.slice(0, -1);
    if (r.length > 3 && r.endsWith('e') && !'aeiou'.includes(r[r.length - 2])) r = r.slice(0, -1);
    if (r.endsWith('z')) r = `${r.slice(0, -1)}c`;
    return r;
}

/** Clave con la que se identifica un producto, independiente de mayúsculas, acentos y plural. */
function claveDe(nombre) {
    return normalizarTexto(limpiarNombre(nombre)).split(' ').filter(Boolean).map(raiz).join(' ');
}

/** Separa una unidad inicial: "kilos de arroz" -> { unidad: 'kilo', unidadDicha: 'kilos', resto: 'arroz' }. */
function separarUnidad(texto) {
    const palabras = texto.split(' ');
    const unidad = UNIDADES[normalizarTexto(palabras[0])];
    if (unidad && palabras.length > 2 && normalizarTexto(palabras[1]) === 'de') {
        return { unidad, unidadDicha: palabras[0], resto: palabras.slice(2).join(' ') };
    }
    return { unidad: null, unidadDicha: null, resto: texto };
}

/**
 * Interpreta los valores de los slots de un pedido.
 * @param {object} slots { producto, productoResuelto, cantidad, unidad, unidadResuelta } (texto tal como llega de Alexa)
 * @returns {{ error: 'producto'|'cantidad' } | { nombre: string, nombreDicho: string, cantidad: number|null, dicho: string }}
 *   `nombre` es el que se guarda; `nombreDicho` es el producto tal como lo dijo el usuario ("latas de atún")
 *   y `dicho` incluye además la cantidad y la unidad ("3 kilos de arroz").
 */
function interpretarPedido({ producto, productoResuelto, cantidad, unidad, unidadResuelta }) {
    const texto = limpiarNombre(producto);
    if (!texto || !claveDe(texto)) return { error: 'producto' };

    // "bolsas de basura" es un producto del catálogo, no 'bolsa' + 'basura'.
    const esProductoEntero = productoResuelto && claveDe(productoResuelto) === claveDe(texto);
    const separado = esProductoEntero
        ? { unidad: null, unidadDicha: null, resto: texto }
        : separarUnidad(texto);
    const unidadDicha = unidad ? limpiarNombre(unidad) : separado.unidadDicha;
    const unidadCanonica = unidad
        ? (unidadResuelta || UNIDADES[normalizarTexto(unidadDicha)] || null)
        : separado.unidad;
    const nombreDicho = separado.resto;
    const nombre = !separado.unidad && productoResuelto ? productoResuelto : nombreDicho;

    if (cantidad === undefined || cantidad === null || cantidad === '') {
        return { nombre, nombreDicho, cantidad: null, dicho: nombreDicho };
    }
    const numero = Number(cantidad);
    if (!Number.isInteger(numero) || numero < 1) return { error: 'cantidad' };

    const multiplicador = MULTIPLICADORES[unidadCanonica] || 1;
    const dicho = [numero, unidadDicha && `${unidadDicha} de`, nombreDicho].filter(Boolean).join(' ');
    return { nombre, nombreDicho, cantidad: numero * multiplicador, dicho };
}

function buscar(productos, nombre) {
    const clave = claveDe(nombre);
    return productos.find((p) => p.clave === clave) || null;
}

/** Suma `cantidad` al producto, creándolo si no existe. */
function anadir(productos, nombre, cantidad) {
    const existente = buscar(productos, nombre);
    if (existente) {
        existente.cantidad += cantidad;
        return { producto: existente, nuevo: false };
    }
    const producto = { clave: claveDe(nombre), nombre: limpiarNombre(nombre), cantidad };
    productos.push(producto);
    return { producto, nuevo: true };
}

/** Resta `cantidad`; si no queda nada, elimina el producto. */
function quitar(productos, nombre, cantidad) {
    const producto = buscar(productos, nombre);
    if (!producto) return { estado: 'no-encontrado' };
    if (cantidad >= producto.cantidad) {
        eliminar(productos, nombre);
        return { estado: 'agotado', producto };
    }
    producto.cantidad -= cantidad;
    return { estado: 'restado', producto };
}

function eliminar(productos, nombre) {
    const indice = productos.findIndex((p) => p.clave === claveDe(nombre));
    if (indice === -1) return null;
    return productos.splice(indice, 1)[0];
}

function conPocoStock(productos, umbral = UMBRAL_POCO_STOCK) {
    return productos.filter((p) => p.cantidad < umbral);
}

module.exports = {
    UMBRAL_POCO_STOCK,
    normalizarTexto,
    limpiarNombre,
    claveDe,
    interpretarPedido,
    buscar,
    anadir,
    quitar,
    eliminar,
    conPocoStock,
};
