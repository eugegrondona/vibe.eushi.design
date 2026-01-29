// Friends Financing - Group Expense Calculator

// Application State
const state = {
    members: [],
    expenses: [],
    nextExpenseId: 1,
    currentGroupName: null,
    isLoadedGroup: false // Track if current members came from a saved group
};

// DOM Elements
const elements = {
    // Screens
    landingScreen: document.getElementById('landing-screen'),
    expenseScreen: document.getElementById('expense-screen'),

    // Landing Screen
    existingGroupsSection: document.getElementById('existing-groups-section'),
    landingGroupsList: document.getElementById('landing-groups-list'),
    newGroupSection: document.getElementById('new-group-section'),
    newGroupTitle: document.getElementById('new-group-title'),
    newGroupName: document.getElementById('new-group-name'),
    createGroupBtn: document.getElementById('create-group-btn'),

    // Expense Screen Header
    backBtn: document.getElementById('back-btn'),
    groupTitle: document.getElementById('group-title'),

    // Members
    memberNameInput: document.getElementById('member-name'),
    addMemberBtn: document.getElementById('add-member-btn'),
    membersList: document.getElementById('members-list'),
    membersHint: document.getElementById('members-hint'),
    memberCount: document.getElementById('member-count'),

    // Expenses
    expenseForm: document.getElementById('expense-form'),
    expenseDescription: document.getElementById('expense-description'),
    expenseAmount: document.getElementById('expense-amount'),
    expensePayer: document.getElementById('expense-payer'),
    expenseParticipants: document.getElementById('expense-participants'),
    selectAllParticipants: document.getElementById('select-all-participants'),
    expensesList: document.getElementById('expenses-list'),
    noExpensesMsg: document.getElementById('no-expenses-msg'),
    totalAmount: document.getElementById('total-amount'),
    totalRow: document.getElementById('total-row'),

    // Results
    resultsContainer: document.getElementById('results-container'),
    balancesList: document.getElementById('balances-list'),
    settlementsList: document.getElementById('settlements-list'),
    settlementsHint: document.getElementById('settlements-hint'),
    allSettledMsg: document.getElementById('all-settled-msg'),
    shareBtn: document.getElementById('share-btn'),

    // Footer
    resetBtn: document.getElementById('reset-btn'),
    newGroupBtn: document.getElementById('new-group-btn')
};

// ============================================
// Screen Navigation
// ============================================

function showLandingScreen() {
    elements.landingScreen.classList.remove('hidden');
    elements.expenseScreen.classList.add('hidden');
    renderLandingGroups();
}

function showExpenseScreen() {
    elements.landingScreen.classList.add('hidden');
    elements.expenseScreen.classList.remove('hidden');
    updateTitle();
    renderMembers();
    updatePayerDropdown();
    updateParticipantCheckboxes();
    renderExpenses();
}

function goBack() {
    const groups = getSavedGroups();

    if (state.currentGroupName) {
        if (state.members.length > 0) {
            // Save group with members and expenses
            groups[state.currentGroupName] = {
                members: [...state.members],
                expenses: [...state.expenses],
                nextExpenseId: state.nextExpenseId,
                savedAt: new Date().toISOString()
            };
            saveGroupsToStorage(groups);
        } else {
            // Delete group if it has 0 members
            delete groups[state.currentGroupName];
            saveGroupsToStorage(groups);
        }
    }

    // Reset state
    state.members = [];
    state.expenses = [];
    state.nextExpenseId = 1;
    state.currentGroupName = null;
    state.isLoadedGroup = false;

    showLandingScreen();
}

// ============================================
// Landing Screen - Groups Management
// ============================================

const GROUPS_STORAGE_KEY = 'timtams-groups';

