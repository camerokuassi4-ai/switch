const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'assets/images/mockups');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function renderFrame() {
  console.log('🎨 Rendu du vrai cadre de smartphone ultra-réaliste en PNG transparent haute fidélité...');
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });
  const page = await browser.newPage();

  // Canvas dimensions: 1000 x 2050 (High resolution matching iPhone 15 Pro ratio)
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
        canvas { display: block; }
      </style>
    </head>
    <body>
      <canvas id="c" width="1000" height="2050"></canvas>
      <script>
        const canvas = document.getElementById('c');
        const ctx = canvas.getContext('2d');

        const W = 1000;
        const H = 2050;

        // Device geometry
        const phoneX = 50;
        const phoneY = 40;
        const phoneW = 900;
        const phoneH = 1970;
        const radius = 135; // corner radius of outer chassis

        // Helper for rounded rectangle
        function roundRect(ctx, x, y, w, h, r) {
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.arcTo(x + w, y, x + w, y + h, r);
          ctx.arcTo(x + w, y + h, x, y + h, r);
          ctx.arcTo(x, y + h, x, y, r);
          ctx.arcTo(x, y, x + w, y, r);
          ctx.closePath();
        }

        // 1. DROP SHADOW (Deep physical 3D shadow)
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = 45;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 25;
        roundRect(ctx, phoneX, phoneY, phoneW, phoneH, radius);
        ctx.fillStyle = '#0a0a0c';
        ctx.fill();
        ctx.restore();

        // 2. PHYSICAL BUTTONS (Sides)
        // Action Button (Left, top)
        ctx.save();
        ctx.fillStyle = '#1c1c1e';
        roundRect(ctx, phoneX - 10, phoneY + 280, 11, 75, 5);
        ctx.fill();
        // Specular highlight on Action button
        ctx.fillStyle = '#444448';
        ctx.fillRect(phoneX - 10, phoneY + 280, 11, 3);
        ctx.restore();

        // Volume Up (Left, mid-top)
        ctx.save();
        ctx.fillStyle = '#1c1c1e';
        roundRect(ctx, phoneX - 10, phoneY + 390, 11, 130, 5);
        ctx.fill();
        ctx.fillStyle = '#444448';
        ctx.fillRect(phoneX - 10, phoneY + 390, 11, 3);
        ctx.restore();

        // Volume Down (Left, mid)
        ctx.save();
        ctx.fillStyle = '#1c1c1e';
        roundRect(ctx, phoneX - 10, phoneY + 550, 11, 130, 5);
        ctx.fill();
        ctx.fillStyle = '#444448';
        ctx.fillRect(phoneX - 10, phoneY + 550, 11, 3);
        ctx.restore();

        // Power / Side Button (Right)
        ctx.save();
        ctx.fillStyle = '#1c1c1e';
        roundRect(ctx, phoneX + phoneW - 1, phoneY + 410, 11, 200, 5);
        ctx.fill();
        ctx.fillStyle = '#444448';
        ctx.fillRect(phoneX + phoneW - 1, phoneY + 410, 11, 3);
        ctx.restore();

        // 3. TITANIUM CHASSIS OUTER RIM (Realistic brushed titanium gradient)
        const titanGrad = ctx.createLinearGradient(phoneX, phoneY, phoneX + phoneW, phoneY + phoneH);
        titanGrad.addColorStop(0.00, '#48484e'); // Light metallic reflection
        titanGrad.addColorStop(0.15, '#28282c');
        titanGrad.addColorStop(0.35, '#1e1e22');
        titanGrad.addColorStop(0.50, '#38383e'); // Subtle specular gleam
        titanGrad.addColorStop(0.70, '#1a1a1c');
        titanGrad.addColorStop(0.85, '#2c2c30');
        titanGrad.addColorStop(1.00, '#424248');

        roundRect(ctx, phoneX, phoneY, phoneW, phoneH, radius);
        ctx.fillStyle = titanGrad;
        ctx.fill();

        // Antenna bands
        ctx.fillStyle = '#111113';
        ctx.fillRect(phoneX - 2, phoneY + 230, 10, 8); // Top-left
        ctx.fillRect(phoneX + phoneW - 8, phoneY + 230, 10, 8); // Top-right
        ctx.fillRect(phoneX - 2, phoneY + phoneH - 230, 10, 8); // Bottom-left
        ctx.fillRect(phoneX + phoneW - 8, phoneY + phoneH - 230, 10, 8); // Bottom-right

        // Chamfered metal edge highlight
        roundRect(ctx, phoneX + 3, phoneY + 3, phoneW - 6, phoneH - 6, radius - 2);
        ctx.lineWidth = 2.5;
        const chamferGrad = ctx.createLinearGradient(phoneX, phoneY, phoneX, phoneY + phoneH);
        chamferGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        chamferGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.1)');
        chamferGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.05)');
        chamferGrad.addColorStop(1, 'rgba(255, 255, 255, 0.25)');
        ctx.strokeStyle = chamferGrad;
        ctx.stroke();

        // 4. BLACK DISPLAY BEZEL (OLED Border)
        const bezelInset = 18; // thickness of black bezel
        const screenX = phoneX + bezelInset;
        const screenY = phoneY + bezelInset;
        const screenW = phoneW - (bezelInset * 2);
        const screenH = phoneH - (bezelInset * 2);
        const screenRadius = radius - 16;

        roundRect(ctx, screenX, screenY, screenW, screenH, screenRadius);
        ctx.fillStyle = '#050507';
        ctx.fill();

        // 5. EARPIECE SPEAKER SLIT (Ultra-thin micro speaker at top)
        ctx.save();
        ctx.fillStyle = '#151518';
        roundRect(ctx, W / 2 - 45, phoneY + 8, 90, 5, 2.5);
        ctx.fill();
        ctx.strokeStyle = '#222226';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // 6. CUT OUT THE SCREEN AREA (MAKE TRANSPARENT FOR APP CONTENT)
        // Screen viewport bounds inside bezel:
        const innerInset = 28; // gives true edge-to-edge modern OLED border
        const innerX = phoneX + innerInset;
        const innerY = phoneY + innerInset;
        const innerW = phoneW - (innerInset * 2);
        const innerH = phoneH - (innerInset * 2);
        const innerRadius = radius - 26;

        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        roundRect(ctx, innerX, innerY, innerW, innerH, innerRadius);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.restore();

        // 7. DYNAMIC ISLAND (Floats over the top of the transparent screen)
        ctx.save();
        const diW = 240;
        const diH = 68;
        const diX = (W - diW) / 2;
        const diY = innerY + 18;
        const diRadius = 34;

        // Island body (pure black)
        roundRect(ctx, diX, diY, diW, diH, diRadius);
        ctx.fillStyle = '#000000';
        ctx.fill();

        // Island border subtle depth
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();

        // Camera lens (right side of island)
        const camX = diX + diW - 55;
        const camY = diY + diH / 2;
        ctx.beginPath();
        ctx.arc(camX, camY, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#0d0d12';
        ctx.fill();

        // Optical lens glass reflex (anti-reflective deep blue/purple glow)
        const lensGrad = ctx.createRadialGradient(camX - 3, camY - 3, 2, camX, camY, 14);
        lensGrad.addColorStop(0, '#2a3a5e');
        lensGrad.addColorStop(0.6, '#0b162c');
        lensGrad.addColorStop(1, '#05070c');
        ctx.beginPath();
        ctx.arc(camX, camY, 12, 0, Math.PI * 2);
        ctx.fillStyle = lensGrad;
        ctx.fill();

        // Specular glint on camera lens
        ctx.beginPath();
        ctx.arc(camX - 4, camY - 4, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.fill();

        // Proximity sensor (small dark circle next to lens)
        ctx.beginPath();
        ctx.arc(camX - 35, camY, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#050508';
        ctx.fill();

        ctx.restore();

        // 8. HYPER-REALISTIC DIAGONAL GLASS REFLECTION (Across the screen)
        ctx.save();
        // Clip to inner screen area
        roundRect(ctx, innerX, innerY, innerW, innerH, innerRadius);
        ctx.clip();

        const glassGrad = ctx.createLinearGradient(innerX, innerY, innerX + innerW, innerY + innerH);
        glassGrad.addColorStop(0.00, 'rgba(255, 255, 255, 0.14)');
        glassGrad.addColorStop(0.20, 'rgba(255, 255, 255, 0.04)');
        glassGrad.addColorStop(0.40, 'rgba(255, 255, 255, 0.00)');
        glassGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.00)');
        glassGrad.addColorStop(0.90, 'rgba(255, 255, 255, 0.03)');
        glassGrad.addColorStop(1.00, 'rgba(255, 255, 255, 0.08)');

        ctx.fillStyle = glassGrad;
        ctx.fillRect(innerX, innerY, innerW, innerH);

        // Inner bezel ambient shadow (depth around the screen edge)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.lineWidth = 5;
        roundRect(ctx, innerX, innerY, innerW, innerH, innerRadius);
        ctx.stroke();

        ctx.restore();

        // 9. HOME INDICATOR BAR (Tactile bar at bottom of screen)
        ctx.save();
        const barW = 280;
        const barH = 9;
        const barX = (W - barW) / 2;
        const barY = innerY + innerH - 22;
        roundRect(ctx, barX, barY, barW, barH, 4.5);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      </script>
    </body>
    </html>
  `);

  await page.waitForTimeout(500);

  const canvasHandle = await page.$('#c');
  const framePngPath = path.join(outputDir, 'realistic_iphone_frame.png');
  await canvasHandle.screenshot({ path: framePngPath, omitBackground: true, type: 'png' });
  console.log(`✅ Cadre PNG transparent généré avec succès: ${framePngPath}`);

  await browser.close();
  console.log('🎉 Frame haute résolution prêt pour intégration !');
}

renderFrame().catch(err => {
  console.error('Erreur rendu frame:', err);
  process.exit(1);
});
