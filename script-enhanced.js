/**
 * Shoe Point E-commerce Website
 * Enhanced JavaScript with proper error handling and organization
 */

console.log('Script loaded successfully');

// ===== CONSTANTS & CONFIGURATION =====
const CONFIG = {
    FREE_SHIPPING_THRESHOLD: 15000,
    COUNTDOWN_DURATION_DAYS: 2,
    CART_STORAGE_KEY: 'shoepoint_cart',
    PAYMENT: {
        PAYPAL: {
            CLIENT_ID: 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R',
            CURRENCY: 'USD',
            ENVIRONMENT: 'sandbox' // Change to 'production' for live
        },
        STRIPE: {
            PUBLISHABLE_KEY: 'pk_test_51234567890abcdef', // Replace with your Stripe publishable key
            CURRENCY: 'usd'
        }
    },
    SELECTORS: {
        cartButtons: '.btn-cart',
        shopButtons: '.btn-primary',
        viewMoreBtn: '#view-more-btn',
        countdownElements: {
            days: '#days',
            hours: '#hours',
            minutes: '#minutes'
        },
        cartSummary: '#cart-summary',
        paymentModal: '#payment-modal',
        paypalContainer: '#paypal-button-container',
        stripeContainer: '#stripe-card-element'
    }
};

