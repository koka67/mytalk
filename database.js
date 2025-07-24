// Database to store users and messages
const database = {
  users: [
    { id: 1, username: 'admin', password: 'aungthura142492', active: true, approved: true },
    { id: 2, username: 'admin2', password: '247161', active: true, approved: true }
  ],
  pendingUsers: [],
  messages: [],
  activeSessions: []
};

// User functions
function addUser(username, password) {
  const newUser = {
    id: database.users.length + 1,
    username,
    password,
    active: false,
    approved: false
  };
  database.pendingUsers.push(newUser);
  return newUser;
}

function approveUser(userId) {
  const index = database.pendingUsers.findIndex(u => u.id === userId);
  if (index !== -1) {
    const user = database.pendingUsers[index];
    user.approved = true;
    user.active = true;
    database.users.push(user);
    database.pendingUsers.splice(index, 1);
    return user;
  }
  return null;
}

function rejectUser(userId) {
  const index = database.pendingUsers.findIndex(u => u.id === userId);
  if (index !== -1) {
    database.pendingUsers.splice(index, 1);
    return true;
  }
  return false;
}

function getUserByUsername(username) {
  return database.users.find(u => u.username === username);
}

function loginUser(username, password) {
  const user = database.users.find(u => 
    u.username === username && u.password === password && u.approved
  );
  
  if (user) {
    // Check if user is already logged in
    const existingSession = database.activeSessions.find(s => s.userId === user.id);
    if (!existingSession) {
      user.active = true;
      database.activeSessions.push({ userId: user.id, lastActive: new Date() });
    }
    return user;
  }
  return null;
}

function logoutUser(userId) {
  const user = database.users.find(u => u.id === userId);
  if (user) {
    user.active = false;
    const sessionIndex = database.activeSessions.findIndex(s => s.userId === userId);
    if (sessionIndex !== -1) {
      database.activeSessions.splice(sessionIndex, 1);
    }
    return true;
  }
  return false;
}

function getActiveUsers() {
  return database.users.filter(u => u.active);
}

function getPendingUsers() {
  return database.pendingUsers;
}

// Message functions
function addMessage(senderId, receiverId, content) {
  const message = {
    id: database.messages.length + 1,
    senderId,
    receiverId,
    content,
    timestamp: new Date(),
    read: false
  };
  database.messages.push(message);
  return message;
}

function getMessagesBetweenUsers(user1Id, user2Id) {
  return database.messages.filter(m => 
    (m.senderId === user1Id && m.receiverId === user2Id) ||
    (m.senderId === user2Id && m.receiverId === user1Id)
  ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function getUserById(userId) {
  return database.users.find(u => u.id === userId);
}

// Export all functions
module.exports = {
  addUser,
  approveUser,
  rejectUser,
  getUserByUsername,
  loginUser,
  logoutUser,
  getActiveUsers,
  getPendingUsers,
  addMessage,
  getMessagesBetweenUsers,
  getUserById
};