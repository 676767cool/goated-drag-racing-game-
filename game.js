const PARTS = {
  block: [
    { name: 'Cast-Iron V8', hp: 0, weight: 120, reliability: 8, cost: 0 },
    { name: 'Forged 5.7L', hp: 35, weight: 95, reliability: 10, cost: 1200 },
    { name: 'Aluminum Billet', hp: 65, weight: 65, reliability: 12, cost: 2800 }
  ],
  internals: [
    { name: 'Stock Internals', hp: 0, boost: 0, cost: 0 },
    { name: 'Street Forged', hp: 45, boost: 4, cost: 1700 },
    { name: 'Drag Billet', hp: 90, boost: 8, cost: 4200 }
  ],
  induction: [
    { name: 'Naturally Aspirated', hp: 0, weight: 0, cost: 0 },
    { name: 'ProCharger Supercharger', hp: 130, weight: 25, cost: 3600 },
    { name: 'Twin Screw Supercharger', hp: 170, weight: 35, cost: 5200 },
    { name: '70mm Turbo', hp: 150, weight: 18, cost: 3900 },
    { name: 'Twin 88mm Turbos', hp: 260, weight: 48, cost: 7200 }
  ],
  fuel: [
    { name: 'Pump Gas', hp: 0, reliability: 0, cost: 0 },
    { name: 'E85 System', hp: 55, reliability: -2, cost: 1800 },
    { name: 'Race Methanol', hp: 95, reliability: -4, cost: 3500 }
  ],
  exhaust: [
    { name: 'Street Exhaust', hp: 0, weight: 0, cost: 0 },
    { name: 'Cutouts', hp: 15, weight: -8, cost: 900 },
    { name: 'Full Drag Headers', hp: 30, weight: -20, cost: 2200 }
  ]
};

const BODIES = [
  { name: 'Street 2-Door', weight: 3100, grip: 1, cost: 0, className: 'car' },
  { name: 'Fox Drag Coupe', weight: 2780, grip: 1.12, cost: 4500, className: 'fox' },
  { name: 'Tube-Chassis Dragster', weight: 2140, grip: 1.28, cost: 9000, className: 'dragster' }
];

let state = JSON.parse(localStorage.getItem('goatedSave')) || {
  cash: 25000,
  body: 0,
  parts: { block: 0, internals: 0, induction: 0, fuel: 0, exhaust: 0 },
  bestQuarter: null,
  bestPower: null
};

const $ = id => document.getElementById(id);

function selected(category, index) { return PARTS[category][index]; }
function buildStats() {
  const body = BODIES[state.body];
  const values = Object.keys(PARTS).map(key => selected(key, state.parts[key]));
  const hp = 420 + values.reduce((sum, p) => sum + (p.hp || 0), 0);
  const weight = body.weight - (values.reduce((sum, p) => sum + (p.weight || 0), 0));
  const quarter = 12.2 * Math.pow(3100 / weight, 0.45) * Math.pow(420 / hp, 0.55) * (1 / body.grip);
  return { hp, weight: Math.round(weight), quarter: quarter + 0.12 };
}

function save() { localStorage.setItem('goatedSave', JSON.stringify(state)); }

function renderBuilder() {
  const labels = { block:'Engine Block', internals:'Rotating Assembly', induction:'Forced Induction', fuel:'Fuel System', exhaust:'Exhaust' };
  $('parts').innerHTML = Object.keys(PARTS).map(category => `
    <div class="part">
      <label>${labels[category]}</label>
      <select data-category="${category}">
        ${PARTS[category].map((p, i) => `<option value="${i}" ${state.parts[category] === i ? 'selected' : ''}>${p.name}</option>`).join('')}
      </select>
    </div>`).join('');

  document.querySelectorAll('.part select').forEach(select => {
    select.addEventListener('change', () => {
      state.parts[select.dataset.category] = Number(select.value);
      save(); renderStats();
    });
  });

  const bodySelect = document.createElement('div');
  bodySelect.className = 'part';
  bodySelect.innerHTML = `<label>Drag Car Body</label><select id="bodySelect">${BODIES.map((b,i)=>`<option value="${i}" ${state.body===i?'selected':''}>${b.name}</option>`).join('')}</select>`;
  $('parts').appendChild(bodySelect);
  $('bodySelect').addEventListener('change', e => { state.body = Number(e.target.value); save(); renderStats(); });
}

