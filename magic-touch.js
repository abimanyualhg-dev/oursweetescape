const video = document.getElementById("webcam");

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: 640,
        height: 480
      },
      audio: false
    });

    video.srcObject = stream;

    console.log("Camera started.");
  } catch (error) {
    console.error("Failed to access camera:", error);
  }
}

startCamera();
