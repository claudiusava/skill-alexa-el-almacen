// Prueba AdaptadorS3 con el cliente real de AWS SDK v3 contra un servidor HTTP
// local que imita S3. Así se comprueba el SDK completo (firma, XML, reintentos)
// en la versión de Node del entorno, sin tocar AWS.

const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { S3Client } = require('@aws-sdk/client-s3');
const { AdaptadorS3, AdaptadorMemoria, crearAdaptadorPersistencia } = require('../persistencia');

const NO_EXISTE = '<?xml version="1.0" encoding="UTF-8"?>'
    + '<Error><Code>NoSuchKey</Code><Message>The specified key does not exist.</Message></Error>';

function servidorS3() {
    const objetos = new Map();
    const servidor = http.createServer((peticion, respuesta) => {
        const clave = decodeURIComponent(peticion.url.split('?')[0]);
        let cuerpo = '';
        peticion.on('data', (trozo) => { cuerpo += trozo; });
        peticion.on('end', () => {
            if (peticion.method === 'PUT') {
                objetos.set(clave, cuerpo);
                respuesta.writeHead(200, { ETag: '"1"' }).end();
            } else if (peticion.method === 'GET' && objetos.has(clave)) {
                respuesta.writeHead(200, { 'Content-Type': 'application/json' }).end(objetos.get(clave));
            } else if (peticion.method === 'GET') {
                respuesta.writeHead(404, { 'Content-Type': 'application/xml' }).end(NO_EXISTE);
            } else if (peticion.method === 'DELETE') {
                objetos.delete(clave);
                respuesta.writeHead(204).end();
            } else {
                respuesta.writeHead(405).end();
            }
        });
    });
    return new Promise((resolver) => {
        servidor.listen(0, '127.0.0.1', () => resolver({ servidor, objetos, puerto: servidor.address().port }));
    });
}

function sobre(userId) {
    return { context: { System: { user: { userId } } } };
}

test('AdaptadorS3 guarda, lee y borra un objeto JSON por usuario', async () => {
    const { servidor, objetos, puerto } = await servidorS3();
    try {
        const cliente = new S3Client({
            region: 'us-east-1',
            endpoint: `http://127.0.0.1:${puerto}`,
            forcePathStyle: true,
            credentials: { accessKeyId: 'prueba', secretAccessKey: 'prueba' },
            maxAttempts: 1,
        });
        const adaptador = new AdaptadorS3({ bucket: 'bucket', cliente });
        const usuario = sobre('amzn1.ask.account.ABC');

        assert.deepStrictEqual(await adaptador.getAttributes(usuario), {});

        await adaptador.saveAttributes(usuario, { version: 2, productos: [{ nombre: 'arroz', cantidad: 2 }] });
        assert.ok(objetos.has('/bucket/amzn1.ask.account.ABC'));
        assert.deepStrictEqual(await adaptador.getAttributes(usuario),
            { version: 2, productos: [{ nombre: 'arroz', cantidad: 2 }] });

        await adaptador.deleteAttributes(usuario);
        assert.deepStrictEqual(await adaptador.getAttributes(usuario), {});
    } finally {
        servidor.close();
    }
});

test('AdaptadorS3 propaga los errores que no son "no existe"', async () => {
    const cliente = { send: async () => { throw Object.assign(new Error('Acceso denegado'), { name: 'AccessDenied' }); } };
    const adaptador = new AdaptadorS3({ bucket: 'bucket', cliente });
    await assert.rejects(adaptador.getAttributes(sobre('u')), /Acceso denegado/);
});

test('crearAdaptadorPersistencia elige S3 en Alexa-hosted y memoria en local', () => {
    const s3 = crearAdaptadorPersistencia({ S3_PERSISTENCE_BUCKET: 'bucket', S3_PERSISTENCE_REGION: 'us-east-1' });
    assert.ok(s3 instanceof AdaptadorS3);
    assert.strictEqual(s3.bucket, 'bucket');

    const avisoOriginal = console.warn;
    console.warn = () => {};
    try {
        assert.ok(crearAdaptadorPersistencia({}) instanceof AdaptadorMemoria);
    } finally {
        console.warn = avisoOriginal;
    }
});
