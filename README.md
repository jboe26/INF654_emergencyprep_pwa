# Emergency Prep App

A responsive, modular emergency toolkit built with [Materialize CSS](https://materializecss.com/) to help families prepare, pack, and stay resilient during evacuations or crises. Designed with clarity, flexibility, and real-world usability in mind.

---

## Purpose

This app helps families like ours organize essential items across multiple vehicles and caregiving roles. It supports:

- Split responsibilities between caregivers
- Checklist tracking for comfort, safety, and survival
- Mobile-friendly layout for quick access during emergencies

---

## Features

- Responsive grid layout using Materialize’s `row` and `col` system
- Cards for key categories (e.g., Gracie’s Essentials, Car Kits)
- Toggleable checklists with interactive checkboxes
- Split inventory by vehicle (Kia & Hyundai)
- Static essentials list + expandable shared tips
- Placeholder image for visual context
- Installable via `manifest.json`
- Offline access via `service-worker.js`

---

## Structure

```html
<div class="container">
  <div class="row">
    <!-- Card: Gracie’s Essentials -->
    <!-- Card: Car Kits -->
  </div>

  <!-- Shared Collapsible: Grab-and-Go Checklist, Offline Tips -->
</div>
PWA Integration This prototype includes foundational Progressive Web App
features: Installable: Users can add the app to their home screen via
manifest.json Offline Support: Core assets are cached using service-worker.js
Responsive Design: Built with Materialize CSS for seamless use across devices
Modular Architecture: Easily expandable to include Firebase, local storage, or
dynamic data How to View Live Demo: https://inf654mobilewebclass.netlify.app/ Or
clone the repo and open index.html in your browser
```
