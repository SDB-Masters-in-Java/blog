---
layout: default
title: Authors
---
<h1 class="page-heading">{{ page.title }}</h1>

<ul>
  {% for author in site.authors %}
    <li>
      <h3><a href="{{ author.url | relative_url }}">{{ author.name }}</a></h3>
      <h4>{{ author.position }}</h4>
      <p>{{ author.content | markdownify }}</p>
    </li>
  {% endfor %}
</ul>