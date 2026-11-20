const navButtons = document.querySelectorAll('.nav-btn');
const screens = document.querySelectorAll('.screen');
const prayerNames = [
    { id: 'subuh', name: 'Subuh', time: '04:10' },
    { id: 'zuhur', name: 'Zuhur', time: '11:45' },
    { id: 'asar', name: 'Asar', time: '15:12' },
    { id: 'magrib', name: 'Magrib', time: '17:55' },
    { id: 'isya', name: 'Isya', time: '19:05' }
];
const alarmStorageKey = 'bu-maratus-alarms';
const defaultAlarms = Object.fromEntries(
    prayerNames.map(prayer => [prayer.id, { time: prayer.time, enabled: false }])
);
const storedAlarms = JSON.parse(localStorage.getItem(alarmStorageKey) || 'null');
const alarms = Object.fromEntries(prayerNames.map(prayer => {
    const saved = storedAlarms?.[prayer.id];
    const validTime = typeof saved?.time === 'string' && /^\d{2}:\d{2}$/.test(saved.time);
    return [prayer.id, {
        time: validTime ? saved.time : defaultAlarms[prayer.id].time,
        enabled: saved?.enabled === true
    }];
}));

function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function openDialog(dialog) {
    if (!dialog.open) dialog.showModal();
}

function saveAlarms() {
    localStorage.setItem(alarmStorageKey, JSON.stringify(alarms));
    renderPrayerTimes();
    updateNextPrayer();
}

function renderPrayerTimes() {
    prayerNames.forEach(prayer => {
        document.querySelectorAll(`[data-prayer-time="${prayer.id}"], [data-schedule-time="${prayer.id}"]`)
            .forEach(element => { element.textContent = alarms[prayer.id].time; });
    });
}

function renderAlarmSettings() {
    const list = document.getElementById('alarm-settings-list');
    list.replaceChildren();

    prayerNames.forEach(prayer => {
        const row = document.createElement('div');
        row.className = 'alarm-setting-row';

        const info = document.createElement('div');
        info.className = 'alarm-setting-info';

        const name = document.createElement('span');
        name.textContent = prayer.name;

        const status = document.createElement('small');
        status.dataset.alarmStatus = prayer.id;

        info.append(name, status);

        const time = document.createElement('input');
        time.type = 'time';
        time.className = 'alarm-time';
        time.value = alarms[prayer.id].time;
        time.setAttribute('aria-label', `Waktu alarm ${prayer.name}`);
        time.addEventListener('change', () => {
            alarms[prayer.id].time = time.value;
            saveAlarms();
        });

        const toggleLabel = document.createElement('label');
        toggleLabel.className = 'switch-control';

        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = alarms[prayer.id].enabled;
        toggle.setAttribute('aria-label', `Aktifkan alarm ${prayer.name}`);
        toggle.addEventListener('change', () => {
            alarms[prayer.id].enabled = toggle.checked;
            saveAlarms();
            updateAlarmStatus();
        });

        const track = document.createElement('span');
        track.className = 'switch-track';
        toggleLabel.append(toggle, track);
        row.append(info, time, toggleLabel);
        list.append(row);
    });
    updateAlarmStatus();
}

function updateAlarmStatus() {
    prayerNames.forEach(prayer => {
        const status = document.querySelector(`[data-alarm-status="${prayer.id}"]`);
        status.textContent = alarms[prayer.id].enabled ? 'Alarm aktif' : 'Alarm mati';
    });
}

function updateNextPrayer() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const upcoming = prayerNames
        .map(prayer => {
            const [hour, minute] = alarms[prayer.id].time.split(':').map(Number);
            let minutesUntil = hour * 60 + minute - currentMinutes;
            if (minutesUntil <= 0) minutesUntil += 24 * 60;
            return { ...prayer, minutesUntil };
        })
        .sort((first, second) => first.minutesUntil - second.minutesUntil)[0];
    const hours = Math.floor(upcoming.minutesUntil / 60);
    const minutes = upcoming.minutesUntil % 60;

    document.getElementById('next-prayer-name').textContent = upcoming.name;
    document.getElementById('next-prayer-time').textContent = alarms[upcoming.id].time;
    document.getElementById('next-prayer-countdown').textContent =
        hours > 0 ? `${hours}j ${minutes}m lagi` : `${minutes} menit lagi`;
}

