(function () {
    const firestoreCollections = {
        rounds: 'plan_rounds',
        activityItems: 'plan_activity_items',
        users: 'plan_user',
        products: 'plan_products',
        portfolioOverview: 'plan_portfolio_overview',
        portfolioSets: 'plan_portfolio',
        customerDiagnosis: 'plan_customer_diagnosis',
    };

    const localStorageKeys = {
        session: 'actionplan2026_user_session',
        users: 'actionplan2026_plan_user',
        portfolioOverview: 'actionplan2026_plan_portfolio_overview',
        portfolioSets: 'actionplan2026_plan_portfolio',
        customerDiagnosis: 'actionplan2026_plan_customer_diagnosis',
        adminRounds: 'actionplan2026_rounds',
        adminActivityItems: 'actionplan2026_ports',
        adminProducts: 'actionplan2026_products',
    };

    const TEMPLATE_NAMES = {
        PORTFOLIO_PLANNING: 'Portfolio Planning',
        CUSTOMER_DIAGNOSIS: 'Customer Diagnosis',
    };

    const firebaseState = {
        db: null,
        ready: false,
    };

    const state = {
        activeRound: null,
        activityItems: [],
        currentUser: null,
        activeTabId: '',
        unsubscribeActivityItems: null,
        portfolioTabState: {},
        bootcampTabState: {},
        products: [],
    };

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

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
        }
    }

    function showToast(message, tone) {
        const container = document.getElementById('toastContainer');
        if (!container) {
            return;
        }

        const toneClass = tone === 'error'
            ? 'bg-rose-600'
            : tone === 'success'
                ? 'bg-emerald-600'
                : 'bg-slate-800';

        const toast = document.createElement('div');
        toast.className = `pointer-events-auto ${toneClass} text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg`;
        toast.textContent = message;
        container.appendChild(toast);

        window.setTimeout(() => {
            toast.remove();
        }, 3200);
    }

    function readLocalArray(storageKey) {
        try {
            const rawValue = window.localStorage.getItem(storageKey);
            const parsedValue = rawValue ? JSON.parse(rawValue) : [];
            return Array.isArray(parsedValue) ? parsedValue : [];
        } catch (error) {
            return [];
        }
    }

    function writeLocalArray(storageKey, items) {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(items));
        } catch (error) {
        }
    }

    function deepMerge(target, source) {
        const result = { ...target };
        Object.keys(source).forEach((key) => {
            const sourceValue = source[key];
            const targetValue = target ? target[key] : undefined;
            if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)
                && targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
                result[key] = deepMerge(targetValue, sourceValue);
            } else {
                result[key] = sourceValue;
            }
        });
        return result;
    }

    async function loadFirestoreCollection(collectionName) {
        if (!firebaseState.ready || !firebaseState.db) {
            return [];
        }

        const snapshot = await firebaseState.db.collection(collectionName).get();
        return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
    }

    function saveSession(user) {
        try {
            window.localStorage.setItem(localStorageKeys.session, JSON.stringify({
                userId: user.id,
                roundId: user.roundId,
                name: user.name,
            }));
        } catch (error) {
        }
    }

    function readSession() {
        try {
            const rawValue = window.localStorage.getItem(localStorageKeys.session);
            return rawValue ? JSON.parse(rawValue) : null;
        } catch (error) {
            return null;
        }
    }

    function clearSession() {
        try {
            window.localStorage.removeItem(localStorageKeys.session);
        } catch (error) {
        }
    }

    async function findExistingUser(roundId, name) {
        if (firebaseState.ready && firebaseState.db) {
            const snapshot = await firebaseState.db.collection(firestoreCollections.users)
                .where('roundId', '==', roundId)
                .where('name', '==', name)
                .limit(1)
                .get();

            if (!snapshot.empty) {
                const matchedDoc = snapshot.docs[0];
                return { id: matchedDoc.id, ...matchedDoc.data() };
            }
            return null;
        }

        const localUsers = readLocalArray(localStorageKeys.users);
        return localUsers.find((user) => user.roundId === roundId && user.name === name) || null;
    }

    async function createUser(roundId, roundName, name) {
        const payload = {
            roundId,
            roundName,
            name,
            registeredAt: Date.now(),
        };

        if (firebaseState.ready && firebaseState.db) {
            const docRef = await firebaseState.db.collection(firestoreCollections.users).add(payload);
            return { id: docRef.id, ...payload };
        }

        const newUser = { id: `user-${Date.now()}`, ...payload };
        const localUsers = readLocalArray(localStorageKeys.users);
        localUsers.push(newUser);
        writeLocalArray(localStorageKeys.users, localUsers);
        return newUser;
    }

    async function getUserById(userId) {
        if (firebaseState.ready && firebaseState.db) {
            const userDoc = await firebaseState.db.collection(firestoreCollections.users).doc(userId).get();
            return userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;
        }

        const localUsers = readLocalArray(localStorageKeys.users);
        return localUsers.find((user) => user.id === userId) || null;
    }

    function initActiveRoundListener() {
        if (firebaseState.ready && firebaseState.db) {
            firebaseState.db.collection(firestoreCollections.rounds).onSnapshot((snapshot) => {
                const rounds = [];
                snapshot.forEach((doc) => {
                    rounds.push({ id: doc.id, ...doc.data() });
                });
                handleActiveRoundUpdate(rounds);
            }, (error) => {
                console.error('[bootcamp] Error listening to active round changes:', error);
            });
        } else {
            const rounds = readLocalArray(localStorageKeys.adminRounds);
            handleActiveRoundUpdate(rounds);
            window.addEventListener('storage', (e) => {
                if (e.key === localStorageKeys.adminRounds) {
                    const updatedRounds = readLocalArray(localStorageKeys.adminRounds);
                    handleActiveRoundUpdate(updatedRounds);
                }
            });
        }
    }

    function handleActiveRoundUpdate(rounds) {
        const activeRounds = rounds.filter((round) => round.status === 'on');
        state.activeRound = activeRounds[0] || null;

        const displayEl = document.getElementById('displayActiveRoundName');
        const hiddenInput = document.getElementById('selectRegRound');
        const regNameContainer = document.getElementById('regNameContainer');
        const submitButton = document.getElementById('btnSubmitRegister');

        if (state.activeRound) {
            if (displayEl) displayEl.textContent = state.activeRound.name;
            if (hiddenInput) hiddenInput.value = state.activeRound.id;
            if (regNameContainer) regNameContainer.classList.remove('hidden');
            if (submitButton) submitButton.classList.remove('hidden');
        } else {
            if (displayEl) displayEl.textContent = '-- ไม่มีรอบกิจกรรมที่เปิดลงทะเบียนในขณะนี้ --';
            if (hiddenInput) hiddenInput.value = '';
            if (regNameContainer) regNameContainer.classList.add('hidden');
            if (submitButton) submitButton.classList.add('hidden');
        }

        validateRegForm();
    }

    function validateRegForm() {
        const nameInput = document.getElementById('inputRegName');
        const submitButton = document.getElementById('btnSubmitRegister');
        if (!nameInput || !submitButton) {
            return;
        }

        const isValid = Boolean(state.activeRound) && nameInput.value.trim().length > 0;
        submitButton.disabled = !isValid;
        submitButton.classList.toggle('opacity-50', !isValid);
        submitButton.classList.toggle('cursor-not-allowed', !isValid);
    }

    async function submitRegister() {
        const nameInput = document.getElementById('inputRegName');
        const name = nameInput ? nameInput.value.trim() : '';

        if (!state.activeRound) {
            showToast('ไม่มีรอบกิจกรรมที่เปิดลงทะเบียนในขณะนี้', 'error');
            return;
        }

        if (!name) {
            showToast('กรุณากรอกชื่อทีม หรือ ชื่อผู้แข่งขัน', 'error');
            return;
        }

        const submitButton = document.getElementById('btnSubmitRegister');
        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            const existingUser = await findExistingUser(state.activeRound.id, name);
            const user = existingUser || await createUser(state.activeRound.id, state.activeRound.name, name);

            state.currentUser = user;
            saveSession(user);
            showToast(existingUser ? 'พบข้อมูลลงทะเบียนเดิม กำลังเข้าสู่ระบบ...' : 'ลงทะเบียนสำเร็จ', 'success');
            await enterSimulation(user);
        } catch (error) {
            showToast('เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง', 'error');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    }

    async function enterSimulation(user) {
        document.getElementById('viewRegister')?.classList.add('hidden');
        document.getElementById('viewOnboarding')?.classList.add('hidden');
        document.getElementById('viewSimulation')?.classList.remove('hidden');
        document.getElementById('simulationTabsMenuBar')?.classList.remove('hidden');
        document.getElementById('btnLogoutPlayer')?.classList.remove('hidden');

        const competitorNameDisplay = document.getElementById('competitorNameDisplay');
        if (competitorNameDisplay) {
            competitorNameDisplay.textContent = user.name;
        }

        const dynamicContainer = document.getElementById('dynamicTabContentContainer');
        if (dynamicContainer) {
            dynamicContainer.innerHTML = '';
        }

        state.activityItems = [];
        state.activeTabId = '';
        state.portfolioTabState = {};

        await loadProducts();
        subscribeActivityItems(user.roundId);
        registerUserRealtimeListeners(user.id);
    }

    // ---------------------------------------------------------------------
    // Product catalog (plan_products) — master Group / SubGroup reference
    // ---------------------------------------------------------------------

    async function loadProducts() {
        if (firebaseState.ready && firebaseState.db) {
            try {
                state.products = await loadFirestoreCollection(firestoreCollections.products);
                return;
            } catch (error) {
                console.error('[bootcamp] อ่าน plan_products จาก Firestore ไม่สำเร็จ ใช้ข้อมูลในเครื่องแทน', error);
            }
        }
        state.products = readLocalArray(localStorageKeys.adminProducts);
    }

    function getProductGroups() {
        const groups = [];
        state.products.forEach((product) => {
            if (product.group && !groups.includes(product.group)) {
                groups.push(product.group);
            }
        });
        return groups.sort((left, right) => String(left).localeCompare(String(right), 'th'));
    }

    function getSubGroupsForGroup(group) {
        const subGroups = [];
        state.products.forEach((product) => {
            if (product.group === group && product.subGroup && !subGroups.includes(product.subGroup)) {
                subGroups.push(product.subGroup);
            }
        });
        return subGroups.sort((left, right) => String(left).localeCompare(String(right), 'th'));
    }

    function getUnitForGroup(group) {
        const match = state.products.find((product) => product.group === group && product.unit);
        return match ? match.unit : '';
    }

    window.unsubscribeUserPortfolio = null;
    window.unsubscribeUserBootcamp = null;

    function registerUserRealtimeListeners(userId) {
        if (window.unsubscribeUserPortfolio) window.unsubscribeUserPortfolio();
        if (window.unsubscribeUserBootcamp) window.unsubscribeUserBootcamp();

        if (!firebaseState.ready || !firebaseState.db) return;

        // 1. Listen to Portfolio Planning sets
        window.unsubscribeUserPortfolio = firebaseState.db.collection(firestoreCollections.portfolioSets)
            .where('userId', '==', userId)
            .onSnapshot((snapshot) => {
                const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((left, right) => Number(left.setIndex || 0) - Number(right.setIndex || 0));

                const grouped = {};
                docs.forEach(doc => {
                    const activityItemId = doc.activityItemId;
                    if (!grouped[activityItemId]) grouped[activityItemId] = [];
                    grouped[activityItemId].push(doc);
                });

                for (const itemId in state.portfolioTabState) {
                    const tabState = state.portfolioTabState[itemId];
                    const updatedSets = (grouped[itemId] || []).map(normalizeSet);

                    const oldIds = tabState.sets.map(s => s.id).join(',');
                    const newIds = updatedSets.map(s => s.id).join(',');

                    if (oldIds !== newIds) {
                        tabState.sets = updatedSets;
                        if (!tabState.sets.some(s => s.id === tabState.activeSetId)) {
                            tabState.activeSetId = tabState.sets[0] ? tabState.sets[0].id : '';
                        }
                        renderPortfolioSetsBar(itemId);
                        renderPortfolioSetBody(itemId);
                    } else {
                        updatedSets.forEach(newSet => {
                            const existing = tabState.sets.find(s => s.id === newSet.id);
                            if (existing) {
                                Object.keys(newSet).forEach(key => {
                                    existing[key] = newSet[key];
                                });
                            }
                        });
                        if (tabState.activeSetId) {
                            refreshTotalsBar(itemId, tabState.activeSetId);
                        }
                    }
                }
            });

        // 2. Listen to Bootcamp (Customer Diagnosis) sets
        window.unsubscribeUserBootcamp = firebaseState.db.collection(firestoreCollections.customerDiagnosis)
            .onSnapshot((snapshot) => {
                snapshot.docs.forEach(doc => {
                    if (doc.id.startsWith(userId + '__')) {
                        const activityItemId = doc.id.split('__')[1];
                        const data = doc.data();
                        const sets = data.sets || [];

                        const tabState = state.bootcampTabState[activityItemId];
                        if (tabState) {
                            const oldIds = tabState.sets.map(s => s.id).join(',');
                            const newIds = sets.map(s => s.id).join(',');

                            if (oldIds !== newIds) {
                                tabState.sets = sets;
                                if (!sets.some(s => s.id === tabState.activeSetId)) {
                                    tabState.activeSetId = sets[0] ? sets[0].id : '';
                                }
                                renderBootcampSetsBar(activityItemId);
                                renderBootcampSetBody(activityItemId);
                            } else {
                                tabState.sets = sets;
                            }
                        }
                    }
                });
            });
    }

    function subscribeActivityItems(roundId) {
        if (state.unsubscribeActivityItems) {
            state.unsubscribeActivityItems();
            state.unsubscribeActivityItems = null;
        }

        if (firebaseState.ready && firebaseState.db) {
            state.unsubscribeActivityItems = firebaseState.db.collection(firestoreCollections.activityItems)
                .where('roundId', '==', roundId)
                .onSnapshot((snapshot) => {
                    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                    handleActivityItemsSnapshot(items);
                });
            return;
        }

        const items = readLocalArray(localStorageKeys.adminActivityItems).filter((item) => item.roundId === roundId);
        handleActivityItemsSnapshot(items);
    }

    function handleActivityItemsSnapshot(rawItems) {
        const sortedItems = rawItems.slice().sort((left, right) => Number(left.displayOrder || 0) - Number(right.displayOrder || 0));
        const newIds = new Set(sortedItems.map((item) => item.id));

        state.activityItems.forEach((oldItem) => {
            if (!newIds.has(oldItem.id)) {
                document.getElementById(`simTabContent-${oldItem.id}`)?.remove();
                delete state.portfolioTabState[oldItem.id];
            }
        });

        state.activityItems = sortedItems;
        ensureActiveTab();
        syncTabButtons();
        syncTabContents();
        applyActiveVisibility();
    }

    function ensureActiveTab() {
        const activeStillValid = state.activityItems.some((item) => item.id === state.activeTabId && item.status === 'on');
        if (!activeStillValid) {
            const firstEnabled = state.activityItems.find((item) => item.status === 'on');
            state.activeTabId = firstEnabled ? firstEnabled.id : '';
        }
    }

    function syncTabButtons() {
        const tabsBar = document.getElementById('simulationTabsMenuBar');
        if (!tabsBar) {
            return;
        }

        if (!state.activityItems.length) {
            tabsBar.innerHTML = '<span class="text-xs text-slate-400 py-2 px-2">-- ไม่มีเมนูกิจกรรมสำหรับรอบนี้ --</span>';
            return;
        }

        tabsBar.innerHTML = state.activityItems.map((item) => {
            const isEnabled = item.status === 'on';
            const isActive = isEnabled && item.id === state.activeTabId;
            const template = resolveTemplate(item);
            const stateClass = !isEnabled
                ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                : isActive
                    ? (template === 'customerDiagnosis' ? 'bg-orange-600 text-white shadow-md' : 'bg-blue-800 text-white shadow-md')
                    : 'text-slate-600 hover:bg-slate-100';

            return `<button id="tabButton-${item.id}" ${isEnabled ? `onclick="switchActiveTab('${item.id}')"` : 'disabled'}
                class="px-6 py-2 rounded-xl font-bold text-xs transition duration-200 ${stateClass}">
                ${escapeHtml(item.name)}
            </button>`;
        }).join('');
    }

    function syncTabContents() {
        const container = document.getElementById('dynamicTabContentContainer');
        if (!container) {
            return;
        }

        state.activityItems.forEach((item) => {
            if (document.getElementById(`simTabContent-${item.id}`)) {
                return;
            }

            const template = resolveTemplate(item);
            let element;
            if (template === 'portfolioPlanning') {
                element = mountPortfolioPlanningTab(item);
            } else if (template === 'customerDiagnosis') {
                element = mountCustomerDiagnosisTab(item);
            } else {
                element = mountBlankTab(item);
            }

            element.classList.add('hidden');
            container.appendChild(element);
        });
    }

    function applyActiveVisibility() {
        state.activityItems.forEach((item) => {
            const el = document.getElementById(`simTabContent-${item.id}`);
            if (el) {
                el.classList.toggle('hidden', item.id !== state.activeTabId);
            }
        });
    }

    function switchActiveTab(tabId) {
        const target = state.activityItems.find((item) => item.id === tabId);
        if (!target || target.status !== 'on') {
            return;
        }

        state.activeTabId = tabId;
        syncTabButtons();
        applyActiveVisibility();
    }

    function resolveTemplate(item) {
        if (item.template) {
            return item.template;
        }

        const name = (item.name || '').trim();
        if (name === TEMPLATE_NAMES.PORTFOLIO_PLANNING) {
            return 'portfolioPlanning';
        }
        if (name === TEMPLATE_NAMES.CUSTOMER_DIAGNOSIS || name === 'Account Planning Bootcamp') {
            return 'customerDiagnosis';
        }
        return 'blank';
    }

    function mountBlankTab(item) {
        const wrapper = document.createElement('div');
        wrapper.id = `simTabContent-${item.id}`;
        wrapper.className = 'bg-white rounded-2xl p-6 border border-slate-200 shadow-sm w-full min-h-[400px]';
        return wrapper;
    }

    // ---------------------------------------------------------------------
    // Singleton per-user-per-tab documents (portfolio overview / customer diagnosis)
    // ---------------------------------------------------------------------

    const singletonDocs = {
        portfolioOverview: { collection: firestoreCollections.portfolioOverview, localKey: localStorageKeys.portfolioOverview },
        customerDiagnosis: { collection: firestoreCollections.customerDiagnosis, localKey: localStorageKeys.customerDiagnosis },
    };

    async function getSingletonDoc(kind, docId) {
        const config = singletonDocs[kind];
        if (firebaseState.ready && firebaseState.db) {
            try {
                const snapshot = await firebaseState.db.collection(config.collection).doc(docId).get();
                return snapshot.exists ? snapshot.data() : null;
            } catch (error) {
                console.error(`[bootcamp] อ่าน ${config.collection} จาก Firestore ไม่สำเร็จ ใช้ข้อมูลในเครื่องแทน`, error);
            }
        }

        const items = readLocalArray(config.localKey);
        return items.find((entry) => entry.id === docId) || null;
    }

    async function saveSingletonDoc(kind, docId, payload) {
        const config = singletonDocs[kind];
        const fullPayload = { ...payload, updatedAt: Date.now() };

        if (firebaseState.ready && firebaseState.db) {
            try {
                await firebaseState.db.collection(config.collection).doc(docId).set(fullPayload, { merge: true });
                return;
            } catch (error) {
                console.error(`[bootcamp] บันทึก ${config.collection} ลง Firestore ไม่สำเร็จ บันทึกในเครื่องแทน`, error);
            }
        }

        const items = readLocalArray(config.localKey);
        const index = items.findIndex((entry) => entry.id === docId);
        if (index > -1) {
            items[index] = deepMerge(items[index], { ...fullPayload, id: docId });
        } else {
            items.push({ id: docId, ...fullPayload });
        }
        writeLocalArray(config.localKey, items);
    }

    function buildNestedPayload(base, path, value) {
        const payload = { ...base };
        let cursor = payload;
        path.forEach((key, index) => {
            if (index === path.length - 1) {
                cursor[key] = value;
            } else {
                cursor[key] = {};
                cursor = cursor[key];
            }
        });
        return payload;
    }

    function bindAutoSaveField(el, onSave) {
        if (!el) {
            return;
        }
        el.addEventListener('blur', () => onSave(el.value));
    }

    // ---------------------------------------------------------------------
    // Template: Portfolio Planning
    // ---------------------------------------------------------------------

    function buildBlankRows() {
        const blankRow = () => ({ target: '', actionPlan: '', group: '', subGroup: '', amount: 0 });
        return {
            GRAB: Array.from({ length: 5 }, blankRow),
            GROW: Array.from({ length: 5 }, blankRow),
            GUARD: Array.from({ length: 5 }, blankRow),
        };
    }

    function getAllSubgroups() {
        const subGroups = [];
        state.products.forEach((product) => {
            if (product.subGroup && !subGroups.includes(product.subGroup)) {
                subGroups.push(product.subGroup);
            }
        });
        return subGroups.sort((left, right) => String(left).localeCompare(String(right), 'th'));
    }

    function renderAllSubgroupOptions(selectedSubGroup) {
        const options = getAllSubgroups()
            .map((subGroup) => `<option value="${escapeHtml(subGroup)}" ${subGroup === selectedSubGroup ? 'selected' : ''}>${escapeHtml(subGroup)}</option>`)
            .join('');
        return `<option value="">เลือกผลิตภัณฑ์</option>${options}`;
    }

    function getGroupForSubGroup(subGroup) {
        const match = state.products.find((p) => p.subGroup === subGroup);
        return match ? match.group : '';
    }

    const totalBoxMapping = [
        { label: 'Deposit', dbGroup: 'Deposit', unit: 'บาท' },
        { label: 'BA', dbGroup: 'BA', unit: 'บาท' },
        { label: 'MF', dbGroup: 'MF', unit: 'บาท' },
        { label: 'SN', dbGroup: 'SN', unit: 'บาท' },
        { label: 'Qualified WB/PB', dbGroup: 'Portfolio', unit: 'คน' },
        { label: 'Relation', dbGroup: 'Relationship', unit: 'คน' },
    ];

    function computeGroupTotals(set) {
        const counts = {};
        ['GRAB', 'GROW', 'GUARD'].forEach((category) => {
            (set.rows[category] || []).forEach((row) => {
                if (row.subGroup) {
                    const group = getGroupForSubGroup(row.subGroup);
                    if (group) {
                        const amountVal = Number(row.amount || 0);
                        counts[group] = (counts[group] || 0) + amountVal;
                    }
                }
            });
        });
        return counts;
    }

    function renderTotalsBar(set) {
        const counts = computeGroupTotals(set);
        return totalBoxMapping.map((item) => {
            const count = counts[item.dbGroup] || 0;
            // Format number with commas for better reading
            const formatted = count.toLocaleString('th-TH');
            return `<div class="flex items-center gap-1">
                <div class="text-left">
                    <span class="block text-[11px] font-bold text-slate-800 mb-0.5">${escapeHtml(item.label)}</span>
                    <div class="flex items-center gap-1.5">
                        <div class="min-w-28 px-3 h-7 bg-white border border-slate-200 rounded flex items-center justify-center text-xs font-black text-orange-700 shadow-sm">
                            ${formatted}
                        </div>
                        <span class="text-xs text-slate-600 font-semibold">${escapeHtml(item.unit)}</span>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    function refreshTotalsBar(itemId, setId) {
        const container = document.getElementById(`totalsBar-${setId}`);
        const set = findSet(itemId, setId);
        if (container && set) {
            container.innerHTML = renderTotalsBar(set);
        }
    }

    async function listPortfolioSets(userId, activityItemId) {
        if (firebaseState.ready && firebaseState.db) {
            try {
                const snapshot = await firebaseState.db.collection(firestoreCollections.portfolioSets)
                    .where('userId', '==', userId)
                    .where('activityItemId', '==', activityItemId)
                    .get();
                return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
                    .sort((left, right) => Number(left.setIndex || 0) - Number(right.setIndex || 0));
            } catch (error) {
                console.error('[bootcamp] อ่าน plan_portfolio_sets จาก Firestore ไม่สำเร็จ ใช้ข้อมูลในเครื่องแทน', error);
            }
        }

        return readLocalArray(localStorageKeys.portfolioSets)
            .filter((entry) => entry.userId === userId && entry.activityItemId === activityItemId)
            .sort((left, right) => Number(left.setIndex || 0) - Number(right.setIndex || 0));
    }

    async function createPortfolioSet(userId, roundId, activityItemId, setIndex) {
        const payload = {
            userId,
            roundId,
            activityItemId,
            setIndex,
            topic: '',
            description: '',
            overview: '',
            gap: '',
            opportunity: '',
            rows: buildBlankRows(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        if (firebaseState.ready && firebaseState.db) {
            try {
                const docRef = await firebaseState.db.collection(firestoreCollections.portfolioSets).add(payload);
                return { id: docRef.id, ...payload };
            } catch (error) {
                console.error('[bootcamp] สร้าง plan_portfolio_sets ใน Firestore ไม่สำเร็จ บันทึกในเครื่องแทน', error);
            }
        }

        const newSet = { id: `set-${Date.now()}`, ...payload };
        const items = readLocalArray(localStorageKeys.portfolioSets);
        items.push(newSet);
        writeLocalArray(localStorageKeys.portfolioSets, items);
        return newSet;
    }

    async function updatePortfolioSet(setId, payload) {
        const fullPayload = { ...payload, updatedAt: Date.now() };

        if (firebaseState.ready && firebaseState.db) {
            try {
                await firebaseState.db.collection(firestoreCollections.portfolioSets).doc(setId).set(fullPayload, { merge: true });
                return;
            } catch (error) {
                console.error('[bootcamp] อัปเดต plan_portfolio_sets ใน Firestore ไม่สำเร็จ บันทึกในเครื่องแทน', error);
            }
        }

        const items = readLocalArray(localStorageKeys.portfolioSets);
        const index = items.findIndex((entry) => entry.id === setId);
        if (index > -1) {
            items[index] = deepMerge(items[index], fullPayload);
        } else {
            items.push({ id: setId, ...fullPayload });
        }
        writeLocalArray(localStorageKeys.portfolioSets, items);
    }

    async function deletePortfolioSet(setId) {
        if (firebaseState.ready && firebaseState.db) {
            try {
                await firebaseState.db.collection(firestoreCollections.portfolioSets).doc(setId).delete();
                return;
            } catch (error) {
                console.error('[bootcamp] ลบ plan_portfolio_sets ใน Firestore ไม่สำเร็จ ลบในเครื่องแทน', error);
            }
        }

        const items = readLocalArray(localStorageKeys.portfolioSets).filter((entry) => entry.id !== setId);
        writeLocalArray(localStorageKeys.portfolioSets, items);
    }

    function getUnitForSubGroup(subGroup) {
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
    }

    window.currentMailScale = 1.0;
    
    window.adjustMailFontSize = (amount) => {
        window.currentMailScale = Math.max(0.7, Math.min(2.0, window.currentMailScale + amount));
        const container = document.getElementById('presenterMailContentArea') || document.getElementById('bootcampPresenterMailContentArea');
        if (container) {
            container.querySelectorAll('.text-xs, .text-sm, .text-xl, .text-lg, .text-2xl, p, span, h2, h4, h5, li, strong, th, td').forEach(el => {
                if (!el.dataset.origSize) {
                    const computed = window.getComputedStyle(el).fontSize;
                    el.dataset.origSize = parseFloat(computed);
                }
                const orig = parseFloat(el.dataset.origSize);
                el.style.fontSize = `${orig * window.currentMailScale}px`;
                el.style.lineHeight = 'normal';
            });
        }
    };

    window.openPresenterMailLightbox = (setId) => {
        let set = null;
        let setIndex = 1;
        let setItemId = '';
        for (const itemId in state.portfolioTabState) {
            const list = state.portfolioTabState[itemId]?.sets || [];
            const idx = list.findIndex((s) => s.id === setId);
            if (idx !== -1) {
                set = list[idx];
                setIndex = idx + 1;
                setItemId = itemId;
                break;
            }
        }
        if (!set) return;

        window.currentMailScale = 1.0; // Reset scale on open
        const presenterName = state.currentUser ? state.currentUser.name : 'ไม่ระบุ';

        let modal = document.getElementById('presenterMailLightboxModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'presenterMailLightboxModal';
            modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
            document.body.appendChild(modal);
        }

        modal.classList.remove('hidden');

        const renderCategoryOutcomeRows = (cat) => {
            const rows = set.rows[cat] || [];
            const targetText = rows[0]?.target || '-';
            const actionText = rows[0]?.actionPlan || '-';

            const productList = rows.map((row) => {
                if (!row.subGroup) return '';
                const unit = getUnitForSubGroup(row.subGroup);
                const amt = formatNumberWithCommas(row.amount || 0);
                return `<li class="text-xs text-slate-700 list-disc list-inside">${escapeHtml(row.subGroup)}: <strong class="text-blue-800">${amt}</strong> ${unit}</li>`;
            }).filter(Boolean).join('');

            return `
                <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
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

        modal.innerHTML = `
            <div class="bg-white w-[95vw] h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div class="flex items-center gap-2">
                        <span class="font-extrabold text-slate-800 text-sm">ข้อมูลสรุปแผนงาน (Portfolio Planning)</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <button onclick="adjustMailFontSize(0.1)" class="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center transition" title="ขยายตัวอักษร">
                            <i class="fa-solid fa-magnifying-glass-plus text-base"></i>
                        </button>
                        <button onclick="adjustMailFontSize(-0.1)" class="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center transition" title="ลดตัวอักษร">
                            <i class="fa-solid fa-magnifying-glass-minus text-base"></i>
                        </button>
                        <button onclick="sendPresenterMailAsEmail('${set.id}')" class="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-400 transition" title="ส่งจดหมาย (ดาวน์โหลดภาพแผนงาน)">
                            <i class="fa-solid fa-envelope text-lg"></i>
                        </button>
                        <button onclick="closePresenterMailLightbox()" class="w-8 h-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-400 transition" title="ปิด">
                            <i class="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>
                </div>
                <!-- Content Body Wrapper (Target for html2canvas) -->
                <div id="presenterMailContentArea" class="flex-grow p-8 overflow-y-auto space-y-6 bg-white">
                    <div class="text-center space-y-2 shrink-0">
                        <h2 class="text-xl font-black text-slate-800">Account Planning Bootcamp (แผนงานที่ ${setIndex})</h2>
                        <p class="text-xs font-semibold text-blue-600">ผู้นำเสนอแผนงาน: ${escapeHtml(presenterName)}</p>
                    </div>

                    <div class="bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-xl shadow-sm">
                        <span class="text-xs font-bold text-slate-400 mr-1">ชื่อเรื่อง:</span>
                        <span class="text-sm font-normal text-slate-800">${escapeHtml(set.topic || '-')}</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="bg-[#e9f0f8] border border-slate-200 rounded-2xl p-5 space-y-2 text-left">
                            <h4 class="text-xs font-black text-slate-800">1. Portfolio Overview</h4>
                            <p class="text-xs text-slate-700 whitespace-pre-wrap">${escapeHtml(set.overview || '-')}</p>
                        </div>
                        <div class="bg-[#e9f0f8] border border-slate-200 rounded-2xl p-5 space-y-2 text-left">
                            <h4 class="text-xs font-black text-slate-800">2. Gap</h4>
                            <p class="text-xs text-slate-700 whitespace-pre-wrap">${escapeHtml(set.gap || '-')}</p>
                        </div>
                        <div class="bg-[#e9f0f8] border border-slate-200 rounded-2xl p-5 space-y-2 text-left">
                            <h4 class="text-xs font-black text-slate-800">3. Opportunity</h4>
                            <p class="text-xs text-slate-700 whitespace-pre-wrap">${escapeHtml(set.opportunity || '-')}</p>
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
    };

    window.openBootcampPresenterMailLightbox = (itemId, setId) => {
        const tabState = state.bootcampTabState[itemId];
        if (!tabState) return;
        const set = tabState.sets.find(s => s.id === setId);
        if (!set) return;

        window.currentMailScale = 1.0; // Reset scale on open
        const setIndex = tabState.sets.indexOf(set) + 1;
        const presenterName = state.currentUser ? state.currentUser.name : 'ไม่ระบุ';

        let modal = document.getElementById('presenterMailLightboxModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'presenterMailLightboxModal';
            modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
            document.body.appendChild(modal);
        }

        modal.classList.remove('hidden');

        const act = set.act || { aim: '', consult: '', track: '' };
        const ion = set.ion || { improve: '', operate: '', notice: '' };
        const diag = set.diagnosis || { goalAndLimit: '', idealPortfolio: '', currentPortfolio: '', portfolioSymptom: '', potentialImpact: '', adjustmentGuideline: '' };
        const solutions = set.financialSolutions || [];

        const formatValueWithCommas = (val) => {
            if (!val) return '-';
            const clean = String(val).replace(/,/g, '');
            const num = Number(clean);
            return isNaN(num) ? val : num.toLocaleString('th-TH');
        };

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

        modal.innerHTML = `
            <div class="bg-white w-[95vw] h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div class="flex items-center gap-2">
                        <span class="font-extrabold text-slate-800 text-sm">ข้อมูลสรุปแผนงาน (Account Planning Bootcamp)</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <button onclick="adjustMailFontSize(0.1)" class="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center transition" title="ขยายตัวอักษร">
                            <i class="fa-solid fa-magnifying-glass-plus text-base"></i>
                        </button>
                        <button onclick="adjustMailFontSize(-0.1)" class="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center transition" title="ลดตัวอักษร">
                            <i class="fa-solid fa-magnifying-glass-minus text-base"></i>
                        </button>
                        <button onclick="sendBootcampPresenterMailAsEmail('${itemId}', '${set.id}')" class="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-400 transition" title="ส่งจดหมาย (ดาวน์โหลดภาพแผนงาน)">
                            <i class="fa-solid fa-envelope text-lg"></i>
                        </button>
                        <button onclick="closePresenterMailLightbox()" class="w-8 h-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-400 transition" title="ปิด">
                            <i class="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>
                </div>
                <!-- Content Body Wrapper (Target for html2canvas) -->
                <div id="bootcampPresenterMailContentArea" class="flex-grow p-8 overflow-y-auto space-y-6 bg-white">
                    <div class="text-center space-y-2 shrink-0">
                        <h2 class="text-xl font-black text-slate-800">Account Planning Bootcamp (แผนงานที่ ${setIndex})</h2>
                        <p class="text-xs font-semibold text-blue-600">ผู้นำเสนอแผนงาน: ${escapeHtml(presenterName)}</p>
                    </div>

                    <div class="bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-xl shadow-sm text-left">
                        <span class="text-xs font-bold text-slate-400 mr-1">ชื่อเรื่อง:</span>
                        <span class="text-sm font-normal text-slate-800">${escapeHtml(set.topic || '-')}</span>
                    </div>

                    <!-- ข้อมูลลูกค้า -->
                    <div class="bgblue text-white rounded-2xl p-4 text-left space-y-1">
                        <span class="block text-xs font-bold opacity-75">ข้อมูลลูกค้า</span>
                        <p class="whitespace-pre-line font-normal text-xs">${escapeHtml(set.customerInfo || '-')}</p>
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
    };

    window.closePresenterMailLightbox = () => {
        const modal = document.getElementById('presenterMailLightboxModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    };

    window.sendPresenterMailAsEmail = (setId) => {
        const container = document.getElementById('presenterMailContentArea');
        if (!container) return;

        let set = null;
        let setIndex = 1;
        for (const itemId in state.portfolioTabState) {
            const list = state.portfolioTabState[itemId]?.sets || [];
            const idx = list.findIndex((s) => s.id === setId);
            if (idx !== -1) {
                set = list[idx];
                setIndex = idx + 1;
                break;
            }
        }
        if (!set) return;

        const presenterName = state.currentUser ? state.currentUser.name : 'ไม่ระบุ';
        const subjectText = `Account Planning Bootcamp (แผนงานที่ ${setIndex}) โดย ${presenterName}`;

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
    };

    window.sendBootcampPresenterMailAsEmail = (itemId, setId) => {
        const container = document.getElementById('bootcampPresenterMailContentArea');
        if (!container) return;

        const tabState = state.bootcampTabState[itemId];
        if (!tabState) return;
        const set = tabState.sets.find(s => s.id === setId);
        if (!set) return;

        const setIndex = tabState.sets.indexOf(set) + 1;
        const presenterName = state.currentUser ? state.currentUser.name : 'ไม่ระบุ';
        const subjectText = `Account Planning Bootcamp (แผนงานที่ ${setIndex}) โดย ${presenterName}`;

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
    };

    function formatNumberWithCommas(val) {
        const num = Number(val);
        return isNaN(num) ? '0' : num.toLocaleString('th-TH');
    }

    function parseNumberString(val) {
        const num = Number(String(val).replace(/[^0-9.-]/g, ''));
        return isNaN(num) ? 0 : num;
    }

    window.openGraphLightbox = (setId) => {
        let set = null;
        for (const itemId in state.portfolioTabState) {
            const match = (state.portfolioTabState[itemId]?.sets || []).find((s) => s.id === setId);
            if (match) {
                set = match;
                break;
            }
        }
        if (!set) return;

        const totals = computeGroupTotals(set);
        const deposit = totals['Deposit'] || 0;
        const ba = totals['BA'] || 0;
        const mf = totals['MF'] || 0;
        const sn = totals['SN'] || 0;
        const qualified = totals['Portfolio'] || 0;
        const relation = totals['Relationship'] || 0;

        let modal = document.getElementById('graphLightboxModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'graphLightboxModal';
            modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-white w-[90vw] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                    <!-- Header -->
                    <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <span class="text-sm font-bold text-slate-800">กราฟวิเคราะห์ผลิตภัณฑ์ (Product Analysis Charts)</span>
                        <button onclick="closeGraphLightbox()" class="w-8 h-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-400 transition" title="ปิด">
                            <i class="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>
                    <!-- Body -->
                    <div class="flex-grow p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center overflow-y-auto">
                        <div class="flex flex-col items-center justify-center h-full min-h-[300px]">
                            <h4 class="text-sm font-bold text-slate-700 mb-4">สัดส่วนผลิตภัณฑ์ (Deposit, BA, MF, SN)</h4>
                            <div class="w-full max-w-[320px] max-h-[320px]">
                                <canvas id="pieChartCanvas"></canvas>
                            </div>
                        </div>
                        <div class="flex flex-col items-center justify-center h-full min-h-[300px]">
                            <h4 class="text-sm font-bold text-slate-700 mb-4 font-sans">จำนวนพอร์ต (Qualified WB/PB & Relation)</h4>
                            <div class="w-full max-w-[400px] max-h-[320px]">
                                <canvas id="barChartCanvas"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        modal.classList.remove('hidden');

        if (window.myPieChart) window.myPieChart.destroy();
        if (window.myBarChart) window.myBarChart.destroy();

        const ctxPie = document.getElementById('pieChartCanvas').getContext('2d');
        window.myPieChart = new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: ['Deposit', 'BA', 'MF', 'SN'],
                datasets: [{
                    data: [deposit, ba, mf, sn],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let sum = context.dataset.data.reduce((a, b) => a + b, 0);
                                let val = context.raw;
                                let pct = sum > 0 ? ((val / sum) * 100).toFixed(1) + '%' : '0%';
                                return `${context.label}: ${val.toLocaleString('th-TH')} บาท (${pct})`;
                            }
                        }
                    }
                }
            }
        });

        const ctxBar = document.getElementById('barChartCanvas').getContext('2d');
        window.myBarChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: ['Qualified WB/PB', 'Relation'],
                datasets: [{
                    label: 'จำนวน (ราย/คน)',
                    data: [qualified, relation],
                    backgroundColor: ['#8b5cf6', '#6366f1'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    };

    window.closeGraphLightbox = () => {
        const modal = document.getElementById('graphLightboxModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    };

    function showDeleteConfirmLightbox(itemId, setId) {
        let modal = document.getElementById('deleteConfirmLightboxModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'deleteConfirmLightboxModal';
            modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-white w-[400px] rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4">
                    <h3 class="text-base font-black text-slate-800">ยืนยันการลบชุดข้อมูล</h3>
                    <p class="text-xs text-slate-500">กรุณาพิมพ์ข้อความ <strong class="text-rose-600">Delete Page</strong> เพื่อยืนยันการลบชุดข้อมูลนี้</p>
                    <input type="text" id="deleteConfirmInput" placeholder="Delete Page" class="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none focus:border-rose-500">
                    <div class="flex items-center gap-3 justify-end pt-2">
                        <button id="btnCancelDelete" class="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition">ยกเลิก</button>
                        <button id="btnConfirmDelete" disabled class="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-lg transition disabled:bg-rose-300 disabled:opacity-50 disabled:cursor-not-allowed">ยืนยัน</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        modal.classList.remove('hidden');
        const input = document.getElementById('deleteConfirmInput');
        const btnConfirm = document.getElementById('btnConfirmDelete');
        const btnCancel = document.getElementById('btnCancelDelete');

        input.value = '';
        btnConfirm.disabled = true;

        input.oninput = () => {
            btnConfirm.disabled = input.value !== 'Delete Page';
        };

        btnConfirm.onclick = async () => {
            modal.classList.add('hidden');
            const tabState = state.portfolioTabState[itemId];
            if (!tabState) return;
            await deletePortfolioSet(setId);
            tabState.sets = tabState.sets.filter((entry) => entry.id !== setId);
            if (tabState.activeSetId === setId) {
                tabState.activeSetId = tabState.sets[0].id;
            }
            renderPortfolioSetsBar(itemId);
            renderPortfolioSetBody(itemId);
        };

        btnCancel.onclick = () => {
            modal.classList.add('hidden');
        };
    }

    function updateRowBgColors(selectEl, amountEl, hasSubgroup) {
        if (!selectEl || !amountEl) return;
        if (hasSubgroup) {
            selectEl.style.backgroundColor = '#d1fae5'; // soft green
            selectEl.classList.remove('text-slate-600');
            selectEl.classList.add('text-emerald-800');

            amountEl.style.backgroundColor = '#d1fae5'; // soft green
            amountEl.classList.remove('text-slate-600');
            amountEl.classList.add('text-emerald-800');
        } else {
            selectEl.style.backgroundColor = '#e2e8f0'; // gray 25%
            selectEl.classList.remove('text-emerald-800');
            selectEl.classList.add('text-slate-600');

            amountEl.style.backgroundColor = '#e2e8f0'; // gray 25%
            amountEl.classList.remove('text-emerald-800');
            amountEl.classList.add('text-slate-600');
        }
    }

    window.openLightbox = (title, originalSelector, onSaveCallback) => {
        let modal = document.getElementById('globalLightboxModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'globalLightboxModal';
            modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-[#e9f0f8] w-[90vw] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                    <!-- Header -->
                    <div class="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <span id="lightboxTitle" class="text-sm font-bold text-slate-800"></span>
                        <div class="flex items-center gap-4">
                            <button onclick="zoomLightboxFont(1)" class="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition" title="ขยายตัวอักษร">
                                <i class="fa-solid fa-magnifying-glass-plus text-sm"></i>
                            </button>
                            <button onclick="zoomLightboxFont(-1)" class="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition" title="ลดขนาดตัวอักษร">
                                <i class="fa-solid fa-magnifying-glass-minus text-sm"></i>
                            </button>
                            <button onclick="closeLightboxModal()" class="w-8 h-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-400 transition" title="ปิด">
                                <i class="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>
                    </div>
                    <!-- Body -->
                    <div class="flex-grow p-6 flex flex-col">
                        <textarea id="lightboxTextarea" class="w-full flex-grow p-4 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-normal text-slate-800 resize-none shadow-inner" style="background-color: #ffffff; font-size: 14px;"></textarea>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        modal.classList.remove('hidden');
        document.getElementById('lightboxTitle').textContent = title;

        const textarea = document.getElementById('lightboxTextarea');
        const originalEl = document.querySelector(originalSelector);
        textarea.value = originalEl ? originalEl.value : '';
        textarea.style.fontSize = '14px'; // Reset font size zoom

        textarea.oninput = () => {
            if (originalEl) {
                originalEl.value = textarea.value;
                if (onSaveCallback) {
                    onSaveCallback(textarea.value);
                }
            }
        };
    };

    window.zoomLightboxFont = (direction) => {
        const textarea = document.getElementById('lightboxTextarea');
        if (!textarea) return;
        let size = parseInt(textarea.style.fontSize || '14px');
        size += direction * 2;
        if (size < 10) size = 10;
        if (size > 36) size = 36;
        textarea.style.fontSize = size + 'px';
    };

    window.closeLightboxModal = () => {
        const modal = document.getElementById('globalLightboxModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    };

    function mountPortfolioPlanningTab(item) {
        const wrapper = document.createElement('div');
        wrapper.id = `simTabContent-${item.id}`;
        wrapper.className = 'w-full flex flex-col gap-4';
        wrapper.innerHTML = `
            <div id="portfolioSetsTabBar-${item.id}" class="flex flex-wrap gap-2 items-center border-b border-slate-200 pb-3"></div>
            <div id="portfolioSetBody-${item.id}" class="flex flex-col gap-4"></div>
        `;

        state.portfolioTabState[item.id] = { sets: [], activeSetId: '' };
        initPortfolioPlanningData(item);

        return wrapper;
    }

    async function initPortfolioPlanningData(item) {
        const user = state.currentUser;
        if (!user) {
            return;
        }

        const docId = `${user.id}__${item.id}`;
        const overviewDoc = await getSingletonDoc('portfolioOverview', docId) || {};

        let sets = await listPortfolioSets(user.id, item.id);
        if (!sets.length) {
            const firstSet = await createPortfolioSet(user.id, user.roundId, item.id, 1);
            if (overviewDoc.overview || overviewDoc.gap || overviewDoc.opportunity) {
                firstSet.overview = overviewDoc.overview || '';
                firstSet.gap = overviewDoc.gap || '';
                firstSet.opportunity = overviewDoc.opportunity || '';
                await updatePortfolioSet(firstSet.id, {
                    overview: firstSet.overview,
                    gap: firstSet.gap,
                    opportunity: firstSet.opportunity
                });
            }
            sets = [firstSet];
        }
        sets = sets.map((s) => normalizeSet(s, overviewDoc));

        const tabState = state.portfolioTabState[item.id];
        if (!tabState) {
            return;
        }
        tabState.sets = sets;
        tabState.activeSetId = sets[0].id;
        renderPortfolioSetsBar(item.id);
        renderPortfolioSetBody(item.id);
    }

    function normalizeSet(set) {
        if (!set.rows || typeof set.rows !== 'object') {
            set.rows = buildBlankRows();
        }
        const blank = buildBlankRows();
        ['GRAB', 'GROW', 'GUARD'].forEach((category) => {
            if (!Array.isArray(set.rows[category])) {
                set.rows[category] = blank[category];
            } else {
                set.rows[category] = set.rows[category].map((row) => ({
                    target: row.target || '',
                    actionPlan: row.actionPlan || '',
                    group: row.group || '',
                    subGroup: row.subGroup || '',
                    amount: row.amount !== undefined ? Number(row.amount) : 0
                }));
            }
        });
        return set;
    }

    function findSet(itemId, setId) {
        return (state.portfolioTabState[itemId]?.sets || []).find((entry) => entry.id === setId) || null;
    }

    function renderPortfolioSetsBar(itemId) {
        const bar = document.getElementById(`portfolioSetsTabBar-${itemId}`);
        const tabState = state.portfolioTabState[itemId];
        if (!bar || !tabState) {
            return;
        }

        const canDelete = tabState.sets.length > 1;
        bar.innerHTML = tabState.sets.map((set, index) => {
            const isActive = set.id === tabState.activeSetId;
            return `<div class="flex items-center rounded-xl overflow-hidden ${isActive ? 'bg-blue-800' : 'bg-slate-200'}">
                <button onclick="switchPortfolioSet('${itemId}','${set.id}')" class="px-4 py-2 text-xs font-bold ${isActive ? 'text-white' : 'text-slate-600 hover:bg-slate-300'}">แผนงานที่ ${index + 1}</button>
                ${canDelete ? `<button onclick="removePortfolioSet('${itemId}','${set.id}')" class="px-2 py-2 text-xs ${isActive ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-rose-600'}" title="ลบชุดนี้"><i class="fa-solid fa-xmark"></i></button>` : ''}
            </div>`;
        }).join('') + `<button onclick="addPortfolioSet('${itemId}')" class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold" title="เพิ่มชุดใหม่"><i class="fa-solid fa-plus"></i></button>`;
    }

    function renderCategoryRows(set, category) {
        const colors = { GRAB: 'bg-blue-600', GROW: 'bg-orange-600', GUARD: 'bg-slate-800' };
        const rows = set.rows[category] || [];
        return rows.map((row, rowIndex) => {
            const hasSubgroup = !!row.subGroup;
            const bgClass = hasSubgroup ? 'text-emerald-800' : 'text-slate-600';
            const bgColor = hasSubgroup ? '#d1fae5' : '#e2e8f0';
            const unit = getUnitForSubGroup(row.subGroup);

            return `
            <tr class="border-t border-slate-200">
                ${rowIndex === 0 ? `
                    <td rowspan="${rows.length}" class="${colors[category]} text-white text-center align-middle font-black text-[11px] tracking-widest border-r border-slate-200" style="writing-mode: vertical-rl; transform: rotate(180deg);">${category}</td>
                    <td rowspan="${rows.length}" class="p-1.5 border-r border-slate-200 align-top w-[35%] relative">
                        <div class="flex items-center justify-between mb-1 shrink-0">
                            <span class="text-[10px] font-bold text-slate-500">Target</span>
                            <button onclick="openLightbox('Target (${category})', '#setTarget-${set.id}-${category}', (val) => {
                                const s = findSet('${set.activityItemId}', '${set.id}');
                                if (s) {
                                    s.rows['${category}'][0].target = val;
                                    persistSetRows('${set.activityItemId}', '${set.id}');
                                }
                            })" class="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-400 transition shrink-0" title="ขยายกล่องข้อความ">
                                <i class="fa-solid fa-magnifying-glass text-lg"></i>
                            </button>
                        </div>
                        <textarea id="setTarget-${set.id}-${category}" data-set-id="${set.id}" data-category="${category}" data-row-index="0" data-field="target" class="portfolio-row-field w-full min-h-[220px] resize-y border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-blue-500 font-semibold text-slate-800 shadow-inner" style="background-color: #eaf0f7;">${escapeHtml(rows[0].target || '')}</textarea>
                    </td>
                    <td rowspan="${rows.length}" class="p-1.5 border-r border-slate-200 align-top w-[35%] relative">
                        <div class="flex items-center justify-between mb-1 shrink-0">
                            <span class="text-[10px] font-bold text-slate-500">Action Plan</span>
                            <button onclick="openLightbox('Action Plan (${category})', '#setActionPlan-${set.id}-${category}', (val) => {
                                const s = findSet('${set.activityItemId}', '${set.id}');
                                if (s) {
                                    s.rows['${category}'][0].actionPlan = val;
                                    persistSetRows('${set.activityItemId}', '${set.id}');
                                }
                            })" class="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-400 transition shrink-0" title="ขยายกล่องข้อความ">
                                <i class="fa-solid fa-magnifying-glass text-lg"></i>
                            </button>
                        </div>
                        <textarea id="setActionPlan-${set.id}-${category}" data-set-id="${set.id}" data-category="${category}" data-row-index="0" data-field="actionPlan" class="portfolio-row-field w-full min-h-[220px] resize-y border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-blue-500 font-semibold text-slate-800 shadow-inner" style="background-color: #eaf0f7;">${escapeHtml(rows[0].actionPlan || '')}</textarea>
                    </td>
                ` : ''}
                <td class="p-1.5 align-middle">
                    <div class="flex items-center gap-1.5">
                        <select data-set-id="${set.id}" data-category="${category}" data-row-index="${rowIndex}"
                            class="portfolio-subgroup-field w-40 ${bgClass} border border-slate-200 rounded-lg py-1.5 px-2 text-[11px] font-bold outline-none focus:border-blue-500" style="background-color: ${bgColor};">
                            ${renderAllSubgroupOptions(row.subGroup)}
                        </select>
                        <input type="text" data-set-id="${set.id}" data-category="${category}" data-row-index="${rowIndex}"
                            class="portfolio-amount-field w-32 ${bgClass} border border-slate-200 rounded-lg py-1.5 px-1.5 text-[11px] text-center font-bold outline-none focus:border-blue-500"
                            value="${formatNumberWithCommas(row.amount || 0)}" placeholder="จำนวน" style="background-color: ${bgColor};">
                        <div class="w-10 text-right flex flex-col justify-end">
                            ${rowIndex === 0 ? '<span class="text-[9px] text-orange-700 font-bold leading-none block mb-0.5">Auto</span>' : ''}
                            <span id="unitLabel-${set.id}-${category}-${rowIndex}" class="text-xs text-slate-800 font-normal">${unit}</span>
                        </div>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }

    function renderPortfolioSetBody(itemId) {
        const body = document.getElementById(`portfolioSetBody-${itemId}`);
        const tabState = state.portfolioTabState[itemId];
        if (!body || !tabState) {
            return;
        }

        const activeSet = tabState.sets.find((entry) => entry.id === tabState.activeSetId);
        if (!activeSet) {
            body.innerHTML = '';
            return;
        }

        body.innerHTML = `
            <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <label class="block text-[11px] font-black text-slate-700">ชื่อเรื่อง</label>
                        <div class="flex items-center gap-1.5">
                            <button onclick="openPresenterMailLightbox('${activeSet.id}')" class="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-400 transition shrink-0" title="ข้อมูลสรุปการนำเสนอ">
                                <i class="fa-solid fa-envelope text-lg"></i>
                            </button>
                            <button onclick="openGraphLightbox('${activeSet.id}')" class="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-400 transition shrink-0" title="ดูกราฟวิเคราะห์">
                                <i class="fa-solid fa-chart-pie text-lg"></i>
                            </button>
                        </div>
                    </div>
                    <input type="text" id="setTopic-${activeSet.id}" value="${escapeHtml(activeSet.topic || '')}" placeholder="กรอกชื่อเรื่องของชุดนี้" class="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold outline-none focus:border-blue-500 shadow-inner" style="background-color: #eaf0f7;">
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                    <div class="bg-slate-50/50 border border-slate-200 rounded-xl p-3 space-y-1.5 relative">
                        <div class="flex items-center justify-between mb-1 shrink-0">
                            <span class="text-xs font-black text-slate-800 block">1. Portfolio Overview</span>
                            <button onclick="openLightbox('1. Portfolio Overview', '#setOverview-${activeSet.id}', (val) => persistSetField('${itemId}', '${activeSet.id}', { overview: val }))" class="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-400 transition shrink-0" title="ขยายกล่องข้อความ">
                                <i class="fa-solid fa-magnifying-glass text-lg"></i>
                            </button>
                        </div>
                        <textarea id="setOverview-${activeSet.id}" placeholder="กรอกข้อมูล..." class="w-full min-h-[150px] border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-blue-500 resize-y font-semibold text-slate-800 shadow-inner" style="background-color: #eaf0f7;">${escapeHtml(activeSet.overview || '')}</textarea>
                    </div>
                    <div class="bg-slate-50/50 border border-slate-200 rounded-xl p-3 space-y-1.5 relative">
                        <div class="flex items-center justify-between mb-1 shrink-0">
                            <span class="text-xs font-black text-slate-800 block">2. Gap</span>
                            <button onclick="openLightbox('2. Gap', '#setGap-${activeSet.id}', (val) => persistSetField('${itemId}', '${activeSet.id}', { gap: val }))" class="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-400 transition shrink-0" title="ขยายกล่องข้อความ">
                                <i class="fa-solid fa-magnifying-glass text-lg"></i>
                            </button>
                        </div>
                        <textarea id="setGap-${activeSet.id}" placeholder="กรอกข้อมูล..." class="w-full min-h-[150px] border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-blue-500 resize-y font-semibold text-slate-800 shadow-inner" style="background-color: #eaf0f7;">${escapeHtml(activeSet.gap || '')}</textarea>
                    </div>
                    <div class="bg-slate-50/50 border border-slate-200 rounded-xl p-3 space-y-1.5 relative">
                        <div class="flex items-center justify-between mb-1 shrink-0">
                            <span class="text-xs font-black text-slate-800 block">3. Opportunity</span>
                            <button onclick="openLightbox('3. Opportunity', '#setOpportunity-${activeSet.id}', (val) => persistSetField('${itemId}', '${activeSet.id}', { opportunity: val }))" class="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-400 transition shrink-0" title="ขยายกล่องข้อความ">
                                <i class="fa-solid fa-magnifying-glass text-lg"></i>
                            </button>
                        </div>
                        <textarea id="setOpportunity-${activeSet.id}" placeholder="กรอกข้อมูล..." class="w-full min-h-[150px] border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-blue-500 resize-y font-semibold text-slate-800 shadow-inner" style="background-color: #eaf0f7;">${escapeHtml(activeSet.opportunity || '')}</textarea>
                    </div>
                </div>
            </div>
            <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div class="overflow-x-auto border border-slate-200 rounded-xl">
                    <table class="w-full text-xs border-collapse">
                        <thead>
                            <tr class="bg-slate-100 text-slate-600 border-b border-slate-200">
                                <th class="w-10"></th>
                                <th class="py-2.5 px-3 text-center font-bold border-r border-slate-200">Target</th>
                                <th class="py-2.5 px-3 text-center font-bold border-r border-slate-200">Action Plan</th>
                                <th class="py-2.5 px-3 text-center font-bold">Outcome</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${['GRAB', 'GROW', 'GUARD'].map((category) => renderCategoryRows(activeSet, category)).join('')}
                            <tr class="border-t border-slate-200 bg-slate-50">
                                <td class="bg-slate-500 text-white text-center align-middle font-black text-[11px] tracking-widest py-3" style="writing-mode: vertical-rl; transform: rotate(180deg);">TOTAL</td>
                                <td colspan="3" class="p-3 bg-white">
                                    <div id="totalsBar-${activeSet.id}" class="flex flex-wrap items-center gap-6 justify-between">
                                        ${renderTotalsBar(activeSet)}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        bindPortfolioSetFieldEvents(itemId, activeSet.id);
    }

    function persistSetField(itemId, setId, payload) {
        const set = findSet(itemId, setId);
        if (set) {
            Object.assign(set, payload);
        }
        updatePortfolioSet(setId, payload);
    }

    function persistSetRows(itemId, setId) {
        const set = findSet(itemId, setId);
        if (!set) {
            return;
        }
        updatePortfolioSet(setId, { rows: set.rows });
    }

    function bindPortfolioSetFieldEvents(itemId, setId) {
        bindAutoSaveField(document.getElementById(`setTopic-${setId}`), (value) => persistSetField(itemId, setId, { topic: value }));
        bindAutoSaveField(document.getElementById(`setOverview-${setId}`), (value) => persistSetField(itemId, setId, { overview: value }));
        bindAutoSaveField(document.getElementById(`setGap-${setId}`), (value) => persistSetField(itemId, setId, { gap: value }));
        bindAutoSaveField(document.getElementById(`setOpportunity-${setId}`), (value) => persistSetField(itemId, setId, { opportunity: value }));

        // Target / Action Plan textareas
        document.querySelectorAll(`.portfolio-row-field[data-set-id="${setId}"]`).forEach((field) => {
            field.addEventListener('blur', () => {
                const set = findSet(itemId, setId);
                if (!set) {
                    return;
                }
                set.rows[field.dataset.category][Number(field.dataset.rowIndex)][field.dataset.field] = field.value;
                persistSetRows(itemId, setId);
            });
        });

        // Outcome dropdown: SubGroup
        document.querySelectorAll(`.portfolio-subgroup-field[data-set-id="${setId}"]`).forEach((field) => {
            field.addEventListener('change', () => {
                const set = findSet(itemId, setId);
                if (!set) {
                    return;
                }
                const category = field.dataset.category;
                const rowIndex = Number(field.dataset.rowIndex);
                const row = set.rows[category][rowIndex];
                row.subGroup = field.value;

                const amountInput = document.querySelector(`.portfolio-amount-field[data-set-id="${setId}"][data-category="${category}"][data-row-index="${rowIndex}"]`);

                // If unselected "เลือกผลิตภัณฑ์", set amount to 0 automatically
                if (row.subGroup === '') {
                    row.amount = 0;
                    if (amountInput) {
                        amountInput.value = '0';
                    }
                }

                // Update background colors dynamically
                updateRowBgColors(field, amountInput, row.subGroup !== '');

                // Update dynamic unit label
                const unitLabel = document.getElementById(`unitLabel-${setId}-${category}-${rowIndex}`);
                if (unitLabel) {
                    unitLabel.textContent = getUnitForSubGroup(row.subGroup);
                }

                persistSetRows(itemId, setId);
                refreshTotalsBar(itemId, setId);
            });
        });

        // Outcome amount: text inputs (with thousands separator)
        document.querySelectorAll(`.portfolio-amount-field[data-set-id="${setId}"]`).forEach((field) => {
            field.addEventListener('focus', () => {
                const set = findSet(itemId, setId);
                if (!set) return;
                const category = field.dataset.category;
                const rowIndex = Number(field.dataset.rowIndex);
                const row = set.rows[category][rowIndex];
                // Show raw numeric string on focus
                field.value = String(row.amount || 0);
            });

            const handleAmountChange = () => {
                const set = findSet(itemId, setId);
                if (!set) {
                    return;
                }
                const category = field.dataset.category;
                const rowIndex = Number(field.dataset.rowIndex);
                const row = set.rows[category][rowIndex];
                let val = parseNumberString(field.value);
                if (val < 0) {
                    val = 0;
                }

                row.amount = val;
                field.value = formatNumberWithCommas(val);

                // Update background colors dynamically
                const selectDropdown = document.querySelector(`.portfolio-subgroup-field[data-set-id="${setId}"][data-category="${category}"][data-row-index="${rowIndex}"]`);
                updateRowBgColors(selectDropdown, field, row.subGroup !== '');

                persistSetRows(itemId, setId);
                refreshTotalsBar(itemId, setId);
            };

            field.addEventListener('change', handleAmountChange);
            field.addEventListener('blur', handleAmountChange);
        });
    }

    function switchPortfolioSet(itemId, setId) {
        const tabState = state.portfolioTabState[itemId];
        if (!tabState) {
            return;
        }
        tabState.activeSetId = setId;
        renderPortfolioSetsBar(itemId);
        renderPortfolioSetBody(itemId);
    }

    async function addPortfolioSet(itemId) {
        const tabState = state.portfolioTabState[itemId];
        const user = state.currentUser;
        if (!tabState || !user) {
            return;
        }
        const nextIndex = tabState.sets.length + 1;
        const newSet = await createPortfolioSet(user.id, user.roundId, itemId, nextIndex);
        tabState.sets.push(newSet);
        tabState.activeSetId = newSet.id;
        renderPortfolioSetsBar(itemId);
        renderPortfolioSetBody(itemId);
    }

    async function removePortfolioSet(itemId, setId) {
        showDeleteConfirmLightbox(itemId, setId);
    }

    // ---------------------------------------------------------------------
    // Template: Customer Diagnosis
    // ---------------------------------------------------------------------

    function actIonCell(fieldId, letter, label, colorClass) {
        return `<div class="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
            <div class="${colorClass} text-white text-center text-[12px] font-bold py-2 px-2">${letter} - ${escapeHtml(label)}</div>
            <textarea id="${fieldId}" class="w-full min-h-[60px] p-2 text-xs font-semibold text-slate-800 outline-none" style="background-color: #eaf0f7;"></textarea>
        </div>`;
    }

    function diagnosisCell(fieldId, label, colorClass) {
        return `<div class="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
            <div class="${colorClass} text-white text-center text-[12px] font-bold py-2 px-2">${escapeHtml(label)}</div>
            <textarea id="${fieldId}" class="w-full min-h-[75px] p-2 text-xs font-semibold text-slate-800 outline-none" style="background-color: #eaf0f7;"></textarea>
        </div>`;
    }

    function mountCustomerDiagnosisTab(item) {
        const wrapper = document.createElement('div');
        wrapper.id = `simTabContent-${item.id}`;
        wrapper.className = 'w-full flex flex-col gap-4';
        wrapper.innerHTML = `
            <div id="bootcampSetsTabBar-${item.id}" class="flex flex-wrap gap-2 items-center border-b border-slate-200 pb-3"></div>
            <div id="bootcampSetBody-${item.id}" class="flex flex-col gap-4"></div>
        `;

        state.bootcampTabState[item.id] = { sets: [], activeSetId: '' };
        initCustomerDiagnosisData(item);

        return wrapper;
    }

    async function initCustomerDiagnosisData(item) {
        const user = state.currentUser;
        if (!user) {
            return;
        }

        const docId = `${user.id}__${item.id}`;
        const data = await getSingletonDoc('customerDiagnosis', docId) || {};

        let sets = data.sets || [];
        if (!sets.length) {
            const firstSet = {
                id: 'set_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                topic: 'แผนงานที่ 1',
                customerInfo: data.customerInfo || '',
                act: data.act || { aim: '', consult: '', track: '' },
                ion: data.ion || { improve: '', operate: '', notice: '' },
                diagnosis: data.diagnosis || {
                    goalAndLimit: '',
                    idealPortfolio: '',
                    currentPortfolio: '',
                    portfolioSymptom: '',
                    potentialImpact: '',
                    adjustmentGuideline: ''
                },
                financialSolutions: data.financialSolutions || []
            };
            sets = [firstSet];
            await saveSingletonDoc('customerDiagnosis', docId, { ...data, sets, activeSetId: firstSet.id });
        }

        const tabState = state.bootcampTabState[item.id];
        if (!tabState) return;

        tabState.sets = sets;
        if (!tabState.activeSetId || !sets.some(s => s.id === tabState.activeSetId)) {
            tabState.activeSetId = data.activeSetId || sets[0].id;
        }
        if (!sets.some(s => s.id === tabState.activeSetId)) {
            tabState.activeSetId = sets[0].id;
        }

        renderBootcampSetsBar(item.id);
        renderBootcampSetBody(item.id);
    }

    function renderBootcampSetsBar(itemId) {
        const bar = document.getElementById(`bootcampSetsTabBar-${itemId}`);
        const tabState = state.bootcampTabState[itemId];
        if (!bar || !tabState) {
            return;
        }

        const canDelete = tabState.sets.length > 1;
        bar.innerHTML = tabState.sets.map((set, index) => {
            const isActive = set.id === tabState.activeSetId;
            return `<div class="flex items-center rounded-xl overflow-hidden ${isActive ? 'bg-orange-500' : 'bg-slate-200'}">
                <button onclick="switchBootcampSet('${itemId}','${set.id}')" class="px-4 py-2 text-xs font-bold ${isActive ? 'text-white' : 'text-slate-600 hover:bg-slate-300'}">แผนงานที่ ${index + 1}</button>
                ${canDelete ? `<button onclick="removeBootcampSet('${itemId}','${set.id}')" class="px-2 py-2 text-xs ${isActive ? 'text-white/70 hover:text-white border-l border-orange-400' : 'text-slate-400 hover:text-rose-600 border-l border-slate-300'}" title="ลบชุดนี้"><i class="fa-solid fa-xmark"></i></button>` : ''}
            </div>`;
        }).join('') + `<button onclick="addBootcampSet('${itemId}')" class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold" title="เพิ่มชุดใหม่"><i class="fa-solid fa-plus"></i></button>`;
    }

    function renderBootcampSetBody(itemId) {
        const body = document.getElementById(`bootcampSetBody-${itemId}`);
        const tabState = state.bootcampTabState[itemId];
        if (!body || !tabState) return;

        const activeSet = tabState.sets.find((entry) => entry.id === tabState.activeSetId);
        if (!activeSet) {
            body.innerHTML = '';
            return;
        }

        const act = activeSet.act || { aim: '', consult: '', track: '' };
        const ion = activeSet.ion || { improve: '', operate: '', notice: '' };
        const diagnosis = activeSet.diagnosis || {
            goalAndLimit: '',
            idealPortfolio: '',
            currentPortfolio: '',
            portfolioSymptom: '',
            potentialImpact: '',
            adjustmentGuideline: ''
        };
        const solutions = activeSet.financialSolutions || [];

        body.innerHTML = `
            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <!-- ชื่อเรื่อง input field -->
                <div class="mb-2">
                    <div class="flex items-center justify-between mb-1">
                        <label class="block text-[11px] font-black text-slate-700">ชื่อเรื่อง</label>
                        <div class="flex items-center gap-1.5">
                            <button onclick="openBootcampPresenterMailLightbox('${itemId}', '${activeSet.id}')" class="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-400 transition shrink-0" title="ข้อมูลสรุปการนำเสนอ">
                                <i class="fa-solid fa-envelope text-lg"></i>
                            </button>
                        </div>
                    </div>
                    <input type="text" id="bootcampSetTopic-${itemId}" value="${escapeHtml(activeSet.topic || '')}" placeholder="กรอกชื่อเรื่องของชุดนี้" class="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 shadow-inner" style="background-color: #eaf0f7;">
                </div>

                <h3 class="text-xs font-black text-slate-700 flex items-center gap-2"><span class="w-5 h-5 rounded-full bg-blue-800 text-white flex items-center justify-center text-[10px]">1</span> Customer Profile & Action Plan</h3>
                
                <!-- Full-width ข้อมูลลูกค้า container -->
                <div class="bgblue text-white rounded-2xl p-4 space-y-2">
                    <span class="block text-xs">ข้อมูลลูกค้า</span>
                    <textarea id="cdCustomerInfo-${itemId}" class="w-full min-h-[90px] rounded-lg p-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" style="background-color: #eaf0f7;"></textarea>
                </div>

                <!-- 3 Columns, 2 Rows grid for A C T I O N -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                    ${actIonCell(`cdAim-${itemId}`, 'A', 'Aim', 'bgblue')}
                    ${actIonCell(`cdConsult-${itemId}`, 'C', 'Consult', 'bgblue')}
                    ${actIonCell(`cdTrack-${itemId}`, 'T', 'Track', 'bgblue')}
                    ${actIonCell(`cdImprove-${itemId}`, 'I', 'Improve', 'bgorange')}
                    ${actIonCell(`cdOperate-${itemId}`, 'O', 'Operate', 'bgorange')}
                    ${actIonCell(`cdNotice-${itemId}`, 'N', 'Notice', 'bgorange')}
                </div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                <h3 class="text-xs font-black text-slate-700 flex items-center gap-2"><span class="w-5 h-5 rounded-full bg-blue-800 text-white flex items-center justify-center text-[10px] placeholder="กรอกข้อมูล...">2</span> Portfolio Diagnosis & Improvement</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                    ${diagnosisCell(`cdGoalAndLimit-${itemId}`, 'เป้าหมายและข้อจำกัด', 'bgblue')}
                    ${diagnosisCell(`cdIdealPortfolio-${itemId}`, 'พอร์ตที่ควรเป็นตามเป้าหมาย', 'bgblue')}
                    ${diagnosisCell(`cdCurrentPortfolio-${itemId}`, 'พอร์ตปัจจุบันที่ลูกค้ามี', 'bgblue')}
                    ${diagnosisCell(`cdPortfolioSymptom-${itemId}`, 'อาการของพอร์ต', 'bgorange')}
                    ${diagnosisCell(`cdPotentialImpact-${itemId}`, 'ผลกระทบที่อาจเกิดขึ้น', 'bgorange')}
                    ${diagnosisCell(`cdAdjustmentGuideline-${itemId}`, 'แนวทางปรับพอร์ต', 'bgorange')}
                </div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                <h3 class="text-xs font-black text-slate-700 flex items-center gap-2"><span class="w-5 h-5 rounded-full bg-blue-800 text-white flex items-center justify-center text-[10px]">3</span> Financial Solution</h3>
                <div class="overflow-x-auto border border-slate-200 rounded-xl">
                    <table class="w-full text-xs border-collapse">
                        <thead>
                            <tr class="bg-[#f8fafc] text-slate-700 border-b border-slate-200">
                                <th rowspan="2" class="py-2.5 px-3 text-center font-black border-r border-slate-200 w-[24%]">รายการ</th>
                                <th colspan="4" class="py-2 px-3 text-center font-black border-b border-slate-200">โซลูชันที่จะแนะนำ</th>
                            </tr>
                            <tr class="bg-slate-100/80 text-slate-700 text-[12px]">
                                <th class="py-2 px-2 text-center border-r border-slate-200 w-[19%]">ฉลาดใช้</th>
                                <th class="py-2 px-2 text-center border-r border-slate-200 w-[19%]">ฉลาดออมและลงทุน</th>
                                <th class="py-2 px-2 text-center border-r border-slate-200 w-[19%]">คุ้มครองอุ่นใจ</th>
                                <th class="py-2 px-2 text-center w-[19%]">รอบรู้กู้ยืม</th>
                            </tr>
                        </thead>
                        <tbody id="cdFinancialSolutionsTableBody-${itemId}">
                            <!-- Populated below -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        setFieldValue(`cdCustomerInfo-${itemId}`, activeSet.customerInfo || '');
        setFieldValue(`cdAim-${itemId}`, act.aim || '');
        setFieldValue(`cdConsult-${itemId}`, act.consult || '');
        setFieldValue(`cdTrack-${itemId}`, act.track || '');
        setFieldValue(`cdImprove-${itemId}`, ion.improve || '');
        setFieldValue(`cdOperate-${itemId}`, ion.operate || '');
        setFieldValue(`cdNotice-${itemId}`, ion.notice || '');
        setFieldValue(`cdGoalAndLimit-${itemId}`, diagnosis.goalAndLimit || '');
        setFieldValue(`cdIdealPortfolio-${itemId}`, diagnosis.idealPortfolio || '');
        setFieldValue(`cdCurrentPortfolio-${itemId}`, activeSet.diagnosis?.currentPortfolio || diagnosis.currentPortfolio || '');
        setFieldValue(`cdPortfolioSymptom-${itemId}`, diagnosis.portfolioSymptom || '');
        setFieldValue(`cdPotentialImpact-${itemId}`, diagnosis.potentialImpact || '');
        setFieldValue(`cdAdjustmentGuideline-${itemId}`, diagnosis.adjustmentGuideline || '');

        const tableBody = document.getElementById(`cdFinancialSolutionsTableBody-${itemId}`);
        if (tableBody) {
            const goals = [
                'เพื่อการเกษียณ',
                'เพื่อการศึกษาบุตร',
                'เพื่อลดหย่อนภาษี',
                'เพื่อเก็งกำไร/เติบโต',
                'เพื่อการท่องเที่ยว',
                'อื่นๆ'
            ];
            tableBody.innerHTML = Array.from({ length: 3 }).map((_, index) => {
                const sol = solutions[index] || {};
                const goalOptions = goals.map(g => `<option value="${g}" ${sol.goal === g ? 'selected' : ''}>${g}</option>`).join('');

                return `
                    <tr class="border-t border-slate-200">
                        <td class="p-3 align-top border-r border-slate-200 space-y-2">
                            <div>
                                <span class="block text-[11px] font-bold text-slate-500 mb-0.5 text-left">เป้าหมายทางการเงิน</span>
                                <select id="cdSolGoal-${itemId}-${index}" class="w-full border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500" style="background-color: #eaf0f7;">
                                    <option value="">เลือกเป้าหมาย</option>
                                    ${goalOptions}
                                </select>
                            </div>
                            <div>
                                <span class="block text-[11px] font-bold text-slate-500 mb-0.5 text-left">จำนวนเงิน</span>
                                <input type="text" id="cdSolAmount-${itemId}-${index}" value="${escapeHtml(sol.amount || '')}" class="w-full border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500" placeholder="จำนวนเงิน" style="background-color: #eaf0f7;">
                            </div>
                            <div>
                                <span class="block text-[11px] font-bold text-slate-500 mb-0.5 text-left">ระยะเวลา</span>
                                <input type="text" id="cdSolDuration-${itemId}-${index}" value="${escapeHtml(sol.duration || '')}" class="w-full border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500" placeholder="ระยะเวลา" style="background-color: #eaf0f7;">
                            </div>
                            <div>
                                <span class="block text-[11px] font-bold text-slate-500 mb-0.5 text-left">อัตราผลตอบแทนที่คาดหวัง</span>
                                <input type="text" id="cdSolReturn-${itemId}-${index}" value="${escapeHtml(sol.expectedReturn || '')}" class="w-full border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500" placeholder="ผลตอบแทน %" style="background-color: #eaf0f7;">
                            </div>
                        </td>
                        <td class="p-2 align-top border-r border-slate-200">
                            <textarea id="cdSolSmartSpend-${itemId}-${index}" class="w-full min-h-[240px] border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500" style="background-color: #eaf0f7;">${escapeHtml(sol.smartSpend || '')}</textarea>
                        </td>
                        <td class="p-2 align-top border-r border-slate-200">
                            <textarea id="cdSolSmartSave-${itemId}-${index}" class="w-full min-h-[240px] border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500" style="background-color: #eaf0f7;">${escapeHtml(sol.smartSave || '')}</textarea>
                        </td>
                        <td class="p-2 align-top border-r border-slate-200">
                            <textarea id="cdSolSmartProtect-${itemId}-${index}" class="w-full min-h-[240px] border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500" style="background-color: #eaf0f7;">${escapeHtml(sol.smartProtect || '')}</textarea>
                        </td>
                        <td class="p-2 align-top">
                            <textarea id="cdSolSmartBorrow-${itemId}-${index}" class="w-full min-h-[240px] border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500" style="background-color: #eaf0f7;">${escapeHtml(sol.smartBorrow || '')}</textarea>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        const bindSave = (fieldId, pathArray) => {
            const el = document.getElementById(fieldId);
            if (el) {
                bindAutoSaveField(el, (val) => {
                    persistBootcampSetField(itemId, activeSet.id, pathArray, val);
                });
            }
        };

        bindSave(`cdCustomerInfo-${itemId}`, ['customerInfo']);
        bindSave(`cdAim-${itemId}`, ['act', 'aim']);
        bindSave(`cdConsult-${itemId}`, ['act', 'consult']);
        bindSave(`cdTrack-${itemId}`, ['act', 'track']);
        bindSave(`cdImprove-${itemId}`, ['ion', 'improve']);
        bindSave(`cdOperate-${itemId}`, ['ion', 'operate']);
        bindSave(`cdNotice-${itemId}`, ['ion', 'notice']);
        bindSave(`cdGoalAndLimit-${itemId}`, ['diagnosis', 'goalAndLimit']);
        bindSave(`cdIdealPortfolio-${itemId}`, ['diagnosis', 'idealPortfolio']);
        bindSave(`cdCurrentPortfolio-${itemId}`, ['diagnosis', 'currentPortfolio']);
        bindSave(`cdPortfolioSymptom-${itemId}`, ['diagnosis', 'portfolioSymptom']);
        bindSave(`cdPotentialImpact-${itemId}`, ['diagnosis', 'potentialImpact']);
        bindSave(`cdAdjustmentGuideline-${itemId}`, ['diagnosis', 'adjustmentGuideline']);

        // Bind Save for Title in real-time
        const titleInput = document.getElementById(`bootcampSetTopic-${itemId}`);
        if (titleInput) {
            titleInput.addEventListener('input', (e) => {
                const val = e.target.value;
                activeSet.topic = val || `แผนงานที่ ${tabState.sets.indexOf(activeSet) + 1}`;
                persistBootcampSetField(itemId, activeSet.id, ['topic'], val);
                renderBootcampSetsBar(itemId);
            });
        }

        const saveFinancialSolutions = () => {
            const list = [];
            for (let i = 0; i < 3; i++) {
                list.push({
                    goal: document.getElementById(`cdSolGoal-${itemId}-${i}`)?.value || '',
                    amount: document.getElementById(`cdSolAmount-${itemId}-${i}`)?.value || '',
                    duration: document.getElementById(`cdSolDuration-${itemId}-${i}`)?.value || '',
                    expectedReturn: document.getElementById(`cdSolReturn-${itemId}-${i}`)?.value || '',
                    smartSpend: document.getElementById(`cdSolSmartSpend-${itemId}-${i}`)?.value || '',
                    smartSave: document.getElementById(`cdSolSmartSave-${itemId}-${i}`)?.value || '',
                    smartProtect: document.getElementById(`cdSolSmartProtect-${itemId}-${i}`)?.value || '',
                    smartBorrow: document.getElementById(`cdSolSmartBorrow-${itemId}-${i}`)?.value || '',
                });
            }
            persistBootcampSetField(itemId, activeSet.id, ['financialSolutions'], list);
        };

        for (let i = 0; i < 3; i++) {
            document.getElementById(`cdSolGoal-${itemId}-${i}`)?.addEventListener('change', saveFinancialSolutions);
            document.getElementById(`cdSolAmount-${itemId}-${i}`)?.addEventListener('blur', saveFinancialSolutions);
            document.getElementById(`cdSolDuration-${itemId}-${i}`)?.addEventListener('blur', saveFinancialSolutions);
            document.getElementById(`cdSolReturn-${itemId}-${i}`)?.addEventListener('blur', saveFinancialSolutions);
            document.getElementById(`cdSolSmartSpend-${itemId}-${i}`)?.addEventListener('blur', saveFinancialSolutions);
            document.getElementById(`cdSolSmartSave-${itemId}-${i}`)?.addEventListener('blur', saveFinancialSolutions);
            document.getElementById(`cdSolSmartProtect-${itemId}-${i}`)?.addEventListener('blur', saveFinancialSolutions);
            document.getElementById(`cdSolSmartBorrow-${itemId}-${i}`)?.addEventListener('blur', saveFinancialSolutions);
        }
    }

    async function persistBootcampSetField(itemId, setId, fieldPathArray, value) {
        const docId = `${state.currentUser.id}__${itemId}`;
        const tabState = state.bootcampTabState[itemId];
        if (!tabState) return;

        const set = tabState.sets.find((s) => s.id === setId);
        if (!set) return;

        let current = set;
        for (let i = 0; i < fieldPathArray.length - 1; i++) {
            const key = fieldPathArray[i];
            if (!current[key]) current[key] = {};
            current = current[key];
        }
        current[fieldPathArray[fieldPathArray.length - 1]] = value;

        const payload = {
            userId: state.currentUser.id,
            roundId: state.currentUser.roundId,
            activityItemId: itemId,
            sets: tabState.sets,
            activeSetId: tabState.activeSetId
        };
        await saveSingletonDoc('customerDiagnosis', docId, payload);
    }

    window.switchBootcampSet = (itemId, setId) => {
        const tabState = state.bootcampTabState[itemId];
        if (!tabState) return;

        tabState.activeSetId = setId;
        const docId = `${state.currentUser.id}__${itemId}`;
        saveSingletonDoc('customerDiagnosis', docId, {
            userId: state.currentUser.id,
            roundId: state.currentUser.roundId,
            activityItemId: itemId,
            sets: tabState.sets,
            activeSetId: setId
        });

        renderBootcampSetsBar(itemId);
        renderBootcampSetBody(itemId);
    };

    window.addBootcampSet = async (itemId) => {
        const tabState = state.bootcampTabState[itemId];
        if (!tabState) return;

        const nextIndex = tabState.sets.length + 1;
        const newSet = {
            id: 'set_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            topic: `แผนงานที่ ${nextIndex}`,
            customerInfo: '',
            act: { aim: '', consult: '', track: '' },
            ion: { improve: '', operate: '', notice: '' },
            diagnosis: {
                goalAndLimit: '',
                idealPortfolio: '',
                currentPortfolio: '',
                portfolioSymptom: '',
                potentialImpact: '',
                adjustmentGuideline: ''
            },
            financialSolutions: []
        };

        tabState.sets.push(newSet);
        tabState.activeSetId = newSet.id;

        const docId = `${state.currentUser.id}__${itemId}`;
        await saveSingletonDoc('customerDiagnosis', docId, {
            userId: state.currentUser.id,
            roundId: state.currentUser.roundId,
            activityItemId: itemId,
            sets: tabState.sets,
            activeSetId: newSet.id
        });

        renderBootcampSetsBar(itemId);
        renderBootcampSetBody(itemId);
    };

    function showDeleteConfirmBootcampLightbox(itemId, setId) {
        let modal = document.getElementById('deleteConfirmBootcampLightboxModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'deleteConfirmBootcampLightboxModal';
            modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-white w-[400px] rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4">
                    <h3 class="text-base font-black text-slate-800">ยืนยันการลบชุดข้อมูล</h3>
                    <p class="text-xs text-slate-500">กรุณาพิมพ์ข้อความ <strong class="text-rose-600">Delete Page</strong> เพื่อยืนยันการลบชุดข้อมูลนี้</p>
                    <input type="text" id="deleteConfirmBootcampInput" placeholder="Delete Page" class="w-full border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none focus:border-rose-500 font-semibold text-slate-800">
                    <div class="flex items-center gap-3 justify-end pt-2">
                        <button id="btnCancelDeleteBootcamp" class="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition">ยกเลิก</button>
                        <button id="btnConfirmDeleteBootcamp" disabled class="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-lg transition disabled:bg-rose-300 disabled:opacity-50 disabled:cursor-not-allowed">ยืนยัน</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        modal.classList.remove('hidden');
        const input = document.getElementById('deleteConfirmBootcampInput');
        const btnConfirm = document.getElementById('btnConfirmDeleteBootcamp');
        const btnCancel = document.getElementById('btnCancelDeleteBootcamp');

        input.value = '';
        btnConfirm.disabled = true;

        input.oninput = () => {
            btnConfirm.disabled = input.value !== 'Delete Page';
        };

        btnConfirm.onclick = async () => {
            modal.classList.add('hidden');
            const tabState = state.bootcampTabState[itemId];
            if (!tabState) return;

            const index = tabState.sets.findIndex((s) => s.id === setId);
            if (index === -1) return;

            tabState.sets.splice(index, 1);

            if (tabState.activeSetId === setId) {
                tabState.activeSetId = tabState.sets[Math.max(0, index - 1)].id;
            }

            const docId = `${state.currentUser.id}__${itemId}`;
            await saveSingletonDoc('customerDiagnosis', docId, {
                userId: state.currentUser.id,
                roundId: state.currentUser.roundId,
                activityItemId: itemId,
                sets: tabState.sets,
                activeSetId: tabState.activeSetId
            });

            renderBootcampSetsBar(itemId);
            renderBootcampSetBody(itemId);
        };

        btnCancel.onclick = () => {
            modal.classList.add('hidden');
        };
    }

    window.removeBootcampSet = async (itemId, setId) => {
        const tabState = state.bootcampTabState[itemId];
        if (!tabState) return;

        if (tabState.sets.length <= 1) return;
        showDeleteConfirmBootcampLightbox(itemId, setId);
    };

    // ---------------------------------------------------------------------
    // Session / logout
    // ---------------------------------------------------------------------

    function logoutPlayer() {
        const lightbox = document.getElementById('reRegisterLightbox');
        if (lightbox) {
            lightbox.classList.remove('hidden');
        }
    }

    function closeReRegisterLightbox() {
        const lightbox = document.getElementById('reRegisterLightbox');
        if (lightbox) {
            lightbox.classList.add('hidden');
        }
    }

    function confirmReRegister() {
        if (state.unsubscribeActivityItems) {
            state.unsubscribeActivityItems();
            state.unsubscribeActivityItems = null;
        }
        if (window.unsubscribeUserPortfolio) {
            window.unsubscribeUserPortfolio();
            window.unsubscribeUserPortfolio = null;
        }
        if (window.unsubscribeUserBootcamp) {
            window.unsubscribeUserBootcamp();
            window.unsubscribeUserBootcamp = null;
        }

        clearSession();
        state.currentUser = null;
        state.activityItems = [];
        state.activeTabId = '';
        state.portfolioTabState = {};

        const nameInput = document.getElementById('inputRegName');
        if (nameInput) {
            nameInput.value = '';
        }

        const dynamicContainer = document.getElementById('dynamicTabContentContainer');
        if (dynamicContainer) {
            dynamicContainer.innerHTML = '';
        }

        document.getElementById('viewSimulation')?.classList.add('hidden');
        document.getElementById('simulationTabsMenuBar')?.classList.add('hidden');
        document.getElementById('btnLogoutPlayer')?.classList.add('hidden');
        document.getElementById('viewRegister')?.classList.remove('hidden');

        closeReRegisterLightbox();
        validateRegForm();
    }

    async function tryResumeSession() {
        const session = readSession();
        if (!session || !session.userId) {
            return;
        }

        const user = await getUserById(session.userId);
        if (!user) {
            clearSession();
            return;
        }

        state.currentUser = user;
        await enterSimulation(user);
    }

    async function init() {
        initFirebase();
        initActiveRoundListener();
        await tryResumeSession();
    }

    window.validateRegForm = validateRegForm;
    window.submitRegister = submitRegister;
    window.switchActiveTab = switchActiveTab;
    window.logoutPlayer = logoutPlayer;
    window.closeReRegisterLightbox = closeReRegisterLightbox;
    window.confirmReRegister = confirmReRegister;
    window.switchPortfolioSet = switchPortfolioSet;
    window.addPortfolioSet = addPortfolioSet;
    window.removePortfolioSet = removePortfolioSet;
    window.switchBootcampSet = switchBootcampSet;
    window.addBootcampSet = addBootcampSet;
    window.removeBootcampSet = removeBootcampSet;

    init();
})();
