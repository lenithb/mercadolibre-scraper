const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// backoff exponencial: intento 1 -> baseDelayMs, intento 2 -> 2x, intento 3 -> 4x, etc

function backoffDelay(attempt, baseDelayMs) {
  return baseDelayMs * Math.pow(2, attempt - 1);
}

// yyyy-mm-dd, se usa para nombrar los archivos de salida y no pisar runs anteriores

function getDateStamp(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

module.exports = { sleep, backoffDelay, getDateStamp };
