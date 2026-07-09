# MercadoLibre Scraper

Un scraper con Puppeteer, local y sin dependencias externas raras, que busca
en MercadoLibre una lista de modelos de producto y exporta los resultados a
un archivo Excel. Originalmente se hizo para trackear precios de iPhones en
Argentina, pero sirve para cualquier término de búsqueda.

Este proyecto deliberadamente **no** hace nada para esquivar las defensas de
MercadoLibre (nada de bypass de captcha, rotación de proxies, ni login
automatizado). Scrapea páginas públicas de búsqueda de forma prolija, con
pausas entre requests, y está pensado para uso personal, chico y ocasional.

## Estructura del proyecto

```
.
├── config/
│   └── config.js        # editá acá: modelos, palabras excluidas, delays, viewport, páginas máximas
├── src/
│   ├── browser.js         # arranca puppeteer
│   ├── scraper.js          # navegación, reintentos con backoff, paginación
│   ├── parser.js             # extracción del dom (corre dentro de la página)
│   ├── filters.js              # filtrado de accesorios, validación de urls, deduplicación
│   ├── excel.js                  # export a excel + sanitización contra inyección de fórmulas
│   ├── debug.js                     # guarda html/captura cuando una búsqueda vuelve vacía
│   └── utils.js                       # sleep, cálculo de backoff, formateo de fecha
├── scripts/
│   └── check.js          # chequeo de sintaxis usado por `npm run check`
├── output/                 # acá caen los .xlsx generados
├── debug/                    # acá caen el html/capturas de debug generados
└── index.js                    # punto de entrada
```

## Instalación

```bash
npm install
```

## Uso

```bash
npm start
# o
npm run scrape
```

El scraper va a:

1. Buscar en MercadoLibre cada modelo definido en `config/config.js`.
2. Paginar hasta `maxPagesPerModel` páginas por modelo.
3. Filtrar accesorios (fundas, cargadores, cables, etc) y links que no sean
   de mercadolibre o no sean https.
4. Deduplicar publicaciones (por URL, o por título+precio si no hay URL).
5. Escribir un Excel en `output/mercadolibre_YYYY-MM-DD.xlsx`.

Si una búsqueda vuelve con cero productos, se guarda una captura de la
página y su HTML en `debug/` para poder ver qué sirvió realmente
MercadoLibre (útil si cambiaron el markup de la página).

## Configuración

Todo lo que normalmente vas a querer ajustar esta en `config/config.js`:

- `models` — lista de términos de búsqueda.
- `excludedWords` — se descartan los títulos que contengan alguna de estas palabras.
- `delays` — pausas entre navegaciones/modelos/páginas, en milisegundos.
- `viewport` — tamaño de la ventana del navegador.
- `maxPagesPerModel` — tope de paginación por modelo.
- `retry` — cantidad máxima de reintentos y delay base para cargas de página fallidas.

## Correr en Docker o CI

Por defecto el navegador corre con el sandbox de Chrome habilitado, que es la
opción más segura. Algunos entornos con contenedores (Docker, corredores de
CI) no pueden levantar el sandbox como root, así que se puede desactivar
explícitamente con una variable de entorno:

```bash
SCRAPER_ALLOW_NO_SANDBOX=true npm start
```

No actives esto en una máquina normal — saca una barrera de seguridad real y
solo debería usarse en entornos descartables y aislados.

## Otros scripts

```bash
npm run check   # corre `node --check` sobre cada archivo, detecta errores de sintaxis
npm run audit   # corre `npm audit` sobre las dependencias
```

## Usos posibles

- Análisis de competencia
- Tracking de precios
- Detectar oportunidades de reventa
