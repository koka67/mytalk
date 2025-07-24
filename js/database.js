// Database setup using IndexedDB
const DB_NAME = 'MyTalkDB';
const DB_VERSION = 1;
const STORE_NAME = 'users';

let db;

// Initialize database
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject('Database error');
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'username' });
                store.createIndex('username', 'username', { unique: true });
                
                // Add initial admin account with the specified password
                store.put({ 
                    username: 'admin', 
                    password: 'aungthura142492', 
                    status: false 
                });
            }
        };
    });
}

// Get all users from database
function getAllUsers() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onerror = (event) => {
            reject('Error fetching users');
        };
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
    });
}

// Add user to database
function addUser(username, password) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add({ username, password, status: false });
        
        request.onerror = (event) => {
            reject('Error adding user');
        };
        
        request.onsuccess = (event) => {
            resolve();
        };
    });
}

// Delete user from database
function deleteUserDB(username) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(username);
        
        request.onerror = (event) => {
            reject('Error deleting user');
        };
        
        request.onsuccess = (event) => {
            resolve();
        };
    });
}

// Update user status in database
function updateUserStatus(username, status) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const getRequest = store.get(username);
        
        getRequest.onerror = (event) => {
            reject('Error updating user status');
        };
        
        getRequest.onsuccess = (event) => {
            const user = event.target.result;
            if (user) {
                user.status = status;
                const putRequest = store.put(user);
                
                putRequest.onerror = (event) => {
                    reject('Error updating user status');
                };
                
                putRequest.onsuccess = (event) => {
                    resolve();
                };
            } else {
                reject('User not found');
            }
        };
    });
}

// Export functions
const database = {
    initDB,
    getAllUsers,
    addUser,
    deleteUserDB,
    updateUserStatus
};