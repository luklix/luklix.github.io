// Glücks-Booster — verantwortungsvolles Wohlfühl-Frontend
// Texte auf Deutsch, einfache Einstellungen, Pausen-Erinnerung, Journal
(() => {
  const compliments = [
    "Du bist großartig — echt jetzt!",
    "Kleiner Sieg: Du bist hier. Das zählt.",
    "Dein Lächeln ist ansteckend (auch aus der Ferne).",
    "Heute hält noch Platz für Überraschungen.",
    "Danke, dass du dir einen Moment nimmst.",
    "Kleiner Reminder: Du machst das gut."
  ];

  // Elements
  const boostBtn = document.getElementById('boostBtn');
  const message = document.getElementById('message');
  const confettiRoot = document.getElementById('confetti-root');
  const soundCheckbox = document.getElementById('soundCheckbox');
  const sessionLimitInput = document.getElementById('sessionLimit');
  const startSessionBtn = document.getElementById('startSession');
  const endSessionBtn = document.getElementById('endSession');
  const timeElapsedEl = document.getElementById('timeElapsed');
  const modal = document.getElementById('modal');
  const takeBreakBtn = document.getElementById('takeBreak');
  const extendBtn = document.getElementById('extend');

  // Journal
  const journalForm = document.getElementById('journalForm');
  const journalInput = document.getElementById('journalInput');
  const entriesEl = document.getElementById('entries');

  // Audio (opt-in)
  const chime = new Audio();
  chime.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='; // tiny silent placeholder
  let soundEnabled = false;

  // Session timer
  let sessionStart = null;
  let sessionTimer = null;

  // Load settings
  function loadSettings(){
    soundEnabled = localStorage.getItem('gb_sound') === '1';
    soundCheckbox.checked = soundEnabled;
    const limit = localStorage.getItem('gb_limit') || 10;
    sessionLimitInput.value = limit;
    loadEntries();
  }

  function saveSettings(){
    localStorage.setItem('gb_sound', soundCheckbox.checked ? '1' : '0');
    localStorage.setItem('gb_limit', sessionLimitInput.value);
  }

  // Boost action
  function showBoost(){
    // Show message
    const txt = compliments[Math.floor(Math.random() * compliments.length)];
    message.textContent = txt;

    // Accessible announce already handled by aria-live on message

    // Quick hearts animation
    spawnHearts();

    // Confetti
    launchConfetti(30);

    // Sound if allowed
    if (soundCheckbox.checked) {
      safePlayChime();
    }
  }

  boostBtn.addEventListener('click', showBoost);

  // confetti generator (simple)
  function random(min, max){ return Math.random() * (max - min) + min; }
  const colors = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#B892FF'];

  function launchConfetti(count = 25){
    for(let i=0;i<count;i++){
      const el = document.createElement('div');
      el.className = 'confetti';
      el.style.left = (random(10, 90)) + 'vw';
      el.style.background = colors[Math.floor(Math.random()*colors.length)];
      el.style.width = (random(6,14)) + 'px';
      el.style.height = (random(8,18)) + 'px';
      el.style.transform = `rotate(${random(0,360)}deg)`;
      el.style.zIndex = 30;
      document.body.appendChild(el);
      // Animate with CSS keyframe by setting animation
      const duration = random(1800, 3200);
      el.style.animation = `fall ${duration}ms linear forwards`;
      setTimeout(()=>el.remove(), duration + 100);
    }
  }

  // hearts (small ephemeral)
  function spawnHearts(){
    const heartsRoot = document.getElementById('hearts');
    const span = document.createElement('span');
    span.textContent = "💖";
    span.style.opacity = 1;
    span.style.display = 'inline-block';
    span.style.transform = 'translateY(0)';
    span.style.transition = 'transform 1000ms ease-out, opacity 1200ms ease-out';
    heartsRoot.appendChild(span);
    requestAnimationFrame(()=> {
      span.style.transform = 'translateY(-40px) scale(1.2)';
      span.style.opacity = 0;
    });
    setTimeout(()=>span.remove(), 1400);
  }

  // safe play chime (small beep). Because we used a placeholder silent audio, this won't be intrusive.
  function safePlayChime(){
    // In a real deployment, use a short gentle chime and only after explicit consent.
    try {
      chime.currentTime = 0;
      chime.play().catch(()=>{ /* ignore */ });
    } catch(e){}
  }

  // Session timer functions
  function startSession(){
    if(sessionTimer) return;
    sessionStart = Date.now();
    updateTime(); // immediate
    sessionTimer = setInterval(updateTime, 60 * 1000); // update each minute
    // also update display every 5s for snappy UI
    setInterval(()=> {
      if(sessionTimer) updateTime();
    }, 5000);
  }

  function endSession(){
    if(sessionTimer){
      clearInterval(sessionTimer);
      sessionTimer = null;
    }
    sessionStart = null;
    timeElapsedEl.textContent = '0';
  }

  function updateTime(){
    if(!sessionStart) {
      timeElapsedEl.textContent = '0';
      return;
    }
    const mins = Math.floor((Date.now() - sessionStart)/60000);
    timeElapsedEl.textContent = String(mins);
    const limit = parseInt(sessionLimitInput.value, 10) || 10;
    if(mins >= limit){
      // show modal reminder (one-time until user acts)
      showModal();
    }
  }

  function showModal(){
    modal.classList.remove('hidden');
  }
  function hideModal(){
    modal.classList.add('hidden');
  }

  takeBreakBtn.addEventListener('click', ()=> {
    hideModal();
    endSession();
    message.textContent = "Pause gestartet — gut gemacht! 🌿";
  });

  extendBtn.addEventListener('click', ()=> {
    hideModal();
    // add 5 minutes to limit
    const cur = parseInt(sessionLimitInput.value,10) || 10;
    sessionLimitInput.value = String(cur + 5);
    saveSettings();
    message.textContent = "Okay — du bekommst 5 extra Minuten.";
  });

  startSessionBtn.addEventListener('click', ()=> {
    startSession();
    message.textContent = "Sitzung gestartet — viel Freude!";
  });
  endSessionBtn.addEventListener('click', ()=> {
    endSession();
    message.textContent = "Sitzung beendet. Danke für deine Achtsamkeit!";
  });

  // Journal
  function loadEntries(){
    const raw = localStorage.getItem('gb_entries');
    const arr = raw ? JSON.parse(raw) : [];
    entriesEl.innerHTML = '';
    arr.slice().reverse().forEach(e => {
      const li = document.createElement('li');
      li.textContent = e;
      entriesEl.appendChild(li);
    });
  }

  journalForm.addEventListener('submit', (ev)=> {
    ev.preventDefault();
    const val = journalInput.value && journalInput.value.trim();
    if(!val) return;
    const raw = localStorage.getItem('gb_entries');
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(val);
    localStorage.setItem('gb_entries', JSON.stringify(arr));
    journalInput.value = '';
    loadEntries();
    message.textContent = "Danke fürs Teilen — das war schön!";
    // small confetti for a saved entry
    launchConfetti(12);
  });

  // Persist settings on change
  soundCheckbox.addEventListener('change', saveSettings);
  sessionLimitInput.addEventListener('change', saveSettings);

  // modal close when clicking outside
  modal.addEventListener('click', (e)=> {
    if(e.target === modal) hideModal();
  });

  // init
  loadSettings();

  // Friendly tip: keyboard accessibility
  boostBtn.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showBoost();
    }
  });

  // Announce initial friendly message
  message.textContent = "Willkommen — drück den Knopf für eine freundliche Aufmunterung!";
})();