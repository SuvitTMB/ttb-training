import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, query } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const manualFirebaseConfig = {
    apiKey: "AIzaSyAciknEYhZU7AwOdfYytC1t_AnW2Ee11us",
    authDomain: "faifah-ttb.firebaseapp.com",
    projectId: "faifah-ttb",
    storageBucket: "faifah-ttb.appspot.com",
    messagingSenderId: "842980876200",
    appId: "1:842980876200:web:f33bfad2ccbf263075079d"
};

const config = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : manualFirebaseConfig;
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

const getPath = (colName) => {
    const sandboxId = typeof __app_id !== 'undefined' ? __app_id : null;
    if (sandboxId) return `artifacts/${sandboxId}/public/data/${colName}`;
    return colName;
};

window.appState = {
    MainCourse: [],        // MainCourses and Batches (level 1 & 2)
    MainEmployees: [],     // Centralized Employees Collection (Renamed from Employees)
    MainRegistrations: [], // Centralized Attendee Registrations Mapping (Renamed from CourseRegistrations)
    selectedL1: null,
    user: null,
    attendeeSearchQuery: "",
    attendeeSortKey: "",
    attendeeSortDirection: "asc",
    empLimit: 20,
    empPage: 1,
    attLimit: 20,
    attPage: 1,
    dbLimit: 50,
    dbPage: 1,
    dbStatusFilter: "all",
    dbSortKey: "",
    dbSortDirection: "asc",
    dbView: "table",
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth(),
    activeViewBatchId: null,
    viewSortKey: "index",
    viewSortDirection: "asc"
};

