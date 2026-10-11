/**
 * JULIÁN PÉREZ // MAIN APP SCRIPT
 * Lógica interactiva, Canvas Ciber-Páramo, Terminal Ciber-Boyacense
 * y sincronización del Guaracha Engine.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ===================================================================
  // 1. PARTICLES & CYBER-PÁRAMO BACKGROUND CANVAS
  // ===================================================================
  const canvas = document.getElementById('cyberCanvas');
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Glowing cyber particles (representing Andean paramo mist & energy sparks)
  const particles = [];
  const PARTICLE_COUNT = 55;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.8 - 0.2, // float upwards like mist
      opacity: Math.random() * 0.7 + 0.2,
      color: Math.random() > 0.6 ? '#00f0ff' : (Math.random() > 0.5 ? '#ff007f' : '#00ff66')
    });
  }

  // Perspective Cyber Grid at the bottom
  function drawPerspectiveGrid() {
    const horizon = height * 0.7;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;

    // Horizon line
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(width, horizon);
    ctx.stroke();

    // Perspective lines fanning out
    const lineCount = 20;
    for (let i = 0; i <= lineCount; i++) {
      const xTop = (width / lineCount) * i;
      const xBottom = (i - lineCount / 2) * (width / 5) + width / 2;
      ctx.beginPath();
      ctx.moveTo(xTop, horizon);
      ctx.lineTo(xBottom, height);
      ctx.stroke();
    }

    // Horizontal lines with increasing spacing
    for (let y = horizon; y <= height; y += (y - horizon + 15) * 0.25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function renderCyberCanvas() {
    ctx.clearRect(0, 0, width, height);

    // Draw perspective grid
    drawPerspectiveGrid();

    // Draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.speedX;
      p.y += p.speedY;

      // Wrap around
      if (p.y < 0) {
        p.y = height;
        p.x = Math.random() * width;
      }
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(renderCyberCanvas);
  }

  renderCyberCanvas();

  // ===================================================================
  // 2. EQUALIZER BARS & AUDIO OSCILLOSCOPE
  // ===================================================================
  const eqContainer = document.getElementById('eqBars');
  const audioStatusText = document.getElementById('audioStatusText');
  const oscCanvas = document.getElementById('oscCanvas');
  const oscCtx = oscCanvas.getContext('2d');

  // Create 24 EQ bars
  const EQ_BAR_COUNT = 24;
  const eqBars = [];
  for (let i = 0; i < EQ_BAR_COUNT; i++) {
    const bar = document.createElement('div');
    bar.className = 'eq-bar';
    eqContainer.appendChild(bar);
    eqBars.push(bar);
  }

  function updateVisualizers() {
    const freqData = window.guarachaEngine.getFrequencyData();
    const isPlaying = window.guarachaEngine.isPlaying;

    // 1. Update Top Bar EQ
    if (isPlaying && freqData) {
      for (let i = 0; i < EQ_BAR_COUNT; i++) {
        const value = freqData[i % freqData.length] || 0;
        const barHeight = Math.max(3, (value / 255) * 20);
        eqBars[i].style.height = `${barHeight}px`;
      }
    } else {
      for (let i = 0; i < EQ_BAR_COUNT; i++) {
        eqBars[i].style.height = '3px';
      }
    }

    // 2. Update Guaracha-Lab Oscilloscope Canvas
    if (oscCanvas) {
      const w = (oscCanvas.width = oscCanvas.clientWidth);
      const h = (oscCanvas.height = oscCanvas.clientHeight);

      oscCtx.fillStyle = '#060911';
      oscCtx.fillRect(0, 0, w, h);

      // Grid line in oscilloscope
      oscCtx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      oscCtx.lineWidth = 1;
      oscCtx.beginPath();
      oscCtx.moveTo(0, h / 2);
      oscCtx.lineTo(w, h / 2);
      oscCtx.stroke();

      if (isPlaying && freqData) {
        oscCtx.lineWidth = 2.5;
        oscCtx.strokeStyle = '#00f0ff';
        oscCtx.shadowBlur = 10;
        oscCtx.shadowColor = '#00f0ff';
        oscCtx.beginPath();

        const sliceWidth = w / freqData.length;
        let x = 0;

        for (let i = 0; i < freqData.length; i++) {
          const v = freqData[i] / 255.0;
          const y = (1 - v) * (h * 0.8) + (h * 0.1);

          if (i === 0) {
            oscCtx.moveTo(x, y);
          } else {
            oscCtx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        oscCtx.lineTo(w, h / 2);
        oscCtx.stroke();
      } else {
        // Idle flat neon line with subtle vibration
        oscCtx.lineWidth = 1.5;
        oscCtx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        oscCtx.beginPath();
        oscCtx.moveTo(0, h / 2);
        oscCtx.lineTo(w, h / 2);
        oscCtx.stroke();
      }
    }

    requestAnimationFrame(updateVisualizers);
  }

  updateVisualizers();

  // ===================================================================
  // 3. SOUND CONTROLS & PAD INTERACTION
  // ===================================================================
  const heroDropBtn = document.getElementById('heroPlayGuarachaBtn');
  const miniSoundToggle = document.getElementById('miniSoundToggle');
  const masterLoopBtn = document.getElementById('masterLoopBtn');
  const dspModeTag = document.getElementById('dspModeTag');
  const tempoSlider = document.getElementById('tempoSlider');
  const tempoVal = document.getElementById('tempoVal');
  const bpmDisplay = document.getElementById('bpmDisplay');
  const distortionSlider = document.getElementById('distortionSlider');
  const distVal = document.getElementById('distVal');

  function updateLoopUI(isPlaying) {
    if (isPlaying) {
      audioStatusText.textContent = `GUARACHA-CORE: TRANSMITIENDO ${window.guarachaEngine.bpm} BPM`;
      dspModeTag.textContent = 'ESTADO: DROP ACTIVO ⚡';
      dspModeTag.style.color = 'var(--neon-green)';
      dspModeTag.style.borderColor = 'var(--neon-green)';

      masterLoopBtn.classList.add('is-playing');
      masterLoopBtn.querySelector('.drop-title').textContent = 'DETENER EL DROP CONTINUO';
      masterLoopBtn.querySelector('.drop-icon').textContent = '⏹️';

      miniSoundToggle.querySelector('.toggle-text').textContent = 'PAUSAR';
      miniSoundToggle.querySelector('.icon').textContent = '⏸️';

      heroDropBtn.querySelector('.btn-text').textContent = 'DETENER GUARACHA DROP';
      heroDropBtn.querySelector('.btn-icon').textContent = '🛑';
    } else {
      audioStatusText.textContent = 'GUARACHA-CORE: EN ESPERA';
      dspModeTag.textContent = 'ESTADO: LISTO';
      dspModeTag.style.color = 'var(--neon-cyan)';
      dspModeTag.style.borderColor = 'var(--neon-cyan)';

      masterLoopBtn.classList.remove('is-playing');
      masterLoopBtn.querySelector('.drop-title').textContent = 'ARRANCAR EL DROP CONTINUO';
      masterLoopBtn.querySelector('.drop-icon').textContent = '🚀';

      miniSoundToggle.querySelector('.toggle-text').textContent = 'SONAR';
      miniSoundToggle.querySelector('.icon').textContent = '🔊';

      heroDropBtn.querySelector('.btn-text').textContent = 'SOLTAR EL DROP DE FRONTERA';
      heroDropBtn.querySelector('.btn-icon').textContent = '⚡';
    }
  }

  window.guarachaEngine.onStatusChange = updateLoopUI;

  // Toggle master drop from any button
  function handleToggleLoop() {
    window.guarachaEngine.toggleMasterLoop();
  }

  heroDropBtn.addEventListener('click', handleToggleLoop);
  miniSoundToggle.addEventListener('click', handleToggleLoop);
  masterLoopBtn.addEventListener('click', handleToggleLoop);

  // Sound pads
  const pads = document.querySelectorAll('.sound-pad');
  pads.forEach(pad => {
    pad.addEventListener('click', () => {
      const soundType = pad.getAttribute('data-sound');
      triggerSound(soundType, pad);
    });
  });

  function triggerSound(soundType, padElement) {
    if (padElement) {
      padElement.classList.add('active-beat');
      setTimeout(() => padElement.classList.remove('active-beat'), 160);
    }

    switch (soundType) {
      case 'kick':
        window.guarachaEngine.playKick();
        break;
      case 'tribal':
        window.guarachaEngine.playTribalTom(280);
        break;
      case 'lead':
        window.guarachaEngine.playSynthLead(523);
        break;
      case 'riser':
        window.guarachaEngine.playRiser();
        break;
      case 'zapateo':
        window.guarachaEngine.playZapateo();
        break;
      case 'shout':
        window.guarachaEngine.playShout();
        break;
    }
  }

  // Keyboard triggers for pads (1-6, Space for loop)
  window.addEventListener('keydown', (e) => {
    // Ignore if typing in terminal
    if (document.activeElement.id === 'termInput') return;

    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      handleToggleLoop();
    } else if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
      const padIdx = parseInt(e.key) - 1;
      if (pads[padIdx]) {
        pads[padIdx].click();
      }
    }
  });

  // Slider adjustments
  tempoSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    tempoVal.textContent = val;
    bpmDisplay.textContent = `${val}.0`;
    window.guarachaEngine.setBpm(val);
    if (window.guarachaEngine.isPlaying) {
      audioStatusText.textContent = `GUARACHA-CORE: TRANSMITIENDO ${val} BPM`;
    }
  });

  distortionSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    distVal.textContent = `${val}%`;
    window.guarachaEngine.setDistortion(val);
  });

  // ===================================================================
  // 4. INTERACTIVE TERMINAL (CIBER-BOYACO SHELL)
  // ===================================================================
  const termInput = document.getElementById('termInput');
  const termHistory = document.getElementById('termHistory');
  const termBody = document.getElementById('termBody');
  const termChips = document.querySelectorAll('.term-chip');

  const COMMAND_RESPONSES = {
    help: `
COMANDOS DISPONIBLES EN EL NODO DE EL ESPINO:
  • <span class="cmd-highlight">origen</span>     : El lore y la cuna de Julián en Boyacá.
  • <span class="cmd-highlight">guaracha</span>   : Transmisión del lema oficial y beat cuántico.
  • <span class="cmd-highlight">stack</span>      : Tecnologías de frontera dominadas.
  • <span class="cmd-highlight">changua</span>    : El combustible biológico del compilador.
  • <span class="cmd-highlight">proyectos</span>  : Catálogo de invenciones de alto impacto.
  • <span class="cmd-highlight">filosofia</span>  : Principios de un Senior Dev del páramo.
  • <span class="cmd-highlight">ruana</span>      : Activar protocolo de overclock térmico.
  • <span class="cmd-highlight">contacto</span>   : Coordenadas y canales de transmisión.
  • <span class="cmd-highlight">clear</span>      : Limpiar la pantalla de la terminal.
`,
    origen: `
[ORIGEN: EL ESPINO, BOYACÁ // COLOMBIA]
  📍 Coordenadas: 6.3572° N, 72.4967° W
  🏔️ Altitud: ~3.100 msnm (cerca del Parque Nacional Natural El Cocuy).
  ❄️ Temperatura de refrigeración líquida: Naturalmente fría, ideal para servers.
  🐑 Población ovina: Altamente respetuosa con la arquitectura en microservicios.
  Julián creció forjando disciplina entre montañas andinas, combinando la tenacidad 
  boyacense con la curiosidad voraz por las fronteras de la computación mundial.
`,
    guaracha: `
🎛️ TRANSMISIÓN DE LEMA OFICIAL:
  "YO SIEMPRE VENGO CON LO ÚLTIMO EN GUORACHAS"
  
  [STATUS: 132 BPM SYNTH TRIGGERED]
  En Boyacá y en el mundo, 'lo último en guarachas' significa la novedad más brava, 
  lo que nadie más tiene, el estándar que deja a la competencia con la boca abierta.
`,
    stack: `
ARSENAL TÉCNICO DE FRONTERA:
  • IA Generativa & Agentes: PyTorch, vLLM, DeepSeek/Llama R1 fine-tuning, RAG cuántico.
  • Sistemas de Alto Rendimiento: Rust, Go, C++20, eBPF, WebAssembly (Wasm).
  • Infraestructura & Nube: Kubernetes Multi-Region, Kafka, ClickHouse, Edge Mesh.
  • Audio DSP: Web Audio API, Síntesis por Modulación de Frecuencia a 132 BPM.
  • Metodología: Changua-Driven Development (CDD) con cero memory leaks.
`,
    changua: `
🍲 PROTOCOLO NUTRICIONAL: CHANGUA-CORE v2.0
  Ingredientes en memoria:
    - 500ml de leche entera de vaca boyacense
    - 2 huevos tibios con yema en estado superpuesto (qubits)
    - Cilantro fresco picado en branch principal
    - Calado / pan de agua con alta tolerancia a fallos
  Efectos:
    +500% concentración al debuggear punteros en C++
    +0ms latencia mental para resolver deadlocks a las 3 AM.
`,
    proyectos: `
CATÁLOGO DE PROYECTOS DE FRONTERA:
  1. [RuanaOS Quantum]       : RTOS térmico para dispositivos periféricos en climas extremos.
  2. [ChanguaGPT Reasoning]  : LLM de 70B que optimiza arquitecturas y te da consejos de vida.
  3. [El Espino Mesh]        : Red satelital óptica P2P para internet gigabit en páramos.
  4. [Neural Guaracha Synth] : Motor de audio procedural en el navegador a 132 BPM.
`,
    filosofia: `
MANIFIESTO DEL DEV DE EL ESPINO:
  1. Si tu código necesita 20 reuniones para justificarse, está mal planteado.
  2. La tecnología de frontera no espera al próximo sprint; se inventa hoy.
  3. No le temas al frío ni a los bugs: ambos se quitan con trabajo y temple.
  4. "Yo siempre vengo con lo último en guarachas".
`,
    ruana: `
⚡ PROTOCOLO RUANA-QUANTUM ACTIVADO!
  Regulando temperatura del núcleo a 3.100 msnm...
  Optimizando disipación térmica boyacense...
  [RESULTADO: 0 warnings, 0 errores, overclocking al 150%]
`,
    contacto: `
CANALES DE COMUNICACIÓN DIRECTA:
  • Correo electrónico : julian.perez@frontier.dev
  • Redes / GitHub     : @JulianFrontier
  • Ubicación base     : El Espino, Boyacá, Colombia
  • Enviar señal       : Listo para colaborar en proyectos que desafíen los límites.
`
  };

  function executeCommand(cmdRaw) {
    const cmd = cmdRaw.trim().toLowerCase();
    if (!cmd) return;

    if (cmd === 'clear') {
      termHistory.innerHTML = '';
      termInput.value = '';
      return;
    }

    const entry = document.createElement('div');
    entry.className = 'term-output-entry';

    const cmdLine = document.createElement('div');
    cmdLine.className = 'term-history-cmd';
    cmdLine.innerHTML = `julian@espino:~$ ${escapeHtml(cmdRaw)}`;

    const respLine = document.createElement('div');
    respLine.className = 'term-history-resp';

    if (COMMAND_RESPONSES[cmd]) {
      respLine.innerHTML = COMMAND_RESPONSES[cmd];
      // Trigger sound on 'guaracha' command
      if (cmd === 'guaracha') {
        window.guarachaEngine.playShout();
      }
    } else {
      respLine.innerHTML = `Comando no reconocido: "<strong>${escapeHtml(cmd)}</strong>". Escribe <span class="cmd-highlight">help</span> para consultar los comandos del sistema.`;
    }

    entry.appendChild(cmdLine);
    entry.appendChild(respLine);
    termHistory.appendChild(entry);

    termInput.value = '';
    termBody.scrollTop = termBody.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  }

  termInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      executeCommand(termInput.value);
    }
  });

  termChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cmd = chip.getAttribute('data-cmd');
      termInput.value = cmd;
      executeCommand(cmd);
      termInput.focus();
    });
  });

  // ===================================================================
  // 5. CRT EFFECT TOGGLE
  // ===================================================================
  const crtToggleBtn = document.getElementById('crtToggleBtn');
  crtToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('crt-enabled');
    const isCrt = document.body.classList.contains('crt-enabled');
    crtToggleBtn.textContent = isCrt ? 'CRT: ON' : 'CRT: OFF';
    crtToggleBtn.style.borderColor = isCrt ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.2)';
    crtToggleBtn.style.color = isCrt ? 'var(--neon-cyan)' : 'var(--text-muted)';
  });

  // ===================================================================
  // 6. COPY TO CLIPBOARD & TOAST NOTIFICATION
  // ===================================================================
  const toast = document.getElementById('toast');
  const copyButtons = document.querySelectorAll('.btn-copy-chip');

  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`¡Copiado: ${textToCopy}! ⚡`);
        });
      } else {
        showToast(`¡Copiado: ${textToCopy}! ⚡`);
      }
    });
  });

  let toastTimer = null;
  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

});
