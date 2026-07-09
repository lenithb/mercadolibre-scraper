const fs = require("fs");
const path = require("path");

// guarda el html de la página y una captura para poder ver por qué una
// búsqueda volvió vacía (mercadolibre cambió una clase css, apareció un
// captcha, etc) sin tener que reproducir la corrida

async function saveDebugArtifacts(page, label, debugDir = "debug") {
  fs.mkdirSync(debugDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeLabel = label.replace(/[^a-z0-9_-]+/gi, "_");

  const htmlPath = path.join(debugDir, `${safeLabel}_${stamp}.html`);
  const screenshotPath = path.join(debugDir, `${safeLabel}_${stamp}.png`);

  try {
    const html = await page.content();
    fs.writeFileSync(htmlPath, html);
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch (err) {
    console.error(
      `   no se pudieron guardar los archivos de debug: ${err.message}`,
    );
  }

  return { htmlPath, screenshotPath };
}

module.exports = { saveDebugArtifacts };
