const SUPABASE_URL = 'https://niwxliahsyocmpnopqod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pd3hsaWFoc3lvY21wbm9wcW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTA1MDEsImV4cCI6MjA4OTU2NjUwMX0.9yhiuZq_2w3hWfM8kzMadzjQeCIjhirHWuXmubaw-qA';

let allComplaints = [];
const levelLabels = { 1: 'Sarpanch', 2: 'Mandal Officer', 3: 'MLA', 4: 'District Collector' };

function adminLogin() {
  const pass = document.getElementById('admin-pass').value;
  if (pass === 'admin123') {
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    loadComplaints();
  } else {
    alert('Wrong password!');
  }
}

async function loadComplaints() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/complaints?order=submitted_at.desc`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  allComplaints = await res.json();
  renderComplaints(allComplaints);
  updateStats(allComplaints);
}

function updateStats(data) {
  document.getElementById('total-count').textContent = data.length;
  document.getElementById('pending-count').textContent = data.filter(c => c.status === 'Pending').length;
  document.getElementById('progress-count').textContent = data.filter(c => c.status === 'In Progress').length;
  document.getElementById('resolved-count').textContent = data.filter(c => c.status === 'Resolved').length;
}

function filterComplaints() {
  const status = document.getElementById('filter-status').value;
  const category = document.getElementById('filter-category').value;
  let filtered = allComplaints;
  if (status !== 'all') filtered = filtered.filter(c => c.status === status);
  if (category !== 'all') filtered = filtered.filter(c => c.category === category);
  renderComplaints(filtered);
}

function renderComplaints(data) {
  const list = document.getElementById('complaints-list');
  if (data.length === 0) { list.innerHTML = '<p class="loading">No complaints found.</p>'; return; }

  list.innerHTML = data.map(c => {
    const days = Math.floor((new Date() - new Date(c.submitted_at)) / (1000 * 60 * 60 * 24));
    return `
    <div class="complaint-card ${c.status === 'Resolved' ? 'resolved' : ''}">
      <div class="complaint-header">
        <h3>${c.name} — ${c.village}</h3>
        <span class="badge ${c.status.replace(' ','-')}">${c.status}</span>
      </div>
      <div class="complaint-meta">
        📞 ${c.phone || 'N/A'} &nbsp;|&nbsp;
        📅 ${new Date(c.submitted_at).toLocaleDateString('en-IN')} &nbsp;|&nbsp;
        ⏱️ ${days} days old
      </div>
      <span class="category-tag">🏷️ ${c.category}</span>
      <span class="escalation-tag level-${c.escalation_level}">📍 ${levelLabels[c.escalation_level]}</span>
      <p style="margin-top:10px;">${c.description}</p>
      <div class="action-btns">
        <button class="btn-progress" onclick="updateStatus('${c.id}', 'In Progress')">▶ In Progress</button>
        <button class="btn-resolve" onclick="updateStatus('${c.id}', 'Resolved')">✅ Resolve</button>
        ${c.escalation_level < 4 ? `<button style="background:#e74c3c;color:white;border:none;padding:8px 15px;border-radius:6px;cursor:pointer;" onclick="escalateNow('${c.id}', ${c.escalation_level})">⬆ Escalate Now</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function updateStatus(id, status) {
  const body = { status };
  if (status === 'Resolved') body.resolved_at = new Date().toISOString();
  await fetch(`${SUPABASE_URL}/rest/v1/complaints?id=eq.${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify(body)
  });
  loadComplaints();
}

async function escalateNow(id, currentLevel) {
  const newLevel = currentLevel + 1;
  const levelLabels = { 2: 'Mandal Officer', 3: 'MLA', 4: 'District Collector' };
  await fetch(`${SUPABASE_URL}/rest/v1/complaints?id=eq.${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify({ escalation_level: newLevel, current_level: levelLabels[newLevel], last_escalated_at: new Date().toISOString() })
  });
  loadComplaints();
}

async function checkEscalations() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/complaints?status=neq.Resolved`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const complaints = await res.json();
  let escalated = 0;

  for (const c of complaints) {
    const days = Math.floor((new Date() - new Date(c.submitted_at)) / (1000 * 60 * 60 * 24));
    let newLevel = c.escalation_level;
    if (days >= 21 && newLevel < 4) newLevel = 4;
    else if (days >= 14 && newLevel < 3) newLevel = 3;
    else if (days >= 7 && newLevel < 2) newLevel = 2;

    if (newLevel !== c.escalation_level) {
      const labels = { 1: 'Sarpanch', 2: 'Mandal Officer', 3: 'MLA', 4: 'District Collector' };
      await fetch(`${SUPABASE_URL}/rest/v1/complaints?id=eq.${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ escalation_level: newLevel, current_level: labels[newLevel] })
      });
      escalated++;
    }
  }
  alert(`✅ Escalation check complete! ${escalated} complaint(s) escalated.`);
  loadComplaints();
}