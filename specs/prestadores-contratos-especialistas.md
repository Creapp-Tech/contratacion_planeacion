# IMPLEMENTAR NUEVO MÓDULO: PRESTADORES Y CONTRATOS – CONTRATOS CON ESPECIALISTAS

## 1. Objetivo

Desarrollar un nuevo módulo denominado **Prestadores y contratos**, dentro de un nuevo grupo de navegación también denominado **Prestadores y contratos**, en el menú lateral de la aplicación de Planeación y Contratación de VIVA1A IPS.

El propósito del módulo es administrar y consultar la información contractual de los especialistas, los servicios que prestan, los aseguradores con los que tienen contratos y las sedes donde se encuentran autorizados para prestar dichos servicios.

El módulo debe reemplazar la gestión que actualmente se realiza mediante archivos Excel, proporcionando una estructura organizada, relacional, trazable y escalable.

IMPORTANTE: Antes de desarrollar, revisa la arquitectura actual del proyecto, sus componentes, convenciones, tablas de Supabase, autenticación, permisos, navegación y patrones de desarrollo. No construyas una implementación aislada ni dupliques funcionalidades existentes.

## 2. Estructura del menú

Crear un nuevo grupo en el menú lateral:

- Grupo: Prestadores y contratos
- Módulo: Prestadores y contratos

El nuevo módulo debe respetar el diseño visual, los estilos, los componentes y la estructura de navegación existentes en la aplicación.

Verificar que el módulo aparezca correctamente en el menú y que su ruta funcione.

## 3. Modelo funcional y relaciones

La solución debe contemplar las siguientes entidades:

### A. Especialistas

Crear un registro maestro de especialistas.

Campos:

- Tipo de identificación.
- Número de identificación.
- Nombre completo.
- Tipo de persona: Natural o Jurídica.
- Especialidad.
- Regional.
- Ciudad.
- Estado del registro.

Regla fundamental:

Un especialista debe registrarse una sola vez en la base de datos, independientemente de la cantidad de aseguradores, servicios o sedes donde preste sus servicios.

El número de identificación debe permitir identificar y evitar duplicados.

### B. Contratos con aseguradores

Un especialista puede tener relaciones contractuales con uno o varios aseguradores.

Registrar:

- Especialista.
- Asegurador / EPS.
- Régimen.
- Contrato del asegurador.
- Modalidad de prestación.
- Fecha de inicio.
- Fecha de terminación.
- Estado contractual.

No asumir que un especialista tiene un único contrato o un único asegurador.

### C. Servicios contratados (CUPS)

Un especialista puede tener varios servicios contratados.

Cada servicio debe tener sus propias condiciones contractuales.

Campos:

- Código CUPS.
- Descripción del CUPS.
- Agrupador.
- Especialidad.
- Tipo de imagen.
- Manual tarifario.
- Porcentaje de descuento o incremento.
- Modalidad de contratación.
- Valor de la tarifa.
- Número de atenciones por hora.
- Modalidad de prestación.

No limitar a un solo CUPS por especialista.

### D. Sedes de prestación

Esta es una de las funcionalidades más importantes del módulo.

Un especialista puede prestar servicios en muchas sedes, pero no todos sus servicios se prestan necesariamente en todas ellas.

Por lo tanto, se debe construir una relación específica entre:

- Especialista.
- Asegurador.
- Contrato.
- Servicio (CUPS).
- Sede de prestación.

Cada combinación debe poder administrarse independientemente.

Ejemplo:

Especialista: José Rubén Trujillo Ruiz.
Especialidad: Psiquiatría.

| Asegurador | Servicio | Sede |
|---|---|---|
| Nueva EPS | Consulta primera vez | Medellín |
| Nueva EPS | Consulta control | Medellín |
| Nueva EPS | Consulta primera vez | Prado |
| Nueva EPS | Consulta control | Prado |
| Nueva EPS | Consulta primera vez | Poblado |
| Compensar | Consulta primera vez | Bolivia |
| Mutual Ser | Consulta control | Cra 46 Punto Clave |

