import { solicitud } from "./estado.js";
import { calcularCuota, normalizarImporte } from "./cotizador.js";
import { validarCampo, valorDeCampo, camposDelPaso } from "./validaciones.js";

const moneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export let planes = [];

export function establecerPlanes(nuevosPlanes) {
  planes = nuevosPlanes;
  const lista = document.querySelector("#planes-list");
  lista.replaceChildren();
  delete lista.dataset.rendered;
  if (!planes.length) {
    lista.setAttribute("aria-label", "Planes no disponibles");
  } else {
    lista.setAttribute("aria-label", `Planes disponibles para ${solicitud.producto}`);
  }
  renderPlanes();
  renderResumen();
  renderResultados();
  actualizarBotones();
}

export function formatearMoneda(valor) {
  return moneda.format(Number(valor) || 0);
}

export function obtenerCuota(plan) {
  if (!plan) return 0;
  return calcularCuota(
    normalizarImporte(solicitud.equipo.valor),
    plan.tasaAnual,
    solicitud.equipo.antiguedad,
  );
}

export function render() {
  const paso = solicitud.paso;
  actualizarProducto();
  document.querySelectorAll("[data-paso]").forEach((seccion) => {
    seccion.hidden = Number(seccion.dataset.paso) !== paso;
  });

  const checkout = document.querySelector("[data-checkout]");
  checkout.hidden = paso < 1 || paso > 4;

  document.querySelectorAll("[data-step-indicator]").forEach((indicador) => {
    const numero = Number(indicador.dataset.stepIndicator);
    indicador.classList.toggle("is-active", numero === paso);
    indicador.classList.toggle("is-complete", numero < paso);
    if (numero === paso) indicador.setAttribute("aria-current", "step");
    else indicador.removeAttribute("aria-current");
  });

  const contador = document.querySelector("#step-counter");
  if (paso >= 1 && paso <= 4) contador.textContent = `Paso ${paso} de 4`;
  document.querySelector("[data-step-label='1']").textContent = solicitud.producto === "bicicleta"
    ? "Tu bicicleta"
    : "Tu celular";

  sincronizarCampos();
  renderPlanes();
  renderResumen();
  renderResultados();
  actualizarBotones();
}

function sincronizarCampos() {
  document.querySelectorAll("[data-field]").forEach((control) => {
    const [grupo, campo] = control.dataset.field.split(".");
    const valor = solicitud[grupo][campo];
    if (control.type === "radio") control.checked = control.value === valor;
    else if (control.type === "checkbox") control.checked = Boolean(valor);
    else if (document.activeElement !== control) {
      control.value = grupo === "equipo" && campo === "valor" && valor
        && Number.isFinite(normalizarImporte(valor))
        ? normalizarImporte(valor).toLocaleString("es-AR")
        : valor ?? "";
    }
    actualizarError(control.dataset.field, solicitud.errores[control.dataset.field] || "");
  });
  document.querySelectorAll("[data-fieldset]").forEach((grupo) => {
    actualizarError(grupo.dataset.fieldset, solicitud.errores[grupo.dataset.fieldset] || "");
  });
}

function actualizarProducto() {
  const bicicleta = solicitud.producto === "bicicleta";
  const marca = document.querySelector("#marca");
  const marcas = bicicleta
    ? ["Trek", "Specialized", "Giant", "Scott", "Otra"]
    : ["Apple", "Samsung", "Motorola", "Xiaomi", "Otra"];
  if (marca.dataset.productOptions !== solicitud.producto) {
    marca.replaceChildren(new Option("Elegí una marca", ""));
    marcas.forEach((opcion) => marca.add(new Option(opcion, opcion)));
    marca.dataset.productOptions = solicitud.producto;
  }
  document.querySelector("#modelo").placeholder = bicicleta ? "Ej.: Marlin 5" : "Ej.: Galaxy A55";
  document.querySelector("#modelo-help").textContent = bicicleta
    ? "Ingresá el modelo de tu bicicleta."
    : "Ingresá el modelo tal como aparece en tu celular.";
  document.querySelector("[data-hero-eyebrow]").lastChild.textContent = bicicleta
    ? " TU BICICLETA, SIEMPRE PROTEGIDA"
    : " TU CELULAR, SIEMPRE PROTEGIDO";
  document.querySelector("[data-hero-lead]").textContent = bicicleta
    ? "Elegí la protección ideal para tu bicicleta. Cotizá en minutos y contratá online."
    : "Elegí la protección ideal para tu celular. Cotizá en minutos, contratá online y seguí con tu día.";
  document.querySelectorAll("[data-product-field]").forEach((campo) => {
    campo.hidden = campo.dataset.productField !== solicitud.producto;
  });
  document.querySelector("#checkout-title").textContent = solicitud.paso === 1
    ? `Cotizá tu ${bicicleta ? "bicicleta" : "seguro"}`
    : solicitud.paso === 2 ? "Elegí tu plan" : solicitud.paso === 3 ? "Tus datos" : "Confirmá tu pago";
  document.querySelector("[data-quote-heading]").textContent = bicicleta
    ? "Contanos sobre tu bicicleta"
    : "Contanos sobre tu celular";
  document.querySelector("[data-success-product]").textContent = bicicleta ? "bicicleta" : "celular";
  document.querySelector("[data-quote-label]").textContent = bicicleta
    ? "¿Cuánto vale tu bicicleta?"
    : "¿Cuánto vale tu celular?";
  document.querySelector("#equipo-valor-help").textContent = bicicleta
    ? "Ingresá el valor actual de tu bicicleta."
    : "Valor aproximado de mercado, entre $100.000 y $2.500.000.";
  document.querySelector("[data-bicycle-rate-note]").hidden = !bicicleta;
  document.querySelector("[data-cellphone-points]").hidden = bicicleta;
  document.querySelector("[data-bike-points]").hidden = !bicicleta;
  document.querySelectorAll("[data-product-choice]").forEach((choice) => {
    const active = choice.dataset.productChoice === solicitud.producto;
    choice.classList.toggle("product-active", active);
    choice.setAttribute("aria-pressed", String(active));
    const badge = choice.querySelector(".product-selected");
    if (badge) badge.hidden = !active;
  });
  const botonInicio = document.querySelector("[data-action='start']");
  botonInicio.innerHTML = `Cotizar seguro de ${bicicleta ? "bicicleta" : "celular"} <span aria-hidden="true">→</span>`;
}

