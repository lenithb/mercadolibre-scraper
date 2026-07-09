const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const { getDateStamp } = require("./utils");

const HEADER_FILL = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1A73E8" },
};
const HEADER_FONT = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  name: "Arial",
  size: 11,
};

// los programas de planillas tratan una celda que empieza con =, +, - o @
// como una fórmula, así que un título/link malicioso scrapeado de la página
// podría ejecutar código al abrir el archivo - agregar un apóstrofe adelante
// fuerza a que quede como texto plano

function sanitizeExcelValue(value) {
  if (typeof value !== "string") return value;
  if (/^[=+\-@]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

function sanitizeProduct(product) {
  return {
    ...product,
    titulo: sanitizeExcelValue(product.titulo),
    cuotas: sanitizeExcelValue(product.cuotas),
    envio: sanitizeExcelValue(product.envio),
    condicion: sanitizeExcelValue(product.condicion),
    enlace: sanitizeExcelValue(product.enlace),
  };
}

function styleHeaderRow(row) {
  row.font = HEADER_FONT;
  row.fill = HEADER_FILL;
  row.alignment = { horizontal: "center" };
}

function buildSummarySheet(workbook, products, models) {
  const summary = workbook.addWorksheet("Resumen");
  summary.columns = [
    { header: "Modelo", key: "modelo", width: 14 },
    { header: "Cantidad listados", key: "cantidad", width: 20 },
    { header: "Precio mínimo ($)", key: "min", width: 20 },
    { header: "Precio máximo ($)", key: "max", width: 20 },
    { header: "Precio promedio ($)", key: "prom", width: 22 },
  ];
  styleHeaderRow(summary.getRow(1));

  for (const modelo of models) {
    const precios = products
      .filter((p) => p.modelo === modelo)
      .map((p) => p.precio)
      .filter((p) => !isNaN(p) && p > 0);

    summary.addRow({
      modelo,
      cantidad: precios.length,
      min: precios.length ? Math.min(...precios) : 0,
      max: precios.length ? Math.max(...precios) : 0,
      prom: precios.length
        ? Math.round(precios.reduce((a, b) => a + b, 0) / precios.length)
        : 0,
    });
  }

  summary.getColumn("min").numFmt = "#,##0.00";
  summary.getColumn("max").numFmt = "#,##0.00";
  summary.getColumn("prom").numFmt = "#,##0.00";
}

function buildModelSheet(workbook, products, modelo) {
  const sheet = workbook.addWorksheet(modelo);
  sheet.columns = [
    { header: "Título", key: "titulo", width: 50 },
    { header: "Precio ($)", key: "precio", width: 18 },
    { header: "Cuotas", key: "cuotas", width: 28 },
    { header: "Envío", key: "envio", width: 22 },
    { header: "Condición", key: "condicion", width: 14 },
    { header: "Enlace", key: "enlace", width: 60 },
  ];
  styleHeaderRow(sheet.getRow(1));

  const items = products.filter((p) => p.modelo === modelo);
  items.forEach((product, i) => {
    const row = sheet.addRow(sanitizeProduct(product));
    row.getCell("precio").numFmt = "#,##0.00";
    if (i % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0F4FF" },
      };
    }
  });

  sheet.autoFilter = { from: "A1", to: "F1" };
}

// arma el libro de excel y lo escribe en output/mercadolibre_YYYY-MM-DD.xlsx,
// creando la carpeta output si todavía no existe
async function exportToExcel(products, models, outputDir = "output") {
  fs.mkdirSync(outputDir, { recursive: true });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ML Scraper";
  workbook.created = new Date();

  buildSummarySheet(workbook, products, models);
  for (const modelo of models) {
    buildModelSheet(workbook, products, modelo);
  }

  const fileName = `mercadolibre_${getDateStamp()}.xlsx`;
  const filePath = path.join(outputDir, fileName);
  await workbook.xlsx.writeFile(filePath);

  return filePath;
}

module.exports = { exportToExcel, sanitizeExcelValue };
