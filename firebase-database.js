/**
 * Firebase Database Service for Shoe Point E-commerce
 * Handles all database operations with Firestore
 */

class FirebaseDatabase {
    constructor() {
        this.db = null;
        this.auth = null;
        this.isInitialized = false;
        
        // Wait for Firebase to be ready
        this.initPromise = this.waitForFirebase();
    }

    /**
     * Wait for Firebase to be initialized
     */
    async waitForFirebase() {
        return new Promise((resolve) => {
            // Check if Firebase is already initialized
            if (window.firebaseApp && window.firebaseDB && window.firebaseAuth) {
                this.db = window.firebaseDB; // This is the Firestore instance
                this.auth = window.firebaseAuth; // This is the Auth instance
                this.isInitialized = true;
                resolve();
            } else {
                // Wait for Firebase to be ready
                window.addEventListener('firebaseReady', (event) => {
                    this.db = event.detail.db;
                    this.auth = event.detail.auth;
                    this.isInitialized = true;
                    resolve();
                });
            }
        });
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

    /**
     * Get current user ID
     */
    getUserId() {
        return this.auth?.currentUser?.uid || 'anonymous';
    }

    // ===== CART OPERATIONS =====

    /**
     * Save cart to Firebase
     */
    async saveCart(cartData) {
        try {
            await this.ensureReady();
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const userId = this.getUserId();
            const cartRef = doc(this.db, 'carts', userId);
            
            await setDoc(cartRef, {
                ...cartData,
                updatedAt: new Date(),
                userId: userId
            });
            
            console.log('✅ Cart saved to Firebase');
            return true;
        } catch (error) {
            console.error('❌ Failed to save cart:', error);
            return false;
        }
    }

    /**
     * Load cart from Firebase
     */
    async loadCart() {
        try {
            await this.ensureReady();
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const userId = this.getUserId();
            const cartRef = doc(this.db, 'carts', userId);
            const cartSnap = await getDoc(cartRef);
            
            if (cartSnap.exists()) {
                console.log('✅ Cart loaded from Firebase');
                return cartSnap.data();
            } else {
                console.log('ℹ️ No cart found, creating new one');
                return null;
            }
        } catch (error) {
            console.error('❌ Failed to load cart:', error);
            return null;
        }
    }

    // ===== PRODUCT OPERATIONS =====

    /**
     * Save products to Firebase
     */
    async saveProducts(products) {
        try {
            await this.ensureReady();
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const productsRef = doc(this.db, 'store', 'products');
            await setDoc(productsRef, {
                products: products,
                updatedAt: new Date()
            });
            
            console.log('✅ Products saved to Firebase');
            return true;
        } catch (error) {
            console.error('❌ Failed to save products:', error);
            return false;
        }
    }

    /**
     * Load products from Firebase
     */
    async loadProducts() {
        try {
            await this.ensureReady();
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const productsRef = doc(this.db, 'store', 'products');
            const productsSnap = await getDoc(productsRef);
            
            if (productsSnap.exists()) {
                console.log('✅ Products loaded from Firebase');
                return productsSnap.data().products || [];
            } else {
                console.log('ℹ️ No products found');
                return [];
            }
        } catch (error) {
            console.error('❌ Failed to load products:', error);
            return [];
        }
    }

    // ===== ORDER OPERATIONS =====

    /**
     * Save order to Firebase
     */
    async saveOrder(orderData) {
        try {
            await this.ensureReady();
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const ordersRef = collection(this.db, 'orders');
            const docRef = await addDoc(ordersRef, {
                ...orderData,
                createdAt: new Date(),
                userId: this.getUserId()
            });
            
            console.log('✅ Order saved to Firebase with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Failed to save order:', error);
            return null;
        }
    }

    /**
     * Load orders from Firebase
     */
    async loadOrders() {
        try {
            await this.ensureReady();
            const { collection, query, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const ordersRef = collection(this.db, 'orders');
            const q = query(ordersRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            
            const orders = [];
            querySnapshot.forEach((doc) => {
                orders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log('✅ Orders loaded from Firebase:', orders.length);
            return orders;
        } catch (error) {
            console.error('❌ Failed to load orders:', error);
            return [];
        }
    }

    /**
     * Delete order from Firebase
     */
    async deleteOrder(orderId) {
        try {
            await this.ensureReady();
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const orderRef = doc(this.db, 'orders', orderId);
            await deleteDoc(orderRef);
            
            console.log('✅ Order deleted from Firebase with ID:', orderId);
            return true;
        } catch (error) {
            console.error('❌ Failed to delete order:', error);
            return false;
        }
    }

    // ===== INVENTORY OPERATIONS =====

    /**
     * Save inventory to Firebase
     */
    async saveInventory(inventory) {
        try {
            await this.ensureReady();
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const inventoryRef = doc(this.db, 'store', 'inventory');
            await setDoc(inventoryRef, {
                inventory: inventory,
                updatedAt: new Date()
            });
            
            console.log('✅ Inventory saved to Firebase');
            return true;
        } catch (error) {
            console.error('❌ Failed to save inventory:', error);
            return false;
        }
    }

    /**
     * Load inventory from Firebase
     */
    async loadInventory() {
        try {
            await this.ensureReady();
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const inventoryRef = doc(this.db, 'store', 'inventory');
            const inventorySnap = await getDoc(inventoryRef);
            
            if (inventorySnap.exists()) {
                console.log('✅ Inventory loaded from Firebase');
                return inventorySnap.data().inventory || [];
            } else {
                console.log('ℹ️ No inventory found');
                return [];
            }
        } catch (error) {
            console.error('❌ Failed to load inventory:', error);
            return [];
        }
    }

    // ===== SALES LOG OPERATIONS =====

    /**
     * Save sales log to Firebase
     */
    async saveSalesLog(salesLog) {
        try {
            await this.ensureReady();
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const salesRef = doc(this.db, 'store', 'salesLog');
            await setDoc(salesRef, {
                salesLog: salesLog,
                updatedAt: new Date()
            });
            
            console.log('✅ Sales log saved to Firebase');
            return true;
        } catch (error) {
            console.error('❌ Failed to save sales log:', error);
            return false;
        }
    }

    /**
     * Load sales log from Firebase
     */
    async loadSalesLog() {
        try {
            await this.ensureReady();
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const salesRef = doc(this.db, 'store', 'salesLog');
            const salesSnap = await getDoc(salesRef);
            
            if (salesSnap.exists()) {
                console.log('✅ Sales log loaded from Firebase');
                return salesSnap.data().salesLog || [];
            } else {
                console.log('ℹ️ No sales log found');
                return [];
            }
        } catch (error) {
            console.error('❌ Failed to load sales log:', error);
            return [];
        }
    }

    // ===== RETURNS OPERATIONS =====

    /**
     * Save returns to Firebase
     */
    async saveReturns(returns) {
        try {
            await this.ensureReady();
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const returnsRef = doc(this.db, 'store', 'returns');
            await setDoc(returnsRef, {
                returns: returns,
                updatedAt: new Date()
            });
            
            console.log('✅ Returns saved to Firebase');
            return true;
        } catch (error) {
            console.error('❌ Failed to save returns:', error);
            return false;
        }
    }

    /**
     * Load returns from Firebase
     */
    async loadReturns() {
        try {
            await this.ensureReady();
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const returnsRef = doc(this.db, 'store', 'returns');
            const returnsSnap = await getDoc(returnsRef);
            
            if (returnsSnap.exists()) {
                console.log('✅ Returns loaded from Firebase');
                return returnsSnap.data().returns || [];
            } else {
                console.log('ℹ️ No returns found');
                return [];
            }
        } catch (error) {
            console.error('❌ Failed to load returns:', error);
            return [];
        }
    }

    // ===== REAL-TIME OPERATIONS =====

    /**
     * Listen to real-time cart updates
     */
    async listenToCart(callback) {
        try {
            await this.ensureReady();
            const { doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const userId = this.getUserId();
            const cartRef = doc(this.db, 'carts', userId);
            
            return onSnapshot(cartRef, (doc) => {
                if (doc.exists()) {
                    callback(doc.data());
                }
            });
        } catch (error) {
            console.error('❌ Failed to listen to cart updates:', error);
            return null;
        }
    }

    /**
     * Listen to real-time inventory updates
     */
    async listenToInventory(callback) {
        try {
            await this.ensureReady();
            const { doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const inventoryRef = doc(this.db, 'store', 'inventory');
            
            return onSnapshot(inventoryRef, (doc) => {
                if (doc.exists()) {
                    callback(doc.data().inventory || []);
                }
            });
        } catch (error) {
            console.error('❌ Failed to listen to inventory updates:', error);
            return null;
        }
    }
}

// Create global instance
const firebaseDatabase = new FirebaseDatabase();

// Make it globally available
window.FirebaseDatabase = FirebaseDatabase;
window.firebaseDatabase = firebaseDatabase; // Use different name to avoid conflict

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FirebaseDatabase, firebaseDB };
}