Este ejemplo es ilustrativo: la disponibilidad de cada servicio debe registrarse individualmente y nunca debe propagarse automáticamente a todas las sedes.

Campos de la asignación:

- Sedes de prestación (una o varias por envío).
- Tipo de red: Interna / Externa.
- Servicio CUPS asociado.
- Observaciones.

La sede debe seleccionarse desde el catálogo de sedes que ya existe en la aplicación. No crear un catálogo paralelo. Cada sede seleccionada genera su propia relación contrato + CUPS + sede en una sola operación.

## 4. Novedades y vigencia

El sistema debe permitir registrar novedades relacionadas con los contratos y servicios.

Incluir:

- Tipo de novedad.
- Fecha de inicio.
- Fecha de terminación.
- Observaciones.
- Estado de validación.

Permitir identificar los registros vigentes, vencidos, pendientes de validación y aquellos que tengan novedades.

No eliminar el historial de condiciones anteriores cuando se actualice una tarifa o una asignación de sede. Conservar trazabilidad de los cambios.

## 5. Diseño de la interfaz

Crear una interfaz moderna, intuitiva y consistente con los demás módulos.

### Vista principal

Mostrar una tabla de especialistas con información resumida:

- Identificación.
- Nombre del especialista.
- Especialidad.
- Regional.
- Ciudad.
- Cantidad de aseguradores.
- Cantidad de servicios CUPS.
- Cantidad de sedes asignadas.
- Estado.
- Acciones.

Incluir:

- Buscador por nombre o identificación.
- Filtro por regional.
- Filtro por ciudad.
- Filtro por especialidad.
- Filtro por asegurador.
- Filtro por estado.
- Paginación.

Agregar indicadores superiores:

- Total de especialistas.
- Especialistas con contratos vigentes.
- Total de aseguradores relacionados.
- Total de sedes con servicios asignados.

Los indicadores deben calcularse a partir de los registros reales, sin datos simulados.

### Detalle del especialista

Al seleccionar un especialista, permitir consultar su información mediante una vista de detalle organizada en pestañas:

1. Información general.
2. Contratos y aseguradores.
3. Servicios contratados.
4. Sedes de prestación.
5. Novedades e historial.

La información debe presentarse de forma jerárquica y clara.

### Flujo de registro y edición

Implementar un proceso que permita:

1. Registrar o seleccionar un especialista existente.
2. Asociar uno o varios aseguradores.
3. Registrar las condiciones contractuales.
4. Agregar uno o varios servicios CUPS.
5. Asignar una o varias sedes donde se presta cada servicio en una sola operación.
6. Registrar las condiciones económicas y operativas.
7. Guardar y consultar la información.

No obligar a que todos los servicios estén asociados a todas las sedes.

Permitir agregar, editar y retirar asignaciones individuales sin afectar las demás relaciones del especialista.

## 6. Arquitectura de base de datos

Antes de crear tablas, revisar las estructuras existentes en Supabase y reutilizar los catálogos disponibles.

Diseñar un modelo relacional normalizado que evite duplicidad de información.

Como referencia funcional, evaluar las siguientes entidades:

- especialistas.
- contratos_especialistas.
- servicios_contratados_especialistas.
- sedes_servicios_especialistas.
- novedades_prestadores_contratos.
- historial_cambios_prestadores_contratos.

Los nombres definitivos deben ajustarse a las convenciones existentes del proyecto.

La relación entre especialista, asegurador, contrato, CUPS y sede debe quedar correctamente definida mediante claves foráneas.

Implementar:

- Restricciones de integridad.
- Validaciones de duplicidad.
- Índices para consultas frecuentes.
- Relaciones correctamente definidas.
- Migraciones SQL versionadas.
- Políticas RLS de Supabase.
- Control de acceso según los roles existentes.

No almacenar listas de CUPS o sedes como texto separado por comas o como estructuras que impidan consultar individualmente cada relación.

## 7. Validaciones del negocio

