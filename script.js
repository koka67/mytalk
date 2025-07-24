// Import database functions
const db = require('./database');

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const signupScreen = document.getElementById('signup-screen');
const adminScreen = document.getElementById('admin-screen');
const userDashboard = document.getElementById('user-dashboard');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const newUsernameInput = document.getElementById('new-username');
const newPasswordInput = document.getElementById('new-password');
const submitSignupBtn = document.getElementById('submit-signup');
const backToLoginBtn = document.getElementById('back-to-login');
const adminLogoutBtn = document.getElementById('admin-logout');
const userLogoutBtn = document.getElementById('user-logout');
const usersList = document.getElementById('users-list');
const chatContainer = document.getElementById('chat-container');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const backToListBtn = document.getElementById('back-to-list');
const callBtn = document.getElementById('call-btn');
const receiverNameSpan = document.getElementById('receiver-name');
const pendingUsersList = document.getElementById('pending-users-list');
const allUsersList = document.getElementById('all-users-list');

// App State
let currentUser = null;
let currentReceiver = null;
let isAdmin = false;

// Initialize the app
function init() {
  setupEventListeners();
  showLoginScreen();
}

// Set up event listeners
function setupEventListeners() {
  loginBtn.addEventListener('click', handleLogin);
  signupBtn.addEventListener('click', showSignupScreen);
  submitSignupBtn.addEventListener('click', handleSignup);
  backToLoginBtn.addEventListener('click', showLoginScreen);
  adminLogoutBtn.addEventListener('click', handleLogout);
  userLogoutBtn.addEventListener('click', handleLogout);
  backToListBtn.addEventListener('click', showUserList);
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  callBtn.addEventListener('click', initiateCall);
}

// Show login screen
function showLoginScreen() {
  loginScreen.classList.remove('hidden');
  signupScreen.classList.add('hidden');
  adminScreen.classList.add('hidden');
  userDashboard.classList.add('hidden');
  usernameInput.value = '';
  passwordInput.value = '';
  currentUser = null;
  isAdmin = false;
}

// Show signup screen
function showSignupScreen() {
  loginScreen.classList.add('hidden');
  signupScreen.classList.remove('hidden');
  newUsernameInput.value = '';
  newPasswordInput.value = '';
}

// Handle login
function handleLogin() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    showNotification('Please enter both username and password');
    return;
  }

  const user = db.loginUser(username, password);
  
  if (user) {
    currentUser = user;
    
    if (username === 'admin' || username === 'admin2') {
      isAdmin = true;
      showAdminScreen();
    } else {
      showUserDashboard();
    }
  } else {
    showNotification('Invalid username or password');
  }
}

// Handle signup
function handleSignup() {
  const username = newUsernameInput.value.trim();
  const password = newPasswordInput.value.trim();

  if (!username || !password) {
    showNotification('Please enter both username and password');
    return;
  }

  if (db.getUserByUsername(username)) {
    showNotification('Username already exists');
    return;
  }

  db.addUser(username, password);
  showNotification('Signup request submitted. Waiting for admin approval.');
  showLoginScreen();
}

// Handle logout
function handleLogout() {
  if (currentUser) {
    db.logoutUser(currentUser.id);
    showLoginScreen();
  }
}

// Show admin screen
function showAdminScreen() {
  loginScreen.classList.add('hidden');
  signupScreen.classList.add('hidden');
  adminScreen.classList.remove('hidden');
  userDashboard.classList.add('hidden');
  renderPendingUsers();
  renderAllUsers();
}