function renderDates() {
    const today = new Date();
    document.getElementById('schedule-date').textContent = today.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    document.getElementById('target-date').textContent = today.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric'
    });
}

const tilawahHistoryKey = 'bu-maratus-tilawah-history';
const tilawahHistory = JSON.parse(localStorage.getItem(tilawahHistoryKey) || '{}');
const tilawahDays = document.getElementById('tilawah-days');
const tilawahProgressLabel = document.getElementById('tilawah-progress-label');
const tilawahProgressFill = document.getElementById('tilawah-progress-fill');
const tilawahProgressBar = tilawahProgressFill.parentElement;
const tilawahTodayButton = document.getElementById('toggle-tilawah-day');
const tilawahHistoryList = document.getElementById('tilawah-history-list');

function getRecentDates(count) {
    const dates = [];
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    for (let offset = count - 1; offset >= 0; offset -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        dates.push(date);
    }

    return dates;
}

function renderTilawahProgress() {
    const recentDates = getRecentDates(7);
    const completedDays = recentDates.filter(date => tilawahHistory[localDateKey(date)] === true).length;
    const percentage = Math.round((completedDays / recentDates.length) * 100);
    const todayCompleted = tilawahHistory[localDateKey()] === true;

    tilawahProgressLabel.textContent = `${completedDays}/7 hari`;
    tilawahProgressFill.style.width = `${percentage}%`;
    tilawahProgressBar.setAttribute('aria-valuenow', String(percentage));
    tilawahTodayButton.textContent = todayCompleted
        ? 'Batalkan Tilawah Hari Ini'
        : 'Tandai Tilawah Hari Ini Selesai';
    tilawahTodayButton.classList.toggle('is-complete', todayCompleted);

    tilawahDays.replaceChildren();
    recentDates.forEach(date => {
        const dateKey = localDateKey(date);
        const isCompleted = tilawahHistory[dateKey] === true;
        const isToday = dateKey === localDateKey();
        const day = document.createElement('div');
        day.className = `tilawah-day${isCompleted ? ' done' : ''}${isToday ? ' current' : ''}`;

        const weekday = document.createElement('span');
        weekday.textContent = date.toLocaleDateString('id-ID', { weekday: 'short' });

        const marker = document.createElement('i');
        marker.setAttribute('aria-hidden', 'true');

        const dayNumber = document.createElement('small');
        dayNumber.textContent = String(date.getDate());

        day.append(weekday, marker, dayNumber);
        tilawahDays.append(day);
    });
}

function renderTilawahHistory() {
    tilawahHistoryList.replaceChildren();
    const completedDates = Object.keys(tilawahHistory)
        .filter(date => tilawahHistory[date] === true)
        .sort((first, second) => second.localeCompare(first));

    if (completedDates.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'history-empty';
        empty.textContent = 'Belum ada hari tilawah yang tercatat.';
        tilawahHistoryList.append(empty);
        return;
    }

    completedDates.forEach(dateKey => {
        const item = document.createElement('li');
        const date = new Date(`${dateKey}T12:00:00`);
        item.textContent = date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        tilawahHistoryList.append(item);
    });
}

tilawahTodayButton.addEventListener('click', () => {
    const today = localDateKey();
    if (tilawahHistory[today]) {
        delete tilawahHistory[today];
    } else {
        tilawahHistory[today] = true;
    }
    localStorage.setItem(tilawahHistoryKey, JSON.stringify(tilawahHistory));
    renderTilawahProgress();
});

document.getElementById('open-tilawah-history').addEventListener('click', () => {
    renderTilawahHistory();
    openDialog(document.getElementById('tilawah-history-dialog'));
});

