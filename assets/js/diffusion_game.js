(() => {
  const canvas = document.getElementById("diffusionCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  const slider = document.getElementById("noiseSlider");
  const noiseValue = document.getElementById("noiseValue");
  const imageUpload = document.getElementById("imageUpload");

  const baseCanvas = document.createElement("canvas");
  baseCanvas.width = width;
  baseCanvas.height = height;
  const baseCtx = baseCanvas.getContext("2d");

  const noiseCanvas = document.createElement("canvas");
  noiseCanvas.width = width;
  noiseCanvas.height = height;
  const noiseCtx = noiseCanvas.getContext("2d");

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
  let wobblePhase = 0;
  let lastAngle = 0;

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

  const render = () => {
    noiseLevel += (targetNoise - noiseLevel) * 0.06;

    const dx = pointer.targetX - pointer.x;
    const dy = pointer.targetY - pointer.y;
    pointer.vx = pointer.vx * 0.75 + dx * 0.18;
    pointer.vy = pointer.vy * 0.75 + dy * 0.18;
    pointer.x += pointer.vx;
    pointer.y += pointer.vy;

    const speed = Math.min(20, Math.hypot(pointer.vx, pointer.vy));
    const wobbleSpeed = speed < 1 ? 0 : 0.002;
    wobblePhase += wobbleSpeed;
    if (speed >= 1) {
      lastAngle = Math.atan2(pointer.vy, pointer.vx);
    }

    if (pointer.down) {
      pointer.denoise = Math.min(1, pointer.denoise + 0.02);
    } else {
      pointer.denoise = Math.max(0, pointer.denoise - 0.03);
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(baseCanvas, 0, 0);
    ctx.globalAlpha = noiseLevel;
    ctx.drawImage(noiseCanvas, 0, 0);
    ctx.globalAlpha = 1;

    if (pointer.active) {
      const prompt = "Click and hold to denoise";
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
      ctx.restore();
    }

    if (pointer.down || pointer.denoise > 0.01) {
      const baseRadius = 80 + speed * 0.5;
      const wobble = speed < 1 ? 0 : Math.min(0.04, 0.006 + speed * 0.002);
      const points = 24;
      const angle = speed < 1 ? lastAngle : Math.atan2(pointer.vy, pointer.vx);
      const stretch = 1 + Math.min(0.18, speed * 0.018);

      const pts = [];
      for (let i = 0; i < points; i += 1) {
        const t = (i / points) * Math.PI * 2;
        const localStretch = 1 + stretch * Math.cos(t - angle) * 0.6;
        const r = baseRadius * localStretch;
        const wob = 1 + wobble * Math.sin(t * 2 + wobblePhase);
        const finalR = r * wob;
        pts.push({
          x: pointer.x + Math.cos(t) * finalR,
          y: pointer.y + Math.sin(t) * finalR
        });
      }

      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < pts.length; i += 1) {
        const p0 = pts[i];
        const p1 = pts[(i + 1) % pts.length];
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        if (i === 0) {
          ctx.moveTo(midX, midY);
        } else {
          ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
        }
      }
      ctx.closePath();
      ctx.clip();
      ctx.globalAlpha = pointer.denoise;
      ctx.drawImage(baseCanvas, 0, 0);
      ctx.globalAlpha = 1;
      ctx.restore();

      const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, baseRadius * 1.2);
      glow.addColorStop(0, `rgba(246, 161, 73, ${0.2 + pointer.denoise * 0.35})`);
      glow.addColorStop(1, "rgba(246, 161, 73, 0)");
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, baseRadius * 1.2, 0, Math.PI * 2);
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
