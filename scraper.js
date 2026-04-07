const puppeteer = require("puppeteer");
const ExcelJS = require("exceljs");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

const MODELOS = ["iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function scrapearModelo(page, modelo) {
  const query = encodeURIComponent(`${modelo} apple`);
  const url = `https://listado.mercadolibre.com.ar/${query}`;

  console.log(`\n🔍 Buscando: ${modelo}`);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(2500);

  const productos = await page.evaluate((modeloBuscado) => {
    const resultados = [];

    // ── Estrategia 1: selectores nuevos poly-card (2024-2025) ──────────────
    const itemsNuevos = document.querySelectorAll(
      "li.ui-search-layout__item, .poly-card, [class*='poly-card']",
    );

    if (itemsNuevos.length > 0) {
      itemsNuevos.forEach((item) => {
        const titulo =
          item
            .querySelector(
              ".poly-component__title, .poly-box .poly-component__title-wrapper a",
            )
            ?.innerText?.trim() ||
          item.querySelector("[class*='title']")?.innerText?.trim();

        const fraccion = item
          .querySelector(".andes-money-amount__fraction, [class*='fraction']")
          ?.innerText?.replace(/\D/g, "");

        const centavos = item
          .querySelector(".andes-money-amount__cents, [class*='cents']")
          ?.innerText?.trim();

        const enlace =
          item.querySelector(
            "a.poly-component__title, a[class*='title'], a.ui-search-link",
          )?.href || item.querySelector("a")?.href;

        const cuotas = item
          .querySelector(
            ".poly-component__installments, [class*='installments']",
          )
          ?.innerText?.trim();

        const envio = item
          .querySelector(".poly-component__shipping, [class*='shipping']")
          ?.innerText?.trim();

        const condicion = item
          .querySelector(".poly-component__condition, [class*='condition']")
          ?.innerText?.trim();

        if (titulo && fraccion) {
          const precio = parseFloat(
            fraccion + (centavos ? "." + centavos : ""),
          );
          resultados.push({
            modelo: modeloBuscado,
            titulo,
            precio,
            cuotas: cuotas || "—",
            envio: envio || "—",
            condicion: condicion || "—",
            enlace: enlace || "—",
          });
        }
      });
    }

    // ── Estrategia 2: selectores viejos (fallback) ──────────────────────
    if (resultados.length === 0) {
      const itemsViejos = document.querySelectorAll(
        ".ui-search-result__wrapper",
      );
      itemsViejos.forEach((item) => {
        const titulo = item
          .querySelector(".ui-search-item__title")
          ?.innerText?.trim();
        const fraccion = item
          .querySelector(".andes-money-amount__fraction")
          ?.innerText?.replace(/\./g, "");
        const centavos = item
          .querySelector(".andes-money-amount__cents")
          ?.innerText?.trim();
        const enlace = item.querySelector("a.ui-search-link")?.href;
        const cuotas = item
          .querySelector(".ui-search-item__installments")
          ?.innerText?.trim();
        const envio = item
          .querySelector(".ui-search-item__shipping-label")
          ?.innerText?.trim();
        const condicion = item
          .querySelector("[class*='condition']")
          ?.innerText?.trim();

        if (titulo && fraccion) {
          const precio = parseFloat(
            fraccion + (centavos ? "." + centavos : ""),
          );
          resultados.push({
            modelo: modeloBuscado,
            titulo,
            precio,
            cuotas: cuotas || "—",
            envio: envio || "—",
            condicion: condicion || "—",
            enlace: enlace || "—",
          });
        }
      });
    }

    // ── Estrategia 3: selector genérico por precio (último recurso) ──────
    if (resultados.length === 0) {
      const precios = document.querySelectorAll(
        ".andes-money-amount__fraction",
      );
      precios.forEach((el) => {
        const contenedor = el.closest(
          "li, article, [class*='result'], [class*='card']",
        );
        if (!contenedor) return;

        const titulo = contenedor
          .querySelector("h2, h3, [class*='title']")
          ?.innerText?.trim();
        const fraccion = el.innerText.replace(/\D/g, "");
        const enlace = contenedor.querySelector("a")?.href;

        if (titulo && fraccion) {
          resultados.push({
            modelo: modeloBuscado,
            titulo,
            precio: parseFloat(fraccion),
            cuotas: "—",
            envio: "—",
            condicion: "—",
            enlace: enlace || "—",
          });
        }
      });
    }

    return resultados;
  }, modelo);

  if (productos.length === 0) {
    const debug = await page.evaluate(() => {
      const clases = new Set();
      document.querySelectorAll("li, article").forEach((el) => {
        el.classList.forEach((c) => {
          if (c.length > 3) clases.add(c);
        });
      });
      return {
        title: document.title,
        url: window.location.href,
        clasesMuestra: [...clases].slice(0, 20),
      };
    });
    console.log(`   ⚠️  0 productos. Info de debug:`);
    console.log(`      Título página: ${debug.title}`);
    console.log(`      URL final: ${debug.url}`);
    console.log(`      Clases encontradas: ${debug.clasesMuestra.join(", ")}`);
  } else {
    console.log(`   ✅ ${productos.length} productos encontrados`);
  }

  return productos;
}

