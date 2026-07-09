// true si el título contiene alguna de las palabras excluidas (accesorios, repuestos, etc)

function isExcludedProduct(titulo, excludedWords) {
  if (!titulo) return true;
  const lower = titulo.toLowerCase();
  return excludedWords.some((word) => lower.includes(word.toLowerCase()));
}

// solo se aceptan links https dentro del dominio mercadolibre.com.ar, todo lo
// demás (links relativos, otros dominios, redirects de tracking) se descarta

function isValidMercadoLibreUrl(url) {
  if (!url || typeof url !== "string") return false;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") return false;

  return (
    parsed.hostname === "mercadolibre.com.ar" ||
    parsed.hostname.endsWith(".mercadolibre.com.ar")
  );
}

// deduplica por url cuando existe (es el identificador más confiable), si no
// cae a título+precio - esto también saca publicaciones repetidas que
// aparecen dos veces al paginar
function dedupeProducts(products) {
  const seen = new Set();
  const result = [];

  for (const product of products) {
    const key = product.enlace
      ? `url:${product.enlace}`
      : `tp:${(product.titulo || "").trim().toLowerCase()}:${product.precio}`;

    if (seen.has(key)) continue;
    seen.add(key);
    result.push(product);
  }

  return result;
}

module.exports = { isExcludedProduct, isValidMercadoLibreUrl, dedupeProducts };