function getSavedGroups() {
    try {
        const data = localStorage.getItem(GROUPS_STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        return {};
    }
}

function saveGroupsToStorage(groups) {
    try {
        localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
        return true;
    } catch (e) {
        return false;
    }
}

function renderLandingGroups() {
    const groups = getSavedGroups();
    const groupNames = Object.keys(groups);

    if (groupNames.length === 0) {
        // No existing groups - show only "Add a new group"
        elements.existingGroupsSection.classList.add('hidden');
        elements.newGroupTitle.textContent = 'Add a new group of friends...';
    } else {
        // Has existing groups - show both sections
        elements.existingGroupsSection.classList.remove('hidden');
        elements.newGroupTitle.textContent = 'Or create a new one...';

        elements.landingGroupsList.innerHTML = groupNames.map(name => {
            const group = groups[name];
            const memberCount = group.members.length;
            const memberPreview = group.members.slice(0, 4).join(', ') + (memberCount > 4 ? '...' : '');
            const lastActivity = formatRelativeDate(group.savedAt);

            return `
                <li onclick="selectGroup('${escapeHtml(name)}')">
                    <div class="group-info">
                        <div class="group-header">
                            <div class="group-name">${escapeHtml(name)}</div>
                            <div class="group-date">${lastActivity}</div>
                        </div>
                        <div class="group-details">
                            <div class="group-members">${memberCount} members: ${escapeHtml(memberPreview)}</div>
                        </div>
                    </div>
                    <button type="button" class="delete-group-btn" onclick="event.stopPropagation(); deleteGroup('${escapeHtml(name)}')" title="Delete group">&times;</button>
                    <span class="group-arrow">&gt;</span>
                </li>
            `;
        }).join('');
    }

    elements.newGroupName.value = '';
}

function createGroup() {
    const name = elements.newGroupName.value.trim();

    if (!name) {
        showAlert('Please enter a group name.');
        return;
    }

    const groups = getSavedGroups();

    if (groups[name]) {
        showAlert(`A group named "${name}" already exists. Please choose a different name.`);
        return;
    }

    // Don't save empty group to storage yet - will be saved when members are added
    state.currentGroupName = name;
    state.members = [];
    state.expenses = [];
    state.nextExpenseId = 1;
    state.isLoadedGroup = true;
    showExpenseScreen();
}

function selectGroup(name) {
    const groups = getSavedGroups();
    const group = groups[name];

    if (!group) {
        showAlert('Group not found.');
        return;
    }

    state.currentGroupName = name;
    state.members = [...group.members];
    state.expenses = group.expenses ? [...group.expenses] : [];
    state.nextExpenseId = group.nextExpenseId || (state.expenses.length > 0 ? Math.max(...state.expenses.map(e => e.id)) + 1 : 1);
    state.isLoadedGroup = true;

    showExpenseScreen();
}

function deleteGroup(name) {
    showConfirm(`Delete group "${name}"? This cannot be undone.`, () => {
        const groups = getSavedGroups();
        delete groups[name];

        if (saveGroupsToStorage(groups)) {
            renderLandingGroups();
        } else {
            showAlert('Failed to delete group.');
        }
    });
}

// ============================================
// Title Management
// ============================================

function updateTitle() {
    const displayName = state.currentGroupName || 'Friends';
    elements.groupTitle.textContent = displayName;
    document.title = `${displayName} Financing - Group Expense Calculator`;
}

// ============================================
// Member Management
// ============================================

function addMember() {
    const name = elements.memberNameInput.value.trim();

    if (!name) {
        showAlert('Please enter a member name.');
        return;
    }

    if (state.members.some(m => m.toLowerCase() === name.toLowerCase())) {
        showAlert('This member already exists.');
        return;
    }

    state.members.push(name);
    elements.memberNameInput.value = '';

    // Auto-save to group if we have a group name
    autoSaveGroup();

    renderMembers();
    updatePayerDropdown();
    updateParticipantCheckboxes();
}

function removeMember(name) {
    // Check if member has expenses
    const hasExpenses = state.expenses.some(
        e => e.payer === name || e.participants.includes(name)
    );

    const doRemove = () => {
        if (hasExpenses) {
            // Remove expenses where this member is involved
            state.expenses = state.expenses.filter(
                e => e.payer !== name && !e.participants.includes(name)
            );
        }

        state.members = state.members.filter(m => m !== name);

        // Auto-save to group if we have a group name
        autoSaveGroup();

        renderMembers();
        updatePayerDropdown();
        updateParticipantCheckboxes();
        renderExpenses();
    };

    if (hasExpenses) {
        showConfirm(`${name} has expenses. Removing them will delete related expenses. Continue?`, doRemove);
    } else {
        doRemove();
    }
}

function autoSaveGroup() {
    // Auto-save members and expenses to the current group (only if there are members)
    if (state.currentGroupName) {
        const groups = getSavedGroups();
        if (state.members.length > 0) {
            groups[state.currentGroupName] = {
                members: [...state.members],
                expenses: [...state.expenses],
                nextExpenseId: state.nextExpenseId,
                savedAt: new Date().toISOString()
            };
        } else {
            // Remove group if no members
            delete groups[state.currentGroupName];
        }
        saveGroupsToStorage(groups);
    }
}

function renderMembers() {
    elements.membersList.innerHTML = state.members.map(name => `
        <li>
            <span>${escapeHtml(name)}</span>
            <button type="button" class="remove-btn" onclick="removeMember('${escapeHtml(name)}')" title="Remove ${escapeHtml(name)}">×</button>
        </li>
    `).join('');

    // Update member count
    elements.memberCount.textContent = state.members.length > 0 ? state.members.length : '';

    const hasSufficientMembers = state.members.length >= 2;
    elements.membersHint.classList.toggle('hidden', hasSufficientMembers);
    elements.expenseForm.querySelectorAll('input, select, button').forEach(el => {
        if (el.id !== 'select-all-participants') {
            el.disabled = !hasSufficientMembers;
        }
    });
    // Auto-calculate when we have sufficient data
    if (hasSufficientMembers && state.expenses.length > 0) {
        calculateSettlement();
    } else {
        clearResults();
    }
}

function updatePayerDropdown() {
    const currentValue = elements.expensePayer.value;
    elements.expensePayer.innerHTML = '<option value="">Select payer</option>' +
        state.members.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');

    if (state.members.includes(currentValue)) {
        elements.expensePayer.value = currentValue;
    }
}

function updateParticipantCheckboxes() {
    if (state.members.length === 0) {
        elements.expenseParticipants.innerHTML = '<p class="hint">Add members first</p>';
        return;
    }

    elements.expenseParticipants.innerHTML = state.members.map(name => `
        <label>
            <input type="checkbox" name="participant" value="${escapeHtml(name)}" checked>
            <span>${escapeHtml(name)}</span>
        </label>
    `).join('');

    updateSelectAllState();
}

function updateSelectAllState() {
    const checkboxes = elements.expenseParticipants.querySelectorAll('input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    elements.selectAllParticipants.checked = allChecked;
}

function toggleAllParticipants() {
    const isChecked = elements.selectAllParticipants.checked;
    elements.expenseParticipants.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = isChecked;
    });
}

