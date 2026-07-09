const puppeteer = require("puppeteer");

// hay que arrancar puppeteer con valores por defecto razonables; --no-sandbox debilita
// el aislamiento de procesos de chrome, así que solo se activa cuando el
// entorno lo pide explícitamente (docker/ci normalmente no puede correr el
// sandbox como root)

async function launchBrowser(config) {
  const args = [`--lang=${config.lang || "es-AR"}`];

  const allowNoSandbox = process.env.SCRAPER_ALLOW_NO_SANDBOX === "true";
  if (allowNoSandbox) {
    args.push("--no-sandbox", "--disable-setuid-sandbox");
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args,
  });

  return browser;
}

module.exports = { launchBrowser };
