document.addEventListener('DOMContentLoaded', () => {
    console.log('nav.js loaded');
  
    // Handle dropdown toggles
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    console.log(`Found ${dropdownToggles.length} dropdown-toggle elements`);
  
    dropdownToggles.forEach((toggle, index) => {
      console.log(`Toggle ${index}: ${toggle.textContent.trim()}`);
  
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
  
        // Find the parent dropdown or submenu
        const parent = toggle.closest('.dropdown, .submenu');
  
        // Find the dropdown menu (next sibling that's a dropdown-menu)
        const dropdownMenu = parent.querySelector(':scope > .dropdown-menu');
  
        if (!dropdownMenu) {
          console.error(`Dropdown menu not found for toggle: ${toggle.textContent.trim()}`);
          return;
        }
  
        console.log(`Clicked toggle: ${toggle.textContent.trim()}, targeting dropdown-menu`);
  
        // Toggle the current dropdown
        dropdownMenu.classList.toggle('dropdown-active');
        console.log(`Toggled dropdown to ${dropdownMenu.classList.contains('dropdown-active') ? 'open' : 'closed'}`);
  
        // Update icon direction for the toggle
        const icon = toggle.querySelector('.fa-chevron-down, .fa-chevron-right');
        if (icon) {
          if (dropdownMenu.classList.contains('dropdown-active')) {
            if (icon.classList.contains('fa-chevron-down')) {
              icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
            } else {
              icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
            }
          } else {
            if (icon.classList.contains('fa-chevron-up')) {
              icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            } else {
              icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
            }
          }
        }
  
        // Close other dropdowns at the same level
        const siblings = Array.from(parent.parentNode.children)
          .filter(el => el !== parent && (el.classList.contains('dropdown') || el.classList.contains('submenu')));
  
        siblings.forEach(sibling => {
          const siblingMenu = sibling.querySelector(':scope > .dropdown-menu');
          if (siblingMenu && siblingMenu.classList.contains('dropdown-active')) {
            siblingMenu.classList.remove('dropdown-active');
            console.log(`Closed sibling dropdown`);
  
            // Reset icon for siblings
            const siblingIcon = sibling.querySelector('.dropdown-toggle .fa-chevron-up, .dropdown-toggle .fa-chevron-down');
            if (siblingIcon && siblingIcon.classList.contains('fa-chevron-up')) {
              siblingIcon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            }
          }
        });
      });
    });
  
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      const dropdowns = document.querySelectorAll('.dropdown-active');
      dropdowns.forEach(dropdown => {
        if (!dropdown.contains(e.target) && 
            !e.target.classList.contains('dropdown-toggle') && 
            !e.target.closest('.dropdown-toggle')) {
          dropdown.classList.remove('dropdown-active');
          console.log('Closed dropdown due to outside click');
  
          // Reset icons
          const toggle = dropdown.previousElementSibling;
          if (toggle && toggle.classList.contains('dropdown-toggle')) {
            const icon = toggle.querySelector('.fa-chevron-up, .fa-chevron-down');
            if (icon && icon.classList.contains('fa-chevron-up')) {
              icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            }
          }
        }
      });
    });
  });