document.getElementById('reset-tilawah-history').addEventListener('click', () => {
    if (Object.keys(tilawahHistory).length === 0) return;
    if (!window.confirm('Reset semua riwayat tilawah? Tindakan ini tidak bisa dibatalkan.')) return;

    Object.keys(tilawahHistory).forEach(date => delete tilawahHistory[date]);
    localStorage.removeItem(tilawahHistoryKey);
    renderTilawahProgress();
    renderTilawahHistory();
});

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const target = document.getElementById(`screen-${button.dataset.screen}`);
        if (!target) return;

        navButtons.forEach(navButton => {
            navButton.classList.remove('active');
            navButton.removeAttribute('aria-current');
        });
        button.classList.add('active');
        button.setAttribute('aria-current', 'page');
        screens.forEach(screen => screen.classList.toggle('active', screen === target));
    });
});

const prayerInputs = [...document.querySelectorAll('[data-prayer]')];
const prayerProgress = document.getElementById('prayer-progress');
const prayerStateKey = `bu-maratus-prayers-${localDateKey()}`;
const savedPrayerState = JSON.parse(localStorage.getItem(prayerStateKey) || '{}');

prayerInputs.forEach(input => {
    input.checked = savedPrayerState[input.dataset.prayer] === true;
    input.addEventListener('change', () => {
        const state = Object.fromEntries(prayerInputs.map(item => [item.dataset.prayer, item.checked]));
        localStorage.setItem(prayerStateKey, JSON.stringify(state));
        updatePrayerProgress();
    });
});

function updatePrayerProgress() {
    const count = prayerInputs.filter(input => input.checked).length;
    prayerProgress.textContent = `${count}/${prayerInputs.length}`;
}

const targetList = document.querySelector('.target-list');
const targetProgress = document.getElementById('target-progress');
const targetTotalLabel = document.getElementById('target-total-label');
const targetStateKey = `bu-maratus-targets-${localDateKey()}`;
const targetNamesKey = 'bu-maratus-custom-targets';
const targetHistoryKey = 'bu-maratus-target-history';
const savedTargetState = JSON.parse(localStorage.getItem(targetStateKey) || '{}');
const customTargetNames = JSON.parse(localStorage.getItem(targetNamesKey) || '[]');
const targetHistory = JSON.parse(localStorage.getItem(targetHistoryKey) || '{}');
if (!targetHistory[localDateKey()] && Object.keys(savedTargetState).length > 0) {
    targetHistory[localDateKey()] = {
        completed: Object.keys(savedTargetState).filter(name => savedTargetState[name] === true),
        total: document.querySelectorAll('[data-target]').length + customTargetNames.length
    };
    localStorage.setItem(targetHistoryKey, JSON.stringify(targetHistory));
}

function addTargetRow(name) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.target = '';
    input.dataset.targetName = name;

    const check = document.createElement('span');
    check.className = 'custom-check';
    const text = document.createElement('span');
    text.textContent = name;

    label.append(input, check, text);
    targetList.append(label);
    input.checked = savedTargetState[name] === true;
    input.addEventListener('change', saveTargetState);
}

document.querySelectorAll('[data-target]').forEach(input => {
    input.checked = savedTargetState[input.dataset.targetName] === true;
    input.addEventListener('change', saveTargetState);
});
customTargetNames.forEach(addTargetRow);

function saveTargetState() {
    const targetInputs = [...document.querySelectorAll('[data-target]')];
    const state = Object.fromEntries(
        targetInputs.map(input => [input.dataset.targetName, input.checked])
    );
    localStorage.setItem(targetStateKey, JSON.stringify(state));
    targetHistory[localDateKey()] = {
        completed: targetInputs.filter(input => input.checked).map(input => input.dataset.targetName),
        total: targetInputs.length
    };
    localStorage.setItem(targetHistoryKey, JSON.stringify(targetHistory));
    updateTargetProgress();
}

