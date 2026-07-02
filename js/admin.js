(function () {
    const defaultRounds = [
        {
            id: 'round-1',
            name: 'รอบเปิดกิจกรรมเดือนกรกฎาคม',
            details: 'รอบตัวอย่างสำหรับเปิดรับผู้เข้าแข่งขันชุดแรกและทดสอบเมนูที่เปิดใช้งาน',
            registrationCount: 18,
            status: 'on',
        },
        {
            id: 'round-2',
            name: 'รอบฝึกอบรมทีมที่ 2',
            details: 'ใช้สำหรับสาธิตขั้นตอนการลงทะเบียนและตรวจสอบเมนูหลักในระบบ',
            registrationCount: 11,
            status: 'on',
        },
        {
            id: 'round-3',
            name: 'รอบทดสอบก่อนเปิดจริง',
            details: 'รอบสำหรับตรวจสอบข้อมูลก่อนใช้งานจริงและเตรียมความพร้อมของเมนูทั้งหมด',
            registrationCount: 6,
            status: 'off',
        },
    ];

    const defaultPorts = [
        {
            id: 'port-1',
            roundId: 'round-1',
            displayOrder: 1,
            name: 'เมนูประกันสุขภาพ',
            status: 'on',
        },
        {
            id: 'port-2',
            roundId: 'round-1',
            displayOrder: 2,
            name: 'เมนูเงินฝาก',
            status: 'on',
        },
        {
            id: 'port-3',
            roundId: 'round-2',
            displayOrder: 1,
            name: 'เมนูกองทุนตราสารหนี้',
            status: 'off',
        },
    ];

    const defaultSubPorts = [
        {
            id: 'subport-1',
            roundId: 'round-1',
            parentPortId: 'port-1',
            type: 'ประกันสุขภาพแบบมาตรฐาน',
            name: 'Health Basic',
            displayOrder: 1,
            status: 'on',
        },
        {
            id: 'subport-2',
            roundId: 'round-1',
            parentPortId: 'port-1',
            type: 'ประกันสุขภาพแบบพรีเมียม',
            name: 'Health Plus',
            displayOrder: 2,
            status: 'on',
        },
        {
            id: 'subport-3',
            roundId: 'round-1',
            parentPortId: 'port-2',
            type: 'เงินฝากออมทรัพย์',
            name: 'Savings Flex',
            displayOrder: 1,
            status: 'on',
        },
    ];

    const defaultEmployees = [
        {
            id: 'employee-1',
            subPortId: 'subport-1',
            employeeName: 'กิตติพงษ์ แสนดี',
            branch: 'สำนักงานใหญ่',
            department: 'ประกันสุขภาพ',
            status: 'on',
        },
        {
            id: 'employee-2',
            subPortId: 'subport-1',
            employeeName: 'อรทัย ศรีสุข',
            branch: 'กรุงเทพฯ',
            department: 'ประกันสุขภาพ',
            status: 'on',
        },
        {
            id: 'employee-3',
            subPortId: 'subport-2',
            employeeName: 'สุชาติ พรหมมา',
            branch: 'เชียงใหม่',
            department: 'ประกันพรีเมียม',
            status: 'off',
        },
        {
            id: 'employee-4',
            subPortId: 'subport-3',
            employeeName: 'นฤมล พูลสวัสดิ์',
            branch: 'ภูเก็ต',
            department: 'เงินฝาก',
            status: 'on',
        },
    ];

    const defaultProducts = [
        { id: 'product-deposit-1', group: 'Deposit', subGroup: 'Deposit Non_TXN', unit: 'บาท', order: 1 },
        { id: 'product-deposit-2', group: 'Deposit', subGroup: 'FCD', unit: 'บาท', order: 2 },
        { id: 'product-mf-1', group: 'MF', subGroup: 'Debenture', unit: 'บาท', order: 3 },
        { id: 'product-mf-2', group: 'MF', subGroup: 'MF Type_B', unit: 'บาท', order: 4 },
        { id: 'product-mf-3', group: 'MF', subGroup: 'Ultimate GA Series', unit: 'บาท', order: 5 },
        { id: 'product-mf-4', group: 'MF', subGroup: 'MF Type_C', unit: 'บาท', order: 6 },
        { id: 'product-mf-5', group: 'MF', subGroup: 'MF Type_A', unit: 'บาท', order: 7 },
        { id: 'product-mf-6', group: 'MF', subGroup: 'MF Term Fund', unit: 'บาท', order: 8 },
        { id: 'product-sn-1', group: 'SN', subGroup: 'Index Linked Note', unit: 'บาท', order: 9 },
        { id: 'product-sn-2', group: 'SN', subGroup: 'FX Linked Note', unit: 'บาท', order: 10 },
        { id: 'product-sn-3', group: 'SN', subGroup: 'Interest Linked Note', unit: 'บาท', order: 11 },
        { id: 'product-sn-4', group: 'SN', subGroup: 'Equity Linked Note', unit: 'บาท', order: 12 },
        { id: 'product-ba-1', group: 'BA', subGroup: 'BA Life_Saving', unit: 'บาท', order: 13 },
        { id: 'product-ba-2', group: 'BA', subGroup: 'BA Life_Health', unit: 'บาท', order: 14 },
        { id: 'product-ba-3', group: 'BA', subGroup: 'BA Life_Protection', unit: 'บาท', order: 15 },
        { id: 'product-ba-4', group: 'BA', subGroup: 'BA Life_Unit linked', unit: 'บาท', order: 16 },
        { id: 'product-ba-5', group: 'BA', subGroup: 'BA Life_Retirement', unit: 'บาท', order: 17 },
        { id: 'product-cc-1', group: 'Credit card', subGroup: 'ttb reserve', unit: 'บัตร', order: 18 },
        { id: 'product-pf-1', group: 'Portfolio', subGroup: 'Qualified Wealth', unit: 'ราย', order: 19 },
        { id: 'product-pf-2', group: 'Portfolio', subGroup: 'New to Wealth', unit: 'ราย', order: 20 },
        { id: 'product-rel-1', group: 'Relationship', subGroup: 'Customer Relation - Hot/ Super Hot', unit: 'ราย', order: 21 },
    ];

    const state = {
        rounds: defaultRounds.map((round) => ({ ...round })),
        ports: defaultPorts.map((port) => ({ ...port })),
        subPorts: defaultSubPorts.map((subPort) => ({ ...subPort })),
        employees: defaultEmployees.map((employee) => ({ ...employee })),
        products: defaultProducts.map((product) => ({ ...product })),
        selectedRoundId: 'all',
        selectedPortId: '',
        selectedSubPortId: '',
        productsPageSize: 10,
        productsPage: 1,
        productsGroupFilter: 'all',
        users: [],
        portfolioSets: [],
        customerDiagnosis: [],
    };

    const storageKeys = {
        rounds: 'actionplan2026_rounds',
        ports: 'actionplan2026_ports',
        subPorts: 'actionplan2026_sub_ports',
        employees: 'actionplan2026_employees',
        products: 'actionplan2026_products',
        users: 'actionplan2026_plan_user',
        portfolioSets: 'actionplan2026_plan_portfolio',
        customerDiagnosis: 'actionplan2026_plan_customer_diagnosis',
    };

    const firestoreCollections = {
        rounds: 'plan_rounds',
        ports: 'plan_activity_items',
        subPorts: 'plan_activity_sub_items',
        employees: 'plan_activity_sub_employees',
        products: 'plan_products',
        users: 'plan_user',
        portfolioSets: 'plan_portfolio',
        customerDiagnosis: 'plan_customer_diagnosis',
    };

    const firebaseState = {
        db: null,
        ready: false,
    };

    const roundSelectIds = [
        'portsRoundSelect',
        'competitorsRoundSelect',
    ];

    function cloneData(items) {
        return items.map((item) => ({ ...item }));
    }

    function isFirebaseConfigured() {
        return Boolean(window.firebase && window.firebaseConfig && window.firebaseConfig.apiKey);
    }

    function initFirebase() {
        if (!isFirebaseConfigured()) {
            firebaseState.ready = false;
            firebaseState.db = null;
            return;
        }

        try {
            if (!window.firebase.apps.length) {
                window.firebase.initializeApp(window.firebaseConfig);
            }
            firebaseState.db = window.firebase.firestore();
            firebaseState.ready = true;
        } catch (error) {
            firebaseState.db = null;
            firebaseState.ready = false;
        }
    }

    function readCachedData(key, fallback) {
        try {
            const rawValue = window.localStorage.getItem(key);
            if (!rawValue) {
                return cloneData(fallback);
            }

            const parsedValue = JSON.parse(rawValue);
            return Array.isArray(parsedValue) ? parsedValue : cloneData(fallback);
        } catch (error) {
            return cloneData(fallback);
        }
    }

    function writeCachedData(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
        }
    }

    function hydrateLocalFallback() {
        state.rounds = readCachedData(storageKeys.rounds, defaultRounds);
        state.ports = readCachedData(storageKeys.ports, defaultPorts);
        state.subPorts = readCachedData(storageKeys.subPorts, defaultSubPorts);
        state.employees = readCachedData(storageKeys.employees, defaultEmployees);
        state.products = readCachedData(storageKeys.products, defaultProducts);
        state.users = readCachedData(storageKeys.users, []);
        state.portfolioSets = readCachedData(storageKeys.portfolioSets, []);
        state.customerDiagnosis = readCachedData(storageKeys.customerDiagnosis, []);
    }

    function persistLocalSnapshot() {
        writeCachedData(storageKeys.rounds, state.rounds);
        writeCachedData(storageKeys.ports, state.ports);
        writeCachedData(storageKeys.subPorts, state.subPorts);
        writeCachedData(storageKeys.employees, state.employees);
        writeCachedData(storageKeys.products, state.products);
        writeCachedData(storageKeys.users, state.users);
        writeCachedData(storageKeys.portfolioSets, state.portfolioSets);
        writeCachedData(storageKeys.customerDiagnosis, state.customerDiagnosis);
    }

    async function loadFirestoreCollection(collectionName) {
        if (!firebaseState.ready || !firebaseState.db) {
            return [];
        }

        const snapshot = await firebaseState.db.collection(collectionName).get();
        return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
    }

    async function loadCollectionSafe(collectionName, fallback = []) {
        try {
            return await loadFirestoreCollection(collectionName);
        } catch (err) {
            console.warn(`[admin] Failed to load collection ${collectionName}:`, err);
            return readCachedData(collectionName.replace('plan_', 'actionplan2026_'), fallback);
        }
    }

    async function upsertFirestoreDocument(collectionName, documentId, payload) {
        if (!firebaseState.ready || !firebaseState.db) {
            return;
        }

        await firebaseState.db.collection(collectionName).doc(documentId).set({
            ...payload,
            updatedAt: Date.now(),
        }, { merge: true });
    }

    async function deleteFirestoreDocument(collectionName, documentId) {
        if (!firebaseState.ready || !firebaseState.db) {
            return;
        }

        await firebaseState.db.collection(collectionName).doc(documentId).delete();
    }

    async function loadAdminData() {
        if (firebaseState.ready) {
            try {
                const [
                    loadedRounds,
                    loadedPorts,
                    loadedSubPorts,
                    loadedEmployees,
                    loadedUsers,
                    loadedPortfolioSets,
                    loadedCustomerDiagnosis
                ] = await Promise.all([
                    loadCollectionSafe(firestoreCollections.rounds, defaultRounds),
                    loadCollectionSafe(firestoreCollections.ports, defaultPorts),
                    loadCollectionSafe(firestoreCollections.subPorts, defaultSubPorts),
                    loadCollectionSafe(firestoreCollections.employees, defaultEmployees),
                    loadCollectionSafe(firestoreCollections.users, []),
                    loadCollectionSafe(firestoreCollections.portfolioSets, []),
                    loadCollectionSafe(firestoreCollections.customerDiagnosis, []),
                ]);

                state.users = loadedUsers || [];
                state.portfolioSets = loadedPortfolioSets || [];
                state.customerDiagnosis = loadedCustomerDiagnosis || [];

                if (loadedRounds.length || loadedPorts.length || loadedSubPorts.length || loadedEmployees.length) {
                    state.rounds = loadedRounds.length ? loadedRounds : cloneData(defaultRounds);
                    state.ports = loadedPorts.length ? loadedPorts : cloneData(defaultPorts);
                    state.subPorts = loadedSubPorts.length ? loadedSubPorts : cloneData(defaultSubPorts);
                    state.employees = loadedEmployees.length ? loadedEmployees : cloneData(defaultEmployees);
                } else {
                    state.rounds = cloneData(defaultRounds);
                    state.ports = cloneData(defaultPorts);
                    state.subPorts = cloneData(defaultSubPorts);
                    state.employees = cloneData(defaultEmployees);

                    await Promise.all([
                        ...state.rounds.map((round) => upsertFirestoreDocument(firestoreCollections.rounds, round.id, round)),
                        ...state.ports.map((port) => upsertFirestoreDocument(firestoreCollections.ports, port.id, port)),
                        ...state.subPorts.map((subPort) => upsertFirestoreDocument(firestoreCollections.subPorts, subPort.id, subPort)),
                        ...state.employees.map((employee) => upsertFirestoreDocument(firestoreCollections.employees, employee.id, employee)),
                    ]);
                }

                persistLocalSnapshot();
            } catch (error) {
                console.error('[admin] โหลดข้อมูลหลักจาก Firestore ไม่สำเร็จ ใช้ข้อมูลในเครื่องแทน', error);
                hydrateLocalFallback();
            }

            // Products handled in an isolated block so a failure here (e.g. Firestore
            // Rules blocking plan_products) never aborts the collections above, and so
            // the real error is surfaced in the console instead of being swallowed.
            try {
                const loadedProducts = await loadFirestoreCollection(firestoreCollections.products);
                state.products = loadedProducts.length ? loadedProducts : cloneData(defaultProducts);
                if (!loadedProducts.length) {
                    await Promise.all(
                        state.products.map((product) => upsertFirestoreDocument(firestoreCollections.products, product.id, product))
                    );
                }
                writeCachedData(storageKeys.products, state.products);
            } catch (error) {
                console.error('[admin] โหลด/สร้าง plan_products บน Firestore ไม่สำเร็จ — ตรวจสอบ Firestore Security Rules ให้อนุญาตคอลเลกชันนี้ (ตอนนี้ใช้ข้อมูลในเครื่องแทน)', error);
                state.products = readCachedData(storageKeys.products, defaultProducts);
            }
        } else {
            hydrateLocalFallback();
        }

        populateRoundDropdowns();
        const activeRound = state.rounds.find((round) => round.status === 'on') || state.rounds[0] || null;
        syncSelectedRound(activeRound ? activeRound.id : 'all');
        renderRoundsTable();
        renderPortsTable();
        populateProductGroupFilter();
        renderProductsTable();
        registerRealtimeListeners();
    }

    function registerRealtimeListeners() {
        if (!firebaseState.ready || !firebaseState.db) return;

        firebaseState.db.collection(firestoreCollections.users).onSnapshot(snapshot => {
            state.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderCompetitorsTable();
            if (!document.getElementById('competitorDetailsLightbox').classList.contains('hidden')) {
                if (window.activePortfolioUserId) {
                    renderActivePortfolioDetails(window.activePortfolioUserId, window.activePortfolioIndex);
                } else if (window.activeBootcampUserId) {
                    renderActiveBootcampDetails(window.activeBootcampUserId, window.activeBootcampIndex);
                }
            }
        });

        firebaseState.db.collection(firestoreCollections.portfolioSets).onSnapshot(snapshot => {
            state.portfolioSets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderCompetitorsTable();
            if (!document.getElementById('competitorDetailsLightbox').classList.contains('hidden') && window.activePortfolioUserId) {
                renderActivePortfolioDetails(window.activePortfolioUserId, window.activePortfolioIndex);
            }
        });

        firebaseState.db.collection(firestoreCollections.customerDiagnosis).onSnapshot(snapshot => {
            state.customerDiagnosis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderCompetitorsTable();
            if (!document.getElementById('competitorDetailsLightbox').classList.contains('hidden') && window.activeBootcampUserId) {
                renderActiveBootcampDetails(window.activeBootcampUserId, window.activeBootcampIndex);
            }
        });
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function getRoundById(roundId) {
        return state.rounds.find((round) => round.id === roundId) || null;
    }

    function getRoundName(roundId) {
        const round = getRoundById(roundId);
        return round ? round.name : 'ไม่ระบุรอบ';
    }

    function statusBadge(status, onClickAttr = '') {
        const isActive = status === 'on';
        const className = isActive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' + (onClickAttr ? ' cursor-pointer hover:bg-emerald-100' : '')
            : 'bg-slate-100 text-slate-500 border-slate-200' + (onClickAttr ? ' cursor-pointer hover:bg-slate-200' : '');
        const clickHandler = onClickAttr ? `onclick="${onClickAttr}"` : '';
        return `<span ${clickHandler} class="inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold transition-colors ${className}">${isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>`;
    }

    function rowActionButton(className, icon, label, onClick) {
        return `<button type="button" onclick="${onClick}"
            class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition ${className}"
            title="${label}">
            <i class="fa-solid ${icon}"></i>
        </button>`;
    }

    function populateRoundSelect(selectId, includeAllLabel) {
        const select = document.getElementById(selectId);
        if (!select) {
            return;
        }

        const currentValue = select.value || (includeAllLabel ? 'all' : '');
        const placeholder = includeAllLabel
            ? `<option value="all">${includeAllLabel}</option>`
            : '<option value="">-- เลือกรอบกิจกรรม --</option>';

        const options = state.rounds
            .map((round) => `<option value="${round.id}">${escapeHtml(round.name)}</option>`)
            .join('');

        select.innerHTML = placeholder + options;

        if (currentValue && [...select.options].some((option) => option.value === currentValue)) {
            select.value = currentValue;
        } else if (!includeAllLabel && state.rounds.length) {
            select.value = state.rounds[0].id;
        } else if (includeAllLabel) {
            select.value = currentValue === 'all' ? 'all' : 'all';
        }
    }

    function populateRoundDropdowns() {
        roundSelectIds.forEach((selectId) => populateRoundSelect(selectId, selectId === 'controlRoundSelect' ? '-- โหลดข้อมูลรอบ --' : 'แสดงทุกรอบ'));

        const portRoundOptions = state.rounds
            .map((round) => `<option value="${round.id}">${escapeHtml(round.name)}</option>`)
            .join('');

        ['addPortRoundId', 'editPortRoundId'].forEach((selectId) => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">-- เลือกรอบกิจกรรม --</option>' + portRoundOptions;
                if (state.rounds.length) {
                    select.value = select.dataset.defaultRound || state.rounds[0].id;
                }
            }
        });
    }

    function renderRoundsTable() {
        const tableBody = document.getElementById('roundsTableBody');
        const totalCount = document.getElementById('roundsTotalCount');
        if (!tableBody) {
            return;
        }

        if (totalCount) {
            totalCount.textContent = String(state.rounds.length);
        }

        if (!state.rounds.length) {
            tableBody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-slate-400">-- ไม่พบข้อมูลรอบกิจกรรม --</td></tr>';
            return;
        }

        const getUniqueRegistrationCount = (roundId) => {
            if (!state.users || !state.users.length) return 0;
            const names = state.users
                .filter(u => u.roundId === roundId && u.name)
                .map(u => u.name.trim().toLowerCase());
            return new Set(names).size;
        };

        tableBody.innerHTML = state.rounds.map((round, index) => `
            <tr class="hover:bg-slate-50 transition">
                <td class="py-3 px-4 align-top">
                    <div class="font-bold text-slate-900">${escapeHtml(round.name)}</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">ลำดับ ${index + 1}</div>
                </td>
                <td class="py-3 px-4 align-top text-slate-600 font-normal leading-relaxed max-w-[420px]">
                    ${escapeHtml(round.details)}
                </td>
                <td class="py-3 px-4 text-center align-top">
                    <span class="inline-flex items-center justify-center min-w-10 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold text-[11px]">
                        ${getUniqueRegistrationCount(round.id)}
                    </span>
                </td>
                <td class="py-3 px-4 text-center align-top">${statusBadge(round.status, `toggleRoundStatus('${round.id}')`)}</td>
                <td class="py-3 px-4 text-center align-top">
                    <div class="flex items-center justify-center gap-2">
                        ${rowActionButton('text-indigo-600', 'fa-pen-to-square', 'แก้ไขรอบกิจกรรม', `openEditRoundLightbox('${round.id}')`)}
                        ${rowActionButton('text-rose-600', 'fa-trash-can', 'ลบรอบกิจกรรม', `deleteRound('${round.id}')`)}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function renderPortsTable() {
        const tableBody = document.getElementById('portsTableBody');
        if (!tableBody) {
            return;
        }

        const filteredPorts = state.selectedRoundId === 'all'
            ? state.ports
            : state.ports.filter((port) => port.roundId === state.selectedRoundId);

        if (!filteredPorts.some((port) => port.id === state.selectedPortId)) {
            state.selectedPortId = filteredPorts[0] ? filteredPorts[0].id : '';
        }

        if (!filteredPorts.length) {
            tableBody.innerHTML = '<tr><td colspan="4" class="py-6 text-center text-slate-400">-- ไม่พบข้อมูลเมนูที่เปิดใช้งาน --</td></tr>';
            updateSelectedPortContext();
            renderSubPortsTable();
            return;
        }

        tableBody.innerHTML = filteredPorts
            .slice()
            .sort((left, right) => Number(left.displayOrder) - Number(right.displayOrder))
            .map((port, index) => `
                <tr class="hover:bg-slate-50 transition cursor-pointer ${state.selectedPortId === port.id ? 'bg-orange-50 ring-1 ring-inset ring-orange-200' : ''}" onclick="selectMainPort('${port.id}')">
                    <td class="py-3 px-4 text-center align-top">
                        <span class="inline-flex items-center justify-center min-w-9 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px]">
                            ${index + 1}
                        </span>
                    </td>
                    <td class="py-3 px-4 text-left align-top">
                        <div class="font-bold text-slate-900">${escapeHtml(port.name)}</div>
                        <div class="text-[11px] text-slate-500 mt-0.5 font-normal flex flex-wrap gap-x-2 gap-y-0.5">
                            <span>รอบกิจกรรม: ${escapeHtml(getRoundName(port.roundId))}</span>
                            <span class="text-indigo-600 font-semibold">(Template: ${port.template === 'customerDiagnosis' ? 'Customer Diagnosis' : 'Portfolio Planning'})</span>
                        </div>
                    </td>
                    <td class="py-3 px-4 text-center align-top">${statusBadge(port.status)}</td>
                    <td class="py-3 px-4 text-center align-top">
                        <div class="flex items-center justify-center gap-2">
                            ${rowActionButton('text-indigo-600', 'fa-pen-to-square', 'แก้ไขเมนู', `openEditPortLightbox('${port.id}')`)}
                            ${rowActionButton('text-rose-600', 'fa-trash-can', 'ลบเมนู', `deletePort('${port.id}')`)}
                        </div>
                    </td>
                </tr>
            `).join('');

        updateSelectedPortContext();
        renderSubPortsTable();
    }

    function getFilteredPortsForSelectedRound() {
        return (state.selectedRoundId === 'all'
            ? state.ports
            : state.ports.filter((port) => port.roundId === state.selectedRoundId))
            .slice()
            .sort((left, right) => Number(left.displayOrder) - Number(right.displayOrder));
    }

    function getSelectedPort() {
        return state.ports.find((port) => port.id === state.selectedPortId)
            || getFilteredPortsForSelectedRound()[0]
            || null;
    }

    function getSelectedSubPort() {
        const selectedPort = getSelectedPort();
        const subPorts = state.subPorts
            .filter((subPort) => selectedPort && subPort.parentPortId === selectedPort.id)
            .slice()
            .sort((left, right) => Number(left.displayOrder) - Number(right.displayOrder));

        return state.subPorts.find((subPort) => subPort.id === state.selectedSubPortId && selectedPort && subPort.parentPortId === selectedPort.id)
            || subPorts[0]
            || null;
    }

    function updateSelectedPortContext() {
        const selectedPort = getSelectedPort();
        const title = document.getElementById('selectedPortTitle');

        if (selectedPort) {
            state.selectedPortId = selectedPort.id;
            if (title) {
                title.textContent = `เมนูย่อยของ: ${selectedPort.name}`;
            }
        } else if (title) {
            title.textContent = 'กรุณาเลือกพอร์ตหลักฝั่งซ้าย';
        }
    }

    function renderSubPortsTable() {
        const tableBody = document.getElementById('subPortsTableBody');
        if (!tableBody) {
            return;
        }

        const selectedPort = getSelectedPort();
        const actionButtons = document.getElementById('subPortActionButtons');
        const uploadArea = document.getElementById('subPortExcelUploadArea');

        if (actionButtons) {
            actionButtons.classList.toggle('hidden', !selectedPort);
        }

        if (uploadArea && !selectedPort) {
            uploadArea.classList.add('hidden');
        }

        if (!selectedPort) {
            tableBody.innerHTML = '<tr><td colspan="3" class="py-6 text-center text-slate-400">-- กรุณาเลือกพอร์ตหลัก --</td></tr>';
            state.selectedSubPortId = '';
            updateSelectedSubPortContext();
            renderEmployeesTable();
            return;
        }

        const filteredSubPorts = state.subPorts
            .filter((subPort) => subPort.parentPortId === selectedPort.id)
            .slice()
            .sort((left, right) => Number(left.displayOrder) - Number(right.displayOrder));

        if (!filteredSubPorts.some((subPort) => subPort.id === state.selectedSubPortId)) {
            state.selectedSubPortId = filteredSubPorts[0] ? filteredSubPorts[0].id : '';
        }

        if (!filteredSubPorts.length) {
            tableBody.innerHTML = '<tr><td colspan="3" class="py-6 text-center text-slate-400">-- ยังไม่มีพอร์ตย่อยในหมวดนี้ --</td></tr>';
            updateSelectedSubPortContext();
            renderEmployeesTable();
            return;
        }

        tableBody.innerHTML = filteredSubPorts.map((subPort, index) => `
            <tr class="hover:bg-slate-50 transition cursor-pointer ${state.selectedSubPortId === subPort.id ? 'bg-orange-50 ring-1 ring-inset ring-orange-200' : ''}" onclick="selectSubPort('${subPort.id}')">
                <td class="py-2.5 px-4 align-top">
                    <div class="font-bold text-slate-900">${escapeHtml(subPort.type)}</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">ลำดับ ${index + 1}</div>
                </td>
                <td class="py-2.5 px-4 align-top text-slate-700 font-normal">${escapeHtml(subPort.name)}</td>
                <td class="py-2.5 px-4 text-center align-top">
                    <div class="flex items-center justify-center gap-2">
                        ${rowActionButton('text-indigo-600', 'fa-pen-to-square', 'แก้ไขพอร์ตย่อย', `openEditSubPortLightbox('${subPort.id}')`)}
                        ${rowActionButton('text-rose-600', 'fa-trash-can', 'ลบพอร์ตย่อย', `deleteSubPort('${subPort.id}')`)}
                    </div>
                </td>
            </tr>
        `).join('');

        updateSelectedSubPortContext();
        renderEmployeesTable();
    }

    function updateSelectedSubPortContext() {
        const selectedSubPort = getSelectedSubPort();
        const selectedSubPortTitle = document.getElementById('selectedSubPortTitle');
        const selectedEmployeeSubPortTitle = document.getElementById('selectedEmployeeSubPortTitle');

        if (selectedSubPort) {
            if (selectedSubPortTitle) {
                selectedSubPortTitle.textContent = selectedSubPort.name;
            }
            if (selectedEmployeeSubPortTitle) {
                selectedEmployeeSubPortTitle.textContent = selectedSubPort.type;
            }
        } else {
            if (selectedSubPortTitle) {
                selectedSubPortTitle.textContent = '--';
            }
            if (selectedEmployeeSubPortTitle) {
                selectedEmployeeSubPortTitle.textContent = '--';
            }
        }
    }

    function renderEmployeesTable() {
        const tableBody = document.getElementById('employeesTableBody');
        if (!tableBody) {
            return;
        }

        const selectedSubPort = getSelectedSubPort();
        if (!selectedSubPort) {
            tableBody.innerHTML = '<tr><td colspan="4" class="py-6 text-center text-slate-400">-- กรุณาเลือกพอร์ตย่อยเพื่อดูข้อมูลพนักงาน --</td></tr>';
            return;
        }

        const employees = state.employees
            .filter((employee) => employee.subPortId === selectedSubPort.id)
            .slice()
            .sort((left, right) => String(left.employeeName).localeCompare(String(right.employeeName), 'th'));

        if (!employees.length) {
            tableBody.innerHTML = '<tr><td colspan="4" class="py-6 text-center text-slate-400">-- ยังไม่มีข้อมูลพนักงานในพอร์ตย่อยนี้ --</td></tr>';
            return;
        }

        tableBody.innerHTML = employees.map((employee, index) => `
            <tr class="hover:bg-slate-50 transition">
                <td class="py-2.5 px-4 text-center align-top">
                    <span class="inline-flex items-center justify-center min-w-9 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px]">
                        ${index + 1}
                    </span>
                </td>
                <td class="py-2.5 px-4 align-top font-bold text-slate-900">${escapeHtml(employee.employeeName)}</td>
                <td class="py-2.5 px-4 align-top text-slate-700 font-normal">${escapeHtml(employee.branch)}</td>
                <td class="py-2.5 px-4 align-top text-center">${statusBadge(employee.status)}</td>
            </tr>
        `).join('');
    }

    function syncSelectedRound(value) {
        state.selectedRoundId = value || 'all';
        roundSelectIds.forEach((selectId) => {
            const select = document.getElementById(selectId);
            if (select) {
                select.value = state.selectedRoundId;
            }
        });
        renderPortsTable();
        renderCompetitorsTable();
    }

    function selectMainPort(portId) {
        state.selectedPortId = portId;
        state.selectedSubPortId = '';
        const selectedPort = state.ports.find((port) => port.id === portId) || null;
        if (selectedPort) {
            state.selectedRoundId = selectedPort.roundId;
            const portsRoundSelect = document.getElementById('portsRoundSelect');
            if (portsRoundSelect) {
                portsRoundSelect.value = selectedPort.roundId;
            }
        }
        renderPortsTable();
    }

    function selectSubPort(subPortId) {
        state.selectedSubPortId = subPortId;
        renderSubPortsTable();
    }

    function changePortsRound(value) {
        syncSelectedRound(value);
    }

    function switchTab(tabName) {
        const tabIds = ['rounds', 'ports', 'competitors'];
        tabIds.forEach((tabId) => {
            const content = document.getElementById(`tab-content-${tabId}`);
            const button = document.getElementById(`tabBtn-${tabId}`);
            const isActive = tabId === tabName;

            if (content) {
                content.classList.toggle('hidden', !isActive);
            }

            if (button) {
                button.classList.toggle('border-indigo-600', isActive);
                button.classList.toggle('text-indigo-600', isActive);
                button.classList.toggle('border-transparent', !isActive);
                button.classList.toggle('text-slate-500', !isActive);
                button.classList.toggle('font-bold', isActive);
                button.classList.toggle('font-semibold', !isActive);
            }
        });

        if (tabName === 'ports') {
            const activeRound = state.rounds.find((round) => round.status === 'on') || state.rounds[0] || null;
            if (activeRound && (state.selectedRoundId === 'all' || !getRoundById(state.selectedRoundId))) {
                state.selectedRoundId = activeRound.id;
                const portsRoundSelect = document.getElementById('portsRoundSelect');
                if (portsRoundSelect) {
                    portsRoundSelect.value = activeRound.id;
                }
                renderPortsTable();
            }
        } else if (tabName === 'competitors') {
            renderCompetitorsTable();
        }
    }

    function openRoundLightboxForAdd() {
        const lightbox = document.getElementById('roundLightbox');
        const title = document.getElementById('roundLightboxTitle');
        const icon = document.getElementById('roundLightboxIcon');

        document.getElementById('roundEditId').value = '';
        document.getElementById('roundName').value = '';
        document.getElementById('roundDetails').value = '';
        document.getElementById('roundRegistrationCount').value = '0';
        document.getElementById('roundStatus').value = 'on';

        if (title) {
            title.textContent = 'เพิ่มรอบกิจกรรมใหม่';
        }

        if (icon) {
            icon.className = 'fa-solid fa-calendar-plus';
        }

        if (lightbox) {
            lightbox.classList.remove('hidden');
        }
    }

    function openEditRoundLightbox(roundId) {
        const round = getRoundById(roundId);
        if (!round) {
            return;
        }

        const lightbox = document.getElementById('roundLightbox');
        const title = document.getElementById('roundLightboxTitle');
        const icon = document.getElementById('roundLightboxIcon');

        document.getElementById('roundEditId').value = round.id;
        document.getElementById('roundName').value = round.name;
        document.getElementById('roundDetails').value = round.details;
        document.getElementById('roundRegistrationCount').value = round.registrationCount;
        document.getElementById('roundStatus').value = round.status;

        if (title) {
            title.textContent = 'แก้ไขข้อมูลรอบกิจกรรม';
        }

        if (icon) {
            icon.className = 'fa-solid fa-calendar-days';
        }

        if (lightbox) {
            lightbox.classList.remove('hidden');
        }
    }

    function closeRoundLightbox() {
        const lightbox = document.getElementById('roundLightbox');
        if (lightbox) {
            lightbox.classList.add('hidden');
        }
    }

    function saveRound() {
        const roundId = document.getElementById('roundEditId').value;
        const payload = {
            name: document.getElementById('roundName').value.trim(),
            details: document.getElementById('roundDetails').value.trim(),
            registrationCount: Number(document.getElementById('roundRegistrationCount').value || 0),
            status: document.getElementById('roundStatus').value,
        };

        if (!payload.name) {
            return;
        }

        if (roundId) {
            const roundIndex = state.rounds.findIndex((round) => round.id === roundId);
            if (roundIndex > -1) {
                state.rounds[roundIndex] = { ...state.rounds[roundIndex], ...payload };
                void upsertFirestoreDocument(firestoreCollections.rounds, roundId, state.rounds[roundIndex]);
            }
        } else {
            const newRound = {
                id: `round-${Date.now()}`,
                ...payload,
            };
            state.rounds.unshift({
                ...newRound,
            });
            void upsertFirestoreDocument(firestoreCollections.rounds, newRound.id, newRound);
        }

        persistLocalSnapshot();
        populateRoundDropdowns();
        renderRoundsTable();
        renderPortsTable();
        closeRoundLightbox();
    }

    function deleteRound(roundId) {
        const relatedPorts = state.ports.filter((port) => port.roundId === roundId);
        const relatedSubPorts = state.subPorts.filter((subPort) => subPort.roundId === roundId);
        state.rounds = state.rounds.filter((round) => round.id !== roundId);
        state.ports = state.ports.filter((port) => port.roundId !== roundId);
        state.subPorts = state.subPorts.filter((subPort) => subPort.roundId !== roundId);
        void deleteFirestoreDocument(firestoreCollections.rounds, roundId);
        relatedPorts.forEach((port) => void deleteFirestoreDocument(firestoreCollections.ports, port.id));
        relatedSubPorts.forEach((subPort) => void deleteFirestoreDocument(firestoreCollections.subPorts, subPort.id));

        if (!state.rounds.length) {
            state.selectedRoundId = 'all';
        } else if (!state.rounds.some((round) => round.id === state.selectedRoundId)) {
            state.selectedRoundId = 'all';
        }

        persistLocalSnapshot();
        populateRoundDropdowns();
        syncSelectedRound(state.selectedRoundId);
        renderRoundsTable();
    }

    async function toggleRoundStatus(roundId) {
        const round = getRoundById(roundId);
        if (!round) return;

        const newStatus = round.status === 'on' ? 'off' : 'on';

        if (newStatus === 'on') {
            // Disable all other active rounds
            for (let r of state.rounds) {
                if (r.id !== roundId && r.status === 'on') {
                    r.status = 'off';
                    await upsertFirestoreDocument(firestoreCollections.rounds, r.id, r);
                }
            }
        }

        round.status = newStatus;
        await upsertFirestoreDocument(firestoreCollections.rounds, roundId, round);

        persistLocalSnapshot();
        populateRoundDropdowns();
        renderRoundsTable();
        renderPortsTable();
    }

    function getDefaultPortRoundId() {
        return state.selectedRoundId !== 'all' && getRoundById(state.selectedRoundId)
            ? state.selectedRoundId
            : (state.rounds[0] ? state.rounds[0].id : '');
    }

    function openAddPortLightbox() {
        const lightbox = document.getElementById('addPortLightbox');
        document.getElementById('addPortRoundId').value = getDefaultPortRoundId();
        document.getElementById('addPortDisplayOrder').value = String((state.ports.length || 0) + 1);
        document.getElementById('addPortName').value = '';
        document.getElementById('addPortTemplate').value = 'portfolioPlanning';
        document.getElementById('addPortStatus').value = 'on';

        if (lightbox) {
            lightbox.classList.remove('hidden');
        }
    }

    function closeAddPortLightbox() {
        const lightbox = document.getElementById('addPortLightbox');
        if (lightbox) {
            lightbox.classList.add('hidden');
        }
    }

    function openEditPortLightbox(portId) {
        const port = state.ports.find((item) => item.id === portId);
        if (!port) {
            return;
        }

        document.getElementById('editPortId').value = port.id;
        document.getElementById('editPortRoundId').value = port.roundId;
        document.getElementById('editPortDisplayOrder').value = port.displayOrder;
        document.getElementById('editPortName').value = port.name;
        document.getElementById('editPortTemplate').value = port.template || (
            (port.name === 'Customer Diagnosis' || port.name === 'Account Planning Bootcamp') 
            ? 'customerDiagnosis' 
            : 'portfolioPlanning'
        );
        document.getElementById('editPortStatus').value = port.status;

        const lightbox = document.getElementById('editPortLightbox');
        if (lightbox) {
            lightbox.classList.remove('hidden');
        }
    }

    function closeEditPortLightbox() {
        const lightbox = document.getElementById('editPortLightbox');
        if (lightbox) {
            lightbox.classList.add('hidden');
        }
    }

    function savePort() {
        const newPort = {
            id: `port-${Date.now()}`,
            roundId: document.getElementById('addPortRoundId').value || getDefaultPortRoundId(),
            displayOrder: Number(document.getElementById('addPortDisplayOrder').value || 1),
            name: document.getElementById('addPortName').value.trim(),
            template: document.getElementById('addPortTemplate').value,
            status: document.getElementById('addPortStatus').value,
        };

        if (!newPort.name) {
            return;
        }

        state.ports.unshift({ ...newPort });
        void upsertFirestoreDocument(firestoreCollections.ports, newPort.id, newPort);

        persistLocalSnapshot();
        renderPortsTable();
        closeAddPortLightbox();
    }

    function savePortEdit() {
        const portId = document.getElementById('editPortId').value;
        const payload = {
            roundId: document.getElementById('editPortRoundId').value || getDefaultPortRoundId(),
            displayOrder: Number(document.getElementById('editPortDisplayOrder').value || 1),
            name: document.getElementById('editPortName').value.trim(),
            template: document.getElementById('editPortTemplate').value,
            status: document.getElementById('editPortStatus').value,
        };

        if (!payload.name || !portId) {
            return;
        }

        const portIndex = state.ports.findIndex((item) => item.id === portId);
        if (portIndex > -1) {
            state.ports[portIndex] = { ...state.ports[portIndex], ...payload };
            void upsertFirestoreDocument(firestoreCollections.ports, portId, state.ports[portIndex]);
        }

        persistLocalSnapshot();
        renderPortsTable();
        closeEditPortLightbox();
    }

    function deletePort(portId) {
        const relatedSubPorts = state.subPorts.filter((subPort) => subPort.parentPortId === portId);
        state.ports = state.ports.filter((port) => port.id !== portId);
        state.subPorts = state.subPorts.filter((subPort) => subPort.parentPortId !== portId);
        void deleteFirestoreDocument(firestoreCollections.ports, portId);
        relatedSubPorts.forEach((subPort) => void deleteFirestoreDocument(firestoreCollections.subPorts, subPort.id));
        persistLocalSnapshot();
        if (state.selectedPortId === portId) {
            state.selectedPortId = '';
            state.selectedSubPortId = '';
        }
        renderPortsTable();
    }

    function toggleExcelUploadArea() {
        const uploadArea = document.getElementById('subPortExcelUploadArea');
        if (uploadArea) {
            uploadArea.classList.toggle('hidden');
        }
    }

    function openAddSubPortLightbox() {
        const selectedPort = getSelectedPort();
        const lightbox = document.getElementById('addSubPortLightbox');

        document.getElementById('addSubPortParentId').value = selectedPort ? selectedPort.id : '';
        document.getElementById('addSubPortType').value = '';
        document.getElementById('addSubPortName').value = '';

        if (lightbox) {
            lightbox.classList.remove('hidden');
        }
    }

    function closeAddSubPortLightbox() {
        const lightbox = document.getElementById('addSubPortLightbox');
        if (lightbox) {
            lightbox.classList.add('hidden');
        }
    }

    function openEditSubPortLightbox(subPortId) {
        const subPort = state.subPorts.find((item) => item.id === subPortId);
        if (!subPort) {
            return;
        }

        document.getElementById('editSubPortId').value = subPort.id;
        document.getElementById('editSubPortType').value = subPort.type;
        document.getElementById('editSubPortName').value = subPort.name;

        const lightbox = document.getElementById('editSubPortLightbox');
        if (lightbox) {
            lightbox.classList.remove('hidden');
        }
    }

    function closeEditSubPortLightbox() {
        const lightbox = document.getElementById('editSubPortLightbox');
        if (lightbox) {
            lightbox.classList.add('hidden');
        }
    }

    function saveSubPortManual() {
        const parentPortId = document.getElementById('addSubPortParentId').value;
        const parentPort = state.ports.find((port) => port.id === parentPortId) || null;
        const payload = {
            id: `subport-${Date.now()}`,
            roundId: parentPort ? parentPort.roundId : state.selectedRoundId,
            parentPortId,
            type: document.getElementById('addSubPortType').value.trim(),
            name: document.getElementById('addSubPortName').value.trim(),
            displayOrder: Number(state.subPorts.filter((subPort) => subPort.parentPortId === parentPortId).length + 1),
            status: 'on',
        };

        if (!payload.parentPortId || !payload.type || !payload.name) {
            return;
        }

        state.subPorts.unshift({ ...payload });
        void upsertFirestoreDocument(firestoreCollections.subPorts, payload.id, payload);
        persistLocalSnapshot();
        state.selectedSubPortId = payload.id;
        renderSubPortsTable();
        closeAddSubPortLightbox();
    }

    function saveSubPortEditManual() {
        const subPortId = document.getElementById('editSubPortId').value;
        const payload = {
            type: document.getElementById('editSubPortType').value.trim(),
            name: document.getElementById('editSubPortName').value.trim(),
        };

        if (!subPortId || !payload.type || !payload.name) {
            return;
        }

        const subPortIndex = state.subPorts.findIndex((item) => item.id === subPortId);
        if (subPortIndex > -1) {
            state.subPorts[subPortIndex] = { ...state.subPorts[subPortIndex], ...payload };
            void upsertFirestoreDocument(firestoreCollections.subPorts, subPortId, state.subPorts[subPortIndex]);
        }

        persistLocalSnapshot();
        renderSubPortsTable();
        closeEditSubPortLightbox();
    }

    function deleteSubPort(subPortId) {
        const relatedEmployees = state.employees.filter((employee) => employee.subPortId === subPortId);
        state.subPorts = state.subPorts.filter((subPort) => subPort.id !== subPortId);
        state.employees = state.employees.filter((employee) => employee.subPortId !== subPortId);
        void deleteFirestoreDocument(firestoreCollections.subPorts, subPortId);
        relatedEmployees.forEach((employee) => void deleteFirestoreDocument(firestoreCollections.employees, employee.id));
        persistLocalSnapshot();
        if (state.selectedSubPortId === subPortId) {
            state.selectedSubPortId = '';
        }
        renderSubPortsTable();
    }

    function openAddRoundLightbox() {
        openRoundLightboxForAdd();
    }

    function closeAddRoundLightbox() {
        closeRoundLightbox();
    }

    function changeRoundsPageSize() {
        renderRoundsTable();
    }

    // ---------------------------------------------------------------------
    // Product catalog (plan_products): master Group / SubGroup / Unit list
    // ---------------------------------------------------------------------

    function getProductGroups() {
        const groups = [];
        state.products.forEach((product) => {
            if (product.group && !groups.includes(product.group)) {
                groups.push(product.group);
            }
        });
        return groups;
    }

    function getProductUnits() {
        const units = [];
        state.products.forEach((product) => {
            if (product.unit && !units.includes(product.unit)) {
                units.push(product.unit);
            }
        });
        return units;
    }

    function populateProductGroupFilter() {
        const select = document.getElementById('productsGroupFilter');
        if (select) {
            const currentValue = select.value || state.productsGroupFilter || 'all';
            const options = getProductGroups()
                .map((group) => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`)
                .join('');
            select.innerHTML = '<option value="all">ทุกหมวด Group</option>' + options;
            select.value = [...select.options].some((option) => option.value === currentValue) ? currentValue : 'all';
        }

        const groupDatalist = document.getElementById('productGroupOptions');
        if (groupDatalist) {
            groupDatalist.innerHTML = getProductGroups()
                .map((group) => `<option value="${escapeHtml(group)}"></option>`)
                .join('');
        }

        const unitDatalist = document.getElementById('productUnitOptions');
        if (unitDatalist) {
            unitDatalist.innerHTML = getProductUnits()
                .map((unit) => `<option value="${escapeHtml(unit)}"></option>`)
                .join('');
        }
    }

    function getGroupOrderIndex() {
        const groupIndex = {};
        state.products.forEach((product) => {
            const key = product.group || '';
            const order = Number(product.order || 0);
            groupIndex[key] = key in groupIndex ? Math.min(groupIndex[key], order) : order;
        });
        return groupIndex;
    }

    function getSortedProducts() {
        const groupIndex = getGroupOrderIndex();
        return state.products.slice().sort((left, right) => {
            const leftGroup = groupIndex[left.group || ''] || 0;
            const rightGroup = groupIndex[right.group || ''] || 0;
            if (leftGroup !== rightGroup) {
                return leftGroup - rightGroup;
            }
            return Number(left.order || 0) - Number(right.order || 0);
        });
    }

    function getFilteredProducts() {
        const sorted = getSortedProducts();
        return state.productsGroupFilter === 'all'
            ? sorted
            : sorted.filter((product) => product.group === state.productsGroupFilter);
    }

    function getNextProductOrder() {
        return state.products.reduce((max, product) => Math.max(max, Number(product.order || 0)), 0) + 1;
    }

    function renderProductsPagination(totalPages) {
        const container = document.getElementById('productsPaginationButtons');
        if (!container) {
            return;
        }

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const currentPage = state.productsPage;
        const pageButton = (label, targetPage, disabled, active) => `
            <button ${disabled ? 'disabled' : `onclick="goToProductsPage(${targetPage})"`}
                class="min-w-8 h-8 px-2 rounded-lg border text-[11px] font-bold transition ${active
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}">${label}</button>`;

        let html = pageButton('<i class="fa-solid fa-chevron-left"></i>', currentPage - 1, currentPage <= 1, false);
        for (let page = 1; page <= totalPages; page += 1) {
            html += pageButton(String(page), page, false, page === currentPage);
        }
        html += pageButton('<i class="fa-solid fa-chevron-right"></i>', currentPage + 1, currentPage >= totalPages, false);

        container.innerHTML = html;
    }

    function renderProductsTable() {
        const tableBody = document.getElementById('productsTableBody');
        const totalCount = document.getElementById('productsTotalCount');
        if (!tableBody) {
            return;
        }

        const filteredProducts = getFilteredProducts();
        if (totalCount) {
            totalCount.textContent = String(filteredProducts.length);
        }

        if (!filteredProducts.length) {
            tableBody.innerHTML = '<tr><td colspan="3" class="py-6 text-center text-slate-400">-- ยังไม่มีข้อมูลผลิตภัณฑ์ --</td></tr>';
            renderProductsPagination(0);
            return;
        }

        const pageSize = state.productsPageSize;
        const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
        state.productsPage = Math.min(Math.max(state.productsPage, 1), totalPages);

        const startIndex = (state.productsPage - 1) * pageSize;
        const pageItems = filteredProducts.slice(startIndex, startIndex + pageSize);

        let lastGroup = null;
        tableBody.innerHTML = pageItems.map((product) => {
            const showGroup = product.group !== lastGroup;
            lastGroup = product.group;
            return `
                <tr class="hover:bg-slate-50 transition">
                    <td class="py-2.5 px-4 ${showGroup ? 'font-black text-slate-800' : 'text-transparent select-none'}">${escapeHtml(product.group || '-')}</td>
                    <td class="py-2.5 px-4 font-semibold text-slate-700">
                        ${escapeHtml(product.subGroup || '-')}
                        ${product.unit ? `<span class="ml-1 text-[10px] text-slate-400 font-normal">(${escapeHtml(product.unit)})</span>` : ''}
                    </td>
                    <td class="py-2.5 px-4 text-center">
                        <div class="flex items-center justify-center gap-2">
                            ${rowActionButton('text-indigo-600', 'fa-pen-to-square', 'แก้ไขผลิตภัณฑ์', `openEditProductLightbox('${product.id}')`)}
                            ${rowActionButton('text-rose-600', 'fa-trash-can', 'ลบผลิตภัณฑ์', `deleteProduct('${product.id}')`)}
                        </div>
                    </td>
                </tr>`;
        }).join('');

        renderProductsPagination(totalPages);
    }

    function goToProductsPage(page) {
        state.productsPage = Number(page) || 1;
        renderProductsTable();
    }

    function changeProductsPageSize(value) {
        state.productsPageSize = Number(value) || 10;
        state.productsPage = 1;
        renderProductsTable();
    }

    function changeProductsGroupFilter(value) {
        state.productsGroupFilter = value || 'all';
        state.productsPage = 1;
        renderProductsTable();
    }

    function openAddProductLightbox() {
        populateProductGroupFilter();
        document.getElementById('addProductGroup').value = '';
        document.getElementById('addProductSubGroup').value = '';
        document.getElementById('addProductUnit').value = '';

        const lightbox = document.getElementById('addProductLightbox');
        if (lightbox) {
            lightbox.classList.remove('hidden');
        }
    }

    function closeAddProductLightbox() {
        const lightbox = document.getElementById('addProductLightbox');
        if (lightbox) {
            lightbox.classList.add('hidden');
        }
    }

    function saveProduct() {
        const newProduct = {
            id: `product-${Date.now()}`,
            group: document.getElementById('addProductGroup').value.trim(),
            subGroup: document.getElementById('addProductSubGroup').value.trim(),
            unit: document.getElementById('addProductUnit').value.trim(),
            order: getNextProductOrder(),
        };

        if (!newProduct.group || !newProduct.subGroup) {
            return;
        }

        state.products.push({ ...newProduct });
        void upsertFirestoreDocument(firestoreCollections.products, newProduct.id, newProduct);
        persistLocalSnapshot();
        populateProductGroupFilter();
        renderProductsTable();
        closeAddProductLightbox();
    }

    function openEditProductLightbox(productId) {
        const product = state.products.find((item) => item.id === productId);
        if (!product) {
            return;
        }

        populateProductGroupFilter();
        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductGroup').value = product.group || '';
        document.getElementById('editProductSubGroup').value = product.subGroup || '';
        document.getElementById('editProductUnit').value = product.unit || '';

        const lightbox = document.getElementById('editProductLightbox');
        if (lightbox) {
            lightbox.classList.remove('hidden');
        }
    }

    function closeEditProductLightbox() {
        const lightbox = document.getElementById('editProductLightbox');
        if (lightbox) {
            lightbox.classList.add('hidden');
        }
    }

    function saveProductEdit() {
        const productId = document.getElementById('editProductId').value;
        const payload = {
            group: document.getElementById('editProductGroup').value.trim(),
            subGroup: document.getElementById('editProductSubGroup').value.trim(),
            unit: document.getElementById('editProductUnit').value.trim(),
        };

        if (!productId || !payload.group || !payload.subGroup) {
            return;
        }

        const productIndex = state.products.findIndex((item) => item.id === productId);
        if (productIndex > -1) {
            state.products[productIndex] = { ...state.products[productIndex], ...payload };
            void upsertFirestoreDocument(firestoreCollections.products, productId, state.products[productIndex]);
        }

        persistLocalSnapshot();
        populateProductGroupFilter();
        renderProductsTable();
        closeEditProductLightbox();
    }

    function deleteProduct(productId) {
        state.products = state.products.filter((product) => product.id !== productId);
        void deleteFirestoreDocument(firestoreCollections.products, productId);
        persistLocalSnapshot();
        populateProductGroupFilter();
        renderProductsTable();
    }

    function importProductsExcel(event) {
        const input = event.target;
        const file = input.files && input.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            try {
                const data = new Uint8Array(loadEvent.target.result);
                const workbook = window.XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = window.XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

                const existingKeys = new Set(state.products.map((product) => `${product.group}||${product.subGroup}`));
                const imported = [];
                let orderCursor = getNextProductOrder();

                rows.forEach((row, rowIndex) => {
                    const group = String(row[0] || '').trim();
                    const subGroup = String(row[1] || '').trim();
                    const unit = String(row[2] || '').trim();

                    if (!group || !subGroup) {
                        return;
                    }
                    // Skip the header row (Group / SubGroup / Unit)
                    if (group.toLowerCase() === 'group' && subGroup.toLowerCase() === 'subgroup') {
                        return;
                    }

                    const key = `${group}||${subGroup}`;
                    if (existingKeys.has(key)) {
                        return;
                    }
                    existingKeys.add(key);

                    imported.push({
                        id: `product-${Date.now()}-${rowIndex}`,
                        group,
                        subGroup,
                        unit,
                        order: orderCursor,
                    });
                    orderCursor += 1;
                });

                if (imported.length) {
                    imported.forEach((product) => {
                        state.products.push({ ...product });
                        void upsertFirestoreDocument(firestoreCollections.products, product.id, product);
                    });
                    persistLocalSnapshot();
                    populateProductGroupFilter();
                    renderProductsTable();
                }
            } catch (error) {
                // Silently ignore malformed spreadsheets, consistent with this file's error handling.
            } finally {
                input.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function renderCompetitorsTable() {
        const tableBody = document.getElementById('competitorsTableBody');
        if (!tableBody) return;

        // Filter users by selected round
        const filteredUsers = state.selectedRoundId === 'all' 
            ? state.users 
            : state.users.filter(user => user.roundId === state.selectedRoundId);

        if (!filteredUsers.length) {
            tableBody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400">-- ไม่พบข้อมูลผู้สมัครแข่งขัน --</td></tr>`;
            return;
        }

        tableBody.innerHTML = filteredUsers.map((user, index) => {
            // Find Portfolio sets count for this user (each document is a set)
            const portfolioDocs = state.portfolioSets.filter(doc => doc.userId === user.id);
            const portfolioSetsCount = portfolioDocs.length;

            // Find Account Planning Bootcamp sets count for this user (grouped inside singleton doc with ID 'userId__activityItemId')
            const cdDocs = state.customerDiagnosis.filter(doc => doc.id.startsWith(user.id + '__'));
            const cdSetsCount = cdDocs.reduce((acc, doc) => acc + (doc.sets || []).length, 0);

            return `
                <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                    <td class="py-3 px-4 text-center align-middle">${index + 1}</td>
                    <td class="py-3 px-4 text-left align-middle font-bold text-slate-900">${escapeHtml(user.name || '-')}</td>
                    <td class="py-3 px-4 text-center align-middle">
                        <button onclick="openCompetitorPortfolioSetsLightbox('${user.id}')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-250 transition shadow-sm">
                            ${portfolioSetsCount} ชุดแผนงาน
                        </button>
                    </td>
                    <td class="py-3 px-4 text-center align-middle">
                        <button onclick="openCompetitorAccountSetsLightbox('${user.id}')" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-100 text-orange-700 hover:bg-orange-250 transition shadow-sm">
                            ${cdSetsCount} ชุดแผนงาน
                        </button>
                    </td>
                    <td class="py-3 px-4 text-center align-middle">
                        <button onclick="openConfirmDeletePlanLightbox('${user.id}')" class="w-8 h-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-400 transition mx-auto" title="ลบข้อมูลทีมนี้">
                            <i class="fa-solid fa-trash-can text-base"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function openCompetitorPortfolioSetsLightbox(userId) {
        const user = state.users.find(u => u.id === userId);
        if (!user) return;

        const portfolioDocs = state.portfolioSets.filter(doc => doc.userId === userId)
            .sort((left, right) => Number(left.setIndex || 0) - Number(right.setIndex || 0));

        if (!portfolioDocs.length) {
            const bodyEl = document.getElementById('competitorDetailsBody');
            const mailBtn = document.getElementById('adminPortfolioMailBtn');
            const titleEl = document.getElementById('competitorDetailsTitle');
            const subtitleEl = document.getElementById('competitorDetailsSubtitle');

            if (titleEl) titleEl.textContent = `Portfolio Planning: ${user.name}`;
            if (subtitleEl) subtitleEl.textContent = `แผนงานจัดพอร์ตทั้งหมดของทีม ${user.name}`;
            if (mailBtn) mailBtn.classList.add('hidden');
            if (bodyEl) bodyEl.innerHTML = `<div class="text-center py-12 text-slate-400">-- ไม่พบแผนงาน Portfolio Planning ของทีมนี้ --</div>`;
            document.getElementById('competitorDetailsLightbox').classList.remove('hidden');
            return;
        }

        renderActivePortfolioDetails(userId, 0);
        document.getElementById('competitorDetailsLightbox').classList.remove('hidden');
    }

    function renderActivePortfolioDetails(userId, activeIndex) {
        window.activePortfolioUserId = userId;
        window.activePortfolioIndex = activeIndex;

        const user = state.users.find(u => u.id === userId);
        if (!user) return;

        const portfolioDocs = state.portfolioSets.filter(doc => doc.userId === userId)
            .sort((left, right) => Number(left.setIndex || 0) - Number(right.setIndex || 0));

        const titleEl = document.getElementById('competitorDetailsTitle');
        const subtitleEl = document.getElementById('competitorDetailsSubtitle');
        const bodyEl = document.getElementById('competitorDetailsBody');
        const mailBtn = document.getElementById('adminPortfolioMailBtn');

        if (titleEl) titleEl.textContent = `Portfolio Planning: ${user.name}`;
        if (subtitleEl) subtitleEl.textContent = `แผนงานจัดพอร์ตทั้งหมดของทีม ${user.name}`;

        if (!portfolioDocs.length) {
            if (mailBtn) mailBtn.classList.add('hidden');
            if (bodyEl) bodyEl.innerHTML = `<div class="text-center py-12 text-slate-400">-- ไม่พบแผนงาน Portfolio Planning ของทีมนี้ --</div>`;
            return;
        }

        if (mailBtn) {
            mailBtn.classList.remove('hidden');
            mailBtn.onclick = () => sendAdminPortfolioMailAsEmail(userId, activeIndex);
        }

        const deleteBtn = document.getElementById('adminDeleteSetBtn');
        if (deleteBtn) {
            deleteBtn.onclick = () => openConfirmDeleteSetLightbox('portfolio');
        }

        const activeSet = portfolioDocs[activeIndex] || portfolioDocs[0];
        const setIndex = portfolioDocs.indexOf(activeSet) + 1;

        // Render Tabs
        let tabsHtml = `<div class="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-4 shrink-0">`;
        portfolioDocs.forEach((doc, idx) => {
            const isActive = idx === activeIndex;
            tabsHtml += `
                <button onclick="renderActivePortfolioDetails('${userId}', ${idx})" class="px-4 py-2 rounded-lg text-xs font-bold transition ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-205'}">
                    แผนงานที่ ${idx + 1}
                </button>
            `;
        });
        tabsHtml += `</div>`;

        // Render Set Details similar to user.js openPresenterMailLightbox
        const getUnitForSubGroup = (subGroup) => {
            if (!subGroup) return '';
            const match = state.products.find((p) => p.subGroup === subGroup);
            if (!match) return '';
            if (match.unit) return match.unit;
            const group = match.group;
            if (['Deposit', 'BA', 'MF', 'SN'].includes(group)) {
                return 'บาท';
            }
            if (['Portfolio', 'Relationship', 'Relation', 'Qualified WB/PB'].includes(group)) {
                return 'คน';
            }
            return '';
        };

        const formatNumberWithCommas = (val) => {
            const num = Number(val);
            return isNaN(num) ? '0' : num.toLocaleString('th-TH');
        };

        const renderCategoryOutcomeRows = (cat) => {
            const rows = activeSet.rows[cat] || [];
            const targetText = rows[0]?.target || '-';
            const actionText = rows[0]?.actionPlan || '-';

            const productList = rows.map((row) => {
                if (!row.subGroup) return '';
                const unit = getUnitForSubGroup(row.subGroup);
                const amt = formatNumberWithCommas(row.amount || 0);
                return `<li class="text-xs text-slate-700 list-disc list-inside">${escapeHtml(row.subGroup)}: <strong class="text-blue-800">${amt}</strong> ${unit}</li>`;
            }).filter(Boolean).join('');

            return `
                <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2 text-left">
                    <h5 class="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">${cat}</h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <div>
                            <span class="block text-[12px] text-slate-400">Target</span>
                            <p class="text-xs text-slate-700 whitespace-pre-wrap">${escapeHtml(targetText)}</p>
                        </div>
                        <div>
                            <span class="block text-[12px] text-slate-400">Action Plan</span>
                            <p class="text-xs text-slate-700 whitespace-pre-wrap">${escapeHtml(actionText)}</p>
                        </div>
                    </div>
                    <div class="pt-1">
                        <span class="block text-[12px] text-slate-400 mb-1">ผลิตภัณฑ์ปักหมุด</span>
                        ${productList ? `<ul class="space-y-1">${productList}</ul>` : '<span class="text-xs text-slate-400 italic">ไม่มีข้อมูล</span>'}
                    </div>
                </div>
            `;
        };

        const detailsHtml = `
            <div class="space-y-4">
                ${tabsHtml}
                
                <!-- Content Area (Target for html2canvas) -->
                <div id="adminPortfolioMailContentArea" class="p-8 overflow-y-auto space-y-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div class="text-center space-y-2 shrink-0">
                        <h2 class="text-xl font-black text-slate-800">Portfolio Planning (แผนงานที่ ${setIndex})</h2>
                        <p class="text-xs font-semibold text-blue-600">ผู้นำเสนอแผนงาน: ${escapeHtml(user.name)}</p>
                    </div>

                    <div class="bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-xl shadow-sm text-left">
                        <span class="text-xs font-bold text-slate-400 mr-1">ชื่อเรื่อง:</span>
                        <span class="text-sm font-normal text-slate-800">${escapeHtml(activeSet.topic || '-')}</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="bg-[#e9f0f8] border border-slate-200 rounded-2xl p-5 space-y-2 text-left">
                            <h4 class="text-xs font-black text-slate-800">1. Portfolio Overview</h4>
                            <p class="text-xs text-slate-700 whitespace-pre-wrap">${escapeHtml(activeSet.overview || '-')}</p>
                        </div>
                        <div class="bg-[#e9f0f8] border border-slate-200 rounded-2xl p-5 space-y-2 text-left">
                            <h4 class="text-xs font-black text-slate-800">2. Gap</h4>
                            <p class="text-xs text-slate-700 whitespace-pre-wrap">${escapeHtml(activeSet.gap || '-')}</p>
                        </div>
                        <div class="bg-[#e9f0f8] border border-slate-200 rounded-2xl p-5 space-y-2 text-left">
                            <h4 class="text-xs font-black text-slate-800">3. Opportunity</h4>
                            <p class="text-xs text-slate-700 whitespace-pre-wrap">${escapeHtml(activeSet.opportunity || '-')}</p>
                        </div>
                    </div>

                    <div class="space-y-4 pt-4 text-left">
                        <h4 class="text-xs font-black text-slate-800">4. Outcome (Target, Action Plan & ผลิตภัณฑ์)</h4>
                        <div class="flex flex-col gap-4">
                            ${renderCategoryOutcomeRows('GRAB')}
                            ${renderCategoryOutcomeRows('GROW')}
                            ${renderCategoryOutcomeRows('GUARD')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (bodyEl) bodyEl.innerHTML = detailsHtml;
    }

    function sendAdminPortfolioMailAsEmail(userId, activeIndex) {
        const container = document.getElementById('adminPortfolioMailContentArea');
        if (!container) return;

        const user = state.users.find(u => u.id === userId);
        if (!user) return;

        const portfolioDocs = state.portfolioSets.filter(doc => doc.userId === userId)
            .sort((left, right) => Number(left.setIndex || 0) - Number(right.setIndex || 0));
        const activeSet = portfolioDocs[activeIndex];
        if (!activeSet) return;

        const setIndex = activeIndex + 1;
        const subjectText = `Account Planning Bootcamp (แผนงานที่ ${setIndex}) โดย ${user.name}`;

        // Temporarily expand container height and remove scroll restrictions for a complete screen capture
        const originalHeight = container.style.height;
        const originalMaxHeight = container.style.maxHeight;
        const originalOverflow = container.style.overflow;

        container.style.height = 'auto';
        container.style.maxHeight = 'none';
        container.style.overflow = 'visible';

        html2canvas(container, { scale: 2, useCORS: true }).then((canvas) => {
            // Restore original styles
            container.style.height = originalHeight;
            container.style.maxHeight = originalMaxHeight;
            container.style.overflow = originalOverflow;

            const imgData = canvas.toDataURL('image/png');

            // 1. Download screenshot locally
            const link = document.createElement('a');
            link.download = `bootcamp_plan_${setIndex}.png`;
            link.href = imgData;
            link.click();

            // 2. Copy image to Clipboard as Blob
            canvas.toBlob((blob) => {
                if (blob) {
                    try {
                        navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]).then(() => {
                            console.log("คัดลอกรูปภาพแผนงานลง Clipboard เรียบร้อยแล้ว");
                        }).catch(err => {
                            console.error("ไม่สามารถเขียนลง Clipboard ได้", err);
                        });
                    } catch (e) {
                        console.error("ไม่สามารถใช้งาน Clipboard Item ได้", e);
                    }
                }
            }, 'image/png');

            // 3. Open native email client using mailto link
            const bodyInstruction = "กรุณากด Ctrl+V (หรือคลิกขวาแล้ววาง) เพื่อวางรูปภาพแผนงานสรุปที่คัดลอกไว้ในคลิปบอร์ดที่นี่\n\n";
            const mailtoUrl = `mailto:?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyInstruction)}`;
            window.location.href = mailtoUrl;
        });
    }

    window.activeBootcampUserId = null;
    window.activeBootcampIndex = 0;
    window.currentAdminMailScale = 1.0;

    window.adjustAdminMailFontSize = (factor) => {
        window.currentAdminMailScale = Math.max(0.5, Math.min(2.0, window.currentAdminMailScale + factor));
        const container = document.getElementById('adminPortfolioMailContentArea') || document.getElementById('adminBootcampMailContentArea');
        if (!container) return;

        const elements = container.querySelectorAll('p, span, h2, h3, h4, h5, th, td, li, strong');
        elements.forEach((el) => {
            if (!el.hasAttribute('data-orig-size')) {
                const computed = window.getComputedStyle(el).fontSize;
                el.setAttribute('data-orig-size', computed);
            }
            const origSize = parseFloat(el.getAttribute('data-orig-size'));
            if (!isNaN(origSize)) {
                el.style.fontSize = (origSize * window.currentAdminMailScale) + 'px';
            }
        });
    };

    window.openCompetitorAccountSetsLightbox = (userId) => {
        window.activePortfolioUserId = null;
        window.activePortfolioIndex = 0;
        window.currentAdminMailScale = 1.0;
        
        renderActiveBootcampDetails(userId, 0);
        document.getElementById('competitorDetailsLightbox').classList.remove('hidden');
    };

    window.renderActiveBootcampDetails = (userId, activeIndex) => {
        window.activeBootcampUserId = userId;
        window.activeBootcampIndex = activeIndex;

        const user = state.users.find(u => u.id === userId);
        if (!user) return;

        const cdDocs = state.customerDiagnosis.filter(doc => doc.id.startsWith(userId + '__'));
        const allSets = [];
        cdDocs.forEach(doc => {
            const activityItemId = doc.id.split('__')[1] || '';
            const activityItem = state.ports.find(p => p.id === activityItemId) || { name: 'ไม่ระบุกิจกรรม' };
            (doc.sets || []).forEach((set) => {
                allSets.push({
                    activityItem,
                    docId: doc.id,
                    set
                });
            });
        });

        const titleEl = document.getElementById('competitorDetailsTitle');
        const subtitleEl = document.getElementById('competitorDetailsSubtitle');
        const bodyEl = document.getElementById('competitorDetailsBody');
        const mailBtn = document.getElementById('adminPortfolioMailBtn');

        if (titleEl) titleEl.textContent = `Account Planning Bootcamp: ${user.name}`;
        if (subtitleEl) subtitleEl.textContent = `แผนงานบูทแคมป์ทั้งหมดของทีม ${user.name}`;

        if (!allSets.length) {
            if (mailBtn) mailBtn.classList.add('hidden');
            if (bodyEl) bodyEl.innerHTML = `<div class="text-center py-12 text-slate-400">-- ไม่พบแผนงาน Account Planning ของทีมนี้ --</div>`;
            return;
        }

        if (mailBtn) {
            mailBtn.classList.remove('hidden');
            mailBtn.onclick = () => sendAdminBootcampMailAsEmail(userId, activeIndex);
        }

        const deleteBtn = document.getElementById('adminDeleteSetBtn');
        if (deleteBtn) {
            deleteBtn.onclick = () => openConfirmDeleteSetLightbox('bootcamp');
        }

        const activeEntry = allSets[activeIndex] || allSets[0];
        const activeSet = activeEntry.set;
        const activityItem = activeEntry.activityItem;

        const formatValueWithCommas = (val) => {
            if (!val) return '-';
            const clean = String(val).replace(/,/g, '');
            const num = Number(clean);
            return isNaN(num) ? val : num.toLocaleString('th-TH');
        };

        // Render Tabs
        let tabsHtml = `<div class="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-4 shrink-0">`;
        allSets.forEach((entry, idx) => {
            const isActive = idx === activeIndex;
            tabsHtml += `
                <button onclick="renderActiveBootcampDetails('${userId}', ${idx})" class="px-4 py-2 rounded-lg text-xs font-bold transition ${isActive ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-205'}">
                    แผนงานที่ ${idx + 1}
                </button>
            `;
        });
        tabsHtml += `</div>`;

        const act = activeSet.act || { aim: '', consult: '', track: '' };
        const ion = activeSet.ion || { improve: '', operate: '', notice: '' };
        const diag = activeSet.diagnosis || { goalAndLimit: '', idealPortfolio: '', currentPortfolio: '', portfolioSymptom: '', potentialImpact: '', adjustmentGuideline: '' };
        const solutions = activeSet.financialSolutions || [];

        const renderSolutionsTable = () => {
            if (!solutions.length) {
                return '<div class="text-xs text-slate-400 italic p-3 text-center border border-slate-200 rounded-xl">ไม่มีข้อมูล Financial Solutions</div>';
            }
            let rowsHtml = '';
            solutions.forEach((sol, idx) => {
                rowsHtml += `
                    <tr class="border-t border-slate-200">
                        <td class="p-3 align-top border-r border-slate-200 space-y-2 text-left bg-slate-50/50">
                            <div>
                                <span class="block text-[10px] font-bold text-slate-500 mb-0.5">เป้าหมายทางการเงิน</span>
                                <span class="text-xs font-normal text-slate-800">${escapeHtml(sol.goal || '-')}</span>
                            </div>
                            <div>
                                <span class="block text-[10px] font-bold text-slate-500 mb-0.5">จำนวนเงิน</span>
                                <span class="text-xs font-normal text-slate-800">${escapeHtml(formatValueWithCommas(sol.amount))}</span>
                            </div>
                            <div>
                                <span class="block text-[10px] font-bold text-slate-500 mb-0.5">ระยะเวลา</span>
                                <span class="text-xs font-normal text-slate-800">${escapeHtml(sol.duration || '-')}</span>
                            </div>
                            <div>
                                <span class="block text-[10px] font-bold text-slate-500 mb-0.5">อัตราผลตอบแทนที่คาดหวัง</span>
                                <span class="text-xs font-normal text-slate-800">${escapeHtml(sol.expectedReturn || '-')}%</span>
                            </div>
                        </td>
                        <td class="p-3 align-top border-r border-slate-200 text-left whitespace-pre-wrap font-normal text-slate-705">${escapeHtml(sol.smartSpend || '-')}</td>
                        <td class="p-3 align-top border-r border-slate-200 text-left whitespace-pre-wrap font-normal text-slate-705">${escapeHtml(sol.smartSave || '-')}</td>
                        <td class="p-3 align-top border-r border-slate-200 text-left whitespace-pre-wrap font-normal text-slate-705">${escapeHtml(sol.smartProtect || '-')}</td>
                        <td class="p-3 align-top text-left whitespace-pre-wrap font-normal text-slate-705">${escapeHtml(sol.smartBorrow || '-')}</td>
                    </tr>
                `;
            });
            return `
                <div class="overflow-x-auto border border-slate-200 rounded-xl mt-1">
                    <table class="w-full text-xs border-collapse">
                        <thead>
                            <tr class="bg-[#f8fafc] text-slate-700 border-b border-slate-200">
                                <th rowspan="2" class="py-2.5 px-3 text-center font-black border-r border-slate-200 w-[24%]">รายการ</th>
                                <th colspan="4" class="py-2 px-3 text-center font-black border-b border-slate-200">โซลูชันที่จะแนะนำ</th>
                            </tr>
                            <tr class="bg-slate-100/80 text-slate-700 text-[12px] text-center border-b border-slate-200">
                                <th class="py-2 px-2 border-r border-slate-200 w-[19%]">ฉลาดใช้</th>
                                <th class="py-2 px-2 border-r border-slate-200 w-[19%]">ฉลาดออมและลงทุน</th>
                                <th class="py-2 px-2 border-r border-slate-200 w-[19%]">คุ้มครองอุ่นใจ</th>
                                <th class="py-2 px-2 w-[19%]">รอบรู้กู้ยืม</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            `;
        };

        const detailsHtml = `
            <div class="space-y-4">
                ${tabsHtml}
                
                <!-- Content Area (Target for html2canvas) -->
                <div id="adminBootcampMailContentArea" class="p-8 overflow-y-auto space-y-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div class="text-center space-y-2 shrink-0">
                        <h2 class="text-xl font-black text-slate-800">${escapeHtml(activityItem.name)} (แผนงานที่ ${activeIndex + 1})</h2>
                        <p class="text-xs font-semibold text-blue-600">ผู้นำเสนอแผนงาน: ${escapeHtml(user.name)}</p>
                    </div>

                    <div class="bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-xl shadow-sm text-left">
                        <span class="text-xs font-bold text-slate-400 mr-1">ชื่อเรื่อง:</span>
                        <span class="text-sm font-normal text-slate-800">${escapeHtml(activeSet.topic || '-')}</span>
                    </div>

                    <!-- ข้อมูลลูกค้า -->
                    <div class="bgblue text-white rounded-2xl p-4 text-left space-y-1">
                        <span class="block text-xs font-bold opacity-75">ข้อมูลลูกค้า</span>
                        <p class="whitespace-pre-line font-normal text-xs">${escapeHtml(activeSet.customerInfo || '-')}</p>
                    </div>

                    <!-- A-C-T-I-O-N -->
                    <div class="space-y-2 text-left">
                        <h3 class="text-xs font-black text-slate-700 flex items-center gap-2"><span class="w-5 h-5 rounded-full bg-blue-800 text-white flex items-center justify-center text-[10px]">1</span> Customer Profile & Action Plan</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div class="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                <div class="bgblue text-white text-center text-[12px] font-bold py-2 px-2">A - Aim</div>
                                <p class="p-3 text-xs text-slate-700 whitespace-pre-wrap font-normal">${escapeHtml(act.aim || '-')}</p>
                            </div>
                            <div class="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                <div class="bgblue text-white text-center text-[12px] font-bold py-2 px-2">C - Consult</div>
                                <p class="p-3 text-xs text-slate-700 whitespace-pre-wrap font-normal">${escapeHtml(act.consult || '-')}</p>
                            </div>
                            <div class="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                <div class="bgblue text-white text-center text-[12px] font-bold py-2 px-2">T - Track</div>
                                <p class="p-3 text-xs text-slate-700 whitespace-pre-wrap font-normal">${escapeHtml(act.track || '-')}</p>
                            </div>
                            <div class="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                <div class="bgorange text-white text-center text-[12px] font-bold py-2 px-2">I - Improve</div>
                                <p class="p-3 text-xs text-slate-700 whitespace-pre-wrap font-normal">${escapeHtml(ion.improve || '-')}</p>
                            </div>
                            <div class="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                <div class="bgorange text-white text-center text-[12px] font-bold py-2 px-2">O - Operate</div>
                                <p class="p-3 text-xs text-slate-700 whitespace-pre-wrap font-normal">${escapeHtml(ion.operate || '-')}</p>
                            </div>
                            <div class="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                <div class="bgorange text-white text-center text-[12px] font-bold py-2 px-2">N - Notice</div>
                                <p class="p-3 text-xs text-slate-700 whitespace-pre-wrap font-normal">${escapeHtml(ion.notice || '-')}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Diagnosis -->
                    <div class="space-y-2 text-left">
                        <h3 class="text-xs font-black text-slate-700 flex items-center gap-2"><span class="w-5 h-5 rounded-full bg-blue-800 text-white flex items-center justify-center text-[10px]">2</span> Portfolio Diagnosis & Improvement</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div class="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                <div class="bgblue text-white text-center text-[12px] font-bold py-2 px-2">เป้าหมายและข้อจำกัด</div>
                                <p class="p-3 text-xs text-slate-700 whitespace-pre-wrap font-normal">${escapeHtml(diag.goalAndLimit || '-')}</p>
                            </div>
                            <div class="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                <div class="bgblue text-white text-center text-[12px] font-bold py-2 px-2">พอร์ตที่ควรเป็นตามเป้าหมาย</div>
                                <p class="p-3 text-xs text-slate-700 whitespace-pre-wrap font-normal">${escapeHtml(diag.idealPortfolio || '-')}</p>
                            </div>
                            <div class="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                <div class="bgblue text-white text-center text-[12px] font-bold py-2 px-2">พอร์ตปัจจุบันที่ลูกค้ามี</div>
                                <p class="p-3 text-xs text-slate-700 whitespace-pre-wrap font-normal">${escapeHtml(diag.currentPortfolio || '-')}</p>
                            </div>
                            <div class="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                <div class="bgorange text-white text-center text-[12px] font-bold py-2 px-2">อาการของพอร์ต</div>
                                <p class="p-3 text-xs text-slate-700 whitespace-pre-wrap font-normal">${escapeHtml(diag.portfolioSymptom || '-')}</p>
                            </div>
                            <div class="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                <div class="bgorange text-white text-center text-[12px] font-bold py-2 px-2">ผลกระทบที่อาจเกิดขึ้น</div>
                                <p class="p-3 text-xs text-slate-700 whitespace-pre-wrap font-normal">${escapeHtml(diag.potentialImpact || '-')}</p>
                            </div>
                            <div class="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                <div class="bgorange text-white text-center text-[12px] font-bold py-2 px-2">แนวทางปรับพอร์ต</div>
                                <p class="p-3 text-xs text-slate-700 whitespace-pre-wrap font-normal">${escapeHtml(diag.adjustmentAdjustment || diag.adjustmentGuideline || '-')}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Financial Solutions -->
                    <div class="space-y-2 text-left">
                        <h3 class="text-xs font-black text-slate-700 flex items-center gap-2"><span class="w-5 h-5 rounded-full bg-blue-800 text-white flex items-center justify-center text-[10px]">3</span> Financial Solution</h3>
                        ${renderSolutionsTable()}
                    </div>
                </div>
            </div>
        `;

        if (bodyEl) bodyEl.innerHTML = detailsHtml;
    };

    function sendAdminBootcampMailAsEmail(userId, activeIndex) {
        const container = document.getElementById('adminBootcampMailContentArea');
        if (!container) return;

        const user = state.users.find(u => u.id === userId);
        if (!user) return;

        const cdDocs = state.customerDiagnosis.filter(doc => doc.id.startsWith(userId + '__'));
        const allSets = [];
        cdDocs.forEach(doc => {
            const activityItemId = doc.id.split('__')[1] || '';
            const activityItem = state.ports.find(p => p.id === activityItemId) || { name: 'ไม่ระบุกิจกรรม' };
            (doc.sets || []).forEach((set) => {
                allSets.push({
                    activityItem,
                    set
                });
            });
        });

        const activeEntry = allSets[activeIndex];
        if (!activeEntry) return;
        const setIndex = activeIndex + 1;
        const subjectText = `Account Planning Bootcamp (แผนงานที่ ${setIndex}) โดย ${user.name}`;

        const originalHeight = container.style.height;
        const originalMaxHeight = container.style.maxHeight;
        const originalOverflow = container.style.overflow;

        container.style.height = 'auto';
        container.style.maxHeight = 'none';
        container.style.overflow = 'visible';

        html2canvas(container, { scale: 2, useCORS: true }).then((canvas) => {
            container.style.height = originalHeight;
            container.style.maxHeight = originalMaxHeight;
            container.style.overflow = originalOverflow;

            const imgData = canvas.toDataURL('image/png');

            const link = document.createElement('a');
            link.download = `bootcamp_plan_${setIndex}.png`;
            link.href = imgData;
            link.click();

            canvas.toBlob((blob) => {
                if (blob) {
                    try {
                        navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]).then(() => {
                            console.log("คัดลอกรูปภาพแผนงานลง Clipboard เรียบร้อยแล้ว");
                        }).catch(err => {
                            console.error("ไม่สามารถเขียนลง Clipboard ได้", err);
                        });
                    } catch (e) {
                        console.error("ไม่สามารถใช้งาน Clipboard Item ได้", e);
                    }
                }
            }, 'image/png');

            const bodyInstruction = "กรุณากด Ctrl+V (หรือคลิกขวาแล้ววาง) เพื่อวางรูปภาพแผนงานสรุปที่คัดลอกไว้ในคลิปบอร์ดที่นี่\n\n";
            const mailtoUrl = `mailto:?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyInstruction)}`;
            window.location.href = mailtoUrl;
        });
    }

    function closeCompetitorDetailsLightbox() {
        document.getElementById('competitorDetailsLightbox').classList.add('hidden');
        window.activePortfolioUserId = null;
        window.activePortfolioIndex = 0;
        window.activeBootcampUserId = null;
        window.activeBootcampIndex = 0;
        window.currentAdminMailScale = 1.0;
    }

    function openConfirmDeletePlanLightbox(userId) {
        document.getElementById('deletePlanUserId').value = userId;
        document.getElementById('confirmDeletePlanLightbox').classList.remove('hidden');
    }

    function closeConfirmDeletePlanLightbox() {
        document.getElementById('confirmDeletePlanLightbox').classList.add('hidden');
    }

    window.openConfirmDeleteSetLightbox = (type) => {
        window.deleteSetType = type;
        const input = document.getElementById('confirmDeleteSetInput');
        if (input) input.value = '';
        const btn = document.getElementById('confirmDeleteSetBtn');
        if (btn) {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.classList.remove('opacity-100', 'cursor-pointer');
        }
        document.getElementById('confirmDeleteSetLightbox').classList.remove('hidden');
    };

    window.checkDeleteSetInput = () => {
        const text = document.getElementById('confirmDeleteSetInput').value.trim();
        const btn = document.getElementById('confirmDeleteSetBtn');
        if (!btn) return;
        
        if (text === 'Delete Page') {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.classList.add('opacity-100', 'cursor-pointer');
        } else {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.classList.remove('opacity-100', 'cursor-pointer');
        }
    };

    window.closeConfirmDeleteSetLightbox = () => {
        document.getElementById('confirmDeleteSetLightbox').classList.add('hidden');
    };

    window.confirmDeleteActiveSet = async () => {
        const text = document.getElementById('confirmDeleteSetInput').value.trim();
        if (text !== 'Delete Page') {
            alert('กรุณาพิมพ์ "Delete Page" ให้ถูกต้องเพื่อยืนยัน');
            return;
        }

        try {
            if (window.deleteSetType === 'portfolio') {
                const userId = window.activePortfolioUserId;
                const activeIndex = window.activePortfolioIndex;
                const portfolioDocs = state.portfolioSets.filter(doc => doc.userId === userId)
                    .sort((left, right) => Number(left.setIndex || 0) - Number(right.setIndex || 0));
                const activeSet = portfolioDocs[activeIndex];
                if (activeSet) {
                    await deleteFirestoreDocument(firestoreCollections.portfolioSets, activeSet.id);
                    console.log('ลบแผนงาน Portfolio สำเร็จ');
                }
            } else if (window.deleteSetType === 'bootcamp') {
                const userId = window.activeBootcampUserId;
                const activeIndex = window.activeBootcampIndex;
                const cdDocs = state.customerDiagnosis.filter(doc => doc.id.startsWith(userId + '__'));
                const allSets = [];
                cdDocs.forEach(doc => {
                    (doc.sets || []).forEach((set) => {
                        allSets.push({ docId: doc.id, set });
                    });
                });
                const activeEntry = allSets[activeIndex];
                if (activeEntry) {
                    const doc = state.customerDiagnosis.find(d => d.id === activeEntry.docId);
                    if (doc) {
                        const setIdx = doc.sets.indexOf(activeEntry.set);
                        if (setIdx > -1) {
                            doc.sets.splice(setIdx, 1);
                            await upsertFirestoreDocument(firestoreCollections.customerDiagnosis, doc.id, { sets: doc.sets });
                            console.log('ลบแผนงาน Bootcamp สำเร็จ');
                        }
                    }
                }
            }
            closeConfirmDeleteSetLightbox();
            closeCompetitorDetailsLightbox();
        } catch (error) {
            console.error('ลบข้อมูลไม่สำเร็จ', error);
            alert('ลบข้อมูลไม่สำเร็จ: ' + error.message);
        }
    };

    async function deletePlanConfirm() {
        const userId = document.getElementById('deletePlanUserId').value;
        if (!userId) return;

        try {
            // Delete user from Firestore
            await deleteFirestoreDocument(firestoreCollections.users, userId);

            // Find related portfolio and customer diagnosis docs
            const portDocs = state.portfolioSets.filter(doc => doc.userId === userId);
            const cdDocs = state.customerDiagnosis.filter(doc => doc.id.startsWith(userId + '__'));

            for (let doc of portDocs) {
                await deleteFirestoreDocument(firestoreCollections.portfolioSets, doc.id);
            }
            for (let doc of cdDocs) {
                await deleteFirestoreDocument(firestoreCollections.customerDiagnosis, doc.id);
            }

            // Update local state
            state.users = state.users.filter(u => u.id !== userId);
            state.portfolioSets = state.portfolioSets.filter(doc => doc.userId !== userId);
            state.customerDiagnosis = state.customerDiagnosis.filter(doc => !doc.id.startsWith(userId + '__'));

            closeConfirmDeletePlanLightbox();
            renderCompetitorsTable();
        } catch (error) {
            console.error('Error deleting competitor data:', error);
        }
    }

    window.switchTab = switchTab;
    window.openAddRoundLightbox = openAddRoundLightbox;
    window.closeRoundLightbox = closeRoundLightbox;
    window.saveRound = saveRound;
    window.openEditRoundLightbox = openEditRoundLightbox;
    window.deleteRound = deleteRound;
    window.toggleRoundStatus = toggleRoundStatus;
    window.changeRoundsPageSize = changeRoundsPageSize;
    window.changePortsRound = changePortsRound;
    window.syncSelectedRound = syncSelectedRound;
    window.selectMainPort = selectMainPort;
    window.selectSubPort = selectSubPort;
    window.openAddPortLightbox = openAddPortLightbox;
    window.closeAddPortLightbox = closeAddPortLightbox;
    window.savePort = savePort;
    window.openEditPortLightbox = openEditPortLightbox;
    window.closeEditPortLightbox = closeEditPortLightbox;
    window.savePortEdit = savePortEdit;
    window.deletePort = deletePort;
    window.toggleExcelUploadArea = toggleExcelUploadArea;
    window.openAddSubPortLightbox = openAddSubPortLightbox;
    window.closeAddSubPortLightbox = closeAddSubPortLightbox;
    window.saveSubPortManual = saveSubPortManual;
    window.openEditSubPortLightbox = openEditSubPortLightbox;
    window.closeEditSubPortLightbox = closeEditSubPortLightbox;
    window.saveSubPortEditManual = saveSubPortEditManual;
    window.deleteSubPort = deleteSubPort;
    window.openAddProductLightbox = openAddProductLightbox;
    window.closeAddProductLightbox = closeAddProductLightbox;
    window.saveProduct = saveProduct;
    window.openEditProductLightbox = openEditProductLightbox;
    window.closeEditProductLightbox = closeEditProductLightbox;
    window.saveProductEdit = saveProductEdit;
    window.deleteProduct = deleteProduct;
    window.importProductsExcel = importProductsExcel;
    window.changeProductsPageSize = changeProductsPageSize;
    window.changeProductsGroupFilter = changeProductsGroupFilter;
    window.goToProductsPage = goToProductsPage;
    window.renderCompetitorsTable = renderCompetitorsTable;
    window.openCompetitorPortfolioSetsLightbox = openCompetitorPortfolioSetsLightbox;
    window.openCompetitorAccountSetsLightbox = openCompetitorAccountSetsLightbox;
    window.renderActivePortfolioDetails = renderActivePortfolioDetails;
    window.sendAdminPortfolioMailAsEmail = sendAdminPortfolioMailAsEmail;
    window.closeCompetitorDetailsLightbox = closeCompetitorDetailsLightbox;
    window.openConfirmDeletePlanLightbox = openConfirmDeletePlanLightbox;
    window.closeConfirmDeletePlanLightbox = closeConfirmDeletePlanLightbox;
    window.deletePlanConfirm = deletePlanConfirm;

    initFirebase();
    loadAdminData();
})();
