<<<<<<< HEAD
URL Netlify: https://candid-boba-2f5c63.netlify.app
=======
URL Netlify: https://candid-boba-2f5c63.netlify.app
>>>>>>> a0c515cd56ef573f209328aa644d4694d24d3887


# Cubrí Seguros · Seguro de celular

Prototipo de contratación digital para celulares y bicicletas, con diseños responsive de referencia para desktop (1440 px) y mobile (390 px). El flujo y el estado son compartidos; no se conecta a un backend ni procesa pagos reales.

## Cómo ejecutarlo

Abrí la URL local que informa Vite. Para comprobar el build de producción localmente, ejecutá `npm run build` y después `npm run preview`. Esto no publica el sitio.

La tipografía, Tailwind CSS v4 (Play CDN) y Basecoat UI se cargan desde sus CDN; para verlos hace falta conexión a internet.

## Flujo y decisiones

- Las pantallas y sus transiciones reutilizan el mismo flujo para celular y bicicleta; la solicitud vive en `js/estado.js`.
- Las tasas se mantienen en tablas separadas: `data/planes.json` para celulares y `data/planes-bicicleta.json` para bicicletas. `js/cotizador.js` calcula las cuotas y aplica el factor correspondiente a la antigüedad.
- La tabla de bicicleta reproduce las tarifas de referencia del diseño para menos de un año: 3,6 %, 5,4 % y 7,2 % anual. Para las demás antigüedades se aplica el mismo factor por antigüedad definido para el cotizador.
- La bicicleta solicita marca, modelo, tipo, rodado, valor y antigüedad; el celular conserva marca, modelo, valor y antigüedad.
- Las validaciones puras de `js/validaciones.js` se muestran al salir del campo y se vuelven a ejecutar antes de avanzar.
- `js/pago.js` simula el resultado en 1,5 segundos. Usá exclusivamente las tarjetas de prueba; no se envían ni procesan pagos reales.
- Los datos de la solicitud se guardan en `localStorage` para sobrevivir a una recarga. Los campos de tarjeta, vencimiento, CVV y nombre de tarjeta se excluyen deliberadamente del almacenamiento; deben ingresarse de nuevo tras recargar. La solicitud guardada se elimina al completar una compra aprobada o volver al inicio.
- `localStorage` no es un almacén cifrado: los scripts del mismo origen pueden leerlo y los datos permanecen entre sesiones. Esta demo no tiene backend ni validación del lado del servidor; no ingreses datos personales reales. Las validaciones del navegador son solo para la experiencia de usuario, no una medida de seguridad.
- El resumen incluye enlaces para editar los datos del equipo, el seguro/plan y el titular; al continuar, el flujo vuelve al pago.
- La confirmación del pago utiliza el toast de Basecoat. Se cargan solo el runtime requerido y el módulo JavaScript del toast.
- `css/tokens.css` contiene los tokens, componentes compartidos, el tema oscuro y las reglas responsive para desktop y mobile.
- El botón del encabezado alterna entre modo claro y oscuro usando las variables de tema de Basecoat; la preferencia queda guardada en el navegador.

## Tarjetas de prueba

| Número | Resultado |
| --- | --- |
| `4111 1111 1111 1111` | Pago aprobado |
| `4000 0000 0000 0002` | Pago rechazado |

Completá vencimiento futuro en formato `MM/AA`, un CVV de tres dígitos y cualquier nombre de titular para probar el flujo.

## Cuotas de referencia

Con antigüedad menor a un año, el equipo a `$600.000` debe dar Básico `$2.000`, Plus `$3.000` y Premium `$4.500`. También se verifican los otros dos casos de prueba indicados en el trabajo práctico.

Para bicicleta de menos de un año y valor `$600.000`, las tarifas de ejemplo producen Básico `$1.800`, Plus `$2.700` y Premium `$3.600`.

## Vistas de diseño

Se mantiene una sola aplicación para que los pasos, formularios y cotización sean consistentes. Las reglas responsive están en `css/tokens.css`: la composición mobile se aplica hasta 700 px, con ajustes compactos hasta 390 px, y las reglas de escritorio se aplican al superar los 700 px; las dimensiones de referencia son 1440 × 900 y 390 × 844.

Para comprobar cada diseño, ejecutar Vite y usar la herramienta de dispositivos del navegador o redimensionar la ventana. No se publica ni se configura un despliegue automático.
