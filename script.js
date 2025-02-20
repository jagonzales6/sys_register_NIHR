let ubicacionActual = "";
let fotoBase64 = "";
let etiqueta = "";

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

  // ✅ Verificar si el usuario ya está registrado hoy con la etiqueta correspondiente
  let yaRegistrado = await verificarRegistro(usuario, etiqueta);
  if (yaRegistrado) {
    mostrarModal("Aviso", `Ya has registrado tu ${etiqueta.toLowerCase()} hoy.`);
    return;
  }

  // 🌍 Obtener ubicación
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      ubicacionActual = `${pos.coords.latitude}, ${pos.coords.longitude}`;
      tomarFoto();
    },
    () => mostrarModal("Error", "No se pudo obtener la ubicación.")
  );
}

// 📸 Capturar foto desde la cámara
function tomarFoto() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      let video = document.getElementById("video");
      video.srcObject = stream;

      setTimeout(() => {
        let canvas = document.getElementById("canvas");
        let ctx = canvas.getContext("2d");
        canvas.width = 320;
        canvas.height = 240;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        fotoBase64 = canvas.toDataURL("image/jpeg");
        document.getElementById("captura").src = fotoBase64;
        video.srcObject.getTracks().forEach((track) => track.stop());

        enviarDatos();
      }, 2000);
    })
    .catch(() => mostrarModal("Error", "Error al acceder a la cámara."));
}

// 📤 Enviar datos al servidor
async function enviarDatos() {
  let usuario = document.getElementById("usuario").value;

  if (!usuario || !ubicacionActual || !fotoBase64) {
    mostrarModal("Error", "Falta información para registrar.");
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
  } catch (error) {
    mostrarModal("Error", "Error al registrar la asistencia.");
  }
}

// 📢 Mostrar modal con mensajes
function mostrarModal(titulo, mensaje) {
  document.getElementById("modal-titulo").innerText = titulo;
  document.getElementById("modal-mensaje").innerText = mensaje;
  document.getElementById("modal").style.display = "block";
  document.getElementById("overlay").style.display = "block";
}

// ❌ Cerrar modal
function cerrarModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("overlay").style.display = "none";
}
