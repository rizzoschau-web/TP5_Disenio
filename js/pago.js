export function simularPago(numero) {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const limpio = numero.replace(/\s/g, "");
      resolve(limpio === "4000000000000002"
        ? { ok: false, motivo: "Tarjeta rechazada" }
        : { ok: true });
    }, 1500);
  });
}

let contadorPolizas = 1;

export function generarPoliza() {
  const poliza = `POL-${new Date().getFullYear()}-${String(contadorPolizas).padStart(6, "0")}`;
  contadorPolizas += 1;
  return poliza;
}
