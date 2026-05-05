const SUPABASE_URL = 'https://niwxliahsyocmpnopqod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pd3hsaWFoc3lvY21wbm9wcW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTA1MDEsImV4cCI6MjA4OTU2NjUwMX0.9yhiuZq_2w3hWfM8kzMadzjQeCIjhirHWuXmubaw-qA';

async function loadPerformance() {
  const [compRes, offRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/complaints?order=submitted_at.desc`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    }),
    fetch(`${SUPABASE_URL}/rest/v1/officers?order=level.asc`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    })
  ]);

  const complaints = await compRes.json();
  const officers = await offRes.json();

  // Overall stats
  document.getElementById('total-complaints').textContent = complaints.length;
  document.getElementById('total-resolved').textContent = complaints.filter(c => c.status === 'Resolved').length;
  document.getElementById('total-pending').textContent = complaints.filter(c => c.status === 'Pending').length;
  document.getElementById('total-escalated').textContent = complaints.filter(c => c.escalation_level > 1).length;

  // Officer leaderboard
  const levelMap = { 'Sarpanch': 1, 'Mandal Officer': 2, 'MLA': 3, 'District Collector': 4 };
  const medals = ['🥇', '🥈', '🥉', '4️⃣'];

  const board = document.getElementById('officer-board');
  board.innerHTML = officers.map((o, i) => {
    const assigned = complaints.filter(c => c.escalation_level >= levelMap[o.role]).length;
    const resolved = complaints.filter(c => c.escalation_level >= levelMap[o.role] && c.status === 'Resolved').length;
    const rate = assigned > 0 ? Math.round((resolved / assigned) * 100) : 0;

    return `<div class="officer-card">
      <div class="officer-rank">${medals[i] || (i+1)}</div>
      <div class="officer-info">
        <h3>${o.name}</h3>
        <p>${o.role} — ${o.village}</p>
        <div class="progress-bar-wrap">
          <div class="progress-bar" style="width:${rate}%"></div>
        </div>
        <small style="color:#666">${rate}% resolution rate</small>
      </div>
      <div class="officer-stats">
        <div class="o-stat"><h4>${assigned}</h4><p>Assigned</p></div>
        <div class="o-stat"><h4 style="color:#27ae60">${resolved}</h4><p>Resolved</p></div>
        <div class="o-stat"><h4 style="color:#e74c3c">${assigned - resolved}</h4><p>Pending</p></div>
      </div>
    </div>`;
  }).join('');

  // Public complaints list
  const pubList = document.getElementById('public-complaints');
  pubList.innerHTML = complaints.slice(0, 10).map(c => `
    <div class="complaint-card ${c.status === 'Resolved' ? 'resolved' : ''}">
      <div class="complaint-header">
        <h3>${c.category} — ${c.village}</h3>
        <span class="badge ${c.status.replace(' ','-')}">${c.status}</span>
      </div>
      <div class="complaint-meta">📅 ${new Date(c.submitted_at).toLocaleDateString('en-IN')}</div>
      <span class="category-tag">🏷️ ${c.category}</span>
      <span class="escalation-tag level-${c.escalation_level}">📍 ${c.current_level}</span>
      <p style="margin-top:8px; color:#555;">${c.description.substring(0, 100)}...</p>
    </div>`).join('');
}

loadPerformance();