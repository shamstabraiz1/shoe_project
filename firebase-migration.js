/**
 * Firebase Migration Helper
 * Migrates existing localStorage data to Firebase
 */

class FirebaseMigration {
    constructor() {
        this.migrationStatus = {
            cart: false,
            products: false,
            orders: false,
            inventory: false,
            salesLog: false,
            returns: false
        };
    }

    /**
     * Migrate all localStorage data to Firebase
     */
    async migrateAll() {
        console.log('🚀 Starting Firebase migration...');

        try {
            // Wait for Firebase to be ready
            await this.waitForFirebase();

            // Migrate each data type
            await this.migrateCart();
            await this.migrateProducts();
            await this.migrateOrders();
            await this.migrateInventory();
            await this.migrateSalesLog();
            await this.migrateReturns();

            console.log('✅ Firebase migration completed successfully!');
            this.showMigrationSummary();

        } catch (error) {
            console.error('❌ Firebase migration failed:', error);
        }
    }

    /**
     * Wait for Firebase to be ready
     */
    async waitForFirebase() {
        return new Promise((resolve) => {
            if (window.firebaseDB && window.firebaseDB.isInitialized) {
                resolve();
            } else {
                window.addEventListener('firebaseReady', () => {
                    resolve();
                });
            }
        });
    }

    /**
     * Migrate cart data
     */
    async migrateCart() {
        try {
            const cartData = localStorage.getItem('shoepoint_cart');
            if (cartData) {
                const cart = JSON.parse(cartData);
                await window.firebaseDB.saveCart(cart);
                console.log('✅ Cart migrated to Firebase');
                this.migrationStatus.cart = true;
            }
        } catch (error) {
            console.error('❌ Cart migration failed:', error);
        }
    }

    /**
     * Migrate products data
     */
    async migrateProducts() {
        try {
            const productsData = localStorage.getItem('shoepoint_admin_products');
            if (productsData) {
                const products = JSON.parse(productsData);
                await window.firebaseDB.saveProducts(products);
                console.log('✅ Products migrated to Firebase');
                this.migrationStatus.products = true;
            }
        } catch (error) {
            console.error('❌ Products migration failed:', error);
        }
    }

    /**
     * Migrate orders data
     */
    async migrateOrders() {
        try {
            const ordersData = localStorage.getItem('shoepoint_orders');
            if (ordersData) {
                const orders = JSON.parse(ordersData);

                // Save each order individually
                for (const order of orders) {
                    await window.firebaseDB.saveOrder(order);
                }

                console.log('✅ Orders migrated to Firebase');
                this.migrationStatus.orders = true;
            }
        } catch (error) {
            console.error('❌ Orders migration failed:', error);
        }
    }

    /**
     * Migrate inventory data
     */
    async migrateInventory() {
        try {
            const inventoryData = localStorage.getItem('shoepoint_inventory');
            if (inventoryData) {
                const inventory = JSON.parse(inventoryData);
                await window.firebaseDB.saveInventory(inventory);
                console.log('✅ Inventory migrated to Firebase');
                this.migrationStatus.inventory = true;
            }
        } catch (error) {
            console.error('❌ Inventory migration failed:', error);
        }
    }

    /**
     * Migrate sales log data
     */
    async migrateSalesLog() {
        try {
            const salesLogData = localStorage.getItem('shoepoint_sales_log');
            if (salesLogData) {
                const salesLog = JSON.parse(salesLogData);
                await window.firebaseDB.saveSalesLog(salesLog);
                console.log('✅ Sales log migrated to Firebase');
                this.migrationStatus.salesLog = true;
            }
        } catch (error) {
            console.error('❌ Sales log migration failed:', error);
        }
    }

    /**
     * Migrate returns data
     */
    async migrateReturns() {
        try {
            const returnsData = localStorage.getItem('shoepoint_returns_log');
            if (returnsData) {
                const returns = JSON.parse(returnsData);
                await window.firebaseDB.saveReturns(returns);
                console.log('✅ Returns migrated to Firebase');
                this.migrationStatus.returns = true;
            }
        } catch (error) {
            console.error('❌ Returns migration failed:', error);
        }
    }

    /**
     * Show migration summary
     */
    showMigrationSummary() {
        const migrated = Object.values(this.migrationStatus).filter(status => status).length;
        const total = Object.keys(this.migrationStatus).length;

        console.log(`📊 Migration Summary: ${migrated}/${total} data types migrated`);

        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification(
                `Firebase migration completed! ${migrated}/${total} data types migrated successfully.`,
                'success'
            );
        }
    }

    /**
     * Clear localStorage after successful migration (optional)
     */
    clearLocalStorage() {
        const keys = [
            'shoepoint_cart',
            'shoepoint_admin_products',
            'shoepoint_orders',
            'shoepoint_inventory',
            'shoepoint_sales_log',
            'shoepoint_returns_log'
        ];

        keys.forEach(key => {
            localStorage.removeItem(key);
        });

        console.log('🧹 localStorage cleared after migration');
    }

    /**
     * Check if migration is needed
     */
    isMigrationNeeded() {
        const keys = [
            'shoepoint_cart',
            'shoepoint_admin_products',
            'shoepoint_orders',
            'shoepoint_inventory',
            'shoepoint_sales_log',
            'shoepoint_returns_log'
        ];

        return keys.some(key => localStorage.getItem(key) !== null);
    }
}

// Create global instance
const firebaseMigration = new FirebaseMigration();

// Make it globally available
window.FirebaseMigration = FirebaseMigration;
window.firebaseMigration = firebaseMigration;

// Auto-migrate when Firebase is ready (if needed)
window.addEventListener('firebaseReady', async () => {
    if (firebaseMigration.isMigrationNeeded()) {
        console.log('📦 LocalStorage data detected, starting migration...');
        await firebaseMigration.migrateAll();

        // Optionally clear localStorage after migration
        // firebaseMigration.clearLocalStorage();
    } else {
        console.log('ℹ️ No migration needed');
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FirebaseMigration, firebaseMigration };
}