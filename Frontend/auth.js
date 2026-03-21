const SUPABASE_URL = 'https://niwxliahsyocmpnopqod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pd3hsaWFoc3lvY21wbm9wcW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTA1MDEsImV4cCI6MjA4OTU2NjUwMX0.9yhiuZq_2w3hWfM8kzMadzjQeCIjhirHWuXmubaw-qA';

let generatedOTP = '';

async function sendOTP() {
  const phone = document.getElementById('phone').value.trim();
  const name = document.getElementById('name').value.trim();
  const village = document.getElementById('village').value.trim();

  if (!phone || phone.length !== 10) { showMsg('Enter valid 10-digit phone number', 'error'); return; }
  if (!name) { showMsg('Enter your name', 'error'); return; }
  if (!village) { showMsg('Enter your village name', 'error'); return; }

  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

  // Save/update citizen in database
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/citizens?phone=eq.${phone}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const existing = await checkRes.json();

  if (existing.length > 0) {
    await fetch(`${SUPABASE_URL}/rest/v1/citizens?phone=eq.${phone}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({ otp: generatedOTP, name, village })
    });
  } else {
    await fetch(`${SUPABASE_URL}/rest/v1/citizens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({ phone, name, village, otp: generatedOTP })
    });
  }

  document.getElementById('demo-otp').textContent = generatedOTP;
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');
}

async function verifyOTP() {
  const phone = document.getElementById('phone').value.trim();
  const entered = document.getElementById('otp-input').value.trim();

  if (entered !== generatedOTP) { showMsg('Wrong OTP! Try again.', 'error'); return; }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/citizens?phone=eq.${phone}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const citizens = await res.json();

  if (citizens.length > 0) {
    localStorage.setItem('vc_citizen', JSON.stringify(citizens[0]));
    showMsg('✅ Login successful! Redirecting...', 'success');
    setTimeout(() => window.location.href = 'complaint.html', 1500);
  }
}

function resendOTP() {
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step1').classList.remove('hidden');
}

function showMsg(text, type) {
  const msg = document.getElementById('msg');
  msg.textContent = text;
  msg.className = `msg ${type}`;
  msg.classList.remove('hidden');
}