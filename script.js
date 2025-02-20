let ubicacionActual = "";
let fotoBase64 = "";
let etiqueta = "";

function marcarAsistencia(entrada) {
  etiqueta = entrada ? "Entrada" : "Salida";
  let usuario = document.getElementById("usuario").value;

  if (!usuario) {
    mostrarModal("Error", "Debe ingresar un nombre.");
    return;
  }

  let hoy = new Date().toLocaleDateString();
  let claveRegistro = `registro_${etiqueta.toLowerCase()}_${usuario}`;
  let ultimoRegistro = localStorage.getItem(claveRegistro);

  if (ultimoRegistro === hoy) {
    mostrarModal("Aviso", `Ya has registrado tu ${etiqueta.toLowerCase()} hoy.`);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      ubicacionActual = `${pos.coords.latitude}, ${pos.coords.longitude}`;
      tomarFoto(claveRegistro);
    },
    () => mostrarModal("Error", "No se pudo obtener la ubicación.")
  );
}

function tomarFoto(claveRegistro) {
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

        enviarDatos(claveRegistro);
      }, 2000);
    })
    .catch(() => mostrarModal("Error", "Error al acceder a la cámara."));
}

function enviarDatos(claveRegistro) {
  let usuario = document.getElementById("usuario").value;

  if (!usuario || !ubicacionActual || !fotoBase64) {
    mostrarModal("Error", "Falta información para registrar.");
    return;
  }

  let url = "https://script.google.com/macros/s/AKfycbxTxjkQ7FN77fE9PdTr-TkiqKFeMPnI5shKjR4ZPYBL3ra10DtWsMAc-ra6dnHvcT-13Q/exec";
  let data = { usuario, etiqueta, ubicacion: ubicacionActual, foto: fotoBase64 };

  fetch(url, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(() => {
      localStorage.setItem(claveRegistro, new Date().toLocaleDateString());
      mostrarModal("Éxito", `${etiqueta} registrada exitosamente.`);
    })
    .catch(() => mostrarModal("Error", "Error al registrar."));
}

function mostrarModal(titulo, mensaje) {
  document.getElementById("modal-titulo").innerText = titulo;
  document.getElementById("modal-mensaje").innerText = mensaje;
  document.getElementById("modal").style.display = "block";
  document.getElementById("overlay").style.display = "block";
}

function cerrarModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("overlay").style.display = "none";
}
