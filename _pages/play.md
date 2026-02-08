---
layout: page
title: Diffusion Toy
permalink: /play/
description: A playful diffusion-inspired canvas that denoises on hover and re-noises on scroll.
nav: false
---

<section class="game-wrapper">
  <h2>Diffusion Toy</h2>
  <p>
    Scroll to add noise. Click and hold to locally denoise with an elastic brush. Use the slider on mobile to control the noise level.
  </p>
  <canvas id="diffusionCanvas" class="game-canvas" width="960" height="540"></canvas>
  <div class="game-controls">
    <div class="game-control">
      <label for="noiseSlider">Noise level</label>
    </div>
    <div class="game-control game-control-slider">
      <input id="noiseSlider" class="game-slider" type="range" min="0" max="100" value="35">
    </div>
    <div class="game-control">
      <span id="noiseValue">35%</span>
    </div>
    <div class="game-control game-control-upload">
      <label for="imageUpload">Upload image</label>
      <input id="imageUpload" type="file" accept="image/*">
    </div>
  </div>
</section>

<script src="{{ '/assets/js/diffusion_game.js' | relative_url }}"></script>