// ============================================
// Expense Management
// ============================================

function addExpense(event) {
    event.preventDefault();

    const description = elements.expenseDescription.value.trim();
    const amount = parseFloat(elements.expenseAmount.value);
    const payer = elements.expensePayer.value;
    const participants = Array.from(
        elements.expenseParticipants.querySelectorAll('input[type="checkbox"]:checked')
    ).map(cb => cb.value);

    if (!description) {
        showAlert('Please enter a description.');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showAlert('Please enter a valid amount greater than 0.');
        return;
    }

    if (!payer) {
        showAlert('Please select who paid.');
        return;
    }

    if (participants.length === 0) {
        showAlert('Please select at least one person who benefited.');
        return;
    }

    const expense = {
        id: state.nextExpenseId++,
        description,
        amount,
        payer,
        participants
    };

    state.expenses.push(expense);
    autoSaveGroup();
    resetExpenseForm();
    renderExpenses();
}

function removeExpense(id) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    autoSaveGroup();
    renderExpenses();
}

function resetExpenseForm() {
    elements.expenseDescription.value = '';
    elements.expenseAmount.value = '';
    elements.expensePayer.value = '';
    elements.selectAllParticipants.checked = true;
    toggleAllParticipants();
}

function renderExpenses() {
    if (state.expenses.length === 0) {
        elements.expensesList.innerHTML = '';
        elements.noExpensesMsg.classList.remove('hidden');
        elements.totalRow.classList.add('hidden');
        clearResults();
        return;
    }

    elements.noExpensesMsg.classList.add('hidden');
    elements.totalRow.classList.remove('hidden');

    elements.expensesList.innerHTML = state.expenses.map(expense => `
        <li>
            <div class="expense-info">
                <div class="expense-description">${escapeHtml(expense.description)}</div>
                <div class="expense-details">
                    Paid by ${escapeHtml(expense.payer)} · Split among ${expense.participants.length} ${expense.participants.length === 1 ? 'person' : 'people'}
                </div>
            </div>
            <span class="expense-amount">$${expense.amount.toFixed(2)}</span>
            <button type="button" class="remove-btn" onclick="removeExpense(${expense.id})" title="Delete expense">×</button>
        </li>
    `).join('');

    const total = state.expenses.reduce((sum, e) => sum + e.amount, 0);
    elements.totalAmount.textContent = `$${total.toFixed(2)}`;

    // Auto-calculate when we have sufficient data
    if (state.members.length >= 2 && state.expenses.length > 0) {
        calculateSettlement();
    }
}