// Render pending users for admin approval
function renderPendingUsers() {
  const pendingUsers = db.getPendingUsers();
  pendingUsersList.innerHTML = '';

  if (pendingUsers.length === 0) {
    pendingUsersList.innerHTML = '<p>No pending user requests</p>';
    return;
  }

  pendingUsers.forEach(user => {
    const userElement = document.createElement('div');
    userElement.className = 'admin-user-item';
    userElement.innerHTML = `
      <span>${user.username}</span>
      <div class="admin-actions">
        <button class="approve-btn" data-id="${user.id}">Approve</button>
        <button class="reject-btn" data-id="${user.id}">Reject</button>
      </div>
    `;
    pendingUsersList.appendChild(userElement);
  });

  // Add event listeners to approve/reject buttons
  document.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const userId = parseInt(e.target.getAttribute('data-id'));
      db.approveUser(userId);
      renderPendingUsers();
      renderAllUsers();
    });
  });

  document.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const userId = parseInt(e.target.getAttribute('data-id'));
      db.rejectUser(userId);
      renderPendingUsers();
    });
  });
}

// Render all users for admin
function renderAllUsers() {
  const allUsers = db.users;
  allUsersList.innerHTML = '';

  allUsers.forEach(user => {
    const userElement = document.createElement('div');
    userElement.className = 'admin-user-item';
    userElement.innerHTML = `
      <span>${user.username} <span class="status-indicator ${user.active ? 'online' : 'offline'}"></span></span>
      <div>
        ${user.approved ? 'Approved' : 'Pending'}
      </div>
    `;
    allUsersList.appendChild(userElement);
  });
}

// Show user dashboard
function showUserDashboard() {
  loginScreen.classList.add('hidden');
  signupScreen.classList.add('hidden');
  adminScreen.classList.add('hidden');
  userDashboard.classList.remove('hidden');
  chatContainer.classList.add('hidden');
  renderUserList();
  
  // Simulate periodic updates
  setInterval(() => {
    renderUserList();
    if (currentReceiver) {
      renderChatMessages(currentReceiver.id);
    }
  }, 3000);
}

// Render user list
function renderUserList() {
  const users = db.users.filter(user => user.id !== currentUser.id && user.approved);
  usersList.innerHTML = '';

  if (users.length === 0) {
    usersList.innerHTML = '<p>No other users available</p>';
    return;
  }

  users.forEach(user => {
    const userElement = document.createElement('div');
    userElement.className = 'user-item';
    userElement.innerHTML = `
      <span>${user.username} <span class="status-indicator ${user.active ? 'online' : 'offline'}"></span></span>
      <span>${user.active ? 'Online' : 'Offline'}</span>
    `;
    userElement.addEventListener('click', () => {
      currentReceiver = user;
      showChatWithUser();
    });
    usersList.appendChild(userElement);
  });
}

// Show chat with selected user
function showChatWithUser() {
  usersList.parentElement.classList.add('hidden');
  chatContainer.classList.remove('hidden');
  receiverNameSpan.textContent = currentReceiver.username;
  renderChatMessages(currentReceiver.id);
}

// Show user list from chat
function showUserList() {
  usersList.parentElement.classList.remove('hidden');
  chatContainer.classList.add('hidden');
  currentReceiver = null;
}

// Render chat messages
function renderChatMessages(receiverId) {
  const messages = db.getMessagesBetweenUsers(currentUser.id, receiverId);
  chatMessages.innerHTML = '';

  messages.forEach(message => {
    const isSent = message.senderId === currentUser.id;
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
    messageElement.textContent = message.content;
    chatMessages.appendChild(messageElement);
  });

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message
function sendMessage() {
  const content = messageInput.value.trim();
  if (!content || !currentReceiver) return;

  db.addMessage(currentUser.id, currentReceiver.id, content);
  messageInput.value = '';
  renderChatMessages(currentReceiver.id);
  
  // Show notification to receiver if online
  if (currentReceiver.active) {
    showNotification(`New message from ${currentUser.username}`);
  }
}

// Initiate call
function initiateCall() {
  if (!currentReceiver) return;
  
  if (currentReceiver.active) {
    showNotification(`Calling ${currentReceiver.username}...`);
    // In a real app, this would initiate a WebRTC call
  } else {
    showNotification(`${currentReceiver.username} is offline and cannot receive calls`);
  }
}

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Initialize the app
init();