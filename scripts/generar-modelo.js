// Genera skill-package/interactionModels/custom/es-ES.json.
// El modelo se edita aquí y no en el JSON: node scripts/generar-modelo.js
const fs = require('fs');
const path = require('path');

const destino = process.argv[2]
    || path.join(__dirname, '..', 'skill-package', 'interactionModels', 'custom', 'es-ES.json');

function plural(p) {
    const partes = p.split(' ');
    const w = partes[0];
    let pl;
    if (/[aeiouáéó]$/.test(w)) pl = `${w}s`;
    else if (w.endsWith('z')) pl = `${w.slice(0, -1)}ces`;
    else if (w.endsWith('ón')) pl = `${w.slice(0, -2)}ones`;
    else if (w.endsWith('ún')) pl = `${w.slice(0, -2)}unes`;
    else if (w.endsWith('ín')) pl = `${w.slice(0, -2)}ines`;
    else if (w.endsWith('s')) pl = w;
    else pl = `${w}es`;
    partes[0] = pl;
    // adjetivo detrás: "tomate frito" -> "tomates fritos"
    if (partes.length === 2 && /[aeo]$/.test(partes[1])) partes[1] += 's';
    return partes.join(' ');
}

const PRODUCTOS = [
    'arroz', 'pasta', 'macarrón', 'espagueti', 'harina', 'azúcar', 'sal', 'aceite', 'aceite de oliva', 'vinagre',
    'leche', 'huevo', 'pan', 'pan de molde', 'tomate', 'tomate frito', 'patata', 'cebolla', 'ajo', 'zanahoria',
    'lechuga', 'pimiento', 'manzana', 'plátano', 'naranja', 'limón', 'fresa', 'pera', 'uva', 'lenteja',
    'garbanzo', 'alubia', 'atún', 'sardina', 'queso', 'jamón', 'yogur', 'mantequilla', 'café',
    'té', 'cacao', 'galleta', 'cereal', 'chocolate', 'agua', 'refresco', 'cerveza', 'vino',
    'zumo', 'papel higiénico', 'papel de cocina', 'servilleta', 'detergente', 'suavizante', 'lavavajillas', 'lejía',
    'jabón', 'champú', 'gel', 'pasta de dientes', 'cepillo de dientes', 'bolsa de basura', 'pila', 'bombilla',
    'tornillo', 'clavo', 'tuerca', 'cinta adhesiva', 'folio', 'bolígrafo', 'lápiz', 'caja', 'sobre', 'pañal',
    'toallita', 'mascarilla', 'guante', 'pienso', 'comida para perro', 'arena para gato',
];
// Valores con sinónimos fijos en vez de plural automático.
const SINONIMOS = {
    agua: [], té: [], cacao: [], lavavajillas: [], 'papel higiénico': ['rollos de papel higiénico', 'rollo de papel higiénico'],
    pienso: ['piensos'], 'comida para perro': ['comida de perro', 'comida para perros'],
    'arena para gato': ['arena de gato', 'arena para gatos'], champú: ['champús'],
};

const UNIDADES = {
    kilo: ['kilos', 'kilogramo', 'kilogramos'], gramo: ['gramos'], litro: ['litros'],
    paquete: ['paquetes', 'pack', 'packs'], caja: ['cajas'], bote: ['botes', 'tarro', 'tarros'],
    lata: ['latas'], botella: ['botellas'], bolsa: ['bolsas'], saco: ['sacos'], rollo: ['rollos'],
    bandeja: ['bandejas'], brik: ['briks', 'brick', 'bricks'], garrafa: ['garrafas'],
    docena: ['docenas'], unidad: ['unidades'],
};

const valores = (obj) => Object.entries(obj).map(([v, s]) => ({ name: { value: v, synonyms: s } }));
const tipoProducto = PRODUCTOS.map((p) => ({
    name: { value: p, synonyms: SINONIMOS[p] !== undefined ? SINONIMOS[p] : [plural(p)] },
}));

// Combina verbos con plantillas: "{v} {cantidad} {producto}"...
const combinar = (verbos, plantillas) => verbos.flatMap((v) => plantillas.map((t) => t.replace('{v}', v)));

// {uno} recoge "un"/"una" cuando hacen de cantidad: "guarda una lata de atún".
const CON_CANTIDAD = [
    '{v} {cantidad} {producto}', '{v} {cantidad} {unidad} de {producto}',
    '{v} {uno} {producto}', '{v} {uno} {unidad} de {producto}',
];

