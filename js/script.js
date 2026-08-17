// Данные на разных языках
const translations = {
    ky: {
        invitedTo: "СИЗ ЧАКЫРАБЫЗ",
        eventName: "Кыз узатуу",
        clickHint: "(басыңыз)",
        invitationHint: "В ВЕЧЕР, НАПОЛНЕННЫЙ СЧАСТЬЕМ — БУДЬТЕ РЯДОМ С НАМИ!",
        brideNameCard: "Адинай",
        eventTypeCard: "КЫЗ УЗАТУУ",
        cardTextLine: "РАЗДЕЛИТЕ С НАМИ ДЕНЬ, НАПОЛНЕННЫЙ СЧАСТЬЕМ!",
        greetingText: "Кымбаттуу туугандар жана кадырлуу коноктор!",
        bodyText: "Сиздерди сүйүктүү кызыбыз Адинайдын\nак жол каалап узатуу тоюна арналган\nсалтанаттуу кечеге келип,\nкубанычыбызга ортоктош болуп,\nкадырлуу коногубуз болууга\nчын жүрөктөн чакырабыз!",
        monthName: "Сентябрь",
        day1: "Дүй", day2: "Ше", day3: "Че", day4: "Жм", day5: "Сй", day6: "Жм", day7: "Ишк",
        eventTime: "16:00",
        locationAddress: "ул. Малдыбаева, 54/1",
        restaurantName: "«АЛА-ТОО»",
        restaurantType: "РЕСТОРАН",
        countdownLabel: "Той алда:",
        daysLabel: "Күн",
        hoursLabel: "Саат",
        minutesLabel: "Минут",
        secondsLabel: "Сек",
        rsvpTitle: "Конок анкетасы :",
        nameLabel: "Сиздин атыңыз:",
        attendanceLabel: "Той жүрмөсүнө келе аласыз бы?",
        option1: "Албетте, келем",
        option2: "Өз аялымды менен келем",
        option3: "Кечирим, келе албайм",
        countLabel: "Адамдардын саны:",
        submitBtn: "жөнөтүү",
        formSuccess: "Рахмат, {name}!",
        formError: "Ката кетти. Кайра аракет кылыңыз.",
        formSelectOption: "Жоопту тандаңыз",
        formSending: "Жөнөтүлүүдө...",
        finalGreeting: "УРМАТ МЕНЕН,",
        brideName: "Адинай",
        groomName: "Болотбек"
    },
    ru: {
        invitedTo: "ВЫ ПРИГЛАШЕНЫ НА",
        eventName: "Кыз узатуу",
        clickHint: "(нажмите)",
        invitationHint: "В ВЕЧЕР, НАПОЛНЕННЫЙ СЧАСТЬЕМ — БУДЬТЕ РЯДОМ С НАМИ!",
        brideNameCard: "Адинай",
        eventTypeCard: "КЫЗ УЗАТУУ",
        cardTextLine: "РАЗДЕЛИТЕ С НАМИ ДЕНЬ, НАПОЛНЕННЫЙ СЧАСТЬЕМ!",
        greetingText: "Дорогие родные и уважаемые гости!",
        bodyText: "От всей души приглашаем вас\nна торжественный вечер, посвящённый\nпроводам нашей любимой дочери Адинай,\nчтобы разделить с нами эту радость\nи стать нашими дорогими гостями!",
        monthName: "Сентябрь",
        day1: "Пн", day2: "Вт", day3: "Ср", day4: "Чт", day5: "Пт", day6: "Сб", day7: "Вс",
        eventTime: "16:00",
        locationAddress: "ул. Малдыбаева, 54/1",
        restaurantName: "«АЛА-ТОО»",
        restaurantType: "РЕСТОРАН",
        countdownLabel: "До торжества:",
        daysLabel: "Дни",
        hoursLabel: "Часы",
        minutesLabel: "Минуты",
        secondsLabel: "Сек",
        rsvpTitle: "Анкета гостя :",
        nameLabel: "Ваше имя:",
        attendanceLabel: "Вы можете прийти на торжество?",
        option1: "Конечно, приду",
        option2: "Буду со своей супругой",
        option3: "К сожалению, не смогу присутствовать",
        countLabel: "Количество людей:",
        submitBtn: "отправить",
        formSuccess: "Спасибо за регистрацию, {name}!",
        formError: "Произошла ошибка. Попробуйте ещё раз.",
        formSelectOption: "Выберите вариант ответа",
        formSending: "Отправка...",
        finalGreeting: "С УВАЖЕНИЕМ,",
        brideName: "Адинай",
        groomName: "Болотбек"
    }
};

// Состояние приложения
let currentLanguage = 'ky';
let currentSection = 0;
const sections = [
    'event-photo',
    'envelope',
    'invitation-card',
    'invitation-text',
    'location-time',
    'rsvp-form',
    'final-envelope'
];

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupFinalEnvelopeReveal();
    startCountdown();
    updateLanguage('ky');
    playBackgroundMusic();
});