function updateTargetProgress() {
    const targetInputs = [...document.querySelectorAll('[data-target]')];
    const completed = targetInputs.filter(input => input.checked).length;
    targetProgress.textContent = completed;
    targetTotalLabel.textContent = `dari ${targetInputs.length} target selesai`;
}

function renderTargetHistory() {
    const historyList = document.getElementById('target-history-list');
    historyList.replaceChildren();
    const dates = Object.keys(targetHistory).sort((first, second) => second.localeCompare(first));

    if (dates.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'history-empty';
        empty.textContent = 'Belum ada riwayat target ibadah.';
        historyList.append(empty);
        return;
    }

    dates.forEach(dateKey => {
        const record = targetHistory[dateKey];
        const item = document.createElement('li');
        const date = document.createElement('strong');
        date.textContent = new Date(`${dateKey}T12:00:00`).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const progress = document.createElement('span');
        progress.className = 'target-history-progress';
        progress.textContent = `${record.completed.length}/${record.total} target selesai`;
        item.append(date, progress);

        if (record.completed.length > 0) {
            const names = document.createElement('small');
            names.className = 'target-history-names';
            names.textContent = record.completed.join(', ');
            item.append(names);
        }
        historyList.append(item);
    });
}

document.getElementById('open-target-history').addEventListener('click', () => {
    renderTargetHistory();
    openDialog(document.getElementById('target-history-dialog'));
});

document.getElementById('reset-target-today').addEventListener('click', () => {
    const targetInputs = [...document.querySelectorAll('[data-target]')];
    if (!targetInputs.some(input => input.checked)) return;
    if (!window.confirm('Reset semua centang target untuk hari ini?')) return;

    targetInputs.forEach(input => { input.checked = false; });
    saveTargetState();
});

document.getElementById('reset-target-history').addEventListener('click', () => {
    if (Object.keys(targetHistory).length === 0) return;
    if (!window.confirm('Reset semua riwayat target ibadah? Tindakan ini tidak bisa dibatalkan.')) return;

    Object.keys(targetHistory).forEach(date => delete targetHistory[date]);
    localStorage.removeItem(targetHistoryKey);
    renderTargetHistory();
});

document.getElementById('open-settings').addEventListener('click', () => {
    updateNotificationStatus();
    openDialog(document.getElementById('settings-dialog'));
});

document.getElementById('open-note').addEventListener('click', () => {
    document.getElementById('note-input').value = localStorage.getItem('bu-maratus-reading-note') || '';
    openDialog(document.getElementById('note-dialog'));
});

document.getElementById('open-target').addEventListener('click', () => {
    openDialog(document.getElementById('target-dialog'));
    document.getElementById('target-input').focus();
});

document.querySelectorAll('[data-close-dialog]').forEach(button => {
    button.addEventListener('click', () => button.closest('dialog').close());
});

document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
    });
});

document.getElementById('note-form').addEventListener('submit', event => {
    event.preventDefault();
    const note = document.getElementById('note-input').value.trim();
    localStorage.setItem('bu-maratus-reading-note', note);

    const preview = document.getElementById('note-preview');
    preview.textContent = note ? `Catatan: ${note}` : '';
    preview.hidden = !note;
    document.getElementById('note-dialog').close();
});

document.getElementById('target-form').addEventListener('submit', event => {
    event.preventDefault();
    const input = document.getElementById('target-input');
    const name = input.value.trim();
    if (!name) {
        input.focus();
        return;
    }

    const normalizedName = name.toLocaleLowerCase('id-ID');
    const existingNames = [...document.querySelectorAll('[data-target-name]')]
        .map(target => target.dataset.targetName.toLocaleLowerCase('id-ID'));
    if (!existingNames.includes(normalizedName)) {
        customTargetNames.push(name);
        localStorage.setItem(targetNamesKey, JSON.stringify(customTargetNames));
        addTargetRow(name);
        saveTargetState();
    }

    input.value = '';
    document.getElementById('target-dialog').close();
});

