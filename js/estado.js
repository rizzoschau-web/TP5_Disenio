export const solicitudInicial = () => ({
  paso: 0,
  producto: "celular",
  equipo: {
    marca: "",
    modelo: "",
    tipo: "",
    rodado: "",
    valor: "",
    antiguedad: "",
  },
  plan: "plus",
  titular: {
    nombre: "",
    apellido: "",
    dni: "",
    nacimiento: "",
    email: "",
    celular: "",
    terminos: false,
  },
  pago: {
    metodo: "credito",
    tarjeta: "",
    vencimiento: "",
    cvv: "",
    titular: "",
  },
  errores: {},
  tocados: {},
  poliza: null,
  procesando: false,
});

export let solicitud = solicitudInicial();
const claveSolicitud = "cubri-seguros-solicitud";

export function actualizarCampo(grupo, campo, valor) {
  solicitud[grupo][campo] = valor;
  guardarSolicitud();
}

export function irAPaso(paso) {
  solicitud.paso = paso;
  guardarSolicitud();
}

export function seleccionarPlan(plan) {
  solicitud.plan = plan;
  guardarSolicitud();
}

export function seleccionarProducto(producto) {
  solicitud.producto = producto;
  solicitud.paso = 0;
  solicitud.equipo = {
    marca: "",
    modelo: "",
    tipo: "",
    rodado: "",
    valor: "",
    antiguedad: "",
  };
  solicitud.plan = "plus";
  solicitud.errores = {};
  solicitud.tocados = {};
  guardarSolicitud();
}

export function guardarSolicitud() {
  try {
    const copia = {
      ...solicitud,
      equipo: { ...solicitud.equipo },
      titular: { ...solicitud.titular },
      pago: { metodo: solicitud.pago.metodo },
      errores: {},
      tocados: {},
      procesando: false,
    };
    localStorage.setItem(claveSolicitud, JSON.stringify(copia));
  } catch (error) {
    console.warn("No se pudo guardar la solicitud.", error);
  }
}

export function restaurarSolicitud() {
  try {
    const guardada = localStorage.getItem(claveSolicitud);
    if (!guardada) return;
    const datos = JSON.parse(guardada);
    const inicial = solicitudInicial();
    if (!datos || typeof datos !== "object" || !["celular", "bicicleta"].includes(datos.producto)) {
      limpiarSolicitudGuardada();
      return;
    }
    solicitud = {
      ...inicial,
      ...datos,
      equipo: { ...inicial.equipo, ...(datos.equipo || {}) },
      titular: { ...inicial.titular, ...(datos.titular || {}) },
      pago: { ...inicial.pago, metodo: datos.pago?.metodo || inicial.pago.metodo },
      errores: {},
      tocados: {},
      procesando: false,
    };
    if (![0, 1, 2, 3, 4, 5, 6].includes(solicitud.paso)) solicitud.paso = 0;
  } catch (error) {
    console.warn("No se pudo recuperar la solicitud guardada.", error);
    limpiarSolicitudGuardada();
  }
}

export function reiniciarSolicitud() {
  solicitud = solicitudInicial();
  limpiarSolicitudGuardada();
}

export function limpiarSolicitudGuardada() {
  try {
    localStorage.removeItem(claveSolicitud);
  } catch (error) {
    console.warn("No se pudo limpiar la solicitud guardada.", error);
  }
}