Implementar las siguientes reglas:

1. No permitir duplicar especialistas por tipo y número de identificación.
2. Un especialista puede tener múltiples aseguradores.
3. Un especialista puede tener múltiples contratos.
4. Un contrato puede tener múltiples servicios CUPS.
5. Un servicio puede estar asignado a una o varias sedes.
6. Cada asignación de servicio a sede debe ser independiente.
7. No crear automáticamente asignaciones para todas las sedes.
8. Validar las fechas de inicio y terminación.
9. No permitir duplicar la misma combinación contractual y de prestación.
10. No eliminar un especialista que tenga relaciones contractuales o históricas sin aplicar previamente las reglas de integridad correspondientes.

Los estados deben permitir diferenciar claramente los registros activos, inactivos, vencidos y pendientes de validación, según corresponda.

## 8. Seguridad y permisos

Integrar el módulo con el sistema actual de autenticación y autorización.

No crear un sistema de usuarios o roles independiente.

Respetar los permisos definidos en la aplicación y las políticas RLS de Supabase.

Validar los permisos tanto en la interfaz como en las operaciones de servidor.

## 9. Experiencia de usuario

- Utilizar los componentes visuales existentes.
- Formularios organizados por secciones.
- Selectores con búsqueda para especialistas, aseguradores, CUPS y sedes.
- Tablas con filtros y paginación.
- Mensajes claros de confirmación y error.
- Indicadores de carga.
- Validación de campos obligatorios.
- Diseño adaptable a escritorio y dispositivos móviles.
- Evitar formularios excesivamente largos.
- Permitir agregar varios CUPS y varias sedes de manera sencilla.

## 10. Verificación obligatoria

No dar por terminado el desarrollo únicamente porque la pantalla se visualice.

Realizar pruebas funcionales que demuestren:

1. Se puede registrar un especialista.
2. No se puede duplicar su identificación.
3. Se pueden asociar diferentes aseguradores al mismo especialista.
4. Se pueden registrar múltiples CUPS.
5. Se pueden asignar diferentes sedes a cada CUPS.
6. Un CUPS puede estar disponible en Medellín y no estar disponible en Prado.
7. Modificar una sede no afecta las demás asignaciones.
8. Se pueden modificar tarifas y condiciones contractuales.
9. Las novedades conservan el historial.
10. Los filtros y buscadores funcionan.
11. Los permisos impiden operaciones no autorizadas.
12. La información persiste correctamente después de recargar la aplicación.
13. Editar una asignación permite agregar más sedes al mismo contrato y CUPS sin repetir el flujo; la sede original se conserva.

Verificar también que las demás funcionalidades de la aplicación sigan funcionando correctamente.

## 11. Restricciones importantes

- No modificar módulos existentes que no sean necesarios para esta implementación.
- No duplicar catálogos de aseguradores, sedes, regionales, ciudades o CUPS si ya existen.
- No utilizar datos simulados en la interfaz definitiva.
- No dejar botones sin funcionalidad.
- No crear relaciones simplificadas que impidan identificar qué servicio presta cada especialista en cada sede.
- No sobrescribir información histórica.
- No realizar cambios destructivos en la base de datos.

## 12. Entrega

Al finalizar, presentar un informe que incluya:

- Arquitectura implementada.
- Tablas creadas o modificadas.
- Relaciones entre las entidades.
- Migraciones ejecutadas o pendientes.
- Componentes y rutas desarrolladas.
- Validaciones implementadas.
- Pruebas funcionales realizadas y sus resultados.
- Permisos y políticas RLS aplicadas.
- Problemas encontrados y pendientes.

**CRITERIO PRINCIPAL DE ACEPTACIÓN:**

El sistema debe permitir administrar un especialista, sus diferentes relaciones contractuales con aseguradores, sus servicios CUPS y las sedes específicas donde presta cada servicio, garantizando que cada combinación se gestione de manera independiente y sin duplicar la información del especialista.

Antes de finalizar, comprobar el funcionamiento real de todo el flujo de principio a fin.