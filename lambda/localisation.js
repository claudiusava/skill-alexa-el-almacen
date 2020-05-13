module.exports = {
    es:{
        translation: {
            SONIDO_ABRIR: '<audio src="soundbank://soundlibrary/alarms/beeps_and_bloops/intro_02"/>',
        MSG_BIENVENIDA: '$t(SONIDO_ABRIR) ¡Hola! Puedes guardar, listar, buscar o borrar. ¿Qué deseas hacer?.',
        MSG_PRODUCTOS_REGISTRADOS: 'Recordaré que has guardado %s %s.',
        MSG_LISTAR_PRODUCTOS: 'Tienes guardado: ',
        MSG_NO_HAY_PRODUCTOS: 'Todavía no tienes guardado ningún producto.',
        MSG_CANTIDAD_SUMADA: 'He añadido %s a %s, ahora tienes %s.',
        MSG_CANTIDAD_RESTADA: 'He restado %s a %s, ahora tienes %s.',
        MSG_ALGO_MAS: '¿Qué más quieres hacer?',
        MSG_PRODUCTO_NO_ENCONTRADO: 'No tienes %s guardado.',
            SONIDO_BUSCAR_PRODUCTO: '<audio src="soundbank://soundlibrary/cloth_leather_paper/books/books_08"/>',
        MSG_PRODUCTO_ENCONTRADO: '$t(SONIDO_BUSCAR_PRODUCTO) Hay %s %s.',
            SONIDO_PRODUCTO_BORRADO : '<audio src="soundbank://soundlibrary/cartoon/amzn_sfx_boing_short_1x_01"/>',
        MSG_PRODUCTO_BORRADO: '$t(SONIDO_PRODUCTO_BORRADO) El producto %s ha sido borrado.',
            SONIDO_ALMACEN_RESTAURADO: '<audio src="soundbank://soundlibrary/cartoon/amzn_sfx_boing_long_1x_01"/>',
        MSG_ALMACEN_RESTAURADO: '$t(SONIDO_ALMACEN_RESTAURADO) El almacén ha sido vaciado.',
            MSG_AYUDA: 'Esta es una Skill en la que puedes guardar, borrar, listar o eliminar productos, también tienes la opción de restaurar el almacén. Prueba a decirme lo que quieres hacer.',
            MSG_FALLBACK: 'Lo siento, no se nada sobre eso. Por favor inténtalo otra vez.',
            MSG_REPROMPT: 'Si no sabes como continuar intenta pedir ayuda. Si quieres salir solo dí para. ¿Qué quieres hacer? ',
            MSG_ERROR: 'Lo siento, ha habido un problema. Por favor inténtalo otra vez.',
        MSG_DESPEDIDA: '¡Hasta luego!'
    }
  }
}