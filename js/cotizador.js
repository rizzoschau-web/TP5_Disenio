const factoresAntiguedad = {
  menos1: 1,
  "1a2": 1.1,
  mas2: 1.25,
};

export function normalizarImporte(valor) {
  const texto = String(valor).trim().replace(/\s/g, "");
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(texto)) return NaN;
  return Number(texto.replace(/\D/g, ""));
}

export function calcularCuota(valor, tasaAnual, antiguedad) {
  const factor = factoresAntiguedad[antiguedad];
  if (!Number.isFinite(valor) || !Number.isFinite(tasaAnual) || factor === undefined) {
    return 0;
  }
  return Math.round((valor * tasaAnual / 12) * factor);
}