// ===== UTILITY FUNCTIONS =====
const Utils = {
    /**
     * Safely query DOM elements
     */
    querySelector: (selector) => {
        try {
            return document.querySelector(selector);
        } catch (error) {
            console.warn(`Failed to query selector: ${selector}`, error);
            return null;
        }
    },

    /**
     * Safely query multiple DOM elements
     */
    querySelectorAll: (selector) => {
        try {
            return document.querySelectorAll(selector);
        } catch (error) {
            console.warn(`Failed to query selector: ${selector}`, error);
            return [];
        }
    },

    /**
     * Format currency in rupees
     */
    formatCurrency: (amount) => {
        return `Rs ${amount.toFixed(2)}`;
    },

    /**
     * Debounce function calls
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Show notification
     */
    showNotification: (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            z-index: 10000;
            font-family: 'Nunito Sans', sans-serif;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            notification.style.transition = 'all 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};

// ===== CART MANAGEMENT =====
const CartManager = {
    cart: {
        items: [],
        subtotal: 0,
        shipping: 0,
        total: 0,
        timestamp: null,
        customerId: null
    },

    /**
     * Initialize cart from localStorage
     */
    init() {
        try {
            const savedCart = localStorage.getItem(CONFIG.CART_STORAGE_KEY);
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                // Check if cart is expired (24 hours)
                const cartAge = Date.now() - (parsedCart.timestamp || 0);
                if (cartAge > 24 * 60 * 60 * 1000) {
                    console.log('Cart expired, clearing...');
                    this.clearCart();
                } else {
                    this.cart = parsedCart;
                    this.calculateTotals(); // Recalculate in case prices changed
                }
            } else {
                this.resetCart();
            }
        } catch (error) {
            console.warn('Failed to load cart from localStorage:', error);
            this.resetCart();
        }
        this.updateDisplay();
    },

    /**
     * Reset cart to initial state
     */
    resetCart() {
        this.cart = {
            items: [],
            subtotal: 0,
            shipping: 0,
            total: 0,
            timestamp: Date.now(),
            customerId: this.generateCustomerId()
        };
    },

    /**
     * Generate unique customer ID
     */
    generateCustomerId() {
        return 'customer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Add item to cart
     */
    addItem(productName, price, options = {}) {
        try {
            const numericPrice = parseFloat(price);
            if (isNaN(numericPrice) || numericPrice <= 0) {
                throw new Error('Invalid price format');
            }

            const itemId = this.generateItemId(productName, options);
            const existingItem = this.cart.items.find(item => item.id === itemId);

            if (existingItem) {
                existingItem.quantity += (options.quantity || 1);
            } else {
                this.cart.items.push({
                    id: itemId,
                    name: productName,
                    price: numericPrice,
                    quantity: options.quantity || 1,
                    image: options.image || this.getProductImage(productName),
                    category: options.category || 'general',
                    size: options.size || null,
                    color: options.color || null,
                    addedAt: Date.now()
                });
            }

            this.cart.timestamp = Date.now();
            this.calculateTotals();
            this.saveToStorage();
            this.updateDisplay();
            Utils.showNotification(`${productName} added to cart!`);
        } catch (error) {
            console.error('Failed to add item to cart:', error);
            Utils.showNotification('Failed to add item to cart', 'error');
        }
    },

    /**
     * Generate unique item ID
     */
    generateItemId(productName, options = {}) {
        const baseId = productName.toLowerCase().replace(/\s+/g, '-');
        const sizeId = options.size ? `-size-${options.size}` : '';
        const colorId = options.color ? `-color-${options.color.toLowerCase()}` : '';
        return `${baseId}${sizeId}${colorId}`;
    },

    /**
     * Get product image based on product name
     */
    getProductImage(productName) {
        const imageMap = {
            'Air Jordan 5 Retro': 'sl1.webp',
            'Hiking Shoes for Adventurers': 'card 1.webp',
            'High-Top Basketball Shoes': 'card 2.webp',
            'Soccer Cleats for Speed': 'card 4.webp',
            'Lightweight Running Shoes': 'card 6.webp',
            // Category products
            'Running Shoes': 'sc1.webp',
            'Basketball Shoes': 'sc2.webp',
            'Soccer Cleats': 'sc3.webp',
            'Tennis Shoes': 'sc4.webp',
            'Hiking Shoes': 'card 1.webp',
            // Additional products for categories
            'Marathon Runners': 'card 6.webp',
            'Trail Running Shoes': 'sc1.webp',
            'Court Shoes': 'card 2.webp',
            'Basketball Sneakers': 'sc2.webp',
            'Mountain Boots': 'card 1.webp',
            'Trail Hikers': 'card 1.webp',
            'Football Boots': 'card 4.webp',
            'Turf Shoes': 'sc3.webp',
            'Tennis Court Shoes': 'sc4.webp',
            'All-Court Sneakers': 'sc4.webp',
            'Clay Court Shoes': 'sc4.webp'
        };

        return imageMap[productName] || 'card 1.webp'; // Default fallback image
    },

    /**
     * Update item quantity
     */
    updateQuantity(itemId, newQuantity) {
        try {
            const item = this.cart.items.find(item => item.id === itemId);
            if (!item) {
                throw new Error('Item not found in cart');
            }

            if (newQuantity <= 0) {
                this.removeItem(itemId);
                return;
            }

            item.quantity = parseInt(newQuantity);
            this.cart.timestamp = Date.now();
            this.calculateTotals();
            this.saveToStorage();
            this.updateDisplay();
            Utils.showNotification('Cart updated');
        } catch (error) {
            console.error('Failed to update item quantity:', error);
            Utils.showNotification('Failed to update cart', 'error');
        }
    },

    /**
     * Remove item from cart
     */
    removeItem(itemId) {
        try {
            const itemIndex = this.cart.items.findIndex(item => item.id === itemId);
            if (itemIndex === -1) {
                throw new Error('Item not found in cart');
            }

            const removedItem = this.cart.items[itemIndex];
            this.cart.items.splice(itemIndex, 1);
            this.cart.timestamp = Date.now();

            this.calculateTotals();
            this.saveToStorage();
            this.updateDisplay();
            Utils.showNotification(`${removedItem.name} removed from cart`);
        } catch (error) {
            console.error('Failed to remove item from cart:', error);
            Utils.showNotification('Failed to remove item', 'error');
        }
    },

    /**
     * Clear entire cart
     */
    clearCart() {
        this.resetCart();
        this.saveToStorage();
        this.updateDisplay();
        Utils.showNotification('Cart cleared');
    },

    /**
     * Calculate cart totals
     */
    calculateTotals() {
        try {
            this.cart.subtotal = this.cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Calculate shipping
            this.cart.shipping = this.cart.subtotal >= CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : 500;

            // Calculate total
            this.cart.total = this.cart.subtotal + this.cart.shipping;

            return {
                subtotal: this.cart.subtotal,
                shipping: this.cart.shipping,
                total: this.cart.total
            };
        } catch (error) {
            console.error('Failed to calculate totals:', error);
            return { subtotal: 0, shipping: 0, total: 0 };
        }
    },

    /**
     * Get cart item count
     */
    getItemCount() {
        return this.cart.items.reduce((count, item) => count + item.quantity, 0);
    },

    /**
     * Check if cart is empty
     */
    isEmpty() {
        return this.cart.items.length === 0;
    },

    /**
     * Save cart to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(CONFIG.CART_STORAGE_KEY, JSON.stringify(this.cart));
        } catch (error) {
            console.warn('Failed to save cart to localStorage:', error);
        }
    },

    /**
     * Update cart display
     */
    updateDisplay() {
        const cartSummary = Utils.querySelector(CONFIG.SELECTORS.cartSummary);
        if (!cartSummary) return;

        if (this.isEmpty()) {
            cartSummary.style.display = 'none';
            return;
        }

        const itemCount = this.getItemCount();

        cartSummary.innerHTML = `
            <div class="cart-header">
                <h3>Shopping Cart (${itemCount} item${itemCount !== 1 ? 's' : ''})</h3>
                <button onclick="CartManager.clearCart()" class="cart-clear-btn" title="Clear cart">🗑️</button>
            </div>
            <div class="cart-items">
                ${this.cart.items.map(item => `
                    <div class="cart-item" data-item-id="${item.id}">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-image" width="50" height="50">
                        <div class="cart-item-details">
                            <h4 class="cart-item-name">${item.name}</h4>
                            <div class="cart-item-options">
                                ${item.size ? `<span class="cart-item-size">Size: ${item.size}</span>` : ''}
                                ${item.color ? `<span class="cart-item-color">Color: ${item.color}</span>` : ''}
                            </div>
                            <div class="cart-item-controls">
                                <button onclick="CartManager.updateQuantity('${item.id}', ${item.quantity - 1})" class="quantity-btn">-</button>
                                <span class="quantity">${item.quantity}</span>
                                <button onclick="CartManager.updateQuantity('${item.id}', ${item.quantity + 1})" class="quantity-btn">+</button>
                            </div>
                        </div>
                        <div class="cart-item-price">
                            <span class="item-total">${Utils.formatCurrency(item.price * item.quantity)}</span>
                            <button onclick="CartManager.removeItem('${item.id}')" class="remove-item-btn" title="Remove item">×</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="cart-totals">
                <div class="total-line">
                    <span>Subtotal:</span>
                    <span>${Utils.formatCurrency(this.cart.subtotal)}</span>
                </div>
                <div class="total-line">
                    <span>Shipping:</span>
                    <span>${this.cart.shipping === 0 ? 'Free' : Utils.formatCurrency(this.cart.shipping)}</span>
                </div>
                ${this.cart.subtotal >= CONFIG.FREE_SHIPPING_THRESHOLD ?
                '<div class="free-shipping-notice">🎉 You qualify for free shipping!</div>' :
                `<div class="shipping-notice">Add ${Utils.formatCurrency(CONFIG.FREE_SHIPPING_THRESHOLD - this.cart.subtotal)} more for free shipping</div>`
            }
                <div class="total-line total-final">
                    <span><strong>Total:</strong></span>
                    <span><strong>${Utils.formatCurrency(this.cart.total)}</strong></span>
                </div>
            </div>
            <div class="cart-actions">
                <button onclick="PaymentManager.showPaymentForm()" class="btn btn-primary checkout-btn">
                    Proceed to Checkout
                </button>
            </div>
        `;

        cartSummary.style.display = 'block';
    }
};

// ===== PAYMENT MANAGEMENT =====
const PaymentManager = {
    stripe: null,
    stripeElements: null,
    cardElement: null,
    currentPaymentMethod: null,

    /**
     * Initialize payment systems
     */
    init() {
        this.initializeStripe();
    },

    /**
     * Initialize Stripe
     */
    initializeStripe() {
        try {
            if (typeof Stripe !== 'undefined') {
                // Check if we have a valid Stripe key
                if (CONFIG.PAYMENT.STRIPE.PUBLISHABLE_KEY && 
                    CONFIG.PAYMENT.STRIPE.PUBLISHABLE_KEY.startsWith('pk_') &&
                    CONFIG.PAYMENT.STRIPE.PUBLISHABLE_KEY.length > 20) {
                    this.stripe = Stripe(CONFIG.PAYMENT.STRIPE.PUBLISHABLE_KEY);
                    this.stripeElements = this.stripe.elements();
                    console.log('Stripe initialized successfully with real API key');
                } else {
                    console.warn('Stripe key not configured properly. Using fallback card form.');
                    console.log('Current key:', CONFIG.PAYMENT.STRIPE.PUBLISHABLE_KEY);
                    this.stripe = null; // Will use fallback form
                }
            } else {
                console.warn('Stripe SDK not loaded. Using fallback card form.');
            }
        } catch (error) {
            console.error('Failed to initialize Stripe:', error);
            this.stripe = null; // Fallback to simulation
        }
    },

    /**
     * Show payment form modal
     */
    showPaymentForm() {
        const modal = Utils.querySelector(CONFIG.SELECTORS.paymentModal);
        if (!modal) {
            console.error('Payment modal not found');
            return;
        }

        if (CartManager.isEmpty()) {
            Utils.showNotification('Your cart is empty', 'error');
            return;
        }

        const { total } = CartManager.calculateTotals();

        modal.querySelector('.modal-body').innerHTML = `
            <div class="payment-container">
                <div class="payment-header">
                    <h3>Choose Payment Method</h3>
                    <p class="payment-total">Total: ${Utils.formatCurrency(total)}</p>
                </div>
                
                <div class="payment-methods">
                    <div class="payment-method-tabs">
                        <button class="payment-tab active" data-method="paypal">
                            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTcuMDc2IDIxLjMzN0g0LjM1NEwyLjIyIDcuNjk5SDcuMTRDOS40MjEgNy42OTkgMTEuMTMyIDguMzA0IDEyLjI3MyA5LjUxNEMxMy40MTQgMTAuNzI0IDEzLjk4NSAxMi4zOTQgMTMuOTg1IDE0LjUyNEMxMy45ODUgMTcuNTI0IDEyLjk4NSAxOS44MjQgMTAuOTg1IDIxLjQyNEM5Ljk4NSAyMi4yMjQgOC42ODUgMjIuNjI0IDcuMDc2IDIyLjYyNFYyMS4zMzdaIiBmaWxsPSIjMDAzMDg3Ii8+CjxwYXRoIGQ9Ik0xNi4wNzYgMjEuMzM3SDEzLjM1NEwxMS4yMiA3LjY5OUgxNi4xNEMxOC40MjEgNy42OTkgMjAuMTMyIDguMzA0IDIxLjI3MyA5LjUxNEMyMi40MTQgMTAuNzI0IDIyLjk4NSAxMi4zOTQgMjIuOTg1IDE0LjUyNEMyMi45ODUgMTcuNTI0IDIxLjk4NSAxOS44MjQgMTkuOTg1IDIxLjQyNEMxOC45ODUgMjIuMjI0IDE3LjY4NSAyMi42MjQgMTYuMDc2IDIyLjYyNFYyMS4zMzdaIiBmaWxsPSIjMDA5Q0RBIi8+Cjwvc3ZnPgo=" alt="PayPal" width="24" height="24">
                            PayPal
                        </button>
                        <button class="payment-tab" data-method="card">
                            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMiIgeT0iNCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjE2IiByeD0iMiIgZmlsbD0iIzMzNzNkYyIvPgo8cGF0aCBkPSJtMiA4IDIwIDAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxyZWN0IHg9IjQiIHk9IjEyIiB3aWR0aD0iNCIgaGVpZ2h0PSIyIiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPgo=" alt="Credit Card" width="24" height="24">
                            Credit/Debit Card
                        </button>
                    </div>
                    
                    <div class="payment-content">
                        <div class="payment-panel active" id="paypal-panel">
                            <div class="payment-description">
                                <p>Pay securely with your PayPal account or credit card through PayPal.</p>
                                <p><small><strong>Note:</strong> PayPal processes payments in USD. Amount will be converted from ${Utils.formatCurrency(total)} to approximately $${(total / 280).toFixed(2)} USD.</small></p>
                            </div>
                            <div id="paypal-button-container"></div>
                        </div>
                        
                        <div class="payment-panel" id="card-panel">
                            <div class="payment-description">
                                <p>Pay securely with your credit or debit card. Amount: ${Utils.formatCurrency(total)}</p>
                            </div>
                            <form id="stripe-payment-form">
                                <div class="form-group">
                                    <label for="customer-email">Email Address *</label>
                                    <input type="email" id="customer-email" name="email" placeholder="your@email.com" required>
                                </div>
                                <div class="form-group">
                                    <label for="customer-name">Full Name *</label>
                                    <input type="text" id="customer-name" name="name" placeholder="John Doe" required>
                                </div>
                                <div class="form-group">
                                    <label for="stripe-card-element">Card Information *</label>
                                    <div id="stripe-card-element" class="stripe-element">
                                        <!-- Stripe Elements will create form elements here -->
                                    </div>
                                    <div id="stripe-card-errors" class="stripe-errors" role="alert"></div>
                                </div>
                                <button type="submit" id="stripe-submit" class="btn btn-primary payment-submit-btn">
                                    <span class="payment-btn-text">Pay ${Utils.formatCurrency(total)}</span>
                                    <span class="payment-btn-spinner" style="display: none;">Processing...</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                
                <div class="payment-footer">
                    <button type="button" onclick="PaymentManager.hidePaymentForm()" class="btn btn-secondary">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        // Setup payment method tabs
        this.setupPaymentTabs();

        // Initialize PayPal (PayPal requires USD, so we convert PKR to USD)
        const totalUSD = (total / 280).toFixed(2); // Convert PKR to USD (approximate rate)
        this.initializePayPal(parseFloat(totalUSD), total);

        // Initialize Stripe card element
        this.initializeStripeCard();

        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    },

    /**
     * Setup payment method tabs
     */
    setupPaymentTabs() {
        const tabs = Utils.querySelectorAll('.payment-tab');
        const panels = Utils.querySelectorAll('.payment-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const method = e.target.getAttribute('data-method');

                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update active panel
                panels.forEach(p => p.classList.remove('active'));
                const targetPanel = Utils.querySelector(`#${method}-panel`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }

                this.currentPaymentMethod = method;
            });
        });
    },

    /**
     * Initialize PayPal payment buttons
     */
    initializePayPal(totalUSD, totalPKR) {
        if (typeof paypal === 'undefined') {
            console.error('PayPal SDK not loaded');
            return;
        }

        const container = Utils.querySelector('#paypal-button-container');
        if (!container) return;

        // Clear existing buttons
        container.innerHTML = '';

        paypal.Buttons({
            createOrder: (data, actions) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: totalUSD.toString(),
                            currency_code: 'USD'
                        },
                        description: `Shoe Point Purchase - ${Utils.formatCurrency(totalPKR)}`,
                        custom_id: CartManager.cart.customerId,
                        invoice_id: 'SP-' + Date.now()
                    }]
                });
            },

            onApprove: (data, actions) => {
                return actions.order.capture().then((details) => {
                    this.handlePaymentSuccess('paypal', details);
                });
            },

            onError: (err) => {
                console.error('PayPal payment error:', err);
                Utils.showNotification('Payment failed. Please try again.', 'error');
            },

            onCancel: (data) => {
                console.log('PayPal payment cancelled:', data);
                Utils.showNotification('Payment cancelled', 'error');
            },

            style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'paypal'
            }
        }).render('#paypal-button-container');
    },

    /**
     * Initialize Stripe card element
     */
    initializeStripeCard() {
        const cardContainer = Utils.querySelector('#stripe-card-element');
        const form = Utils.querySelector('#stripe-payment-form');
        
        if (!cardContainer || !form) {
            console.error('Stripe card container or form not found');
            return;
        }

        if (!this.stripe || !this.stripeElements) {
            console.warn('Stripe not initialized, using fallback card form');
            this.createFallbackCardForm();
            return;
        }

        try {
            const cardElement = this.stripeElements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                            color: '#aab7c4',
                        },
                    },
                    invalid: {
                        color: '#9e2146',
                    },
                },
            });

            cardElement.mount('#stripe-card-element');
            this.cardElement = cardElement;

            // Handle real-time validation errors from the card Element
            cardElement.on('change', ({ error }) => {
                const displayError = Utils.querySelector('#stripe-card-errors');
                if (error) {
                    displayError.textContent = error.message;
                } else {
                    displayError.textContent = '';
                }
            });

            // Handle form submission
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleStripePayment();
            });

        } catch (error) {
            console.error('Failed to create Stripe card element:', error);
            this.createFallbackCardForm();
        }
    },

    /**
     * Create fallback card form when Stripe is not available
     */
    createFallbackCardForm() {
        const cardContainer = Utils.querySelector('#stripe-card-element');
        const form = Utils.querySelector('#stripe-payment-form');
        
        if (!cardContainer || !form) return;

        // Create fallback card input fields
        cardContainer.innerHTML = `
            <div class="fallback-card-form">
                <div class="card-input-group">
                    <input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19" class="card-input">
                    <label for="card-number">Card Number</label>
                </div>
                <div class="card-input-row">
                    <div class="card-input-group">
                        <input type="text" id="card-expiry" placeholder="MM/YY" maxlength="5" class="card-input">
                        <label for="card-expiry">Expiry</label>
                    </div>
                    <div class="card-input-group">
                        <input type="text" id="card-cvc" placeholder="123" maxlength="4" class="card-input">
                        <label for="card-cvc">CVC</label>
                    </div>
                </div>
            </div>
        `;

        // Add input formatting
        this.setupCardInputFormatting();

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFallbackCardPayment();
        });
    },

    /**
     * Setup card input formatting for fallback form
     */
    setupCardInputFormatting() {
        const cardNumber = Utils.querySelector('#card-number');
        const cardExpiry = Utils.querySelector('#card-expiry');
        const cardCvc = Utils.querySelector('#card-cvc');

        if (cardNumber) {
            cardNumber.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = formattedValue;
            });
        }

        if (cardExpiry) {
            cardExpiry.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
            });
        }

        if (cardCvc) {
            cardCvc.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        }
    },

    /**
     * Handle fallback card payment (simulation)
     */
    async handleFallbackCardPayment() {
        const submitButton = Utils.querySelector('#stripe-submit');
        const buttonText = Utils.querySelector('.payment-btn-text');
        const buttonSpinner = Utils.querySelector('.payment-btn-spinner');

        // Show loading state
        submitButton.disabled = true;
        buttonText.style.display = 'none';
        buttonSpinner.style.display = 'inline';

        const form = Utils.querySelector('#stripe-payment-form');
        const formData = new FormData(form);

        // Get card details
        const cardNumber = Utils.querySelector('#card-number')?.value || '';
        const cardExpiry = Utils.querySelector('#card-expiry')?.value || '';
        const cardCvc = Utils.querySelector('#card-cvc')?.value || '';

        try {
            // Basic validation
            if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
                throw new Error('Please enter a valid card number');
            }
            if (!cardExpiry || cardExpiry.length < 5) {
                throw new Error('Please enter a valid expiry date');
            }
            if (!cardCvc || cardCvc.length < 3) {
                throw new Error('Please enter a valid CVC');
            }
            if (!formData.get('name')) {
                throw new Error('Please enter your full name');
            }
            if (!formData.get('email')) {
                throw new Error('Please enter your email address');
            }

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Create mock payment details
            const paymentDetails = {
                id: 'card_' + Date.now(),
                status: 'succeeded',
                amount: CartManager.cart.total,
                currency: 'pkr',
                payment_method: 'card',
                card: {
                    brand: this.detectCardBrand(cardNumber),
                    last4: cardNumber.replace(/\s/g, '').slice(-4)
                }
            };

            this.handlePaymentSuccess('card', paymentDetails);

        } catch (error) {
            console.error('Card payment error:', error);
            Utils.showNotification(error.message || 'Payment failed. Please try again.', 'error');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            buttonText.style.display = 'inline';
            buttonSpinner.style.display = 'none';
        }
    },

    /**
     * Detect card brand from number
     */
    detectCardBrand(cardNumber) {
        const number = cardNumber.replace(/\s/g, '');
        if (number.startsWith('4')) return 'visa';
        if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
        if (number.startsWith('3')) return 'amex';
        return 'unknown';
    },

    /**
     * Handle Stripe payment
     */
    async handleStripePayment() {
        if (!this.stripe || !this.cardElement) {
            Utils.showNotification('Payment system not ready', 'error');
            return;
        }

        const submitButton = Utils.querySelector('#stripe-submit');
        const buttonText = Utils.querySelector('.payment-btn-text');
        const buttonSpinner = Utils.querySelector('.payment-btn-spinner');

        // Show loading state
        submitButton.disabled = true;
        buttonText.style.display = 'none';
        buttonSpinner.style.display = 'inline';

        const form = Utils.querySelector('#stripe-payment-form');
        const formData = new FormData(form);

        try {
            const { token, error } = await this.stripe.createToken(this.cardElement, {
                name: formData.get('name'),
                email: formData.get('email')
            });

            if (error) {
                throw error;
            }

            // Simulate payment processing (in real implementation, send to your server)
            await this.simulateStripePayment(token);

        } catch (error) {
            console.error('Stripe payment error:', error);
            Utils.showNotification(error.message || 'Payment failed. Please try again.', 'error');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            buttonText.style.display = 'inline';
            buttonSpinner.style.display = 'none';
        }
    },

    /**
     * Simulate Stripe payment processing
     */
    async simulateStripePayment(token) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate successful payment
                const paymentDetails = {
                    id: 'stripe_' + Date.now(),
                    status: 'succeeded',
                    amount: CartManager.cart.total,
                    currency: 'pkr',
                    payment_method: 'card',
                    card: {
                        brand: token.card.brand,
                        last4: token.card.last4
                    }
                };

                this.handlePaymentSuccess('stripe', paymentDetails);
                resolve(paymentDetails);
            }, 2000);
        });
    },

    /**
     * Handle successful payment
     */
    handlePaymentSuccess(method, paymentDetails) {
        try {
            // Create order
            const order = this.createOrder(method, paymentDetails);

            // Notify admin dashboard if open
            this.notifyAdminDashboard(order);

            // Clear cart
            CartManager.clearCart();

            // Hide payment modal
            this.hidePaymentForm();

            // Show success message
            Utils.showNotification('Payment successful! Your order has been placed.', 'success');

            // Show order confirmation
            this.showOrderConfirmation(order);

            console.log('Payment successful:', paymentDetails);

        } catch (error) {
            console.error('Error handling payment success:', error);
            Utils.showNotification('Payment processed but order creation failed', 'error');
        }
    },

    /**
     * Notify admin dashboard of new order
     */
    notifyAdminDashboard(order) {
        try {
            // Try to notify admin dashboard if it's open
            if (typeof BroadcastChannel !== 'undefined') {
                const channel = new BroadcastChannel('shoepoint_admin');
                channel.postMessage({
                    type: 'NEW_ORDER',
                    order: order
                });
                channel.close();
            }
            
            // Also store in localStorage for admin to pick up
            const notifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
            notifications.push({
                type: 'NEW_ORDER',
                order: order,
                timestamp: Date.now(),
                read: false
            });
            localStorage.setItem('admin_notifications', JSON.stringify(notifications));
            
        } catch (error) {
            console.log('Could not notify admin dashboard:', error);
        }
    },

    /**
     * Create order from payment
     */
    createOrder(paymentMethod, paymentDetails) {
        const order = {
            orderId: 'SP-' + Date.now(),
            customerId: CartManager.cart.customerId,
            items: [...CartManager.cart.items],
            payment: {
                method: paymentMethod,
                transactionId: paymentDetails.id,
                amount: CartManager.cart.total,
                currency: 'PKR',
                status: 'completed',
                details: paymentDetails
            },
            totals: {
                subtotal: CartManager.cart.subtotal,
                shipping: CartManager.cart.shipping,
                total: CartManager.cart.total
            },
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save order to localStorage
        try {
            const orders = JSON.parse(localStorage.getItem('shoepoint_orders') || '[]');
            orders.push(order);
            localStorage.setItem('shoepoint_orders', JSON.stringify(orders));
        } catch (error) {
            console.error('Failed to save order:', error);
        }

        return order;
    },

    /**
     * Show order confirmation
     */
    showOrderConfirmation(order) {
        const modal = Utils.querySelector(CONFIG.SELECTORS.paymentModal);
        if (!modal) return;

        modal.querySelector('.modal-body').innerHTML = `
            <div class="order-confirmation">
                <div class="confirmation-header">
                    <div class="success-icon">✅</div>
                    <h2>Order Confirmed!</h2>
                    <p class="order-id">Order #${order.orderId}</p>
                </div>
                
                <div class="order-details">
                    <h3>Order Summary</h3>
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <span>${item.name} x${item.quantity}</span>
                                <span>${Utils.formatCurrency(item.price * item.quantity)}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="order-totals">
                        <div class="total-line">
                            <span>Subtotal:</span>
                            <span>${Utils.formatCurrency(order.totals.subtotal)}</span>
                        </div>
                        <div class="total-line">
                            <span>Shipping:</span>
                            <span>${order.totals.shipping === 0 ? 'Free' : Utils.formatCurrency(order.totals.shipping)}</span>
                        </div>
                        <div class="total-line total-final">
                            <span><strong>Total:</strong></span>
                            <span><strong>${Utils.formatCurrency(order.totals.total)}</strong></span>
                        </div>
                    </div>
                    
                    <div class="payment-info">
                        <p><strong>Payment Method:</strong> ${order.payment.method === 'paypal' ? 'PayPal' : 'Credit Card'}</p>
                        <p><strong>Transaction ID:</strong> ${order.payment.transactionId}</p>
                    </div>
                </div>
                
                <div class="confirmation-actions">
                    <button onclick="PaymentManager.hidePaymentForm()" class="btn btn-primary">
                        Continue Shopping
                    </button>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    },

    /**
     * Hide payment form modal
     */
    hidePaymentForm() {
        const modal = Utils.querySelector(CONFIG.SELECTORS.paymentModal);
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
    }
};

// ===== COUNTDOWN TIMER =====
const CountdownManager = {
    endDate: null,
    intervalId: null,

    /**
     * Initialize countdown timer
     */
    init() {
        const startDate = new Date();
        this.endDate = new Date(startDate.getTime() + CONFIG.COUNTDOWN_DURATION_DAYS * 24 * 60 * 60 * 1000);

        this.updateDisplay();
        this.intervalId = setInterval(() => this.updateDisplay(), 1000);
    },

    /**
     * Update countdown display
     */
    updateDisplay() {
        const elements = {
            days: Utils.querySelector(CONFIG.SELECTORS.countdownElements.days),
            hours: Utils.querySelector(CONFIG.SELECTORS.countdownElements.hours),
            minutes: Utils.querySelector(CONFIG.SELECTORS.countdownElements.minutes)
        };

        // Check if all elements exist
        if (!elements.days || !elements.hours || !elements.minutes) {
            console.warn('Countdown elements not found');
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
            return;
        }

        const now = new Date();
        const timeLeft = this.endDate - now;

        if (timeLeft <= 0) {
            elements.days.textContent = '00';
            elements.hours.textContent = '00';
            elements.minutes.textContent = '00';

            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
            return;
        }

        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

        elements.days.textContent = String(days).padStart(2, '0');
        elements.hours.textContent = String(hours).padStart(2, '0');
        elements.minutes.textContent = String(minutes).padStart(2, '0');
    },

    /**
     * Cleanup countdown timer
     */
    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
};

// ===== PRODUCT CATALOG =====
const ProductCatalog = {
    categories: [
        {
            id: 'running',
            name: 'Running Shoes',
            displayName: 'RUNNING',
            description: 'Lightweight and breathable for ultimate speed.',
            price: 3500,
            products: ['Lightweight Running Shoes', 'Marathon Runners', 'Trail Running Shoes']
        },
        {
            id: 'basketball',
            name: 'Basketball Shoes',
            displayName: 'BASKETBALL',
            description: 'High-top support for dynamic play.',
            price: 4000,
            products: ['High-Top Basketball Shoes', 'Court Shoes', 'Basketball Sneakers']
        },
        {
            id: 'hiking',
            name: 'Hiking Shoes',
            displayName: 'HIKING',
            description: 'Durable and grippy for tough terrains.',
            price: 5500,
            products: ['Hiking Shoes for Adventurers', 'Mountain Boots', 'Trail Hikers']
        },
        {
            id: 'soccer',
            name: 'Soccer Cleats',
            displayName: 'SOCCER',
            description: 'Designed for precision and speed.',
            price: 2850,
            products: ['Soccer Cleats for Speed', 'Football Boots', 'Turf Shoes']
        },
        {
            id: 'tennis',
            name: 'Tennis Shoes',
            displayName: 'TENNIS',
            description: 'Court-ready shoes for agility and comfort.',
            price: 3200,
            products: ['Tennis Court Shoes', 'All-Court Sneakers', 'Clay Court Shoes']
        }
    ],

    /**
     * Show product categories (legacy method for existing buttons)
     */
    showCategories() {
        const categoriesSection = Utils.querySelector('.categories-section');
        if (!categoriesSection) {
            console.error('Categories section not found');
            return;
        }

        // Check if categories are already displayed
        if (categoriesSection.querySelector('.categories-grid')) {
            return;
        }

        const categoriesGrid = document.createElement('div');
        categoriesGrid.className = 'categories-grid';
        categoriesGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 24px;
            margin-top: 32px;
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
        `;

        categoriesGrid.innerHTML = this.categories.map(category => `
            <div class="category-card-simple" style="
                border: 1px solid #ddd;
                padding: 24px;
                border-radius: 8px;
                text-align: center;
                background: white;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                transition: transform 0.3s ease;
            ">
                <h3 style="
                    font-style: italic;
                    text-transform: uppercase;
                    margin: 0 0 12px 0;
                    font-size: 18px;
                ">${category.name}</h3>
                <p style="
                    margin: 0 0 16px 0;
                    color: #666;
                    line-height: 1.5;
                ">${category.description}</p>
                <button 
                    class="btn btn-primary" 
                    onclick="CartManager.addItem('${category.name}', ${category.price}, {image: '${CartManager.getProductImage(category.name)}'})"
                    style="width: 100%;"
                >
                    Add to Cart - ${Utils.formatCurrency(category.price)}
                </button>
            </div>
        `).join('');

        // Add hover effects
        categoriesGrid.addEventListener('mouseover', (e) => {
            const card = e.target.closest('.category-card-simple');
            if (card) {
                card.style.transform = 'translateY(-5px)';
            }
        });

        categoriesGrid.addEventListener('mouseout', (e) => {
            const card = e.target.closest('.category-card-simple');
            if (card) {
                card.style.transform = 'translateY(0)';
            }
        });

        categoriesSection.appendChild(categoriesGrid);
    },

    /**
     * Handle category card discovery
     */
    discoverCategory(categoryId) {
        try {
            const category = this.categories.find(cat => cat.id === categoryId);
            if (!category) {
                console.error(`Category not found: ${categoryId}`);
                return;
            }

            // Show category-specific products
            this.showCategoryProducts(category);

            // Smooth scroll to products section
            const productsSection = Utils.querySelector('.products-section');
            if (productsSection) {
                productsSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }

            // Analytics tracking
            if (typeof gtag !== 'undefined') {
                gtag('event', 'category_discover', {
                    category_name: category.displayName,
                    category_id: categoryId
                });
            }

        } catch (error) {
            console.error('Error discovering category:', error);
            Utils.showNotification('Failed to load category products', 'error');
        }
    },

    /**
     * Show products for a specific category
     */
    showCategoryProducts(category) {
        const productsSection = Utils.querySelector('.products-section');
        if (!productsSection) {
            console.error('Products section not found');
            return;
        }

        // Update section title
        const sectionTitle = productsSection.querySelector('.section-title');
        if (sectionTitle) {
            sectionTitle.textContent = `${category.displayName} COLLECTION`;
        }

        // Check if category products are already displayed
        let categoryGrid = productsSection.querySelector('.category-products-grid');

        if (!categoryGrid) {
            categoryGrid = document.createElement('div');
            categoryGrid.className = 'category-products-grid';
            categoryGrid.style.cssText = `
                max-width: 1200px;
                margin: 32px auto;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 24px;
            `;

            // Insert after the main products grid
            const mainGrid = productsSection.querySelector('.products-grid');
            if (mainGrid) {
                mainGrid.style.display = 'none';
                mainGrid.parentNode.insertBefore(categoryGrid, mainGrid.nextSibling);
            }
        }

        // Generate category-specific products
        categoryGrid.innerHTML = category.products.map((productName, index) => {
            const productImage = CartManager.getProductImage(productName);
            return `
            <article class="product-card">
                <div class="product-badge">48% OFF</div>
                <img src="${productImage}" alt="${productName}" class="product-image" width="350" height="300" loading="lazy">
                <div class="product-rating" aria-label="5 star rating with 1,472 reviews">
                    <span class="star" aria-hidden="true">★</span>5.0 (+1,472 Reviews)
                </div>
                <h3 class="product-title">${productName}</h3>
                <p class="product-price" aria-label="Price: ${Utils.formatCurrency(category.price)}">${Utils.formatCurrency(category.price)}</p>
                <button class="btn btn-cart" onclick="CartManager.addItem('${productName}', ${category.price}, {image: '${productImage}'})">ADD TO CART</button>
            </article>
            `;
        }).join('');

        // Add back to all products button
        const backButton = document.createElement('div');
        backButton.className = 'category-back-button';
        backButton.style.cssText = `
            text-align: center;
            margin: 32px 0;
        `;
        backButton.innerHTML = `
            <button class="btn btn-secondary" onclick="ProductCatalog.showAllProducts()">
                ← Back to All Products
            </button>
        `;

        categoryGrid.parentNode.insertBefore(backButton, categoryGrid.nextSibling);
    },

    /**
     * Show all products (reset view)
     */
    showAllProducts() {
        const productsSection = Utils.querySelector('.products-section');
        if (!productsSection) return;

        // Reset section title
        const sectionTitle = productsSection.querySelector('.section-title');
        if (sectionTitle) {
            sectionTitle.textContent = 'Featuring the Best';
        }

        // Hide category products and show main grid
        const categoryGrid = productsSection.querySelector('.category-products-grid');
        const backButton = productsSection.querySelector('.category-back-button');
        const mainGrid = productsSection.querySelector('.products-grid');

        if (categoryGrid) categoryGrid.remove();
        if (backButton) backButton.remove();
        if (mainGrid) mainGrid.style.display = 'grid';
    }
};