// Custom notification toaster helper
window.showNotification = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-2 fade-in transition-all duration-300 pointer-events-auto bg-white`;
    if (type === 'success') {
        toast.className += ` text-emerald-700 border-emerald-100 bg-emerald-50/90`;
    } else if (type === 'error') {
        toast.className += ` text-rose-700 border-rose-100 bg-rose-50/90`;
    } else {
        toast.className += ` text-blue-700 border-blue-100 bg-blue-50/90`;
    }
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};

window.navigate = (sectionId) => {
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`section-${sectionId}`);
    if (target) target.classList.remove('hidden');
    
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('tab-active');
        b.classList.add('text-stone-500');
    });
    const navBtn = document.getElementById(`nav-${sectionId}`);
    if (navBtn) navBtn.classList.add('tab-active');
    
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
    
    // Render specific components depending on the view
    if (sectionId === 'dashboard') {
        renderDashboard();
    } else if (sectionId === 'employees') {
        renderEmployeesTable();
    } else if (sectionId === 'attendees') {
        populateAttendeeDropdowns();
    }
};

// Real-time synchronization
const startSync = () => {
    const mainCourseRef = collection(db, getPath('MainCourse'));
    const employeesRef = collection(db, getPath('MainEmployees')); // Renamed collection
    const registrationsRef = collection(db, getPath('MainRegistrations')); // Renamed collection
    
    // 1. Sync MainCourse Collection (Rule 2 Compliant)
    onSnapshot(mainCourseRef, (snap) => {
        let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        window.appState.MainCourse = items;
        renderAllTables();
        renderDashboard();
        populateAttendeeDropdowns();
    }, (error) => {
        console.error("MainCourse Firestore sync error:", error);
    });

    // 2. Sync MainEmployees Collection
    onSnapshot(employeesRef, (snap) => {
        let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        window.appState.MainEmployees = items;
        renderEmployeesTable();
        renderDashboard();
        renderAttendeesTable();
    }, (error) => {
        console.error("MainEmployees Firestore sync error:", error);
    });

    // 3. Sync MainRegistrations Mapping
    onSnapshot(registrationsRef, (snap) => {
        let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        window.appState.MainRegistrations = items;
        renderDashboard();
        renderAttendeesTable();
        if (window.appState.activeViewBatchId) {
            openViewModal(window.appState.activeViewBatchId);
        }
    }, (error) => {
        console.error("MainRegistrations Firestore sync error:", error);
    });
};

// Date helper format to display Thai Year BE style
const formatThaiDate = (dateStr) => {
    if (!dateStr) return '-';
    
    // Handle Firestore Timestamp object if passed
    if (typeof dateStr === 'object' && dateStr.toDate) {
        try {
            const jsDate = dateStr.toDate();
            const y = jsDate.getFullYear() + 543;
            const m = jsDate.getMonth() + 1;
            const d = jsDate.getDate();
            return `${d}/${m}/${y}`;
        } catch (e) {}
    }
    
    // Handle generic JS Date instances
    if (dateStr instanceof Date) {
        const y = dateStr.getFullYear() + 543;
        const m = dateStr.getMonth() + 1;
        const d = dateStr.getDate();
        return `${d}/${m}/${y}`;
    }

    const str = String(dateStr);
    const serial = Number(str);
    if (!isNaN(serial) && serial > 30000 && serial < 60000) {
        try {
            const jsDate = new Date((serial - 25569) * 86400 * 1000);
            const y = jsDate.getFullYear() + 543;
            const m = jsDate.getMonth() + 1;
            const d = jsDate.getDate();
            return `${d}/${m}/${y}`;
        } catch (e) {}
    }
    try {
        const parts = str.split('-');
        if (parts.length === 3) {
            const yearBE = parseInt(parts[0]) + 543;
            return `${parts[2]}/${parts[1]}/${yearBE}`;
        }
    } catch (e) {}
    return str;
};

// Date helper format to display Christian Year AD style (e.g. 4/5/2026)
const formatADDate = (dateStr) => {
    if (!dateStr) return '-';
    
    // Handle Firestore Timestamp object if passed
    if (typeof dateStr === 'object' && dateStr.toDate) {
        try {
            const jsDate = dateStr.toDate();
            const y = jsDate.getFullYear();
            const m = jsDate.getMonth() + 1;
            const d = jsDate.getDate();
            return `${d}/${m}/${y}`;
        } catch (e) {}
    }
    
    // Handle generic JS Date instances
    if (dateStr instanceof Date) {
        const y = dateStr.getFullYear();
        const m = dateStr.getMonth() + 1;
        const d = dateStr.getDate();
        return `${d}/${m}/${y}`;
    }

    const str = String(dateStr);
    const serial = Number(str);
    if (!isNaN(serial) && serial > 30000 && serial < 60000) {
        try {
            const jsDate = new Date((serial - 25569) * 86400 * 1000);
            const y = jsDate.getFullYear();
            const m = jsDate.getMonth() + 1;
            const d = jsDate.getDate();
            return `${d}/${m}/${y}`;
        } catch (e) {}
    }
    try {
        const parts = str.split('-');
        if (parts.length === 3) {
            const day = parseInt(parts[2], 10);
            const month = parseInt(parts[1], 10);
            const year = parseInt(parts[0], 10);
            return `${day}/${month}/${year}`;
        }
    } catch (e) {}
    return str;
};

const getStatusCourseLabel = (status) => {
    const s = String(status);
    if (s === '1') return 'ยังไม่อบรม';
    if (s === '2') return 'เช็ครายชื่อ';
    if (s === '3') return 'กำลังจะเริ่ม';
    if (s === '4') return 'อยู่ระหว่างอบรม';
    if (s === '5') return 'อบรมแล้ว';
    if (s === '9') return 'ยกเลิกอบรม';
    return 'ยังไม่อบรม';
};

const getStatusCourseClass = (status) => {
    const s = String(status);
    if (s === '1') return 'bg-stone-100 text-stone-700 border border-stone-200';
    if (s === '2') return 'bg-blue-50 text-blue-700 border border-blue-100';
    if (s === '3') return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
    if (s === '4') return 'bg-amber-50 text-amber-700 border border-amber-100';
    if (s === '5') return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    if (s === '9') return 'bg-rose-50 text-rose-700 border border-rose-100';
    return 'bg-stone-100 text-stone-700 border border-stone-200';
};

// RENDER: DASHBOARD STATS & BATCHES TABLE
const renderDashboard = () => {
    const coursesCount = window.appState.MainCourse.filter(x => Number(x.level) === 1).length;
    const batchesCount = window.appState.MainCourse.filter(x => Number(x.level) === 2).length;
    const employeesCount = window.appState.MainEmployees.length;
    const regCount = window.appState.MainRegistrations.length;

    const dC = document.getElementById('stat-courses');
    const dB = document.getElementById('stat-batches');
    const dE = document.getElementById('stat-employees');
    const dR = document.getElementById('stat-registrations');

    if (dC) dC.innerText = coursesCount || '0';
    if (dB) dB.innerText = batchesCount || '0';
    if (dE) dE.innerText = employeesCount || '0';
    if (dR) dR.innerText = regCount || '0';

    // RENDER BATCHES TABLE IN DASHBOARD
    const tbody = document.getElementById('table-db-batches-body');
    if (!tbody) return;

    // Filter Batches (level 2)
    let batches = window.appState.MainCourse.filter(x => Number(x.level) === 2);

    // Apply sorting
    if (window.appState.dbSortKey) {
        const key = window.appState.dbSortKey;
        const dir = window.appState.dbSortDirection === 'desc' ? -1 : 1;

        const parseNum = (str) => {
            const match = String(str).match(/\d+/);
            return match ? parseInt(match[0], 10) : NaN;
        };

        batches.sort((a, b) => {
            let valA = "";
            let valB = "";

            if (key === 'Course') {
                const numA = parseNum(a.Course);
                const numB = parseNum(b.Course);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return (numA - numB) * dir;
                }
                valA = String(a.Course || "");
                valB = String(b.Course || "");
            } else if (key === 'MainCourse') {
                const parentA = window.appState.MainCourse.find(x => x.id === a.parentId);
                const parentB = window.appState.MainCourse.find(x => x.id === b.parentId);
                valA = parentA ? `${parentA.MainCourse} - ${parentA.CourseName}` : "";
                valB = parentB ? `${parentB.MainCourse} - ${parentB.CourseName}` : "";
            } else if (key === 'TrainingRoom') {
                valA = String(a.TrainingRoom || "");
                valB = String(b.TrainingRoom || "");
            } else if (key === 'StartDate') {
                valA = String(a.StartDate || "");
                valB = String(b.StartDate || "");
            } else if (key === 'EndDate') {
                valA = String(a.EndDate || "");
                valB = String(b.EndDate || "");
            } else if (key === 'empCount') {
                const countA = window.appState.MainRegistrations.filter(r => r.courseID === a.id).length;
                const countB = window.appState.MainRegistrations.filter(r => r.courseID === b.id).length;
                return (countA - countB) * dir;
            } else if (key === 'passedCount') {
                const countA = window.appState.MainRegistrations.filter(r => r.courseID === a.id && r.RegisterPass === 'ผ่านอบรม').length;
                const countB = window.appState.MainRegistrations.filter(r => r.courseID === b.id && r.RegisterPass === 'ผ่านอบรม').length;
                return (countA - countB) * dir;
            }

            return String(valA).localeCompare(String(valB)) * dir;
        });
    } else {
        // Default sort by Course name
        batches.sort((a, b) => String(a.Course || '').localeCompare(String(b.Course || '')));
    }

    // Filter by Status
    const statusFilter = window.appState.dbStatusFilter;
    if (statusFilter && statusFilter !== 'all') {
        batches = batches.filter(b => String(b.StatusCourse) === String(statusFilter));
    }

    // Update sort icons visual indicators on table headers
    const dbSortKeys = ['Course', 'MainCourse', 'TrainingRoom', 'StartDate', 'EndDate', 'empCount', 'passedCount'];
    dbSortKeys.forEach(k => {
        const iconSpan = document.getElementById(`db-sort-icon-${k}`);
        if (iconSpan) {
            if (window.appState.dbSortKey === k) {
                if (window.appState.dbSortDirection === 'asc') {
                    iconSpan.innerHTML = `<i data-lucide="chevron-up" class="w-3.5 h-3.5 text-blue-600 inline ml-1"></i>`;
                } else {
                    iconSpan.innerHTML = `<i data-lucide="chevron-down" class="w-3.5 h-3.5 text-blue-600 inline ml-1"></i>`;
                }
            } else {
                iconSpan.innerHTML = `<i data-lucide="chevrons-up-down" class="w-3.5 h-3.5 text-stone-400 inline ml-1"></i>`;
            }
        }
    });

    // Toggle view elements visibility
    const tableContainer = document.getElementById('db-table-container');
    const calContainer = document.getElementById('db-calendar-container');
    const paginationFooter = document.getElementById('db-pagination-footer');

    const btnTable = document.getElementById('btn-db-view-table');
    const btnCal = document.getElementById('btn-db-view-calendar');

    if (window.appState.dbView === 'calendar') {
        if (tableContainer) tableContainer.classList.add('hidden');
        if (paginationFooter) paginationFooter.classList.add('hidden');
        if (calContainer) calContainer.classList.remove('hidden');

        if (btnTable) {
            btnTable.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold text-stone-500 hover:text-stone-800 transition-all flex items-center gap-1.5";
        }
        if (btnCal) {
            btnCal.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-stone-800 shadow-sm transition-all flex items-center gap-1.5";
        }

        renderCalendarView(batches);
        return; // Skip table rendering
    } else {
        if (tableContainer) tableContainer.classList.remove('hidden');
        if (paginationFooter) paginationFooter.classList.remove('hidden');
        if (calContainer) calContainer.classList.add('hidden');

        if (btnTable) {
            btnTable.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-stone-800 shadow-sm transition-all flex items-center gap-1.5";
        }
        if (btnCal) {
            btnCal.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold text-stone-500 hover:text-stone-800 transition-all flex items-center gap-1.5";
        }
    }

    // Pagination variables
    const totalCount = batches.length;
    const limit = window.appState.dbLimit;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    if (window.appState.dbPage > totalPages) {
        window.appState.dbPage = totalPages;
    }
    const currentPage = window.appState.dbPage;

    // Update pagination labels
    const totalEl = document.getElementById('db-pagination-total');
    if (totalEl) totalEl.innerText = totalCount;

    const currentEl = document.getElementById('db-pagination-current');
    if (currentEl) currentEl.innerText = currentPage;

    const pagesEl = document.getElementById('db-pagination-pages');
    if (pagesEl) pagesEl.innerText = totalPages;

    const limitSelect = document.getElementById('db-pagination-limit');
    if (limitSelect) limitSelect.value = limit;

    const statusSelect = document.getElementById('db-status-filter');
    if (statusSelect) statusSelect.value = statusFilter;

    // Enable/disable navigation buttons
    const prevBtn = document.getElementById('db-pagination-prev');
    if (prevBtn) prevBtn.disabled = currentPage <= 1;

    const nextBtn = document.getElementById('db-pagination-next');
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

    if (totalCount === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-stone-400 italic text-xs">ไม่พบข้อมูลรุ่นการฝึกอบรม</td></tr>`;
        return;
    }

    // Slice for current page
    const startIndex = (currentPage - 1) * limit;
    const slicedBatches = batches.slice(startIndex, startIndex + limit);

    tbody.innerHTML = slicedBatches.map(batch => {
        const parentCourse = window.appState.MainCourse.find(x => x.id === batch.parentId);
        const parentName = parentCourse ? `${parentCourse.MainCourse} - ${parentCourse.CourseName}` : '-';
        const batchRegistrations = window.appState.MainRegistrations.filter(r => r.courseID === batch.id);
        const empCount = batchRegistrations.length;
        const passedCount = batchRegistrations.filter(r => r.RegisterPass === 'ผ่านอบรม').length;

        return `
        <tr class="hover:bg-stone-50/50 transition-colors">
            <td class="text-center py-3 font-semibold text-stone-700 text-xs">${batch.Course || '-'}</td>
            <td class="text-left py-3 font-normal text-stone-900 text-xs pl-3">${parentName}</td>
            <td class="py-3 font-normal text-stone-600 text-left text-xs">${batch.TrainingRoom || '-'}</td>
            <td class="text-center py-3 font-normal text-stone-600 text-xs">${formatThaiDate(batch.StartDate)}</td>
            <td class="text-center py-3 font-normal text-stone-600 text-xs">${formatThaiDate(batch.EndDate)}</td>
            <td class="text-center py-3 font-bold text-stone-700 text-xs">${empCount} คน</td>
            <td class="text-center py-3 font-bold text-emerald-600 text-xs">${passedCount} คน</td>
            <td class="text-center py-3">
                <button onclick="window.openViewModal('${batch.id}')" class="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg mx-auto block" title="ดูรายละเอียดรุ่นการอบรมทั้งหมด">
                    <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
};

// RENDER: DASHBOARD MONTHLY CALENDAR VIEW
const renderCalendarView = (batches) => {
    const year = window.appState.calendarYear;
    const month = window.appState.calendarMonth;

    const monthLabelEl = document.getElementById('calendar-month-year');
    if (!monthLabelEl) return;

    const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    monthLabelEl.innerText = `${thaiMonths[month]} ${year + 543}`;

    const grid = document.getElementById('calendar-days-grid');
    if (!grid) return;

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    let cellsHtml = '';

    const dateToStr = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // 1. Previous month padded days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const d = prevTotalDays - i;
        let prevY = year;
        let prevM = month - 1;
        if (prevM < 0) {
            prevM = 11;
            prevY--;
        }
        const cellDate = dateToStr(prevY, prevM, d);
        cellsHtml += renderDayCell(d, cellDate, false, batches);
    }

    // 2. Current month days
    for (let d = 1; d <= totalDays; d++) {
        const cellDate = dateToStr(year, month, d);
        cellsHtml += renderDayCell(d, cellDate, true, batches);
    }

    // 3. Next month padded days
    const totalCellsSoFar = firstDayIndex + totalDays;
    const totalCellsNeeded = Math.ceil(totalCellsSoFar / 7) * 7;
    const nextDaysNeeded = totalCellsNeeded - totalCellsSoFar;

    for (let d = 1; d <= nextDaysNeeded; d++) {
        let nextY = year;
        let nextM = month + 1;
        if (nextM > 11) {
            nextM = 0;
            nextY++;
        }
        const cellDate = dateToStr(nextY, nextM, d);
        cellsHtml += renderDayCell(d, cellDate, false, batches);
    }

    grid.innerHTML = cellsHtml;

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
};

const renderDayCell = (dayNum, dateStr, isCurrentMonth, batches) => {
    const activeBatches = batches.filter(batch => {
        const start = normalizeDate(batch.StartDate);
        const end = normalizeDate(batch.EndDate);
        return start && end && dateStr >= start && dateStr <= end;
    });

    const bgClass = isCurrentMonth ? 'bg-white' : 'bg-stone-50/50 opacity-60';
    const textClass = isCurrentMonth ? 'text-stone-800 font-medium' : 'text-stone-400 font-normal';

    let eventsHtml = '';
    if (activeBatches.length > 0) {
        eventsHtml = activeBatches.map(batch => {
            const statusLabel = getStatusCourseLabel(batch.StatusCourse);
            const statusClass = getStatusCourseClass(batch.StatusCourse);
            return `
            <div onclick="window.openViewModal('${batch.id}')"
                class="w-full text-left px-1.5 py-0.5 text-[9px] font-bold rounded truncate cursor-pointer transition-all hover:scale-[1.02] border flex items-center justify-between gap-1 shadow-sm ${statusClass}"
                title="${batch.Course} (${statusLabel})">
                <span class="truncate pointer-events-none">รุ่น ${batch.Course}</span>
            </div>
            `;
        }).join('');
    }

    return `
    <div class="min-h-[85px] flex flex-col justify-between p-1.5 ${bgClass} border-b border-r border-stone-200">
        <div class="text-right text-[10px] ${textClass}">${dayNum}</div>
        <div class="flex-1 flex flex-col gap-1 mt-1 overflow-y-auto no-scrollbar max-h-[60px]">
            ${eventsHtml}
        </div>
    </div>
    `;
};

window.prevCalendarMonth = () => {
    window.appState.calendarMonth--;
    if (window.appState.calendarMonth < 0) {
        window.appState.calendarMonth = 11;
        window.appState.calendarYear--;
    }
    renderDashboard();
};

window.nextCalendarMonth = () => {
    window.appState.calendarMonth++;
    if (window.appState.calendarMonth > 11) {
        window.appState.calendarMonth = 0;
        window.appState.calendarYear++;
    }
    renderDashboard();
};

window.setDashboardView = (viewType) => {
    window.appState.dbView = viewType;
    renderDashboard();
};

window.sortDbBatches = (key) => {
    if (window.appState.dbSortKey === key) {
        if (window.appState.dbSortDirection === 'asc') {
            window.appState.dbSortDirection = 'desc';
        } else if (window.appState.dbSortDirection === 'desc') {
            window.appState.dbSortKey = '';
            window.appState.dbSortDirection = 'asc';
        }
    } else {
        window.appState.dbSortKey = key;
        window.appState.dbSortDirection = 'asc';
    }
    window.appState.dbPage = 1;
    renderDashboard();
};

window.onDbStatusFilterChanged = () => {
    const select = document.getElementById('db-status-filter');
    if (select) {
        window.appState.dbStatusFilter = select.value;
    }
    window.appState.dbPage = 1;
    renderDashboard();
};

window.changeDbLimit = () => {
    const select = document.getElementById('db-pagination-limit');
    if (select) {
        window.appState.dbLimit = parseInt(select.value) || 50;
    }
    window.appState.dbPage = 1;
    renderDashboard();
};

window.prevDbPage = () => {
    if (window.appState.dbPage > 1) {
        window.appState.dbPage--;
        renderDashboard();
    }
};

window.nextDbPage = () => {
    window.appState.dbPage++;
    renderDashboard();
};

// RENDER: EMPLOYEES DIRECTORY
window.renderEmployeesTable = (filteredList = null) => {
    const tbody = document.getElementById('table-employees-body');
    if (!tbody) return;

    const listToRender = filteredList || window.appState.MainEmployees;

    // Setup total count
    const totalCount = listToRender.length;
    const totalEl = document.getElementById('emp-pagination-total');
    if (totalEl) totalEl.innerText = totalCount;

    // Pagination calculations
    const limit = window.appState.empLimit;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    
    // Adjust current page if it exceeds total pages
    if (window.appState.empPage > totalPages) {
        window.appState.empPage = totalPages;
    }
    const currentPage = window.appState.empPage;

    // Update pagination labels
    const currentEl = document.getElementById('emp-pagination-current');
    if (currentEl) currentEl.innerText = currentPage;

    const pagesEl = document.getElementById('emp-pagination-pages');
    if (pagesEl) pagesEl.innerText = totalPages;

    // Enable/disable navigation buttons
    const prevBtn = document.getElementById('emp-pagination-prev');
    if (prevBtn) prevBtn.disabled = currentPage <= 1;

    const nextBtn = document.getElementById('emp-pagination-next');
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

    // Sync select limit element value
    const limitSelect = document.getElementById('emp-pagination-limit');
    if (limitSelect) limitSelect.value = limit;

    if (totalCount === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-12 text-stone-400 italic text-xs">ไม่พบข้อมูลพนักงาน</td></tr>`;
        return;
    }

    // Slice for current page
    const startIndex = (currentPage - 1) * limit;
    const slicedList = listToRender.slice(startIndex, startIndex + limit);

    tbody.innerHTML = slicedList.map(emp => {
        return `
        <tr class="hover:bg-stone-50/50 transition-colors">
            <td class="text-center py-3 font-semibold text-stone-700 text-xs">${emp.empID || '-'}</td>
            <td class="py-3 font-normal text-stone-800 text-left pl-3 text-xs">${emp.empName || '-'}</td>
            <td class="py-3 font-normal text-stone-600 text-left text-xs">${emp.empPosition || '-'}</td>
            <td class="py-3 font-normal text-stone-600 text-left text-xs">${emp.empBranch || '-'}</td>
            <td class="text-center py-3 font-normal text-stone-600 text-xs">${emp.empZone || '-'}</td>
            <td class="text-center py-3 font-normal text-stone-600 text-xs">${emp.empRH || '-'}</td>
            <td class="text-center py-3">
                <div class="flex justify-center gap-1">
                    <button onclick="window.openEmployeeModal('${emp.empID}')" class="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg" title="แก้ไขข้อมูลพนักงาน">
                        <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="window.deleteEmployee('${emp.empID}')" class="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="ลบข้อมูลพนักงาน">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
};

window.searchEmployees = () => {
    window.appState.empPage = 1; // Reset to page 1 on new search query
    const searchVal = document.getElementById('employee-search-bar').value.toLowerCase().trim();
    if (!searchVal) {
        renderEmployeesTable();
        return;
    }
    const filtered = window.appState.MainEmployees.filter(emp => 
        String(emp.empID || '').toLowerCase().includes(searchVal) ||
        String(emp.empName || '').toLowerCase().includes(searchVal) ||
        String(emp.empBranch || '').toLowerCase().includes(searchVal) ||
        String(emp.empPosition || '').toLowerCase().includes(searchVal) ||
        String(emp.empRH || '').toLowerCase().includes(searchVal)
    );
    renderEmployeesTable(filtered);
};

// EXCEL EXPORTS & PARSERS: Import Employee details automatically with UTF-8 and Key-Cleaning
window.importEmployeeExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            let workbook;
            if (isCsv) {
                // Read as UTF-8 string to preserve Thai characters correctly
                const text = e.target.result;
                workbook = XLSX.read(text, { type: 'string' });
            } else {
                // Read as Binary/Array for xlsx, xls files
                const data = new Uint8Array(e.target.result);
                workbook = XLSX.read(data, { type: 'array' });
            }

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            if (json.length === 0) {
                showNotification("ไม่พบข้อมูลในไฟล์ Excel/CSV", "error");
                return;
            }

            showNotification("กำลังนำเข้าข้อมูลพนักงาน...", "info");
            let count = 0;

            // Clean and normalize keys helper to avoid spaces, BOM, and casing mismatches
            const getNormalizedVal = (row, searchKeys) => {
                for (const [key, val] of Object.entries(row)) {
                    const norm = String(key)
                        .replace(/^\uFEFF/g, '') // Strip BOM character common in UTF-8 CSV exports
                        .trim()
                        .toLowerCase()
                        .replace(/[\s\-_]+/g, ''); // Clear whitespace, hyphens, and underscores
                    if (searchKeys.includes(norm)) {
                        return String(val || '').trim();
                    }
                }
                return '';
            };

            const processedEmpIDs = new Set();
            for (const row of json) {
                // Dynamically map values regardless of the column header's exact casing/spaces/languages
                const empID = getNormalizedVal(row, ['empid', 'รหัสพนักงาน', 'employeeid', 'id']);
                const empName = getNormalizedVal(row, ['empname', 'ชื่อนามสกุล', 'ชื่อ', 'ชื่อผู้ใช้', 'name']);
                const empPosition = getNormalizedVal(row, ['empposition', 'ตำแหน่ง', 'position']);
                const empBranch = getNormalizedVal(row, ['empbranch', 'สาขา', 'branch']);
                const empZone = getNormalizedVal(row, ['empzone', 'โซน', 'zone']);
                const empRH = getNormalizedVal(row, ['emprh', 'rh', 'ข้อมูลrh', 'hr']);

                if (empID && empName) {
                    if (processedEmpIDs.has(empID)) {
                        continue; // Skip duplicate inside the file
                    }
                    processedEmpIDs.add(empID);

                    const existingEmp = window.appState.MainEmployees.some(emp => emp.empID === empID);
                    if (existingEmp) {
                        continue; // Skip duplicate that already exists in the database
                    }

                    const empData = {
                        empID,
                        empName,
                        empPosition,
                        empBranch,
                        empZone,
                        empRH,
                        updatedAt: serverTimestamp()
                    };
                    // Write directly to MainEmployees collection with empID as document key
                    await setDoc(doc(db, getPath('MainEmployees'), empID), empData);
                    count++;
                }
            }

            showNotification(`นำเข้าพนักงานเรียบร้อย ${count} รายการ`, "success");
            event.target.value = ''; // clear input
        } catch (err) {
            console.error("File Importing Error:", err);
            showNotification("เกิดข้อผิดพลาดในการประมวลผลไฟล์", "error");
        }
    };

    if (isCsv) {
        reader.readAsText(file, 'UTF-8'); // Read CSV with correct Thai encoding
    } else {
        reader.readAsArrayBuffer(file); // Read binary Excel files
    }
};

// MANUAL EMPLOYEE MANAGE DIALOGS
window.openEmployeeModal = (empID = null) => {
    const modal = document.getElementById('employee-modal');
    const title = document.getElementById('employee-modal-title');
    const form = document.getElementById('employee-form');
    
    document.getElementById('emp-edit-mode').value = empID || '';
    form.reset();

    if (empID) {
        title.innerText = "แก้ไขข้อมูลพนักงาน";
        const emp = window.appState.MainEmployees.find(x => x.empID === empID);
        if (emp) {
            document.getElementById('form-empID').value = emp.empID;
            document.getElementById('form-empID').disabled = true; // EmpID remains unique key
            document.getElementById('form-empName').value = emp.empName;
            document.getElementById('form-empPosition').value = emp.empPosition;
            document.getElementById('form-empBranch').value = emp.empBranch;
            document.getElementById('form-empZone').value = emp.empZone;
            document.getElementById('form-empRH').value = emp.empRH || '';
        }
    } else {
        title.innerText = "เพิ่มพนักงานใหม่";
        document.getElementById('form-empID').disabled = false;
    }
    modal.classList.remove('hidden');
};

window.closeEmployeeModal = () => {
    document.getElementById('employee-modal').classList.add('hidden');
};

window.saveEmployee = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const isEdit = document.getElementById('emp-edit-mode').value;
    const empID = isEdit || fd.get('empID').trim();

    const data = {
        empID,
        empName: fd.get('empName').trim(),
        empPosition: fd.get('empPosition').trim(),
        empBranch: fd.get('empBranch').trim(),
        empZone: fd.get('empZone').trim(),
        empRH: fd.get('empRH') ? fd.get('empRH').trim() : '',
        updatedAt: serverTimestamp()
    };

    try {
        await setDoc(doc(db, getPath('MainEmployees'), empID), data);
        showNotification("บันทึกพนักงานเรียบร้อยแล้ว", "success");
        closeEmployeeModal();
    } catch (err) {
        console.error("Save employee error:", err);
        showNotification("บันทึกพนักงานไม่สำเร็จ", "error");
    }
};

window.deleteEmployee = async (empID) => {
    if (confirm(`ยืนยันที่จะลบข้อมูลพนักงานรหัส "${empID}" ใช่หรือไม่?`)) {
        try {
            await deleteDoc(doc(db, getPath('MainEmployees'), empID));
            
            // Cascade: clean registration records for deleted employee
            const matchingRegistrations = window.appState.MainRegistrations.filter(r => r.empID === empID);
            for (const reg of matchingRegistrations) {
                await deleteDoc(doc(db, getPath('MainRegistrations'), reg.id));
            }

            showNotification("ลบพนักงานเรียบร้อยแล้ว", "success");
        } catch (err) {
            console.error("Delete employee error:", err);
            showNotification("ลบข้อมูลไม่สำเร็จ", "error");
        }
    }
};


// ==========================================
// ATTENDEES & COURSE REGISTRATION MODULE (TAB 4)
// ==========================================

const populateAttendeeDropdowns = () => {
    const courseSelect = document.getElementById('attendee-course-select');
    if (!courseSelect) return;

    const selectedCourseId = courseSelect.value;

    // Fill L1 Main courses
    const courses = window.appState.MainCourse.filter(x => Number(x.level) === 1 || !x.parentId);
    courses.sort((a, b) => String(a.MainCourse || '').localeCompare(String(b.MainCourse || '')));

    courseSelect.innerHTML = `<option value="">-- เลือกหลักสูตรหลัก --</option>` + 
        courses.map(c => `<option value="${c.id}" ${c.id === selectedCourseId ? 'selected' : ''}>${c.MainCourse} - ${c.CourseName}</option>`).join('');

    // Batch selection handle
    populateBatchDropdown();
};

const populateBatchDropdown = () => {
    const courseSelect = document.getElementById('attendee-course-select');
    const batchSelect = document.getElementById('attendee-batch-select');
    if (!courseSelect || !batchSelect) return;

    const courseID = courseSelect.value;
    if (!courseID) {
        batchSelect.innerHTML = `<option value="">-- เลือกรุ่นการอบรม --</option>`;
        batchSelect.disabled = true;
        document.getElementById('attendee-list-header').classList.add('hidden');
        renderAttendeesTable();
        return;
    }

    batchSelect.disabled = false;
    const currentSelectedBatch = batchSelect.value;

    // Filter Batches (L2) linked to selected course ID
    const batches = window.appState.MainCourse.filter(x => Number(x.level) === 2 && x.parentId === courseID);
    batches.sort((a, b) => String(a.Course || '').localeCompare(String(b.Course || '')));

    batchSelect.innerHTML = `<option value="">-- เลือกรุ่นการอบรม --</option>` + 
        batches.map(b => `<option value="${b.id}" ${b.id === currentSelectedBatch ? 'selected' : ''}>${b.Course} (${b.TrainingRoom || 'ไม่มีห้องอบรม'})</option>`).join('');
};

window.onAttendeeCourseSelected = () => {
    populateBatchDropdown();
    renderAttendeesTable();
};

window.onAttendeeBatchSelected = () => {
    const batchSelect = document.getElementById('attendee-batch-select');
    const header = document.getElementById('attendee-list-header');
    
    // Reset search and sort state on batch change
    window.appState.attendeeSearchQuery = "";
    window.appState.attendeeSortKey = "";
    window.appState.attendeeSortDirection = "asc";
    window.appState.attPage = 1;
    const searchBar = document.getElementById('attendee-search-bar');
    if (searchBar) searchBar.value = "";

    if (batchSelect && batchSelect.value) {
        header.classList.remove('hidden');
    } else {
        header.classList.add('hidden');
    }
    renderAttendeesTable();
};

// Render attendance table in relation to selection
window.renderAttendeesTable = () => {
    const tbody = document.getElementById('table-attendees-body');
    if (!tbody) return;

    const courseSelect = document.getElementById('attendee-course-select');
    const batchSelect = document.getElementById('attendee-batch-select');
    
    if (!courseSelect || !batchSelect || !courseSelect.value || !batchSelect.value) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-stone-400 italic text-xs">กรุณาเลือกวิชาหลักและรุ่นอบรมเพื่อจัดการข้อมูล</td></tr>`;
        
        const totalEl = document.getElementById('att-pagination-total');
        if (totalEl) totalEl.innerText = '0';
        const currentEl = document.getElementById('att-pagination-current');
        if (currentEl) currentEl.innerText = '1';
        const pagesEl = document.getElementById('att-pagination-pages');
        if (pagesEl) pagesEl.innerText = '1';

        const clearBtn = document.getElementById('btn-clear-attendees');
        if (clearBtn) {
            clearBtn.disabled = true;
            clearBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        return;
    }

    const activeBatchID = batchSelect.value;

    // Filter mappings in MainRegistrations corresponding to active batch
    const registrations = window.appState.MainRegistrations.filter(r => r.courseID === activeBatchID);
    
    // Disable clear button if registrations list is empty
    const clearBtn = document.getElementById('btn-clear-attendees');
    if (clearBtn) {
        if (registrations.length === 0) {
            clearBtn.disabled = true;
            clearBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            clearBtn.disabled = false;
            clearBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
    
    // Apply search filter if active
    let filteredRegs = registrations;
    if (window.appState.attendeeSearchQuery) {
        const queryVal = window.appState.attendeeSearchQuery;
        filteredRegs = registrations.filter(reg => {
            const employee = window.appState.MainEmployees.find(emp => emp.empID === reg.empID);
            const empName = employee ? employee.empName.toLowerCase() : "";
            const empID = String(reg.empID || "").toLowerCase();
            return empID.includes(queryVal) || empName.includes(queryVal);
        });
    }

    // Apply sorting if active
    if (window.appState.attendeeSortKey) {
        const key = window.appState.attendeeSortKey;
        const dir = window.appState.attendeeSortDirection === 'desc' ? -1 : 1;
        
        filteredRegs.sort((a, b) => {
            let valA = "";
            let valB = "";
            
            if (key === 'empID') {
                valA = String(a.empID || "");
                valB = String(b.empID || "");
                const numA = parseInt(valA);
                const numB = parseInt(valB);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return (numA - numB) * dir;
                }
            } else if (key === 'empName') {
                const empA = window.appState.MainEmployees.find(emp => emp.empID === a.empID);
                const empB = window.appState.MainEmployees.find(emp => emp.empID === b.empID);
                valA = empA ? empA.empName : "";
                valB = empB ? empB.empName : "";
            } else if (key === 'room') {
                valA = String(a.room || "0");
                valB = String(b.room || "0");
                const numA = parseInt(valA);
                const numB = parseInt(valB);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return (numA - numB) * dir;
                }
            } else if (key === 'totalDays') {
                valA = Number(a.totalDays || 0);
                valB = Number(b.totalDays || 0);
                return (valA - valB) * dir;
            } else if (key === 'RoomNumber') {
                valA = String(a.RoomNumber || "");
                valB = String(b.RoomNumber || "");
                const numA = parseInt(valA);
                const numB = parseInt(valB);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return (numA - numB) * dir;
                }
            }
            
            return String(valA).localeCompare(String(valB)) * dir;
        });
    }

    // Pagination calculations
    const totalCount = filteredRegs.length;
    const totalEl = document.getElementById('att-pagination-total');
    if (totalEl) totalEl.innerText = totalCount;

    const limit = window.appState.attLimit;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    // Adjust current page if it exceeds total pages
    if (window.appState.attPage > totalPages) {
        window.appState.attPage = totalPages;
    }
    const currentPage = window.appState.attPage;

    // Update pagination labels
    const currentEl = document.getElementById('att-pagination-current');
    if (currentEl) currentEl.innerText = currentPage;

    const pagesEl = document.getElementById('att-pagination-pages');
    if (pagesEl) pagesEl.innerText = totalPages;

    // Enable/disable navigation buttons
    const prevBtn = document.getElementById('att-pagination-prev');
    if (prevBtn) prevBtn.disabled = currentPage <= 1;

    const nextBtn = document.getElementById('att-pagination-next');
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

    // Sync select limit element value
    const limitSelect = document.getElementById('att-pagination-limit');
    if (limitSelect) limitSelect.value = limit;

    const countEl = document.getElementById('attendee-count');
    if (countEl) countEl.innerText = totalCount;

    if (totalCount === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-12 text-stone-400 italic text-xs">ไม่พบพนักงานลงทะเบียนตามเงื่อนไขที่กำหนด</td></tr>`;
        return;
    }

    // Slice for current page
    const startIndex = (currentPage - 1) * limit;
    const slicedRegs = filteredRegs.slice(startIndex, startIndex + limit);

    // Map registration table details matching Employee profile fields
    tbody.innerHTML = slicedRegs.map(reg => {
        const employee = window.appState.MainEmployees.find(emp => emp.empID === reg.empID);
        const empName = employee ? employee.empName : '<span class="text-red-400 italic font-light">ข้อมูลพนักงานไม่พบ</span>';
        const empPosition = employee ? employee.empPosition : '-';
        const empBranch = employee ? employee.empBranch : '-';
        const empZone = employee ? employee.empZone : '-';
        const empRH = employee && employee.empRH ? employee.empRH : '-';

        return `
        <tr class="hover:bg-stone-50/50 transition-colors font-normal">
            <td class="py-3 text-left pl-3 text-xs">
                <div class="font-semibold text-stone-700 leading-tight">${reg.empID || '-'}</div>
                <div class="font-normal text-stone-800 mt-0.5 leading-snug">${empName}</div>
            </td>
            <td class="py-3 text-left text-xs font-normal text-stone-600">
                <div class="leading-tight">${empPosition}</div>
                <div class="text-stone-500 mt-0.5 leading-snug">${empBranch}</div>
            </td>
            <td class="py-3 text-left text-xs font-normal text-stone-600">
                <div class="leading-tight">${empZone}</div>
                <div class="text-stone-500 mt-0.5 leading-snug">${empRH}</div>
            </td>
            <td class="text-center py-3 font-bold text-stone-700 text-xs">
                <span class="px-2.5 py-1 bg-stone-100 rounded-lg">${reg.room || '0'}</span>
            </td>
            <td class="text-center py-3 text-xs text-stone-600">
                <div class="leading-tight">${formatADDate(reg.checkIN)}</div>
                <div class="text-[10px] text-stone-400 mt-0.5">${formatADDate(reg.checkOUT)}</div>
            </td>
            <td class="text-center py-3 text-xs text-stone-600 font-bold text-stone-800">
                ${reg.totalDays || '0'} คืน
            </td>
            <td class="text-center py-3 text-xs text-stone-600 font-semibold text-stone-500">
                ${reg.RoomNumber || '-'}
            </td>
            <td class="text-center py-3">
                <div class="flex justify-center gap-1">
                    <button onclick="window.openEditRegModal('${reg.id}')" class="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg" title="กำหนดพารามิเตอร์วันเช็คอิน/ห้องพัก">
                        <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="window.deleteRegistration('${reg.id}')" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg" title="ถอนชื่อพนักงานออก">
                        <i data-lucide="user-minus" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');

    // Update sort icons visual indicators
    const sortKeys = ['empID', 'empName', 'room', 'totalDays', 'RoomNumber'];
    sortKeys.forEach(k => {
        const iconSpan = document.getElementById(`sort-icon-${k}`);
        if (iconSpan) {
            if (window.appState.attendeeSortKey === k) {
                if (window.appState.attendeeSortDirection === 'asc') {
                    iconSpan.innerHTML = `<i data-lucide="chevron-up" class="w-3.5 h-3.5 text-blue-600 inline ml-1"></i>`;
                } else {
                    iconSpan.innerHTML = `<i data-lucide="chevron-down" class="w-3.5 h-3.5 text-blue-600 inline ml-1"></i>`;
                }
            } else {
                iconSpan.innerHTML = `<i data-lucide="chevrons-up-down" class="w-3.5 h-3.5 text-stone-400 inline ml-1"></i>`;
            }
        }
    });

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
};

// HELPER: Normalize Date string from CSV to YYYY-MM-DD
const normalizeDate = (dateStr) => {
    if (!dateStr) return '';
    
    // Handle Firestore Timestamp object if passed
    if (typeof dateStr === 'object' && dateStr.toDate) {
        try {
            const jsDate = dateStr.toDate();
            const y = jsDate.getFullYear();
            const m = String(jsDate.getMonth() + 1).padStart(2, '0');
            const d = String(jsDate.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        } catch (e) {}
    }
    
    // Handle generic JS Date instances
    if (dateStr instanceof Date) {
        const y = dateStr.getFullYear();
        const m = String(dateStr.getMonth() + 1).padStart(2, '0');
        const d = String(dateStr.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    const str = String(dateStr);
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    
    const serial = Number(str);
    if (!isNaN(serial) && serial > 30000 && serial < 60000) {
        try {
            const jsDate = new Date((serial - 25569) * 86400 * 1000);
            const y = jsDate.getFullYear();
            const m = String(jsDate.getMonth() + 1).padStart(2, '0');
            const d = String(jsDate.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        } catch (e) {}
    }
    
    const parts = str.split('/');
    if (parts.length === 3) {
        let day = parts[0].padStart(2, '0');
        let month = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) {
            year = '20' + year;
        }
        return `${year}-${month}-${day}`;
    }
    
    const partsDash = str.split('-');
    if (partsDash.length === 3 && partsDash[0].length <= 2) {
        let day = partsDash[0].padStart(2, '0');
        let month = partsDash[1].padStart(2, '0');
        let year = partsDash[2];
        if (year.length === 2) {
            year = '20' + year;
        }
        return `${year}-${month}-${day}`;
    }
    
    return str;
};

// Import Attendee Registration data via CSV File Upload
window.importAttendeeCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const activeBatchID = document.getElementById('attendee-batch-select').value;
    if (!activeBatchID) {
        showNotification("กรุณาเลือกหลักสูตรและรุ่นอบรมก่อนนำเข้าข้อมูล", "error");
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target.result;
            const workbook = XLSX.read(text, { type: 'string' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            if (json.length === 0) {
                showNotification("ไม่พบข้อมูลในไฟล์ CSV", "error");
                event.target.value = '';
                return;
            }

            showNotification("กำลังนำเข้าข้อมูลทะเบียนผู้อบรม...", "info");
            let count = 0;

            const getNormalizedVal = (row, searchKeys) => {
                for (const [key, val] of Object.entries(row)) {
                    const norm = String(key)
                        .replace(/^\uFEFF/g, '')
                        .trim()
                        .toLowerCase()
                        .replace(/[\s\-_]+/g, '');
                    if (searchKeys.includes(norm)) {
                        return String(val || '').trim();
                    }
                }
                return '';
            };

            const processedEmpIDs = new Set();
            for (const row of json) {
                const empID = getNormalizedVal(row, ['empid', 'รหัสพนักงาน', 'employeeid', 'id']);
                const room = getNormalizedVal(row, ['room', 'สิทธิ์ห้องพัก', 'ห้องพัก']);
                const RoomNumber = getNormalizedVal(row, ['roomnumber', 'เลขห้อง', 'เลขห้องพัก', 'หมายเลขห้อง']);
                const checkIN = getNormalizedVal(row, ['checkin', 'เช็คอิน', 'วันที่เข้าพัก', 'เริ่ม']);
                const checkOUT = getNormalizedVal(row, ['checkout', 'เช็คเอาท์', 'วันที่ออก', 'สิ้นสุด']);
                const totalDays = getNormalizedVal(row, ['totaldays', 'total', 'รวมวัน', 'จำนวนวัน']);

                if (empID) {
                    if (processedEmpIDs.has(empID)) {
                        continue; // Skip duplicate inside the file
                    }
                    processedEmpIDs.add(empID);

                    // Calculate date difference
                    const checkIN_norm = normalizeDate(checkIN);
                    const checkOUT_norm = normalizeDate(checkOUT);
                    let calculatedTotalDays = parseInt(totalDays) || 0;
                    if (checkIN_norm && checkOUT_norm) {
                        const d1 = new Date(checkIN_norm);
                        const d2 = new Date(checkOUT_norm);
                        const diff = d2 - d1;
                        if (!isNaN(diff) && diff >= 0) {
                            calculatedTotalDays = Math.ceil(diff / (1000 * 60 * 60 * 24)); // nights stayed
                        }
                    }

                    const regData = {
                        courseID: activeBatchID,
                        empID,
                        room: room || '0',
                        RoomNumber: RoomNumber || '',
                        checkIN: checkIN_norm,
                        checkOUT: checkOUT_norm,
                        totalDays: calculatedTotalDays,
                        updatedAt: serverTimestamp()
                    };

                    const existingReg = window.appState.MainRegistrations.find(
                        r => r.courseID === activeBatchID && r.empID === empID
                    );

                    if (existingReg) {
                        await updateDoc(doc(db, getPath('MainRegistrations'), existingReg.id), regData);
                    } else {
                        await addDoc(collection(db, getPath('MainRegistrations')), {
                            ...regData,
                            createdAt: serverTimestamp()
                        });
                    }
                    count++;
                }
            }

            showNotification(`นำเข้าทะเบียนเรียบร้อย ${count} รายการ`, "success");
            event.target.value = ''; // clear input
        } catch (err) {
            console.error("CSV Importing Error:", err);
            showNotification("เกิดข้อผิดพลาดในการประมวลผลไฟล์", "error");
            event.target.value = '';
        }
    };

    reader.readAsText(file, 'UTF-8');
};

window.searchAttendeesList = () => {
    const val = document.getElementById('attendee-search-bar')?.value || "";
    window.appState.attendeeSearchQuery = val.trim().toLowerCase();
    renderAttendeesTable();
};

window.sortAttendees = (key) => {
    if (window.appState.attendeeSortKey === key) {
        if (window.appState.attendeeSortDirection === 'asc') {
            window.appState.attendeeSortDirection = 'desc';
        } else if (window.appState.attendeeSortDirection === 'desc') {
            window.appState.attendeeSortKey = '';
            window.appState.attendeeSortDirection = 'asc';
        }
    } else {
        window.appState.attendeeSortKey = key;
        window.appState.attendeeSortDirection = 'asc';
    }
    renderAttendeesTable();
};

// REGISTER ATTENDEES DIALOG SELECTION
window.openRegistrationModal = () => {
    const modal = document.getElementById('register-search-modal');
    modal.classList.remove('hidden');
    document.getElementById('reg-search-input').value = '';
    searchRegistrationEmployees();
};

window.closeRegistrationModal = () => {
    document.getElementById('register-search-modal').classList.add('hidden');
};

window.searchRegistrationEmployees = () => {
    const queryVal = document.getElementById('reg-search-input').value.toLowerCase().trim();
    const resultsBox = document.getElementById('reg-search-results');
    if (!resultsBox) return;

    const activeBatchID = document.getElementById('attendee-batch-select').value;
    // Get currently registered employee IDs in this batch to prevent duplicates
    const registeredEmpIDs = window.appState.MainRegistrations
        .filter(r => r.courseID === activeBatchID)
        .map(r => r.empID);

    // Filter list matching searches
    const matchedEmployees = window.appState.MainEmployees.filter(emp => {
        const isMatch = !queryVal || 
            String(emp.empID).toLowerCase().includes(queryVal) ||
            String(emp.empName).toLowerCase().includes(queryVal) ||
            String(emp.empBranch).toLowerCase().includes(queryVal);
        return isMatch;
    });

    if (matchedEmployees.length === 0) {
        resultsBox.innerHTML = `<div class="p-6 text-center text-stone-400 italic text-xs">ไม่พบข้อมูลพนักงาน</div>`;
        return;
    }

    resultsBox.innerHTML = matchedEmployees.map(emp => {
        const isAlreadyRegistered = registeredEmpIDs.includes(emp.empID);
        return `
        <div class="p-4 flex justify-between items-center hover:bg-stone-50 transition-colors text-[13px] font-normal">
            <div>
                <div class="font-bold text-stone-800">${emp.empName} <span class="text-xs text-stone-400 font-normal">(${emp.empID})</span></div>
                <div class="text-xs text-stone-500 font-light mt-0.5">${emp.empPosition} · ${emp.empBranch}</div>
            </div>
            ${isAlreadyRegistered 
                ? `<span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">ลงทะเบียนแล้ว</span>`
                : `<button onclick="window.confirmRegisterEmployee('${emp.empID}')" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-all shadow-sm">เลือก</button>`
            }
        </div>
        `;
    }).join('');
};

window.confirmRegisterEmployee = async (empID) => {
    const batchID = document.getElementById('attendee-batch-select').value;
    if (!batchID || !empID) return;

    const regData = {
        courseID: batchID,
        empID: empID,
        room: '0',
        checkIN: '',
        checkOUT: '',
        totalDays: 0,
        createdAt: serverTimestamp()
    };

    try {
        // Store in MainRegistrations collection
        await addDoc(collection(db, getPath('MainRegistrations')), regData);
        showNotification("ลงทะเบียนผู้อบรมสำเร็จ", "success");
        searchRegistrationEmployees(); // refresh selection view list
    } catch (err) {
        console.error("Register attendee error:", err);
        showNotification("ลงทะเบียนไม่สำเร็จ", "error");
    }
};

window.deleteRegistration = async (regID) => {
    if (confirm("ยืนยันที่จะลบข้อมูลทะเบียนผู้เข้าร่วมอบรมนี้ใช่หรือไม่?")) {
        try {
            await deleteDoc(doc(db, getPath('MainRegistrations'), regID));
            showNotification("ถอนการลงทะเบียนสำเร็จ", "success");
        } catch (err) {
            console.error("Delete registration error:", err);
            showNotification("ลบทะเบียนไม่สำเร็จ", "error");
        }
    }
};

window.openClearAttendeesModal = () => {
    const activeBatchID = document.getElementById('attendee-batch-select').value;
    if (!activeBatchID) {
        showNotification("กรุณาเลือกหลักสูตรและรุ่นอบรมก่อนดำเนินการ", "error");
        return;
    }
    document.getElementById('clear-confirm-input').value = '';
    document.getElementById('clear-confirm-btn').disabled = true;
    document.getElementById('clear-confirm-btn').classList.add('opacity-50', 'cursor-not-allowed');
    document.getElementById('clear-attendees-modal').classList.remove('hidden');
};

window.closeClearAttendeesModal = () => {
    document.getElementById('clear-attendees-modal').classList.add('hidden');
};

window.checkClearConfirmText = () => {
    const val = document.getElementById('clear-confirm-input').value;
    const btn = document.getElementById('clear-confirm-btn');
    if (val === 'Confirm') {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    }
};

window.executeClearAttendees = async () => {
    const activeBatchID = document.getElementById('attendee-batch-select').value;
    if (!activeBatchID) return;

    const val = document.getElementById('clear-confirm-input').value;
    if (val !== 'Confirm') return;

    showNotification("กำลังลบผู้อบรมทั้งหมดในรุ่นนี้...", "info");
    
    try {
        const batchRegistrations = window.appState.MainRegistrations.filter(r => r.courseID === activeBatchID);
        let count = 0;
        for (const reg of batchRegistrations) {
            await deleteDoc(doc(db, getPath('MainRegistrations'), reg.id));
            count++;
        }
        showNotification(`ลบข้อมูลผู้อบรมสำเร็จ ทั้งหมด ${count} รายการ`, "success");
        closeClearAttendeesModal();
    } catch (err) {
        console.error("Clear attendees error:", err);
        showNotification("เกิดข้อผิดพลาดในการลบข้อมูล", "error");
    }
};

// EDIT DETAILS REGISTRATION MODAL
window.populateEditRegDropdowns = (selectedCourseId, selectedBatchId) => {
    const courseSelect = document.getElementById('edit-reg-maincourse');
    const batchSelect = document.getElementById('edit-reg-batch');
    if (!courseSelect || !batchSelect) return;

    // Fill L1 Main courses
    const courses = window.appState.MainCourse.filter(x => Number(x.level) === 1 || !x.parentId);
    courses.sort((a, b) => String(a.MainCourse || '').localeCompare(String(b.MainCourse || '')));

    courseSelect.innerHTML = `<option value="">-- เลือกหลักสูตรหลัก --</option>` + 
        courses.map(c => `<option value="${c.id}" ${c.id === selectedCourseId ? 'selected' : ''}>${c.MainCourse} - ${c.CourseName}</option>`).join('');

    populateEditRegBatchDropdown(selectedCourseId, selectedBatchId);
};

window.populateEditRegBatchDropdown = (courseId, selectedBatchId) => {
    const batchSelect = document.getElementById('edit-reg-batch');
    if (!batchSelect) return;

    if (!courseId) {
        batchSelect.innerHTML = `<option value="">-- เลือกรุ่นการอบรม --</option>`;
        batchSelect.disabled = true;
        return;
    }

    batchSelect.disabled = false;
    const batches = window.appState.MainCourse.filter(x => Number(x.level) === 2 && x.parentId === courseId);
    batches.sort((a, b) => String(a.Course || '').localeCompare(String(b.Course || '')));

    batchSelect.innerHTML = `<option value="">-- เลือกรุ่นการอบรม --</option>` + 
        batches.map(b => `<option value="${b.id}" ${b.id === selectedBatchId ? 'selected' : ''}>${b.Course} (${b.TrainingRoom || 'ไม่มีห้องอบรม'})</option>`).join('');
};

window.onEditRegCourseSelected = () => {
    const courseId = document.getElementById('edit-reg-maincourse').value;
    populateEditRegBatchDropdown(courseId, null);
};

window.openEditRegModal = (regID) => {
    const modal = document.getElementById('edit-reg-modal');
    const data = window.appState.MainRegistrations.find(r => r.id === regID);
    if (!data) return;

    const employee = window.appState.MainEmployees.find(e => e.empID === data.empID);
    document.getElementById('edit-reg-id').value = regID;
    document.getElementById('edit-reg-empname').innerText = employee ? `${employee.empName} (${employee.empID})` : data.empID;

    // Resolve course Batch and parent MainCourse
    const batchItem = window.appState.MainCourse.find(x => x.id === data.courseID);
    const parentCourseId = batchItem ? batchItem.parentId : "";

    populateEditRegDropdowns(parentCourseId, data.courseID);

    document.getElementById('reg-room').value = data.room || '0';
    document.getElementById('reg-RoomNumber').value = data.RoomNumber || '';
    document.getElementById('reg-checkIN').value = data.checkIN || '';
    document.getElementById('reg-checkOUT').value = data.checkOUT || '';
    document.getElementById('reg-totalDays').value = data.totalDays || 0;
    document.getElementById('reg-memo').value = data.memo || '';

    modal.classList.remove('hidden');
};

window.closeEditRegModal = () => {
    document.getElementById('edit-reg-modal').classList.add('hidden');
};

window.calculateRegistrationDays = () => {
    const checkIn = document.getElementById('reg-checkIN').value;
    const checkOut = document.getElementById('reg-checkOUT').value;
    const totalField = document.getElementById('reg-totalDays');
    if (checkIn && checkOut && totalField) {
        const d1 = new Date(checkIn);
        const d2 = new Date(checkOut);
        const diff = d2 - d1;
        if (diff >= 0) {
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24)); // nights stayed
            totalField.value = days;
        } else {
            totalField.value = 0;
        }
    }
};

window.saveRegistrationDetails = async (e) => {
    e.preventDefault();
    const regID = document.getElementById('edit-id').value || document.getElementById('edit-reg-id').value;
    const fd = new FormData(e.target);

    // Get original registration to construct change log
    const original = window.appState.MainRegistrations.find(r => r.id === regID);
    if (!original) return;

    const newCourseID = fd.get('courseID') || original.courseID;
    const newRoom = fd.get('room') || '0';
    const newRoomNumber = fd.get('RoomNumber') || '';
    const newCheckIN = fd.get('checkIN') || '';
    const newCheckOUT = fd.get('checkOUT') || '';
    const newTotalDays = parseInt(fd.get('totalDays')) || 0;
    const enteredMemo = fd.get('memo') || '';

    // Check changes to construct the log
    let logEntries = [];
    if (original.courseID !== newCourseID) {
        const oldBatch = window.appState.MainCourse.find(x => x.id === original.courseID);
        const newBatch = window.appState.MainCourse.find(x => x.id === newCourseID);
        const oldName = oldBatch ? oldBatch.Course : original.courseID;
        const newName = newBatch ? newBatch.Course : newCourseID;
        logEntries.push(`ย้ายรุ่นจาก "${oldName}" เป็น "${newName}"`);
    }
    if (original.room !== newRoom) {
        logEntries.push(`สิทธิ์ห้องพักเปลี่ยนจาก "${original.room}" เป็น "${newRoom}"`);
    }
    if (original.RoomNumber !== newRoomNumber) {
        logEntries.push(`เลขห้องเปลี่ยนจาก "${original.RoomNumber || 'ว่าง'}" เป็น "${newRoomNumber || 'ว่าง'}"`);
    }
    if (original.checkIN !== newCheckIN || original.checkOUT !== newCheckOUT) {
        logEntries.push(`วันพักเปลี่ยนจาก [${original.checkIN || 'ว่าง'} - ${original.checkOUT || 'ว่าง'}] เป็น [${newCheckIN || 'ว่าง'} - ${newCheckOUT || 'ว่าง'}]`);
    }
    if (original.totalDays !== newTotalDays) {
        logEntries.push(`จำนวนคืนเปลี่ยนจาก "${original.totalDays || 0} คืน" เป็น "${newTotalDays} คืน"`);
    }

    let finalMemo = enteredMemo;
    if (logEntries.length > 0) {
        const timestamp = new Date().toLocaleString('th-TH');
        const logText = `[${timestamp}] แก้ไข: ${logEntries.join(', ')}`;
        finalMemo = enteredMemo.trim() 
            ? `${enteredMemo.trim()}\n${logText}` 
            : logText;
    }

    const updatedData = {
        courseID: newCourseID,
        room: newRoom,
        RoomNumber: newRoomNumber,
        checkIN: newCheckIN,
        checkOUT: newCheckOUT,
        totalDays: newTotalDays,
        memo: finalMemo,
        updatedAt: serverTimestamp()
    };

    try {
        await updateDoc(doc(db, getPath('MainRegistrations'), regID), updatedData);
        showNotification("ปรับปรุงประวัติทะเบียนสำเร็จ", "success");
        closeEditRegModal();
    } catch (err) {
        console.error("Update registration error:", err);
        showNotification("ปรับปรุงทะเบียนไม่สำเร็จ", "error");
    }
};


// ==========================================
// EXISTING MAINCOURSE & BATCH MANAGER LOGIC
// ==========================================

const renderAllTables = () => {
    renderTable('l1', 1, null);
    renderTable('l2', 2, window.appState.selectedL1);
    
    // Update Add Button State for Level 2 (Course รุ่นที่อบรม)
    const btnL2 = document.getElementById('btn-add-l2');
    if (!btnL2) return;
    
    if (window.appState.selectedL1) {
        btnL2.disabled = false;
        btnL2.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        btnL2.disabled = true;
        btnL2.classList.add('opacity-50', 'cursor-not-allowed');
    }
};

const renderTable = (prefix, level, parentId) => {
    const tbody = document.getElementById(`table-${prefix}-body`);
    if (!tbody) return;

    let items = [];
    if (level === 1) {
        items = window.appState.MainCourse.filter(x => Number(x.level) === 1 || !x.parentId);
        items.sort((a, b) => String(a.MainCourse || '').localeCompare(String(b.MainCourse || '')));
    } else {
        items = window.appState.MainCourse.filter(x => Number(x.level) === 2 && x.parentId === parentId);
        items.sort((a, b) => String(a.Course || '').localeCompare(String(b.Course || '')));
    }

    if (items.length === 0) {
        const colSpan = level === 1 ? 4 : 6;
        tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center py-8 text-stone-400 italic text-xs">ไม่มีข้อมูล</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map((item, idx) => {
        const isSelected = (level === 1 && window.appState.selectedL1 === item.id);
        
        if (level === 1) {
            const statusText = item.CourseStatus || 'เปิดใช้งาน';
            let statusClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
            if (statusText === 'ปิดใช้งาน') {
                statusClass = 'bg-rose-50 text-rose-700 border border-rose-100';
            }
            return `
            <tr onclick="window.selectItem(${level}, '${item.id}')" class="cursor-pointer transition-colors ${isSelected ? 'row-selected' : 'hover:bg-blue-50/30'}">
                <td class="text-left py-3 font-normal text-stone-900 text-xs pl-[5px]">
                    <div class="font-normal text-stone-900 text-left leading-tight">${item.MainCourse || '-'}</div>
                </td>
                <td class="py-3 lvl-1 font-normal text-stone-800 text-left pl-3">
                    <div class="font-normal text-stone-800 text-left leading-snug">${item.CourseName || '-'}</div>
                </td>
                <td class="text-center py-3">
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-medium ${statusClass}">${statusText}</span>
                </td>
                <td class="text-center py-3">
                    <div class="flex justify-center gap-1" onclick="event.stopPropagation()">
                        <button onclick="window.openModal('edit_group', ${level}, '${item.id}')" class="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg" title="แก้ไขข้อมูล">
                            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick="window.openModal('delete_group', ${level}, '${item.id}')" class="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="ลบข้อมูล">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        } else {
            const statusCourseLabel = getStatusCourseLabel(item.StatusCourse);
            const statusCourseClass = getStatusCourseClass(item.StatusCourse);
            
            // Dynamic calculation of registrations
            const batchRegistrations = window.appState.MainRegistrations.filter(r => r.courseID === item.id);
            const empCount = batchRegistrations.length;

            return `
            <tr class="transition-colors hover:bg-blue-50/30 font-normal">
                <td class="py-3 lvl-2 text-stone-700 text-center">
                    <div class="font-normal text-stone-900 mb-1 leading-tight text-center">${item.Course || '-'}</div>
                    <div class="flex items-center justify-center gap-2 text-[10px] text-stone-400">
                        <span class="px-1.5 py-0.5 rounded-full ${statusCourseClass}">${statusCourseLabel}</span>
                    </div>
                </td>
                <td class="py-3 lvl-2 text-stone-600 text-left pl-3">
                    <div class="font-normal text-stone-800 text-left leading-snug font-medium">${item.TrainingRoom || '-'}</div>
                    <div class="text-[11px] text-stone-400 text-left mt-1 leading-snug font-light">${item.CourseTime || '-'}</div>
                </td>
                <td class="text-center py-3 lvl-2 text-stone-600">
                    <div class="font-normal text-stone-700 text-center leading-tight mb-1">${formatThaiDate(item.StartDate)}</div>
                    <div class="font-normal text-stone-400 text-center text-[11px] leading-tight">${formatThaiDate(item.EndDate)}</div>
                </td>
                <td class="text-center py-3 lvl-2 text-stone-700 font-normal">
                    <div class="text-center font-normal">${item.TotalDate || '0'}</div>
                </td>
                <td class="text-center py-3 lvl-2">
                    <div class="font-bold text-stone-700 text-xs text-center">${empCount} คน</div>
                </td>
                <td class="text-center py-3">
                    <div class="flex justify-center gap-1" onclick="event.stopPropagation()">
                        <button onclick="window.openViewModal('${item.id}')" class="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg" title="ดูรายละเอียดรุ่นการอบรมทั้งหมด">
                            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick="window.openModal('edit_group', ${level}, '${item.id}')" class="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg" title="แก้ไขข้อมูล">
                            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick="window.openModal('delete_group', ${level}, '${item.id}')" class="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="ลบข้อมูล">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }
    }).join('');
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
};

window.selectItem = (level, id) => {
    if (level === 1) {
        window.appState.selectedL1 = id;
    }
    renderAllTables();
};

window.openModal = (type, level, id = null) => {
    const modal = document.getElementById('unified-modal');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('form-content');
    const actions = document.getElementById('modal-actions');
    
    const data = id ? window.appState.MainCourse.find(x => x.id === id) : null;
    
    document.getElementById('edit-id').value = id || '';
    document.getElementById('field-level').value = level;
    
    if (!id) {
        if (level === 2) document.getElementById('field-parentId').value = window.appState.selectedL1;
        if (level === 1) document.getElementById('field-parentId').value = "";
    } else {
        document.getElementById('field-parentId').value = data.parentId || "";
    }

    modal.classList.remove('hidden');

    if (type.includes('add') || type.includes('edit')) {
        if (level === 1) {
            title.innerText = id ? `แก้ไขข้อมูล (MainCourse)` : `เพิ่มข้อมูลใหม่ (MainCourse)`;
            content.innerHTML = `
                <div>
                    <label class="block text-[13px] font-normal text-stone-500 uppercase mb-1 ml-1" style="font-size: 13px; font-weight: 400;">Code (MainCourse)</label>
                    <input type="text" name="MainCourse" value="${data?.MainCourse || ''}" class="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-stone-700" style="font-size: 13px; font-weight: 400;" required placeholder="ระบุรหัสหลักสูตรที่นี่ (สามารถพิมพ์ข้อความได้)...">
                </div>
                <div>
                    <label class="block text-[13px] font-normal text-stone-500 uppercase mb-1 ml-1" style="font-size: 13px; font-weight: 400;">ชื่อหลักสูตร (CourseName)</label>
                    <input type="text" name="CourseName" value="${data?.CourseName || ''}" class="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" style="font-size: 13px; font-weight: 400;" required placeholder="ระบุชื่อหลักสูตรที่นี่...">
                </div>
                <div>
                    <label class="block text-[13px] font-normal text-stone-500 uppercase mb-1 ml-1" style="font-size: 13px; font-weight: 400;">สถานะ (CourseStatus)</label>
                    <select name="CourseStatus" class="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" style="font-size: 13px; font-weight: 400;">
                        <option value="เปิดใช้งาน" ${data?.CourseStatus === 'เปิดใช้งาน' ? 'selected' : ''}>เปิดใช้งาน</option>
                        <option value="ปิดใช้งาน" ${data?.CourseStatus === 'ปิดใช้งาน' ? 'selected' : ''}>ปิดใช้งาน</option>
                    </select>
                </div>
            `;
        } else {
            title.innerText = id ? `แก้ไขข้อมูล (Course รุ่นที่อบรม)` : `เพิ่มข้อมูลใหม่ (Course รุ่นที่อบรม)`;
            content.innerHTML = `
                <div>
                    <label class="block text-[13px] font-normal text-stone-500 uppercase mb-1 ml-1" style="font-size: 13px; font-weight: 400;">รุ่นที่ (Course)</label>
                    <input type="text" name="Course" value="${data?.Course || ''}" class="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" style="font-size: 13px; font-weight: 400;" required placeholder="ระบุชื่อรุ่นย่อย เช่น รุ่นที่ 1 ...">
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[13px] font-normal text-stone-500 uppercase mb-1 ml-1" style="font-size: 13px; font-weight: 400;">ห้องอบรม (TrainingRoom)</label>
                        <input type="text" name="TrainingRoom" value="${data?.TrainingRoom || ''}" class="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" style="font-size: 13px; font-weight: 400;" placeholder="ระบุห้องอบรม...">
                    </div>
                    <div>
                        <label class="block text-[13px] font-normal text-stone-500 uppercase mb-1 ml-1" style="font-size: 13px; font-weight: 400;">เวลาอบรม (CourseTime)</label>
                        <input type="text" name="CourseTime" value="${data?.CourseTime || ''}" class="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" style="font-size: 13px; font-weight: 400;" placeholder="ระบุเวลาอบรม เช่น 09:00 - 16:00 น. ...">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[13px] font-normal text-stone-500 uppercase mb-1 ml-1" style="font-size: 13px; font-weight: 400;">วันที่เริ่ม (StartDate)</label>
                        <input type="date" name="StartDate" onchange="window.calculateTotalDays()" value="${data?.StartDate || ''}" class="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" style="font-size: 13px; font-weight: 400;" required>
                    </div>
                    <div>
                        <label class="block text-[13px] font-normal text-stone-500 uppercase mb-1 ml-1" style="font-size: 13px; font-weight: 400;">วันที่สิ้นสุด (EndDate)</label>
                        <input type="date" name="EndDate" onchange="window.calculateTotalDays()" value="${data?.EndDate || ''}" class="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" style="font-size: 13px; font-weight: 400;" required>
                    </div>
                </div>
                <div>
                    <label class="block text-[13px] font-normal text-stone-500 uppercase mb-1 ml-1" style="font-size: 13px; font-weight: 400;">รวมวันอบรม (TotalDate)</label>
                    <input type="number" name="TotalDate" value="${data?.TotalDate || ''}" class="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" style="font-size: 13px; font-weight: 400;" placeholder="ระบบคำนวณให้อัตโนมัติ...">
                </div>
                <div>
                    <label class="block text-[13px] font-normal text-stone-500 uppercase mb-1 ml-1" style="font-size: 13px; font-weight: 400;">สถานะรุ่น (StatusCourse)</label>
                    <select name="StatusCourse" class="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" style="font-size: 13px; font-weight: 400;">
                        <option value="1" ${String(data?.StatusCourse) === '1' ? 'selected' : ''}>1. ยังไม่อบรม</option>
                        <option value="2" ${String(data?.StatusCourse) === '2' ? 'selected' : ''}>2. เช็ครายชื่อ</option>
                        <option value="3" ${String(data?.StatusCourse) === '3' ? 'selected' : ''}>3. กำลังจะเริ่ม</option>
                        <option value="4" ${String(data?.StatusCourse) === '4' ? 'selected' : ''}>4. อยู่ระหว่างอบรม</option>
                        <option value="5" ${String(data?.StatusCourse) === '5' ? 'selected' : ''}>5. อบรมแล้ว</option>
                        <option value="9" ${String(data?.StatusCourse) === '9' ? 'selected' : ''}>9. ยกเลิกอบรม</option>
                    </select>
                </div>
            `;
        }

        actions.innerHTML = `
            <button type="button" onclick="window.closeModal()" class="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-normal text-[13px] hover:bg-stone-200">ยกเลิก</button>
            <button type="submit" class="flex-1 py-3 bg-[#0056ff] text-white rounded-xl font-normal text-[13px] hover:bg-blue-700 shadow-lg">บันทึกข้อมูล</button>
        `;
    } else if (type === 'delete_group') {
        title.innerText = 'ยืนยันการลบ';
        const displayName = level === 1 ? (data?.CourseName || '') : (data?.Course || '');
        content.innerHTML = `
            <div class="text-center py-2 text-[13px] font-normal">
                <div class="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="alert-triangle" class="w-8 h-8"></i>
                </div>
                <p class="text-stone-600">คุณต้องการลบรายการ <span class="font-bold text-stone-800">"${displayName}"</span> ใช่หรือไม่?</p>
                <p class="text-[10px] text-red-400 mt-2 italic">*หากลบ ข้อมูลลูกๆ ที่อยู่ในหมวดทั้งหมดจะถูกลบไปด้วย</p>
            </div>
        `;
        actions.innerHTML = `
            <button type="button" onclick="window.closeModal()" class="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-normal text-[13px]">ยกเลิก</button>
            <button type="button" onclick="window.confirmDelete('${id}')" class="flex-1 py-3 bg-red-500 text-white rounded-xl font-normal text-[13px] hover:bg-red-600">ลบข้อมูล</button>
        `;
    }
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
};

window.closeModal = () => {
    document.getElementById('unified-modal').classList.add('hidden');
    const groupForm = document.getElementById('group-form');
    if (groupForm) {
        groupForm.reset();
    }
};

// VIEW COMPREHENSIVE COURSE BATCH DETAILS IN LIGHTBOX (85%)
window.toggleRegisterPass = async (regID, isChecked) => {
    const status = isChecked ? 'ผ่านอบรม' : 'ไม่ผ่านอบรม';
    try {
        await updateDoc(doc(db, getPath('MainRegistrations'), regID), {
            RegisterPass: status,
            updatedAt: serverTimestamp()
        });
        showNotification(`ปรับปรุงสถานะการอบรมเป็น: ${status}`, "success");
    } catch (err) {
        console.error("Error updating RegisterPass:", err);
        showNotification("ไม่สามารถปรับปรุงสถานะการอบรมได้", "error");
    }
};

window.toggleAllRegisterPass = async (batchId, isChecked) => {
    const status = isChecked ? 'ผ่านอบรม' : 'ไม่ผ่านอบรม';
    const registrations = window.appState.MainRegistrations.filter(r => r.courseID === batchId);
    if (registrations.length === 0) return;

    showNotification(`กำลังปรับปรุงสถานะการอบรมพนักงานทั้งหมด...`, "info");
    
    try {
        for (const reg of registrations) {
            if ((isChecked && reg.RegisterPass !== 'ผ่านอบรม') || (!isChecked && reg.RegisterPass === 'ผ่านอบรม')) {
                await updateDoc(doc(db, getPath('MainRegistrations'), reg.id), {
                    RegisterPass: status,
                    updatedAt: serverTimestamp()
                });
            }
        }
        showNotification(`ปรับปรุงสถานะการอบรมทั้งหมดเป็น: ${status}`, "success");
    } catch (err) {
        console.error("Error toggling all RegisterPass:", err);
        showNotification("ปรับปรุงสถานะไม่สำเร็จบางรายการ", "error");
    }
};

window.downloadViewBatchExcel = (batchId) => {
    const item = window.appState.MainCourse.find(x => x.id === batchId);
    if (!item) return;
    const registrations = window.appState.MainRegistrations.filter(r => r.courseID === batchId);
    
    const rows = registrations.map((reg, idx) => {
        const emp = window.appState.MainEmployees.find(e => e.empID === reg.empID);
        return {
            "ลำดับ": idx + 1,
            "รหัสพนักงาน": reg.empID,
            "ชื่อ-นามสกุล": emp ? emp.empName : "",
            "ตำแหน่ง": emp ? emp.empPosition : "",
            "สาขา": emp ? emp.empBranch : "",
            "เขต": emp ? emp.empZone : "",
            "ภาค (RH)": emp ? emp.empRH : "",
            "เช็คอิน": reg.checkIN || "",
            "เช็คเอาท์": reg.checkOUT || "",
            "จำนวนคืน": reg.totalDays || 0,
            "เลขห้องพัก": reg.RoomNumber || "",
            "การอบรม": reg.RegisterPass || "ไม่ผ่านอบรม",
            "บันทึกประวัติ (Memo)": reg.memo || ""
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "รายชื่อผู้อบรม");
    
    const courseCode = item.Course || "batch";
    const filename = `Attendee_${courseCode}.xlsx`;
    XLSX.writeFile(workbook, filename);
    showNotification("ดาวน์โหลดไฟล์ Excel สำเร็จ", "success");
};

window.sendEmailToBatch = (batchId) => {
    const registrations = window.appState.MainRegistrations.filter(r => r.courseID === batchId);
    if (registrations.length === 0) {
        showNotification("ไม่พบพนักงานในรุ่นนี้", "error");
        return;
    }
    const emails = registrations.map(reg => `${reg.empID.trim()}@ttbbank.com`).join(',');
    window.location.href = `mailto:${emails}`;
};

window.sortViewAttendees = (key) => {
    if (window.appState.viewSortKey === key) {
        if (window.appState.viewSortDirection === 'asc') {
            window.appState.viewSortDirection = 'desc';
        } else {
            window.appState.viewSortKey = 'index';
            window.appState.viewSortDirection = 'asc';
        }
    } else {
        window.appState.viewSortKey = key;
        window.appState.viewSortDirection = 'asc';
    }
    
    if (window.appState.activeViewBatchId) {
        openViewModal(window.appState.activeViewBatchId);
    }
};

const getViewSortIcon = (key) => {
    if (window.appState.viewSortKey === key) {
        if (window.appState.viewSortDirection === 'asc') {
            return `<i data-lucide="chevron-up" class="w-3.5 h-3.5 text-blue-600 inline ml-1"></i>`;
        } else {
            return `<i data-lucide="chevron-down" class="w-3.5 h-3.5 text-blue-600 inline ml-1"></i>`;
        }
    }
    return `<i data-lucide="chevrons-up-down" class="w-3.5 h-3.5 text-stone-400 inline ml-1"></i>`;
};

window.openViewModal = (id) => {
    window.appState.activeViewBatchId = id;
    const modal = document.getElementById('view-modal');
    const content = document.getElementById('view-modal-content');
    const item = window.appState.MainCourse.find(x => x.id === id);
    if (!item) return;

    const parentCourse = window.appState.MainCourse.find(x => x.id === item.parentId);
    const statusCourseLabel = getStatusCourseLabel(item.StatusCourse);
    const statusCourseClass = getStatusCourseClass(item.StatusCourse);
    
    const batchRegistrations = window.appState.MainRegistrations.filter(r => r.courseID === id);
    const empCount = batchRegistrations.length;

    // Apply sorting
    let sortedRegs = [...batchRegistrations];
    if (window.appState.viewSortKey && window.appState.viewSortKey !== 'index') {
        const key = window.appState.viewSortKey;
        const dir = window.appState.viewSortDirection === 'desc' ? -1 : 1;
        
        sortedRegs.sort((a, b) => {
            let valA = "";
            let valB = "";
            
            if (key === 'empID') {
                valA = String(a.empID || "");
                valB = String(b.empID || "");
                const numA = parseInt(valA);
                const numB = parseInt(valB);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return (numA - numB) * dir;
                }
            } else if (key === 'empPosition') {
                const empA = window.appState.MainEmployees.find(emp => emp.empID === a.empID);
                const empB = window.appState.MainEmployees.find(emp => emp.empID === b.empID);
                valA = empA ? empA.empPosition : "";
                valB = empB ? empB.empPosition : "";
            } else if (key === 'empZone') {
                const empA = window.appState.MainEmployees.find(emp => emp.empID === a.empID);
                const empB = window.appState.MainEmployees.find(emp => emp.empID === b.empID);
                valA = empA ? empA.empZone : "";
                valB = empB ? empB.empZone : "";
            } else if (key === 'checkIN') {
                valA = String(a.checkIN || "");
                valB = String(b.checkIN || "");
            } else if (key === 'totalDays') {
                valA = Number(a.totalDays || 0);
                valB = Number(b.totalDays || 0);
                return (valA - valB) * dir;
            } else if (key === 'RoomNumber') {
                valA = String(a.RoomNumber || "");
                valB = String(b.RoomNumber || "");
                const numA = parseInt(valA);
                const numB = parseInt(valB);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return (numA - numB) * dir;
                }
            } else if (key === 'RegisterPass') {
                valA = String(a.RegisterPass || "ไม่ผ่านอบรม");
                valB = String(b.RegisterPass || "ไม่ผ่านอบรม");
            }
            
            return String(valA).localeCompare(String(valB)) * dir;
        });
    }

    const isBatchFinished = String(item.StatusCourse) === '5';
    const allPassed = batchRegistrations.length > 0 && batchRegistrations.every(r => r.RegisterPass === 'ผ่านอบรม');

    content.innerHTML = `
        <!-- Combined Training Details Box -->
        <div class="bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-3 font-normal text-[13px]">
            <div>
                <div class="text-stone-400 mb-0.5">หลักสูตรหลัก (รุ่นที่อบรม)</div>
                <div class="text-stone-800 font-bold text-base">
                    ${parentCourse ? `${parentCourse.MainCourse} - ${parentCourse.CourseName}` : '-'} 
                    <span class="text-indigo-600 font-semibold ml-2">#${item.Course || '-'}</span>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-200/60">
                <div>
                    <div class="text-stone-400 mb-0.5">สถานที่และเวลาอบรม</div>
                    <div class="text-stone-700 font-medium">
                        ห้องอบรม: <span class="text-stone-900 font-bold">${item.TrainingRoom || '-'}</span> · เวลา: <span class="text-stone-900 font-bold">${item.CourseTime || '-'}</span>
                    </div>
                </div>
                <div>
                    <div class="text-stone-400 mb-0.5">ระยะเวลาอบรม</div>
                    <div class="text-stone-700 font-medium">
                        ${formatThaiDate(item.StartDate)} - ${formatThaiDate(item.EndDate)} 
                        <span class="text-stone-500 font-normal ml-1">(รวม ${item.TotalDate || '0'} วัน)</span>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-200/60">
                <div>
                    <div class="text-stone-400 mb-0.5">จำนวนผู้ลงทะเบียนอบรม</div>
                    <div class="text-[#0056ff] font-bold text-base">${empCount} คน</div>
                </div>
                <div>
                    <div class="text-stone-400 mb-0.5">สถานะของรุ่น</div>
                    <div class="mt-1">
                        <span class="px-2.5 py-1 rounded-full text-xs font-medium ${statusCourseClass}">${statusCourseLabel}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-stone-50 p-6 rounded-2xl border border-stone-100 text-[13px] font-normal space-y-4">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div class="text-stone-700 font-bold flex items-center gap-2">
                    <span class="w-2.5 h-5 bg-indigo-500 rounded-full"></span> ข้อมูลผู้ลงทะเบียนอบรมในรุ่นนี้ (${empCount} คน)
                </div>
                <div class="flex gap-2 w-full sm:w-auto">
                    <button onclick="window.downloadViewBatchExcel('${item.id}')"
                        class="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm">
                        <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Download Excel
                    </button>
                    <button onclick="window.sendEmailToBatch('${item.id}')"
                        class="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm">
                        <i data-lucide="mail" class="w-4 h-4"></i> Send Email
                    </button>
                </div>
            </div>
            <div class="overflow-x-auto rounded-xl border border-stone-200 bg-white">
                <table class="w-full table-auto text-xs">
                    <thead>
                        <tr class="bg-stone-100 text-stone-700 select-none">
                            <th class="py-2.5 text-center font-bold px-2 cursor-pointer hover:underline" onclick="window.sortViewAttendees('index')">ลำดับ ${getViewSortIcon('index')}</th>
                            <th class="py-2.5 text-left font-bold px-3 cursor-pointer hover:underline" onclick="window.sortViewAttendees('empID')">รหัส / ชื่อ-นามสกุล ${getViewSortIcon('empID')}</th>
                            <th class="py-2.5 text-left font-bold px-3 cursor-pointer hover:underline" onclick="window.sortViewAttendees('empPosition')">ตำแหน่ง / สาขา ${getViewSortIcon('empPosition')}</th>
                            <th class="py-2.5 text-left font-bold px-3 cursor-pointer hover:underline" onclick="window.sortViewAttendees('empZone')">เขต/ภาค ${getViewSortIcon('empZone')}</th>
                            <th class="py-2.5 text-center font-bold px-3 cursor-pointer hover:underline" onclick="window.sortViewAttendees('checkIN')">เช็คอิน - เช็คเอาท์ ${getViewSortIcon('checkIN')}</th>
                            <th class="py-2.5 text-center font-bold px-2 cursor-pointer hover:underline" onclick="window.sortViewAttendees('totalDays')">จำนวนคืน ${getViewSortIcon('totalDays')}</th>
                            <th class="py-2.5 text-center font-bold px-2 cursor-pointer hover:underline" onclick="window.sortViewAttendees('RoomNumber')">เลขห้อง ${getViewSortIcon('RoomNumber')}</th>
                            <th class="py-2.5 text-center font-bold px-3 cursor-pointer hover:underline" onclick="window.sortViewAttendees('RegisterPass')">การอบรม ${getViewSortIcon('RegisterPass')}</th>
                            <th class="py-2.5 text-center font-bold px-3">
                                <div class="flex items-center justify-center gap-1.5">
                                    <span>จัดการ</span>
                                    <input type="checkbox" 
                                        ${allPassed ? 'checked' : ''} 
                                        ${isBatchFinished ? '' : 'disabled'} 
                                        onchange="window.toggleAllRegisterPass('${item.id}', this.checked)"
                                        class="w-3.5 h-3.5 text-blue-600 bg-stone-50 border-stone-300 rounded focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedRegs.length > 0 ? sortedRegs.map((reg, idx) => {
                            const emp = window.appState.MainEmployees.find(e => e.empID === reg.empID);
                            const empName = emp ? emp.empName : '<span class="text-red-400 italic">ไม่พบข้อมูลพนักงาน</span>';
                            const empPosition = emp ? emp.empPosition : '-';
                            const empBranch = emp ? emp.empBranch : '-';
                            const empZone = emp ? emp.empZone : '-';
                            const empRH = emp ? emp.empRH : '-';
                            
                            const regPass = reg.RegisterPass || 'ไม่ผ่านอบรม';
                            const isPassed = regPass === 'ผ่านอบรม';

                            const passClass = isPassed 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200';

                            return `
                            <tr class="hover:bg-stone-50 transition-colors border-t border-stone-100">
                                <td class="py-3 text-center text-stone-500 font-medium px-2">${idx + 1}</td>
                                <td class="py-3 px-3">
                                    <div class="font-bold text-stone-800">${reg.empID}</div>
                                    <div class="text-stone-600 mt-0.5">${empName}</div>
                                </td>
                                <td class="py-3 px-3 text-stone-600">
                                    <div>${empPosition}</div>
                                    <div class="text-stone-400 text-[10px] mt-0.5">${empBranch}</div>
                                </td>
                                <td class="py-3 px-3 text-stone-600 text-left">
                                    <div class="font-semibold">${empZone}</div>
                                    <div class="text-stone-400 text-[10px] mt-0.5">${empRH}</div>
                                </td>
                                <td class="py-3 text-center px-3 text-stone-600">
                                    <div class="leading-tight">${reg.checkIN ? formatADDate(reg.checkIN) : '-'}</div>
                                    <div class="text-[10px] text-stone-400 mt-0.5">${reg.checkOUT ? formatADDate(reg.checkOUT) : '-'}</div>
                                </td>
                                <td class="py-3 text-center px-2 text-stone-800 font-bold">${reg.totalDays || '0'} คืน</td>
                                <td class="py-3 text-center px-2 text-stone-800 font-semibold">${reg.RoomNumber || '-'}</td>
                                <td class="py-3 text-center px-2">
                                    <span class="px-2.5 py-1 rounded-lg text-xs font-semibold ${passClass}">${regPass}</span>
                                </td>
                                <td class="py-3 text-center px-2">
                                    <input type="checkbox" 
                                        ${isPassed ? 'checked' : ''} 
                                        ${isBatchFinished ? '' : 'disabled'} 
                                        onchange="window.toggleRegisterPass('${reg.id}', this.checked)"
                                        class="w-4 h-4 text-blue-600 bg-stone-50 border-stone-300 rounded focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
                                </td>
                            </tr>
                            `;
                        }).join('') : `<tr><td colspan="9" class="text-center py-8 text-stone-400 italic">ไม่มีข้อมูลผู้ร่วมอบรมในรุ่นนี้</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
};

window.closeViewModal = () => {
    window.appState.activeViewBatchId = null;
    document.getElementById('view-modal').classList.add('hidden');
};

window.saveGroup = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const levelVal = parseInt(fd.get('level'));
    const eid = document.getElementById('edit-id').value;

    if (levelVal === 1) {
        const data = {
            level: 1,
            MainCourse: fd.get('MainCourse'),
            CourseName: fd.get('CourseName'),
            CourseStatus: fd.get('CourseStatus') || 'เปิดใช้งาน',
            parentId: null,
            updatedAt: serverTimestamp()
        };

        try {
            if (eid) {
                await updateDoc(doc(db, getPath('MainCourse'), eid), data);
            } else {
                await addDoc(collection(db, getPath('MainCourse')), { ...data, createdAt: serverTimestamp() });
            }
            showNotification("บันทึกข้อมูลหลักสูตรสำเร็จ", "success");
            closeModal();
        } catch (err) { console.error(err); }
    } else {
        const data = {
            level: 2,
            parentId: fd.get('parentId') || null,
            Course: fd.get('Course'),
            TrainingRoom: fd.get('TrainingRoom') || '',
            CourseTime: fd.get('CourseTime') || '',
            StartDate: fd.get('StartDate') || '',
            EndDate: fd.get('EndDate') || '',
            TotalDate: parseInt(fd.get('TotalDate')) || 0,
            StatusCourse: fd.get('StatusCourse') || '1',
            updatedAt: serverTimestamp()
        };

        try {
            if (eid) {
                await updateDoc(doc(db, getPath('MainCourse'), eid), data);
            } else {
                await addDoc(collection(db, getPath('MainCourse')), { ...data, createdAt: serverTimestamp() });
            }
            showNotification("บันทึกข้อมูลรุ่นสำเร็จ", "success");
            closeModal();
        } catch (err) { console.error(err); }
    }
};

window.confirmDelete = async (id) => {
    const levelVal = parseInt(document.getElementById('field-level').value);
    try {
        if (levelVal === 1) {
            // Delete the main course (Level 1)
            await deleteDoc(doc(db, getPath('MainCourse'), id));
            
            // Cascade delete: delete all associated level 2 children from MainCourse
            const children = window.appState.MainCourse.filter(x => x.parentId === id);
            for (const child of children) {
                await deleteDoc(doc(db, getPath('MainCourse'), child.id));
                
                // Clean registrations for cascading deleted batch
                const batchRegs = window.appState.MainRegistrations.filter(r => r.courseID === child.id);
                for (const reg of batchRegs) {
                    await deleteDoc(doc(db, getPath('MainRegistrations'), reg.id));
                }
            }
            
            if (window.appState.selectedL1 === id) window.appState.selectedL1 = null;
            showNotification("ลบหลักสูตรและข้อมูลรุ่นในหลักสูตรเรียบร้อยแล้ว", "success");
        } else {
            // Delete the level 2 item
            await deleteDoc(doc(db, getPath('MainCourse'), id));
            
            // Clean registrations for deleted batch
            const batchRegs = window.appState.MainRegistrations.filter(r => r.courseID === id);
            for (const reg of batchRegs) {
                await deleteDoc(doc(db, getPath('MainRegistrations'), reg.id));
            }
            showNotification("ลบรุ่นอบรมเรียบร้อยแล้ว", "success");
        }
        closeModal();
    } catch (err) { console.error(err); }
};

// Add calculateTotalDays helper to handle batch date diffs in Level 2 Form
window.calculateTotalDays = () => {
    const startStr = document.querySelector('input[name="StartDate"]')?.value;
    const endStr = document.querySelector('input[name="EndDate"]')?.value;
    const totalField = document.querySelector('input[name="TotalDate"]');
    if (startStr && endStr && totalField) {
        const d1 = new Date(startStr);
        const d2 = new Date(endStr);
        const diff = d2 - d1;
        if (diff >= 0) {
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1; // inclusive
            totalField.value = days;
        } else {
            totalField.value = 0;
        }
    }
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        window.appState.user = user;
        const status = document.getElementById('connection-status');
        status.innerText = "LIVE: SYNC ACTIVE";
        status.classList.replace('text-stone-400', 'text-emerald-500');
        startSync();
    }
});

const init = async () => {
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
        navigate('dashboard'); // Default landing page
    } catch (error) { console.error(error); }
};

// Employee Pagination Helpers
window.changeEmpLimit = () => {
    const val = parseInt(document.getElementById('emp-pagination-limit').value);
    if (!isNaN(val)) {
        window.appState.empLimit = val;
        window.appState.empPage = 1;
        renderEmployeesTable();
    }
};

window.prevEmpPage = () => {
    if (window.appState.empPage > 1) {
        window.appState.empPage--;
        renderEmployeesTable();
    }
};

window.nextEmpPage = () => {
    window.appState.empPage++;
    renderEmployeesTable();
};

// Attendee Pagination Helpers
window.changeAttLimit = () => {
    const val = parseInt(document.getElementById('att-pagination-limit').value);
    if (!isNaN(val)) {
        window.appState.attLimit = val;
        window.appState.attPage = 1;
        renderAttendeesTable();
    }
};

window.prevAttPage = () => {
    if (window.appState.attPage > 1) {
        window.appState.attPage--;
        renderAttendeesTable();
    }
};

window.nextAttPage = () => {
    window.appState.attPage++;
    renderAttendeesTable();
};

// Clear Employees Modal Handlers
window.openClearEmployeesModal = () => {
    document.getElementById('clear-emp-confirm-input').value = '';
    document.getElementById('clear-emp-confirm-btn').disabled = true;
    document.getElementById('clear-emp-confirm-btn').classList.add('opacity-50', 'cursor-not-allowed');
    document.getElementById('clear-employees-modal').classList.remove('hidden');
};

window.closeClearEmployeesModal = () => {
    document.getElementById('clear-employees-modal').classList.add('hidden');
};

window.checkClearEmpConfirmText = () => {
    const val = document.getElementById('clear-emp-confirm-input').value;
    const btn = document.getElementById('clear-emp-confirm-btn');
    if (val === 'Confirm') {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    }
};

window.executeClearEmployees = async () => {
    const val = document.getElementById('clear-emp-confirm-input').value;
    if (val !== 'Confirm') return;

    const btn = document.getElementById('clear-emp-confirm-btn');
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    
    showNotification("กำลังลบพนักงานส่วนกลางทั้งหมด...", "info");

    try {
        let empCount = 0;
        for (const emp of window.appState.MainEmployees) {
            await deleteDoc(doc(db, getPath('MainEmployees'), emp.empID));
            empCount++;
        }

        let regCount = 0;
        for (const reg of window.appState.MainRegistrations) {
            await deleteDoc(doc(db, getPath('MainRegistrations'), reg.id));
            regCount++;
        }

        showNotification(`ลบพนักงาน ${empCount} รายการ และถอนการลงทะเบียน ${regCount} รายการสำเร็จ`, "success");
        closeClearEmployeesModal();
    } catch (err) {
        console.error("Clear employees error:", err);
        showNotification("เกิดข้อผิดพลาดในการลบข้อมูล", "error");
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
} else {
    window.addEventListener('DOMContentLoaded', init);
}
