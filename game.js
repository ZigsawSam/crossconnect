const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir'
];

const QUESTIONS = [
  'What is your name?',
  'How old are you?',
  'What do you do (work/study)?',
  'What is your hometown famous for?',
  'Best street food in your city?',
  'Favorite Bollywood or regional film?',
  'Favorite sport or game?',
  'A hobby you love?',
  'Dream travel destination in India?',
  'One thing you love about your state?'
];

const VULGAR = /fuck|sex|nude|dick|pussy|boob|shit|bitch|asshole/i;

// Populate states dropdown
const sel = document.getElementById('inp-state');
STATES.forEach(s => {
  const o = document.createElement('option');
  o.value = s; o.textContent = s;
  sel.appendChild(o);
});

let me = {}, peer = null, conn = null, roomCode = '', isHost = false;
let myAnswers = [], theirAnswers = [], myCount = 0, theirCount = 0;
let currentQ = 0, timerInterval = null, timeLeft = 30;

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

function randCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function goSetup() {
  const name = document.getElementById('inp-name').value.trim();
  const state = document.getElementById('inp-state').value;
  const city = document.getElementById('inp-city').value.trim();
  if (!name || !state || !city) { toast('Please fill in all fields'); return; }
  me = { name, state, city };
  show('s-setup');
}

function hostGame() {
  roomCode = randCode();
  isHost = true;
  document.getElementById('room-code-display').textContent = roomCode;
  document.getElementById('wait-title').textContent = 'Waiting for opponent...';
  document.getElementById('wait-sub').textContent = 'Share this code with your friend';
  show('s-wait');
  initPeer(roomCode);
}

function joinGame() {
  const code = document.getElementById('inp-join-code').value.trim().toUpperCase();
  if (code.length < 4) { toast('Enter a valid room code'); return; }
  roomCode = code;
  isHost = false;
  document.getElementById('room-code-display').textContent = roomCode;
  document.getElementById('wait-title').textContent = 'Connecting...';
  document.getElementById('wait-sub').textContent = 'Joining room ' + roomCode;
  show('s-wait');
  initPeer(null, roomCode);
}

function copyCode() {
  navigator.clipboard.writeText(roomCode)
    .then(() => toast('Code copied!'))
    .catch(() => toast('Code: ' + roomCode));
}

function initPeer(hostId, connectTo) {
  const id = hostId || Math.random().toString(36).slice(2, 10);
  peer = new Peer(id, { debug: 0 });

  peer.on('open', () => {
    if (connectTo) {
      conn = peer.connect(connectTo, { reliable: true });
      setupConn(conn);
    }
  });

  peer.on('connection', (c) => {
    conn = c;
    setupConn(conn);
  });

  peer.on('error', (e) => {
    toast('Connection error: ' + e.type);
    document.getElementById('conn-status').textContent = 'Error: ' + e.type;
  });
}

function setupConn(c) {
  c.on('open', () => {
    document.getElementById('conn-dot').className = 'status-dot green';
    document.getElementById('conn-status').textContent = 'Connected!';
    c.send({ type: 'hello', ...me });
  });
  c.on('data', handleData);
  c.on('close', () => toast('Opponent disconnected'));
}

function handleData(data) {
  if (data.type === 'hello') {
    document.getElementById('peer-info').style.display = 'block';
    document.getElementById('peer-name-display').textContent = data.name;
    document.getElementById('peer-state-display').textContent = data.state + (data.city ? ', ' + data.city : '');
    me.peerName = data.name; me.peerState = data.state; me.peerCity = data.city;
    document.getElementById('speed-them-label').textContent = data.name;
    if (isHost) document.getElementById('btn-start-game').style.display = 'block';
  }
  if (data.type === 'start') beginQuestions();
  if (data.type === 'answer') {
    theirAnswers[data.qIndex] = data.answer;
    theirCount = data.count;
    updateSpeed();
  }
  if (data.type === 'done') {
    theirAnswers = data.answers;
    theirCount = QUESTIONS.length;
    updateSpeed();
    checkFinish();
  }
  if (data.type === 'chat') {
    if (VULGAR.test(data.msg)) return;
    addChatMsg(data.msg, false, me.peerName);
  }
}

function startGame() {
  conn.send({ type: 'start' });
  beginQuestions();
}

function beginQuestions() {
  myAnswers = new Array(QUESTIONS.length).fill('');
  theirAnswers = new Array(QUESTIONS.length).fill('');
  myCount = 0; theirCount = 0; currentQ = 0;
  buildProgress();
  show('s-questions');
  loadQuestion(0);
}

function buildProgress() {
  const p = document.getElementById('q-progress');
  p.innerHTML = '';
  QUESTIONS.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'progress-dot'; d.id = 'pdot-' + i;
    p.appendChild(d);
  });
}

