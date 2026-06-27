const video = document.getElementById("webcam");

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    video.srcObject = stream;
  } catch (err) {
    console.error("Camera error:", err);
  }
}

startCamera();
