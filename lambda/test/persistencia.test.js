// Prueba el adaptador S3 con imitaciones de AWS SDK v3 y v2. El SDK real no se
// instala (lo pone el runtime de Lambda); su uso real se comprueba desplegando
// en la fase de desarrollo.

const test = require('node:test');
const assert = require('node:assert');
const {
    AdaptadorS3, AdaptadorMemoria, crearAdaptadorPersistencia, crearClienteS3, clienteS3v2, clienteS3v3,
} = require('../persistencia');

function errorNoExiste(version) {
    return version === 3
        ? Object.assign(new Error('The specified key does not exist.'), { name: 'NoSuchKey', $metadata: { httpStatusCode: 404 } })
        : Object.assign(new Error('The specified key does not exist.'), { code: 'NoSuchKey', statusCode: 404 });
}

/** Imita @aws-sdk/client-s3 guardando los objetos en un Map. */
function sdkV3Falso(objetos, llamadas = []) {
    const comando = (tipo) => class { constructor(input) { this.tipo = tipo; this.input = input; } };
    return {
        S3Client: class {
            constructor(config) { llamadas.push(['config', config]); }
            async send(c) {
                llamadas.push([c.tipo, c.input]);
                const clave = `${c.input.Bucket}/${c.input.Key}`;
                if (c.tipo === 'put') { objetos.set(clave, c.input.Body); return {}; }
                if (c.tipo === 'delete') { objetos.delete(clave); return {}; }
                if (!objetos.has(clave)) throw errorNoExiste(3);
                return { Body: { transformToString: async () => objetos.get(clave) } };
            }
        },
        GetObjectCommand: comando('get'),
        PutObjectCommand: comando('put'),
        DeleteObjectCommand: comando('delete'),
    };
}

/** Imita aws-sdk v2 guardando los objetos en un Map. */
function sdkV2Falso(objetos) {
    const peticion = (fn) => ({ promise: async () => fn() });
    return {
        S3: class {
            getObject({ Bucket, Key }) {
                return peticion(() => {
                    if (!objetos.has(`${Bucket}/${Key}`)) throw errorNoExiste(2);
                    return { Body: Buffer.from(objetos.get(`${Bucket}/${Key}`), 'utf8') };
                });
            }
            putObject({ Bucket, Key, Body }) { return peticion(() => objetos.set(`${Bucket}/${Key}`, Body)); }
            deleteObject({ Bucket, Key }) { return peticion(() => objetos.delete(`${Bucket}/${Key}`)); }
        },
    };
}

const usuario = { context: { System: { user: { userId: 'amzn1.ask.account.ABC' } } } };

for (const [version, crearCliente] of [
    ['v3', (objetos) => clienteS3v3(sdkV3Falso(objetos), { bucket: 'bucket', region: 'us-east-1' })],
    ['v2', (objetos) => clienteS3v2(sdkV2Falso(objetos), { bucket: 'bucket', region: 'us-east-1' })],
]) {
    test(`AdaptadorS3 (${version}) guarda, lee y borra un JSON por usuario`, async () => {
        const objetos = new Map();
        const adaptador = new AdaptadorS3({ cliente: crearCliente(objetos) });

        assert.deepStrictEqual(await adaptador.getAttributes(usuario), {});

        await adaptador.saveAttributes(usuario, { version: 2, productos: [{ nombre: 'arroz', cantidad: 2 }] });
        assert.deepStrictEqual([...objetos.keys()], ['bucket/amzn1.ask.account.ABC']);
        assert.deepStrictEqual(await adaptador.getAttributes(usuario),
            { version: 2, productos: [{ nombre: 'arroz', cantidad: 2 }] });

        await adaptador.deleteAttributes(usuario);
        assert.deepStrictEqual(await adaptador.getAttributes(usuario), {});
    });
}

test('AdaptadorS3 propaga los errores que no son "no existe"', async () => {
    const sdk = sdkV3Falso(new Map());
    sdk.S3Client.prototype.send = async () => { throw Object.assign(new Error('Acceso denegado'), { name: 'AccessDenied' }); };
    const adaptador = new AdaptadorS3({ cliente: clienteS3v3(sdk, { bucket: 'b' }) });
    await assert.rejects(adaptador.getAttributes(usuario), /Acceso denegado/);
});

test('crearClienteS3 usa el SDK v3 si existe y si no el v2', async () => {
    const objetos = new Map();
    const noEncontrado = (nombre) => Object.assign(new Error(`Cannot find module '${nombre}'`), { code: 'MODULE_NOT_FOUND' });

    const llamadas = [];
    const conV3 = crearClienteS3({ bucket: 'bucket', region: 'eu-west-1' },
        (nombre) => (nombre === '@aws-sdk/client-s3' ? sdkV3Falso(objetos, llamadas) : sdkV2Falso(objetos)));
    await conV3.escribir('k', '{}');
    assert.deepStrictEqual(llamadas[0], ['config', { region: 'eu-west-1' }]);
    assert.strictEqual(llamadas[1][0], 'put');

    const conV2 = crearClienteS3({ bucket: 'bucket' }, (nombre) => {
        if (nombre === '@aws-sdk/client-s3') throw noEncontrado(nombre);
        return sdkV2Falso(objetos);
    });
    assert.strictEqual(await conV2.leer('k'), '{}');
});

test('crearAdaptadorPersistencia elige S3 en Alexa-hosted y memoria en local', () => {
    const s3 = crearAdaptadorPersistencia({ S3_PERSISTENCE_BUCKET: 'bucket' }, () => sdkV3Falso(new Map()));
    assert.ok(s3 instanceof AdaptadorS3);

    const avisoOriginal = console.warn;
    console.warn = () => {};
    try {
        assert.ok(crearAdaptadorPersistencia({}) instanceof AdaptadorMemoria);
    } finally {
        console.warn = avisoOriginal;
    }
});
