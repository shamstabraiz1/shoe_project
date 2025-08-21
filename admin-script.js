/**
 * Shoe Point Admin Dashboard
 * Complete admin management system
 */

console.log('Admin Dashboard loaded successfully');

// ===== CONFIGURATION =====
const ADMIN_CONFIG = {
    CREDENTIALS: {
        username: 'admin',
        password: 'shoepoint123'
    },
    STORAGE_KEYS: {
        adminAuth: 'shoepoint_admin_auth',
        products: 'shoepoint_admin_products',
        orders: 'shoepoint_orders',
        customers: 'shoepoint_customers',
        settings: 'shoepoint_admin_settings'
    }
};

// ===== UTILITY FUNCTIONS =====
const AdminUtils = {
    /**
     * Format currency in Pakistani Rupees
     */
    formatCurrency: (amount) => {
        return `Rs.${amount.toLocaleString()}`;
    },

    /**
     * Format date for display
     */
    formatDate: (date) => {
        if (!date) return 'N/A';
        
        try {
            let dateObj;
            
            // Handle Firestore Timestamp objects
            if (date && typeof date === 'object' && date.toDate && typeof date.toDate === 'function') {
                // Firestore Timestamp object
                dateObj = date.toDate();
            } else if (typeof date === 'string') {
                // ISO string format
                dateObj = new Date(date);
            } else if (typeof date === 'number') {
                // Timestamp number
                dateObj = new Date(date);
            } else if (date instanceof Date) {
                // Already a Date object
                dateObj = date;
            } else {
                // Try to create Date object
                dateObj = new Date(date);
            }
            
            // Check if date is valid
            if (isNaN(dateObj.getTime())) {
                console.warn('Invalid date value:', date);
                return 'Invalid Date';
            }
            
            return dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', error, 'Date value:', date);
            return 'Invalid Date';
        }
    },

    /**
     * Generate unique ID
     */
    generateId: () => {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Show notification
     */
    showNotification: (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `admin-notification admin-notification--${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            notification.style.transition = 'all 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};

// ===== AUTHENTICATION MANAGER =====
const AuthManager = {
    /**
     * Check if admin is logged in
     */
    isLoggedIn() {
        const auth = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.adminAuth);
        if (!auth) return false;

        try {
            const authData = JSON.parse(auth);
            const now = Date.now();
            // Session expires after 24 hours
            return authData.timestamp && (now - authData.timestamp) < 24 * 60 * 60 * 1000;
        } catch (error) {
            return false;
        }
    },

    /**
     * Login admin
     */
    login(username, password) {
        if (username === ADMIN_CONFIG.CREDENTIALS.username &&
            password === ADMIN_CONFIG.CREDENTIALS.password) {

            const authData = {
                username: username,
                timestamp: Date.now(),
                sessionId: AdminUtils.generateId()
            };

            localStorage.setItem(ADMIN_CONFIG.STORAGE_KEYS.adminAuth, JSON.stringify(authData));
            return true;
        }
        return false;
    },

    /**
     * Logout admin
     */
    logout() {
        localStorage.removeItem(ADMIN_CONFIG.STORAGE_KEYS.adminAuth);
        window.location.reload();
    }
};

// ===== WEBSITE INTEGRATION =====
const WebsiteIntegration = {
    /**
     * Sync products with main website
     */
    syncProductsToWebsite() {
        const products = DataManager.getProducts();
        // Store products in a format the main website can use
        localStorage.setItem('website_products', JSON.stringify(products));

        // Trigger website update if it's open
        try {
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage({
                    type: 'PRODUCTS_UPDATED',
                    products: products
                }, '*');
            }
        } catch (error) {
            console.log('Website not open or accessible');
        }
    },

    /**
     * Listen for orders from main website
     */
    listenForOrders() {
        window.addEventListener('message', (event) => {
            if (event.data.type === 'NEW_ORDER') {
                console.log('New order received:', event.data.order);
                AdminUtils.showNotification('New order received!');

                // Refresh dashboard if on overview
                if (AdminDashboard.currentSection === 'overview') {
                    AdminDashboard.loadDashboardData();
                }
            }
        });
    },

    listenForRealtimeOrders() {
        if (window.firebaseDatabase && typeof window.firebaseDatabase.db !== 'undefined') {
            import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js').then(({ collection, onSnapshot }) => {
                const ordersRef = collection(window.firebaseDatabase.db, 'orders');
                onSnapshot(ordersRef, (snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            AdminUtils.showNotification('New order placed!', 'success');
                            // Optionally reload orders table
                            if (typeof AdminDashboard !== 'undefined' && AdminDashboard.currentSection === 'orders') {
                                AdminDashboard.loadOrders();
                            }
                        }
                    });
                });
            });
        }
    }
};

// ===== DATA MANAGER =====
const DataManager = {
    /**
     * Initialize default products if none exist
     */
    initializeProducts() {
        const existingProducts = this.getProducts();
        if (existingProducts.length === 0) {
            const defaultProducts = [
                {
                    id: 'prod_1',
                    name: 'Hiking Shoes for Adventurers',
                    price: 5500,
                    description: 'Durable hiking shoes perfect for outdoor adventures',
                    category: 'hiking',
                    image: 'card 1.webp',
                    sizes: ['7', '8', '9'],
                    inStock: true,
                    createdAt: Date.now()
                },
                {
                    id: 'prod_2',
                    name: 'High-Top Basketball Shoes',
                    price: 4000,
                    description: 'Professional basketball shoes for court performance',
                    category: 'basketball',
                    image: 'card 2.webp',
                    sizes: ['8', '9', '10'],
                    inStock: true,
                    createdAt: Date.now()
                },
                {
                    id: 'prod_3',
                    name: 'Soccer Cleats for Speed',
                    price: 2850,
                    description: 'Lightweight soccer cleats for maximum speed',
                    category: 'soccer',
                    image: 'card 4.webp',
                    sizes: ['7', '8', '9'],
                    inStock: true,
                    createdAt: Date.now()
                },
                {
                    id: 'prod_4',
                    name: 'Lightweight Running Shoes',
                    price: 3000,
                    description: 'Ultra-light running shoes for daily training',
                    category: 'running',
                    image: 'card 6.webp',
                    sizes: ['7', '8', '10'],
                    inStock: true,
                    createdAt: Date.now()
                },
                {
                    id: 'prod_5',
                    name: 'Air Jordan 5 Retro',
                    price: 9999,
                    description: 'Classic Air Jordan 5 Retro - Best Seller',
                    category: 'basketball',
                    image: 'sl1.webp',
                    sizes: ['8', '9', '10'],
                    inStock: true,
                    createdAt: Date.now()
                },
                {
                    id: 'prod_6',
                    name: 'Professional Tennis Shoes',
                    price: 3200,
                    description: 'Court-ready tennis shoes for competitive play',
                    category: 'tennis',
                    image: 'sc4.webp',
                    sizes: ['7', '9', '10'],
                    inStock: true,
                    createdAt: Date.now()
                }
            ];

            this.saveProducts(defaultProducts);
        }
    },

    /**
     * Get all products
     */
    getProducts() {
        try {
            const products = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.products);
            return products ? JSON.parse(products) : [];
        } catch (error) {
            console.error('Error loading products:', error);
            return [];
        }
    },

    /**
     * Save products
     */
    saveProducts(products) {
        try {
            localStorage.setItem(ADMIN_CONFIG.STORAGE_KEYS.products, JSON.stringify(products));
        } catch (error) {
            console.error('Error saving products:', error);
        }
    },

    /**
     * Add new product
     */
    addProduct(productData) {
        const products = this.getProducts();
        const newProduct = {
            id: AdminUtils.generateId(),
            ...productData,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        products.push(newProduct);
        this.saveProducts(products);
        return newProduct;
    },

    /**
     * Update product
     */
    updateProduct(productId, updates) {
        const products = this.getProducts();
        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex !== -1) {
            products[productIndex] = {
                ...products[productIndex],
                ...updates,
                updatedAt: Date.now()
            };
            this.saveProducts(products);
            return products[productIndex];
        }
        return null;
    },

    /**
     * Delete product
     */
    deleteProduct(productId) {
        const products = this.getProducts();
        const filteredProducts = products.filter(p => p.id !== productId);
        this.saveProducts(filteredProducts);
        return filteredProducts.length < products.length;
    },

    /**
     * Get all orders
     */
    getOrders() {
        try {
            const orders = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.orders);
            return orders ? JSON.parse(orders) : [];
        } catch (error) {
            console.error('Error loading orders:', error);
            return [];
        }
    },

    /**
     * Get all customers
     */
    getCustomers() {
        const orders = this.getOrders();
        const customersMap = new Map();

        orders.forEach(order => {
            if (order.customerInfo && order.customerInfo.email) {
                const email = order.customerInfo.email;
                if (!customersMap.has(email)) {
                    customersMap.set(email, {
                        id: order.customerId,
                        name: order.customerInfo.name || 'Unknown',
                        email: email,
                        phone: order.customerInfo.phone || '',
                        totalOrders: 0,
                        totalSpent: 0,
                        lastOrder: null
                    });
                }

                const customer = customersMap.get(email);
                customer.totalOrders++;
                customer.totalSpent += order.payment.amount;

                if (!customer.lastOrder || order.createdAt > customer.lastOrder) {
                    customer.lastOrder = order.createdAt;
                }
            }
        });

        return Array.from(customersMap.values());
    },

    /**
     * Get dashboard statistics
     */
    getStats() {
        const orders = this.getOrders();
        const products = this.getProducts();
        const customers = this.getCustomers();

        const totalRevenue = orders.reduce((sum, order) => sum + (order.payment?.amount || 0), 0);
        const totalOrders = orders.length;
        const totalProducts = products.length;
        const totalCustomers = customers.length;

        return {
            totalRevenue,
            totalOrders,
            totalProducts,
            totalCustomers
        };
    }
};

// ===== ADMIN DASHBOARD MANAGER =====
const AdminDashboard = {
    currentSection: 'overview',
    currentProduct: null,

    /**
     * Initialize dashboard
     */
    init() {
        console.log('Initializing Admin Dashboard...');

        try {
            // Check authentication
            const isLoggedIn = AuthManager.isLoggedIn();
            console.log('Authentication check result:', isLoggedIn);

            if (!isLoggedIn) {
                console.log('User not logged in, showing login screen');
                this.showLoginScreen();
                return;
            }

            console.log('User is logged in, initializing dashboard...');

            // Initialize data
            DataManager.initializeProducts();
            console.log('Products initialized');

            // Show dashboard
            this.showDashboard();
            console.log('Dashboard shown');

            // Setup event listeners
            this.setupEventListeners();
            console.log('Event listeners set up');

            // Setup real-time notifications
            this.setupRealTimeNotifications();
            console.log('Real-time notifications set up');

            // Load initial data
            this.loadDashboardData();
            console.log('Dashboard data loaded');

            // Initialize website integration
            WebsiteIntegration.listenForOrders();
            console.log('Website integration initialized');

        } catch (error) {
            console.error('Error during dashboard initialization:', error);
            alert('Error initializing dashboard: ' + error.message);
        }

        // After dashboard initialization
        if (typeof AdminDashboard !== 'undefined' && typeof AdminDashboard.listenForRealtimeOrders === 'function') {
            AdminDashboard.listenForRealtimeOrders();
        }
    },

    /**
     * Setup real-time notifications
     */
    setupRealTimeNotifications() {
        // Listen for new orders via BroadcastChannel
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('shoepoint_admin');
            channel.addEventListener('message', (event) => {
                if (event.data.type === 'NEW_ORDER') {
                    this.handleNewOrderNotification(event.data.order);
                }
            });
        }

        // Check for notifications in localStorage periodically
        setInterval(() => {
            this.checkForNotifications();
        }, 5000); // Check every 5 seconds
    },

    /**
     * Handle new order notification
     */
    handleNewOrderNotification(order) {
        // Show notification
        AdminUtils.showNotification(`New order received! Order #${order.orderId} - ${AdminUtils.formatCurrency(order.totals.total)}`);

        // Update dashboard if on overview
        if (this.currentSection === 'overview') {
            this.loadDashboardData();
        }

        // Update orders if on orders section
        if (this.currentSection === 'orders') {
            this.loadOrders();
        }

        // Play notification sound (optional)
        this.playNotificationSound();
    },

    /**
     * Check for notifications in localStorage
     */
    checkForNotifications() {
        try {
            const notifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
            const unreadNotifications = notifications.filter(n => !n.read);

            unreadNotifications.forEach(notification => {
                if (notification.type === 'NEW_ORDER') {
                    this.handleNewOrderNotification(notification.order);
                }
                notification.read = true;
            });

            // Update localStorage with read notifications
            if (unreadNotifications.length > 0) {
                localStorage.setItem('admin_notifications', JSON.stringify(notifications));
            }
        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    },

    /**
     * Play notification sound
     */
    playNotificationSound() {
        try {
            // Create a simple notification sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    },

    /**
     * Show login screen
     */
    showLoginScreen() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-dashboard').style.display = 'none';
    },

    /**
     * Show dashboard
     */
    showDashboard() {
        console.log('Showing dashboard...');

        const loginScreen = document.getElementById('login-screen');
        const adminDashboard = document.getElementById('admin-dashboard');

        console.log('Login screen element:', loginScreen);
        console.log('Admin dashboard element:', adminDashboard);

        if (loginScreen) {
            loginScreen.style.display = 'none';
            console.log('Login screen hidden');
        } else {
            console.error('Login screen element not found!');
        }

        if (adminDashboard) {
            adminDashboard.style.display = 'flex';
            console.log('Admin dashboard shown');
        } else {
            console.error('Admin dashboard element not found!');
        }
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', AuthManager.logout);
        }

        // Sidebar navigation
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const section = item.getAttribute('data-section');
                this.switchSection(section);
            });
        });

        // Add product button
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => this.showProductModal());
        }

        // Product form
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', this.handleProductSubmit.bind(this));
        }

        // Modal close
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeProductModal());
        }

        // Click outside modal to close
        const modal = document.getElementById('product-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeProductModal();
                }
            });
        }
    },

    /**
     * Handle login form submission
     */
    handleLogin(e) {
        e.preventDefault();
        console.log('Login form submitted');

        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        const loginBtn = document.querySelector('.login-btn');
        const loginText = document.querySelector('.login-text');
        const loginSpinner = document.querySelector('.login-spinner');

        console.log('Login attempt:', { username, password: '***' });
        console.log('Button elements:', { loginBtn, loginText, loginSpinner });

        if (!loginBtn || !loginText || !loginSpinner) {
            console.error('Login button elements not found!');
            return;
        }

        // Show loading state
        loginBtn.disabled = true;
        loginText.style.display = 'none';
        loginSpinner.style.display = 'inline';

        // Validate credentials immediately
        console.log('Checking credentials...');
        const isValidLogin = (username === 'admin' && password === 'shoepoint123');
        console.log('Credentials valid:', isValidLogin);

        // Simulate login delay
        setTimeout(() => {
            if (isValidLogin && AuthManager.login(username, password)) {
                console.log('Login successful, showing dashboard');

                try {
                    // Reset button state first
                    loginBtn.disabled = false;
                    loginText.style.display = 'inline';
                    loginSpinner.style.display = 'none';

                    // Hide login screen and show dashboard
                    console.log('Calling showDashboard...');
                    this.showDashboard();

                    // Initialize dashboard components
                    console.log('Initializing dashboard components...');
                    DataManager.initializeProducts();

                    // Initialize physical sales system
                    if (typeof PhysicalSalesManager !== 'undefined') {
                        console.log('Initializing Physical Sales Manager...');
                        PhysicalSalesManager.initializeInventory();
                    } else {
                        console.warn('PhysicalSalesManager not found');
                    }

                    this.loadDashboardData();
                    this.setupRealTimeNotifications();
                    WebsiteIntegration.listenForOrders();

                    AdminUtils.showNotification('Login successful! Welcome to Admin Dashboard.');
                    console.log('Login process completed successfully');

                } catch (error) {
                    console.error('Error during login process:', error);
                    AdminUtils.showNotification('Error loading dashboard: ' + error.message, 'error');

                    // Reset button state on error
                    loginBtn.disabled = false;
                    loginText.style.display = 'inline';
                    loginSpinner.style.display = 'none';
                }

            } else {
                console.log('Login failed - invalid credentials');
                AdminUtils.showNotification('Invalid credentials. Please try again.', 'error');

                // Reset button state
                loginBtn.disabled = false;
                loginText.style.display = 'inline';
                loginSpinner.style.display = 'none';
            }
        }, 1000);
    },

    /**
     * Switch dashboard section
     */
    switchSection(sectionName) {
        // Update current section
        this.currentSection = sectionName;

        // Update sidebar active state
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update sections visibility
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');

        // Update page title
        const titles = {
            overview: 'Dashboard Overview',
            products: 'Product Management',
            orders: 'Order Management',
            customers: 'Customer Management',

            analytics: 'Analytics & Reports',
            settings: 'Store Settings'
        };

        const subtitles = {
            overview: "Welcome back! Here's what's happening with your store.",
            products: 'Manage your shoe inventory, prices, and details',
            orders: 'Track and manage customer orders',
            customers: 'View and manage your customers',

            analytics: 'Track your store performance and insights',
            settings: 'Configure your store preferences and payment settings'
        };

        document.getElementById('page-title').textContent = titles[sectionName];
        document.getElementById('page-subtitle').textContent = subtitles[sectionName];

        // Load section-specific data
        this.loadSectionData(sectionName);
    },

    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        let orders = [];
        if (window.firebaseDatabase && typeof window.firebaseDatabase.loadOrders === 'function') {
            try {
                orders = await window.firebaseDatabase.loadOrders();
            } catch (e) {
                console.error('Failed to load orders from Firebase:', e);
                orders = [];
            }
        } else {
            orders = []; // Don't use localStorage fallback
        }
        
        // Apply the same filtering logic as loadOrders
        const realOrders = orders.filter(order => {
            const customerName = order.customerInfo?.name || '';
            const customerEmail = order.customerInfo?.email || '';
            
            // Filter out test orders
            const isTestOrder = customerName === 'Test Customer' || 
                               customerName === 'Guest' || 
                               customerName === 'VIP Customer' ||
                               customerEmail.includes('test') ||
                               customerEmail.includes('demo') ||
                               customerName.toLowerCase().includes('test') ||
                               customerName.toLowerCase().includes('demo');
            
            // Filter out orders without proper customer info
            const hasValidCustomerInfo = customerName && 
                                        customerEmail && 
                                        customerEmail.includes('@') &&
                                        order.customerInfo?.phone &&
                                        order.customerInfo?.address?.street;
            
            return !isTestOrder && hasValidCustomerInfo;
        });
        
        const totalRevenue = realOrders.reduce((sum, order) => sum + (order.payment?.amount || 0), 0);
        const totalOrders = realOrders.length;
        
        const totalOrdersEl = document.getElementById('total-orders');
        const onlineRevenueEl = document.getElementById('online-revenue');
        
        if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
        if (onlineRevenueEl) onlineRevenueEl.textContent = AdminUtils.formatCurrency(totalRevenue);
        
        console.log(`📊 Dashboard stats: ${totalOrders} real orders, ${AdminUtils.formatCurrency(totalRevenue)} revenue`);
    },

    /**
     * Load statistics
     */
    loadStats() {
        const stats = DataManager.getStats();
        const physicalStats = this.getPhysicalSalesStats();

        // Update existing elements with null checks
        const totalRevenueEl = document.getElementById('total-revenue');
        if (totalRevenueEl) totalRevenueEl.textContent = AdminUtils.formatCurrency(stats.totalRevenue);

        const physicalRevenueEl = document.getElementById('physical-revenue');
        if (physicalRevenueEl) physicalRevenueEl.textContent = AdminUtils.formatCurrency(physicalStats.totalRevenue);

        const physicalTransactionsEl = document.getElementById('physical-transactions');
        if (physicalTransactionsEl) physicalTransactionsEl.textContent = `${physicalStats.totalTransactions} transactions`;

        const totalOrdersEl = document.getElementById('total-orders');
        if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders;

        const totalStockEl = document.getElementById('total-stock');
        if (totalStockEl) totalStockEl.textContent = physicalStats.totalStock;

        const stockAlertsEl = document.getElementById('stock-alerts');
        if (stockAlertsEl) stockAlertsEl.textContent = physicalStats.stockAlert;

        // Update legacy elements if they exist (for backward compatibility)
        const totalProductsEl = document.getElementById('total-products');
        if (totalProductsEl) totalProductsEl.textContent = stats.totalProducts;

        const totalCustomersEl = document.getElementById('total-customers');
        if (totalCustomersEl) totalCustomersEl.textContent = stats.totalCustomers;
    },

    /**
     * Get physical sales statistics
     */
    getPhysicalSalesStats() {
        try {
            const salesLog = JSON.parse(localStorage.getItem('shoepoint_sales_log') || '[]');
            const inventory = JSON.parse(localStorage.getItem('shoepoint_inventory') || '[]');
            const returns = typeof ReturnManager !== 'undefined' ? ReturnManager.getReturns() : [];

            // Calculate revenue including returns
            const grossRevenue = salesLog.reduce((sum, sale) => sum + (sale.total || 0), 0);
            const totalRefunds = returns.reduce((sum, returnRecord) => sum + (returnRecord.refundAmount || 0), 0);
            const netRevenue = grossRevenue - totalRefunds;

            const totalTransactions = salesLog.length;
            const totalReturns = returns.length;
            const totalStock = inventory.reduce((sum, item) => sum + (item.stock || 0), 0);
            const lowStockItems = inventory.filter(item => item.stock < 2 && item.stock > 0).length;
            const outOfStockItems = inventory.filter(item => item.stock === 0).length;

            let stockAlert = 'All in stock';
            if (outOfStockItems > 0) {
                stockAlert = `${outOfStockItems} out of stock`;
            } else if (lowStockItems > 0) {
                stockAlert = `${lowStockItems} low stock`;
            }

            return {
                totalRevenue: netRevenue, // Net revenue after returns
                grossRevenue: grossRevenue,
                totalRefunds: totalRefunds,
                totalTransactions,
                totalReturns,
                totalStock,
                stockAlert,
                lowStockItems,
                outOfStockItems
            };
        } catch (error) {
            console.warn('Error getting physical sales stats:', error);
            return {
                totalRevenue: 0,
                totalTransactions: 0,
                totalStock: 0,
                stockAlert: 'Error loading',
                lowStockItems: 0,
                outOfStockItems: 0
            };
        }
    },

    /**
     * Load recent orders
     */
    loadRecentOrders() {
        const orders = DataManager.getOrders();
        const recentOrders = orders.slice(-5).reverse(); // Last 5 orders

        const container = document.getElementById('recent-orders');

        if (recentOrders.length === 0) {
            container.innerHTML = '<p class="no-data">No orders yet. Orders will appear here once customers start purchasing.</p>';
            return;
        }

        container.innerHTML = recentOrders.map(order => `
            <div class="recent-order-item" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #e1e5e9;
            ">
                <div>
                    <strong>Order #${order.orderId}</strong><br>
                    <small style="color: #7f8c8d;">${AdminUtils.formatDate(order.createdAt)}</small>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600;">${AdminUtils.formatCurrency(order.payment.amount)}</div>
                    <span class="status-badge status-${order.status}">${order.status}</span>
                </div>
            </div>
        `).join('');
    },

    /**
     * Load physical sales data for dashboard widgets
     */
    loadPhysicalSalesData() {
        try {
            console.log('Loading physical sales data...');

            // Initialize physical sales if not already done (only once)
            if (typeof PhysicalSalesManager !== 'undefined') {
                const inventory = JSON.parse(localStorage.getItem('shoepoint_inventory') || '[]');
                if (inventory.length === 0) {
                    PhysicalSalesManager.initializeInventory();
                }
            }

            this.loadQuickSellWidget();
            this.loadRecentPhysicalSales();
            this.loadStockAlerts();

            console.log('Physical sales data loaded successfully');
        } catch (error) {
            console.error('Error loading physical sales data:', error);
        }
    },

    /**
     * Load return data and initialize return functionality
     */
    loadReturnData() {
        try {
            // Load returnable sales into dropdown
            if (typeof loadReturnSaleOptions === 'function') {
                loadReturnSaleOptions();
            }
            
            // Load recent returns for display
            this.loadRecentReturns();
            
            console.log('Return data loaded successfully');
        } catch (error) {
            console.error('Error loading return data:', error);
        }
    },

    /**
     * Load recent returns for dashboard display
     */
    loadRecentReturns() {
        if (typeof ReturnManager === 'undefined') return;
        
        const recentReturns = ReturnManager.getReturnHistory().slice(0, 5);
        const container = document.getElementById('recent-returns');
        
        if (!container) return;
        
        if (recentReturns.length === 0) {
            container.innerHTML = '<p class="no-data">No returns processed yet.</p>';
            return;
        }
        
        container.innerHTML = recentReturns.map(returnRecord => `
            <div class="recent-return-item">
                <div>
                    <strong>Return #${returnRecord.returnId.substr(-8)}</strong><br>
                    <small>${returnRecord.productName} (${returnRecord.size}/${returnRecord.color})</small><br>
                    <small>Qty: ${returnRecord.returnQuantity} | Refund: Rs.${returnRecord.refundAmount}</small>
                </div>
                <div style="text-align: right;">
                    <small style="color: #7f8c8d;">${AdminUtils.formatDate(returnRecord.processedAt)}</small>
                </div>
            </div>
        `).join('');
    },

    /**
     * Load quick sell widget
     */
    loadQuickSellWidget() {
        // Initialize inventory if empty
        let inventory = JSON.parse(localStorage.getItem('shoepoint_inventory') || '[]');
        if (inventory.length === 0 && typeof PhysicalSalesManager !== 'undefined') {
            PhysicalSalesManager.initializeInventory();
            inventory = JSON.parse(localStorage.getItem('shoepoint_inventory') || '[]');
        }

        const select = document.getElementById('dashboard-product-select');
        console.log('Loading quick sell widget, select element:', select);
        console.log('Inventory items:', inventory.length);

        if (!select) {
            console.warn('Dashboard product select not found');
            return;
        }

        select.innerHTML = '<option value="">Select product to sell...</option>';

        inventory.forEach(item => {
            if (item.stock > 0) {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = `${item.name} (${item.stock} available)`;
                select.appendChild(option);
            }
        });

        console.log('Quick sell widget loaded with', select.options.length - 1, 'products');

        // Load dashboard inventory only once
        if (!this._dashboardInventoryLoaded) {
            this.loadDashboardInventory();
            this._dashboardInventoryLoaded = true;
        }
    },

    /**
     * Load dashboard inventory list
     */
    loadDashboardInventory() {
        const inventory = JSON.parse(localStorage.getItem('shoepoint_inventory') || '[]');
        const container = document.getElementById('dashboard-inventory-list');

        if (!container) return;

        if (inventory.length === 0) {
            container.innerHTML = '<p class="no-data">No products found. Click "Add Product" to get started!</p>';
            return;
        }

        container.innerHTML = inventory.map(item => {
            const stockClass = item.stock === 0 ? 'out' : item.stock < 2 ? 'low' : 'good';
            const stockText = item.stock === 0 ? 'Out of Stock' : `${item.stock} in stock`;

            return `
                <div class="inventory-item-mini">
                    <div class="inventory-item-info">
                        <div class="inventory-item-name">${item.name}</div>
                        <div class="inventory-item-details">
                            Rs ${item.price.toLocaleString()} • ${item.category}
                            ${item.sizes ? ` • Sizes: ${item.sizes.join(', ')}` : ''}
                            ${item.colors ? ` • Colors: ${item.colors.join(', ')}` : ''}
                        </div>
                    </div>
                    <div class="inventory-item-stock ${stockClass}">${stockText}</div>
                    <div class="inventory-item-actions">
                        <button onclick="editDashboardProduct(${item.id})" class="action-btn-mini edit-btn-mini" title="Edit">✏️</button>
                        <button onclick="deleteDashboardProduct(${item.id})" class="action-btn-mini delete-btn-mini" title="Delete">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Load recent physical sales
     */
    loadRecentPhysicalSales() {
        const salesLog = JSON.parse(localStorage.getItem('shoepoint_sales_log') || '[]');
        const container = document.getElementById('recent-physical-sales');

        if (!container) return;

        if (salesLog.length === 0) {
            container.innerHTML = '<p class="no-data">No sales yet.</p>';
            return;
        }

        const recentSales = salesLog.slice(0, 4); // Show 4 recent sales
        container.innerHTML = recentSales.map(sale => {
            const date = new Date(sale.timestamp);
            let optionsText = '';
            if (sale.size || sale.color) {
                const parts = [];
                if (sale.size) parts.push(`Size ${sale.size}`);
                if (sale.color) parts.push(sale.color);
                optionsText = ` • ${parts.join(', ')}`;
            }

            return `
                <div class="sale-item-mini">
                    <div class="sale-product-mini">${sale.productName}${optionsText}</div>
                    <div class="sale-details-mini">Quantity: ${sale.quantity}</div>
                    <div class="sale-price-breakdown">Rs ${sale.price.toLocaleString()} × ${sale.quantity} = Rs ${sale.total.toLocaleString()}</div>
                    <div class="sale-date">${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            `;
        }).join('');
    },

    /**
     * Load stock alerts
     */
    loadStockAlerts() {
        const inventory = JSON.parse(localStorage.getItem('shoepoint_inventory') || '[]');
        const container = document.getElementById('stock-alerts-widget');

        if (!container) return;

        const lowStockItems = inventory.filter(item => item.stock < 2 && item.stock > 0);
        const outOfStockItems = inventory.filter(item => item.stock === 0);

        if (lowStockItems.length === 0 && outOfStockItems.length === 0) {
            container.innerHTML = '<p class="no-data">All in stock.</p>';
            return;
        }

        let alertsHtml = '';

        // Show only first 2 out of stock items
        outOfStockItems.slice(0, 2).forEach(item => {
            alertsHtml += `
                <div class="stock-alert-mini out">
                    <div class="alert-product-mini">${item.name}</div>
                    <div class="alert-stock-mini">Out of stock</div>
                </div>
            `;
        });

        // Show only first 2 low stock items
        lowStockItems.slice(0, 2).forEach(item => {
            alertsHtml += `
                <div class="stock-alert-mini low">
                    <div class="alert-product-mini">${item.name}</div>
                    <div class="alert-stock-mini">${item.stock} left</div>
                </div>
            `;
        });

        container.innerHTML = alertsHtml;
    },

    /**
     * Load section-specific data
     */
    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'overview':
                this.loadDashboardData();
                // Ensure physical sales system is initialized
                if (typeof PhysicalSalesManager !== 'undefined') {
                    PhysicalSalesManager.initializeInventory();
                }
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'customers':
                this.loadCustomers();
                break;
            case 'physical-sales':
                console.log('Loading physical sales section...');
                if (typeof PhysicalSalesManager !== 'undefined') {
                    PhysicalSalesManager.init();
                    // Load default tab (inventory)
                    setTimeout(() => {
                        if (typeof switchPhysicalTab !== 'undefined') {
                            switchPhysicalTab('inventory');
                        }
                    }, 100);
                } else {
                    console.error('PhysicalSalesManager not found');
                }
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    },

    /**
     * Load products
     */
    loadProducts() {
        const products = DataManager.getProducts();
        const container = document.getElementById('admin-products-grid');

        if (products.length === 0) {
            container.innerHTML = '<p class="no-data">No products found. Click "Add New Product" to get started.</p>';
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="admin-product-card">
                <img src="${product.image}" alt="${product.name}" class="admin-product-image">
                <div class="admin-product-content">
                    <h4 class="admin-product-title">${product.name}</h4>
                    <p class="admin-product-price">${AdminUtils.formatCurrency(product.price)}</p>
                    <p style="font-size: 12px; color: #7f8c8d; margin-bottom: 12px;">
                        Category: ${product.category} | Sizes: ${product.sizes.join(', ')}
                    </p>
                    <div class="admin-product-actions">
                        <button class="edit-btn" onclick="AdminDashboard.editProduct('${product.id}')">Edit</button>
                        <button class="delete-btn" onclick="AdminDashboard.deleteProduct('${product.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Load orders
     */
    async loadOrders() {
        let orders = [];
        
        // Clear localStorage orders on first load to prevent old test data
        if (localStorage.getItem('localStorage_orders_cleared') !== 'true') {
            localStorage.removeItem(ADMIN_CONFIG.STORAGE_KEYS.orders);
            localStorage.setItem('localStorage_orders_cleared', 'true');
            console.log('🧹 Cleared localStorage orders to prevent old test data');
        }
        
        if (window.firebaseDatabase && typeof window.firebaseDatabase.loadOrders === 'function') {
            try {
                orders = await window.firebaseDatabase.loadOrders();
                console.log('✅ Loaded orders from Firebase:', orders.length);
            } catch (e) {
                console.error('Failed to load orders from Firebase:', e);
                // Don't fallback to localStorage to prevent old test data
                orders = [];
            }
        } else {
            console.log('⚠️ Firebase not available, using empty orders array');
            orders = []; // Don't use localStorage fallback
        }
        
        const container = document.getElementById('orders-table');

        if (!orders || orders.length === 0) {
            container.innerHTML = '<p class="no-data">No orders found. Orders will appear here once customers make purchases.</p>';
            return;
        }

        // Enhanced filtering to remove test/guest orders and ensure only real orders
        const realOrders = orders.filter(order => {
            const customerName = order.customerInfo?.name || '';
            const customerEmail = order.customerInfo?.email || '';
            
            // Filter out test orders
            const isTestOrder = customerName === 'Test Customer' || 
                               customerName === 'Guest' || 
                               customerName === 'VIP Customer' ||
                               customerEmail.includes('test') ||
                               customerEmail.includes('demo') ||
                               customerName.toLowerCase().includes('test') ||
                               customerName.toLowerCase().includes('demo');
            
            // Filter out orders without proper customer info
            const hasValidCustomerInfo = customerName && 
                                        customerEmail && 
                                        customerEmail.includes('@') &&
                                        order.customerInfo?.phone &&
                                        order.customerInfo?.address?.street;
            
            return !isTestOrder && hasValidCustomerInfo;
        });

        console.log(`📊 Filtered orders: ${orders.length} total, ${realOrders.length} real orders`);

        if (realOrders.length === 0) {
            container.innerHTML = '<p class="no-data">No real orders found. Only orders with valid customer information are displayed.</p>';
            return;
        }

        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Items</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${realOrders.map(order => {
                        const info = order.customerInfo || {};
                        const address = info.address ? `${info.address.street}, ${info.address.city}, ${info.address.state}, ${info.address.postalCode}, ${info.address.country}` : '';
                        return `
                        <tr>
                            <td><strong>#${order.orderId}</strong></td>
                            <td>${info.name || 'Guest'}</td>
                            <td>${info.email || ''}</td>
                            <td>${info.phone || ''}</td>
                            <td>${address}</td>
                            <td>
                                ${order.items.map(item => `
                                    <div class="order-item-detail">
                                        <strong>${item.name}</strong> x${item.quantity}
                                        <br><small>${AdminUtils.formatCurrency(item.price)} each</small>
                                    </div>
                                `).join('')}
                            </td>
                            <td>${AdminUtils.formatCurrency(order.payment.amount)}</td>
                            <td><span class="status-badge status-${order.status}">${order.status}</span><br>
                                <button class="btn btn-xs btn-clear" onclick="AdminDashboard.clearOrder('${order.id}')">Clear</button>
                            </td>
                            <td>${order.createdAt ? AdminUtils.formatDate(order.createdAt) : '-'}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * Load customers from Firebase orders
     */
    async loadCustomers() {
        console.log('🔄 Loading customers from Firebase...');
        
        try {
            // Check if Firebase is available
            if (!window.firebaseDatabase || typeof window.firebaseDatabase.loadOrders !== 'function') {
                console.error('Firebase not available for loading customers');
                // Fallback to old method
                this.loadCustomersFallback();
                return;
            }

            // Load all orders from Firebase
            const orders = await window.firebaseDatabase.loadOrders();
            console.log('📋 Loaded orders for customer analysis:', orders.length);

            // Filter out test orders and orders without customer info
            const validOrders = orders.filter(order => {
                const customerInfo = order.customerInfo;
                if (!customerInfo || !customerInfo.email) return false;
                
                // Filter out test customers
                const name = customerInfo.name?.toLowerCase() || '';
                const email = customerInfo.email?.toLowerCase() || '';
                if (name.includes('test') || email.includes('test') || 
                    name.includes('demo') || email.includes('demo') ||
                    name === 'guest' || name === 'test customer' || name === 'vip customer') {
                    return false;
                }
                
                return true;
            });

            console.log('✅ Valid orders for customer analysis:', validOrders.length);

            // Process customer data
            const customers = this.processCustomerData(validOrders);
            console.log('👥 Processed customers:', customers.length);

            // Display customers
            this.displayCustomers(customers);

        } catch (error) {
            console.error('Error loading customers from Firebase:', error);
            // Fallback to old method
            this.loadCustomersFallback();
        }
    },

    /**
     * Fallback method using old DataManager
     */
    loadCustomersFallback() {
        console.log('🔄 Using fallback customer loading method...');
        const customers = DataManager.getCustomers();
        const container = document.getElementById('customers-table');

        if (customers.length === 0) {
            container.innerHTML = '<p class="no-data">No customers found. Customer data will appear here after orders are placed.</p>';
            return;
        }

        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Orders</th>
                        <th>Total Spent</th>
                        <th>Last Order</th>
                    </tr>
                </thead>
                <tbody>
                    ${customers.map(customer => `
                        <tr>
                            <td><strong>${customer.name}</strong></td>
                            <td>${customer.email}</td>
                            <td>${customer.phone || 'N/A'}</td>
                            <td>${customer.totalOrders}</td>
                            <td>${AdminUtils.formatCurrency(customer.totalSpent)}</td>
                            <td>${customer.lastOrder ? AdminUtils.formatDate(customer.lastOrder) : 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * Process order data to extract customer information
     */
    processCustomerData(orders) {
        const customersMap = new Map();

        orders.forEach(order => {
            const customerInfo = order.customerInfo;
            if (!customerInfo || !customerInfo.email) return;

            const email = customerInfo.email;
            const orderAmount = order.payment?.amount || 0;

            if (!customersMap.has(email)) {
                customersMap.set(email, {
                    id: order.customerId || email,
                    name: customerInfo.name || 'Unknown',
                    email: email,
                    phone: customerInfo.phone || '',
                    address: this.formatAddress(customerInfo),
                    totalOrders: 0,
                    totalSpent: 0,
                    firstOrder: null,
                    lastOrder: null,
                    orderHistory: [],
                    preferredCategories: new Map(),
                    averageOrderValue: 0
                });
            }

            const customer = customersMap.get(email);
            customer.totalOrders++;
            customer.totalSpent += orderAmount;
            customer.orderHistory.push({
                id: order.id,
                amount: orderAmount,
                date: order.createdAt,
                items: order.items || []
            });

            // Track first and last order dates
            if (!customer.firstOrder || order.createdAt < customer.firstOrder) {
                customer.firstOrder = order.createdAt;
            }
            if (!customer.lastOrder || order.createdAt > customer.lastOrder) {
                customer.lastOrder = order.createdAt;
            }

            // Track preferred categories
            if (order.items) {
                order.items.forEach(item => {
                    const category = item.category || 'Uncategorized';
                    customer.preferredCategories.set(category, (customer.preferredCategories.get(category) || 0) + 1);
                });
            }
        });

        // Calculate average order value and get top category for each customer
        const customers = Array.from(customersMap.values()).map(customer => {
            customer.averageOrderValue = customer.totalSpent / customer.totalOrders;
            
            // Get top preferred category
            let topCategory = 'None';
            let maxCount = 0;
            customer.preferredCategories.forEach((count, category) => {
                if (count > maxCount) {
                    maxCount = count;
                    topCategory = category;
                }
            });
            customer.topCategory = topCategory;

            // Determine customer status
            if (customer.totalOrders >= 5) {
                customer.status = 'VIP';
                customer.statusColor = '#28a745';
            } else if (customer.totalOrders >= 2) {
                customer.status = 'Returning';
                customer.statusColor = '#17a2b8';
            } else {
                customer.status = 'New';
                customer.statusColor = '#6c757d';
            }

            return customer;
        });

        // Sort by total spent (highest first)
        return customers.sort((a, b) => b.totalSpent - a.totalSpent);
    },

    /**
     * Format customer address
     */
    formatAddress(customerInfo) {
        const parts = [
            customerInfo.addressStreet,
            customerInfo.addressCity,
            customerInfo.addressState,
            customerInfo.addressPostal,
            customerInfo.addressCountry
        ].filter(part => part && part.trim());

        return parts.length > 0 ? parts.join(', ') : 'Address not provided';
    },

    /**
     * Display customers in enhanced table
     */
    displayCustomers(customers) {
        const container = document.getElementById('customers-table');

        if (customers.length === 0) {
            container.innerHTML = `
                <div class="no-data-container">
                    <p class="no-data">No customers found. Customer data will appear here after orders are placed.</p>
                    <button onclick="AdminDashboard.loadCustomers()" class="secondary-btn">
                        <span class="action-icon">🔄</span>
                        Refresh Customers
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="customers-header">
                <div class="customers-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Customers</span>
                        <span class="stat-value">${customers.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">VIP Customers</span>
                        <span class="stat-value">${customers.filter(c => c.status === 'VIP').length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total Revenue</span>
                        <span class="stat-value">${AdminUtils.formatCurrency(customers.reduce((sum, c) => sum + c.totalSpent, 0))}</span>
                    </div>
                </div>
                <div class="customers-actions">
                    <button onclick="AdminDashboard.loadCustomers()" class="secondary-btn">
                        <span class="action-icon">🔄</span>
                        Refresh
                    </button>
                    <button onclick="AdminDashboard.exportCustomerData()" class="secondary-btn">
                        <span class="action-icon">📊</span>
                        Export Data
                    </button>
                </div>
            </div>
            
            <div class="table-container">
                <table class="table customers-table">
                    <thead>
                        <tr>
                            <th>Customer Info</th>
                            <th>Contact</th>
                            <th>Orders & Spending</th>
                            <th>Customer Status</th>
                            <th>Preferred Category</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customers.map(customer => `
                            <tr>
                                <td class="customer-info">
                                    <div class="customer-name">
                                        <strong>${customer.name}</strong>
                                        <span class="customer-id">#${customer.id.substring(0, 8)}</span>
                                    </div>
                                    <div class="customer-address">
                                        <small>${customer.address}</small>
                                    </div>
                                </td>
                                <td class="customer-contact">
                                    <div class="contact-item">
                                        <span class="contact-label">📧 Email:</span>
                                        <span class="contact-value">${customer.email}</span>
                                    </div>
                                    <div class="contact-item">
                                        <span class="contact-label">📞 Phone:</span>
                                        <span class="contact-value">${customer.phone || 'N/A'}</span>
                                    </div>
                                </td>
                                <td class="customer-orders">
                                    <div class="order-stats">
                                        <div class="stat-row">
                                            <span class="stat-label">Orders:</span>
                                            <span class="stat-value">${customer.totalOrders}</span>
                                        </div>
                                        <div class="stat-row">
                                            <span class="stat-label">Total Spent:</span>
                                            <span class="stat-value">${AdminUtils.formatCurrency(customer.totalSpent)}</span>
                                        </div>
                                        <div class="stat-row">
                                            <span class="stat-label">Avg Order:</span>
                                            <span class="stat-value">${AdminUtils.formatCurrency(customer.averageOrderValue)}</span>
                                        </div>
                                        <div class="stat-row">
                                            <span class="stat-label">Last Order:</span>
                                            <span class="stat-value">${customer.lastOrder ? AdminUtils.formatDate(customer.lastOrder) : 'N/A'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td class="customer-status">
                                    <span class="status-badge" style="background-color: ${customer.statusColor}; color: white;">
                                        ${customer.status}
                                    </span>
                                    <div class="status-details">
                                        <small>First: ${customer.firstOrder ? AdminUtils.formatDate(customer.firstOrder) : 'N/A'}</small>
                                    </div>
                                </td>
                                <td class="customer-category">
                                    <span class="category-badge">${customer.topCategory}</span>
                                </td>
                                <td class="customer-actions">
                                    <button onclick="AdminDashboard.viewCustomerHistory('${customer.email}')" class="action-btn" title="View Order History">
                                        <span class="action-icon">📋</span>
                                    </button>
                                    <button onclick="AdminDashboard.contactCustomer('${customer.email}', '${customer.phone}')" class="action-btn" title="Contact Customer">
                                        <span class="action-icon">📞</span>
                                    </button>
                                    <button onclick="AdminDashboard.exportCustomerData('${customer.email}')" class="action-btn" title="Export Customer Data">
                                        <span class="action-icon">📊</span>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * View customer order history
     */
    viewCustomerHistory(customerEmail) {
        console.log('📋 Viewing order history for:', customerEmail);
        // This would open a modal with detailed order history
        alert(`Order history for ${customerEmail} would be displayed here.\n\nThis feature can be expanded to show detailed order history in a modal.`);
    },

    /**
     * Contact customer
     */
    contactCustomer(customerEmail, customerPhone) {
        console.log('📞 Contacting customer:', customerEmail, customerPhone);
        
        let contactInfo = `Email: ${customerEmail}`;
        if (customerPhone) {
            contactInfo += `\nPhone: ${customerPhone}`;
        }
        
        alert(`Contact Information:\n\n${contactInfo}\n\nYou can use this information to contact the customer.`);
    },

    /**
     * Export customer data
     */
    exportCustomerData(customerEmail = null) {
        console.log('📊 Exporting customer data...');
        
        if (customerEmail) {
            // Export single customer data
            alert(`Exporting data for customer: ${customerEmail}\n\nThis feature can be expanded to generate CSV/PDF reports.`);
        } else {
            // Export all customer data
            alert('Exporting all customer data...\n\nThis feature can be expanded to generate comprehensive CSV/PDF reports.');
        }
    },

    /**
     * Load analytics
     */
    loadAnalytics() {
        // Analytics implementation would go here
        // For now, showing placeholder
        console.log('Analytics section loaded');
        
        // Load comprehensive analytics
        this.loadComprehensiveAnalytics();
    },

    /**
     * Load comprehensive analytics with real data
     */
    async loadComprehensiveAnalytics() {
        try {
            console.log('📊 Loading comprehensive analytics...');
            
            // Get orders from Firebase
            let orders = [];
            if (window.firebaseDatabase && typeof window.firebaseDatabase.loadOrders === 'function') {
                orders = await window.firebaseDatabase.loadOrders();
            } else {
                console.log('Firebase not available, using fallback data');
                return;
            }

            // Filter out test orders (same logic as loadOrders)
            orders = orders.filter(order => {
                const customerName = order.customerInfo?.name?.toLowerCase() || '';
                const customerEmail = order.customerInfo?.email?.toLowerCase() || '';
                
                return !customerName.includes('test') && 
                       !customerName.includes('demo') && 
                       !customerName.includes('guest') &&
                       !customerEmail.includes('test') && 
                       !customerEmail.includes('demo') &&
                       customerName !== 'test customer' &&
                       customerName !== 'vip customer' &&
                       customerName !== 'guest' &&
                       order.customerInfo?.name &&
                       order.customerInfo?.email;
            });

            if (orders.length === 0) {
                this.displayAnalyticsPlaceholder();
                return;
            }

            // Process analytics data
            const analyticsData = this.processAnalyticsData(orders);
            
            // Display analytics
            this.displayAnalytics(analyticsData);
            
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.displayAnalyticsPlaceholder();
        }
    },

    /**
     * Process orders data for analytics
     */
    processAnalyticsData(orders) {
        const analytics = {
            overview: this.calculateOverviewMetrics(orders),
            revenue: this.calculateRevenueAnalytics(orders),
            products: this.calculateProductAnalytics(orders),
            customers: this.calculateCustomerAnalytics(orders),
            trends: this.calculateTrendAnalytics(orders),
            geographic: this.calculateGeographicAnalytics(orders)
        };

        return analytics;
    },

    /**
     * Calculate overview metrics
     */
    calculateOverviewMetrics(orders) {
        const totalRevenue = orders.reduce((sum, order) => sum + order.totals.total, 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Calculate unique customers
        const uniqueCustomers = new Set(orders.map(order => order.customerInfo.email)).size;
        
        // Calculate growth (comparing last 30 days vs previous 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        
        const recentOrders = orders.filter(order => new Date(order.createdAt) >= thirtyDaysAgo);
        const previousOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
        });
        
        const recentRevenue = recentOrders.reduce((sum, order) => sum + order.totals.total, 0);
        const previousRevenue = previousOrders.reduce((sum, order) => sum + order.totals.total, 0);
        const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

        return {
            totalRevenue,
            totalOrders,
            averageOrderValue,
            uniqueCustomers,
            revenueGrowth,
            recentOrders: recentOrders.length,
            previousOrders: previousOrders.length
        };
    },

    /**
     * Calculate revenue analytics
     */
    calculateRevenueAnalytics(orders) {
        // Monthly revenue breakdown
        const monthlyRevenue = {};
        const dailyRevenue = {};
        
        orders.forEach(order => {
            const date = new Date(order.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const dayKey = date.toISOString().split('T')[0];
            
            monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + order.totals.total;
            dailyRevenue[dayKey] = (dailyRevenue[dayKey] || 0) + order.totals.total;
        });

        // Payment method analysis
        const paymentMethods = {};
        orders.forEach(order => {
            const method = order.payment.method;
            paymentMethods[method] = (paymentMethods[method] || 0) + 1;
        });

        return {
            monthlyRevenue,
            dailyRevenue,
            paymentMethods
        };
    },

    /**
     * Calculate product analytics
     */
    calculateProductAnalytics(orders) {
        const productStats = {};
        const categoryStats = {};
        
        orders.forEach(order => {
            order.items.forEach(item => {
                // Product stats
                if (!productStats[item.name]) {
                    productStats[item.name] = {
                        name: item.name,
                        quantity: 0,
                        revenue: 0,
                        orders: 0
                    };
                }
                productStats[item.name].quantity += item.quantity;
                productStats[item.name].revenue += item.price * item.quantity;
                productStats[item.name].orders += 1;
                
                // Category stats
                const category = item.category || 'Uncategorized';
                if (!categoryStats[category]) {
                    categoryStats[category] = {
                        name: category,
                        quantity: 0,
                        revenue: 0,
                        orders: 0
                    };
                }
                categoryStats[category].quantity += item.quantity;
                categoryStats[category].revenue += item.price * item.quantity;
                categoryStats[category].orders += 1;
            });
        });

        // Sort by revenue
        const topProducts = Object.values(productStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
            
        const topCategories = Object.values(categoryStats)
            .sort((a, b) => b.revenue - a.revenue);

        return {
            topProducts,
            topCategories,
            totalProducts: Object.keys(productStats).length,
            totalCategories: Object.keys(categoryStats).length
        };
    },

    /**
     * Calculate customer analytics
     */
    calculateCustomerAnalytics(orders) {
        const customerStats = {};
        
        orders.forEach(order => {
            const email = order.customerInfo.email;
            if (!customerStats[email]) {
                customerStats[email] = {
                    email: email,
                    name: order.customerInfo.name,
                    orders: 0,
                    totalSpent: 0,
                    firstOrder: order.createdAt,
                    lastOrder: order.createdAt,
                    averageOrderValue: 0
                };
            }
            
            customerStats[email].orders += 1;
            customerStats[email].totalSpent += order.totals.total;
            customerStats[email].lastOrder = order.createdAt;
        });

        // Calculate averages and categorize customers
        Object.values(customerStats).forEach(customer => {
            customer.averageOrderValue = customer.totalSpent / customer.orders;
            
            // Categorize customers
            if (customer.orders >= 5) {
                customer.category = 'VIP';
                customer.categoryColor = '#28a745';
            } else if (customer.orders >= 2) {
                customer.category = 'Returning';
                customer.categoryColor = '#17a2b8';
            } else {
                customer.category = 'New';
                customer.categoryColor = '#6c757d';
            }
        });

        const topCustomers = Object.values(customerStats)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10);

        const customerCategories = {
            VIP: Object.values(customerStats).filter(c => c.category === 'VIP').length,
            Returning: Object.values(customerStats).filter(c => c.category === 'Returning').length,
            New: Object.values(customerStats).filter(c => c.category === 'New').length
        };

        return {
            topCustomers,
            customerCategories,
            totalCustomers: Object.keys(customerStats).length,
            averageCustomerValue: Object.values(customerStats).reduce((sum, c) => sum + c.totalSpent, 0) / Object.keys(customerStats).length
        };
    },

    /**
     * Calculate trend analytics
     */
    calculateTrendAnalytics(orders) {
        // Daily order trends (last 30 days)
        const dailyOrders = {};
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Initialize all days with 0
        for (let i = 0; i < 30; i++) {
            const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
            const dayKey = date.toISOString().split('T')[0];
            dailyOrders[dayKey] = 0;
        }
        
        // Count orders per day
        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            if (orderDate >= thirtyDaysAgo) {
                const dayKey = orderDate.toISOString().split('T')[0];
                if (dailyOrders[dayKey] !== undefined) {
                    dailyOrders[dayKey]++;
                }
            }
        });

        return {
            dailyOrders
        };
    },

    /**
     * Calculate geographic analytics
     */
    calculateGeographicAnalytics(orders) {
        const cityStats = {};
        const stateStats = {};
        
        orders.forEach(order => {
            const city = order.customerInfo.addressCity || 'Unknown';
            const state = order.customerInfo.addressState || 'Unknown';
            
            // City stats
            if (!cityStats[city]) {
                cityStats[city] = {
                    name: city,
                    orders: 0,
                    revenue: 0
                };
            }
            cityStats[city].orders += 1;
            cityStats[city].revenue += order.totals.total;
            
            // State stats
            if (!stateStats[state]) {
                stateStats[state] = {
                    name: state,
                    orders: 0,
                    revenue: 0
                };
            }
            stateStats[state].orders += 1;
            stateStats[state].revenue += order.totals.total;
        });

        const topCities = Object.values(cityStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
            
        const topStates = Object.values(stateStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return {
            topCities,
            topStates
        };
    },

    /**
     * Display analytics in the dashboard
     */
    displayAnalytics(analyticsData) {
        const analyticsSection = document.getElementById('analytics-section');
        if (!analyticsSection) return;

        const analyticsContent = analyticsSection.querySelector('.analytics-content');
        if (!analyticsContent) return;

        analyticsContent.innerHTML = `
            <!-- Overview Cards -->
            <div class="analytics-overview">
                <h3>📊 Key Performance Indicators</h3>
                <div class="overview-grid">
                    <div class="overview-card">
                        <div class="overview-icon">💰</div>
                        <div class="overview-content">
                            <div class="overview-value">${AdminUtils.formatCurrency(analyticsData.overview.totalRevenue)}</div>
                            <div class="overview-label">Total Revenue</div>
                            <div class="overview-trend ${analyticsData.overview.revenueGrowth >= 0 ? 'positive' : 'negative'}">
                                ${analyticsData.overview.revenueGrowth >= 0 ? '↗' : '↘'} ${Math.abs(analyticsData.overview.revenueGrowth).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                    
                    <div class="overview-card">
                        <div class="overview-icon">📦</div>
                        <div class="overview-content">
                            <div class="overview-value">${analyticsData.overview.totalOrders}</div>
                            <div class="overview-label">Total Orders</div>
                            <div class="overview-trend">
                                ${analyticsData.overview.recentOrders} this month
                            </div>
                        </div>
                    </div>
                    
                    <div class="overview-card">
                        <div class="overview-icon">👥</div>
                        <div class="overview-content">
                            <div class="overview-value">${analyticsData.overview.uniqueCustomers}</div>
                            <div class="overview-label">Unique Customers</div>
                            <div class="overview-trend">
                                ${analyticsData.customers.customerCategories.New} new
                            </div>
                        </div>
                    </div>
                    
                    <div class="overview-card">
                        <div class="overview-icon">📈</div>
                        <div class="overview-content">
                            <div class="overview-value">${AdminUtils.formatCurrency(analyticsData.overview.averageOrderValue)}</div>
                            <div class="overview-label">Average Order Value</div>
                            <div class="overview-trend">
                                Per order
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="analytics-charts">
                <div class="chart-row">
                    <div class="chart-container">
                        <h3>📈 Revenue Trend (Last 30 Days)</h3>
                        <div class="chart-placeholder">
                            ${this.generateRevenueChart(analyticsData.revenue.dailyRevenue)}
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <h3>🎯 Top Product Categories</h3>
                        <div class="chart-placeholder">
                            ${this.generateCategoryChart(analyticsData.products.topCategories)}
                        </div>
                    </div>
                </div>
                
                <div class="chart-row">
                    <div class="chart-container">
                        <h3>📊 Order Trends (Daily)</h3>
                        <div class="chart-placeholder">
                            ${this.generateOrderTrendChart(analyticsData.trends.dailyOrders)}
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <h3>💳 Payment Methods</h3>
                        <div class="chart-placeholder">
                            ${this.generatePaymentChart(analyticsData.revenue.paymentMethods)}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Detailed Reports -->
            <div class="analytics-reports">
                <div class="reports-row">
                    <div class="report-container">
                        <h3>🏆 Top Products</h3>
                        <div class="report-table">
                            ${this.generateTopProductsTable(analyticsData.products.topProducts)}
                        </div>
                    </div>
                    
                    <div class="report-container">
                        <h3>👑 Top Customers</h3>
                        <div class="report-table">
                            ${this.generateTopCustomersTable(analyticsData.customers.topCustomers)}
                        </div>
                    </div>
                </div>
                
                <div class="reports-row">
                    <div class="report-container">
                        <h3>🌍 Geographic Distribution</h3>
                        <div class="report-table">
                            ${this.generateGeographicTable(analyticsData.geographic.topCities)}
                        </div>
                    </div>
                    
                    <div class="report-container">
                        <h3>📋 Customer Segments</h3>
                        <div class="report-table">
                            ${this.generateCustomerSegmentsTable(analyticsData.customers.customerCategories)}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Analytics Actions -->
            <div class="analytics-actions">
                <button onclick="AdminDashboard.exportAnalyticsData()" class="secondary-btn">
                    <span class="action-icon">📊</span>
                    Export Analytics
                </button>
                <button onclick="AdminDashboard.refreshAnalytics()" class="secondary-btn">
                    <span class="action-icon">🔄</span>
                    Refresh Data
                </button>
            </div>
        `;
    },

    /**
     * Display analytics placeholder when no data
     */
    displayAnalyticsPlaceholder() {
        const analyticsSection = document.getElementById('analytics-section');
        if (!analyticsSection) return;

        const analyticsContent = analyticsSection.querySelector('.analytics-content');
        if (!analyticsContent) return;

        analyticsContent.innerHTML = `
            <div class="analytics-placeholder">
                <div class="placeholder-icon">📊</div>
                <h3>No Analytics Data Available</h3>
                <p>Analytics will appear here once you have orders in your system.</p>
                <p>Place some test orders to see comprehensive analytics and insights.</p>
            </div>
        `;
    },

    /**
     * Generate revenue chart HTML
     */
    generateRevenueChart(dailyRevenue) {
        const days = Object.keys(dailyRevenue).sort();
        const values = days.map(day => dailyRevenue[day]);
        const maxValue = Math.max(...values);
        
        return `
            <div class="simple-chart">
                ${days.map((day, index) => {
                    const value = values[index];
                    const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    return `
                        <div class="chart-bar" style="height: ${height}%">
                            <div class="bar-tooltip">
                                ${day}: ${AdminUtils.formatCurrency(value)}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * Generate category chart HTML
     */
    generateCategoryChart(categories) {
        const totalRevenue = categories.reduce((sum, cat) => sum + cat.revenue, 0);
        
        return `
            <div class="category-chart">
                ${categories.slice(0, 5).map(category => {
                    const percentage = totalRevenue > 0 ? (category.revenue / totalRevenue) * 100 : 0;
                    return `
                        <div class="category-item">
                            <div class="category-name">${category.name}</div>
                            <div class="category-bar">
                                <div class="category-fill" style="width: ${percentage}%"></div>
                            </div>
                            <div class="category-value">${AdminUtils.formatCurrency(category.revenue)} (${percentage.toFixed(1)}%)</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * Generate order trend chart HTML
     */
    generateOrderTrendChart(dailyOrders) {
        const days = Object.keys(dailyOrders).sort();
        const values = days.map(day => dailyOrders[day]);
        const maxValue = Math.max(...values);
        
        return `
            <div class="simple-chart line-chart">
                ${days.map((day, index) => {
                    const value = values[index];
                    const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    return `
                        <div class="chart-point" style="height: ${height}%">
                            <div class="point-tooltip">
                                ${day}: ${value} orders
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * Generate payment method chart HTML
     */
    generatePaymentChart(paymentMethods) {
        const total = Object.values(paymentMethods).reduce((sum, count) => sum + count, 0);
        
        return `
            <div class="payment-chart">
                ${Object.entries(paymentMethods).map(([method, count]) => {
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    const methodName = method === 'stripe' ? 'Credit Card' : 'PayPal';
                    return `
                        <div class="payment-item">
                            <div class="payment-name">${methodName}</div>
                            <div class="payment-bar">
                                <div class="payment-fill" style="width: ${percentage}%"></div>
                            </div>
                            <div class="payment-value">${count} orders (${percentage.toFixed(1)}%)</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * Generate top products table HTML
     */
    generateTopProductsTable(products) {
        if (products.length === 0) {
            return '<div class="no-data">No product data available</div>';
        }

        return `
            <table class="analytics-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Orders</th>
                        <th>Quantity</th>
                        <th>Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td>${product.name}</td>
                            <td>${product.orders}</td>
                            <td>${product.quantity}</td>
                            <td>${AdminUtils.formatCurrency(product.revenue)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * Generate top customers table HTML
     */
    generateTopCustomersTable(customers) {
        if (customers.length === 0) {
            return '<div class="no-data">No customer data available</div>';
        }

        return `
            <table class="analytics-table">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Orders</th>
                        <th>Total Spent</th>
                        <th>Category</th>
                    </tr>
                </thead>
                <tbody>
                    ${customers.map(customer => `
                        <tr>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-name">${customer.name}</div>
                                    <div class="customer-email">${customer.email}</div>
                                </div>
                            </td>
                            <td>${customer.orders}</td>
                            <td>${AdminUtils.formatCurrency(customer.totalSpent)}</td>
                            <td>
                                <span class="category-badge" style="background: ${customer.categoryColor}">
                                    ${customer.category}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * Generate geographic table HTML
     */
    generateGeographicTable(cities) {
        if (cities.length === 0) {
            return '<div class="no-data">No geographic data available</div>';
        }

        return `
            <table class="analytics-table">
                <thead>
                    <tr>
                        <th>City</th>
                        <th>Orders</th>
                        <th>Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${cities.map(city => `
                        <tr>
                            <td>${city.name}</td>
                            <td>${city.orders}</td>
                            <td>${AdminUtils.formatCurrency(city.revenue)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * Generate customer segments table HTML
     */
    generateCustomerSegmentsTable(segments) {
        const total = Object.values(segments).reduce((sum, count) => sum + count, 0);
        
        return `
            <table class="analytics-table">
                <thead>
                    <tr>
                        <th>Segment</th>
                        <th>Count</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(segments).map(([segment, count]) => {
                        const percentage = total > 0 ? (count / total) * 100 : 0;
                        const color = segment === 'VIP' ? '#28a745' : segment === 'Returning' ? '#17a2b8' : '#6c757d';
                        return `
                            <tr>
                                <td>
                                    <span class="segment-badge" style="background: ${color}">
                                        ${segment}
                                    </span>
                                </td>
                                <td>${count}</td>
                                <td>${percentage.toFixed(1)}%</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * Export analytics data
     */
    exportAnalyticsData() {
        console.log('📊 Exporting analytics data...');
        AdminUtils.showNotification('Analytics export feature coming soon!', 'info');
    },

    /**
     * Refresh analytics data
     */
    refreshAnalytics() {
        console.log('🔄 Refreshing analytics data...');
        this.loadComprehensiveAnalytics();
        AdminUtils.showNotification('Analytics data refreshed!', 'success');
    },

    /**
     * Load settings
     */
    loadSettings() {
        // Settings implementation would go here
        console.log('Settings section loaded');
    },

    /**
     * Show product modal
     */
    showProductModal(product = null) {
        this.currentProduct = product;
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('product-modal-title');
        const form = document.getElementById('product-form');

        if (product) {
            title.textContent = 'Edit Product';
            // Populate form with product data
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-description').value = product.description || '';
            document.getElementById('product-category').value = product.category;

            // Set size checkboxes
            const sizeCheckboxes = document.querySelectorAll('input[name="sizes"]');
            sizeCheckboxes.forEach(checkbox => {
                checkbox.checked = product.sizes.includes(checkbox.value);
            });
        } else {
            title.textContent = 'Add New Product';
            form.reset();
        }

        modal.style.display = 'flex';
    },

    /**
     * Close product modal
     */
    closeProductModal() {
        document.getElementById('product-modal').style.display = 'none';
        this.currentProduct = null;
    },

    /**
     * Handle product form submission
     */
    handleProductSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const sizes = Array.from(document.querySelectorAll('input[name="sizes"]:checked')).map(cb => cb.value);

        const productData = {
            name: formData.get('name'),
            price: parseFloat(formData.get('price')),
            description: formData.get('description'),
            category: formData.get('category'),
            sizes: sizes,
            image: formData.get('image')?.name || 'default-shoe.webp',
            inStock: true
        };

        try {
            if (this.currentProduct) {
                // Update existing product
                DataManager.updateProduct(this.currentProduct.id, productData);
                AdminUtils.showNotification('Product updated successfully!');
            } else {
                // Add new product
                DataManager.addProduct(productData);
                AdminUtils.showNotification('Product added successfully!');
            }

            this.closeProductModal();
            this.loadProducts();
            this.loadStats(); // Update stats

        } catch (error) {
            console.error('Error saving product:', error);
            AdminUtils.showNotification('Error saving product. Please try again.', 'error');
        }
    },

    /**
     * Edit product
     */
    editProduct(productId) {
        const products = DataManager.getProducts();
        const product = products.find(p => p.id === productId);

        if (product) {
            this.showProductModal(product);
        }
    },

    /**
     * Delete product
     */
    deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            try {
                DataManager.deleteProduct(productId);
                AdminUtils.showNotification('Product deleted successfully!');
                this.loadProducts();
                this.loadStats(); // Update stats
            } catch (error) {
                console.error('Error deleting product:', error);
                AdminUtils.showNotification('Error deleting product. Please try again.', 'error');
            }
        }
    },

    updateOrderStatus: async function(orderId, newStatus) {
        if (window.firebaseDatabase && typeof window.firebaseDatabase.db !== 'undefined') {
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const orderRef = doc(window.firebaseDatabase.db, 'orders', orderId);
            await updateDoc(orderRef, { status: newStatus, updatedAt: new Date() });
            AdminUtils.showNotification('Order status updated!', 'success');
            this.loadOrders();
        }
    },

    clearOrder: async function(orderId) {
        console.log('🗑️ Attempting to delete order:', orderId);
        console.log('Firebase DB available:', !!window.firebaseDatabase);
        console.log('deleteOrder function available:', !!(window.firebaseDatabase && typeof window.firebaseDatabase.deleteOrder === 'function'));
        
        if (window.firebaseDatabase && typeof window.firebaseDatabase.deleteOrder === 'function') {
            try {
                const success = await window.firebaseDatabase.deleteOrder(orderId);
                if (success) {
                    AdminUtils.showNotification('Order deleted successfully!', 'success');
                    this.loadOrders();
                } else {
                    AdminUtils.showNotification('Failed to delete order', 'error');
                }
            } catch (error) {
                console.error('Error deleting order:', error);
                AdminUtils.showNotification('Error deleting order: ' + error.message, 'error');
            }
        } else {
            console.error('Firebase not available for order deletion');
            AdminUtils.showNotification('Firebase not available. Please refresh the page and try again.', 'error');
        }
    },

    /**
     * Clear all test orders from Firebase (emergency cleanup)
     */
    clearAllTestOrders: async function() {
        console.log('🧹 Attempting to clear all test orders...');
        console.log('Firebase DB available:', !!window.firebaseDatabase);
        console.log('loadOrders function available:', !!(window.firebaseDatabase && typeof window.firebaseDatabase.loadOrders === 'function'));
        console.log('deleteOrder function available:', !!(window.firebaseDatabase && typeof window.firebaseDatabase.deleteOrder === 'function'));
        
        if (!window.firebaseDatabase || typeof window.firebaseDatabase.loadOrders !== 'function' || typeof window.firebaseDatabase.deleteOrder !== 'function') {
            console.error('Firebase not available for clearing test orders');
            AdminUtils.showNotification('Firebase not available. Please refresh the page and try again.', 'error');
            return;
        }

        try {
            const allOrders = await window.firebaseDatabase.loadOrders();
            console.log('📋 Total orders loaded:', allOrders.length);
            
            const testOrders = allOrders.filter(order => {
                const customerName = order.customerInfo?.name || '';
                const customerEmail = order.customerInfo?.email || '';
                
                return customerName === 'Test Customer' || 
                       customerName === 'Guest' || 
                       customerName === 'VIP Customer' ||
                       customerEmail.includes('test') ||
                       customerEmail.includes('demo') ||
                       customerName.toLowerCase().includes('test') ||
                       customerName.toLowerCase().includes('demo');
            });

            console.log('🧪 Test orders found:', testOrders.length);

            if (testOrders.length === 0) {
                AdminUtils.showNotification('No test orders found to delete', 'success');
                return;
            }

            let deletedCount = 0;
            for (const order of testOrders) {
                console.log('🗑️ Deleting test order:', order.id, order.customerInfo?.name);
                const success = await window.firebaseDatabase.deleteOrder(order.id);
                if (success) {
                    deletedCount++;
                    console.log('✅ Successfully deleted order:', order.id);
                } else {
                    console.log('❌ Failed to delete order:', order.id);
                }
            }

            AdminUtils.showNotification(`Deleted ${deletedCount} test orders`, 'success');
            this.loadOrders();
        } catch (error) {
            console.error('Error clearing test orders:', error);
            AdminUtils.showNotification('Error clearing test orders: ' + error.message, 'error');
        }
    },

    /**
     * Debug function to show all orders in console
     */
    debugOrders: async function() {
        if (!window.firebaseDatabase || typeof window.firebaseDatabase.loadOrders !== 'function') {
            console.log('❌ Firebase not available');
            return;
        }

        try {
            const allOrders = await window.firebaseDatabase.loadOrders();
            console.log('🔍 All orders from Firebase:', allOrders);
            
            allOrders.forEach((order, index) => {
                console.log(`Order ${index + 1}:`, {
                    id: order.id,
                    orderId: order.orderId,
                    customerName: order.customerInfo?.name,
                    customerEmail: order.customerInfo?.email,
                    amount: order.payment?.amount,
                    createdAt: order.createdAt
                });
            });
        } catch (error) {
            console.error('Error loading orders for debug:', error);
        }
    },

    /**
     * Delete ALL orders from Firebase (nuclear option)
     */
    deleteAllOrders: async function() {
        console.log('💥 Attempting to delete ALL orders from Firebase...');
        console.log('Firebase DB available:', !!window.firebaseDatabase);
        console.log('loadOrders function available:', !!(window.firebaseDatabase && typeof window.firebaseDatabase.loadOrders === 'function'));
        console.log('deleteOrder function available:', !!(window.firebaseDatabase && typeof window.firebaseDatabase.deleteOrder === 'function'));
        
        if (!window.firebaseDatabase || typeof window.firebaseDatabase.loadOrders !== 'function' || typeof window.firebaseDatabase.deleteOrder !== 'function') {
            console.error('Firebase not available for deleting all orders');
            AdminUtils.showNotification('Firebase not available. Please refresh the page and try again.', 'error');
            return;
        }

        // Show confirmation dialog
        const confirmed = confirm('⚠️ WARNING: This will delete ALL orders from Firebase!\n\nThis action cannot be undone. Are you sure you want to continue?');
        if (!confirmed) {
            console.log('❌ User cancelled deletion of all orders');
            return;
        }

        try {
            const allOrders = await window.firebaseDatabase.loadOrders();
            console.log('📋 Total orders to delete:', allOrders.length);
            
            if (allOrders.length === 0) {
                AdminUtils.showNotification('No orders found to delete', 'success');
                return;
            }

            let deletedCount = 0;
            for (const order of allOrders) {
                console.log('🗑️ Deleting order:', order.id, order.customerInfo?.name);
                const success = await window.firebaseDatabase.deleteOrder(order.id);
                if (success) {
                    deletedCount++;
                    console.log('✅ Successfully deleted order:', order.id);
                } else {
                    console.log('❌ Failed to delete order:', order.id);
                }
            }

            AdminUtils.showNotification(`Successfully deleted ${deletedCount} orders from Firebase`, 'success');
            this.loadOrders(); // Refresh the orders display
        } catch (error) {
            console.error('Error deleting all orders:', error);
            AdminUtils.showNotification('Error deleting all orders: ' + error.message, 'error');
        }
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Firebase to be ready before initializing dashboard
    if (window.firebaseDatabase && window.firebaseAuth) {
        console.log('🔥 Firebase already available, initializing dashboard...');
        AdminDashboard.init();
    } else {
        console.log('⏳ Waiting for Firebase to be ready...');
        window.addEventListener('firebaseReady', (event) => {
            console.log('🔥 Firebase ready, initializing dashboard...');
            AdminDashboard.init();
        });
        
        // Fallback: if Firebase doesn't load within 5 seconds, initialize anyway
        setTimeout(() => {
            if (!window.firebaseDatabase) {
                console.warn('⚠️ Firebase not available after 5 seconds, initializing with fallback...');
                AdminDashboard.init();
            }
        }, 5000);
    }
});

// ===== GLOBAL FUNCTIONS =====
window.AdminDashboard = AdminDashboard;
// ===== PHYSICAL SALES MANAGER =====
const PhysicalSalesManager = {
    INVENTORY_KEY: 'shoepoint_inventory',
    SALES_LOG_KEY: 'shoepoint_sales_log',

    // Default inventory data with sizes and colors
    DEFAULT_INVENTORY: [
        {
            id: 1,
            name: 'Air Jordan 5 Retro',
            price: 12500,
            stock: 15,
            image: 'sl1.webp',
            category: 'Basketball',
            description: 'Premium basketball shoes with excellent grip and comfort',
            sizes: ['8', '9', '10', '11', '12'],
            colors: ['Black', 'White', 'Red']
        },
        {
            id: 2,
            name: 'Hiking Shoes for Adventurers',
            price: 8500,
            stock: 20,
            image: 'card 1.webp',
            category: 'Hiking',
            description: 'Durable hiking shoes for outdoor adventures',
            sizes: ['7', '8', '9', '10', '11'],
            colors: ['Brown', 'Black', 'Gray']
        },
        {
            id: 3,
            name: 'High-Top Basketball Shoes',
            price: 9500,
            stock: 12,
            image: 'card 2.webp',
            category: 'Basketball',
            description: 'High-top design for ankle support during intense games',
            sizes: ['8', '9', '10', '11', '12'],
            colors: ['Black', 'White', 'Blue']
        },
        {
            id: 4,
            name: 'Soccer Cleats for Speed',
            price: 7500,
            stock: 18,
            image: 'card 4.webp',
            category: 'Soccer',
            description: 'Lightweight cleats designed for speed and agility',
            sizes: ['7', '8', '9', '10', '11'],
            colors: ['Black', 'White', 'Blue']
        },
        {
            id: 5,
            name: 'Lightweight Running Shoes',
            price: 6500,
            stock: 25,
            image: 'card 6.webp',
            category: 'Running',
            description: 'Ultra-lightweight shoes for long-distance running',
            sizes: ['7', '8', '9', '10', '11', '12'],
            colors: ['Black', 'White', 'Gray', 'Blue']
        },
        {
            id: 6,
            name: 'Tennis Court Shoes',
            price: 8000,
            stock: 10,
            image: 'sc4.webp',
            category: 'Tennis',
            description: 'Professional tennis shoes with superior court grip',
            sizes: ['8', '9', '10', '11'],
            colors: ['White', 'Black']
        }
    ],

    /**
     * Initialize physical sales system
     */
    init() {
        console.log('Initializing PhysicalSalesManager...');
        this.initializeInventory();
        this.renderAll();
        console.log('PhysicalSalesManager initialized successfully');
    },

    /**
     * Initialize inventory with default data if not exists
     */
    initializeInventory() {
        let inventory = localStorage.getItem(this.INVENTORY_KEY);
        if (!inventory) {
            console.log('Initializing default inventory...');
            localStorage.setItem(this.INVENTORY_KEY, JSON.stringify(this.DEFAULT_INVENTORY));
        } else {
            console.log('Inventory already exists, skipping initialization');
        }
    },

    /**
     * Get current inventory
     */
    getInventory() {
        return JSON.parse(localStorage.getItem(this.INVENTORY_KEY) || '[]');
    },

    /**
     * Update inventory in storage
     */
    updateInventory(inventory) {
        localStorage.setItem(this.INVENTORY_KEY, JSON.stringify(inventory));
    },

    /**
     * Get sales log
     */
    getSalesLog() {
        return JSON.parse(localStorage.getItem(this.SALES_LOG_KEY) || '[]');
    },

    /**
     * Add sale to log
     */
    addSaleToLog(sale) {
        const salesLog = this.getSalesLog();
        salesLog.unshift(sale); // Add to beginning
        if (salesLog.length > 100) salesLog.pop(); // Keep only last 100 sales
        localStorage.setItem(this.SALES_LOG_KEY, JSON.stringify(salesLog));
    },

    /**
     * Save sales log to localStorage
     */
    saveSalesLog(salesLog) {
        try {
            localStorage.setItem(this.SALES_LOG_KEY, JSON.stringify(salesLog));
        } catch (error) {
            console.error('Error saving sales log:', error);
        }
    },

    /**
     * Update product stock (for returns)
     */
    updateProductStock(productId, quantityToAdd) {
        const inventory = this.getInventory();
        const productIndex = inventory.findIndex(p => p.id === productId);
        
        if (productIndex !== -1) {
            inventory[productIndex].stock += quantityToAdd;
            this.saveInventory(inventory);
            return true;
        }
        return false;
    },

    /**
     * Render all components
     */
    renderAll() {
        console.log('Rendering all physical sales components...');
        try {
            this.renderSalesSummary();
            // Only render inventory if we're on the physical sales section
            const physicalSalesSection = document.getElementById('physical-sales-section');
            if (physicalSalesSection && physicalSalesSection.classList.contains('active')) {
                this.renderInventory();
            }
            this.renderSalesLog();
            console.log('All components rendered successfully');
        } catch (error) {
            console.error('Error rendering components:', error);
        }
    },

    /**
     * Render sales summary cards
     */
    renderSalesSummary() {
        const salesLog = this.getSalesLog();
        const inventory = this.getInventory();
        const summaryContainer = document.getElementById('sales-summary');

        if (!summaryContainer) return;

        const totalRevenue = salesLog.reduce((sum, sale) => sum + sale.total, 0);
        const totalTransactions = salesLog.length;
        const totalStock = inventory.reduce((sum, item) => sum + item.stock, 0);
        const lowStockItems = inventory.filter(item => item.stock < 2 && item.stock > 0).length;
        const outOfStockItems = inventory.filter(item => item.stock === 0).length;

        summaryContainer.innerHTML = `
            <div class="summary-card">
                <div class="summary-value">Rs ${totalRevenue.toLocaleString()}</div>
                <div class="summary-label">Total Revenue</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${totalTransactions}</div>
                <div class="summary-label">Transactions</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${totalStock}</div>
                <div class="summary-label">Total Stock</div>
            </div>
            <div class="summary-card">
                <div class="summary-value" style="color: ${lowStockItems > 0 ? '#856404' : '#28a745'}">${lowStockItems}</div>
                <div class="summary-label">Low Stock</div>
            </div>
            <div class="summary-card">
                <div class="summary-value" style="color: ${outOfStockItems > 0 ? '#721c24' : '#28a745'}">${outOfStockItems}</div>
                <div class="summary-label">Out of Stock</div>
            </div>
        `;
    },

    /**
     * Render inventory grid
     */
    renderInventory() {
        const inventory = this.getInventory();
        const grid = document.getElementById('inventory-grid');
        const select = document.getElementById('product-select');

        if (!grid || !select) return;

        // Clear existing content
        grid.innerHTML = '';
        select.innerHTML = '<option value="">Choose a product...</option>';

        inventory.forEach(item => {
            // Create inventory card
            const card = document.createElement('div');
            card.className = 'inventory-item';

            const stockClass = item.stock === 0 ? 'out' : item.stock < 2 ? 'low' : '';
            const stockText = item.stock === 0 ? 'Out of Stock' : `${item.stock} in stock`;

            card.innerHTML = `
                <h5>${item.name}</h5>
                <div class="inventory-details">
                    <span class="stock-info">Rs ${item.price.toLocaleString()}</span>
                    <span class="stock-count ${stockClass}">${stockText}</span>
                </div>
                <button onclick="PhysicalSalesManager.sellItem(${item.id})" class="sell-btn" ${item.stock === 0 ? 'disabled' : ''}>
                    💰 Sell 1 Unit
                </button>
            `;

            grid.appendChild(card);

            // Add to select dropdown
            if (item.stock > 0) {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = `${item.name} (${item.stock} available)`;
                select.appendChild(option);
            }
        });
    },

    /**
     * Render sales log
     */
    renderSalesLog() {
        const salesLog = this.getSalesLog();
        const logContainer = document.getElementById('sales-log');

        if (!logContainer) return;

        if (salesLog.length === 0) {
            logContainer.innerHTML = '<p style="color: #666; font-style: italic; text-align: center; padding: 20px;">No sales recorded yet. Start selling to see transaction history here.</p>';
            return;
        }

        logContainer.innerHTML = salesLog.slice(0, 20).map(sale => {
            const date = new Date(sale.timestamp);
            return `
                <div class="sale-entry">
                    <div><strong>${sale.productName}</strong> x${sale.quantity}</div>
                    <div>Rs ${sale.total.toLocaleString()} <span class="sale-time">${date.toLocaleString()}</span></div>
                </div>
            `;
        }).join('');
    },

    /**
     * Sell an item
     */
    sellItem(productId, quantity = 1) {
        return this.sellItemWithOptions(productId, quantity, {});
    },

    /**
     * Sell an item with options (size, color)
     */
    sellItemWithOptions(productId, quantity = 1, options = {}) {
        const inventory = this.getInventory();
        const item = inventory.find(p => p.id === productId);

        if (!item) {
            this.showNotification('Product not found!', 'error');
            return false;
        }

        if (item.stock < quantity) {
            this.showNotification(`Not enough stock! Only ${item.stock} available.`, 'error');
            return false;
        }

        // Update stock
        item.stock -= quantity;
        this.updateInventory(inventory);

        // Log the sale with options
        const sale = {
            id: Date.now(),
            productId: productId,
            productName: item.name,
            quantity: quantity,
            price: item.price,
            total: item.price * quantity,
            size: options.size || null,
            color: options.color || null,
            timestamp: new Date().toISOString(),
            saleDate: new Date().toLocaleDateString(),
            saleTime: new Date().toLocaleTimeString(),
            type: 'physical'
        };

        this.addSaleToLog(sale);

        // Update displays
        this.renderAll();

        let optionsText = '';
        if (options.size || options.color) {
            const parts = [];
            if (options.size) parts.push(`Size ${options.size}`);
            if (options.color) parts.push(options.color);
            optionsText = ` (${parts.join(', ')})`;
        }

        this.showNotification(`Sold ${quantity}x ${item.name}${optionsText} for Rs ${(item.price * quantity).toLocaleString()}`, 'success');
        return true;
    },

    /**
     * Process sale from quick form
     */
    processSale() {
        const productSelect = document.getElementById('product-select');
        const quantityInput = document.getElementById('quantity-input');

        const productId = parseInt(productSelect.value);
        const quantity = parseInt(quantityInput.value) || 1;

        if (!productId) {
            this.showNotification('Please select a product!', 'error');
            return;
        }

        if (this.sellItem(productId, quantity)) {
            // Reset form
            productSelect.value = '';
            quantityInput.value = '1';
        }
    },

    /**
     * Reset inventory to default
     */
    resetInventory() {
        if (confirm('Are you sure you want to reset inventory to default values? This will restore all stock levels.')) {
            localStorage.setItem(this.INVENTORY_KEY, JSON.stringify(this.DEFAULT_INVENTORY));
            this.renderAll();
            this.showNotification('Inventory reset to default values.', 'success');
        }
    },

    /**
     * Clear sales log
     */
    clearSalesLog() {
        if (confirm('Are you sure you want to clear all sales history? This action cannot be undone.')) {
            localStorage.removeItem(this.SALES_LOG_KEY);
            this.renderAll();
            this.showNotification('Sales log cleared.', 'success');
        }
    },

    /**
     * Export sales data
     */
    exportSalesData() {
        const salesLog = this.getSalesLog();
        const inventory = this.getInventory();

        const exportData = {
            sales: salesLog,
            inventory: inventory,
            exportDate: new Date().toISOString(),
            summary: {
                totalSales: salesLog.reduce((sum, sale) => sum + sale.total, 0),
                totalTransactions: salesLog.length,
                totalStock: inventory.reduce((sum, item) => sum + item.stock, 0)
            }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `shoepoint-sales-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showNotification('Sales data exported successfully.', 'success');
    },

    /**
     * Add new product
     */
    addProduct(productData) {
        console.log('PhysicalSalesManager.addProduct called with:', productData);
        
        const inventory = this.getInventory();
        console.log('Current inventory length:', inventory.length);
        
        const newId = inventory.length > 0 ? Math.max(...inventory.map(p => p.id), 0) + 1 : 1;
        console.log('New product ID will be:', newId);

        const newProduct = {
            id: newId,
            name: productData.name,
            price: parseFloat(productData.price),
            stock: parseInt(productData.stock),
            category: productData.category,
            description: productData.description || '',
            image: productData.image || 'default.webp',
            sizes: productData.sizes || [],
            colors: productData.colors || [],
            createdAt: new Date().toISOString()
        };

        console.log('New product object created:', newProduct);

        inventory.push(newProduct);
        console.log('Product added to inventory, new length:', inventory.length);
        
        this.updateInventory(inventory);
        console.log('Inventory updated in localStorage');
        
        // Don't call renderAll here to avoid potential issues
        console.log('Skipping renderAll() to avoid errors');
        
        // Also refresh dashboard inventory if AdminDashboard is available
        if (typeof AdminDashboard !== 'undefined') {
            AdminDashboard.loadDashboardInventory();
            console.log('Dashboard inventory refreshed');
        }

        this.showNotification(`Product "${newProduct.name}" added successfully!`, 'success');
        console.log('Success notification shown');
        
        return newProduct;
    },

    /**
     * Update existing product
     */
    updateProduct(productId, productData) {
        const inventory = this.getInventory();
        const productIndex = inventory.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            this.showNotification('Product not found!', 'error');
            return false;
        }

        inventory[productIndex] = {
            ...inventory[productIndex],
            name: productData.name,
            price: parseFloat(productData.price),
            stock: parseInt(productData.stock),
            category: productData.category,
            description: productData.description || '',
            image: productData.image || inventory[productIndex].image,
            sizes: productData.sizes || [],
            colors: productData.colors || [],
            updatedAt: new Date().toISOString()
        };

        this.updateInventory(inventory);
        this.renderAll();

        this.showNotification(`Product "${inventory[productIndex].name}" updated successfully!`, 'success');
        return true;
    },

    /**
     * Delete product
     */
    deleteProduct(productId) {
        const inventory = this.getInventory();
        const productIndex = inventory.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            this.showNotification('Product not found!', 'error');
            return false;
        }

        const productName = inventory[productIndex].name;
        inventory.splice(productIndex, 1);
        this.updateInventory(inventory);
        this.renderAll();

        this.showNotification(`Product "${productName}" deleted successfully!`, 'success');
        return true;
    },

    /**
     * Get product by ID
     */
    getProduct(productId) {
        const inventory = this.getInventory();
        return inventory.find(p => p.id === productId);
    },

    /**
     * Search and filter products
     */
    searchProducts(searchTerm, category = '') {
        const inventory = this.getInventory();
        return inventory.filter(product => {
            const matchesSearch = !searchTerm ||
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = !category || product.category === category;

            return matchesSearch && matchesCategory;
        });
    },

    /**
     * Delete individual sale record
     */
    deleteSaleRecord(saleId) {
        const salesLog = this.getSalesLog();
        const saleIndex = salesLog.findIndex(sale => sale.id === saleId);

        if (saleIndex === -1) {
            this.showNotification('Sale record not found!', 'error');
            return false;
        }

        salesLog.splice(saleIndex, 1);
        localStorage.setItem(this.SALES_LOG_KEY, JSON.stringify(salesLog));
        this.renderAll();

        this.showNotification('Sale record deleted successfully!', 'success');
        return true;
    },

    /**
     * Filter sales by date range
     */
    filterSalesByDate(fromDate, toDate) {
        const salesLog = this.getSalesLog();

        if (!fromDate && !toDate) {
            return salesLog;
        }

        return salesLog.filter(sale => {
            const saleDate = new Date(sale.timestamp);
            const from = fromDate ? new Date(fromDate) : new Date('1900-01-01');
            const to = toDate ? new Date(toDate + 'T23:59:59') : new Date();

            return saleDate >= from && saleDate <= to;
        });
    },

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-width: 300px;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            notification.style.transition = 'all 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
};

// Global functions for onclick handlers
function processSale() {
    PhysicalSalesManager.processSale();
}

function resetInventory() {
    PhysicalSalesManager.resetInventory();
}

function clearSalesLog() {
    PhysicalSalesManager.clearSalesLog();
}

function exportSalesData() {
    PhysicalSalesManager.exportSalesData();
}

// ===== RETURN PROCESSING FUNCTIONS =====

/**
 * Load return details when a sale is selected
 */
function loadReturnDetails() {
    const returnSaleSelect = document.getElementById('return-sale-select');
    const returnDetails = document.getElementById('return-details');
    const returnInfo = document.getElementById('return-info');
    
    if (!returnSaleSelect.value) {
        returnDetails.style.display = 'none';
        return;
    }
    
    const returnableSales = ReturnManager.getReturnableSales();
    const selectedSale = returnableSales.find(sale => sale.saleId === returnSaleSelect.value);
    
    if (selectedSale) {
        returnInfo.innerHTML = `
            <div class="return-sale-info">
                <p><strong>Product:</strong> ${selectedSale.productName}</p>
                <p><strong>Size:</strong> ${selectedSale.size} | <strong>Color:</strong> ${selectedSale.color}</p>
                <p><strong>Original Quantity:</strong> ${selectedSale.quantity}</p>
                <p><strong>Available for Return:</strong> ${selectedSale.availableForReturn}</p>
                <p><strong>Sale Price:</strong> Rs.${selectedSale.price} each</p>
            </div>
        `;
        
        const returnQuantityInput = document.getElementById('return-quantity-input');
        returnQuantityInput.max = selectedSale.availableForReturn;
        returnQuantityInput.value = Math.min(1, selectedSale.availableForReturn);
        
        returnDetails.style.display = 'block';
    }
}

/**
 * Process a return transaction
 */
function processReturn() {
    const returnSaleSelect = document.getElementById('return-sale-select');
    const returnQuantityInput = document.getElementById('return-quantity-input');
    
    if (!returnSaleSelect.value) {
        if (typeof PhysicalSalesManager !== 'undefined') {
            PhysicalSalesManager.showNotification('Please select a sale to return!', 'error');
        }
        return;
    }
    
    const returnQuantity = parseInt(returnQuantityInput.value);
    if (!returnQuantity || returnQuantity <= 0) {
        if (typeof PhysicalSalesManager !== 'undefined') {
            PhysicalSalesManager.showNotification('Please enter a valid return quantity!', 'error');
        }
        return;
    }
    
    try {
        const returnableSales = ReturnManager.getReturnableSales();
        const selectedSale = returnableSales.find(sale => sale.saleId === returnSaleSelect.value);
        
        if (!selectedSale) {
            throw new Error('Selected sale not found');
        }
        
        const returnRecord = ReturnManager.processReturn(
            selectedSale.saleId,
            selectedSale.productId,
            returnQuantity,
            'Customer Return',
            'Processed via admin dashboard'
        );
        
        if (typeof PhysicalSalesManager !== 'undefined') {
            PhysicalSalesManager.showNotification(
                `Return processed successfully! Refund: Rs.${returnRecord.refundAmount}`, 
                'success'
            );
        }
        
        // Reset form
        returnSaleSelect.value = '';
        document.getElementById('return-details').style.display = 'none';
        
        // Refresh displays
        loadReturnSaleOptions();
        if (typeof AdminDashboard !== 'undefined') {
            AdminDashboard.loadDashboardInventory();
            AdminDashboard.loadStockAlerts();
        }
        
    } catch (error) {
        console.error('Error processing return:', error);
        if (typeof PhysicalSalesManager !== 'undefined') {
            PhysicalSalesManager.showNotification(error.message, 'error');
        }
    }
}

/**
 * Load returnable sales into the dropdown
 */
function loadReturnSaleOptions() {
    const returnSaleSelect = document.getElementById('return-sale-select');
    if (!returnSaleSelect) return;
    
    const returnableSales = ReturnManager.getReturnableSales();
    
    returnSaleSelect.innerHTML = '<option value="">Select sale to return...</option>';
    
    returnableSales.forEach(sale => {
        const option = document.createElement('option');
        option.value = sale.saleId;
        option.textContent = `${sale.productName} (${sale.size}/${sale.color}) - ${sale.availableForReturn} available - Rs.${sale.price}`;
        returnSaleSelect.appendChild(option);
    });
}

// Physical Sales Management Functions
function switchPhysicalTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to selected tab and content
    document.querySelector(`[onclick="switchPhysicalTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load tab-specific data
    if (tabName === 'inventory') {
        PhysicalSalesManager.renderInventory();
    } else if (tabName === 'sales') {
        loadSaleProductOptions();
    } else if (tabName === 'history') {
        renderSalesHistory();
    }
}

// Removed duplicate function - using enhanced version below

function loadProductOptions() {
    const productSelect = document.getElementById('sale-product-select');
    const productId = parseInt(productSelect.value);
    const optionsRow = document.getElementById('product-options-row');

    if (!productId) {
        optionsRow.style.display = 'none';
        return;
    }

    const product = PhysicalSalesManager.getProduct(productId);
    if (!product) return;

    // Load sizes
    const sizeSelect = document.getElementById('sale-size-select');
    sizeSelect.innerHTML = '<option value="">Select size...</option>';
    product.sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = `Size ${size}`;
        sizeSelect.appendChild(option);
    });

    // Load colors
    const colorSelect = document.getElementById('sale-color-select');
    colorSelect.innerHTML = '<option value="">Select color...</option>';
    product.colors.forEach(color => {
        const option = document.createElement('option');
        option.value = color;
        option.textContent = color;
        colorSelect.appendChild(option);
    });

    optionsRow.style.display = 'grid';
}

function loadSaleProductOptions() {
    const inventory = PhysicalSalesManager.getInventory();
    const select = document.getElementById('sale-product-select');

    select.innerHTML = '<option value="">Choose a product...</option>';
    inventory.forEach(item => {
        if (item.stock > 0) {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (${item.stock} in stock)`;
            select.appendChild(option);
        }
    });
}

function processSale() {
    const productSelect = document.getElementById('sale-product-select');
    const sizeSelect = document.getElementById('sale-size-select');
    const colorSelect = document.getElementById('sale-color-select');
    const quantityInput = document.getElementById('sale-quantity-input');

    const productId = parseInt(productSelect.value);
    const size = sizeSelect ? sizeSelect.value : '';
    const color = colorSelect ? colorSelect.value : '';
    const quantity = parseInt(quantityInput.value) || 1;

    if (!productId) {
        PhysicalSalesManager.showNotification('Please select a product!', 'error');
        return;
    }

    const options = { size, color, quantity };

    if (PhysicalSalesManager.sellItemWithOptions(productId, quantity, options)) {
        clearSaleForm();
        loadSaleProductOptions(); // Refresh product options
    }
}

function clearSaleForm() {
    document.getElementById('sale-product-select').value = '';
    document.getElementById('sale-size-select').value = '';
    document.getElementById('sale-color-select').value = '';
    document.getElementById('sale-quantity-input').value = '1';
    document.getElementById('product-options-row').style.display = 'none';
}

function renderSalesHistory() {
    const salesLog = PhysicalSalesManager.getSalesLog();
    const container = document.getElementById('sales-log');

    if (salesLog.length === 0) {
        container.innerHTML = '<div class="no-data" style="padding: 40px; text-align: center;">No sales history found.</div>';
        return;
    }

    container.innerHTML = salesLog.map(sale => {
        const date = new Date(sale.timestamp);
        let optionsText = '';
        if (sale.size || sale.color) {
            const parts = [];
            if (sale.size) parts.push(`Size ${sale.size}`);
            if (sale.color) parts.push(sale.color);
            optionsText = ` • ${parts.join(', ')}`;
        }

        return `
            <div class="sale-log-item">
                <div class="sale-log-details">
                    <div class="sale-log-product">${sale.productName}${optionsText}</div>
                    <div class="sale-log-info">
                        Qty: ${sale.quantity} • Rs ${sale.price.toLocaleString()} each • 
                        ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <div class="sale-log-amount">Rs ${sale.total.toLocaleString()}</div>
                <div class="sale-log-actions">
                    <button onclick="deleteSaleRecord(${sale.id})" class="action-btn-small delete-btn" title="Delete Sale">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteSaleRecord(saleId) {
    if (confirm('Are you sure you want to delete this sale record?')) {
        PhysicalSalesManager.deleteSaleRecord(saleId);
        renderSalesHistory();
    }
}

function filterSalesHistory() {
    const fromDate = document.getElementById('date-from').value;
    const toDate = document.getElementById('date-to').value;

    const filteredSales = PhysicalSalesManager.filterSalesByDate(fromDate, toDate);
    const container = document.getElementById('sales-log');

    if (filteredSales.length === 0) {
        container.innerHTML = '<div class="no-data" style="padding: 40px; text-align: center;">No sales found for the selected date range.</div>';
        return;
    }

    container.innerHTML = filteredSales.map(sale => {
        const date = new Date(sale.timestamp);
        let optionsText = '';
        if (sale.size || sale.color) {
            const parts = [];
            if (sale.size) parts.push(`Size ${sale.size}`);
            if (sale.color) parts.push(sale.color);
            optionsText = ` • ${parts.join(', ')}`;
        }

        return `
            <div class="sale-log-item">
                <div class="sale-log-details">
                    <div class="sale-log-product">${sale.productName}${optionsText}</div>
                    <div class="sale-log-info">
                        Qty: ${sale.quantity} • Rs ${sale.price.toLocaleString()} each • 
                        ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <div class="sale-log-amount">Rs ${sale.total.toLocaleString()}</div>
                <div class="sale-log-actions">
                    <button onclick="deleteSaleRecord(${sale.id})" class="action-btn-small delete-btn" title="Delete Sale">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// Dashboard quick sell function
function processDashboardSale() {
    try {
        const productSelect = document.getElementById('dashboard-product-select');
        const quantityInput = document.getElementById('dashboard-quantity-input');
        const sizeSelect = document.getElementById('dashboard-size-select');
        const colorSelect = document.getElementById('dashboard-color-select');

        if (!productSelect || !quantityInput) {
            console.warn('Dashboard sell elements not found');
            return;
        }

        const productId = parseInt(productSelect.value);
        const quantity = parseInt(quantityInput.value) || 1;
        const size = sizeSelect ? sizeSelect.value : '';
        const color = colorSelect ? colorSelect.value : '';

        if (!productId) {
            if (typeof PhysicalSalesManager !== 'undefined') {
                PhysicalSalesManager.showNotification('Please select a product!', 'error');
            } else {
                alert('Please select a product!');
            }
            return;
        }

        // Create sale options with size and color
        const saleOptions = {
            size: size,
            color: color,
            quantity: quantity
        };

        if (typeof PhysicalSalesManager !== 'undefined' && PhysicalSalesManager.sellItemWithOptions(productId, quantity, saleOptions)) {
            // Reset form
            productSelect.value = '';
            quantityInput.value = '1';
            if (sizeSelect) sizeSelect.value = '';
            if (colorSelect) colorSelect.value = '';
            document.getElementById('dashboard-product-options').style.display = 'none';

            // Refresh dashboard data
            if (typeof AdminDashboard !== 'undefined') {
                AdminDashboard.loadDashboardData();
            }
        }
    } catch (error) {
        console.error('Error processing dashboard sale:', error);
    }
}

// Dashboard product options loader
function loadDashboardProductOptions() {
    const productSelect = document.getElementById('dashboard-product-select');
    const productId = parseInt(productSelect.value);
    const optionsDiv = document.getElementById('dashboard-product-options');

    if (!productId) {
        optionsDiv.style.display = 'none';
        return;
    }

    if (typeof PhysicalSalesManager === 'undefined') {
        console.warn('PhysicalSalesManager not found');
        return;
    }

    const product = PhysicalSalesManager.getProduct(productId);
    if (!product) return;

    // Load sizes
    const sizeSelect = document.getElementById('dashboard-size-select');
    sizeSelect.innerHTML = '<option value="">Select size...</option>';
    if (product.sizes && product.sizes.length > 0) {
        product.sizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = `Size ${size}`;
            sizeSelect.appendChild(option);
        });
    }

    // Load colors
    const colorSelect = document.getElementById('dashboard-color-select');
    colorSelect.innerHTML = '<option value="">Select color...</option>';
    if (product.colors && product.colors.length > 0) {
        product.colors.forEach(color => {
            const option = document.createElement('option');
            option.value = color;
            option.textContent = color;
            colorSelect.appendChild(option);
        });
    }

    optionsDiv.style.display = 'grid';
}

// Dashboard product management functions
function showAddProductModal() {
    document.getElementById('physical-product-modal').style.display = 'flex';
    document.getElementById('physical-product-modal-title').textContent = 'Add New Physical Product';
    document.getElementById('physical-product-form').reset();
    delete document.getElementById('physical-product-form').dataset.productId;
}

function closePhysicalProductModal() {
    document.getElementById('physical-product-modal').style.display = 'none';
}

function editDashboardProduct(productId) {
    if (typeof PhysicalSalesManager === 'undefined') return;

    const product = PhysicalSalesManager.getProduct(productId);
    if (!product) return;

    // Fill form with product data
    document.getElementById('physical-product-name').value = product.name;
    document.getElementById('physical-product-price').value = product.price;
    document.getElementById('physical-product-stock').value = product.stock;
    document.getElementById('physical-product-category').value = product.category;
    document.getElementById('physical-product-description').value = product.description || '';
    document.getElementById('physical-product-image').value = product.image;

    // Check sizes
    document.querySelectorAll('input[name="sizes"]').forEach(checkbox => {
        checkbox.checked = product.sizes && product.sizes.includes(checkbox.value);
    });

    // Check colors
    document.querySelectorAll('input[name="colors"]').forEach(checkbox => {
        checkbox.checked = product.colors && product.colors.includes(checkbox.value);
    });

    // Update modal title and show
    document.getElementById('physical-product-modal-title').textContent = 'Edit Product';
    document.getElementById('physical-product-modal').style.display = 'flex';

    // Store product ID for update
    document.getElementById('physical-product-form').dataset.productId = productId;
}

function deleteDashboardProduct(productId) {
    if (typeof PhysicalSalesManager === 'undefined') return;

    const product = PhysicalSalesManager.getProduct(productId);
    if (!product) return;

    if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
        PhysicalSalesManager.deleteProduct(productId);
        // Only refresh dashboard inventory, not full dashboard data
        if (typeof AdminDashboard !== 'undefined') {
            AdminDashboard.loadDashboardInventory();
            AdminDashboard.loadQuickSellWidget();
            AdminDashboard.loadStockAlerts();
        }
    }
}
// ===== TESTING FUNCTIONS =====
function testDirectLogin() {
    console.log('Direct login test initiated');

    // Set the form values
    document.getElementById('admin-username').value = 'admin';
    document.getElementById('admin-password').value = 'shoepoint123';

    // Directly call the login process
    if (AuthManager.login('admin', 'shoepoint123')) {
        console.log('Direct login successful');

        // Hide login screen and show dashboard
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'flex';

        // Initialize dashboard
        try {
            DataManager.initializeProducts();
            AdminDashboard.loadDashboardData();
            AdminDashboard.setupRealTimeNotifications();
            WebsiteIntegration.listenForOrders();

            AdminUtils.showNotification('Direct login successful!');
            console.log('Dashboard initialized successfully');
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            AdminUtils.showNotification('Error: ' + error.message, 'error');
        }
    } else {
        console.log('Direct login failed');
        AdminUtils.showNotification('Direct login failed', 'error');
    }
}

// Enhanced inventory rendering with CRUD operations
PhysicalSalesManager.renderInventory = function () {
    console.log('Rendering inventory...');
    const inventory = this.getInventory();
    const grid = document.getElementById('inventory-grid');

    console.log('Inventory items:', inventory.length);
    console.log('Grid element:', grid);

    if (!grid) {
        console.warn('Inventory grid element not found');
        return;
    }

    if (inventory.length === 0) {
        grid.innerHTML = '<div class="no-data" style="padding: 40px; text-align: center; grid-column: 1/-1;">No products found. Add your first product to get started!</div>';
        return;
    }

    grid.innerHTML = inventory.map(item => {
        const stockClass = item.stock === 0 ? 'out' : item.stock < 5 ? 'low' : '';
        const stockText = item.stock === 0 ? 'Out of Stock' : `${item.stock} in stock`;

        return `
            <div class="inventory-item">
                <div class="inventory-item-header">
                    <h4 class="inventory-item-title">${item.name}</h4>
                    <div class="inventory-item-actions">
                        <button onclick="editProduct(${item.id})" class="action-btn-small edit-btn" title="Edit Product">✏️</button>
                        <button onclick="deleteProduct(${item.id})" class="action-btn-small delete-btn" title="Delete Product">🗑️</button>
                    </div>
                </div>
                
                <div class="inventory-item-details">
                    <div class="detail-item">
                        <div class="detail-label">Price:</div>
                        <div class="detail-value">Rs ${item.price.toLocaleString()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Stock:</div>
                        <div class="detail-value stock-count ${stockClass}">${stockText}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Category:</div>
                        <div class="detail-value">${item.category}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Image:</div>
                        <div class="detail-value">${item.image}</div>
                    </div>
                </div>
                
                ${item.description ? `<div class="inventory-description">${item.description}</div>` : ''}
                
                <div class="inventory-options">
                    <div class="options-row">
                        <div class="option-group">
                            <div class="option-label">Available Sizes:</div>
                            <div class="option-tags">
                                ${item.sizes.map(size => `<span class="option-tag">Size ${size}</span>`).join('')}
                            </div>
                        </div>
                        <div class="option-group">
                            <div class="option-label">Available Colors:</div>
                            <div class="option-tags">
                                ${item.colors.map(color => `<span class="option-tag">${color}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

// Product management functions
function editProduct(productId) {
    const product = PhysicalSalesManager.getProduct(productId);
    if (!product) return;

    // Fill form with product data
    document.getElementById('physical-product-name').value = product.name;
    document.getElementById('physical-product-price').value = product.price;
    document.getElementById('physical-product-stock').value = product.stock;
    document.getElementById('physical-product-category').value = product.category;
    document.getElementById('physical-product-description').value = product.description || '';
    document.getElementById('physical-product-image').value = product.image;

    // Check sizes
    document.querySelectorAll('input[name="sizes"]').forEach(checkbox => {
        checkbox.checked = product.sizes.includes(checkbox.value);
    });

    // Check colors
    document.querySelectorAll('input[name="colors"]').forEach(checkbox => {
        checkbox.checked = product.colors.includes(checkbox.value);
    });

    // Update modal title and show
    document.getElementById('physical-product-modal-title').textContent = 'Edit Product';
    document.getElementById('physical-product-modal').style.display = 'flex';

    // Store product ID for update
    document.getElementById('physical-product-form').dataset.productId = productId;
}

function deleteProduct(productId) {
    const product = PhysicalSalesManager.getProduct(productId);
    if (!product) return;

    if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
        PhysicalSalesManager.deleteProduct(productId);
        PhysicalSalesManager.renderInventory();
    }
}

// ===== EVENT MANAGEMENT SYSTEM =====
const EventManager = {
    registeredEvents: new Set(),
    
    registerOnce(element, event, handler, key) {
        if (!this.registeredEvents.has(key)) {
            element.addEventListener(event, handler);
            this.registeredEvents.add(key);
        }
    },
    
    preventDuplicateSubmission(button, operation) {
        if (button.disabled) return false;
        
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = 'Processing...';
        
        return operation().finally(() => {
            button.disabled = false;
            button.textContent = originalText;
        });
    }
};

// ===== SEARCH MANAGER =====
const SearchManager = {
    currentSearchTerm: '',
    currentCategory: '',
    
    /**
     * Filter products based on search term and category
     */
    filterProducts(searchTerm = '', category = '') {
        this.currentSearchTerm = searchTerm.toLowerCase();
        this.currentCategory = category;
        
        if (typeof PhysicalSalesManager === 'undefined') {
            console.warn('PhysicalSalesManager not available for filtering');
            return [];
        }
        
        const allProducts = PhysicalSalesManager.getInventory();
        
        return allProducts.filter(product => {
            // Text search across name, description, and category
            const matchesSearch = !this.currentSearchTerm || 
                product.name.toLowerCase().includes(this.currentSearchTerm) ||
                (product.description && product.description.toLowerCase().includes(this.currentSearchTerm)) ||
                (product.category && product.category.toLowerCase().includes(this.currentSearchTerm));
            
            // Category filter
            const matchesCategory = !this.currentCategory || 
                (product.category && product.category === this.currentCategory) ||
                (this.currentCategory === 'Uncategorized' && (!product.category || product.category === 'Uncategorized'));
            
            return matchesSearch && matchesCategory;
        });
    },
    
    /**
     * Update display with filtered products
     */
    updateDisplay(containerId, filteredProducts) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (filteredProducts.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <p>No products found matching your search criteria.</p>
                    <p>Try adjusting your search terms or category filter.</p>
                </div>
            `;
            return;
        }
        
        // Re-render the products using the existing render function
        if (containerId === 'dashboard-inventory-list') {
            this.renderDashboardInventory(filteredProducts);
        } else if (containerId === 'inventory-grid') {
            this.renderPhysicalInventory(filteredProducts);
        }
    },
    
    /**
     * Render filtered products for dashboard
     */
    renderDashboardInventory(products) {
        const container = document.getElementById('dashboard-inventory-list');
        if (!container) return;
        
        container.innerHTML = products.map(product => {
            const stockClass = product.stock === 0 ? 'out-of-stock' : product.stock < 2 ? 'low-stock' : 'in-stock';
            const stockText = product.stock === 0 ? 'Out of Stock' : `${product.stock} in stock`;
            
            return `
                <div class="inventory-item">
                    <div class="item-info">
                        <h4>${product.name}</h4>
                        <p class="item-category">${product.category || 'Uncategorized'}</p>
                        <p class="item-price">Rs.${product.price}</p>
                        <span class="stock-count ${stockClass}">${stockText}</span>
                    </div>
                    <div class="item-actions">
                        <button onclick="editDashboardProduct(${product.id})" class="edit-btn">✏️ Edit</button>
                        <button onclick="deleteDashboardProduct(${product.id})" class="delete-btn">🗑️ Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    /**
     * Render filtered products for physical sales section
     */
    renderPhysicalInventory(products) {
        const container = document.getElementById('inventory-grid');
        if (!container) return;
        
        container.innerHTML = products.map(product => {
            const stockClass = product.stock === 0 ? 'out-of-stock' : product.stock < 2 ? 'low-stock' : 'in-stock';
            const stockText = product.stock === 0 ? 'Out of Stock' : `${product.stock} in stock`;
            
            return `
                <div class="inventory-item">
                    <div class="item-header">
                        <h4>${product.name}</h4>
                        <span class="item-category">${product.category || 'Uncategorized'}</span>
                    </div>
                    <div class="item-details">
                        <p class="item-price">Rs.${product.price}</p>
                        <p class="item-sizes">Sizes: ${product.sizes.join(', ')}</p>
                        <p class="item-colors">Colors: ${product.colors.join(', ')}</p>
                        <span class="stock-count ${stockClass}">${stockText}</span>
                    </div>
                    <div class="item-actions">
                        <button onclick="editProduct(${product.id})" class="edit-btn">✏️ Edit</button>
                        <button onclick="deleteProduct(${product.id})" class="delete-btn">🗑️ Delete</button>
                        <button onclick="PhysicalSalesManager.sellItem(${product.id})" class="sell-btn" ${product.stock === 0 ? 'disabled' : ''}>
                            💰 Sell 1 Unit
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
};

// ===== RETURN MANAGER =====
const ReturnManager = {
    RETURNS_KEY: 'shoepoint_returns_log',
    
    /**
     * Get all returns from localStorage
     */
    getReturns() {
        try {
            const returns = localStorage.getItem(this.RETURNS_KEY);
            return returns ? JSON.parse(returns) : [];
        } catch (error) {
            console.error('Error loading returns:', error);
            return [];
        }
    },
    
    /**
     * Save returns to localStorage
     */
    saveReturns(returns) {
        try {
            localStorage.setItem(this.RETURNS_KEY, JSON.stringify(returns));
        } catch (error) {
            console.error('Error saving returns:', error);
        }
    },
    
    /**
     * Process a return transaction
     */
    processReturn(originalSaleId, productId, returnQuantity, reason = 'Customer Request', notes = '') {
        if (typeof PhysicalSalesManager === 'undefined') {
            throw new Error('PhysicalSalesManager not available');
        }
        
        // Get the original sale
        const salesLog = PhysicalSalesManager.getSalesLog();
        const originalSale = salesLog.find(sale => sale.saleId === originalSaleId);
        
        if (!originalSale) {
            throw new Error('Original sale not found');
        }
        
        // Validate return quantity
        const existingReturns = this.getReturns().filter(ret => ret.originalSaleId === originalSaleId);
        const totalReturned = existingReturns.reduce((sum, ret) => sum + ret.returnQuantity, 0);
        
        if (totalReturned + returnQuantity > originalSale.quantity) {
            throw new Error(`Cannot return ${returnQuantity} items. Only ${originalSale.quantity - totalReturned} items available for return.`);
        }
        
        // Create return record
        const returnRecord = {
            returnId: 'ret_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            originalSaleId: originalSaleId,
            productId: productId,
            productName: originalSale.productName,
            size: originalSale.size,
            color: originalSale.color,
            returnQuantity: returnQuantity,
            originalQuantity: originalSale.quantity,
            reason: reason,
            refundAmount: (originalSale.price * returnQuantity),
            processedBy: 'admin',
            processedAt: Date.now(),
            notes: notes
        };
        
        // Save return record
        const returns = this.getReturns();
        returns.push(returnRecord);
        this.saveReturns(returns);
        
        // Update product stock
        PhysicalSalesManager.updateProductStock(productId, returnQuantity);
        
        // Update sales log with return information
        this.updateSalesLogWithReturn(originalSaleId, returnRecord);
        
        return returnRecord;
    },
    
    /**
     * Update sales log to reflect return
     */
    updateSalesLogWithReturn(saleId, returnRecord) {
        if (typeof PhysicalSalesManager === 'undefined') return;
        
        const salesLog = PhysicalSalesManager.getSalesLog();
        const saleIndex = salesLog.findIndex(sale => sale.saleId === saleId);
        
        if (saleIndex !== -1) {
            if (!salesLog[saleIndex].returns) {
                salesLog[saleIndex].returns = [];
            }
            
            salesLog[saleIndex].returns.push(returnRecord);
            
            // Calculate net quantities and amounts
            const totalReturned = salesLog[saleIndex].returns.reduce((sum, ret) => sum + ret.returnQuantity, 0);
            const totalRefunded = salesLog[saleIndex].returns.reduce((sum, ret) => sum + ret.refundAmount, 0);
            
            salesLog[saleIndex].netQuantity = salesLog[saleIndex].quantity - totalReturned;
            salesLog[saleIndex].netAmount = salesLog[saleIndex].total - totalRefunded;
            
            // Save updated sales log
            PhysicalSalesManager.saveSalesLog(salesLog);
        }
    },
    
    /**
     * Get returnable sales (sales that can still have returns processed)
     */
    getReturnableSales() {
        if (typeof PhysicalSalesManager === 'undefined') return [];
        
        const salesLog = PhysicalSalesManager.getSalesLog();
        const returns = this.getReturns();
        
        return salesLog.filter(sale => {
            const saleReturns = returns.filter(ret => ret.originalSaleId === sale.saleId);
            const totalReturned = saleReturns.reduce((sum, ret) => sum + ret.returnQuantity, 0);
            return totalReturned < sale.quantity; // Still has items that can be returned
        }).map(sale => {
            const saleReturns = returns.filter(ret => ret.originalSaleId === sale.saleId);
            const totalReturned = saleReturns.reduce((sum, ret) => sum + ret.returnQuantity, 0);
            
            return {
                ...sale,
                availableForReturn: sale.quantity - totalReturned,
                totalReturned: totalReturned
            };
        });
    },
    
    /**
     * Get return history
     */
    getReturnHistory() {
        return this.getReturns().sort((a, b) => b.processedAt - a.processedAt);
    }
};

// Global function for loading dashboard inventory
function loadDashboardInventory() {
    if (typeof AdminDashboard !== 'undefined') {
        AdminDashboard.loadDashboardInventory();
    }
}

// ===== GLOBAL SEARCH AND FILTER FUNCTIONS =====

/**
 * Filter dashboard inventory based on search and category
 */
function filterDashboardInventory() {
    const searchInput = document.getElementById('product-search');
    const categoryFilter = document.getElementById('category-filter');
    
    if (!searchInput || !categoryFilter) return;
    
    const searchTerm = searchInput.value;
    const category = categoryFilter.value;
    
    const filteredProducts = SearchManager.filterProducts(searchTerm, category);
    SearchManager.updateDisplay('dashboard-inventory-list', filteredProducts);
}

/**
 * Filter physical sales inventory based on search and category
 */
function filterPhysicalInventory() {
    const searchInput = document.getElementById('physical-product-search');
    const categoryFilter = document.getElementById('physical-category-filter');
    
    if (!searchInput || !categoryFilter) return;
    
    const searchTerm = searchInput.value;
    const category = categoryFilter.value;
    
    const filteredProducts = SearchManager.filterProducts(searchTerm, category);
    SearchManager.updateDisplay('inventory-grid', filteredProducts);
}

/**
 * Initialize search functionality for both sections
 */
function initializeSearchFunctionality() {
    // Dashboard search
    const dashboardSearch = document.getElementById('product-search');
    const dashboardCategoryFilter = document.getElementById('category-filter');
    
    if (dashboardSearch) {
        dashboardSearch.addEventListener('input', filterDashboardInventory);
    }
    
    if (dashboardCategoryFilter) {
        dashboardCategoryFilter.addEventListener('change', filterDashboardInventory);
    }
    
    // Physical sales search (different IDs to avoid conflicts)
    const physicalSearch = document.querySelector('#inventory-tab input[placeholder="Search products..."]');
    const physicalCategoryFilter = document.querySelector('#inventory-tab select');
    
    if (physicalSearch) {
        physicalSearch.addEventListener('input', filterPhysicalInventory);
    }
    
    if (physicalCategoryFilter) {
        physicalCategoryFilter.addEventListener('change', filterPhysicalInventory);
    }
}

// ===== ENHANCED FORM SUBMISSION HANDLER =====
document.addEventListener('DOMContentLoaded', function () {
    const physicalProductForm = document.getElementById('physical-product-form');
    if (physicalProductForm) {
        // Remove any existing listeners first
        physicalProductForm.removeEventListener('submit', handlePhysicalProductSubmit);
        physicalProductForm.addEventListener('submit', handlePhysicalProductSubmit);
    }
});

function handlePhysicalProductSubmit(e) {
    console.log('handlePhysicalProductSubmit called');
    e.preventDefault();
    
    const submitButton = this.querySelector('button[type="submit"]') || this.querySelector('.primary-btn');
    console.log('Submit button found:', submitButton);
    
    // Prevent double submission
    if (submitButton.disabled) return;
    
    submitButton.disabled = true;
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    
    // Helper function to reset button
    const resetButton = () => {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    };
    
    try {
        const formData = new FormData(this);
        const productData = {
            name: formData.get('name'),
            price: formData.get('price'),
            stock: formData.get('stock'),
            category: formData.get('category') || 'Uncategorized', // Make category optional
            description: formData.get('description'),
            image: formData.get('image') || 'default.webp',
            sizes: formData.getAll('sizes'),
            colors: formData.getAll('colors')
        };

        console.log('Form data collected:', productData);
        console.log('Name:', productData.name);
        console.log('Price:', productData.price);
        console.log('Stock:', productData.stock);
        console.log('Sizes:', productData.sizes);
        console.log('Colors:', productData.colors);

        // Enhanced validation with better error messages
        if (!productData.name || !productData.price || !productData.stock) {
            console.log('Validation failed: missing required fields');
            if (typeof PhysicalSalesManager !== 'undefined') {
                PhysicalSalesManager.showNotification('Please fill in all required fields (Name, Price, Stock)!', 'error');
            } else {
                alert('Please fill in all required fields (Name, Price, Stock)!');
            }
            resetButton();
            return;
        }

        if (productData.sizes.length === 0) {
            console.log('Validation failed: no sizes selected');
            if (typeof PhysicalSalesManager !== 'undefined') {
                PhysicalSalesManager.showNotification('Please select at least one size!', 'error');
            } else {
                alert('Please select at least one size!');
            }
            resetButton();
            return;
        }

        if (productData.colors.length === 0) {
            console.log('Validation failed: no colors selected');
            if (typeof PhysicalSalesManager !== 'undefined') {
                PhysicalSalesManager.showNotification('Please select at least one color!', 'error');
            } else {
                alert('Please select at least one color!');
            }
            resetButton();
            return;
        }

        if (typeof PhysicalSalesManager === 'undefined') {
            alert('Physical Sales Manager not available');
            resetButton();
            return;
        }

        console.log('Validation passed, processing product...');

        // Check if editing or adding
        const productId = this.dataset.productId;
        if (productId) {
            // Update existing product
            console.log('Updating product with ID:', productId);
            PhysicalSalesManager.updateProduct(parseInt(productId), productData);
            PhysicalSalesManager.showNotification('Product updated successfully!', 'success');
            delete this.dataset.productId;
        } else {
            // Add new product
            console.log('Adding new product...');
            const newProduct = PhysicalSalesManager.addProduct(productData);
            console.log('New product added:', newProduct);
            PhysicalSalesManager.showNotification('Product added successfully!', 'success');
        }

        closePhysicalProductModal();

        // Refresh dashboard inventory and data
        if (typeof AdminDashboard !== 'undefined') {
            AdminDashboard.loadDashboardInventory();
            AdminDashboard.loadQuickSellWidget();
            AdminDashboard.loadStockAlerts();
        }
        
        // Refresh physical sales inventory if on that section
        if (typeof PhysicalSalesManager !== 'undefined') {
            PhysicalSalesManager.renderInventory();
        }
        
        console.log('Product processing completed successfully');
        resetButton();
        
    } catch (error) {
        console.error('Error processing product:', error);
        if (typeof PhysicalSalesManager !== 'undefined') {
            PhysicalSalesManager.showNotification('Error processing product. Please try again.', 'error');
        } else {
            alert('Error processing product. Please try again.');
        }
        resetButton();
    }
}