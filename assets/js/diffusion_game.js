(() => {
  const canvas = document.getElementById("diffusionCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  const slider = document.getElementById("noiseSlider");
  const noiseValue = document.getElementById("noiseValue");
  const imageUpload = document.getElementById("imageUpload");
  const resetNoise = document.getElementById("resetNoise");

  const baseCanvas = document.createElement("canvas");
  baseCanvas.width = width;
  baseCanvas.height = height;
  const baseCtx = baseCanvas.getContext("2d");

  const noiseCanvas = document.createElement("canvas");
  noiseCanvas.width = width;
  noiseCanvas.height = height;
  const noiseCtx = noiseCanvas.getContext("2d");

  const noisyCanvas = document.createElement("canvas");
  noisyCanvas.width = width;
  noisyCanvas.height = height;
  const noisyCtx = noisyCanvas.getContext("2d");

  const denoiseCanvas = document.createElement("canvas");
  denoiseCanvas.width = width;
  denoiseCanvas.height = height;
  const denoiseCtx = denoiseCanvas.getContext("2d");
  const progressCanvas = document.createElement("canvas");
  progressCanvas.width = width;
  progressCanvas.height = height;
  const progressCtx = progressCanvas.getContext("2d");

  let noiseLevel = 0.35;
  let targetNoise = 0.35;
  let pointer = {
    x: width / 2,
    y: height / 2,
    targetX: width / 2,
    targetY: height / 2,
    vx: 0,
    vy: 0,
    active: false,
    down: false,
    denoise: 0
  };
  let smoothSpeed = 0;
  let dir = { x: 1, y: 0 };
  let smoothStretch = 1;
  let smoothAccel = { x: 0, y: 0 };
  let prevVel = { x: 0, y: 0 };
  let lastTarget = { x: width / 2, y: height / 2 };
  let brushProgress = 0;

  const generateBase = () => {
    const gradient = baseCtx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#1a3557");
    gradient.addColorStop(0.4, "#f08a24");
    gradient.addColorStop(0.8, "#f4d09c");
    gradient.addColorStop(1, "#f7f2e9");
    baseCtx.fillStyle = gradient;
    baseCtx.fillRect(0, 0, width, height);

    for (let i = 0; i < 120; i += 1) {
      baseCtx.beginPath();
      const radius = 40 + Math.random() * 120;
      const x = Math.random() * width;
      const y = Math.random() * height;
      baseCtx.fillStyle = `rgba(11, 27, 43, ${0.05 + Math.random() * 0.15})`;
      baseCtx.ellipse(x, y, radius, radius * (0.5 + Math.random()), Math.random(), 0, Math.PI * 2);
      baseCtx.fill();
    }
    progressCtx.clearRect(0, 0, width, height);
  };

  const drawUploadedImage = (img) => {
    const canvasRatio = width / height;
    const imgRatio = img.width / img.height;
    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > canvasRatio) {
      drawWidth = height * imgRatio;
      offsetX = (width - drawWidth) / 2;
    } else {
      drawHeight = width / imgRatio;
      offsetY = (height - drawHeight) / 2;
    }

    baseCtx.clearRect(0, 0, width, height);
    baseCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    progressCtx.clearRect(0, 0, width, height);
  };

  const generateNoise = () => {
    const imageData = noiseCtx.createImageData(width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.floor(Math.random() * 255);
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
    noiseCtx.putImageData(imageData, 0, 0);
  };

  let noiseFrame = 0;
  const render = () => {
    noiseLevel += (targetNoise - noiseLevel) * 0.06;

    // Keep brush centered exactly on cursor.
    pointer.x = pointer.targetX;
    pointer.y = pointer.targetY;

    const dx = pointer.targetX - lastTarget.x;
    const dy = pointer.targetY - lastTarget.y;
    lastTarget = { x: pointer.targetX, y: pointer.targetY };
    pointer.vx = pointer.vx * 0.5 + dx * 0.5;
    pointer.vy = pointer.vy * 0.5 + dy * 0.5;

    const speed = Math.min(20, Math.hypot(pointer.vx, pointer.vy));
    smoothSpeed = smoothSpeed * 0.9 + speed * 0.1;

    if (speed > 0.5) {
      const nx = pointer.vx / speed;
      const ny = pointer.vy / speed;
      dir.x = dir.x * 0.85 + nx * 0.15;
      dir.y = dir.y * 0.85 + ny * 0.15;
      const dlen = Math.hypot(dir.x, dir.y) || 1;
      dir.x /= dlen;
      dir.y /= dlen;
    }
    const ax = pointer.vx - prevVel.x;
    const ay = pointer.vy - prevVel.y;
    prevVel = { x: pointer.vx, y: pointer.vy };
    smoothAccel.x = smoothAccel.x * 0.8 + ax * 0.2;
    smoothAccel.y = smoothAccel.y * 0.8 + ay * 0.2;

    if (pointer.down) {
      pointer.denoise = Math.min(1, pointer.denoise + 0.02);
    } else {
      pointer.denoise = Math.max(0, pointer.denoise - 0.03);
    }

    ctx.clearRect(0, 0, width, height);
    noiseFrame = (noiseFrame + 1) % 3;
    if (noiseFrame === 0) {
      generateNoise();
    }

    noisyCtx.clearRect(0, 0, width, height);
    noisyCtx.drawImage(baseCanvas, 0, 0);
    noisyCtx.globalAlpha = noiseLevel;
    noisyCtx.drawImage(noiseCanvas, 0, 0);
    noisyCtx.globalAlpha = 1;

    let brushPath = null;
    let brushRadius = 0;
    let brushAngle = 0;

    if (pointer.down || pointer.denoise > 0.01) {
      brushRadius = (42 + smoothSpeed * 0.08) * 1.5 * 1.2;
      const targetStretch = 1 + Math.min(0.18, smoothSpeed * 0.015);
      smoothStretch = smoothStretch * 0.97 + targetStretch * 0.03;
      const stretch = smoothStretch;
      brushAngle = Math.atan2(dir.y, dir.x);
      const accelAngle = Math.atan2(smoothAccel.y, smoothAccel.x);
      const accelMag = Math.min(6, Math.hypot(smoothAccel.x, smoothAccel.y));

      const points = 36;
      const velBias = Math.min(0.28, smoothSpeed * 0.025);
      const accBias = Math.min(0.24, accelMag * 0.04);
      const turnSign = Math.sign(dir.x * smoothAccel.y - dir.y * smoothAccel.x) || 1;
      const sideBias = Math.min(0.14, accelMag * 0.025) * turnSign;
      const major = brushRadius * stretch;
      const minor = brushRadius * (1 - Math.min(0.18, smoothSpeed * 0.015));

      const path = new Path2D();
      for (let i = 0; i <= points; i += 1) {
        const t = (i / points) * Math.PI * 2;
        const r =
          (major * minor) /
          Math.sqrt((minor * Math.cos(t)) ** 2 + (major * Math.sin(t)) ** 2);
        const accelPhase = accelAngle - brushAngle;
        const forward = Math.max(0, Math.cos(t));
        const backward = Math.max(0, -Math.cos(t));
        const accForward = Math.max(0, Math.cos(t - accelPhase));
        const bumpVel = velBias * Math.pow(forward, 2.2) - velBias * 0.35 * Math.pow(backward, 1.6);
        const bumpAcc = accBias * Math.pow(accForward, 2.0);
        const bumpSide = sideBias * Math.sin(t);
        const finalR = r * (1 + bumpVel + bumpAcc + bumpSide);
        const localX = Math.cos(t) * finalR;
        const localY = Math.sin(t) * finalR;
        const px = pointer.x + localX * Math.cos(brushAngle) - localY * Math.sin(brushAngle);
        const py = pointer.y + localX * Math.sin(brushAngle) + localY * Math.cos(brushAngle);
        if (i === 0) {
          path.moveTo(px, py);
        } else {
          path.lineTo(px, py);
        }
      }
      path.closePath();
      brushPath = path;
    }

    if (pointer.down && brushPath) {
      progressCtx.save();
      progressCtx.globalAlpha = 0.08;
      progressCtx.fillStyle = "rgba(255, 255, 255, 1)";
      progressCtx.fill(brushPath);
      progressCtx.restore();
    }

    if (brushPath) {
      const boxSize = Math.max(10, Math.floor(brushRadius * 1.8));
      const bx = Math.max(0, Math.floor(pointer.x - boxSize / 2));
      const by = Math.max(0, Math.floor(pointer.y - boxSize / 2));
      const bw = Math.min(width - bx, boxSize);
      const bh = Math.min(height - by, boxSize);
      if (bw > 0 && bh > 0) {
        const data = progressCtx.getImageData(bx, by, bw, bh).data;
        let sum = 0;
        for (let i = 3; i < data.length; i += 4) {
          sum += data[i];
        }
        brushProgress = sum / (255 * (data.length / 4));
      } else {
        brushProgress = 0;
      }
    } else {
      brushProgress = 0;
    }

    denoiseCtx.clearRect(0, 0, width, height);
    denoiseCtx.drawImage(baseCanvas, 0, 0);
    denoiseCtx.globalCompositeOperation = "destination-in";
    denoiseCtx.drawImage(progressCanvas, 0, 0);
    denoiseCtx.globalCompositeOperation = "source-over";

    ctx.drawImage(noisyCanvas, 0, 0);
    ctx.drawImage(denoiseCanvas, 0, 0);

    if (pointer.active) {
      const prompt = "Click and hold to clean";
      ctx.save();
      ctx.font = "600 16px 'Space Grotesk', sans-serif";
      ctx.fillStyle = "rgba(244, 239, 231, 0.9)";
      ctx.strokeStyle = "rgba(9, 17, 26, 0.6)";
      ctx.lineWidth = 3;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const textX = Math.min(width - 240, pointer.x + 18);
      const textY = Math.max(24, pointer.y - 18);
      ctx.strokeText(prompt, textX, textY);
      ctx.fillText(prompt, textX, textY);
      const barWidth = 180;
      const barHeight = 6;
      const barX = textX;
      const barY = textY + 16;
      ctx.fillStyle = "rgba(9, 17, 26, 0.5)";
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = "rgba(246, 161, 73, 0.9)";
      ctx.fillRect(barX, barY, barWidth * brushProgress, barHeight);
      ctx.restore();
    }

    if (brushPath) {
      const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, brushRadius * 1.1);
      glow.addColorStop(0, `rgba(246, 161, 73, ${0.2 + pointer.denoise * 0.35})`);
      glow.addColorStop(1, "rgba(246, 161, 73, 0)");
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, brushRadius * 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    requestAnimationFrame(render);
  };

  const updateNoiseLabel = () => {
    noiseValue.textContent = `${Math.round(targetNoise * 100)}%`;
  };

  const handleScroll = (event) => {
    const delta = Math.sign(event.deltaY);
    targetNoise = Math.min(1, Math.max(0, targetNoise + delta * 0.03));
    if (slider) slider.value = Math.round(targetNoise * 100);
    updateNoiseLabel();
  };

  const handlePointerMove = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.targetX = ((event.clientX - rect.left) / rect.width) * width;
    pointer.targetY = ((event.clientY - rect.top) / rect.height) * height;
    pointer.active = true;
  };

  const handlePointerLeave = () => {
    pointer.active = false;
    pointer.down = false;
  };

  if (slider) {
    slider.addEventListener("input", (event) => {
      targetNoise = parseFloat(event.target.value) / 100;
      updateNoiseLabel();
    });
  }

  if (imageUpload) {
    imageUpload.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const img = new Image();
      img.onload = () => {
        drawUploadedImage(img);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  const handlePointerDown = (event) => {
    handlePointerMove(event);
    pointer.down = true;
    canvas.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event) => {
    pointer.down = false;
    canvas.releasePointerCapture(event.pointerId);
  };

  if (resetNoise) {
    resetNoise.addEventListener("click", () => {
      progressCtx.clearRect(0, 0, width, height);
      pointer.denoise = 0;
    });
  }

  canvas.addEventListener("wheel", handleScroll, { passive: true });
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerleave", handlePointerLeave);
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointerup", handlePointerUp);

  generateBase();
  generateNoise();
  updateNoiseLabel();
  render();
})();
