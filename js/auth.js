document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const statusMessage = document.getElementById('status-message');
    
    loginTab.addEventListener('click', function() {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    });
    
    signupTab.addEventListener('click', function() {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
    });
    
    // Login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        // Check if it's an admin login
        if (isAdmin(username)) {
            if (adminAccounts[username] === password) {
                // Admin login successful
                auth.signInAnonymously()
                    .then(() => {
                        // Redirect to admin page
                        window.location.href = 'admin.html';
                    })
                    .catch(error => {
                        showStatusMessage('Error: ' + error.message, 'error');
                    });
            } else {
                showStatusMessage('Invalid admin password', 'error');
            }
            return;
        }
        
        // Regular user login
        database.ref('users').orderByChild('username').equalTo(username).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    const userData = Object.values(snapshot.val())[0];
                    const userId = Object.keys(snapshot.val())[0];
                    
                    if (userData.password === password) {
                        if (userData.status === USER_STATUS.ACTIVE) {
                            // User is active, log them in
                            auth.signInAnonymously()
                                .then(() => {
                                    // Update last active time
                                    updateLastActive(userId);
                                    // Redirect to user page
                                    window.location.href = 'user.html';
                                })
                                .catch(error => {
                                    showStatusMessage('Error: ' + error.message, 'error');
                                });
                        } else if (userData.status === USER_STATUS.PENDING) {
                            showStatusMessage('Your account is pending admin approval', 'error');
                        } else {
                            showStatusMessage('Your account is inactive', 'error');
                        }
                    } else {
                        showStatusMessage('Invalid password', 'error');
                    }
                } else {
                    showStatusMessage('Username not found', 'error');
                }
            })
            .catch(error => {
                showStatusMessage('Error: ' + error.message, 'error');
            });
    });
    
    // Signup form submission
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
        const phone = document.getElementById('signup-phone').value;
        
        // Check if username already exists
        database.ref('users').orderByChild('username').equalTo(username).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    showStatusMessage('Username already exists', 'error');
                } else {
                    // Create new user
                    auth.signInAnonymously()
                        .then(() => {
                            const userId = auth.currentUser.uid;
                            return createUserInDatabase(userId, username, password, phone);
                        })
                        .then(() => {
                            showStatusMessage('Account created successfully. Waiting for admin approval.', 'success');
                            signupForm.reset();
                        })
                        .catch(error => {
                            showStatusMessage('Error: ' + error.message, 'error');
                        });
                }
            })
            .catch(error => {
                showStatusMessage('Error: ' + error.message, 'error');
            });
    });
    
    // Check if user is already logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            database.ref('users/' + user.uid).once('value')
                .then(snapshot => {
                    const userData = snapshot.val();
                    if (userData) {
                        if (isAdmin(userData.username)) {
                            window.location.href = 'admin.html';
                        } else if (userData.status === USER_STATUS.ACTIVE) {
                            window.location.href = 'user.html';
                        }
                    }
                });
        }
    });
    
    // Helper function to show status messages
    function showStatusMessage(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-container ' + type;
        setTimeout(() => {
            statusMessage.textContent = '';
            statusMessage.className = 'status-container';
        }, 5000);
    }
});