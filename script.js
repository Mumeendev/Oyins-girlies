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
            // Visual feedback
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
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
        const product = urlParams.get('product') || 'Selected Item';
        const titleElement = document.getElementById('selectedProductTitle');
        
        if (titleElement) {
            titleElement.innerText = `Ordering: ${product}`;
        }

        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            orderForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fullName = document.getElementById('fullName').value.trim();
                const phone = document.getElementById('phone').value.trim();
                const location = document.getElementById('location').value.trim();
                const colour = document.getElementById('colour').value;
                const amount = document.getElementById('amount').value;
                const date = document.getElementById('deliveryDate').value;

                if (!fullName || !phone || !location || !colour || !amount || !date) {
                    alert('Please fill in all fields correctly.');
                    return;
                }

                const submitBtn = orderForm.querySelector('.btn-confirm-order');
                const originalBtnText = submitBtn.innerText;
                submitBtn.innerText = 'Processing...';
                submitBtn.disabled = true;

                try {
                    // Detect if running locally or on production
                    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    
                    // Production Backend URL (can be overridden by an environment-like check if needed)
                    const prodUrl = 'https://oyins-girlies.onrender.com'; 
                    
                    const API_URL = isLocal ? 'http://localhost:1000/api/orders' : `${prodUrl}/api/orders`;

                    console.log('Attempting to send order to:', API_URL);
                    
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            product,
                            fullName,
                            phone,
                            location,
                            colour,
                            amount,
                            date
                        }),
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        alert(`Order Confirmed!\nOrder ID: ${result.order.id}\nThank you for shopping with Oyin's Girlies!`);
                        window.location.href = 'index.html';
                    } else {
                        throw new Error(result.error || 'The server encountered an error while saving your order.');
                    }
                } catch (error) {
                    console.error('Order Submission Error:', error);
                    let errorMessage = error.message;
                    if (error instanceof TypeError && error.message.includes('fetch')) {
                        errorMessage = 'Unable to connect to the server. Please check your internet connection or try again later.';
                    }
                    alert(`Error: ${errorMessage}`);
                    submitBtn.innerText = originalBtnText;
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