const registrar = [
    ...combinar(['guarda', 'guárdame', 'añade', 'añádeme', 'agrega', 'suma', 'súmame', 'mete', 'apunta', 'registra'],
        [...CON_CANTIDAD, '{v} {producto}']),
    ...combinar(['he comprado', 'me han llegado', 'nos han llegado', 'han llegado', 'he recibido'], CON_CANTIDAD),
    'ha llegado {cantidad} {producto}', 'me ha llegado {cantidad} {producto}', 'me ha llegado {uno} {producto}',
    'guarda en el almacén {cantidad} {producto}', 'añade al almacén {cantidad} {producto}',
    'guarda {cantidad} {producto} en el almacén', 'añade {cantidad} {producto} al almacén',
    'quiero guardar {cantidad} {producto}', 'quiero guardar {cantidad} {unidad} de {producto}', 'quiero guardar {producto}',
    'quiero añadir {cantidad} {producto}', 'quiero añadir {producto}',
    'guardar un producto', 'guardar producto', 'añadir un producto', 'añadir producto', 'quiero guardar algo',
    'quiero guardar un producto', 'quiero añadir un producto', 'registrar un producto',
];

const borrar = [
    ...combinar(['quita', 'quítame', 'resta', 'réstame', 'saca', 'elimina', 'borra'], [...CON_CANTIDAD, '{v} {producto}']),
    ...combinar(['he gastado', 'he usado', 'he vendido', 'he sacado', 'he consumido', 'me he llevado'], CON_CANTIDAD),
    'se ha acabado el {producto}', 'se ha acabado la {producto}', 'se han acabado los {producto}', 'se han acabado las {producto}',
    'ya no queda {producto}', 'ya no quedan {producto}',
    'quiero quitar {cantidad} {producto}', 'quiero borrar {producto}', 'quiero quitar {producto}',
    'borrar un producto', 'quitar un producto', 'quiero borrar un producto', 'quiero quitar un producto', 'restar un producto',
];

const buscar = [
    ...combinar(['cuántos', 'cuántas', 'cuánto', 'cuánta'], [
        '{v} {producto} tengo', '{v} {producto} hay', '{v} {producto} quedan', '{v} {producto} queda',
        '{v} {producto} me quedan', '{v} {producto} me queda', '{v} {producto} hay en el almacén',
        'dime {v} {producto} tengo', 'dime {v} {producto} hay', 'quiero saber {v} {producto} tengo',
    ]),
    'qué cantidad de {producto} tengo', 'qué cantidad de {producto} hay', 'qué cantidad de {producto} queda',
    'busca {producto}', 'buscar {producto}', 'búscame {producto}', 'quiero buscar {producto}',
    'tengo {producto}', 'me queda {producto}', 'me quedan {producto}', 'queda {producto}', 'quedan {producto}',
    'hay {producto} en el almacén',
    'buscar un producto', 'buscar producto', 'busca un producto', 'quiero buscar un producto',
];

const listar = [
    'lista los productos', 'lista todos los productos', 'lista lo que tengo', 'lista todo', 'listar productos',
    'listar todos los productos', 'lístame los productos', 'dime los productos', 'dime todos los productos',
    'dime qué productos tengo', 'dime qué tengo', 'dime qué hay en el almacén', 'dime lo que tengo guardado',
    'dime todo lo que tengo', 'qué productos tengo', 'qué productos hay', 'qué hay en el almacén',
    'qué tengo en el almacén', 'qué tengo guardado', 'qué hay guardado', 'qué tengo',
    'léeme el inventario', 'dime el inventario', 'inventario', 'quiero saber qué tengo',
    'quiero oír todos los productos', 'repasa el almacén',
];

const pocoStock = [
    'qué se está acabando', 'qué se me está acabando', 'qué productos se están acabando', 'qué se está agotando',
    'qué productos se están agotando', 'qué me queda poco', 'de qué me queda poco', 'de qué queda poco',
    'de qué productos queda poca cantidad', 'qué productos tienen poco stock', 'productos con poco stock',
    'lista los productos con poco stock', 'dime los productos con poco stock', 'qué tengo que comprar',
    'qué tengo que reponer', 'qué debería comprar', 'qué hay que comprar', 'qué hay que reponer',
    'qué productos tengo menos de diez', 'qué me falta', 'qué falta',
];

const vaciar = [
    'vacía el almacén', 'vaciar el almacén', 'vaciar todo el almacén', 'quiero vaciar el almacén',
    // Sin "borra el almacén": se confundía con "borra el arroz".
    'borra todo', 'borra todo el almacén', 'borra todos los productos', 'borrar todos los productos',
    'elimina todos los productos', 'quiero borrar todo', 'quiero borrar todos los productos',
    'restaura el almacén', 'restaurar el almacén', 'reinicia el almacén', 'empieza de cero', 'empezar de cero',
];