function actualizarError(campo, mensaje) {
  const id = `${campo.replace(".", "-")}-error`;
  const error = document.getElementById(id);
  if (error) error.textContent = mensaje;

  const control = document.querySelector(`[data-field="${campo}"]`);
  const contenedor = control?.closest(".field") || control?.closest("[data-fieldset]");
  if (contenedor) {
    contenedor.toggleAttribute("data-invalid", Boolean(mensaje));
  } else {
    const grupo = document.querySelector(`[data-fieldset="${campo}"]`);
    grupo?.toggleAttribute("data-invalid", Boolean(mensaje));
  }
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

function renderPlanes() {
  const lista = document.querySelector("#planes-list");
  if (!lista || !planes.length) return;
  if (lista.dataset.rendered === "true") {
    lista.querySelectorAll(".plan-option").forEach((opcion) => {
      const seleccionado = opcion.querySelector("input").value === solicitud.plan;
      opcion.classList.toggle("is-selected", seleccionado);
      opcion.querySelector("input").checked = seleccionado;
      const plan = planes.find((item) => item.id === opcion.querySelector("input").value);
      opcion.querySelector(".plan-price").textContent = formatearMoneda(obtenerCuota(plan));
    });
    return;
  }

  planes.forEach((plan) => {
    const opcion = document.createElement("label");
    opcion.className = `plan-option${plan.id === solicitud.plan ? " is-selected" : ""}`;
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "plan";
    radio.value = plan.id;
    radio.checked = plan.id === solicitud.plan;
    radio.setAttribute("aria-label", `Plan ${plan.nombre}`);

    const tarjeta = document.createElement("span");
    tarjeta.className = "plan-card";
    const primeraLinea = document.createElement("span");
    primeraLinea.className = "plan-topline";
    const nombre = document.createElement("strong");
    nombre.textContent = plan.nombre;
    primeraLinea.append(nombre);
    if (plan.recomendado) {
      const badge = document.createElement("span");
      badge.className = "plan-badge";
      badge.textContent = "Recomendado";
      primeraLinea.append(badge);
    }

    const precio = document.createElement("span");
    precio.className = "plan-price";
    precio.textContent = formatearMoneda(obtenerCuota(plan));
    const tasa = document.createElement("span");
    tasa.className = "plan-rate";
    tasa.textContent = `${(plan.tasaAnual * 100).toLocaleString("es-AR")} % anual`;
    const etiquetaPrecio = document.createElement("span");
    etiquetaPrecio.className = "plan-price-caption";
    etiquetaPrecio.textContent = "por mes";

    const coberturasTitulo = document.createElement("span");
    coberturasTitulo.className = "plan-cover-label";
    coberturasTitulo.textContent = "Incluye";
    const coberturas = document.createElement("ul");
    coberturas.className = "plan-coverages";
    plan.coberturas.forEach((texto) => {
      const cobertura = document.createElement("li");
      cobertura.textContent = texto;
      coberturas.append(cobertura);
    });

    tarjeta.append(primeraLinea, precio, etiquetaPrecio, tasa, coberturasTitulo, coberturas);
    opcion.append(radio, tarjeta);
    lista.append(opcion);
  });
  lista.dataset.rendered = "true";
}

function renderResumen() {
  const resumen = document.querySelector("#resumen");
  if (!resumen) return;
  resumen.replaceChildren();

  const equipo = [solicitud.equipo.marca, solicitud.equipo.modelo].filter(Boolean).join(" ");
  const detalleEquipo = equipo || `Tu ${solicitud.producto}`;
  const detalleConValor = solicitud.equipo.valor
    ? `${detalleEquipo} · ${formatearMoneda(normalizarImporte(solicitud.equipo.valor))}`
    : detalleEquipo;
  agregarLinea(resumen, "Equipo", detalleConValor, 1);

  const plan = planes.find((item) => item.id === solicitud.plan);
  agregarLinea(
    resumen,
    "Seguro",
    `${solicitud.producto === "bicicleta" ? "Bicicleta" : "Celular"} · Plan ${plan?.nombre || "Plus"}`,
    2,
  );

  if (solicitud.titular.nombre || solicitud.titular.apellido) {
    agregarLinea(
      resumen,
      "Titular",
      `${solicitud.titular.nombre} ${solicitud.titular.apellido}`.trim(),
      3,
    );
  }
  if (solicitud.paso === 4 || solicitud.paso === 5 || solicitud.paso === 6) {
    agregarLinea(resumen, "Medio de pago", solicitud.pago.metodo === "debito" ? "Débito" : "Crédito");
  }

  const separador = document.createElement("hr");
  separador.className = "summary-divider";
  resumen.append(separador);

  const total = document.createElement("div");
  total.className = "summary-total";
  const etiqueta = document.createElement("span");
  etiqueta.textContent = "Total mensual";
  const importe = document.createElement("strong");
  importe.textContent = plan && solicitud.equipo.valor && solicitud.equipo.antiguedad
    ? formatearMoneda(obtenerCuota(plan))
    : "—";
  total.append(etiqueta, importe);
  resumen.append(total);

  const nota = document.createElement("p");
  nota.className = "summary-footnote";
  nota.textContent = "El cobro se realiza mensualmente.";
  resumen.append(nota);
}

function agregarLinea(contenedor, etiqueta, valor, pasoEditable) {
  const linea = document.createElement("p");
  linea.className = "summary-line";
  const titulo = document.createElement("span");
  titulo.textContent = etiqueta;
  const detalle = document.createElement("strong");
  detalle.textContent = valor;
  linea.append(titulo, detalle);
  if (pasoEditable) {
    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "summary-edit";
    editar.dataset.action = "edit-step";
    editar.dataset.step = String(pasoEditable);
    editar.textContent = "Editar";
    editar.setAttribute("aria-label", `Editar ${etiqueta.toLowerCase()}`);
    linea.append(editar);
  }
  contenedor.append(linea);
}

function renderResultados() {
  if (solicitud.paso === 5) {
    document.querySelector("[data-success-name]").textContent = solicitud.titular.nombre;
    document.querySelector("[data-success-email]").textContent = solicitud.titular.email;
    document.querySelector("[data-policy-number]").textContent = solicitud.poliza || "";
    const detalles = document.querySelector("#success-details");
    detalles.replaceChildren();
    [
      [solicitud.producto === "bicicleta" ? "Bicicleta" : "Celular", `${solicitud.equipo.marca} ${solicitud.equipo.modelo}`.trim()],
      ["Plan", planes.find((plan) => plan.id === solicitud.plan)?.nombre || "Plus"],
      ["Titular", `${solicitud.titular.nombre} ${solicitud.titular.apellido}`.trim()],
      ["Cuota mensual", formatearMoneda(obtenerCuota(planes.find((plan) => plan.id === solicitud.plan)))],
    ].forEach(([etiqueta, valor]) => {
      const detalle = document.createElement("div");
      detalle.className = "success-detail";
      const titulo = document.createElement("span");
      titulo.textContent = etiqueta;
      const texto = document.createElement("strong");
      texto.textContent = valor;
      detalle.append(titulo, texto);
      detalles.append(detalle);
    });
  }
}

export function mostrarError(campo, mensaje) {
  solicitud.errores[campo] = mensaje;
  actualizarError(campo, mensaje);
}

export function actualizarBotones() {
  document.querySelectorAll("[data-form-step]").forEach((formulario) => {
    const paso = Number(formulario.dataset.formStep);
    if (paso === 4) {
      formulario.querySelectorAll("input, select").forEach((control) => {
        control.disabled = solicitud.procesando;
      });
      const botonPago = formulario.querySelector("[data-pay-button]");
      if (botonPago) {
        botonPago.innerHTML = solicitud.procesando
          ? "Procesando…"
          : 'Pagar y contratar <span aria-hidden="true">→</span>';
      }
    }
    const boton = formulario.querySelector('button[type="submit"]');
    if (boton) {
      boton.disabled = solicitud.procesando || validarPaso(paso).some(({ error }) => Boolean(error));
    }
  });
  const continuar = document.querySelector('[data-action="continue"][data-next="3"]');
  if (continuar) continuar.disabled = planes.length === 0 || !planes.some((plan) => plan.id === solicitud.plan);
}

function validarPaso(paso) {
  return camposDelPaso(paso, solicitud).map(([campo]) => ({
    error: validarCampo(campo, valorDeCampo(campo, solicitud)),
  }));
}
