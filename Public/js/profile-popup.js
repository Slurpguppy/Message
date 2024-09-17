document.addEventListener('DOMContentLoaded', () => {
    const openPopupButton = document.getElementById('open-profile-popup'); // Ensure this element exists in your HTML
    const closeProfilePopupButton = document.getElementById('close-profile-popup');
    const profilePopup = document.getElementById('profile-popup');

    // Function to open the popup with animation
    function openPopup() {
        profilePopup.style.display = 'block'; // Ensure the popup is visible
        profilePopup.classList.remove('hide');
        profilePopup.classList.add('show');
    }

    // Function to close the popup with animation
    function closePopup() {
        profilePopup.classList.remove('show');
        profilePopup.classList.add('hide');
        // Wait for the animation to complete before hiding the element
        setTimeout(() => {
            profilePopup.style.display = 'none';
        }, 500); // Match the animation duration
    }

    // Open the popup when the open button is clicked
    if (openPopupButton) {
        openPopupButton.addEventListener('click', openPopup);
    }

    // Close the popup when the close button is clicked
    if (closeProfilePopupButton) {
        closeProfilePopupButton.addEventListener('click', closePopup);
    }

    // Close the popup if the user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === profilePopup) {
            closePopup();
        }
    });
});