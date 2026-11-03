import { normalizarImporte } from "./cotizador.js";

const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const edadMinima = 18;

function validarNombre(valor, etiqueta) {
  return String(valor).trim().length >= 2 ? null : `Ingresá tu ${etiqueta}`;
}

function esMayorDeEdad(fechaNacimiento, hoy = new Date()) {
  if (!fechaNacimiento) return false;
  const fecha = new Date(`${fechaNacimiento}T00:00:00`);
  if (Number.isNaN(fecha.getTime()) || fecha > hoy) return false;
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const cumpleEsteAnio = new Date(
    hoy.getFullYear(),
    fecha.getMonth(),
    fecha.getDate(),
  );
  if (hoy < cumpleEsteAnio) edad -= 1;
  return edad >= edadMinima;
}

function fechaVencimientoValida(valor, hoy = new Date()) {
  const coincidencia = /^(\d{2})\/(\d{2})$/.exec(valor);
  if (!coincidencia) return false;
  const mes = Number(coincidencia[1]);
  const anio = 2000 + Number(coincidencia[2]);
  if (mes < 1 || mes > 12) return false;
  return anio > hoy.getFullYear() || (anio === hoy.getFullYear() && mes >= hoy.getMonth() + 1);
}

export function validarCampo(campo, valor) {
  switch (campo) {
    case "equipo.marca":
      return String(valor).trim() ? null : "Elegí una marca";
    case "equipo.modelo":
      return String(valor).trim().length >= 2 && String(valor).trim().length <= 40
        ? null
        : "Ingresá el modelo del equipo";
    case "equipo.tipo":
      return String(valor).trim() ? null : "Elegí el tipo de bicicleta";
    case "equipo.rodado":
      return String(valor).trim() ? null : "Elegí el rodado";
    case "equipo.valor": {
      const importe = normalizarImporte(valor);
      return Number.isInteger(importe) && importe >= 100000 && importe <= 2500000
        ? null
        : "El valor debe estar entre $100.000 y $2.500.000";
    }
    case "equipo.antiguedad":
      return ["menos1", "1a2", "mas2"].includes(valor) ? null : "Indicá la antigüedad";
    case "titular.nombre":
      return validarNombre(valor, "nombre");
    case "titular.apellido":
      return validarNombre(valor, "apellido");
    case "titular.dni":
      return /^\d{7,8}$/.test(valor) ? null : "El DNI debe tener 7 u 8 números";
    case "titular.nacimiento":
      return esMayorDeEdad(valor) ? null : "Tenés que ser mayor de edad";
    case "titular.email":
      return emailValido.test(valor) ? null : "Ingresá un email válido";
    case "titular.celular": {
      const celular = String(valor).replace(/[\s-]/g, "");
      return /^(?!0)(?!15)\d{10}$/.test(celular)
        ? null
        : "Ingresá 10 dígitos, sin 0 ni 15 inicial";
    }
    case "titular.terminos":
      return valor ? null : "Tenés que aceptar los términos";
    case "pago.metodo":
      return ["credito", "debito"].includes(valor) ? null : "Elegí un medio de pago";
    case "pago.tarjeta":
      return String(valor).replace(/\s/g, "").length === 16
        ? null
        : "Número de tarjeta inválido";
    case "pago.vencimiento":
      return fechaVencimientoValida(valor) ? null : "Vencimiento inválido";
    case "pago.cvv":
      return /^\d{3}$/.test(valor) ? null : "CVV inválido";
    case "pago.titular":
      return String(valor).trim() ? null : "Ingresá el nombre del titular";
    default:
      return null;
  }
}

export function camposDelPaso(paso, solicitud = { producto: "celular" }) {
  if (paso === 1) {
    const camposEquipo = [
      ["equipo.marca", "marca"],
      ["equipo.modelo", "modelo"],
      ["equipo.valor", "valor"],
      ["equipo.antiguedad", "antiguedad"],
    ];
    if (solicitud.producto === "bicicleta") {
      camposEquipo.splice(2, 0, ["equipo.tipo", "tipo"], ["equipo.rodado", "rodado"]);
    }
    return camposEquipo;
  }
  if (paso === 3) {
    return [
      ["titular.nombre", "nombre"],
      ["titular.apellido", "apellido"],
      ["titular.dni", "dni"],
      ["titular.nacimiento", "nacimiento"],
      ["titular.email", "email"],
      ["titular.celular", "celular"],
      ["titular.terminos", "terminos"],
    ];
  }
  if (paso === 4) {
    return [
      ["pago.metodo", "metodo"],
      ["pago.tarjeta", "tarjeta"],
      ["pago.vencimiento", "vencimiento"],
      ["pago.cvv", "cvv"],
      ["pago.titular", "titular-tarjeta"],
    ];
  }
  return [];
}

export function valorDeCampo(campo, solicitud) {
  const [grupo, propiedad] = campo.split(".");
  return solicitud[grupo][propiedad];
}

export function validarPaso(paso, solicitud) {
  return camposDelPaso(paso, solicitud).map(([campo]) => ({
    campo,
    error: validarCampo(campo, valorDeCampo(campo, solicitud)),
  }));
}