function loadQuestion(idx) {
  currentQ = idx;
  document.getElementById('q-num').textContent = 'Q ' + (idx + 1) + ' / ' + QUESTIONS.length;
  document.getElementById('q-text').textContent = QUESTIONS[idx];
  document.getElementById('q-answer').value = '';
  document.getElementById('q-answer').disabled = false;
  document.getElementById('btn-submit-ans').disabled = false;
  document.getElementById('btn-submit-ans').textContent = 'Submit Answer ⚡';
  document.querySelectorAll('.progress-dot').forEach((d, i) => {
    d.className = 'progress-dot' + (i < idx ? ' done' : i === idx ? ' current' : '');
  });
  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 30;
  document.getElementById('q-timer').textContent = timeLeft;
  document.getElementById('q-timer').className = 'timer';
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('q-timer').textContent = timeLeft;
    if (timeLeft <= 5) document.getElementById('q-timer').className = 'timer urgent';
    if (timeLeft <= 0) { clearInterval(timerInterval); autoSubmit(); }
  }, 1000);
}

function submitAnswer() {
  clearInterval(timerInterval);
  const ans = document.getElementById('q-answer').value.trim() || '(skipped)';
  saveAnswer(ans);
}

function autoSubmit() {
  const ans = document.getElementById('q-answer').value.trim() || '(skipped)';
  saveAnswer(ans);
}

function saveAnswer(ans) {
  document.getElementById('q-answer').disabled = true;
  document.getElementById('btn-submit-ans').disabled = true;
  document.getElementById('btn-submit-ans').textContent = '✓ Submitted';
  myAnswers[currentQ] = ans;
  myCount = currentQ + 1;
  conn && conn.send({ type: 'answer', qIndex: currentQ, answer: ans, count: myCount });
  updateSpeed();
  if (currentQ + 1 < QUESTIONS.length) {
    setTimeout(() => loadQuestion(currentQ + 1), 600);
  } else {
    conn && conn.send({ type: 'done', answers: myAnswers });
    checkFinish();
  }
}

function updateSpeed() {
  const yp = Math.round(myCount / QUESTIONS.length * 100);
  const tp = Math.round(theirCount / QUESTIONS.length * 100);
  document.getElementById('speed-you').style.width = yp + '%';
  document.getElementById('speed-them').style.width = tp + '%';
  document.getElementById('speed-you-n').textContent = myCount;
  document.getElementById('speed-them-n').textContent = theirCount;
}

function checkFinish() {
  const meDone = myCount >= QUESTIONS.length;
  const themDone = theirCount >= QUESTIONS.length;
  if (meDone && themDone) showResult();
  else if (meDone) document.getElementById('btn-submit-ans').textContent = 'Waiting for opponent...';
}

function showResult() {
  clearInterval(timerInterval);
  const iWon = myCount === theirCount ? isHost : myCount >= theirCount;
  document.getElementById('result-icon').textContent = iWon ? '🗝️' : '😊';
  document.getElementById('result-title').textContent = iWon ? 'You unlocked the chat!' : 'They were faster!';
  document.getElementById('result-sub').textContent = iWon ? 'Fastest fingers win the key! 🏆' : 'Better luck next round — but you can still chat!';
  const panel = document.getElementById('peer-answers');
  panel.innerHTML = '';
  QUESTIONS.forEach((q, i) => {
    const d = document.createElement('div');
    d.className = 'ans-item';
    d.innerHTML = '<div class="ans-q">' + q + '</div><div class="ans-a">' + (theirAnswers[i] || '(no answer)') + '</div>';
    panel.appendChild(d);
  });
  show('s-result');
}

function goChat() {
  const pn = me.peerName || 'Friend';
  document.getElementById('chat-avatar').textContent = pn[0].toUpperCase();
  document.getElementById('chat-name').textContent = pn;
  document.getElementById('chat-region').textContent = (me.peerCity || '') + (me.peerState ? ', ' + me.peerState : '');
  document.getElementById('first-msg-name').textContent = pn;
  show('s-chat');
}

function sendChat() {
  const inp = document.getElementById('chat-inp');
  const msg = inp.value.trim();
  if (!msg) return;
  if (VULGAR.test(msg)) { toast('⚠️ Message blocked — keep it respectful'); inp.value = ''; return; }
  if (msg.length > 300) { toast('Message too long'); return; }
  addChatMsg(msg, true, me.name);
  conn && conn.send({ type: 'chat', msg });
  inp.value = '';
}

function addChatMsg(msg, isMe, name) {
  const box = document.getElementById('chat-messages');
  const d = document.createElement('div');
  d.className = 'msg ' + (isMe ? 'me' : 'them');
  d.innerHTML = '<div class="name">' + (isMe ? 'You' : name) + '</div>' + escHtml(msg);
  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
}

function escHtml(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}
