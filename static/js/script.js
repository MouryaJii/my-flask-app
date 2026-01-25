// const authModal = document.querySelector('.auth-modal');
// const loginLink = document.querySelector('.login-link');
// const registerLink = document.querySelector('.register-link'); 
// const loginBtnModal = document.querySelector('.login-btn-modal'); 
// const closeBtnModal = document.querySelector('.close-btn-modal');
// const profileBox = document.querySelector('.profile-box');
// const avatarCircle = document.querySelector('.avatar-circle');
// const alertBox = document.querySelector('.alert-box');


// registerLink.addEventListener('click', () => authModal.classList.add('slide'));
// loginLink.addEventListener('click', () => authModal.classList.remove('slide'));

// loginBtnModal.addEventListener('click', () => authModal.classList.add('show'));
// closeBtnModal.addEventListener('click', () => authModal.classList.remove('show', 'slide'));

// avatarCircle.addEventListener('click', () => profileBox.classList.toggle('show'));

// alert box  

//     setTimeout(() => alertBox.classList.add('show'), 50);

// setTimeout(() => {
//     alertBox.classList.remove('show');
//     setTimeout(() => alertBox.remove(), 1000);
// }, 6000);

const container = document.querySelector('.container');
const loginBtn = document.querySelector('.login-btn');
const registerBtn = document.querySelector('.register-btn');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
});

// for flash messages

setTimeout(() => {
  const flashes = document.querySelector('.flash-container');
  if (flashes) flashes.style.display = 'none';
}, 3000);