function updateNotificationStatus() {
    const status = document.getElementById('notification-status');
    const button = document.getElementById('notification-button');

    if (!('Notification' in window)) {
        status.textContent = 'Browser ini belum mendukung notifikasi.';
        button.disabled = true;
    } else if (Notification.permission === 'granted') {
        status.textContent = 'Notifikasi sudah diizinkan.';
        button.textContent = 'Notifikasi aktif';
        button.disabled = true;
    } else if (Notification.permission === 'denied') {
        status.textContent = 'Notifikasi diblokir. Ubah izinnya lewat setelan browser.';
        button.textContent = 'Notifikasi diblokir';
        button.disabled = true;
    } else {
        status.textContent = 'Izin notifikasi belum diberikan.';
        button.textContent = 'Aktifkan notifikasi';
        button.disabled = false;
    }
}

document.getElementById('notification-button').addEventListener('click', async () => {
    if (!('Notification' in window)) return;
    try {
        await Notification.requestPermission();
        updateNotificationStatus();
    } catch {
        document.getElementById('notification-status').textContent =
            'Izin notifikasi tidak berhasil diminta. Periksa setelan browser.';
    }
});

let audioContext;
let feedbackTimeout;

function showFeedback(message) {
    const feedback = document.getElementById('app-feedback');
    feedback.textContent = message;
    feedback.hidden = false;
    clearTimeout(feedbackTimeout);
    feedbackTimeout = setTimeout(() => { feedback.hidden = true; }, 5000);
}

async function playAlarm() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
        document.getElementById('notification-status').textContent = 'Browser ini belum mendukung suara alarm.';
        return;
    }

    audioContext = audioContext || new AudioContextClass();
    await audioContext.resume();

    [0, 0.45, 0.9].forEach(delay => {
        const oscillator = audioContext.createOscillator();
        const volume = audioContext.createGain();
        const startAt = audioContext.currentTime + delay;
        oscillator.frequency.value = 660;
        volume.gain.setValueAtTime(0.001, startAt);
        volume.gain.exponentialRampToValueAtTime(0.18, startAt + 0.03);
        volume.gain.exponentialRampToValueAtTime(0.001, startAt + 0.3);
        oscillator.connect(volume);
        volume.connect(audioContext.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.32);
    });
}

document.getElementById('test-alarm').addEventListener('click', () => {
    playAlarm().catch(() => {
        document.getElementById('notification-status').textContent =
            'Suara tidak dapat diputar. Coba aktifkan suara browser lalu tes lagi.';
    });
});

function checkAlarms() {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    prayerNames.forEach(prayer => {
        if (!alarms[prayer.id].enabled || alarms[prayer.id].time !== currentTime) return;

        const firedKey = `bu-maratus-alarm-${localDateKey(now)}-${prayer.id}`;
        if (localStorage.getItem(firedKey)) return;
        localStorage.setItem(firedKey, 'true');

        playAlarm().catch(() => {
            showFeedback('Suara alarm tidak dapat diputar. Coba tombol Tes suara di setelan alarm.');
        });
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(`Waktunya salat ${prayer.name}`, {
                    body: `Pengingat salat ${prayer.name} pukul ${alarms[prayer.id].time}.`
                });
            } catch {
                showFeedback('Notifikasi tidak dapat ditampilkan. Periksa setelan browser.');
            }
        }
    });
}

document.getElementById('note-preview').textContent = localStorage.getItem('bu-maratus-reading-note')
    ? `Catatan: ${localStorage.getItem('bu-maratus-reading-note')}`
    : '';
document.getElementById('note-preview').hidden = !localStorage.getItem('bu-maratus-reading-note');

renderAlarmSettings();
renderPrayerTimes();
renderDates();
renderTilawahProgress();
updatePrayerProgress();
updateTargetProgress();
updateNextPrayer();
updateNotificationStatus();
checkAlarms();
setInterval(() => {
    updateNextPrayer();
    checkAlarms();
}, 10_000);
