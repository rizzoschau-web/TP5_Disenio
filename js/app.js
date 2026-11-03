import {
  solicitud,
  actualizarCampo,
  irAPaso,
  reiniciarSolicitud,
  restaurarSolicitud,
  seleccionarPlan,
  seleccionarProducto,
  limpiarSolicitudGuardada,
} from "./estado.js";
import { generarPoliza, simularPago } from "./pago.js";
import { normalizarImporte } from "./cotizador.js";
import planesCelular from "../data/planes.json" with { type: "json" };
import planesBicicleta from "../data/planes-bicicleta.json" with { type: "json" };
import {
  actualizarBotones,
  establecerPlanes,
  render,
} from "./render.js";
import { camposDelPaso, validarCampo, valorDeCampo } from "./validaciones.js";

const nombresGrupos = {
  equipo: "equipo",
  titular: "titular",
  pago: "pago",
};
const claveTema = "cubri-seguros-theme";

function aplicarTema(tema, guardar = true) {
  const modoOscuro = tema === "dark";
  document.documentElement.dataset.theme = modoOscuro ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]').content = modoOscuro ? "#0b1120" : "#f5f7fb";

  const boton = document.querySelector("[data-action='toggle-theme']");
  boton.setAttribute("aria-pressed", String(modoOscuro));
  boton.setAttribute("aria-label", modoOscuro ? "Activar modo claro" : "Activar modo oscuro");
  boton.title = modoOscuro ? "Activar modo claro" : "Activar modo oscuro";

  if (guardar) {
    try {
      localStorage.setItem(claveTema, modoOscuro ? "dark" : "light");
    } catch (error) {
      console.warn("No se pudo guardar la preferencia del tema.", error);
    }
  }
}

function cargarTema() {
  try {
    const temaGuardado = localStorage.getItem(claveTema);
    aplicarTema(temaGuardado === "dark" ? "dark" : "light", false);
  } catch (error) {
    console.warn("No se pudo leer la preferencia del tema.", error);
    aplicarTema("light", false);
  }
}

function cargarPlanes() {
  const aviso = document.querySelector("#planes-error");
  aviso.hidden = true;
  try {
    const datos = solicitud.producto === "bicicleta" ? planesBicicleta : planesCelular;
    if (!Array.isArray(datos) || datos.length !== 3 || datos.some((plan) =>
      typeof plan.id !== "string"
      || typeof plan.nombre !== "string"
      || !Number.isFinite(plan.tasaAnual)
      || !Array.isArray(plan.coberturas))) {
      throw new Error("El archivo de planes no tiene el formato esperado.");
    }
    establecerPlanes(datos);
  } catch (error) {
    console.error("No se pudieron cargar los planes del seguro.", error);
    aviso.hidden = false;
    establecerPlanes([]);
  }
}

function mostrarError(campo) {
  const valor = valorDeCampo(campo, solicitud);
  const mensaje = validarCampo(campo, valor);
  solicitud.errores[campo] = mensaje || "";
  const id = `${campo.replace(".", "-")}-error`;
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = mensaje || "";
  const control = document.querySelector(`[data-field="${campo}"]`);
  const contenedor = control?.closest(".field") || document.querySelector(`[data-fieldset="${campo}"]`);
  contenedor?.toggleAttribute("data-invalid", Boolean(mensaje));
  if (control) {
    if (mensaje) control.setAttribute("aria-invalid", "true");
    else control.removeAttribute("aria-invalid");
  }
  const grupo = document.querySelector(`[data-fieldset="${campo}"]`);
  if (grupo) {
    if (mensaje) grupo.setAttribute("aria-invalid", "true");
    else grupo.removeAttribute("aria-invalid");
  }
}

function actualizarDato(control) {
  const campoCompleto = control.dataset.field;
  if (!campoCompleto) return;
  const [grupo, campo] = campoCompleto.split(".");
  let valor;

  if (control.type === "radio") {
    if (!control.checked) return;
    valor = control.value;
  } else if (control.type === "checkbox") {
    valor = control.checked;
  } else {
    valor = control.value;
  }

  if (!nombresGrupos[grupo]) return;
  actualizarCampo(grupo, campo, valor);
  if (solicitud.tocados[campoCompleto]) mostrarError(campoCompleto);
  render();
}

function prepararFormato(control) {
  const digitos = control.value.replace(/\D/g, "");
  if (control.dataset.format === "card") {
    control.value = digitos.slice(0, 16).match(/.{1,4}/g)?.join(" ") || "";
  } else if (control.dataset.format === "expiry") {
    const valor = digitos.slice(0, 4);
    control.value = valor.length > 2 ? `${valor.slice(0, 2)}/${valor.slice(2)}` : valor;
  }
}

function enfocarPrimerError(paso) {
  const primerError = camposDelPaso(paso, solicitud)
    .map(([campo]) => [campo, validarCampo(campo, valorDeCampo(campo, solicitud))])
    .find(([, error]) => error);
  if (!primerError) return;
  solicitud.errores[primerError[0]] = primerError[1];
  mostrarError(primerError[0]);
  document.querySelector(`[data-field="${primerError[0]}"]`)?.focus();
}

