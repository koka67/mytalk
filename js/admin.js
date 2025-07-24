document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logout-btn');
    const userList = document.getElementById('user-list');
    const createUserForm = document.getElementById('create-user-form');
    
    // Check admin authentication
    getCurrentUser().then(user => {
        if (!user || !isAdmin(user.username)) {
            window.location.href = 'index.html';
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
        getAllUsers().then(users => {
            userList.innerHTML = '';
            
            users.forEach(user => {
                const userItem = document.createElement('div');
                userItem.className = 'user-item';
                
                const userInfo = document.createElement('div');
                userInfo.className = 'user-info';
                
                const statusIndicator = document.createElement('span');
                statusIndicator.className = 'user-status ' + 
                    (user.status === USER_STATUS.ACTIVE ? 'active' : 'inactive');
                
                const usernameSpan = document.createElement('span');
                usernameSpan.textContent = user.username;
                
                const phoneSpan = document.createElement('span');
                phoneSpan.textContent = ' | ' + user.phone;
                phoneSpan.style.marginLeft = '0.5rem';
                phoneSpan.style.color = '#666';
                
                userInfo.appendChild(statusIndicator);
                userInfo.appendChild(usernameSpan);
                userInfo.appendChild(phoneSpan);
                
                const userActions = document.createElement('div');
                userActions.className = 'user-actions';
                
                if (user.status === USER_STATUS.PENDING) {
                    const approveBtn = document.createElement('button');
                    approveBtn.textContent = 'Approve';
                    approveBtn.className = 'btn';
                    approveBtn.addEventListener('click', () => {
                        updateUserStatus(user.uid, USER_STATUS.ACTIVE).then(() => {
                            loadUsers();
                        });
                    });
                    userActions.appendChild(approveBtn);
                }
                
                if (user.status === USER_STATUS.ACTIVE) {
                    const deactivateBtn = document.createElement('button');
                    deactivateBtn.textContent = 'Deactivate';
                    deactivateBtn.className = 'btn';
                    deactivateBtn.addEventListener('click', () => {
                        updateUserStatus(user.uid, USER_STATUS.INACTIVE).then(() => {
                            loadUsers();
                        });
                    });
                    userActions.appendChild(deactivateBtn);
                } else if (user.status === USER_STATUS.INACTIVE) {
                    const activateBtn = document.createElement('button');
                    activateBtn.textContent = 'Activate';
                    activateBtn.className = 'btn';
                    activateBtn.addEventListener('click', () => {
                        updateUserStatus(user.uid, USER_STATUS.ACTIVE).then(() => {
                            loadUsers();
                        });
                    });
                    userActions.appendChild(activateBtn);
                }
                
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.className = 'btn';
                deleteBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this user?')) {
                        deleteUser(user.uid).then(() => {
                            loadUsers();
                        });
                    }
                });
                userActions.appendChild(deleteBtn);
                
                userItem.appendChild(userInfo);
                userItem.appendChild(userActions);
                userList.appendChild(userItem);
            });
        });
    }
    
    // Create new user form
    createUserForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('new-username').value;
        const password = document.getElementById('new-password').value;
        const phone = document.getElementById('new-phone').value;
        
        // Check if username exists
        database.ref('users').orderByChild('username').equalTo(username).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    alert('Username already exists');
                } else {
                    // Create new user
                    auth.signInAnonymously()
                        .then(() => {
                            const userId = auth.currentUser.uid;
                            return createUserInDatabase(userId, username, password, phone, USER_STATUS.ACTIVE);
                        })
                        .then(() => {
                            alert('User created successfully');
                            createUserForm.reset();
                            loadUsers();
                        })
                        .catch(error => {
                            alert('Error: ' + error.message);
                        });
                }
            });
    });
    
    // Initial load
    loadUsers();
    
    // Listen for user changes
    listenForUserStatusChanges(() => {
        loadUsers();
    });
});