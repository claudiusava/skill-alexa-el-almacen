// Adaptadores de persistencia para el ASK SDK (interfaz PersistenceAdapter).
// Alexa-hosted crea un bucket S3 por skill y lo expone en S3_PERSISTENCE_BUCKET.
// Se guarda un objeto JSON por usuario, con su userId como clave, igual que
// hacía ask-sdk-s3-persistence-adapter, pero con AWS SDK v3.

const { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

function idUsuario(requestEnvelope) {
    return requestEnvelope.context.System.user.userId;
}

class AdaptadorS3 {
    constructor({ bucket, cliente }) {
        this.bucket = bucket;
        this.cliente = cliente;
    }

    async getAttributes(requestEnvelope) {
        try {
            const respuesta = await this.cliente.send(new GetObjectCommand({
                Bucket: this.bucket,
                Key: idUsuario(requestEnvelope),
            }));
            const texto = await respuesta.Body.transformToString();
            return texto ? JSON.parse(texto) : {};
        } catch (error) {
            const noExiste = error.name === 'NoSuchKey'
                || (error.$metadata && error.$metadata.httpStatusCode === 404);
            if (noExiste) return {};
            throw error;
        }
    }

    async saveAttributes(requestEnvelope, attributes) {
        await this.cliente.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: idUsuario(requestEnvelope),
            Body: JSON.stringify(attributes),
            ContentType: 'application/json',
        }));
    }

    async deleteAttributes(requestEnvelope) {
        await this.cliente.send(new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: idUsuario(requestEnvelope),
        }));
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

function crearAdaptadorPersistencia(env = process.env) {
    if (env.S3_PERSISTENCE_BUCKET) {
        const { S3Client } = require('@aws-sdk/client-s3');
        return new AdaptadorS3({
            bucket: env.S3_PERSISTENCE_BUCKET,
            cliente: new S3Client({ region: env.S3_PERSISTENCE_REGION || env.AWS_REGION }),
        });
    }
    console.warn('S3_PERSISTENCE_BUCKET no está definido: los datos se guardan solo en memoria.');
    return new AdaptadorMemoria();
}

module.exports = { AdaptadorS3, AdaptadorMemoria, crearAdaptadorPersistencia };
