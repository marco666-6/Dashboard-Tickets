/*Main*/
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('.dropdown-menu').forEach(function (dropdown) {
        dropdown.addEventListener('click', function (event) {
            event.stopPropagation(); // Prevent dropdown from closing when clicking inside
        });
    });

    const notifyDropdown = document.querySelector("#notifyDropdown");
    const userDropdown = document.querySelector("#userDropdown");
    const notifyDropdownMenu = document.querySelector("#notifyDropdown + .dropdown-menu"); // Get the notifications menu
    const userDropdownMenu = document.querySelector("#userDropdown + .dropdown-menu"); // Get the user profile menu

    notifyDropdown.addEventListener("hide.bs.dropdown", function (event) {
        event.preventDefault(); // Prevent instant hiding
        notifyDropdownMenu.classList.add("hide-animation");

        setTimeout(() => {
            notifyDropdownMenu.classList.remove("show", "hide-animation"); // Remove Bootstrap's 'show' class after animation
        }, 300); // Match the animation duration (0.3s)
    });
    
    userDropdown.addEventListener("hide.bs.dropdown", function (event) {
        event.preventDefault(); // Prevent instant hiding
        userDropdownMenu.classList.add("hide-animation");

        setTimeout(() => {
            userDropdownMenu.classList.remove("show", "hide-animation"); // Remove Bootstrap's 'show' class after animation
        }, 300); // Match the animation duration (0.3s)
    });
});

// ============ Left sidebar js ============

$(document).on('click', '#sidebar li', function() {
    $(this).addClass('active').siblings().removeClass('active');
});

// =============================
// Sidebar Toggle
// =============================

$(document).ready(function() {
    $("#toggleSidebar").click(function() {
        $(".left-menu").toggleClass("hide");
        $(".content-wrapper").toggleClass("hide");
    });
});