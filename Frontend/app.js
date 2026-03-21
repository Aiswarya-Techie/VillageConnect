const SUPABASE_URL = 'https://niwxliahsyocmpnopqod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pd3hsaWFoc3lvY21wbm9wcW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTA1MDEsImV4cCI6MjA4OTU2NjUwMX0.9yhiuZq_2w3hWfM8kzMadzjQeCIjhirHWuXmubaw-qA';

const citizen = JSON.parse(localStorage.getItem('vc_citizen'));
if (!citizen) window.location.href = 'register.html';
else document.getElementById('citizen-name').textContent = '👤 ' + citizen.name;

function logout() { localStorage.removeItem('vc_citizen'); window.location.href = 'index.html'; }

async function categorizeWithAI(description) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'YOUR_CLAUDE_API_KEY',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        messages: [{ role: 'user', content: `Categorize into ONE word only: Water, Roads, Healthcare, Electricity, Sanitation, or Other. Complaint: "${description}"` }]
      })
    });
    const data = await response.json();
    return data.content[0].text.trim();
  } catch(e) {
    const d = description.toLowerCase();
    if (d.includes('water') || d.includes('pipe') || d.includes('tap')) return 'Water';
    if (d.includes('road') || d.includes('pothole') || d.includes('bridge')) return 'Roads';
    if (d.includes('hospital') || d.includes('health') || d.includes('doctor')) return 'Healthcare';
    if (d.includes('electricity') || d.includes('power') || d.includes('light')) return 'Electricity';
    if (d.includes('toilet') || d.includes('drain') || d.includes('garbage')) return 'Sanitation';
    return 'Other';
  }
}

async function submitComplaint() {
  const description = document.getElementById('description').value.trim();
  if (!description) { alert('Please describe the issue!'); return; }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = '🤖 AI categorizing...';

  const category = await categorizeWithAI(description);
  document.getElementById('category-text').textContent = category;
  document.getElementById('ai-result').classList.remove('hidden');

  btn.textContent = '💾 Saving...';

  const res = await fetch(`${SUPABASE_URL}/rest/v1/complaints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({
      citizen_id: citizen.id,
      name: citizen.name,
      village: citizen.village,
      phone: citizen.phone,
      description,
      category,
      status: 'Pending',
      current_level: 'Sarpanch',
      escalation_level: 1
    })
  });

  if (res.ok) {
    document.getElementById('success-msg').classList.remove('hidden');
    btn.textContent = '✅ Submitted!';
    document.getElementById('description').value = '';
  } else {
    alert('Error! Try again.');
    btn.disabled = false;
    btn.textContent = '🚀 Submit Complaint';
  }
}