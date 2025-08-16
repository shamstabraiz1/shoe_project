/**
 * Firebase Configuration for Shoe Point E-commerce
 * This file contains Firebase setup and initialization
 */

// Firebase Configuration - REAL CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyBnlLcAEFdJjVyb7NPyvrkKn6mBOQQZd0",
    authDomain: "shoe-point-8684b.firebaseapp.com",
    projectId: "shoe-point-8684b",
    storageBucket: "shoe-point-8684b.firebasestorage.app",
    messagingSenderId: "86295064531",
    appId: "1:86295064531:web:07935ad46fc245c33ed7db",
    measurementId: "G-SSNMW39RLV"
};

// Initialize Firebase
let app, db, auth, analytics;

// Firebase initialization function
async function initializeFirebase() {
    try {
        // Import Firebase modules
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, connectFirestoreEmulator } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const { getAuth, connectAuthEmulator } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { getAnalytics } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js');

        // Initialize Firebase
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        
        // Initialize Analytics (optional)
        if (typeof window !== 'undefined') {
            analytics = getAnalytics(app);
        }

        console.log('🔥 Firebase initialized successfully!');
        return { app, db, auth, analytics };
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        throw error;
    }
}

// Export Firebase instances
window.firebaseApp = app;
window.firebaseDB = db;
window.firebaseAuth = auth;

// Auto-initialize Firebase when script loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeFirebase();
        console.log('🚀 Firebase ready for use!');
        
        // Trigger custom event to notify other scripts
        window.dispatchEvent(new CustomEvent('firebaseReady', { 
            detail: { app, db, auth, analytics } 
        }));
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        // Fallback to localStorage if Firebase fails
        console.warn('⚠️ Falling back to localStorage mode');
        window.dispatchEvent(new CustomEvent('firebaseFallback'));
    }
});

// Utility functions for Firebase operations
const FirebaseUtils = {
    /**
     * Check if Firebase is ready
     */
    isReady() {
        return !!(app && db && auth);
    },

    /**
     * Get current user
     */
    getCurrentUser() {
        return auth?.currentUser || null;
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getCurrentUser();
    },

    /**
     * Get user ID for database operations
     */
    getUserId() {
        const user = this.getCurrentUser();
        return user ? user.uid : 'anonymous';
    },

    /**
     * Handle Firebase errors
     */
    handleError(error, operation = 'Firebase operation') {
        console.error(`❌ ${operation} failed:`, error);
        
        // User-friendly error messages
        const errorMessages = {
            'auth/user-not-found': 'User not found. Please check your email.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'Email is already registered. Please sign in.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'permission-denied': 'You do not have permission to perform this action.',
            'unavailable': 'Service is temporarily unavailable. Please try again later.'
        };

        const userMessage = errorMessages[error.code] || error.message || 'An unexpected error occurred.';
        
        // Show user-friendly notification
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification(userMessage, 'error');
        } else {
            alert(userMessage);
        }

        return userMessage;
    }
};

// Make FirebaseUtils globally available
window.FirebaseUtils = FirebaseUtils;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { firebaseConfig, initializeFirebase, FirebaseUtils };
}