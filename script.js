document.addEventListener('DOMContentLoaded', () => {
    const subjectList = document.getElementById('subject-list');
    const addSubjectBtn = document.getElementById('add-subject-btn');
    const generateBtn = document.getElementById('generate-btn');
    const resultSection = document.getElementById('result-section');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    // Default dates (Today to Today + 30 days)
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    startDateInput.value = today.toISOString().split('T')[0];
    endDateInput.value = nextMonth.toISOString().split('T')[0];

    // --- 1. Manage Subjects ---
    function createSubjectItem() {
        const div = document.createElement('div');
        div.className = 'subject-item';
        div.innerHTML = `
            <button class="remove-btn">×</button>
            <div class="input-group-row">
                <div class="input-field">
                    <label>과목명</label>
                    <input type="text" class="sub-name" placeholder="예: 수학, 영어">
                </div>
                <div class="input-field">
                    <label>학년/학기</label>
                    <select class="sub-grade">
                        <option value="1-1">1학년 1학기</option>
                        <option value="1-2">1학년 2학기</option>
                        <option value="2-1">2학년 1학기</option>
                        <option value="2-2">2학년 2학기</option>
                        <option value="3-1" selected>3학년 1학기</option>
                        <option value="3-2">3학년 2학기</option>
                        <option value="4-1">4학년 1학기</option>
                        <option value="4-2">4학년 2학기</option>
                        <option value="5-1">5학년 1학기</option>
                        <option value="5-2">5학년 2학기</option>
                        <option value="6-1">6학년 1학기</option>
                        <option value="6-2">6학년 2학기</option>
                    </select>
                </div>
                <div class="input-field">
                    <label>교과서 총 단원 수</label>
                    <input type="number" class="sub-total" value="8" min="1">
                </div>
            </div>
        `;

        div.querySelector('.remove-btn').onclick = () => div.remove();
        return div;
    }

    addSubjectBtn.onclick = () => {
        subjectList.appendChild(createSubjectItem());
    };

    // Initial subject
    subjectList.appendChild(createSubjectItem());

    // --- 2. Generation Logic ---
    generateBtn.onclick = () => {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);

        if (endDate <= startDate) {
            alert('❗ 종료일은 시작일보다 미래여야 해요!');
            return;
        }

        const subjects = [];
        const items = subjectList.querySelectorAll('.subject-item');

        if (items.length === 0) {
            alert('❗ 공부할 과목을 최소 하나는 추가해 주세요!');
            return;
        }

        items.forEach(item => {
            const name = item.querySelector('.sub-name').value || '공부';
            const total = parseInt(item.querySelector('.sub-total').value);
            subjects.push({ name, total });
        });

        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        renderTimetable(subjects);
        renderProgress(startDate, diffDays, subjects);
        renderCalendar(startDate, diffDays, subjects);

        resultSection.style.display = 'block';

        // 캘린더 탭을 기본으로 보여주기
        const calendarBtn = document.querySelector('[data-tab="calendar"]');
        if (calendarBtn) calendarBtn.click();

        resultSection.scrollIntoView({ behavior: 'smooth' });
    };

    // --- 3. Rendering ---
    function renderTimetable(subjects) {
        const grid = document.getElementById('timetable-grid');
        grid.innerHTML = '';
        const days = ['시간', '월', '화', '수', '목', '금', '토', '일'];

        // Headers
        days.forEach(d => {
            const el = document.createElement('div');
            el.className = 'day-header';
            el.textContent = d;
            grid.appendChild(el);
        });

        // Time slots (9am to 4pm for kids)
        for (let time = 9; time <= 16; time++) {
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-cell';
            timeLabel.textContent = `${time}:00`;
            grid.appendChild(timeLabel);

            for (let day = 0; day < 7; day++) {
                const slot = document.createElement('div');
                slot.className = 'schedule-cell';

                // Simple rule: Rotate subjects by day and time
                if (time < 12 && subjects.length > 0) {
                    const subIndex = (day + (time - 9)) % subjects.length;
                    slot.classList.add('active');
                    slot.textContent = subjects[subIndex].name;
                } else if (time === 12) {
                    slot.textContent = '🍱 점심';
                } else if (time > 13 && time < 15 && day < 5) {
                    slot.textContent = '📖 독서/놀이';
                }

                grid.appendChild(slot);
            }
        }
    }

    function renderProgress(startDate, totalDays, subjects) {
        const container = document.getElementById('progress-container');
        container.innerHTML = '';

        for (let i = 0; i < totalDays; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dateStr = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
            const dayName = ['일', '월', '화', '수', '목', '금', '토'][currentDate.getDay()];

            const row = document.createElement('div');
            row.className = 'progress-row';

            // Assign chapters based on distribution
            let studyText = "";
            subjects.forEach(sub => {
                const chaptersPerDay = sub.total / totalDays;
                const startChapter = Math.floor(i * chaptersPerDay) + 1;
                const endChapter = Math.floor((i + 1) * chaptersPerDay);

                if (endChapter >= startChapter) {
                    studyText += `[${sub.name}] ${startChapter}~${endChapter}단원   `;
                } else if (i === totalDays - 1 && sub.total > 0) {
                    // Make sure last chapter is included
                    studyText += `[${sub.name}] 완강/복습`;
                }
            });

            if (!studyText) studyText = "자유 시간 또는 부족한 부분 채우기";

            row.innerHTML = `
                <div class="check-circle"></div>
                <div class="progress-day">${dateStr} (${dayName})</div>
                <div class="progress-details">${studyText}</div>
            `;
            container.appendChild(row);
        }
    }

    function renderCalendar(startDate, totalDays, subjects) {
        const container = document.getElementById('calendar-view');
        container.innerHTML = '';

        const daysHead = ['일', '월', '화', '수', '목', '금', '토'];
        daysHead.forEach(d => {
            const el = document.createElement('div');
            el.className = 'calendar-day-head';
            el.textContent = d;
            container.appendChild(el);
        });

        // Get first day of the month for the start date
        const firstDate = new Date(startDate);
        const startDayOfWeek = firstDate.getDay();

        // Add empty cells for previous days
        for (let i = 0; i < startDayOfWeek; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-cell other-month';
            container.appendChild(empty);
        }

        // Add actual days
        for (let i = 0; i < totalDays; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);

            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            if (currentDate.toDateString() === new Date().toDateString()) {
                cell.classList.add('today');
            }

            const dateLabel = document.createElement('div');
            dateLabel.className = 'calendar-date';
            dateLabel.textContent = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
            cell.appendChild(dateLabel);

            // Calculation logic for current day study
            subjects.forEach(sub => {
                const chaptersPerDay = sub.total / totalDays;
                const startChapter = Math.floor(i * chaptersPerDay) + 1;
                const endChapter = Math.floor((i + 1) * chaptersPerDay);

                if (endChapter >= startChapter) {
                    const tag = document.createElement('div');
                    tag.className = 'calendar-study-tag';
                    tag.textContent = `${sub.name}: ${startChapter}~${endChapter}`;
                    cell.appendChild(tag);
                }
            });

            container.appendChild(cell);
        }
    }

    // --- 4. Tabs Management ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.onclick = () => {
            const target = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(target).classList.add('active');
        };
    });
});