// ===== EVENT HANDLERS =====
const EventHandlers = {
    /**
     * Initialize all event listeners
     */
    init() {
        this.setupCartButtons();
        this.setupShopButtons();
        this.setupViewMoreButton();
        this.setupCategoryCards();
        this.setupModalCloseHandlers();
        this.setupKeyboardNavigation();
    },

    /**
     * Setup cart button event listeners
     */
    setupCartButtons() {
        const cartButtons = Utils.querySelectorAll(CONFIG.SELECTORS.cartButtons);

        cartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();

                const productName = button.getAttribute('data-product');
                const price = button.getAttribute('data-price');
                const image = button.getAttribute('data-image');

                if (productName && price) {
                    // Get selected size and color from the product card
                    const productCard = button.closest('.product-card');
                    const selectedSize = productCard.querySelector('.size-btn.selected')?.getAttribute('data-size');
                    const selectedColor = productCard.querySelector('.color-btn.selected')?.getAttribute('data-color');

                    // Show warning if no size selected (color is optional)
                    if (!selectedSize) {
                        Utils.showNotification('Please select a size', 'error');
                        return;
                    }

                    const options = {
                        size: selectedSize
                    };

                    // Add color only if selected (optional)
                    if (selectedColor) {
                        options.color = selectedColor;
                    }
                    if (image) {
                        options.image = image;
                    }
                    CartManager.addItem(productName, parseFloat(price), options);
                } else {
                    console.error('Product data missing from button');
                }
            });
        });

        // Setup size and color selection
        this.setupProductOptions();
    },

    /**
     * Setup product size and color selection
     */
    setupProductOptions() {
        // Size button handlers with toggle functionality
        const sizeButtons = Utils.querySelectorAll('.size-btn');
        sizeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();

                const productCard = button.closest('.product-card');

                // Toggle functionality: if already selected, unselect it
                if (button.classList.contains('selected')) {
                    button.classList.remove('selected');
                } else {
                    // Remove selected class from other size buttons in the same product
                    const otherSizeButtons = productCard.querySelectorAll('.size-btn');
                    otherSizeButtons.forEach(btn => btn.classList.remove('selected'));

                    // Add selected class to clicked button
                    button.classList.add('selected');
                }
            });
        });

        // Color button handlers with toggle functionality
        const colorButtons = Utils.querySelectorAll('.color-btn');
        colorButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();

                const productCard = button.closest('.product-card');

                // Toggle functionality: if already selected, unselect it
                if (button.classList.contains('selected')) {
                    button.classList.remove('selected');
                } else {
                    // Remove selected class from other color buttons in the same product
                    const otherColorButtons = productCard.querySelectorAll('.color-btn');
                    otherColorButtons.forEach(btn => btn.classList.remove('selected'));

                    // Add selected class to clicked button
                    button.classList.add('selected');
                }
            });
        });
    },

    /**
     * Setup shop button event listeners
     */
    setupShopButtons() {
        const shopButtons = Utils.querySelectorAll(CONFIG.SELECTORS.shopButtons);

        shopButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                ProductCatalog.showCategories();

                // Smooth scroll to categories
                const categoriesSection = Utils.querySelector('.categories-section');
                if (categoriesSection) {
                    categoriesSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    },

    /**
     * Setup view more button
     */
    setupViewMoreButton() {
        const viewMoreBtn = Utils.querySelector(CONFIG.SELECTORS.viewMoreBtn);

        if (viewMoreBtn) {
            viewMoreBtn.addEventListener('click', (e) => {
                e.preventDefault();
                ProductCatalog.showCategories();

                // Smooth scroll to categories
                const categoriesSection = Utils.querySelector('.categories-section');
                if (categoriesSection) {
                    categoriesSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        }
    },

    /**
     * Setup category card event listeners
     */
    setupCategoryCards() {
        // Setup discover buttons
        const discoverButtons = Utils.querySelectorAll('.btn-discover');

        discoverButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const categoryId = button.getAttribute('data-category');
                if (categoryId) {
                    ProductCatalog.discoverCategory(categoryId);
                } else {
                    console.error('Category ID missing from discover button');
                }
            });
        });

        // Setup category card click handlers (for accessibility)
        const categoryCards = Utils.querySelectorAll('.category-card');

        categoryCards.forEach(card => {
            // Click handler
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on the button
                if (e.target.closest('.btn-discover')) return;

                const categoryId = card.getAttribute('data-category');
                if (categoryId) {
                    ProductCatalog.discoverCategory(categoryId);
                }
            });

            // Keyboard handler
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const categoryId = card.getAttribute('data-category');
                    if (categoryId) {
                        ProductCatalog.discoverCategory(categoryId);
                    }
                }
            });

            // Enhanced hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    },

    /**
     * Setup modal close handlers
     */
    setupModalCloseHandlers() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            const modal = Utils.querySelector(CONFIG.SELECTORS.paymentModal);
            if (modal && e.target === modal) {
                PaymentManager.hidePaymentForm();
            }
        });

        // Close modal with close button
        const closeButton = Utils.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                PaymentManager.hidePaymentForm();
            });
        }
    },

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Close modal with Escape key
            if (e.key === 'Escape') {
                const modal = Utils.querySelector(CONFIG.SELECTORS.paymentModal);
                if (modal && modal.style.display === 'flex') {
                    PaymentManager.hidePaymentForm();
                }
            }
        });
    }
};