async function exportarExcel(todos) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ML iPhone Scraper";
  wb.created = new Date();

  const resumen = wb.addWorksheet("Resumen");
  resumen.columns = [
    { header: "Modelo", key: "modelo", width: 14 },
    { header: "Cantidad listados", key: "cantidad", width: 20 },
    { header: "Precio mínimo ($)", key: "min", width: 20 },
    { header: "Precio máximo ($)", key: "max", width: 20 },
    { header: "Precio promedio ($)", key: "prom", width: 22 },
  ];

  const hResumen = resumen.getRow(1);
  hResumen.font = {
    bold: true,
    color: { argb: "FFFFFFFF" },
    name: "Arial",
    size: 11,
  };
  hResumen.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1A73E8" },
  };
  hResumen.alignment = { horizontal: "center" };

  for (const modelo of MODELOS) {
    const items = todos.filter((p) => p.modelo === modelo);
    const precios = items
      .map((p) => p.precio)
      .filter((p) => !isNaN(p) && p > 0);
    resumen.addRow({
      modelo,
      cantidad: precios.length,
      min: precios.length ? Math.min(...precios) : 0,
      max: precios.length ? Math.max(...precios) : 0,
      prom: precios.length
        ? Math.round(precios.reduce((a, b) => a + b, 0) / precios.length)
        : 0,
    });
  }

  resumen.getColumn("min").numFmt = "#,##0.00";
  resumen.getColumn("max").numFmt = "#,##0.00";
  resumen.getColumn("prom").numFmt = "#,##0.00";

  for (const modelo of MODELOS) {
    const items = todos.filter((p) => p.modelo === modelo);
    const hoja = wb.addWorksheet(modelo);

    hoja.columns = [
      { header: "Título", key: "titulo", width: 50 },
      { header: "Precio ($)", key: "precio", width: 18 },
      { header: "Cuotas", key: "cuotas", width: 28 },
      { header: "Envío", key: "envio", width: 22 },
      { header: "Condición", key: "condicion", width: 14 },
      { header: "Enlace", key: "enlace", width: 60 },
    ];

    const h = hoja.getRow(1);
    h.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
      name: "Arial",
      size: 11,
    };
    h.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1A73E8" },
    };
    h.alignment = { horizontal: "center" };

    items.forEach((p, i) => {
      const row = hoja.addRow(p);
      row.getCell("precio").numFmt = "#,##0.00";
      if (i % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0F4FF" },
        };
      }
    });

    hoja.autoFilter = { from: "A1", to: "F1" };
  }

  const archivo = "iphones_mercadolibre.xlsx";
  await wb.xlsx.writeFile(archivo);
  console.log(`\n📊 Excel guardado: ${archivo}`);
  return archivo;
}

(async () => {
  console.log("🚀 Iniciando scraper de MercadoLibre...\n");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--lang=es-AR"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);
  await page.setViewport({ width: 1366, height: 768 });
  await page.setExtraHTTPHeaders({ "Accept-Language": "es-AR,es;q=0.9" });

  const todos = [];

  for (const modelo of MODELOS) {
    try {
      const productos = await scrapearModelo(page, modelo);
      todos.push(...productos);
      await sleep(3000);
    } catch (err) {
      console.error(`❌ Error scrapeando ${modelo}:`, err.message);
    }
  }

  await browser.close();

  if (todos.length === 0) {
    console.log("\n❌ No se encontraron productos en ningún modelo.");
    console.log(
      "   → Ejecutá 'node debug.js' para ver qué clases CSS está usando ML ahora.",
    );
    process.exit(1);
  }

  console.log(`\n📦 Total de productos recolectados: ${todos.length}`);
  await exportarExcel(todos);
  console.log("✅ ¡Listo!");
})();
