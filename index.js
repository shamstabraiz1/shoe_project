// Set the start time to when the page loads
    // const startDate = new Date();
    // Set end time to 2 days from page load
    // const endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);

    // function updateCountdown() {
    //   const now = new Date();
    //   const timeLeft = endDate - now;

    //   if (timeLeft <= 0) {
    //     document.getElementById('days').textContent = '00';
    //     document.getElementById('hours').textContent = '00';
    //     document.getElementById('minutes').textContent = '00';
    //     return;
    //   }

    //   const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    //   const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    //   const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    //   document.getElementById('days').textContent = String(days).padStart(2, '0');
    //   document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    //   document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    // }

    // Update countdown every second
    // setInterval(updateCountdown, 1000);
    // updateCountdown(); // Initial call



















    

    let cart = [];
const FREE_SHIPPING_THRESHOLD = 500;

// Set the start time to when the page loads
const startDate = new Date();
// Set end time to 2 days from page load
const endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);
let countdownInterval = null;

function updateCountdown() {
  const daysElement = document.getElementById('days');
  const hoursElement = document.getElementById('hours');
  const minutesElement = document.getElementById('minutes');

  if (!daysElement || !hoursElement || !minutesElement) {
    console.error('Countdown elements (days, hours, minutes) not found in DOM');
    if (countdownInterval) clearInterval(countdownInterval);
    return;
  }

  const now = new Date();
  const timeLeft = endDate - now;

  if (timeLeft <= 0) {
    daysElement.textContent = '00';
    hoursElement.textContent = '00';
    minutesElement.textContent = '00';
    clearInterval(countdownInterval);
    return;
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  daysElement.textContent = String(days).padStart(2, '0');
  hoursElement.textContent = String(hours).padStart(2, '0');
  minutesElement.textContent = String(minutes).padStart(2, '0');
}

// Add to Cart functionality
function addToCart(productName, price) {
  cart.push({ name: productName, price: price });
  alert(`${productName} has been added to your cart!`);
  updateCartSummary();
}

// Update cart summary
function updateCartSummary() {
  const cartSummary = document.createElement('div');
  cartSummary.id = 'cartSummary';
  cartSummary.style.position = 'fixed';
  cartSummary.style.top = '10px';
  cartSummary.style.right = '10px';
  cartSummary.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  cartSummary.style.padding = '10px';
  cartSummary.style.border = '1px solid #ddd';
  cartSummary.style.borderRadius = '5px';
  cartSummary.style.zIndex = '1000';
  cartSummary.style.fontFamily = 'Nunito Sans, sans-serif';
  cartSummary.style.maxWidth = '300px';

  let total = cart.reduce((sum, item) => sum + item.price, 0);
  let shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : 50;
  let summaryHtml = `
    <h3 style="font-style: italic; text-transform: uppercase;">Cart Summary</h3>
    <ul style="list-style: none; padding: 0;">
      ${cart.map(item => `<li>${item.name}: $${item.price.toFixed(2)}</li>`).join('')}
    </ul>
    <p>Total: $${total.toFixed(2)}</p>
    <p>Shipping: ${shipping === 0 ? 'Free' : '$' + shipping.toFixed(2)}</p>
    <p>Grand Total: $${(total + shipping).toFixed(2)}</p>
    <button style="background-color: rgba(255, 0, 0, 0.781); color: white; border: none; padding: 5px 10px; font-style: italic;" onclick="showPaymentForm()">Proceed to Checkout</button>
  `;
  cartSummary.innerHTML = summaryHtml;

  const existingSummary = document.getElementById('cartSummary');
  if (existingSummary) existingSummary.remove();
  document.body.appendChild(cartSummary);
}

// Show payment form
function showPaymentForm() {
  const paymentForm = document.createElement('div');
  paymentForm.id = 'paymentForm';
  paymentForm.style.position = 'fixed';
  paymentForm.style.top = '50%';
  paymentForm.style.left = '50%';
  paymentForm.style.transform = 'translate(-50%, -50%)';
  paymentForm.style.backgroundColor = 'white';
  paymentForm.style.padding = '20px';
  paymentForm.style.border = '1px solid #ddd';
  paymentForm.style.borderRadius = '5px';
  paymentForm.style.zIndex = '2000';
  paymentForm.style.fontFamily = 'Nunito Sans, sans-serif';
  paymentForm.style.maxWidth = '90%';
  paymentForm.style.width = '300px';

  paymentForm.innerHTML = `
    <h3 style="font-style: italic; text-transform: uppercase;">Payment Details</h3>
    <p>Enter your ATM card details:</p>
    <input type="text" id="cardNumber" placeholder="Card Number" style="width: 100%; margin: 10px 0; padding: 5px; font-family: Nunito Sans;" />
    <input type="text" id="expiryDate" placeholder="MM/YY" style="width: 100%; margin: 10px 0; padding: 5px; font-family: Nunito Sans;" />
    <input type="text" id="cvv" placeholder="CVV" style="width: 100%; margin: 10px 0; padding: 5px; font-family: Nunito Sans;" />
    <button style="background-color: rgba(255, 0, 0, 0.781); color: white; border: none; padding: 5px 10px; font-style: italic;" onclick="processPayment()">Pay Now</button>
    <button style="background-color: black; color: white; border: none; padding: 5px 10px; font-style: italic; margin-left: 10px;" onclick="closePaymentForm()">Cancel</button>
  `;
  document.body.appendChild(paymentForm);
}

// Process payment (simulation)
function processPayment() {
  const cardNumber = document.getElementById('cardNumber').value;
  const expiryDate = document.getElementById('expiryDate').value;
  const cvv = document.getElementById('cvv').value;

  if (cardNumber && expiryDate && cvv) {
    alert('Payment processed successfully! Your order has been placed with free delivery for orders over $500.');
    cart = [];
    updateCartSummary();
    closePaymentForm();
  } else {
    alert('Please fill in all payment details.');
  }
}

// Close payment form
function closePaymentForm() {
  const paymentForm = document.getElementById('paymentForm');
  if (paymentForm) paymentForm.remove();
}

// Show products section
function showProducts(event) {
  event.preventDefault();
  const productsSection = document.getElementById('productsSection');
  if (productsSection) {
    productsSection.classList.add('active');
  } else {
    console.error('Products section not found in DOM');
  }
}

// Discover Now button to show categories
function showCategories() {
  const container = document.querySelector('.container');
  if (!container) {
    console.error('Container element not found in DOM');
    return;
  }
  const categoriesSection = document.createElement('div');
  categoriesSection.id = 'categoriesSection';
  categoriesSection.innerHTML = `
    <h2 style="text-align: center; font-family: Nunito Sans; font-style: italic; text-transform: uppercase;">Shop by Category</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
      <div style="border: 1px solid #ddd; padding: 10px; font-family: Nunito Sans;">
        <h3 style="font-style: italic; text-transform: uppercase;">Running Shoes</h3>
        <p>Lightweight and breathable for ultimate speed.</p>
        <button style="background-color: rgba(255, 0, 0, 0.781); color: white; border: none; padding: 5px 10px; font-style: italic;" onclick="addToCart('Running Shoes', 149.00)">Add to Cart</button>
      </div>
      <div style="border: 1px solid #ddd; padding: 10px; font-family: Nunito Sans;">
        <h3 style="font-style: italic; text-transform: uppercase;">Basketball Shoes</h3>
        <p>High-top support for dynamic play.</p>
        <button style="background-color: rgba(255, 0, 0, 0.781); color: white; border: none; padding: 5px 10px; font-style: italic;" onclick="addToCart('Basketball Shoes', 149.00)">Add to Cart</button>
      </div>
      <div style="border: 1px solid #ddd; padding: 10px; font-family: Nunito Sans;">
        <h3 style="font-style: italic; text-transform: uppercase;">Hiking Shoes</h3>
        <p>Durable and grippy for tough terrains.</p>
        <button style="background-color: rgba(255, 0, 0, 0.781); color: white; border: none; padding: 5px 10px; font-style: italic;" onclick="addToCart('Hiking Shoes', 149.00)">Add to Cart</button>
      </div>
      <div style="border: 1px solid #ddd; padding: 10px; font-family: Nunito Sans;">
        <h3 style="font-style: italic; text-transform: uppercase;">Soccer Cleats</h3>
        <p>Designed for precision and speed.</p>
        <button style="background-color: rgba(255, 0, 0, 0.781); color: white; border: none; padding: 5px 10px; font-style: italic;" onclick="addToCart('Soccer Cleats', 149.00)">Add to Cart</button>
      </div>
    </div>
  `;
  const existingCategories = document.getElementById('categoriesSection');
  if (existingCategories) existingCategories.remove();
  container.appendChild(categoriesSection);
}

// Event listeners for buttons
document.addEventListener('DOMContentLoaded', () => {
  updateCountdown(); // Initial call
  countdownInterval = setInterval(updateCountdown, 1000); // Update every second

  // Add to Cart buttons
  const cartButtons = document.querySelectorAll('.c_b');
  if (cartButtons.length === 0) console.warn('No .c_b buttons found in DOM');
  cartButtons.forEach(button => {
    button.addEventListener('click', () => {
      const card = button.closest('.c_1, .c_2, .c_3, .c_4, .c_5, .c_6');
      if (!card) {
        console.error('Card element not found for button');
        return;
      }
      const productName = card.querySelector('h3').textContent;
      const priceElement = card.querySelector('.c_price');
      const price = priceElement ? parseFloat(priceElement.textContent.replace('$', '')) : 149.00;
      addToCart(productName, price);
    });
  });

  // Shop Now buttons
  const shopButtons = document.querySelectorAll('.b1, .shop-button');
  if (shopButtons.length === 0) console.warn('No .b1 or .shop-button buttons found in DOM');
  shopButtons.forEach(button => {
    button.addEventListener('click', showCategories);
  });

  // Discover Now button
  const discoverButton = document.querySelector('.A_c');
  if (discoverButton) {
    discoverButton.addEventListener('click', showCategories);
  } else {
    console.warn('No .A_c button found in DOM');
  }

  // Products section button
  const productsButton = document.querySelector('#showProductsButton');
  if (productsButton) {
    productsButton.addEventListener('click', showProducts);
  } else {
    console.warn('No #showProductsButton found in DOM');
  }
});

// Responsive styles for smaller screens
const style = document.createElement('style');
style.innerHTML = `
  @media (max-width: 768px) {
    #cartSummary {
      max-width: 80%;
      right: 5px;
      top: 5px;
      font-size: 14px;
    }
    #paymentForm {
      width: 80%;
      max-width: 250px;
      font-size: 14px;
    }
    #paymentForm input {
      font-size: 12px;
    }
    #paymentForm button {
      font-size: 12px;
      padding: 4px 8px;
    }
  }
  @media (max-width: 480px) {
    #cartSummary {
      max-width: 90%;
      font-size: 12px;
    }
    #paymentForm {
      width: 90%;
      max-width: 200px;
      font-size: 12px;
    }
    #paymentForm input {
      font-size: 10px;
    }
    #paymentForm button {
      font-size: 10px;
      padding: 3px 6px;
    }
  }
`;
document.head.appendChild(style);

    
  