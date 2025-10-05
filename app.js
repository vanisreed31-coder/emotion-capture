// Select HTML elements
let video = document.getElementById('video');
let startBtn = document.getElementById('startBtn');
let stopBtn = document.getElementById('stopBtn');
let statusEl = document.getElementById('status');

let capturing = false;
let intervalId;
let logs = [];

// Load face-api.js models from CDN
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js/models')
]).then(() => {
  statusEl.innerText = "✅ Models loaded. Ready to start.";
  console.log("Models loaded.");
});

// Start button click
startBtn.onclick = async () => {
  if (capturing) return;

  try {
    // Access webcam
    let stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play(); // Important to start the video

    capturing = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusEl.innerText = "📷 Capturing emotions...";
    console.log("Camera started.");

    // Detect emotions every 2 seconds
    intervalId = setInterval(async () => {
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections && detections.expressions) {
        let timestamp = new Date().toISOString();
        let data = { timestamp, ...detections.expressions };
        logs.push(data);
        console.log(data);
      }
    }, 2000);

  } catch (err) {
    console.error("❌ Error accessing webcam:", err);
    alert("Unable to access camera. Please check browser permissions and reload.");
  }
};

// Stop button click
stopBtn.onclick = () => {
  if (!capturing) return;

  clearInterval(intervalId);
  capturing = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  statusEl.innerText = "🛑 Capture stopped. Downloading CSV...";
  console.log("Capture stopped.");

  // Convert logs to CSV
  let csv = "timestamp,happy,sad,angry,surprised,disgusted,fearful,neutral\n";
  logs.forEach(row => {
    csv += `${row.timestamp},${row.happy},${row.sad},${row.angry},${row.surprised},${row.disgusted},${row.fearful},${row.neutral}\n`;
  });

  // Download CSV
  let blob = new Blob([csv], { type: "text/csv" });
  let url = window.URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.setAttribute("href", url);
  a.setAttribute("download", "emotion_log.csv");
  a.click();
};
