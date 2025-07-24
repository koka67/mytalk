// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();

// Predefined admin accounts
const adminAccounts = {
    "aungthura142492": "247161",
    "admin2": "247161"
};

// Check if user is admin
function isAdmin(username) {
    return adminAccounts.hasOwnProperty(username);
}

// User status constants
const USER_STATUS = {
    PENDING: "pending",
    ACTIVE: "active",
    INACTIVE: "inactive"
};

// Get current user data
function getCurrentUser() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(user => {
            if (user) {
                database.ref('users/' + user.uid).once('value').then(snapshot => {
                    const userData = snapshot.val();
                    resolve({
                        uid: user.uid,
                        ...userData
                    });
                });
            } else {
                resolve(null);
            }
        });
    });
}

// Get all users
function getAllUsers() {
    return database.ref('users').once('value').then(snapshot => {
        const users = [];
        snapshot.forEach(childSnapshot => {
            users.push({
                uid: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        return users;
    });
}

// Get user by ID
function getUserById(uid) {
    return database.ref('users/' + uid).once('value').then(snapshot => {
        return snapshot.val();
    });
}

// Create new user in database
function createUserInDatabase(uid, username, password, phone, status = USER_STATUS.PENDING) {
    return database.ref('users/' + uid).set({
        username: username,
        password: password, // Note: In production, never store plain text passwords
        phone: phone,
        status: status,
        lastActive: null,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    });
}

// Update user status
function updateUserStatus(uid, status) {
    return database.ref('users/' + uid + '/status').set(status);
}

// Delete user
function deleteUser(uid) {
    return database.ref('users/' + uid).remove();
}

// Send message
function sendMessage(senderUid, receiverUid, message) {
    const messageId = database.ref().child('messages').push().key;
    const timestamp = firebase.database.ServerValue.TIMESTAMP;
    
    return database.ref('messages/' + messageId).set({
        sender: senderUid,
        receiver: receiverUid,
        message: message,
        timestamp: timestamp,
        read: false
    });
}

// Get messages between two users
function getMessagesBetweenUsers(user1Uid, user2Uid) {
    return database.ref('messages').orderByChild('timestamp').once('value').then(snapshot => {
        const messages = [];
        snapshot.forEach(childSnapshot => {
            const message = childSnapshot.val();
            if ((message.sender === user1Uid && message.receiver === user2Uid) || 
                (message.sender === user2Uid && message.receiver === user1Uid)) {
                messages.push({
                    id: childSnapshot.key,
                    ...message
                });
            }
        });
        return messages;
    });
}

// Update user's last active time
function updateLastActive(uid) {
    return database.ref('users/' + uid + '/lastActive').set(firebase.database.ServerValue.TIMESTAMP);
}

// Listen for new messages
function listenForNewMessages(uid, callback) {
    return database.ref('messages').orderByChild('timestamp').on('child_added', snapshot => {
        const message = snapshot.val();
        if (message.receiver === uid) {
            callback({
                id: snapshot.key,
                ...message
            });
        }
    });
}

// Listen for user status changes
function listenForUserStatusChanges(callback) {
    return database.ref('users').on('value', snapshot => {
        const users = [];
        snapshot.forEach(childSnapshot => {
            users.push({
                uid: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        callback(users);
    });
}