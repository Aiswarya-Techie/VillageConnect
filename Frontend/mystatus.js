const SUPABASE_URL = 'https://niwxliahsyocmpnopqod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pd3hsaWFoc3lvY21wbm9wcW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTA1MDEsImV4cCI6MjA4OTU2NjUwMX0.9yhiuZq_2w3hWfM8kzMadzjQeCIjhirHWuXmubaw-qA';

const citizen = JSON.parse(localStorage.getItem('vc_citizen'));
if (!citizen) window.location.href = 'register.html';
else document.getElementById('citizen-name').textContent = '👤 ' + citizen.name;

function logout() { localStorage.removeItem('vc_citizen'); window.location.href = 'index.html'; }

const levelLabels = { 1: 'Sarpanch', 2: 'Mandal Officer', 3: 'MLA', 4: 'District Collector' };
const levelColors = { 1: 'level-1', 2: 'level-2', 3: 'level-3', 4: 'level-4' };

async function loadMyComplaints() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/complaints?citizen_id=eq.${citizen.id}&order=submitted_at.desc`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const complaints = await res.json();
  const container = document.getElementById('my-complaints');

  if (complaints.length === 0) {
    container.innerHTML = `<div class="complaint-card" style="text-align:center; padding:40px;">
      <p style="color:#666; font-size:1.1rem;">No complaints submitted yet.</p>
      <a href="complaint.html" class="submit-btn" style="display:inline-block; margin-top:15px; padding:12px 30px; text-decoration:none;">+ Submit First Complaint</a>
    </div>`;
    return;
  }

  container.innerHTML = complaints.map(c => {
    const days = Math.floor((new Date() - new Date(c.submitted_at)) / (1000 * 60 * 60 * 24));
    return `
    <div class="complaint-card ${c.status === 'Resolved' ? 'resolved' : ''}">
      <div class="complaint-header">
        <h3>${c.category} Issue — ${c.village}</h3>
        <span class="badge ${c.status.replace(' ', '-')}">${c.status}</span>
      </div>
      <div class="complaint-meta">
        📅 Submitted: ${new Date(c.submitted_at).toLocaleDateString('en-IN')} &nbsp;|&nbsp; ⏱️ ${days} days ago
      </div>
      <span class="category-tag">🏷️ ${c.category}</span>
      <span class="escalation-tag ${levelColors[c.escalation_level]}">
        📍 ${levelLabels[c.escalation_level]}
      </span>
      <p style="margin-top:10px; color:#555;">${c.description}</p>
      <div style="margin-top:12px;">
        ${getEscalationBar(c.escalation_level)}
      </div>
    </div>`;
  }).join('');
}

function getEscalationBar(level) {
  const levels = ['Sarpanch', 'Mandal Officer', 'MLA', 'District Collector'];
  return `<div style="display:flex; gap:5px; margin-top:8px;">
    ${levels.map((l, i) => `
      <div style="flex:1; text-align:center;">
        <div style="height:6px; border-radius:3px; background:${i < level ? '#1a6b3c' : '#e0e0e0'};"></div>
        <small style="font-size:0.7rem; color:${i < level ? '#1a6b3c' : '#aaa'};">${l}</small>
      </div>`).join('')}
  </div>`;
}

loadMyComplaints();