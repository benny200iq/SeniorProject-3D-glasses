import React, { useEffect, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

const FaceTracking = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(onResults);

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await faceMesh.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, []);

  const onResults = (results) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the video feed
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        // Bounding Box Calculation
        const xs = landmarks.map((lm) => lm.x * canvas.width);
        const ys = landmarks.map((lm) => lm.y * canvas.height);
        const xMin = Math.min(...xs);
        const xMax = Math.max(...xs);
        const yMin = Math.min(...ys);
        const yMax = Math.max(...ys);

        // Draw Bounding Box
        ctx.beginPath();
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 3;
        ctx.rect(xMin, yMin, xMax - xMin, yMax - yMin);
        ctx.stroke();

        // Identify Face Shape
        const faceShape = detectFaceShape(landmarks);
        ctx.fillStyle = "red";
        ctx.font = "16px Arial";
        ctx.fillText(`Face Shape: ${faceShape}`, xMin, yMin - 10);
      }
    }
  };

  const detectFaceShape = (landmarks) => {
    const chin = landmarks[152];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const forehead = landmarks[10];

    const width = Math.abs(rightCheek.x - leftCheek.x);
    const height = Math.abs(chin.y - forehead.y);

    if (width / height > 1.3) return "Round";
    else if (width / height < 0.9) return "Oval";
    else return "Square";
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Face Tracking with Face Shape</h1>
      <div style={styles.videoContainer}>
        <video ref={videoRef} style={{ display: "none" }}></video>
        <canvas ref={canvasRef} width="640" height="480" style={styles.canvas}></canvas>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#f4f4f4",
  },
  title: {
    marginBottom: "20px",
    fontFamily: "Arial, sans-serif",
    fontSize: "24px",
    color: "#333",
  },
  videoContainer: {
    position: "relative",
  },
  canvas: {
    border: "2px solid #000",
    borderRadius: "8px",
  },
};

export default FaceTracking;