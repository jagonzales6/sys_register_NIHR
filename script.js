let ubicacionActual = "";
let fotoBase64 = "";
let etiqueta = "";

function marcarAsistencia(entrada) {
    etiqueta = entrada ? "Entrada" : "Salida";

    let usuario = document.getElementById("usuario").value;
    if (!usuario) {
        alert("Debe ingresar un nombre.");
        return;
    }

    let hoy = new Date().toLocaleDateString(); // Obtiene la fecha actual en formato local
    let ultimoRegistro = localStorage.getItem(`registro_${usuario}`);

    if (ultimoRegistro === hoy) {
        alert("Ya has registrado tu asistencia hoy.");
        return;
    }

    navigator.geolocation.getCurrentPosition(pos => {
        ubicacionActual = `${pos.coords.latitude}, ${pos.coords.longitude}`;
        tomarFoto();
    }, () => {
        alert("No se pudo obtener la ubicación.");
    });
}

function tomarFoto() {
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
                
                enviarDatos(); // Envía los datos después de capturar la foto
            }, 2000);
        })
        .catch(() => alert("Error al acceder a la cámara."));
}

function enviarDatos() {
    let usuario = document.getElementById("usuario").value;
    if (!usuario || !ubicacionActual || !fotoBase64) {
        alert("Error: Falta información para registrar.");
        return;
    }

    let url = "https://script.google.com/macros/s/AKfycbxTxjkQ7FN77fE9PdTr-TkiqKFeMPnI5shKjR4ZPYBL3ra10DtWsMAc-ra6dnHvcT-13Q/exec"; // Reemplázalo con la URL de tu Apps Script
    let data = { usuario, etiqueta, ubicacion: ubicacionActual, foto: fotoBase64 };

    fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(() => {
        localStorage.setItem(`registro_${usuario}`, new Date().toLocaleDateString()); // Guarda la fecha del registro
        alert(etiqueta + " registrada exitosamente");
    })
    .catch(() => alert("Error al registrar"));
}

