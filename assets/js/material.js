// Material Design JavaScript helpers

// Ripple effect para botões
document.addEventListener('DOMContentLoaded', function() {
    initRipple();
    initTextFields();
});

function initRipple() {
    const rippleElements = document.querySelectorAll('.btn, .card, .chip');
    
    rippleElements.forEach(element => {
        element.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple-effect');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Text fields com label flutuante
function initTextFields() {
    const textFields = document.querySelectorAll('.text-field input, .text-field textarea');
    
    textFields.forEach(field => {
        if (field.value) {
            field.classList.add('has-value');
        }
        
        field.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        field.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
            if (this.value) {
                this.classList.add('has-value');
            } else {
                this.classList.remove('has-value');
            }
        });
    });
}

// Adicionar estilos para ripple effect
const style = document.createElement('style');
style.textContent = `
    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
