// Scroll Reveal Animation Logic
function reveal() {
    var reveals = document.querySelectorAll(".reveal");
    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 150;
        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        }
    }
}

window.addEventListener("scroll", reveal);

// Initial reveal on load
document.addEventListener("DOMContentLoaded", () => {
    reveal();
    
    // Add click interactions for category cards
    const catCards = document.querySelectorAll('.cat-card');
    catCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            // Creative ripple effect or feedback
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
                alert(`Exploring the ${category} collection... Coming soon!`);
            }, 100);
        });
    });

    // Search Functionality
    window.searchProducts = function() {
        const input = document.getElementById('productSearch');
        if (!input) return;
        
        const filter = input.value.toUpperCase();
        const grid = document.querySelector('.products-grid');
        
        if (!grid) return;

        const cards = grid.getElementsByClassName('product-card');

        for (let i = 0; i < cards.length; i++) {
            const name = cards[i].getAttribute('data-name');
            if (name && name.toUpperCase().indexOf(filter) > -1) {
                cards[i].style.display = "";
            } else {
                cards[i].style.display = "none";
            }
        }
    }

    // Handle Order Page Logic
    if (window.location.pathname.includes('order.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const product = urlParams.get('product') || 'Premium Item';
        const titleElement = document.getElementById('selectedProductTitle');
        
        if (titleElement) {
            titleElement.innerText = `Ordering: ${product}`;
        }

        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            orderForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const location = document.getElementById('location').value;
                const colour = document.getElementById('colour').value;
                const amount = document.getElementById('amount').value;
                const date = document.getElementById('deliveryDate').value;

                const submitBtn = orderForm.querySelector('.btn-confirm-order');
                submitBtn.innerText = 'Processing...';
                submitBtn.disabled = true;

                try {
                    // Detect if running locally or in production
                    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    const prodUrl = 'https://your-app-name.onrender.com'; // Placeholder
                    const API_URL = isLocal ? 'http://localhost:3000/api/orders' : `${prodUrl}/api/orders`;

                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            product,
                            location,
                            colour,
                            amount,
                            date
                        }),
                    });

                    const result = await response.json();

                    if (response.ok) {
                        alert(`Order Confirmed and Saved to Database!\nOrder ID: ${result.order.id}\nThank you for shopping with Oyin's Girlies!`);
                        window.location.href = 'index.html';
                    } else {
                        throw new Error(result.error || 'Failed to save order');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error saving order. Please make sure the server is running.');
                    submitBtn.innerText = 'Confirm Order';
                    submitBtn.disabled = false;
                }
            });
        }
    }

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            nav.style.padding = '1rem 10%';
            nav.style.background = 'rgba(10, 10, 10, 0.95)';
        } else {
            nav.style.padding = '1.5rem 10%';
            nav.style.background = 'rgba(10, 10, 10, 0.8)';
        }
    });
});
