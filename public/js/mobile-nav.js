document.addEventListener('DOMContentLoaded', () => {
    const toggles = document.querySelectorAll('.toggle-dropdown');
  
    toggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling to parent elements
  
        const targetId = toggle.dataset.target;
        const dropdown = document.getElementById(targetId);
  
        // Log click for debugging
        console.log(`Clicked toggle: ${toggle.id}, targeting: ${targetId}`);
  
        // Toggle the clicked dropdown
        dropdown.classList.toggle('dropdown-active');
  
        // Close other dropdowns, but preserve parent dropdown
        document.querySelectorAll('.dropdown-active').forEach(openDropdown => {
          // Skip the current dropdown and its parent
          if (openDropdown !== dropdown && !openDropdown.contains(toggle)) {
            openDropdown.classList.remove('dropdown-active');
          }
        });
  
        // Close dropdowns when clicking outside
        const closeOutside = (event) => {
          if (!toggle.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.classList.remove('dropdown-active');
            // Close parent dropdown if it's not the target
            const parentDropdown = toggle.closest('.dropdown-active');
            if (parentDropdown && parentDropdown !== dropdown) {
              parentDropdown.classList.remove('dropdown-active');
            }
            document.removeEventListener('click', closeOutside);
            console.log(`Closed dropdown: ${targetId} (outside click)`);
          }
        };
        // Remove existing listeners to prevent duplicates
        document.removeEventListener('click', closeOutside);
        document.addEventListener('click', closeOutside);
      });
    });
  });