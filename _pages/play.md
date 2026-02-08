---
layout: page
title: play
permalink: /play/
description: A playful diffusion-inspired canvas that denoises on hover and re-noises on scroll.
nav: true
nav_order: 4
---

<section class="game-wrapper">
  <h2>Diffusion Toy</h2>
  <p>
    Scroll to add noise. Hover to locally denoise. Use the slider on mobile to control the noise level.
  </p>
  <canvas id="diffusionCanvas" class="game-canvas" width="960" height="540"></canvas>
  <div class="game-controls">
    <label for="noiseSlider">Noise level</label>
    <input id="noiseSlider" class="game-slider" type="range" min="0" max="100" value="35">
    <span id="noiseValue">35%</span>
  </div>
</section>

<script src="{{ '/assets/js/diffusion_game.js' | relative_url }}"></script>
