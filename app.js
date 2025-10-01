let video = document.getElementById('video');
let startBtn = document.getElementById('startBtn');
let stopBtn = document.getElementById('stopBtn');
let statusEl = document.getElementById('status');

let capturing = false;
let intervalId;
let logs = [];

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js/models')
]).then(() => {
  statusEl.innerText = "Status: Models loaded. Ready to start.";
});

startBtn.onclick = async () => {
  if (capturing) return;
  let stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  capturing = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  statusEl.innerText = "Status: Capturing emotions...";
  
  intervalId = setInterval(async () => {
    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
    if (detections && detections.expressions) {
      let timestamp = new Date().toISOString();
      let data = { timestamp, ...detections.expressions };
      logs.push(data);
      console.log(data);
    }
  }, 2000);
};

stopBtn.onclick = () => {
  if (!capturing) return;
  clearInterval(intervalId);
  capturing = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  statusEl.innerText = "Status: Capture stopped. Downloading CSV...";

  // Convert logs to CSV
  let csv = "timestamp,happy,sad,angry,surprised,disgusted,fearful,neutral\n";
  logs.forEach(row => {
    csv += `${row.timestamp},${row.happy},${row.sad},${row.angry},${row.surprised},${row.disgusted},${row.fearful},${row.neutral}\n`;
  });

  let blob = new Blob([csv], { type: "text/csv" });
  let url = window.URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.setAttribute("href", url);
  a.setAttribute("download", "emotion_log.csv");
  a.click();
};
