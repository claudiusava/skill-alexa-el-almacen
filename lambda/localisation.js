module.exports = {
    es:{
        translation: {
                SONIDO_ABRIR: '<audio src="soundbank://soundlibrary/alarms/beeps_and_bloops/intro_02"/>',
        MSG_BIENVENIDA_CORTO: '$t(SONIDO_ABRIR) ¡Hola %s! ¿Qué deseas hacer?',
        MSG_BIENVENIDA_CON_INFO_PERMISO_NOMBRE:'$t(SONIDO_ABRIR) ¡Hola! Antes de nada, si quieres una experiencia más personalizada, activa los permisos de nombre de usuario en la app de Alexa en tu móvil. En esta skill tienes las opciones de guardar, listar, listar solo productos con poco stock, buscar, borrar o restaurar el almacén. ¿Qué deseas hacer?.',
        MSG_BIENVENIDA: '$t(SONIDO_ABRIR) ¡Hola %s! Tienes las opciones de guardar, listar, listar solo productos con poco stock, buscar, borrar o restaurar el almacén. ¿Qué deseas hacer?.',
        MSG_PRODUCTOS_REGISTRADOS: 'Recordaré que has guardado %s %s.',
        MSG_LISTAR_PRODUCTOS: 'Tienes guardado: ',
        MSG_NO_HAY_PRODUCTOS: 'Todavía no tienes guardado ningún producto.',
        MSG_CANTIDAD_SUMADA: 'He añadido %s a %s, ahora tienes %s.',
        MSG_CANTIDAD_RESTADA: 'He restado %s a %s, ahora tienes %s.',
        MSG_ALGO_MAS: '¿Qué más quieres hacer?',
        MSG_PRODUCTO_NO_ENCONTRADO: 'No tienes %s guardado.',
                SONIDO_BUSCAR_PRODUCTO: '<audio src="soundbank://soundlibrary/cloth_leather_paper/books/books_01"/>',
        MSG_PRODUCTO_ENCONTRADO: '$t(SONIDO_BUSCAR_PRODUCTO) Hay %s %s.',
                SONIDO_PRODUCTO_BORRADO : '<audio src="soundbank://soundlibrary/cartoon/amzn_sfx_boing_short_1x_01"/>',
        MSG_PRODUCTO_BORRADO: '$t(SONIDO_PRODUCTO_BORRADO) El producto %s ha sido borrado.',
                SONIDO_ALMACEN_RESTAURADO: '<audio src="soundbank://soundlibrary/cartoon/amzn_sfx_boing_long_1x_01"/>',
        MSG_NO_HAY_PRODUCTOS_CON_POCO_STOCK:'De momento no tienes productos con poco stock en el almacén.',
        MSG_LISTAR_PRODUCTOS_CON_POCO_STOCK: 'Los productos que quedan en el almacén con una cantidad menor a 10 son: ',
        MSG_ALMACEN_RESTAURADO: '$t(SONIDO_ALMACEN_RESTAURADO) El almacén ha sido vaciado.',
            MSG_AYUDA: 'Esta es una Skill en la que puedes guardar, buscar, listar, listar solo los que tengan poco stock o borrar productos de un almacén. También tienes la opción de restaurar el almacén por completo. Prueba a decirme lo que quieres hacer.',
            MSG_FALLBACK: 'Lo siento, no se nada sobre eso. Por favor inténtalo otra vez.',
            MSG_REPROMPT: 'Si no sabes como continuar intenta pedir ayuda. Si quieres salir solo dí para. ¿Qué quieres hacer? ',
            MSG_ERROR: 'Lo siento, ha habido un problema. Por favor inténtalo otra vez.',
        MSG_DESPEDIDA: '¡Hasta luego!'
    }
  }
}