const umbral = [
    'avísame cuando queden menos de {umbral}', 'avísame cuando quede menos de {umbral}',
    'cambia el límite de poco stock a {umbral}', 'pon el límite de poco stock en {umbral}',
    'cambia el umbral de poco stock a {umbral}', 'cambia el aviso de poco stock a {umbral}',
    'poco stock es menos de {umbral}', 'considera poco stock menos de {umbral}',
    'quiero que el poco stock sea menos de {umbral}',
    'cambia el límite de poco stock', 'cambiar el límite de poco stock', 'quiero cambiar el límite de poco stock',
    'cambia el aviso de poco stock',
];

const deshacer = [
    'deshaz', 'deshacer', 'deshaz lo último', 'deshacer lo último', 'deshaz eso', 'deshaz el último cambio',
    'anula lo último', 'anula el último cambio', 'me he equivocado', 'me equivoqué', 'eso está mal', 'vuelve atrás',
];

const modelo = {
    interactionModel: {
        languageModel: {
            invocationName: 'guardar en almacén',
            intents: [
                { name: 'AMAZON.CancelIntent', samples: [] },
                { name: 'AMAZON.HelpIntent', samples: ['qué puedo hacer', 'qué puedo decir', 'cómo funciona', 'no sé qué hacer', 'necesito ayuda', 'ayúdame'] },
                { name: 'AMAZON.StopIntent', samples: ['nada', 'nada más', 'eso es todo', 'ya está', 'ya he terminado', 'cierra el almacén', 'salir', 'adiós'] },
                { name: 'AMAZON.NavigateHomeIntent', samples: [] },
                { name: 'AMAZON.FallbackIntent', samples: [] },
                { name: 'AMAZON.YesIntent', samples: [] },
                { name: 'AMAZON.NoIntent', samples: [] },
                { name: 'AMAZON.RepeatIntent', samples: ['repite', 'repítelo', 'qué has dicho', 'puedes repetir'] },
                {
                    name: 'RegistrarProductoIntent',
                    slots: [
                        { name: 'producto', type: 'PRODUCTO', samples: ['{producto}', '{cantidad} {producto}', '{cantidad} {unidad} de {producto}'] },
                        { name: 'cantidad', type: 'AMAZON.NUMBER', samples: ['{cantidad}', '{cantidad} {unidad}', '{cantidad} {producto}'] },
                        { name: 'uno', type: 'UNO' },
                        { name: 'unidad', type: 'UNIDAD' },
                    ],
                    samples: registrar,
                },
                {
                    name: 'BorrarProductoIntent',
                    slots: [
                        { name: 'producto', type: 'PRODUCTO', samples: ['{producto}', '{cantidad} {producto}', '{cantidad} {unidad} de {producto}'] },
                        { name: 'cantidad', type: 'AMAZON.NUMBER' },
                        { name: 'uno', type: 'UNO' },
                        { name: 'unidad', type: 'UNIDAD' },
                    ],
                    samples: borrar,
                },
                {
                    name: 'ConfigurarUmbralIntent',
                    slots: [{ name: 'umbral', type: 'AMAZON.NUMBER', samples: ['{umbral}', 'menos de {umbral}'] }],
                    samples: umbral,
                },
                { name: 'DeshacerIntent', slots: [], samples: deshacer },
                {
                    name: 'BuscarProductoIntent',
                    slots: [{ name: 'producto', type: 'PRODUCTO', samples: ['{producto}'] }],
                    samples: buscar,
                },
                { name: 'ListarProductosIntent', slots: [], samples: listar },
                { name: 'ProductosPocoStockIntent', slots: [], samples: pocoStock },
                { name: 'RestaurarAlmacenIntent', slots: [], samples: vaciar },
            ],
            types: [
                { name: 'PRODUCTO', values: tipoProducto },
                { name: 'UNIDAD', values: valores(UNIDADES) },
                { name: 'UNO', values: valores({ un: ['uno'], una: [] }) },
            ],
        },
        dialog: {
            intents: [
                {
                    name: 'RegistrarProductoIntent',
                    confirmationRequired: false,
                    prompts: {},
                    slots: [
                        { name: 'producto', type: 'PRODUCTO', elicitationRequired: true, confirmationRequired: false, prompts: { elicitation: 'Elicit.Registrar.producto' } },
                        // No es obligatoria: "guarda un tomate" no la rellena y, si falta, la pide la lambda.
                        {
                            name: 'cantidad', type: 'AMAZON.NUMBER', elicitationRequired: false, confirmationRequired: false,
                            prompts: { elicitation: 'Elicit.Registrar.cantidad' },
                            validations: [{ type: 'isGreaterThanOrEqualTo', prompt: 'Validar.Registrar.cantidad', value: '1' }],
                        },
                        { name: 'uno', type: 'UNO', elicitationRequired: false, confirmationRequired: false, prompts: {} },
                        { name: 'unidad', type: 'UNIDAD', elicitationRequired: false, confirmationRequired: false, prompts: {} },
                    ],
                },
                {
                    name: 'BorrarProductoIntent',
                    confirmationRequired: false,
                    prompts: {},
                    slots: [
                        { name: 'producto', type: 'PRODUCTO', elicitationRequired: true, confirmationRequired: false, prompts: { elicitation: 'Elicit.Borrar.producto' } },
                        {
                            name: 'cantidad', type: 'AMAZON.NUMBER', elicitationRequired: false, confirmationRequired: false, prompts: {},
                            validations: [{ type: 'isGreaterThanOrEqualTo', prompt: 'Validar.Borrar.cantidad', value: '1' }],
                        },
                        { name: 'uno', type: 'UNO', elicitationRequired: false, confirmationRequired: false, prompts: {} },
                        { name: 'unidad', type: 'UNIDAD', elicitationRequired: false, confirmationRequired: false, prompts: {} },
                    ],
                },
                {
                    name: 'ConfigurarUmbralIntent',
                    confirmationRequired: false,
                    prompts: {},
                    slots: [
                        {
                            name: 'umbral', type: 'AMAZON.NUMBER', elicitationRequired: true, confirmationRequired: false,
                            prompts: { elicitation: 'Elicit.Umbral.umbral' },
                            validations: [{ type: 'isGreaterThanOrEqualTo', prompt: 'Validar.Umbral.umbral', value: '1' }],
                        },
                    ],
                },
                {
                    name: 'BuscarProductoIntent',
                    confirmationRequired: false,
                    prompts: {},
                    slots: [
                        { name: 'producto', type: 'PRODUCTO', elicitationRequired: true, confirmationRequired: false, prompts: { elicitation: 'Elicit.Buscar.producto' } },
                    ],
                },
                {
                    name: 'RestaurarAlmacenIntent',
                    confirmationRequired: true,
                    prompts: { confirmation: 'Confirmar.Restaurar' },
                    slots: [],
                },
            ],
            delegationStrategy: 'ALWAYS',
        },
        prompts: [
            { id: 'Elicit.Registrar.producto', variations: [
                { type: 'PlainText', value: '¿Qué producto quieres guardar?' },
                { type: 'PlainText', value: '¿Qué quieres guardar?' },
            ] },
            { id: 'Elicit.Registrar.cantidad', variations: [
                { type: 'PlainText', value: '¿Cuántos {producto} quieres guardar?' },
                { type: 'PlainText', value: '¿Qué cantidad de {producto} guardo?' },
            ] },
            { id: 'Validar.Registrar.cantidad', variations: [
                { type: 'PlainText', value: 'Necesito un número mayor que cero. ¿Cuántos {producto} quieres guardar?' },
            ] },
            { id: 'Elicit.Borrar.producto', variations: [
                { type: 'PlainText', value: '¿Qué producto quieres quitar?' },
            ] },
            { id: 'Validar.Borrar.cantidad', variations: [
                { type: 'PlainText', value: 'Necesito un número mayor que cero. ¿Cuántos {producto} quieres quitar?' },
            ] },
            { id: 'Elicit.Buscar.producto', variations: [
                { type: 'PlainText', value: '¿Qué producto quieres buscar?' },
            ] },
            { id: 'Elicit.Umbral.umbral', variations: [
                { type: 'PlainText', value: '¿Por debajo de cuántas unidades quieres que un producto cuente como poco stock?' },
            ] },
            { id: 'Validar.Umbral.umbral', variations: [
                { type: 'PlainText', value: 'Necesito un número mayor que cero. ¿Por debajo de cuántas unidades te aviso?' },
            ] },
            { id: 'Confirmar.Restaurar', variations: [
                { type: 'PlainText', value: '¿Seguro que quieres vaciar el almacén? Se borrarán todos los productos.' },
            ] },
        ],
    },
};

// Comprobaciones básicas: sin duplicados entre intents.
const todas = new Map();
for (const i of modelo.interactionModel.languageModel.intents) {
    for (const s of i.samples) {
        const k = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (todas.has(k)) throw new Error(`Frase repetida "${s}" en ${i.name} y ${todas.get(k)}`);
        todas.set(k, i.name);
    }
}
fs.writeFileSync(destino, `${JSON.stringify(modelo, null, 2)}\n`);
console.log(`Modelo generado: ${todas.size} frases, ${tipoProducto.length} productos -> ${destino}`);
