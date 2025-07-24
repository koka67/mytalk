document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('user-logout-btn');
    const activeUserList = document.getElementById('active-user-list');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const callBtn = document.getElementById('call-btn');
    const chatWithUser = document.getElementById('chat-with-user');
    
    let currentUser = null;
    let selectedUser = null;
    let users = [];
    
    // Check user authentication
    getCurrentUser().then(user => {
        if (!user || user.status !== USER_STATUS.ACTIVE) {
            window.location.href = 'index.html';
        } else {
            currentUser = user;
            updateLastActive(currentUser.uid);
            loadUsers();
        }
    });
    
    // Logout button
    logoutBtn.addEventListener('click', function() {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        });
    });
    
    // Load all users
    function loadUsers() {
        getAllUsers().then(allUsers => {
            users = allUsers.filter(user => 
                user.uid !== currentUser.uid && 
                user.status === USER_STATUS.ACTIVE
            );
            
            activeUserList.innerHTML = '';
            
            users.forEach(user => {
                const userItem = document.createElement('div');
                userItem.className = 'user-item';
                
                const userInfo = document.createElement('div');
                userInfo.className = 'user-info';
                
                const statusIndicator = document.createElement('span');
                statusIndicator.className = 'user-status ' + 
                    (user.lastActive && Date.now() - user.lastActive < 300000 ? 'active' : 'inactive');
                
                const usernameSpan = document.createElement('span');
                usernameSpan.textContent = user.username;
                
                userInfo.appendChild(statusIndicator);
                userInfo.appendChild(usernameSpan);
                userItem.appendChild(userInfo);
                
                userItem.addEventListener('click', () => {
                    selectUser(user);
                });
                
                activeUserList.appendChild(userItem);
            });
            
            // Select first user by default if none selected
            if (users.length > 0 && !selectedUser) {
                selectUser(users[0]);
            }
        });
    }
    
    // Select a user to chat with
    function selectUser(user) {
        selectedUser = user;
        chatWithUser.textContent = 'Chat with ' + user.username;
        
        // Load messages
        getMessagesBetweenUsers(currentUser.uid, user.uid).then(messages => {
            chatMessages.innerHTML = '';
            
            messages.sort((a, b) => a.timestamp - b.timestamp).forEach(message => {
                displayMessage(message);
            });
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }
    
    // Display a message in the chat
    function displayMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ' + 
            (message.sender === currentUser.uid ? 'sent' : 'received');
        
        const senderName = message.sender === currentUser.uid ? 
            'You' : 
            users.find(u => u.uid === message.sender)?.username || 'Unknown';
        
        messageDiv.innerHTML = `
            <strong>${senderName}</strong><br>
            ${message.message}
            <div class="message-time">${formatTime(message.timestamp)}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
    }
    
    // Format timestamp
    function formatTime(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Send message
    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText && selectedUser) {
            sendMessage(currentUser.uid, selectedUser.uid, messageText)
                .then(() => {
                    messageInput.value = '';
                    
                    // Update last active time
                    updateLastActive(currentUser.uid);
                })
                .catch(error => {
                    console.error('Error sending message:', error);
                });
        }
    }
    
    // Send button click
    sendBtn.addEventListener('click', sendMessage);
    
    // Enter key in message input
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Call button
    callBtn.addEventListener('click', function() {
        if (selectedUser) {
            alert(`Calling ${selectedUser.username} at ${selectedUser.phone}`);
            // In a real app, you would implement actual calling functionality here
            // For example using WebRTC or a phone dialer
        }
    });
    
    // Listen for new messages
    listenForNewMessages(currentUser.uid, message => {
        // Only show if it's from the currently selected user
        if (selectedUser && message.sender === selectedUser.uid) {
            displayMessage(message);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            // Show notification for new messages from other users
            const sender = users.find(u => u.uid === message.sender);
            if (sender) {
                showNotification(`New message from ${sender.username}`);
            }
        }
    });
    
    // Listen for user status changes
    listenForUserStatusChanges(() => {
        loadUsers();
    });
    
    // Show notification
    function showNotification(message) {
        if (!('Notification' in window)) {
            return;
        }
        
        if (Notification.permission === 'granted') {
            new Notification(message);
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(message);
                }
            });
        }
    }
    
    // Request notification permission on page load
    if ('Notification' in window) {
        Notification.requestPermission();
    }
});