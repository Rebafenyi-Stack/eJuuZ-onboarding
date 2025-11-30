// login.js - Handles form submissions for all onboarding forms

document.addEventListener('DOMContentLoaded', function() {
    // Handle form submission for all onboarding forms
    const onboardingForms = document.querySelectorAll('#onboarding-form');
    
    onboardingForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show loading message
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;
            
            // Get form data
            const formData = new FormData(form);
            const data = {};
            
            // Convert FormData to regular object
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            // Get role from hidden input
            const roleInput = form.querySelector('input[name="role"]');
            const role = roleInput ? roleInput.value : 'unknown';
            
            // Send data to backend
            fetch('/submit-onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...data, role: role })
            })
            .then(response => response.json())
            .then(result => {
                // Show success message
                const messageElement = document.getElementById('submission-message') || 
                                     form.querySelector('#submission-message') ||
                                     document.createElement('p');
                
                if (!messageElement.id) {
                    messageElement.id = 'submission-message';
                    messageElement.style.display = 'none';
                    messageElement.style.textAlign = 'center';
                    messageElement.style.color = 'var(--ejuuz-primary)';
                    messageElement.style.marginTop = '20px';
                    form.appendChild(messageElement);
                }
                
                messageElement.textContent = result.message;
                messageElement.style.display = 'block';
                messageElement.style.color = 'green';
                
                // Reset form
                form.reset();
            })
            .catch(error => {
                console.error('Error:', error);
                
                // Show error message
                const messageElement = document.getElementById('submission-message') || 
                                     form.querySelector('#submission-message') ||
                                     document.createElement('p');
                
                if (!messageElement.id) {
                    messageElement.id = 'submission-message';
                    messageElement.style.display = 'none';
                    messageElement.style.textAlign = 'center';
                    messageElement.style.color = 'var(--ejuuz-primary)';
                    messageElement.style.marginTop = '20px';
                    form.appendChild(messageElement);
                }
                
                messageElement.textContent = 'Submission failed. Please try again.';
                messageElement.style.display = 'block';
                messageElement.style.color = 'red';
            })
            .finally(() => {
                // Restore button
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            });
        });
    });
});