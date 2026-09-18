# HLBP - estructura reorganizada

Esta carpeta es una primera reorganización del HLBP original.

## Estructura

- `index.html` -> estructura de la interfaz
- `css/estilos.css` -> estilos
- `js/app.js` -> lógica de la aplicación
- `data/datos-base.js` -> datos base y configuración de tareas extraídos del HTML original
- `data/datos-ejemplo.js` -> archivo de ejemplo proporcionado, no cargado por defecto
- `firebase-config.js` -> configuración Firebase existente, mantenida temporalmente

## Importante

Esta versión todavía utiliza Firebase. No se ha hecho todavía la migración a Supabase/PostgreSQL.

Tampoco se ha inventado ni sustituido el contenido de `data.js`, porque ese archivo se referencia en el HTML original pero no fue proporcionado junto con los archivos analizados.

## Siguiente fase

1. Probar que esta estructura funciona en GitHub Pages.
2. Revisar el `data.js` real si existe.
3. Separar la autenticación.
4. Diseñar las tablas PostgreSQL.
5. Migrar Firebase a Supabase.
6. Aplicar seguridad con Supabase Auth + RLS.
7. Mantener/exportar los registros a Excel.
