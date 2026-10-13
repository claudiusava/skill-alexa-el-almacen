// Lógica pura del inventario: no depende de Alexa ni de la persistencia.
// Un inventario es un array de productos { clave, nombre, cantidad, unidad? }.

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

// Singular y plural con que se lee cada unidad que se guarda con el producto.
const FORMAS_UNIDAD = {
    kilo: ['kilo', 'kilos'],
    gramo: ['gramo', 'gramos'],
    litro: ['litro', 'litros'],
    paquete: ['paquete', 'paquetes'],
    caja: ['caja', 'cajas'],
    bote: ['bote', 'botes'],
    lata: ['lata', 'latas'],
    botella: ['botella', 'botellas'],
    bolsa: ['bolsa', 'bolsas'],
    saco: ['saco', 'sacos'],
    rollo: ['rollo', 'rollos'],
    bandeja: ['bandeja', 'bandejas'],
    brik: ['brik', 'briks'],
    garrafa: ['garrafa', 'garrafas'],
};

// "Docena" multiplica la cantidad; "unidad" no aporta nada. Ninguna se guarda.
const MULTIPLICADORES = { docena: 12 };

// Formas de decir "todo" al pedir borrar: "borra todo", "borra el almacén"...
const TODO = new Set(['todo', 'todos', 'almacen', 'todo almacen', 'todos productos', 'todo que tengo', 'todo lo que tengo']);

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

/** ¿El "producto" que se quiere borrar es en realidad todo el almacén? */
function pideTodo(producto) {
    const palabras = normalizarTexto(producto).split(' ').filter((p) => p && !ARTICULOS.has(p));
    return TODO.has(palabras.join(' '));
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
 * @param {object} slots { producto, productoResuelto, cantidad, uno, unidad, unidadResuelta } (texto tal como llega
 *   de Alexa; `uno` es "un"/"una" cuando el usuario dice "guarda un tomate").
 * @returns {{ error: 'producto'|'cantidad' }
 *   | { nombre: string, nombreDicho: string, cantidad: number|null, unidad: string|null, dicho: string }}
 *   `nombre` es el que se guarda; `nombreDicho` es el producto tal como lo dijo el usuario ("latas de atún");
 *   `unidad` es la unidad canónica que se guarda con el producto, si la hay;
 *   y `dicho` incluye además la cantidad y la unidad ("3 kilos de arroz").
 */
function interpretarPedido({ producto, productoResuelto, cantidad: cantidadSlot, uno, unidad, unidadResuelta }) {
    let texto = limpiarNombre(producto);
    let cantidad = cantidadSlot;
    // A veces Alexa mete el número dentro del producto: "20 rollos de papel higiénico".
    const numeroInicial = /^(\d+) (.+)$/.exec(texto);
    if (numeroInicial && (cantidad === undefined || cantidad === null || cantidad === '')) {
        [, cantidad, texto] = numeroInicial;
    }
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
    const unidadGuardada = FORMAS_UNIDAD[unidadCanonica] ? unidadCanonica : null;

    const sinCantidad = cantidad === undefined || cantidad === null || cantidad === '';
    if (sinCantidad && !uno) {
        return { nombre, nombreDicho, cantidad: null, unidad: unidadGuardada, dicho: nombreDicho };
    }
    const numero = sinCantidad ? 1 : Number(cantidad);
    if (!Number.isInteger(numero) || numero < 1) return { error: 'cantidad' };

    const multiplicador = MULTIPLICADORES[unidadCanonica] || 1;
    const numeroDicho = sinCantidad ? limpiarNombre(uno) : numero;
    const dicho = [numeroDicho, unidadDicha && `${unidadDicha} de`, nombreDicho].filter(Boolean).join(' ');
    return { nombre, nombreDicho, cantidad: numero * multiplicador, unidad: unidadGuardada, dicho };
}

/** "4", "2 kilos", "1 kilo": la cantidad de un producto tal como se lee. */
function cantidadLeida(producto) {
    const formas = FORMAS_UNIDAD[producto.unidad];
    if (!formas) return String(producto.cantidad);
    return `${producto.cantidad} ${producto.cantidad === 1 ? formas[0] : formas[1]}`;
}

function buscar(productos, nombre) {
    const clave = claveDe(nombre);
    return productos.find((p) => p.clave === clave) || null;
}

/** Suma `cantidad` al producto, creándolo si no existe. La unidad solo se fija al crearlo. */
function anadir(productos, nombre, cantidad, unidad = null) {
    const existente = buscar(productos, nombre);
    if (existente) {
        existente.cantidad += cantidad;
        return { producto: existente, nuevo: false };
    }
    const producto = { clave: claveDe(nombre), nombre: limpiarNombre(nombre), cantidad };
    if (unidad) producto.unidad = unidad;
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

/** Copia ordenada alfabéticamente, para leer listas. */
function ordenados(productos) {
    return [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

module.exports = {
    UMBRAL_POCO_STOCK,
    normalizarTexto,
    limpiarNombre,
    claveDe,
    pideTodo,
    interpretarPedido,
    cantidadLeida,
    buscar,
    anadir,
    quitar,
    eliminar,
    conPocoStock,
    ordenados,
};