// Выбор языка
function setLanguage(lang) {
    currentLanguage = lang;
    const screen = document.getElementById('languageScreen');
    const content = document.getElementById('mainContent');
    
    // Скрываем экран выбора языка
    screen.classList.add('hidden');
    content.classList.remove('hidden');
    
    // Обновляем язык
    updateLanguage(lang);
    
    // Показываем первую секцию
    showSection(0);

    // Запуск музыки при выборе языка (fallback, если autoplay заблокирован)
    playBackgroundMusic();
}

// Обновление языка
function updateLanguage(lang) {
    const t = translations[lang];
    
    // Обновляем все элементы с id из переводов
    Object.keys(t).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.textContent = t[key];
        }
    });
    
    // Обновляем кнопки языков
    document.getElementById('kySwitch').classList.toggle('active', lang === 'ky');
    document.getElementById('ruSwitch').classList.toggle('active', lang === 'ru');

    // Финальный конверт: разные изображения для языков
    const finalEnvelopeImage = document.getElementById('finalEnvelopeImage');
    if (finalEnvelopeImage) {
        finalEnvelopeImage.src = lang === 'ky'
            ? 'screens/image/mail_kg.png'
            : 'screens/image/mail.png';
    }
}

// Показывает конкретную секцию
function showSection(index) {
    if (index < 0 || index >= sections.length) return;
    
    currentSection = index;
    const sectionName = sections[index];
    
    // Скрываем все секции
    sections.forEach(section => {
        const el = document.getElementById(section);
        if (el) {
            el.classList.remove('active');
        }
    });
    
    // Показываем текущую секцию
    const activeSection = document.getElementById(sectionName);
    if (activeSection) {
        activeSection.classList.add('active');
        if (sectionName === 'final-envelope') {
            activeSection.classList.add('in-view');
        }
    }
    
    // Прокручиваем вверх
    window.scrollTo(0, 0);
}

// Открытие конверта
function openEnvelope() {
    showSection(2);
}

// Плавное появление финального конверта при прокрутке
function setupFinalEnvelopeReveal() {
    const section = document.getElementById('final-envelope');
    if (!section) return;

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                section.classList.add('in-view');
                observer.unobserve(section);
            }
        });
    }, { threshold: 0.25 });

    observer.observe(section);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Открытие конверта при клике
    const envelopeSection = document.getElementById('envelope');
    if (envelopeSection) {
        envelopeSection.addEventListener('click', openEnvelope);
    }
    
    // Обработчик прокрутки - отключен для обычной прокрутки страницы
    // setupScrollNavigation();
}

// Навигация через прокрутку
function setupScrollNavigation() {
    let lastScrollTime = 0;
    const scrollDelay = 1200; // задержка между переходами в ms

    window.addEventListener('wheel', function(e) {
        const now = Date.now();
        
        if (now - lastScrollTime < scrollDelay) return;
        
        if (e.deltaY > 0) {
            // Прокрутка вниз
            showSection(currentSection + 1);
            lastScrollTime = now;
        } else if (e.deltaY < 0) {
            // Прокрутка вверх
            showSection(currentSection - 1);
            lastScrollTime = now;
        }
    }, { passive: true });
}

// Таймер обратного отсчета
function startCountdown() {
    const targetDate = new Date('2026-09-13T16:00:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;
        
        if (distance < 0) {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }
    
    // Обновляем сразу
    updateCountdown();
    
    // Обновляем каждую секунду
    setInterval(updateCountdown, 1000);
}

// Открытие карты
function openMap() {
    window.open('https://2gis.kg/bishkek/geo/15763234351161611', '_blank');
}

// Фоновая музыка
const bgMusic = document.getElementById('bgMusic');

function playBackgroundMusic() {
    if (!bgMusic) return;

    bgMusic.play().catch(function() {});
}

// Управление счетчиком гостей
function increaseCount() {
    const input = document.getElementById('guestCount');
    input.value = parseInt(input.value) + 1;
}

function decreaseCount() {
    const input = document.getElementById('guestCount');
    if (input.value > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

// Обработка формы
const form = document.querySelector('.guest-form');
if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const t = translations[currentLanguage];
        const guestName = document.getElementById('guestName').value.trim();
        const guestCount = Math.max(1, parseInt(document.getElementById('guestCount').value, 10) || 1);
        const attendanceInput = form.querySelector('input[name="attendance"]:checked');
        const submitBtn = document.getElementById('submitBtn');

        if (!guestName) {
            alert(t.nameLabel.replace(':', ''));
            return;
        }

        if (!attendanceInput) {
            alert(t.formSelectOption);
            return;
        }

        const attendanceKey = attendanceInput.value;
        const attendanceText = t[attendanceKey];

        submitBtn.disabled = true;
        submitBtn.textContent = t.formSending;

        try {
            const response = await fetch('/api/rsvp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: guestName,
                    attendance: attendanceText,
                    guest_count: guestCount
                })
            });

            if (!response.ok) {
                throw new Error('Request failed');
            }

            alert(t.formSuccess.replace('{name}', guestName));
            form.reset();
            document.getElementById('guestCount').value = '1';
            showSection(6);
        } catch (err) {
            alert(t.formError);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = t.submitBtn;
        }
    });
}