// ===== APPLICATION INITIALIZATION =====
const App = {
    /**
     * Initialize the application
     */
    init() {
        try {
            console.log('Initializing Shoe Point application...');

            // Initialize managers one by one with error handling
            console.log('Initializing CartManager...');
            CartManager.init();

            console.log('Initializing CountdownManager...');
            CountdownManager.init();

            console.log('Initializing EventHandlers...');
            EventHandlers.init();

            console.log('Initializing ShowcaseManager...');
            ShowcaseManager.init();

            console.log('Initializing MissionManager...');
            MissionManager.init();

            console.log('Initializing PaymentManager...');
            PaymentManager.init();

            console.log('Initializing TestimonialsCarousel...');
            TestimonialsCarousel.init();

            console.log('Initializing NewsletterManager...');
            NewsletterManager.init();

            console.log('Initializing FinalCTAManager...');
            FinalCTAManager.init();

            console.log('Initializing ChatbotManager...');
            ChatbotManager.init();

            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            console.error('Error details:', error.message, error.stack);
            Utils.showNotification('Application failed to load properly', 'error');
        }
    },

    /**
     * Cleanup when page unloads
     */
    cleanup() {
        CountdownManager.destroy();
        TestimonialsCarousel.stopAutoScroll();
    }
};

// ===== PRODUCT SHOWCASE GALLERY =====
const ShowcaseGallery = {
    currentIndex: 0,
    slides: [],
    dots: [],
    container: null,

    /**
     * Initialize the gallery
     */
    init() {
        this.container = Utils.querySelector('.product-gallery');
        if (!this.container) {
            console.warn('Product gallery container not found');
            return;
        }

        this.slides = Utils.querySelectorAll('.gallery-slide');
        this.dots = Utils.querySelectorAll('.gallery-dot');

        if (this.slides.length === 0 || this.dots.length === 0) {
            console.warn('Gallery slides or dots not found');
            return;
        }

        this.bindEvents();
        this.setupKeyboardNavigation();
        this.setupTouchGestures();
    },

    /**
     * Bind click events to dots and slides
     */
    bindEvents() {
        // Dot navigation
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchToSlide(index);
            });
        });

        // Slide click for larger view
        this.slides.forEach((slide, index) => {
            slide.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLargerView(index);
            });
        });
    },

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        this.container.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousSlide();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.switchToSlide(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.switchToSlide(this.slides.length - 1);
                    break;
            }
        });
    },

    /**
     * Setup touch gestures for mobile
     */
    setupTouchGestures() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        const galleryImages = Utils.querySelector('.gallery-images');
        if (!galleryImages) return;

        galleryImages.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        galleryImages.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            this.handleSwipe(startX, startY, endX, endY);
        }, { passive: true });
    },

    /**
     * Handle swipe gestures
     */
    handleSwipe(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const minSwipeDistance = 50;

        // Only handle horizontal swipes
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                this.previousSlide();
            } else {
                this.nextSlide();
            }
        }
    },

    /**
     * Switch to specific slide
     */
    switchToSlide(index) {
        if (index < 0 || index >= this.slides.length || index === this.currentIndex) {
            return;
        }

        // Remove active class from current slide and dot
        this.slides[this.currentIndex].classList.remove('active');
        this.dots[this.currentIndex].classList.remove('active');
        this.dots[this.currentIndex].setAttribute('aria-selected', 'false');

        // Add active class to new slide and dot
        this.currentIndex = index;
        this.slides[this.currentIndex].classList.add('active');
        this.dots[this.currentIndex].classList.add('active');
        this.dots[this.currentIndex].setAttribute('aria-selected', 'true');

        // Focus the active dot for accessibility
        this.dots[this.currentIndex].focus();
    },

    /**
     * Go to previous slide
     */
    previousSlide() {
        const newIndex = this.currentIndex === 0 ? this.slides.length - 1 : this.currentIndex - 1;
        this.switchToSlide(newIndex);
    },

    /**
     * Go to next slide
     */
    nextSlide() {
        const newIndex = this.currentIndex === this.slides.length - 1 ? 0 : this.currentIndex + 1;
        this.switchToSlide(newIndex);
    },

    /**
     * Show larger view of image (modal or expanded view)
     */
    showLargerView(index) {
        const slide = this.slides[index];
        if (!slide) return;

        const image = slide.querySelector('.gallery-image');
        const badge = slide.querySelector('.gallery-badge');

        if (!image) return;

        // Create modal for larger view
        const modal = document.createElement('div');
        modal.className = 'gallery-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            position: relative;
            max-width: 90%;
            max-height: 90%;
        `;

        const modalImage = document.createElement('img');
        modalImage.src = image.src;
        modalImage.alt = image.alt;
        modalImage.style.cssText = `
            width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        `;

        if (badge) {
            const modalBadge = document.createElement('div');
            modalBadge.textContent = badge.textContent;
            modalBadge.style.cssText = `
                position: absolute;
                top: 16px;
                left: 16px;
                background: #000;
                color: white;
                padding: 8px 12px;
                font-size: 14px;
                font-weight: 600;
                border-radius: 4px;
            `;
            modalContent.appendChild(modalBadge);
        }

        modalContent.appendChild(modalImage);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Close modal on click
        modal.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close modal on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        Utils.showNotification('Click anywhere to close', 'success');
    }
};

// ===== SHOWCASE MANAGER =====
const ShowcaseManager = {
    /**
     * Initialize showcase functionality
     */
    init() {
        this.setupBestsellerButton();
        this.setupLearnMoreButton();
        ShowcaseGallery.init();
    },

    /**
     * Setup bestseller add to cart button
     */
    setupBestsellerButton() {
        const bestsellerBtn = Utils.querySelector('.bestseller-add-btn');
        if (bestsellerBtn) {
            bestsellerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const productName = bestsellerBtn.getAttribute('data-product');
                const price = bestsellerBtn.getAttribute('data-price');

                if (productName && price) {
                    CartManager.addItem(productName, parseFloat(price));
                }
            });
        }
    },

    /**
     * Setup learn more button
     */
    setupLearnMoreButton() {
        const learnMoreBtn = Utils.querySelector('.learn-more-btn');
        if (learnMoreBtn) {
            learnMoreBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showCollectionDetails();
            });
        }
    },

    /**
     * Show collection details
     */
    showCollectionDetails() {
        // Scroll to products section or show more details
        const productsSection = Utils.querySelector('.products-section');
        if (productsSection) {
            productsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            Utils.showNotification('Explore our full collection below!');
        }
    }
};

// ===== MISSION MANAGER =====
const MissionManager = {
    /**
     * Initialize mission functionality
     */
    init() {
        this.setupDiscoverMoreButton();
    },

    /**
     * Setup discover more button
     */
    setupDiscoverMoreButton() {
        const discoverBtn = Utils.querySelector('#discover-more-btn');
        if (discoverBtn) {
            discoverBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showMissionDetails();
            });
        }
    },

    /**
     * Show mission details or navigate to about page
     */
    showMissionDetails() {
        // Create modal with more mission details
        const modal = document.createElement('div');
        modal.className = 'mission-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 8px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            cursor: default;
            font-family: 'Nunito Sans', sans-serif;
        `;

        modalContent.innerHTML = `
            <h2 style="font-size: 2rem; font-weight: 900; font-style: italic; text-transform: uppercase; margin: 0 0 20px 0; color: #333;">
                OUR MISSION & VALUES
            </h2>
            <div style="line-height: 1.6; color: #666;">
                <h3 style="color: #333; font-style: italic; margin: 20px 0 10px 0;">Quality First</h3>
                <p>We source only the highest quality materials and work with trusted manufacturers to ensure every pair of shoes meets our rigorous standards.</p>
                
                <h3 style="color: #333; font-style: italic; margin: 20px 0 10px 0;">Sustainability</h3>
                <p>Our commitment to the environment drives us to use eco-friendly materials and sustainable production processes wherever possible.</p>
                
                <h3 style="color: #333; font-style: italic; margin: 20px 0 10px 0;">Customer Experience</h3>
                <p>From browsing to delivery, we strive to provide a seamless, enjoyable shopping experience that exceeds expectations.</p>
                
                <h3 style="color: #333; font-style: italic; margin: 20px 0 10px 0;">Community Impact</h3>
                <p>We believe in giving back to the communities that support us through various charitable initiatives and local partnerships.</p>
            </div>
            <button style="
                background: rgba(255, 0, 0, 0.781);
                color: white;
                border: none;
                padding: 12px 24px;
                font-size: 16px;
                font-weight: 600;
                text-transform: uppercase;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 20px;
                font-style: italic;
            " onclick="this.closest('.mission-modal').remove()">
                CLOSE
            </button>
        `;

        modalContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Close modal on click outside
        modal.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close modal on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        Utils.showNotification('Learn more about our mission and values');
    }
};

