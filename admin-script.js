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
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        const loginBtn = document.querySelector('.login-btn');
        const loginText = document.querySelector('.login-text');
        const loginSpinner = document.querySelector('.login-spinner');

        // Show loading state
        loginBtn.disabled = true;
        loginText.style.display = 'none';
        loginSpinner.style.display = 'inline';

        // Simulate login delay
        setTimeout(() => {
            if (AuthManager.login(username, password)) {
                console.log('Login successful, showing dashboard');
                AdminUtils.showNotification('Login successful! Welcome to Admin Dashboard.');

                // Hide login screen and show dashboard
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('admin-dashboard').style.display = 'flex';

                // Initialize dashboard components
                DataManager.initializeProducts();
                this.loadDashboardData();
                this.setupRealTimeNotifications();
                WebsiteIntegration.listenForOrders();

            } else {
                console.log('Login failed');
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
    loadDashboardData() {
        this.loadStats();
        this.loadRecentOrders();
    },

    /**
     * Load statistics
     */
    loadStats() {
        const stats = DataManager.getStats();

        document.getElementById('total-revenue').textContent = AdminUtils.formatCurrency(stats.totalRevenue);
        document.getElementById('total-orders').textContent = stats.totalOrders;
        document.getElementById('total-products').textContent = stats.totalProducts;
        document.getElementById('total-customers').textContent = stats.totalCustomers;
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
     * Load section-specific data
     */
    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'overview':
                this.loadDashboardData();
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
    loadOrders() {
        const orders = DataManager.getOrders();
        const container = document.getElementById('orders-table');

        if (orders.length === 0) {
            container.innerHTML = '<p class="no-data">No orders found. Orders will appear here once customers make purchases.</p>';
            return;
        }

        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td><strong>#${order.orderId}</strong></td>
                            <td>${order.customerInfo?.name || 'Guest'}</td>
                            <td>${order.items.length} item(s)</td>
                            <td>${AdminUtils.formatCurrency(order.payment.amount)}</td>
                            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                            <td>${AdminUtils.formatDate(order.createdAt)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * Load customers
     */
    loadCustomers() {
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
     * Load analytics
     */
    loadAnalytics() {
        // Analytics implementation would go here
        // For now, showing placeholder
        console.log('Analytics section loaded');
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
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    AdminDashboard.init();
});

// ===== GLOBAL FUNCTIONS =====
window.AdminDashboard = AdminDashboard;