---
layout: page
title: Wake Vortex
permalink: /wake-vortex/
description: Sketch vortices and keep the paper plane stable through turbulent air.
nav: false
---

<section class="game-wrapper">
  <h2>Wake Vortex</h2>
  <p>
    Drag to paint wake vortices. Move your mouse to guide the paper plane. Scroll adds more turbulence.
  </p>
  <canvas id="vortexCanvas" class="game-canvas" width="960" height="540"></canvas>
  <div class="game-controls">
    <div class="game-control">
      <label for="turbulenceSlider">Turbulence</label>
    </div>
    <div class="game-control game-control-slider">
      <input id="turbulenceSlider" class="game-slider" type="range" min="0" max="100" value="25">
    </div>
    <div class="game-control">
      <span id="turbulenceValue">25%</span>
    </div>
    <div class="game-control game-control-upload">
      <label for="planeColor">Plane color</label>
      <input id="planeColor" type="color" value="#f6a149">
    </div>
  </div>
</section>

<script src="{{ '/assets/js/wake_vortex.js' | relative_url }}"></script>
