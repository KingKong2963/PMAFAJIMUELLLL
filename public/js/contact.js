document.addEventListener('DOMContentLoaded', () => {
  console.log('contact.js loaded');

  const form = document.getElementById('contactForm');
  const successMessage = document.getElementById('success-message');

  if (form && successMessage) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Reset error messages
      document.querySelectorAll('.error').forEach(error => error.classList.add('hidden'));

      // Validate inputs
      let isValid = true;
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const subject = document.getElementById('subject').value.trim();
      const message = document.getElementById('message').value.trim();

      if (!name) {
        document.querySelector('#name + .error').classList.remove('hidden');
        isValid = false;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.querySelector('#email + .error').classList.remove('hidden');
        isValid = false;
      }
      if (!subject) {
        document.querySelector('#subject + .error').classList.remove('hidden');
        isValid = false;
      }
      if (!message) {
        document.querySelector('#message + .error').classList.remove('hidden');
        isValid = false;
      }

      if (isValid) {
        console.log('Form validated successfully:', { name, email, subject, message });
        
        try {
          // Send actual form data to the server
          const response = await fetch('/process-contact', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, subject, message })
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Show success message
            form.reset();
            successMessage.classList.remove('hidden');
            form.classList.add('hidden');
            
            // Show form again after a delay
            setTimeout(() => {
              form.classList.remove('hidden');
              successMessage.classList.add('hidden');
            }, 5000);
          } else {
            // Handle error from server
            alert(`Error: ${data.message || 'Failed to send message'}`);
          }
        } catch (error) {
          console.error('Error submitting form:', error);
          alert('There was an error sending your message. Please try again later.');
        }
      } else {
        console.log('Form validation failed');
      }
    });
  } else {
    console.warn('Contact form or success message not found');
  }
});