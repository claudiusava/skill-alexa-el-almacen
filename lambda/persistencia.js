// Adaptadores de persistencia para el ASK SDK (interfaz PersistenceAdapter).
// Alexa-hosted crea un bucket S3 por skill y lo expone en S3_PERSISTENCE_BUCKET.
// Se guarda un objeto JSON por usuario, con su userId como clave, igual que
// hacía ask-sdk-s3-persistence-adapter.
//
// No se instala ningún AWS SDK: se usa el que incluye el runtime de Lambda
// (v3 en Node 18 o superior, v2 en Node 16, que es el actual de Alexa-hosted).
// Instalarlo rompe el despliegue: Alexa-hosted instala con yarn 1.x en Node 16
// y las versiones actuales del SDK v3 exigen Node 20.

function idUsuario(requestEnvelope) {
    return requestEnvelope.context.System.user.userId;
}

/** Cliente S3 mínimo ({ leer, escribir, borrar }) sobre AWS SDK v3. */
function clienteS3v3(sdk, { bucket, region }) {
    const s3 = new sdk.S3Client({ region });
    return {
        async leer(clave) {
            try {
                const respuesta = await s3.send(new sdk.GetObjectCommand({ Bucket: bucket, Key: clave }));
                return await respuesta.Body.transformToString();
            } catch (error) {
                if (error.name === 'NoSuchKey' || (error.$metadata && error.$metadata.httpStatusCode === 404)) return null;
                throw error;
            }
        },
        async escribir(clave, texto) {
            await s3.send(new sdk.PutObjectCommand({
                Bucket: bucket, Key: clave, Body: texto, ContentType: 'application/json',
            }));
        },
        async borrar(clave) {
            await s3.send(new sdk.DeleteObjectCommand({ Bucket: bucket, Key: clave }));
        },
    };
}

/** Cliente S3 mínimo ({ leer, escribir, borrar }) sobre AWS SDK v2. */
function clienteS3v2(AWS, { bucket, region }) {
    const s3 = new AWS.S3({ region, signatureVersion: 'v4' });
    return {
        async leer(clave) {
            try {
                const respuesta = await s3.getObject({ Bucket: bucket, Key: clave }).promise();
                return respuesta.Body.toString('utf8');
            } catch (error) {
                if (error.code === 'NoSuchKey' || error.statusCode === 404) return null;
                throw error;
            }
        },
        async escribir(clave, texto) {
            await s3.putObject({ Bucket: bucket, Key: clave, Body: texto, ContentType: 'application/json' }).promise();
        },
        async borrar(clave) {
            await s3.deleteObject({ Bucket: bucket, Key: clave }).promise();
        },
    };
}

/** Crea el cliente con el SDK que haya disponible. `cargar` es require, salvo en los tests. */
function crearClienteS3(opciones, cargar = require) {
    try {
        return clienteS3v3(cargar('@aws-sdk/client-s3'), opciones);
    } catch (error) {
        if (error.code !== 'MODULE_NOT_FOUND') throw error;
    }
    return clienteS3v2(cargar('aws-sdk'), opciones);
}

class AdaptadorS3 {
    /** @param {{ cliente: { leer, escribir, borrar } }} opciones */
    constructor({ cliente }) {
        this.cliente = cliente;
    }

    async getAttributes(requestEnvelope) {
        const texto = await this.cliente.leer(idUsuario(requestEnvelope));
        return texto ? JSON.parse(texto) : {};
    }

    async saveAttributes(requestEnvelope, attributes) {
        await this.cliente.escribir(idUsuario(requestEnvelope), JSON.stringify(attributes));
    }

    async deleteAttributes(requestEnvelope) {
        await this.cliente.borrar(idUsuario(requestEnvelope));
    }
}

/** Persistencia en memoria, para tests y para ejecutar la skill en local. */
class AdaptadorMemoria {
    constructor() {
        this.datos = new Map();
    }

    async getAttributes(requestEnvelope) {
        const guardado = this.datos.get(idUsuario(requestEnvelope));
        return guardado ? JSON.parse(guardado) : {};
    }

    async saveAttributes(requestEnvelope, attributes) {
        this.datos.set(idUsuario(requestEnvelope), JSON.stringify(attributes));
    }

    async deleteAttributes(requestEnvelope) {
        this.datos.delete(idUsuario(requestEnvelope));
    }
}

function crearAdaptadorPersistencia(env = process.env, cargar = require) {
    if (env.S3_PERSISTENCE_BUCKET) {
        return new AdaptadorS3({
            cliente: crearClienteS3({
                bucket: env.S3_PERSISTENCE_BUCKET,
                region: env.S3_PERSISTENCE_REGION || env.AWS_REGION,
            }, cargar),
        });
    }
    console.warn('S3_PERSISTENCE_BUCKET no está definido: los datos se guardan solo en memoria.');
    return new AdaptadorMemoria();
}

module.exports = {
    AdaptadorS3, AdaptadorMemoria, crearAdaptadorPersistencia, crearClienteS3, clienteS3v2, clienteS3v3,
};
