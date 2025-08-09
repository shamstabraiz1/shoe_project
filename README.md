# 👟 Shoe Point - E-commerce Website

A modern, responsive e-commerce website specializing in athletic footwear with integrated payment processing.

## 🌟 Features

### 🛒 **Shopping Experience**
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Product Catalog** - Featuring running shoes, basketball shoes, soccer cleats, tennis shoes, and hiking boots
- **Smart Cart System** - Persistent cart with localStorage, quantity controls, and real-time totals
- **Category Browsing** - Easy navigation through different shoe categories
- **Product Gallery** - High-quality product images with interactive displays

### 💳 **Payment Integration**
- **PayPal Integration** - Secure PayPal payments with Smart Payment Buttons
- **Stripe Integration** - Credit/debit card processing with Stripe Elements
- **Multiple Currencies** - PKR display with USD conversion for PayPal
- **Order Management** - Complete order tracking and confirmation system
- **Receipt Generation** - Automatic order confirmations and receipts

### 🎨 **Design & UX**
- **Modern UI** - Clean, professional design with smooth animations
- **Location Ticker** - Scrolling location information
- **Countdown Timer** - Limited-time offer promotions
- **Customer Testimonials** - Social proof with customer reviews
- **Live Chat Widget** - Customer support integration
- **Professional Footer** - Comprehensive site navigation and information

## 🚀 **Technologies Used**

- **HTML5** - Semantic markup with accessibility features
- **CSS3** - Custom styling with responsive design and animations
- **Vanilla JavaScript** - Client-side functionality without external frameworks
- **PayPal SDK** - Payment processing integration
- **Stripe.js** - Secure card payment processing
- **LocalStorage** - Client-side data persistence

## 📁 **Project Structure**

```
shoe_project/
├── index-enhanced.html          # Main HTML file
├── styles-enhanced.css          # Main stylesheet
├── script-enhanced.js           # JavaScript functionality
├── .kiro/                       # Kiro IDE configuration
│   ├── specs/                   # Feature specifications
│   └── steering/                # Development guidelines
└── [image-files]                # Product and UI images
```

## 🛠️ **Setup Instructions**

### **Local Development**
1. Clone the repository
2. Open `index-enhanced.html` in your browser
3. Or serve with a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

### **Payment Configuration**

#### **PayPal Setup**
1. Create a PayPal Business account
2. Get your Client ID from PayPal Developer Dashboard
3. Update `CONFIG.PAYMENT.PAYPAL.CLIENT_ID` in `script-enhanced.js`
4. Change environment from 'sandbox' to 'production'

#### **Stripe Setup**
1. Create a Stripe account
2. Get your publishable key
3. Update `CONFIG.PAYMENT.STRIPE.PUBLISHABLE_KEY` in `script-enhanced.js`
4. Set up server-side payment processing

## 🌐 **Live Demo**

Currently configured for testing with sandbox/test payment environments.

## 📱 **Responsive Breakpoints**

- **Desktop**: 1024px+
- **Tablet**: 768px - 1023px
- **Mobile**: 480px - 767px
- **Small Mobile**: <480px

## 🔒 **Security Features**

- HTTPS enforcement for payment processing
- Secure payment tokenization
- No sensitive data stored locally
- PCI compliance ready
- Input validation and sanitization

## 🎯 **Key Features Implemented**

- ✅ Complete shopping cart functionality
- ✅ PayPal payment integration
- ✅ Stripe payment integration
- ✅ Order management system
- ✅ Responsive design
- ✅ Product image mapping
- ✅ Tax-free pricing structure
- ✅ Free shipping threshold (Rs.15,000+)
- ✅ Professional UI/UX design

## 📞 **Contact & Support**

**Store Location**: Chella Chock Muzaffarabad AJK

## 🚀 **Future Enhancements**

- Email receipt system
- Admin dashboard
- Inventory management
- User accounts and profiles
- Order tracking system
- Multi-language support

## 📄 **License**

This project is created for Shoe Point business.

---

**Built with ❤️ for athletic footwear enthusiasts**