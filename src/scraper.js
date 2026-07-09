const { extractProductsFromPage } = require("./parser");
const { saveDebugArtifacts } = require("./debug");
const { sleep, backoffDelay } = require("./utils");

// mercadolibre pagina los resultados por offset, 50 resultados por página,
// por ejemplo la página 2 es "..._Desde_51", la página 3 es "..._Desde_101"

function buildPageUrl(baseUrl, pageNumber) {
  if (pageNumber <= 1) return baseUrl;
  const offset = (pageNumber - 1) * 50 + 1;
  return `${baseUrl}_Desde_${offset}`;
}

// navega con reintentos y backoff incremental, porque una red inestable o
// una carga lenta no deberían tirar abajo toda la run

async function gotoWithRetry(page, url, retryConfig) {
  const { maxRetries, baseDelayMs } = retryConfig;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
      return;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const wait = backoffDelay(attempt, baseDelayMs);
        console.log(
          `   falló la navegación (intento ${attempt}/${maxRetries}), reintentando en ${wait}ms...`,
        );
        await sleep(wait);
      }
    }
  }

  throw lastError;
}

// recorre todas las páginas configuradas para un modelo, cortando antes si
// una página no trae productos (ya sea porque llegamos al final de los
// resultados, o porque mercadolibre cambió el markup y conviene mirar el debug)

async function scrapeModel(page, modelo, config) {
  const query = encodeURIComponent(`${modelo} apple`);
  const baseUrl = `https://listado.mercadolibre.com.ar/${query}`;
  const collected = [];

  console.log(`\nbuscando: ${modelo}`);

  for (let pageNum = 1; pageNum <= config.maxPagesPerModel; pageNum++) {
    const url = buildPageUrl(baseUrl, pageNum);

    try {
      await gotoWithRetry(page, url, config.retry);
    } catch (err) {
      console.error(
        `   falló la navegación para ${modelo} página ${pageNum}: ${err.message}`,
      );
      break;
    }

    await sleep(config.delays.afterNavigation);

    const products = await page.evaluate(extractProductsFromPage, modelo);

    if (products.length === 0) {
      await saveDebugArtifacts(page, `${modelo}_page${pageNum}`);
      if (pageNum === 1) {
        console.log(
          `   0 productos encontrados, se guardó html/captura de debug en debug/`,
        );
      }
      break;
    }

    console.log(
      `   página ${pageNum}: ${products.length} productos encontrados`,
    );
    collected.push(...products);

    const morePagesLeft = pageNum < config.maxPagesPerModel;
    if (morePagesLeft) {
      await sleep(config.delays.betweenPages);
    }
  }

  return collected;
}

module.exports = { scrapeModel, buildPageUrl, gotoWithRetry };
