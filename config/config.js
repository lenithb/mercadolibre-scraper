module.exports = {
  // modelos a buscar, se corre una búsqueda por cada uno ("iphone" en español anda bien)
  models: ["iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15"],

  // los productos cuyo título contenga alguna de estas palabras se descartan (accesorios, no celulares)
  excludedWords: [
    "funda",
    "case",
    "forro",
    "protector",
    "templado",
    "vidrio templado",
    "mica",
    "lamina",
    "lámina",
    "cargador",
    "cable",
    "modulo",
    "módulo",
    "bateria",
    "batería",
    "repuesto",
    "repuestos",
    "flex",
    "carcasa",
  ],

  // cuánto esperar entre requests, mantené estos valores generosos para ser prolijos con los servidores de mercadolibre
  delays: {
    afterNavigation: 2500, // espera después de que carga una página, antes de leer el dom
    betweenModels: 3000, // espera entre búsquedas de distintos modelos
    betweenPages: 2000, // espera entre páginas paginadas del mismo modelo
  },

  // tamaño del viewport del navegador
  viewport: { width: 1366, height: 768 },

  // tope de seguridad para que un solo modelo no pagine todo el catálogo
  maxPagesPerModel: 3,

  // comportamiento de reintento cuando falla page.goto() (timeouts, cortes de red, etc)
  retry: {
    maxRetries: 3,
    baseDelayMs: 2000, // se duplica en cada intento: 2s, 4s, 8s...
  },

  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",

  lang: "es-AR",
};
