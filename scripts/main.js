function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', function () {
  var header = document.querySelector('.header');
  var taskbar = document.querySelector('.taskbar');
  var scrollPosition = window.scrollY;
  var back = document.querySelector('.backToHome');

  if (scrollPosition > 550) {
    header.style.opacity = '0';
    taskbar.style.transform = 'translateY(0)';
    back.classList.add('visible');
    back.classList.remove('hidden');
  } else {
    header.style.opacity = '1';
    taskbar.style.transform = 'translateY(-100%)';
    back.classList.remove('visible');
    back.classList.add('hidden');
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const groups = document.querySelectorAll('.group');

  function checkVisibility() {
    const windowHeight = window.innerHeight;

    groups.forEach(group => {
      const rect = group.getBoundingClientRect();
      const groupHeight = rect.height;
      const visibleHeight = Math.max(0, Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0));
      const visibilityPercentage = (visibleHeight / groupHeight) * 100;

      if (visibilityPercentage >= 30) {
        group.classList.add('visible');
        group.classList.remove('hidden');
      } else {
        group.classList.add('hidden');
        group.classList.remove('visible');
      }
    });
  }

  window.addEventListener('scroll', checkVisibility);
  window.addEventListener('resize', checkVisibility);
  checkVisibility();
});


const characters = "|";
const container = document.getElementById('character-container');

async function createCharacter() {
  const char = document.createElement('div');
  char.className = 'character';
  char.textContent = characters[Math.floor(Math.random() * characters.length)];
  char.style.left = `${Math.random() * 100}%`;
  char.style.top = '-20px';
  container.appendChild(char);

  let position = -20;
  const speed = 1 + Math.random() * 3;

  function fall() {
    position += speed;
    char.style.top = `${position}px`;

    if (position < window.innerHeight) {
      requestAnimationFrame(fall);
    } else {
      char.remove();
    }
  }

  fall();
}

setInterval(createCharacter, 250);

function typeWriter(element) {
  const text = element.getAttribute('data-text');
  const speed = parseInt(element.getAttribute('data-speed')) || 20;
  let i = 0;

  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }

  type();
}

document.addEventListener('DOMContentLoaded', () => {
  const elements = document.querySelectorAll('.typewriter');
  elements.forEach(element => {
    typeWriter(element);
  });
});