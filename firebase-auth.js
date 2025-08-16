/**
 * Firebase Authentication Service for Shoe Point E-commerce
 * Handles user authentication, registration, and session management
 */

class FirebaseAuth {
    constructor() {
        this.auth = null;
        this.currentUser = null;
        this.isInitialized = false;
        
        // Wait for Firebase to be ready
        this.initPromise = this.waitForFirebase();
    }

    /**
     * Wait for Firebase to be initialized
     */
    async waitForFirebase() {
        return new Promise((resolve) => {
            if (window.firebaseAuth) {
                this.auth = window.firebaseAuth;
                this.isInitialized = true;
                this.setupAuthListener();
                resolve();
            } else {
                window.addEventListener('firebaseReady', (event) => {
                    this.auth = event.detail.auth;
                    this.isInitialized = true;
                    this.setupAuthListener();
                    resolve();
                });
            }
        });
    }

    /**
     * Setup authentication state listener
     */
    setupAuthListener() {
        if (!this.auth) return;
        
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.handleAuthStateChange(user);
        });
    }

    /**
     * Handle authentication state changes
     */
    handleAuthStateChange(user) {
        if (user) {
            console.log('✅ User signed in:', user.email);
            this.showUserInfo(user);
            this.loadUserData();
        } else {
            console.log('ℹ️ User signed out');
            this.showGuestMode();
        }
        
        // Trigger custom event for other components
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user, isAuthenticated: !!user } 
        }));
    }

    /**
     * Ensure Firebase is ready before operations
     */
    async ensureReady() {
        if (!this.isInitialized) {
            await this.initPromise;
        }
        return this.isInitialized;
    }

    // ===== AUTHENTICATION METHODS =====

    /**
     * Sign up new user with email and password
     */
    async signUp(email, password, displayName = '') {
        try {
            await this.ensureReady();
            const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            // Update display name if provided
            if (displayName) {
                await updateProfile(user, { displayName });
            }
            
            console.log('✅ User created successfully:', user.email);
            return { success: true, user };
        } catch (error) {
            console.error('❌ Sign up failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sign in user with email and password
     */
    async signIn(email, password) {
        try {
            await this.ensureReady();
            const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            console.log('✅ User signed in successfully:', user.email);
            return { success: true, user };
        } catch (error) {
            console.error('❌ Sign in failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            await this.ensureReady();
            const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            await signOut(this.auth);
            console.log('✅ User signed out successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ Sign out failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Reset password
     */
    async resetPassword(email) {
        try {
            await this.ensureReady();
            const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            await sendPasswordResetEmail(this.auth, email);
            console.log('✅ Password reset email sent');
            return { success: true };
        } catch (error) {
            console.error('❌ Password reset failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== USER MANAGEMENT =====

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.currentUser;
    }

    /**
     * Get user ID
     */
    getUserId() {
        return this.currentUser?.uid || null;
    }

    /**
     * Get user email
     */
    getUserEmail() {
        return this.currentUser?.email || null;
    }

    /**
     * Get user display name
     */
    getUserDisplayName() {
        return this.currentUser?.displayName || this.currentUser?.email || 'User';
    }

    // ===== UI MANAGEMENT =====

    /**
     * Show user info in UI
     */
    showUserInfo(user) {
        // Update user display elements
        const userElements = document.querySelectorAll('.user-display-name');
        userElements.forEach(el => {
            el.textContent = user.displayName || user.email;
        });

        // Show authenticated UI elements
        const authElements = document.querySelectorAll('.auth-required');
        authElements.forEach(el => el.style.display = 'block');

        // Hide guest UI elements
        const guestElements = document.querySelectorAll('.guest-only');
        guestElements.forEach(el => el.style.display = 'none');
    }

    /**
     * Show guest mode UI
     */
    showGuestMode() {
        // Hide authenticated UI elements
        const authElements = document.querySelectorAll('.auth-required');
        authElements.forEach(el => el.style.display = 'none');

        // Show guest UI elements
        const guestElements = document.querySelectorAll('.guest-only');
        guestElements.forEach(el => el.style.display = 'block');
    }

    /**
     * Load user-specific data
     */
    async loadUserData() {
        if (!this.isAuthenticated()) return;

        try {
            // Load user's cart
            if (window.CartManager) {
                await window.CartManager.loadFromFirebase();
            }

            // Load user preferences
            // Add more user-specific data loading here
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
        }
    }

    // ===== ADMIN AUTHENTICATION =====

    /**
     * Check if current user is admin
     */
    async isAdmin() {
        if (!this.isAuthenticated()) return false;

        try {
            // Check if user email is in admin list
            const adminEmails = [
                'admin@shoepoint.com',
                'shamstabraiz1@gmail.com' // Add your admin email here
            ];

            return adminEmails.includes(this.getUserEmail());
        } catch (error) {
            console.error('❌ Failed to check admin status:', error);
            return false;
        }
    }

    /**
     * Admin sign in with special handling
     */
    async adminSignIn(email, password) {
        const result = await this.signIn(email, password);
        
        if (result.success) {
            const isAdmin = await this.isAdmin();
            if (isAdmin) {
                console.log('✅ Admin authenticated successfully');
                return { success: true, user: result.user, isAdmin: true };
            } else {
                await this.signOut();
                return { success: false, error: 'Access denied. Admin privileges required.' };
            }
        }
        
        return result;
    }
}

// Create global instance
const firebaseAuth = new FirebaseAuth();

// Make it globally available
window.FirebaseAuth = FirebaseAuth;
window.firebaseAuth = firebaseAuth;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FirebaseAuth, firebaseAuth };
}