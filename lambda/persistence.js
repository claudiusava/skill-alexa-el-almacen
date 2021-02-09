module.exports = {
    //FUNCION DE PERSISTENCIA
    getPersistenceAdapter(tableName) {
    // Esta función es una forma indirecta de detectar si esto es parte de una habilidad alojada en Alexa.
    function isAlexaHosted() {
        return process.env.S3_PERSISTENCE_BUCKET;
    }
    if (isAlexaHosted()) {
        const {S3PersistenceAdapter} = require('ask-sdk-s3-persistence-adapter');
        return new S3PersistenceAdapter({
            bucketName: process.env.S3_PERSISTENCE_BUCKET
        });
    } else {
        // IMPORTANTE: no olvide otorgar acceso a DynamoDB al rol que está utilizando para ejecutar esta lambda (a través de la política de IAM)
        const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
        return new DynamoDbPersistenceAdapter({
            tableName: tableName || 'el_almacen',
            createTable: true
        });
    }
}
}