// ============================================
// Settlement Calculator (Min-Cash-Flow Algorithm)
// ============================================

function calculateSettlement() {
    if (state.members.length < 2 || state.expenses.length === 0) {
        return;
    }

    // Calculate net balance for each person
    const balances = {};
    state.members.forEach(member => {
        balances[member] = 0;
    });

    state.expenses.forEach(expense => {
        const sharePerPerson = expense.amount / expense.participants.length;

        // The payer gets credited the full amount
        balances[expense.payer] += expense.amount;

        // Each participant owes their share
        expense.participants.forEach(participant => {
            balances[participant] -= sharePerPerson;
        });
    });

    // Round balances to avoid floating point issues
    Object.keys(balances).forEach(key => {
        balances[key] = Math.round(balances[key] * 100) / 100;
    });

    // Display balances
    renderBalances(balances);

    // Calculate minimum transactions
    const settlements = calculateMinTransactions(balances);
    renderSettlements(settlements);

    elements.settlementsHint.classList.add('hidden');
    elements.resultsContainer.classList.remove('hidden');
}

function calculateMinTransactions(balances) {
    // Separate into creditors (positive) and debtors (negative)
    const creditors = [];
    const debtors = [];

    Object.entries(balances).forEach(([name, balance]) => {
        if (balance > 0.01) {
            creditors.push({ name, amount: balance });
        } else if (balance < -0.01) {
            debtors.push({ name, amount: -balance }); // Store as positive
        }
    });

    // Sort by amount (descending) for efficiency
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const settlements = [];

    // Match creditors with debtors
    while (creditors.length > 0 && debtors.length > 0) {
        const creditor = creditors[0];
        const debtor = debtors[0];

        const amount = Math.min(creditor.amount, debtor.amount);
        const roundedAmount = Math.round(amount * 100) / 100;

        if (roundedAmount > 0) {
            settlements.push({
                from: debtor.name,
                to: creditor.name,
                amount: roundedAmount
            });
        }

        creditor.amount -= amount;
        debtor.amount -= amount;

        // Remove settled parties
        if (creditor.amount < 0.01) {
            creditors.shift();
        }
        if (debtor.amount < 0.01) {
            debtors.shift();
        }
    }

    return settlements;
}

function renderBalances(balances) {
    const sortedBalances = Object.entries(balances)
        .sort((a, b) => b[1] - a[1]);

    elements.balancesList.innerHTML = sortedBalances.map(([name, balance]) => {
        let className = 'neutral';
        let displayBalance = '$0.00';

        if (balance > 0.01) {
            className = 'positive';
            displayBalance = `+$${balance.toFixed(2)}`;
        } else if (balance < -0.01) {
            className = 'negative';
            displayBalance = `-$${Math.abs(balance).toFixed(2)}`;
        }

        return `
            <li>
                <span>${escapeHtml(name)}</span>
                <span class="${className}">${displayBalance}</span>
            </li>
        `;
    }).join('');
}

function renderSettlements(settlements) {
    if (settlements.length === 0) {
        elements.settlementsList.innerHTML = '';
        elements.settlementsHint.classList.add('hidden');
        elements.allSettledMsg.classList.remove('hidden');
        return;
    }

    elements.settlementsHint.classList.add('hidden');
    elements.allSettledMsg.classList.add('hidden');
    elements.settlementsList.innerHTML = settlements.map(s => `
        <li>
            <span>${escapeHtml(s.from)}</span>
            <span class="arrow">&gt;&gt;</span>
            <span>${escapeHtml(s.to)}</span>
            <span class="amount">$${s.amount.toFixed(2)}</span>
        </li>
    `).join('');
}

