(() => {
  const canvas = document.getElementById("vortexCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  const slider = document.getElementById("turbulenceSlider");
  const valueEl = document.getElementById("turbulenceValue");
  const planeColorInput = document.getElementById("planeColor");

  const vortices = [];
  const maxVortices = 120;
  let turbulence = 0.25;
  let isDragging = false;
  let lastDrag = null;

  const plane = {
    x: width * 0.5,
    y: height * 0.6,
    vx: 0,
    vy: 0,
    targetX: width * 0.5,
    targetY: height * 0.6
  };

  const trails = [];
  const maxTrail = 120;

  const addVortex = (x, y, strength) => {
    vortices.push({
      x,
      y,
      strength,
      radius: 60 + Math.random() * 60
    });
    if (vortices.length > maxVortices) {
      vortices.shift();
    }
  };

  const velocityAt = (x, y) => {
    let vx = 0;
    let vy = 0;
    for (const v of vortices) {
      const dx = x - v.x;
      const dy = y - v.y;
      const dist2 = dx * dx + dy * dy + 60;
      const factor = v.strength / dist2;
      vx += -dy * factor;
      vy += dx * factor;
    }
    return { vx, vy };
  };

  const drawPlane = () => {
    const color = planeColorInput ? planeColorInput.value : "#f6a149";
    ctx.save();
    ctx.translate(plane.x, plane.y);
    ctx.rotate(Math.atan2(plane.vy, plane.vx));
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, 6);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, -6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawTrails = () => {
    ctx.save();
    ctx.strokeStyle = "rgba(246, 161, 73, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    trails.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
    });
    ctx.stroke();
    ctx.restore();
  };

  const render = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(9, 17, 26, 0.9)";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = "#f6a149";
    vortices.forEach((v) => {
      ctx.beginPath();
      ctx.arc(v.x, v.y, v.radius, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();

    const flow = velocityAt(plane.x, plane.y);
    plane.vx = plane.vx * 0.86 + (plane.targetX - plane.x) * 0.02 + flow.vx * (0.8 + turbulence);
    plane.vy = plane.vy * 0.86 + (plane.targetY - plane.y) * 0.02 + flow.vy * (0.8 + turbulence);
    plane.x += plane.vx;
    plane.y += plane.vy;

    plane.x = Math.max(20, Math.min(width - 20, plane.x));
    plane.y = Math.max(20, Math.min(height - 20, plane.y));

    trails.push({ x: plane.x, y: plane.y });
    if (trails.length > maxTrail) trails.shift();

    drawTrails();
    drawPlane();

    requestAnimationFrame(render);
  };

  const updateTurbulenceLabel = () => {
    if (valueEl) valueEl.textContent = `${Math.round(turbulence * 100)}%`;
  };

  const onPointerMove = (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    const y = ((event.clientY - rect.top) / rect.height) * height;
    plane.targetX = x;
    plane.targetY = y;

    if (isDragging) {
      if (lastDrag) {
        const dx = x - lastDrag.x;
        const dy = y - lastDrag.y;
        const strength = Math.min(120, Math.hypot(dx, dy) * 6);
        addVortex(x, y, strength);
        addVortex(x + 14, y + 8, -strength * 0.7);
      }
      lastDrag = { x, y };
    }
  };

  const onPointerDown = (event) => {
    isDragging = true;
    lastDrag = null;
    onPointerMove(event);
  };

  const onPointerUp = () => {
    isDragging = false;
    lastDrag = null;
  };

  if (slider) {
    slider.addEventListener("input", (event) => {
      turbulence = parseFloat(event.target.value) / 100;
      updateTurbulenceLabel();
    });
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerUp);
  canvas.addEventListener("wheel", (event) => {
    const delta = Math.sign(event.deltaY);
    turbulence = Math.min(1, Math.max(0, turbulence + delta * 0.03));
    if (slider) slider.value = Math.round(turbulence * 100);
    updateTurbulenceLabel();
  }, { passive: true });

  updateTurbulenceLabel();
  render();
})();
