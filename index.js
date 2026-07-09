const config = require("./config/config");
const { launchBrowser } = require("./src/browser");
const { scrapeModel } = require("./src/scraper");
const {
  isExcludedProduct,
  isValidMercadoLibreUrl,
  dedupeProducts,
} = require("./src/filters");
const { exportToExcel } = require("./src/excel");
const { sleep } = require("./src/utils");

async function main() {
  console.log("iniciando scraper de mercadolibre...\n");

  const browser = await launchBrowser(config);
  const page = await browser.newPage();
  await page.setUserAgent(config.userAgent);
  await page.setViewport(config.viewport);
  await page.setExtraHTTPHeaders({ "Accept-Language": "es-AR,es;q=0.9" });

  const allProducts = [];

  for (const modelo of config.models) {
    try {
      const products = await scrapeModel(page, modelo, config);
      allProducts.push(...products);
    } catch (err) {
      console.error(`error buscando ${modelo}: ${err.message}`);
    }
    // pausa prudente antes de volver a pegarle al sitio con el siguiente modelo
    await sleep(config.delays.betweenModels);
  }

  await browser.close();

  // se descartan accesorios/repuestos y todo lo que no tenga un link válido de
  // mercadolibre, y después se sacan las publicaciones duplicadas antes de
  // escribir el excel
  const filtered = allProducts
    .filter((p) => !isExcludedProduct(p.titulo, config.excludedWords))
    .filter((p) => isValidMercadoLibreUrl(p.enlace));

  const deduped = dedupeProducts(filtered);

  if (deduped.length === 0) {
    console.log("\nno se encontraron productos válidos en ningún modelo.");
    process.exit(1);
  }

  console.log(`\ntotal de productos recolectados: ${deduped.length}`);
  const filePath = await exportToExcel(deduped, config.models);
  console.log(`excel guardado: ${filePath}`);
  console.log("¡listo!");
}

main().catch((err) => {
  console.error("error fatal:", err);
  process.exit(1);
});
