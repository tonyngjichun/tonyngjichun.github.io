---
layout: page
permalink: /publications/
title: publications
description: Please also check my <a href="https://scholar.google.com/citations?user=P4S4IokAAAAJ&hl=en">Google Scholar profile</a> for an up-to-date list.
years: [2021, 2020]
nav: true
---

<div class="publications">

{% for y in page.years %}
  <h2 class="year">{{y}}</h2>
  {% bibliography -f papers -q @*[year={{y}}]* %}
{% endfor %}

</div>
