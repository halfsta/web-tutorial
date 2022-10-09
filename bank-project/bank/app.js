let state = Object.freeze({
  account: null
});

const storageKey = 'savedAccount';

const loginPath = '/login';
const dashboardPath = '/dashboard';

const routes = {
  '/login': { templateId: 'login' },
  '/dashboard': { templateId: 'dashboard', init: refresh },
};

function updateRoute() {
  const path = window.location.pathname;
  const route = routes[path];

  if (!route) {
    return navigate(dashboardPath);
  }

  const template = document.getElementById(route.templateId);
  const view = template.content.cloneNode(true);
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(view);

  if (typeof route.init === 'function') {
    route.init();
  }
}

function navigate(path) {
  window.history.pushState({}, path, path);
  updateRoute();
}

function onLinkClick(event) {
  event.preventDefault();
  navigate(event.target.href);
}

async function register() {
  const registerForm = document.getElementById('registerForm');
  const formData = new FormData(registerForm);
  const data = Object.fromEntries(formData);
  const jsonData = JSON.stringify(data);
  const result = await createAccount(jsonData);

  if (result.error) {
    return updateElement('registerError', 'An error occurred: ' + result.error);
  }

  console.log('Account create!', result);

  updateState('account', result);
  navigate(dashboardPath);
}

async function createAccount(account) {
  try {
    const response = await fetch('//localhost:5000/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: account
    });
    return await response.json();
  } catch (error) {
    return { error: error.message || 'Unknown error' };
  }
}

async function createTransaction(user, transaction) {
  try {
    const response = await fetch('//localhost:5000/api/accounts/' + user + '/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: transaction
    });
    return await response.json();
  } catch (error) {
    return { error: error.message || 'Unknown error' };
  }
}

async function login() {
  const loginForm = document.getElementById('loginForm');
  const user = loginForm.user.value;
  const data = await getAccount(user);

  if (data.error) {
    return updateElement('loginError', data.error);
  }

  updateState('account', data);
  navigate(dashboardPath);
}

async function getAccount(user) {
  try {
    const response = await fetch('//localhost:5000/api/accounts/' + encodeURIComponent(user));
    return await response.json();
  } catch (error) {
    return { error: error.message || 'Unknown error' };
  }
}

function updateElement(id, textOrNode) {
  const element = document.getElementById(id);
  element.textContent = ''; // Removes all children
  element.append(textOrNode);
}

function updateDashboard() {
  const account = state.account;
  if (!account) {
    return logout();
  }

  updateElement('description', account.description);
  updateElement('balance', account.balance.toFixed(2));
  updateElement('currency', account.currency);

  const transactionRows = document.createDocumentFragment();
  for (const transaction of account.transactions) {
    const transactionRow = createTransactionRow(transaction);
    transactionRows.appendChild(transactionRow);
  }
  updateElement('transactions', transactionRows);
}

function createTransactionRow(transaction) {
  const template = document.getElementById('transaction');
  const transactionRow = template.content.cloneNode(true);
  const tr = transactionRow.querySelector('tr');
  tr.children[0].textContent = transaction.date;
  tr.children[1].textContent = transaction.object;
  tr.children[2].textContent = transaction.amount.toFixed(2);
  return transactionRow;
}

function updateState(property, newData) {
  state = Object.freeze({
    ...state,
    [property]: newData
  });

  //console.log(state);
  localStorage.setItem(storageKey, JSON.stringify(state.account));
}

function logout() {
  updateState('account', null);
  navigate(loginPath);
}

async function updateAccountData() {
  const account = state.account;
  if (!account) {
    return logout();
  }

  const data = await getAccount(account.user);
  if (data.error) {
    return logout();
  }

  updateState('account', data);
}

function addTransaction() {
  const dialog = document.getElementById('addTransactionDialog');
  dialog.classList.add('show');

  const transactionForm = document.getElementById('addTransactionForm');
  transactionForm.reset();

  transactionForm.date.valueAsDate = new Date();
}

async function cancelTransaction() {
  console.log('cancel button');
  const dialog = document.getElementById('addTransactionDialog');
  dialog.classList.remove('show');
}

async function confirmTransaction() {
  const dialog = document.getElementById('addTransactionDialog');
  dialog.classList.remove('show');

  const transactionForm = document.getElementById('addTransactionForm');

  const formData = new FormData(transactionForm);
  const jsonData = JSON.stringify(Object.fromEntries(formData));
  const data = await createTransaction(state.account.user, jsonData);

  if (data.error) {
    return updateElement('transactionError', data.error);
  }

  const newAccount = {
    ...state.account,
    balance: state.account.balance + data.amount,
    transactions: [...state.account.transactions, data]
  }
  updateState('account', newAccount);
  updateDashboard();
}

async function refresh() {
  await updateAccountData();
  updateDashboard();
}

function init() {
  const savedAccount = localStorage.getItem(storageKey);
  if (savedAccount) {
    updateState('account', JSON.parse(savedAccount));
  }

  // original init code
  window.onpopstate = () => updateRoute();
  updateRoute();
}

init();