(() => {
  const canvas = document.getElementById("diffusionCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  const slider = document.getElementById("noiseSlider");
  const noiseValue = document.getElementById("noiseValue");

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
  let hover = { x: -9999, y: -9999, active: false };

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
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(baseCanvas, 0, 0);

    ctx.globalAlpha = noiseLevel;
    ctx.drawImage(noiseCanvas, 0, 0);
    ctx.globalAlpha = 1;

    if (hover.active) {
      const radius = 120;
      const gradient = ctx.createRadialGradient(hover.x, hover.y, 0, hover.x, hover.y, radius);
      gradient.addColorStop(0, "rgba(247, 242, 233, 0.95)");
      gradient.addColorStop(1, "rgba(247, 242, 233, 0)");
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(hover.x, hover.y, radius, 0, Math.PI * 2);
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
    hover.x = ((event.clientX - rect.left) / rect.width) * width;
    hover.y = ((event.clientY - rect.top) / rect.height) * height;
    hover.active = true;
  };

  const handlePointerLeave = () => {
    hover.active = false;
  };

  if (slider) {
    slider.addEventListener("input", (event) => {
      targetNoise = parseFloat(event.target.value) / 100;
      updateNoiseLabel();
    });
  }

  canvas.addEventListener("wheel", handleScroll, { passive: true });
  canvas.addEventListener("mousemove", handlePointerMove);
  canvas.addEventListener("mouseleave", handlePointerLeave);
  canvas.addEventListener("touchmove", (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    handlePointerMove({ clientX: touch.clientX, clientY: touch.clientY });
  }, { passive: true });
  canvas.addEventListener("touchend", handlePointerLeave);

  generateBase();
  generateNoise();
  updateNoiseLabel();
  render();
})();