// ===== TESTIMONIALS CAROUSEL =====
const TestimonialsCarousel = {
    currentIndex: 0,
    totalSlides: 6,
    visibleCards: 3, // Show 3 cards at once on desktop
    maxIndex: 1, // 2 positions: 0 (cards 1-3) and 1 (cards 4-6)
    cards: [],
    dots: [],
    track: null,
    autoScrollInterval: null,
    direction: 1, // 1 for right, -1 for left
    isAutoScrolling: true,
    isMobile: false,
    
    // Touch/swipe properties
    startX: 0,
    currentX: 0,
    isDragging: false,
    startTransform: 0,

    /**
     * Initialize the testimonials carousel
     */
    init() {
        this.track = Utils.querySelector('.testimonials-track');
        this.cards = Utils.querySelectorAll('.testimonial-card');
        this.dots = Utils.querySelectorAll('.testimonial-dot');

        if (!this.track || this.cards.length === 0 || this.dots.length === 0) {
            console.warn('Testimonials carousel elements not found');
            return;
        }

        this.checkMobile();
        this.setupMobileProperties();
        this.bindEvents();
        this.updateDotsVisibility();
        this.startAutoScroll();
        this.updateVisibleCards();
        
        // Listen for resize events
        window.addEventListener('resize', Utils.debounce(() => {
            this.checkMobile();
            this.setupMobileProperties();
            this.updateDotsVisibility();
            this.updateTrackPosition();
        }, 250));
    },

    /**
     * Check if we're on mobile
     */
    checkMobile() {
        this.isMobile = window.innerWidth <= 768;
    },

    /**
     * Setup mobile-specific properties
     */
    setupMobileProperties() {
        if (this.isMobile) {
            this.visibleCards = 1; // Show 1 card at once on mobile
            this.maxIndex = this.totalSlides - 1; // 6 positions: 0-5
        } else {
            this.visibleCards = 3; // Show 3 cards at once on desktop
            this.maxIndex = 1; // 2 positions: 0 (cards 1-3) and 1 (cards 4-6)
        }
    },

    /**
     * Bind events for both desktop and mobile
     */
    bindEvents() {
        // Dot navigation
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                this.stopAutoScroll();
                this.goToSlide(this.isMobile ? index : index);
                setTimeout(() => this.startAutoScroll(), 3000);
            });
        });

        // Desktop hover events
        const carousel = Utils.querySelector('.testimonials-carousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', () => {
                if (!this.isMobile) this.stopAutoScroll();
            });

            carousel.addEventListener('mouseleave', () => {
                if (!this.isMobile) this.startAutoScroll();
            });
        }

        // Touch/swipe events for mobile
        if (this.track) {
            // Touch events
            this.track.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
            this.track.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            this.track.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

            // Mouse events for desktop drag (optional)
            this.track.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            this.track.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.track.addEventListener('mouseup', (e) => this.handleMouseUp(e));
            this.track.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.target.closest('.testimonials-section')) {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.stopAutoScroll();
                        this.previousSlide();
                        setTimeout(() => this.startAutoScroll(), 3000);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.stopAutoScroll();
                        this.nextSlide();
                        setTimeout(() => this.startAutoScroll(), 3000);
                        break;
                }
            }
        });
    },

    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        if (!this.isMobile) return;
        this.startX = e.touches[0].clientX;
        this.isDragging = true;
        this.stopAutoScroll();
        
        // Get current transform value
        const transform = this.track.style.transform;
        const match = transform.match(/translateX\((-?\d+(?:\.\d+)?)%\)/);
        this.startTransform = match ? parseFloat(match[1]) : 0;
        
        this.track.style.transition = 'none';
    },

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        if (!this.isMobile || !this.isDragging) return;
        
        e.preventDefault();
        this.currentX = e.touches[0].clientX;
        const diffX = this.currentX - this.startX;
        const cardWidth = this.track.offsetWidth / this.totalSlides;
        const movePercent = (diffX / cardWidth) * (100 / this.totalSlides);
        
        const newTransform = this.startTransform + movePercent;
        this.track.style.transform = `translateX(${newTransform}%)`;
    },

    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        if (!this.isMobile || !this.isDragging) return;
        
        this.isDragging = false;
        this.track.style.transition = 'transform 0.3s ease-out';
        
        const diffX = this.currentX - this.startX;
        const threshold = 50; // Minimum swipe distance
        
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                this.previousSlide();
            } else {
                this.nextSlide();
            }
        } else {
            // Snap back to current position
            this.updateTrackPosition();
        }
        
        setTimeout(() => this.startAutoScroll(), 3000);
    },

    /**
     * Handle mouse down (for desktop drag)
     */
    handleMouseDown(e) {
        if (this.isMobile) return;
        this.startX = e.clientX;
        this.isDragging = true;
        this.stopAutoScroll();
        e.preventDefault();
    },

    /**
     * Handle mouse move
     */
    handleMouseMove(e) {
        if (this.isMobile || !this.isDragging) return;
        e.preventDefault();
    },

    /**
     * Handle mouse up
     */
    handleMouseUp(e) {
        if (this.isMobile || !this.isDragging) return;
        this.isDragging = false;
        setTimeout(() => this.startAutoScroll(), 3000);
    },

    /**
     * Go to specific slide position
     */
    goToSlide(index) {
        if (index < 0 || index > this.maxIndex || index === this.currentIndex) {
            return;
        }

        // Remove active class from all dots
        this.dots.forEach(dot => {
            dot.classList.remove('active');
            dot.setAttribute('aria-selected', 'false');
        });

        // Update current index
        this.currentIndex = index;

        // Add active class to current dot
        let activeDotIndex;
        if (this.isMobile) {
            // Mobile: show individual card dots
            activeDotIndex = index;
        } else {
            // Desktop: show group dots (0 for cards 1-3, 1 for cards 4-6)
            activeDotIndex = index;
        }
        
        if (this.dots[activeDotIndex]) {
            this.dots[activeDotIndex].classList.add('active');
            this.dots[activeDotIndex].setAttribute('aria-selected', 'true');
        }

        // Hide/show dots based on device
        this.updateDotsVisibility();

        // Update track position
        this.updateTrackPosition();
        this.updateVisibleCards();
    },

    /**
     * Update dots visibility based on device type
     */
    updateDotsVisibility() {
        this.dots.forEach((dot, index) => {
            if (this.isMobile) {
                // Mobile: show all 6 dots
                dot.style.display = 'inline-block';
            } else {
                // Desktop: show only first 2 dots (for groups)
                dot.style.display = index < 2 ? 'inline-block' : 'none';
            }
        });
    },

    /**
     * Go to next slide
     */
    nextSlide() {
        let nextIndex = this.currentIndex + 1;
        if (nextIndex > this.maxIndex) {
            nextIndex = 0;
            this.direction = 1;
        }
        this.goToSlide(nextIndex);
    },

    /**
     * Go to previous slide
     */
    previousSlide() {
        let prevIndex = this.currentIndex - 1;
        if (prevIndex < 0) {
            prevIndex = this.maxIndex;
            this.direction = -1;
        }
        this.goToSlide(prevIndex);
    },

    /**
     * Update track position based on device type
     */
    updateTrackPosition() {
        let translateX;
        
        if (this.isMobile) {
            // Mobile: move by 100/6 = 16.67% for each card
            translateX = -this.currentIndex * (100 / this.totalSlides);
        } else {
            // Desktop: move by 50% for each position (position 0: cards 1-3, position 1: cards 4-6)
            translateX = -this.currentIndex * 50;
        }
        
        this.track.style.transform = `translateX(${translateX}%)`;
    },

    /**
     * Update visible cards for animation
     */
    updateVisibleCards() {
        this.cards.forEach((card, index) => {
            card.classList.remove('visible');
            // Position 0: show cards 0,1,2 (first 3)
            // Position 1: show cards 3,4,5 (next 3)
            const startIndex = this.currentIndex * 3;
            const endIndex = startIndex + 3;
            if (index >= startIndex && index < endIndex) {
                setTimeout(() => {
                    card.classList.add('visible');
                }, 100);
            }
        });
    },

    /**
     * Start auto-scroll
     */
    startAutoScroll() {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
        }

        this.autoScrollInterval = setInterval(() => {
            if (this.isAutoScrolling) {
                if (this.direction === 1) {
                    // Moving right
                    if (this.currentIndex >= this.maxIndex) {
                        this.direction = -1; // Switch to left
                        this.previousSlide();
                    } else {
                        this.nextSlide();
                    }
                } else {
                    // Moving left
                    if (this.currentIndex <= 0) {
                        this.direction = 1; // Switch to right
                        this.nextSlide();
                    } else {
                        this.previousSlide();
                    }
                }
            }
        }, 3000); // Change slide every 3 seconds
    },

    /**
     * Stop auto-scroll
     */
    stopAutoScroll() {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
            this.autoScrollInterval = null;
        }
    },

    /**
     * Resume auto-scroll
     */
    resumeAutoScroll() {
        this.isAutoScrolling = true;
        this.startAutoScroll();
    },

    /**
     * Pause auto-scroll
     */
    pauseAutoScroll() {
        this.isAutoScrolling = false;
        this.stopAutoScroll();
    }
};