function guardarErroresDelPaso(paso) {
  camposDelPaso(paso, solicitud).forEach(([campo]) => {
    solicitud.tocados[campo] = true;
    solicitud.errores[campo] = validarCampo(campo, valorDeCampo(campo, solicitud)) || "";
    mostrarError(campo);
  });
  return camposDelPaso(paso, solicitud).every(([campo]) => !solicitud.errores[campo]);
}

function volver() {
  if (solicitud.paso === 0) return;
  if (solicitud.paso === 6) {
    irAPaso(3);
  } else {
    irAPaso(Math.max(0, solicitud.paso - 1));
  }
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function mostrarAnuncio(mensaje) {
  document.querySelector("#live-announcer").textContent = mensaje;
}

function mostrarToast(categoria, titulo, descripcion) {
  const toaster = document.querySelector("#toaster");
  if (typeof toaster.toast !== "function") {
    console.error("No se pudo inicializar el componente toast de Basecoat.");
    return;
  }
  try {
    toaster.toast({ category: categoria, title: titulo, description: descripcion });
  } catch (error) {
    console.error("No se pudo mostrar el toast de Basecoat.", error);
  }
}

async function pagar() {
  if (!guardarErroresDelPaso(4)) {
    enfocarPrimerError(4);
    actualizarBotones();
    return;
  }

  solicitud.procesando = true;
  const feedback = document.querySelector("#payment-feedback");
  feedback.textContent = "";
  render();
  const boton = document.querySelector("[data-pay-button]");
  boton.textContent = "Procesando…";
  mostrarAnuncio("Procesando el pago.");

  try {
    const resultado = await simularPago(solicitud.pago.tarjeta);
    solicitud.procesando = false;
    if (resultado.ok) {
      solicitud.poliza = generarPoliza();
      irAPaso(5);
      limpiarSolicitudGuardada();
      mostrarAnuncio("Pago aprobado. Tu seguro está activo.");
      mostrarToast("success", "Pago confirmado", "La póliza fue emitida y enviada al email.");
    } else {
      irAPaso(6);
      mostrarAnuncio("El pago fue rechazado. Podés reintentarlo o cambiar el medio de pago.");
      mostrarToast("error", "Pago rechazado", "La solicitud se conserva para que puedas reintentar.");
    }
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    solicitud.procesando = false;
    feedback.textContent = "No pudimos procesar el pago. Intentá nuevamente.";
    console.error("Falló la simulación del pago.", error);
    render();
    mostrarAnuncio("No se pudo procesar el pago.");
  }
}

document.addEventListener("input", (evento) => {
  const control = evento.target.closest("[data-field]");
  if (!control) return;
  if (control.type === "radio" || control.type === "checkbox") return;
  if (control.dataset.format) prepararFormato(control);
  actualizarDato(control);
});

document.addEventListener("change", (evento) => {
  const control = evento.target.closest("[data-field]");
  if (control) actualizarDato(control);
  if (evento.target.matches('input[name="plan"]')) {
    seleccionarPlan(evento.target.value);
    render();
  }
});

document.addEventListener("focusout", (evento) => {
  const control = evento.target.closest("[data-field]");
  if (!control) return;
  const campo = control.dataset.field;
  solicitud.tocados[campo] = true;
  mostrarError(campo);
  if (campo === "equipo.valor" && !solicitud.errores[campo]) {
    control.value = normalizarImporte(solicitud.equipo.valor).toLocaleString("es-AR");
  }
  actualizarBotones();
});

document.addEventListener("submit", (evento) => {
  const formulario = evento.target.closest("[data-form-step]");
  if (!formulario) return;
  evento.preventDefault();
  const paso = Number(formulario.dataset.formStep);
  if (!guardarErroresDelPaso(paso)) {
    enfocarPrimerError(paso);
    actualizarBotones();
    return;
  }
  if (paso === 1) {
    irAPaso(2);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (paso === 3) {
    irAPaso(4);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (paso === 4) {
    pagar();
  }
});

document.addEventListener("click", (evento) => {
  const accion = evento.target.closest("[data-action]");
  if (!accion) return;
  const tipo = accion.dataset.action;

  if (tipo === "start") {
    irAPaso(1);
    render();
    document.querySelector("#marca").focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (tipo === "select-product") {
    seleccionarProducto(accion.dataset.product);
    cargarPlanes();
    render();
  } else if (tipo === "home") {
    evento.preventDefault();
    reiniciarSolicitud();
    cargarPlanes();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (tipo === "back") {
    evento.preventDefault();
    volver();
  } else if (tipo === "continue") {
    irAPaso(Number(accion.dataset.next));
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (tipo === "edit-step") {
    irAPaso(Number(accion.dataset.step));
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (tipo === "reload-plans") {
    cargarPlanes();
  } else if (tipo === "toggle-theme") {
    aplicarTema(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  } else if (tipo === "retry-payment" || tipo === "change-payment") {
    irAPaso(4);
    render();
    if (tipo === "change-payment") document.querySelector('[data-field="pago.metodo"]')?.focus();
    else document.querySelector("#tarjeta").focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (tipo === "terms") {
    evento.preventDefault();
    window.alert("Esta experiencia es una demostración académica. La contratación y los términos reales no están disponibles en esta versión.");
  }
});

restaurarSolicitud();
cargarTema();
render();
actualizarBotones();
cargarPlanes();
