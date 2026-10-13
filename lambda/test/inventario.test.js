const test = require('node:test');
const assert = require('node:assert');
const inv = require('../inventario');

test('claveDe trata igual singular, plural, mayúsculas, acentos y artículos', () => {
    const grupos = [
        ['tomate', 'Tomates', 'los tomates', 'un tomate'],
        ['limón', 'limones', 'Limon'],
        ['nuez', 'nueces'],
        ['lápiz', 'lápices'],
        ['pan', 'panes'],
        ['papel', 'papeles'],
        ['carne', 'carnes'],
        ['café', 'cafés'],
        ['lata de atún', 'latas de atún', 'las latas de atun'],
        ['tomate frito', 'tomates fritos'],
    ];
    for (const grupo of grupos) {
        const claves = new Set(grupo.map(inv.claveDe));
        assert.strictEqual(claves.size, 1, `${grupo.join(' / ')} -> ${[...claves].join(' / ')}`);
    }
    assert.notStrictEqual(inv.claveDe('pan'), inv.claveDe('pera'));
    assert.notStrictEqual(inv.claveDe('tomate'), inv.claveDe('tomate frito'));
});

test('limpiarNombre quita artículos iniciales pero no los del medio', () => {
    assert.strictEqual(inv.limpiarNombre('  Las Latas de Atún '), 'latas de atún');
    assert.strictEqual(inv.limpiarNombre('la'), 'la');
});

test('interpretarPedido con cantidad, unidad en su slot y docenas', () => {
    assert.deepStrictEqual(
        inv.interpretarPedido({ producto: 'arroz', cantidad: '3', unidad: 'kilos' }),
        { nombre: 'arroz', nombreDicho: 'arroz', cantidad: 3, dicho: '3 kilos de arroz' },
    );
    assert.deepStrictEqual(
        inv.interpretarPedido({ producto: 'huevos', cantidad: '2', unidad: 'docenas', unidadResuelta: 'docena' }),
        { nombre: 'huevos', nombreDicho: 'huevos', cantidad: 24, dicho: '2 docenas de huevos' },
    );
});

test('interpretarPedido separa la unidad cuando Alexa la mete dentro del producto', () => {
    assert.deepStrictEqual(
        inv.interpretarPedido({ producto: 'paquetes de arroz', cantidad: '2' }),
        { nombre: 'arroz', nombreDicho: 'arroz', cantidad: 2, dicho: '2 paquetes de arroz' },
    );
    assert.strictEqual(inv.interpretarPedido({ producto: 'latas de atún', cantidad: '3' }).nombre, 'atún');
    assert.strictEqual(inv.interpretarPedido({ producto: 'lata', cantidad: '1' }).nombre, 'lata');
    // Un producto del catálogo que empieza por una unidad no se separa.
    assert.deepStrictEqual(
        inv.interpretarPedido({ producto: 'bolsas de basura', productoResuelto: 'bolsa de basura', cantidad: '2' }),
        { nombre: 'bolsa de basura', nombreDicho: 'bolsas de basura', cantidad: 2, dicho: '2 bolsas de basura' },
    );
});

test('interpretarPedido usa el valor del catálogo si lo hay', () => {
    const pedido = inv.interpretarPedido({ producto: 'tomates', productoResuelto: 'tomate', cantidad: '3' });
    assert.strictEqual(pedido.nombre, 'tomate');
    assert.strictEqual(pedido.dicho, '3 tomates');
});

test('interpretarPedido detecta producto o cantidad no válidos', () => {
    assert.deepStrictEqual(inv.interpretarPedido({ producto: undefined, cantidad: '3' }), { error: 'producto' });
    assert.deepStrictEqual(inv.interpretarPedido({ producto: 'arroz', cantidad: '?' }), { error: 'cantidad' });
    assert.deepStrictEqual(inv.interpretarPedido({ producto: 'arroz', cantidad: '0' }), { error: 'cantidad' });
    assert.strictEqual(inv.interpretarPedido({ producto: 'arroz' }).cantidad, null);
});

test('anadir crea o suma; quitar resta o agota; eliminar quita el correcto', () => {
    const productos = [];
    assert.strictEqual(inv.anadir(productos, 'tomates', 3).nuevo, true);
    assert.strictEqual(inv.anadir(productos, 'arroz', 1).nuevo, true);
    assert.strictEqual(inv.anadir(productos, 'leche', 6).nuevo, true);
    const suma = inv.anadir(productos, 'Tomate', 2);
    assert.strictEqual(suma.nuevo, false);
    assert.strictEqual(suma.producto.cantidad, 5);
    assert.strictEqual(suma.producto.nombre, 'tomates');

    assert.strictEqual(inv.quitar(productos, 'tomate', 2).estado, 'restado');
    assert.strictEqual(inv.buscar(productos, 'tomate').cantidad, 3);
    assert.strictEqual(inv.quitar(productos, 'pera', 1).estado, 'no-encontrado');

    // Regresión: en 2020 se borraba el último producto en vez del pedido.
    assert.strictEqual(inv.quitar(productos, 'arroz', 5).estado, 'agotado');
    assert.deepStrictEqual(productos.map((p) => p.nombre), ['tomates', 'leche']);

    assert.strictEqual(inv.eliminar(productos, 'tomates').nombre, 'tomates');
    assert.strictEqual(inv.eliminar(productos, 'tomates'), null);
    assert.deepStrictEqual(productos.map((p) => p.nombre), ['leche']);
});

test('conPocoStock devuelve los que están por debajo del umbral', () => {
    const productos = [];
    inv.anadir(productos, 'arroz', 9);
    inv.anadir(productos, 'pasta', 10);
    inv.anadir(productos, 'sal', 1);
    assert.deepStrictEqual(inv.conPocoStock(productos).map((p) => p.nombre), ['arroz', 'sal']);
    assert.strictEqual(inv.UMBRAL_POCO_STOCK, 10);
});
