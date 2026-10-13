# Almacén: skill de Alexa

Skill de Alexa en español (es-ES) para llevar **por voz el inventario** de un pequeño negocio, una despensa o un depósito.

> «Alexa, abre guardar en almacén»

Está publicada en la tienda de skills de Alexa en la categoría *Organizadores y asistentes*, y se aloja con [Alexa-hosted skills](https://developer.amazon.com/es-ES/docs/alexa/hosted-skills/build-a-skill-end-to-end-using-an-alexa-hosted-skill.html) (Node.js, AWS Lambda y S3 gestionados por Amazon).

## Qué hace

| Quieres… | Puedes decir | Intent |
|---|---|---|
| Guardar o sumar | «guarda tres paquetes de arroz», «guarda una lata de atún», «he comprado dos docenas de huevos» | `RegistrarProductoIntent` |
| Restar | «he gastado dos latas de atún», «quita un tomate» | `BorrarProductoIntent` |
| Borrar un producto entero | «borra el arroz», «se han acabado los tomates» (pide confirmación) | `BorrarProductoIntent` |
| Consultar | «¿cuántos tomates tengo?», «¿me queda leche?» | `BuscarProductoIntent` |
| Listar todo | «lista los productos», «¿qué hay en el almacén?» | `ListarProductosIntent` |
| Ver qué se acaba | «¿qué se está acabando?» (menos de 10 unidades, o el límite elegido) | `ProductosPocoStockIntent` |
| Cambiar el límite de poco stock | «avísame cuando queden menos de cinco» | `ConfigurarUmbralIntent` |
| Deshacer | «deshaz lo último», «me he equivocado» | `DeshacerIntent` |
| Repetir | «repite» | `AMAZON.RepeatIntent` |
| Vaciar el almacén | «vacía el almacén» (pide confirmación) | `RestaurarAlmacenIntent` |

Detalles:

- **Singular y plural**: «tomate», «tomates» y «los tomates» son el mismo producto. No importan las mayúsculas ni los acentos.
- **Unidades**: entiende «tres kilos de arroz» o «dos paquetes de arroz». Guarda la cantidad de *arroz* y la unidad con que se creó el producto («De arroz tienes 3 kilos»). Las docenas se multiplican por 12.
- **Listas por partes**: los listados van en orden alfabético y de diez en diez. Tras cada parte pregunta «¿Quieres oírlos?».
- **Deshacer**: «deshaz lo último» revierte la última operación de la conversación (guardar, quitar, borrar o vaciar).
- **Saludo por el nombre**: si el usuario da el permiso `alexa::profile:given_name:read` en la app de Alexa, la skill le saluda por su nombre. Es opcional y el nombre no se guarda.
- Cada usuario (cada cuenta de Amazon) tiene su propio almacén, guardado en S3.

## Estructura

```
├── ask-resources.json          Configuración de ASK CLI (despliegue Alexa-hosted)
├── scripts/generar-modelo.js   Fuente del modelo de interacción (genera es-ES.json)
├── skill-package/
│   ├── skill.json              Manifiesto: nombre, descripción, permisos, privacidad
│   ├── interactionModels/custom/es-ES.json   Modelo de interacción (generado, no editar a mano)
│   └── assets/images/          Iconos de la tienda
└── lambda/                     Código que se ejecuta en AWS Lambda
    ├── index.js                Construye la skill y exporta el handler
    ├── handlers/               Un fichero por intent (sistema.js agrupa los de Amazon)
    ├── inventario.js           Lógica pura: nombres, plurales, unidades, sumar, restar…
    ├── almacen.js              Lee y guarda el almacén del usuario; copia para deshacer
    ├── listas.js               Lectura de listas por páginas
    ├── persistencia.js         Adaptador S3 (SDK del runtime de Lambda) y adaptador en memoria
    ├── textos.js               Todo lo que dice la skill
    ├── comun.js                Utilidades de los handlers
    └── test/                   Tests con node:test
```

Los datos de cada usuario se guardan en un objeto JSON en el bucket S3 de la skill:

```json
{ "version": 2, "sesiones": 4, "umbral": 5, "productos": [{ "clave": "arroz", "nombre": "arroz", "cantidad": 3, "unidad": "kilo" }] }
```

`clave` es la forma normalizada con la que se comparan los nombres. `nombre` es el texto que se lee al usuario.

## Desarrollo

Necesitas **Node.js 16.17 o superior** (para `node:test`).

Alexa-hosted ejecuta la skill en **Node.js 16**, que no se puede cambiar, e instala las dependencias con **yarn 1.x comprobando `engines` de forma estricta**. Si cualquier paquete del árbol exige una versión de Node más nueva, el despliegue falla sin dar más detalle.

Por eso la skill depende solo de `ask-sdk-core` y `ask-sdk-model`, y **no instala el AWS SDK**. `persistencia.js` usa el que trae el runtime de Lambda: v2 en Node 16 y v3 en Node 18 o superior. Si Amazon actualiza el runtime, seguirá funcionando.

Hay dos lockfiles: `yarn.lock` para el despliegue en Amazon y `package-lock.json` para desarrollar con npm. Antes de añadir una dependencia, comprueba que se instala con yarn en Node 16 y regenera los dos.

```bash
cd lambda
npm install
npm test
```

Los tests cubren:

- **La lógica del inventario** (`inventario.test.js`).
- **Todos los handlers** (`handlers.test.js`): invocan la skill con peticiones de Alexa simuladas y una persistencia en memoria.
- **El adaptador S3** (`persistencia.test.js`): usa imitaciones de AWS SDK v2 y v3.

Ninguno necesita credenciales ni conexión.

### Modelo de interacción

Las frases de ejemplo, los slots y el catálogo de productos y unidades se definen en `scripts/generar-modelo.js`. Para cambiarlos, edita ese fichero y ejecuta:

```bash
node scripts/generar-modelo.js
```

El script regenera `skill-package/interactionModels/custom/es-ES.json` y avisa si una frase está repetida en dos intents.

Para comprobar qué entiende Alexa de una frase con el modelo desplegado en desarrollo:

```bash
ask smapi profile-nlu -s <SKILL_ID> -g development -l es-ES --utterance "guarda tres tomates"
```

## Despliegue

Hay un único repositorio git con dos remotos:

| Remoto | Para qué |
|---|---|
| `origin` | GitHub (este repositorio, público) |
| `alexa` | El repositorio privado de Alexa-hosted (AWS CodeCommit) |

En el repositorio de Alexa-hosted:

- Un push a la rama **`master`** despliega el código y el `skill-package` en la **fase de desarrollo**.
- La rama **`prod`** corresponde a la versión **en directo** y solo se actualiza cuando una versión supera la certificación.

**No edites el código en la pestaña *Code* de la consola de Alexa**, porque se desincroniza con este repositorio. Si alguna vez lo haces, trae los cambios con `git pull alexa master` antes de seguir.

### Configuración inicial (una vez por ordenador)

```bash
npm install -g ask-cli
ask configure                     # abre el navegador para iniciar sesión en Amazon Developer
```

Conectar este repositorio con el de Alexa-hosted:

1. Ejecuta `ask init --hosted-skill-id <SKILL_ID>` en una carpeta temporal. Crea el clon y configura las credenciales de git.
2. Copia su `.ask/ask-states.json` a la raíz de este repositorio. Está en `.gitignore` porque contiene el ID de la skill.
3. Añade el remoto con la URL que muestra ese clon (`git remote -v`):

```bash
git remote add alexa <URL_DEL_REPOSITORIO_CODECOMMIT>
```

4. Copia también la configuración `credential.<URL>.helper` del `.git/config` del clon.

### Desplegar en desarrollo

```bash
cd lambda && npm test && cd ..
git push origin master
git push alexa master
```

Para ver el resultado:

- `ask smapi get-skill-status -s <SKILL_ID>` muestra si terminó bien el despliegue y la compilación del modelo.
- `ask dialog --locale es-ES` permite hablar con la skill de desarrollo desde la terminal.

### Publicar

1. Prueba la versión de desarrollo en un dispositivo real.
2. Valida y envía a certificación desde la consola (*Certification*), o con:

```bash
ask smapi submit-skill-validation -s <SKILL_ID> -l es-ES -g development
ask smapi submit-skill-for-certification -s <SKILL_ID>
```

3. Cuando Amazon la certifica y se publica, esa versión pasa a *En directo*. Comprueba después que la rama `prod` de `alexa` contiene el mismo código (`git fetch alexa && git diff alexa/prod master -- lambda`).

## Privacidad

- La skill guarda, por usuario, los productos y cantidades que este le dicta y el número de sesiones.
- El nombre (si hay permiso) solo se usa para saludar.
- No se escriben en los logs ni el contenido del almacén ni identificadores de usuario.
- Política de privacidad: <https://claudiusava.github.io/skill-alexa-el-almacen/privacidad.html> (fuente en `docs/privacidad.html`, publicada con GitHub Pages)

## Historia

- **2020**: versión original. El estado de entonces está en el tag [`v1-2020`](../../tree/v1-2020).
- **2026**: modernización.
  - Corrige la pérdida de datos y la mezcla entre usuarios (el inventario era una variable global).
  - Corrige el borrado del producto equivocado.
  - Actualiza el SDK, reescribe el modelo de interacción y añade tests.
