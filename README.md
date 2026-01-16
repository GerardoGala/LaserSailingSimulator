# ⛵ ILCA / Laser Sailing Simulator

A web-based sailing simulation focused on the **2026 ILCA World Championships** in Dún Laoghaire, Ireland. This simulator combines real-world physics, racing rules, and live weather data.

## 🔗 Live Demo
[Play the Simulator Here](https://gerardogala.github.io/LaserSailingSimulator/)

## 🌟 Key Features
* **Live Weather Integration:** Fetches real-time wind conditions from Dublin Bay via API.
* **Pre-Race Tuning:** A 3-minute countdown to adjust your **Outhaul, Cunningham, and Boom Vang**.
* **Physics-Based Modeling:** Boat speed is determined by sail trim, heading, and polar diagrams.
* **RRS Enforcement:** Implements World Sailing Racing Rules of Sailing with automatic scoring penalties.
* **Global Leaderboard:** Compete for the top 10 fastest times.

## 🎮 How to Play
1.  **The Start:** Once you click "Start," you have 3 minutes to tune your boat for the current wind.
2.  **Tuning:** * **Outhaul:** Adjust for sail depth (Camber).
    * **Vang:** Control the leech and mast bend.
    * **Downhaul:** Move the draft forward and depower the top of the sail.
3.  **The Race:** Round all marks to **Port** and finish between the RC boat and the pin.
4.  **Penalties:** Touching marks or failing to restart after an OCS (Over Early) will add time to your score.

## 🛠️ Technical Details
* **Engine:** Custom JavaScript with [Anime.js](https://animejs.com/) for animations.
* **Collision Detection:** Powered by [SAT.js](https://github.com/jriecken/sat-js).
* **Data:** Polar diagrams based on ILCA class performance standards.

---
*Created by Gerardo — 2026 ILCA World Championship Edition.*