// ===== NEWSLETTER MANAGER =====
const NewsletterManager = {
    /**
     * Initialize newsletter functionality
     */
    init() {
        this.setupNewsletterForm();
    },

    /**
     * Setup newsletter form submission
     */
    setupNewsletterForm() {
        const form = Utils.querySelector('#newsletter-form');
        if (!form) {
            console.warn('Newsletter form not found');
            return;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewsletterSubmission(new FormData(form));
        });

        // Add real-time email validation
        const emailInput = Utils.querySelector('#newsletter-email');
        if (emailInput) {
            emailInput.addEventListener('blur', (e) => {
                this.validateEmail(e.target.value);
            });
        }
    },

    /**
     * Handle newsletter form submission
     */
    handleNewsletterSubmission(formData) {
        const email = formData.get('email');

        if (!this.validateEmail(email)) {
            Utils.showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Show loading state
        const submitBtn = Utils.querySelector('.btn-newsletter');
        if (submitBtn) {
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'SIGNING UP...';
            submitBtn.disabled = true;

            // Simulate API call
            setTimeout(() => {
                Utils.showNotification('Successfully subscribed to our newsletter! Check your email for exclusive offers.');

                // Reset form
                const form = Utils.querySelector('#newsletter-form');
                if (form) form.reset();

                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        }
    },

    /**
     * Validate email address
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
};

// ===== FINAL CTA MANAGER =====
const FinalCTAManager = {
    /**
     * Initialize final CTA functionality
     */
    init() {
        this.setupFinalCTAButton();
    },

    /**
     * Setup final CTA button
     */
    setupFinalCTAButton() {
        const finalCTABtn = Utils.querySelector('#final-cta-btn');
        if (finalCTABtn) {
            finalCTABtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleFinalCTA();
            });
        }
    },

    /**
     * Handle final CTA button click
     */
    handleFinalCTA() {
        // Scroll to products section to start shopping
        const productsSection = Utils.querySelector('.products-section');
        if (productsSection) {
            productsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            Utils.showNotification('Explore our premium collection below!');
        } else {
            // Fallback: scroll to top of page
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            Utils.showNotification('Welcome to Shoe Point! Start exploring our collection.');
        }
    }
};

