// esta función se manda al contexto de la página con page.evaluate(), así que
// solo puede usar apis estándar del dom y el argumento que le pasa puppeteer -
// no tiene acceso a nada más definido en este archivo

function extractProductsFromPage(modeloBuscado) {
  const resultados = [];

  // estrategia 1: layout actual con poly-card (markup 2024-2025 de mercadolibre)

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
        .querySelector(".poly-component__installments, [class*='installments']")
        ?.innerText?.trim();

      const envio = item
        .querySelector(".poly-component__shipping, [class*='shipping']")
        ?.innerText?.trim();

      const condicion = item
        .querySelector(".poly-component__condition, [class*='condition']")
        ?.innerText?.trim();

      if (titulo && fraccion) {
        const precio = parseFloat(fraccion + (centavos ? "." + centavos : ""));
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

  // estrategia 2: layout viejo, se mantiene como respaldo por si mercadolibre lo sirve

  if (resultados.length === 0) {
    const itemsViejos = document.querySelectorAll(".ui-search-result__wrapper");
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
        const precio = parseFloat(fraccion + (centavos ? "." + centavos : ""));
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

  // estrategia 3: último recurso, busca precios y sube al contenedor más cercano que parezca una tarjeta

  if (resultados.length === 0) {
    const precios = document.querySelectorAll(".andes-money-amount__fraction");
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
}

module.exports = { extractProductsFromPage };
