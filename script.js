let ubicacionActual = "";
let fotoBase64 = "";
let etiqueta = "";

function mostrarPopup(mensaje) {
    let popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.backgroundColor = "white";
    popup.style.padding = "20px";
    popup.style.border = "2px solid black";
    popup.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    popup.style.zIndex = "1000";
    popup.innerHTML = `<p>${mensaje}</p><button onclick="this.parentNode.remove()">Cerrar</button>`;
    document.body.appendChild(popup);
}

function marcarAsistencia(entrada) {
    etiqueta = entrada ? "Entrada" : "Salida";

    let usuario = document.getElementById("usuario").value;
    if (!usuario) {
        mostrarPopup("Debe ingresar un nombre.");
        return;
    }

    let hoy = new Date().toLocaleDateString(); // Obtiene la fecha actual en formato local
    let registroUsuario = JSON.parse(localStorage.getItem(`registro_${usuario}`)) || {};

    if (registroUsuario[etiqueta] === hoy) {
        mostrarPopup(`Ya ha registrado su ${etiqueta} el día de hoy.`);
        return;
    }

    navigator.geolocation.getCurrentPosition(pos => {
        ubicacionActual = `${pos.coords.latitude}, ${pos.coords.longitude}`;
        tomarFoto(usuario, hoy);
    }, () => {
        mostrarPopup("No se pudo obtener la ubicación.");
    });
}

function tomarFoto(usuario, hoy) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
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
                video.srcObject.getTracks().forEach(track => track.stop());
                enviarDatos(usuario, hoy);
            }, 2000);
        })
        .catch(() => mostrarPopup("Error al acceder a la cámara."));
}

function enviarDatos(usuario, hoy) {
    if (!usuario || !ubicacionActual || !fotoBase64) {
        mostrarPopup("Error: Falta información para registrar.");
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
        let registroUsuario = JSON.parse(localStorage.getItem(`registro_${usuario}`)) || {};
        registroUsuario[etiqueta] = hoy;
        localStorage.setItem(`registro_${usuario}`, JSON.stringify(registroUsuario));
        mostrarPopup(`${etiqueta} registrada exitosamente.`);
    })
    .catch(() => mostrarPopup("Error al registrar"));
}
