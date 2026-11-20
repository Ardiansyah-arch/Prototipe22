const navButtons = document.querySelectorAll('.nav-btn');
const screens = document.querySelectorAll('.screen');

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        screens.forEach(screen => screen.classList.remove('active'));
        const targetScreen = btn.getAttribute('data-screen');
        document.getElementById(`screen-${targetScreen}`).classList.add('active');
    });
});

const prayerInputs = document.querySelectorAll('[data-prayer]');
const prayerProgress = document.getElementById('prayer-progress');

function updatePrayerProgress() {
    const count = [...prayerInputs].filter(input => input.checked).length;
    prayerProgress.textContent = `${count}/5`;
}

prayerInputs.forEach(input => input.addEventListener('change', updatePrayerProgress));

const targetInputs = document.querySelectorAll('[data-target]');
const targetProgress = document.getElementById('target-progress');

function updateTargetProgress() {
    const count = [...targetInputs].filter(input => input.checked).length;
    targetProgress.textContent = count;
}

targetInputs.forEach(input => input.addEventListener('change', updateTargetProgress));