function clearResults() {
    elements.resultsContainer.classList.add('hidden');
    elements.balancesList.innerHTML = '';
    elements.settlementsList.innerHTML = '';
    elements.settlementsHint.classList.remove('hidden');
}

// ============================================
// Share Functionality
// ============================================

async function shareSettlements() {
    // Get current settlements from the DOM
    const settlementItems = elements.settlementsList.querySelectorAll('li');

    if (settlementItems.length === 0) {
        showAlert('No settlements to share.');
        return;
    }

    // Extract settlement data
    const settlements = Array.from(settlementItems).map(li => {
        const spans = li.querySelectorAll('span');
        return {
            from: spans[0].textContent,
            to: spans[2].textContent,
            amount: parseFloat(spans[3].textContent.replace('$', ''))
        };
    });

    try {
        // Generate both image types
        const groupName = state.currentGroupName || 'Friends';
        const settlementImages = await ShareImage.generateImages(settlements, groupName);
        const expenseImages = await ShareImage.generateExpenseImages(state.expenses, groupName);
        const allImages = [...settlementImages, ...expenseImages];

        // Share or download
        await ShareImage.shareOrDownload(allImages);
    } catch (err) {
        console.error('Share failed:', err);
        showAlert('Failed to generate image. Please try again.');
    }
}

function resetAllExpenses() {
    showConfirm('Are you sure you want to reset all expenses? This cannot be undone.', () => {
        state.expenses = [];
        state.nextExpenseId = 1;
        autoSaveGroup();
        renderExpenses();
        clearResults();
    });
}

function createNewGroup() {
    goBack();
}

// ============================================
// Custom Alert System
// ============================================

function showAlert(message, onClose) {
    const modal = document.createElement('div');
    modal.className = 'custom-alert-overlay';
    modal.innerHTML = `
        <div class="custom-alert">
            <div class="custom-alert-content">
                <p>${escapeHtml(message)}</p>
            </div>
            <div class="custom-alert-actions">
                <button type="button" class="btn btn-primary custom-alert-ok">OK</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const okBtn = modal.querySelector('.custom-alert-ok');
    const closeModal = () => {
        modal.remove();
        if (onClose) onClose();
    };

    okBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    okBtn.focus();
}

function showConfirm(message, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'custom-alert-overlay';
    modal.innerHTML = `
        <div class="custom-alert">
            <div class="custom-alert-content">
                <p>${escapeHtml(message)}</p>
            </div>
            <div class="custom-alert-actions">
                <button type="button" class="btn btn-secondary custom-alert-cancel">Cancel</button>
                <button type="button" class="btn btn-primary custom-alert-confirm">Confirm</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const confirmBtn = modal.querySelector('.custom-alert-confirm');
    const cancelBtn = modal.querySelector('.custom-alert-cancel');

    const closeModal = (confirmed) => {
        modal.remove();
        if (confirmed && onConfirm) onConfirm();
        if (!confirmed && onCancel) onCancel();
    };

    confirmBtn.addEventListener('click', () => closeModal(true));
    cancelBtn.addEventListener('click', () => closeModal(false));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(false);
    });

    confirmBtn.focus();
}

// ============================================
// Utility Functions
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatRelativeDate(isoString) {
    if (!isoString) return '';

    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
}

// ============================================
// Event Listeners
// ============================================

function initializeEventListeners() {
    // Landing screen events
    elements.createGroupBtn.addEventListener('click', createGroup);
    elements.newGroupName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            createGroup();
        }
    });

    // Back button
    elements.backBtn.addEventListener('click', goBack);

    // Member events
    elements.addMemberBtn.addEventListener('click', addMember);
    elements.memberNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addMember();
        }
    });

    // Expense form events
    elements.expenseForm.addEventListener('submit', addExpense);
    elements.selectAllParticipants.addEventListener('change', toggleAllParticipants);
    elements.expenseParticipants.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            updateSelectAllState();
        }
    });

    // Results events
    elements.shareBtn.addEventListener('click', shareSettlements);

    // Footer events
    elements.resetBtn.addEventListener('click', resetAllExpenses);
    elements.newGroupBtn.addEventListener('click', createNewGroup);
}

// ============================================
// Initialize Application
// ============================================

function init() {
    initializeEventListeners();
    showLandingScreen();
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