function renderStats() {
  const stats = buildStats();
  $('powerStat').textContent = `${stats.hp.toLocaleString()} HP`;
  $('weightStat').textContent = `${stats.weight.toLocaleString()} lb`;
  $('quarterStat').textContent = `${stats.quarter.toFixed(2)} s`;
  $('buildName').textContent = BODIES[state.body].name;
  $('cash').textContent = `$${state.cash.toLocaleString()}`;
  $('tierBadge').textContent = stats.hp >= 1000 ? 'Pro Mod' : stats.hp >= 700 ? 'Pro Street' : 'Street';
}

function race() {
  const button = $('raceButton');
  if (button.disabled) return;
  button.disabled = true;
  button.textContent = 'STAGED';
  const lights = [...document.querySelectorAll('.lights i')];
  lights.forEach(i => i.classList.remove('lit'));
  let i = 0;
  const sequence = setInterval(() => {
    if (i < 3) lights[i].classList.add('lit');
    i++;
    if (i === 4) {
      clearInterval(sequence);
      setTimeout(runRace, 500);
    }
  }, 420);
}

function runRace() {
  const stats = buildStats();
  const variation = 0.985 + Math.random() * 0.03;
  const time = stats.quarter * variation;
  const rivalTime = 10.2 + Math.random() * 2.2;
  const won = time < rivalTime;
  $('playerCar').animate([{transform:'translateX(0)'},{transform:'translateX(280px)'}], {duration:2400,easing:'ease-in'});
  $('rivalCar').animate([{transform:'translateX(0)'},{transform:'translateX(-280px)'}], {duration:Math.max(1800,rivalTime*220),easing:'ease-in'});
  setTimeout(() => {
    state.bestQuarter = state.bestQuarter ? Math.min(state.bestQuarter, time) : time;
    state.bestPower = state.bestPower ? Math.max(state.bestPower, stats.hp) : stats.hp;
    if (won) state.cash += 500;
    save();
    $('resultTime').textContent = `${time.toFixed(3)} sec — ${won ? 'WIN' : 'LOSS'}`;
    $('resultDetail').textContent = `${stats.hp.toLocaleString()} HP • ${stats.weight.toLocaleString()} lb • Rival: ${rivalTime.toFixed(3)} sec`;
    $('raceButton').disabled = false;
    $('raceButton').textContent = 'RACE AGAIN';
    $('cash').textContent = `$${state.cash.toLocaleString()}`;
    renderRanks();
  }, 2500);
}

function renderRanks() {
  const stats = buildStats();
  const quarterRows = [
    ['1','TurboTyrant','7.891'], ['2','Boosted Brad','8.042'], ['3','Lil Miss 88','8.330'],
    ['YOU','Your Best',state.bestQuarter ? state.bestQuarter.toFixed(3) : '—']
  ].sort((a,b) => a[2] === '—' ? 1 : b[2] === '—' ? -1 : Number(a[2]) - Number(b[2])).map((r,i)=>rankRow(i+1,r)).join('');
  $('quarterRanks').innerHTML = quarterRows;

  const powerRows = [
    ['1','DynoDemon','2,140'], ['2','BoostBishop','1,870'], ['3','RedlineKid','1,520'],
    ['YOU','Your Build',state.bestPower ? state.bestPower.toLocaleString() : stats.hp.toLocaleString()]
  ].sort((a,b) => Number(String(b[2]).replace(',','')) - Number(String(a[2]).replace(',',''))).map((r,i)=>rankRow(i+1,r)).join('');
  $('horsepowerRanks').innerHTML = powerRows;
}

function rankRow(index, row) {
  const you = row[0] === 'YOU';
  return `<div class="rank-row ${you?'you':''}"><span class="rank-number">${you?'YOU':index}</span><span class="rank-name">${row[1]}</span><span class="rank-value">${row[2]} ${row[0]==='YOU'&&String(row[2]).includes('.')?'sec':'HP'}</span></div>`;
}

document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
  document.querySelectorAll('.tab,.view').forEach(el => el.classList.remove('active'));
  tab.classList.add('active');
  $(tab.dataset.view).classList.add('active');
  if (tab.dataset.view === 'rankings') renderRanks();
}));
$('raceButton').addEventListener('click', race);
renderBuilder(); renderStats(); renderRanks();