// ===== AI CHATBOT MANAGER =====
const ChatbotManager = {
    isOpen: false,
    messagesContainer: null,
    chatInput: null,

    // WhatsApp integration settings
    whatsappConfig: {
        phoneNumber: '03322599947', // Your WhatsApp number
        enabled: true
    },

    // Knowledge base for the AI responses
    knowledgeBase: {
        products: {
            keywords: ['product', 'shoe', 'shoes', 'sneaker', 'running', 'basketball', 'hiking', 'soccer', 'tennis', 'price', 'cost', 'buy'],
            responses: [
                "We offer a wide range of athletic shoes including running shoes (Rs.3000), basketball shoes (Rs.2900-4000), hiking shoes (Rs.5500), and soccer cleats (Rs.2850). All our shoes are designed for peak performance!",
                "Our bestseller is the Air Jordan 5 Retro for Rs.9999. We also have great options in running, basketball, hiking, and soccer categories. Would you like to see a specific type?",
                "Check out our featured products section! We have 48% off on selected items. Free shipping on orders over Rs.15000."
            ]
        },
        shipping: {
            keywords: ['shipping', 'delivery', 'ship', 'deliver', 'free shipping', 'cost', 'time', 'fast'],
            responses: [
                "We offer FREE shipping on all orders over Rs.15000! For orders under Rs.15000, shipping is Rs.500. Most orders are delivered within 3-5 business days.",
                "Fast, free shipping is available on orders Rs.15000+. We prioritize quick delivery to get your shoes to you as soon as possible!",
                "Shipping is Rs.500 for orders under Rs.15000, but FREE for orders over Rs.15000. We deliver nationwide within 3-5 business days."
            ]
        },
        returns: {
            keywords: ['return', 'exchange', 'refund', 'policy', 'warranty', 'satisfaction', 'unhappy'],
            responses: [
                "We offer worry-free returns! If you're not completely satisfied, we provide free returns or exchanges within 30 days of purchase.",
                "Our return policy is simple: 30 days free returns or exchanges for any reason. Your satisfaction is our priority!",
                "Not happy with your purchase? No problem! Free returns within 30 days, no questions asked."
            ]
        },
        payment: {
            keywords: ['payment', 'pay', 'card', 'credit', 'debit', 'checkout', 'secure', 'safe'],
            responses: [
                "We accept all major credit and debit cards. Our checkout process is 100% secure with encrypted payment processing.",
                "Payment is safe and secure! We accept Visa, MasterCard, and other major cards. Your information is protected with industry-standard encryption.",
                "Secure payment options available including all major credit/debit cards. Your payment information is always protected."
            ]
        },
        about: {
            keywords: ['about', 'company', 'mission', 'story', 'who', 'what', 'why', 'quality'],
            responses: [
                "Shoe Point specializes in high-quality athletic footwear. Our mission is to provide customers with premium sport shoes while prioritizing sustainability and ethical practices.",
                "We're passionate about athletic performance! Shoe Point offers cutting-edge sport shoes optimized for maximum performance across running, basketball, hiking, and more.",
                "Our mission: Step up your game! We provide high-quality, affordable sport shoes with a seamless shopping experience and commitment to sustainability."
            ]
        },
        greeting: {
            keywords: ['hi', 'hello', 'hey', 'good', 'morning', 'afternoon', 'evening', 'help'],
            responses: [
                "Hello! Welcome to Shoe Point! I'm here to help you find the perfect athletic shoes. What can I assist you with today?",
                "Hi there! Thanks for visiting Shoe Point. I can help you with product information, shipping details, or any other questions. How can I help?",
                "Hey! Great to see you at Shoe Point. I'm your personal shopping assistant. What would you like to know about our athletic shoes?"
            ]
        }
    },

    /**
     * Initialize chatbot functionality
     */
    init() {
        this.messagesContainer = Utils.querySelector('#chat-messages');
        this.chatInput = Utils.querySelector('#chat-input');

        if (!this.messagesContainer || !this.chatInput) {
            console.warn('Chatbot elements not found');
            return;
        }

        this.setupEventListeners();
    },

    /**
     * Setup event listeners for chatbot
     */
    setupEventListeners() {
        // Toggle chat window
        const chatToggle = Utils.querySelector('#chat-toggle');
        const chatClose = Utils.querySelector('#chat-close');
        const chatWindow = Utils.querySelector('#chat-window');

        if (chatToggle) {
            chatToggle.addEventListener('click', () => {
                this.toggleChat();
            });
        }

        if (chatClose) {
            chatClose.addEventListener('click', () => {
                this.closeChat();
            });
        }

        // Handle form submission
        const chatForm = Utils.querySelector('#chat-form');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUserMessage();
            });
        }

        // Handle quick actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-action')) {
                const action = e.target.getAttribute('data-action');
                this.handleQuickAction(action);
            }
        });

        // Close chat when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !e.target.closest('.chatbot-widget')) {
                this.closeChat();
            }
        });
    },

    /**
     * Toggle chat window
     */
    toggleChat() {
        const chatWindow = Utils.querySelector('#chat-window');
        if (!chatWindow) return;

        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    },

    /**
     * Open chat window
     */
    openChat() {
        const chatWindow = Utils.querySelector('#chat-window');
        if (!chatWindow) return;

        chatWindow.style.display = 'flex';
        this.isOpen = true;

        // Prevent body scrolling on mobile
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        }

        // Focus input
        setTimeout(() => {
            if (this.chatInput) this.chatInput.focus();
        }, 300);
    },

    /**
     * Close chat window
     */
    closeChat() {
        const chatWindow = Utils.querySelector('#chat-window');
        if (!chatWindow) return;

        chatWindow.style.display = 'none';
        this.isOpen = false;

        // Restore body scrolling on mobile
        if (window.innerWidth <= 768) {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
    },

    /**
     * Handle user message
     */
    handleUserMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');

        // Send notification to WhatsApp (if enabled)
        this.sendWhatsAppNotification(message);

        // Clear input
        this.chatInput.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        // Generate AI response
        setTimeout(() => {
            this.hideTypingIndicator();
            const response = this.generateResponse(message);
            this.addMessage(response, 'bot');
        }, 1000 + Math.random() * 1000); // Random delay 1-2 seconds
    },

    /**
     * Handle quick action buttons
     */
    handleQuickAction(action) {
        let message = '';
        switch (action) {
            case 'products':
                message = 'Tell me about your products';
                break;
            case 'shipping':
                message = 'What are your shipping options?';
                break;
            case 'returns':
                message = 'What is your return policy?';
                break;
            case 'human':
                this.connectToHuman();
                return;
        }

        if (message) {
            this.addMessage(message, 'user');
            this.sendWhatsAppNotification(message);
            this.showTypingIndicator();

            setTimeout(() => {
                this.hideTypingIndicator();
                const response = this.generateResponse(message);
                this.addMessage(response, 'bot');
            }, 800);
        }
    },

    /**
     * Add message to chat
     */
    addMessage(text, sender) {
        if (!this.messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${text}</p>
            </div>
            <span class="message-time">${timeString}</span>
        `;

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    },

    /**
     * Generate AI response based on user input
     */
    generateResponse(userMessage) {
        const message = userMessage.toLowerCase();

        // Check each category in knowledge base
        for (const [category, data] of Object.entries(this.knowledgeBase)) {
            for (const keyword of data.keywords) {
                if (message.includes(keyword)) {
                    // Return random response from matching category
                    const responses = data.responses;
                    return responses[Math.floor(Math.random() * responses.length)];
                }
            }
        }

        // Default responses for unmatched queries
        const defaultResponses = [
            "I'd be happy to help! Could you please be more specific about what you're looking for? I can assist with products, shipping, returns, or any other questions about Shoe Point.",
            "Thanks for your question! I can help you with information about our shoes, shipping policies, returns, or anything else about Shoe Point. What would you like to know?",
            "I'm here to help! Feel free to ask me about our athletic shoes, pricing, shipping, returns, or any other questions about shopping with Shoe Point.",
            "Great question! I can provide information about our products, shipping options, return policy, or help you find the perfect shoes. What interests you most?"
        ];

        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    },

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        if (!this.messagesContainer) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-message';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;

        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    },

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const typingMessage = this.messagesContainer?.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    },

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    },

    /**
     * Send WhatsApp notification to admin
     */
    sendWhatsAppNotification(userMessage) {
        if (!this.whatsappConfig.enabled) return;

        try {
            const timestamp = new Date().toLocaleString();
            const websiteUrl = window.location.href;

            // Create WhatsApp message
            const whatsappMessage = `🔔 *New Customer Query - Shoe Point*\n\n` +
                `*Time:* ${timestamp}\n` +
                `*Website:* ${websiteUrl}\n` +
                `*Customer Message:* ${userMessage}\n\n` +
                `Please reply to assist the customer! 👟`;

            // Encode message for WhatsApp URL
            const encodedMessage = encodeURIComponent(whatsappMessage);

            // Create WhatsApp Web URL
            const whatsappUrl = `https://wa.me/${this.whatsappConfig.phoneNumber}?text=${encodedMessage}`;

            // Open WhatsApp in a new tab (silent notification)
            // Note: This will open WhatsApp but won't send automatically for privacy
            const whatsappWindow = window.open(whatsappUrl, '_blank', 'width=400,height=600');

            // Close the WhatsApp window after 3 seconds (user can keep it open if needed)
            setTimeout(() => {
                if (whatsappWindow && !whatsappWindow.closed) {
                    whatsappWindow.close();
                }
            }, 3000);

            console.log('WhatsApp notification sent for message:', userMessage);

        } catch (error) {
            console.error('Failed to send WhatsApp notification:', error);
        }
    },

    /**
     * Connect customer to human agent
     */
    connectToHuman() {
        this.addMessage('I want to speak with a human agent', 'user');

        // Send WhatsApp notification for human agent request
        this.sendWhatsAppNotification('🚨 URGENT: Customer wants to speak with human agent');

        this.showTypingIndicator();

        setTimeout(() => {
            this.hideTypingIndicator();

            const response = `I'm connecting you with our human support team! 👨‍💼\n\n` +
                `Our team has been notified and will contact you shortly via WhatsApp at ${this.whatsappConfig.phoneNumber}.\n\n` +
                `You can also directly message us on WhatsApp by clicking the button below:`;

            this.addMessage(response, 'bot');

            // Add WhatsApp direct contact button
            setTimeout(() => {
                this.addWhatsAppContactButton();
            }, 500);

        }, 1500);
    },

    /**
     * Add WhatsApp contact button to chat
     */
    addWhatsAppContactButton() {
        if (!this.messagesContainer) return;

        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'message bot-message';

        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        buttonDiv.innerHTML = `
            <div class="message-content">
                <button onclick="ChatbotManager.openWhatsAppDirect()" style="
                    background: #25D366;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 25px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    width: 100%;
                    justify-content: center;
                    transition: background 0.3s ease;
                " onmouseover="this.style.background='#128C7E'" onmouseout="this.style.background='#25D366'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    Contact via WhatsApp
                </button>
            </div>
            <span class="message-time">${timeString}</span>
        `;

        this.messagesContainer.appendChild(buttonDiv);
        this.scrollToBottom();
    },

    /**
     * Open WhatsApp directly
     */
    openWhatsAppDirect() {
        const message = `Hi! I was chatting on your Shoe Point website and would like to speak with a human agent. Can you please help me?`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${this.whatsappConfig.phoneNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');

        Utils.showNotification('Opening WhatsApp... You can now chat directly with our team!');
    }
};

// ===== GLOBAL ERROR HANDLING =====
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.addEventListener('beforeunload', () => {
    App.cleanup();
});

// ===== EXPOSE GLOBAL FUNCTIONS FOR INLINE HANDLERS =====
window.CartManager = CartManager;
window.PaymentManager = PaymentManager;
window.ProductCatalog = ProductCatalog;