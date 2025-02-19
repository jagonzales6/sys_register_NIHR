let ubicacionActual = "";
let fotoBase64 = "";
let etiqueta = "";

function marcarAsistencia(entrada) {
    etiqueta = entrada ? "Entrada" : "Salida";

    if (!document.getElementById("usuario").value) {
        alert("Debe ingresar un nombre.");
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

    let url = "https://script.google.com/macros/s/AKfycbw0bX2B9YIUVsifqpoDF9c1Ym8U33v_vGXyIXAQIEmbNwTDlSaQ-bNM4Li-Yu1jDh3s7A/exec"; // Reemplázalo con la URL de tu Apps Script
    let data = { usuario, etiqueta, ubicacion: ubicacionActual, foto: fotoBase64 };

    fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(() => alert(etiqueta + " registrada exitosamente"))
    .catch(() => alert("Error al registrar"));
}
