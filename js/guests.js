const refreshBtn = document.getElementById('refreshBtn');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const guestsTable = document.getElementById('guestsTable');
const guestsTableBody = document.getElementById('guestsTableBody');

const statTotal = document.getElementById('statTotal');
const statAttending = document.getElementById('statAttending');
const statNotAttending = document.getElementById('statNotAttending');
const statGuests = document.getElementById('statGuests');

const NOT_ATTENDING_MARKERS = ['келе албайм', 'не смогу', 'не смогу присутствовать'];

function isAttending(attendance) {
    const normalized = attendance.toLowerCase();
    return !NOT_ATTENDING_MARKERS.some((marker) => normalized.includes(marker));
}

function formatDate(timestamp) {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function setLoading(isLoading) {
    loadingState.classList.toggle('hidden', !isLoading);
}

function setError(message) {
    errorState.textContent = message;
    errorState.classList.toggle('hidden', !message);
}

async function fetchGuests() {
    const response = await fetch('/api/guests');

    if (!response.ok) {
        throw new Error('Не удалось загрузить список гостей');
    }

    return response.json();
}

function renderGuests(data) {
    statTotal.textContent = data.total;
    statAttending.textContent = data.attending_count;
    statNotAttending.textContent = data.not_attending_count;
    statGuests.textContent = data.total_guests;

    guestsTableBody.innerHTML = '';

    if (!data.guests.length) {
        emptyState.classList.remove('hidden');
        guestsTable.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    guestsTable.classList.remove('hidden');

    data.guests.forEach((guest, index) => {
        const attending = isAttending(guest.attendance || '');
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${guest.name || '—'}</td>
            <td>
                <span class="badge ${attending ? 'badge-yes' : 'badge-no'}">
                    ${guest.attendance || '—'}
                </span>
            </td>
            <td>${guest.guest_count ?? '—'}</td>
            <td>${formatDate(guest.timestamp)}</td>
        `;

        guestsTableBody.appendChild(row);
    });
}

async function loadGuests() {
    setLoading(true);
    setError('');

    try {
        const data = await fetchGuests();
        renderGuests(data);
    } catch (error) {
        setError(error.message);
    } finally {
        setLoading(false);
    }
}

refreshBtn.addEventListener('click', loadGuests);
loadGuests();
