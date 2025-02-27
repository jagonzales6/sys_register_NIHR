let ubicacionActual = "";
let fotoBase64 = "";
let etiqueta = "";
let videoStream = null;

// 🔍 Verifica si el usuario ya registró asistencia hoy en la base de datos con una etiqueta específica
async function verificarRegistro(usuario, etiqueta) {
  let url = `https://script.google.com/macros/s/AKfycbypK4KN5YplAXIk791jEUsGTdQaF_za9I7-S6svLKZimpHNDMjlMp65KC3Oa-rnRu3ogg/exec?usuario=${usuario}&etiqueta=${etiqueta}`;
  try {
    let respuesta = await fetch(url);
    let datos = await respuesta.json();
    return datos.status === "error" && datos.message.includes(`Ya registraste tu ${etiqueta.toLowerCase()} hoy.`);
  } catch (error) {
    console.error("Error al verificar el registro: ", error);
    return false;
  }
}

// 📍 Función principal para registrar asistencia
async function marcarAsistencia(entrada) {
  etiqueta = entrada ? "Entrada" : "Salida";
  let usuario = document.getElementById("usuario").value;

  if (!usuario) {
    mostrarModal("Error", "Debe ingresar su CI.");
    return;
  }

  if (!fotoBase64) {
    mostrarModal("Error", "Debe tomar una foto antes de registrar la asistencia.");
    return;
  }

  // ✅ Bloquear botones para evitar doble clic
  bloquearBotones(true);

  // ✅ Verificar si el usuario ya está registrado hoy con la etiqueta correspondiente
  let yaRegistrado = await verificarRegistro(usuario, etiqueta);
  if (yaRegistrado) {
    mostrarModal("Aviso", `Ya has registrado tu ${etiqueta.toLowerCase()} hoy.`);
    bloquearBotones(false);
    return;
  }

  // 🌍 Obtener ubicación
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      ubicacionActual = `${pos.coords.latitude}, ${pos.coords.longitude}`;
      enviarDatos();
    },
    () => {
      mostrarModal("Error", "No se pudo obtener la ubicación.");
      bloquearBotones(false);
    }
  );
}

// 📸 Mantener la cámara siempre activa
function activarCamara() {
  let video = document.getElementById("video");

  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      videoStream = stream;
      video.srcObject = stream;
    })
    .catch(() => mostrarModal("Error", "Error al acceder a la cámara."));
}

// 📸 Capturar foto desde la cámara al hacer clic en el botón "Tomar Foto"
function tomarFoto() {
  let video = document.getElementById("video");
  let canvas = document.getElementById("canvas");
  let ctx = canvas.getContext("2d");

  canvas.width = 320;
  canvas.height = 240;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  fotoBase64 = canvas.toDataURL("image/jpeg");
  document.getElementById("captura").src = fotoBase64;

  // ✅ Habilitar los botones de asistencia después de tomar la foto
  document.querySelector(".entrada").disabled = false;
  document.querySelector(".salida").disabled = false;
}

// 📤 Enviar datos al servidor y actualizar el registro
async function enviarDatos() {
  let usuario = document.getElementById("usuario").value;

  if (!usuario || !ubicacionActual || !fotoBase64) {
    mostrarModal("Error", "Falta información para registrar.");
    bloquearBotones(false);
    return;
  }

  let url = "https://script.google.com/macros/s/AKfycbypK4KN5YplAXIk791jEUsGTdQaF_za9I7-S6svLKZimpHNDMjlMp65KC3Oa-rnRu3ogg/exec";
  let data = { usuario, etiqueta, ubicacion: ubicacionActual, foto: fotoBase64 };

  try {
    let respuesta = await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    mostrarModal("Éxito", `${etiqueta} registrada exitosamente.`);
    agregarRegistroATabla(usuario, etiqueta, ubicacionActual, fotoBase64);
  } catch (error) {
    mostrarModal("Error", "Error al registrar la asistencia.");
  }

  // ✅ Desbloquear botones después de completar el proceso
  bloquearBotones(false);
}

// 📄 Agregar registro a la tabla
function agregarRegistroATabla(usuario, etiqueta, ubicacion, foto) {
  let tabla = document.getElementById("tabla-registros").getElementsByTagName("tbody")[0];
  let nuevaFila = tabla.insertRow();

  let celdaUsuario = nuevaFila.insertCell(0);
  let celdaEtiqueta = nuevaFila.insertCell(1);
  let celdaUbicacion = nuevaFila.insertCell(2);
  let celdaFoto = nuevaFila.insertCell(3);
  let celdaHora = nuevaFila.insertCell(4);

  let horaActual = new Date().toLocaleTimeString();

  celdaUsuario.textContent = usuario;
  celdaEtiqueta.textContent = etiqueta;
  celdaUbicacion.textContent = ubicacion;
  celdaFoto.innerHTML = `<img src="${foto}" width="50">`;
  celdaHora.textContent = horaActual;
}

// 📢 Mostrar modal con mensajes
function mostrarModal(titulo, mensaje) {
  let modal = document.getElementById("modal");
  let overlay = document.getElementById("overlay");

  document.getElementById("modal-titulo").innerText = titulo;
  document.getElementById("modal-mensaje").innerText = mensaje;

  modal.style.display = "block";
  overlay.style.display = "block";

  // Cerrar modal con la tecla "Esc"
  document.addEventListener("keydown", cerrarModalConTecla);
}

// ❌ Cerrar modal
function cerrarModal() {
  let modal = document.getElementById("modal");
  let overlay = document.getElementById("overlay");

  modal.style.display = "none";
  overlay.style.display = "none";

  // Remover el event listener para evitar múltiples registros
  document.removeEventListener("keydown", cerrarModalConTecla);
}

// 🔒 Cerrar modal con tecla "Esc"
function cerrarModalConTecla(event) {
  if (event.key === "Escape") {
    cerrarModal();
  }
}

// 🔒 Bloquear y desbloquear botones para evitar doble clic
function bloquearBotones(bloquear) {
  document.querySelector(".entrada").disabled = bloquear;
  document.querySelector(".salida").disabled = bloquear;
}

// 🚀 Iniciar la cámara cuando la página cargue
window.addEventListener("load", activarCamara);

// 📢 Cerrar modal si se hace clic fuera del contenido
document.getElementById("overlay").addEventListener("click", cerrarModal);
