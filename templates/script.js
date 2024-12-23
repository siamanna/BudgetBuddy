// Firebase Realtime Database Setup
const database = firebase.database();

// Expense Form Handling
const form = document.getElementById('expense-form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.getElementById('expense-name').value;
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const category = document.getElementById('expense-category').value;

  // Push to Firebase
  database.ref('expenses/').push({ name, amount, category });
  form.reset();
});

// CSV Upload Handling
const uploadBtn = document.getElementById('upload-btn');
const csvFileInput = document.getElementById('csv-file');

uploadBtn.addEventListener('click', () => {
  const file = csvFileInput.files[0];
  if (!file) {
    alert('Please select a CSV file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const rows = event.target.result.split('\n');
    rows.forEach((row) => {
      const [name, amount, category] = row.split(',');
      if (name && amount && category) {
        database.ref('expenses/').push({
          name: name.trim(),
          amount: parseFloat(amount.trim()),
          category: category.trim(),
        });
      }
    });
    alert('CSV uploaded successfully!');
    csvFileInput.value = ''; // Clear input after upload
  };
  reader.readAsText(file);
});

// Fetch and Display Data
const ctx = document.getElementById('expense-chart').getContext('2d');
const chartData = { labels: [], data: [] };

const updateChart = () => {
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: chartData.labels,
      datasets: [{
        label: 'Spending by Category',
        data: chartData.data,
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#AA65CC'],
      }]
    }
  });
};

database.ref('expenses/').on('value', (snapshot) => {
  const data = snapshot.val();
  const categories = {};

  // Aggregate Data by Category
  for (let id in data) {
    const expense = data[id];
    categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
  }

  chartData.labels = Object.keys(categories);
  chartData.data = Object.values(categories);
  updateChart();

  // Generate Recommendations
  generateRecommendations(categories);
});

// AI-Powered Recommendations
const generateRecommendations = (categories) => {
  const recommendationList = document.getElementById('recommendation-list');
  recommendationList.innerHTML = ''; // Clear previous recommendations

  for (const [category, amount] of Object.entries(categories)) {
    if (amount > 200) { // Example threshold for overspending
      const recommendation = document.createElement('li');
      recommendation.textContent = `Consider reducing your ${category} expenses by 10% to save $${(amount * 0.1).toFixed(2)}.`;
      recommendationList.appendChild(recommendation);
    }
  }
};

// Goal Setting
const goalForm = document.getElementById('goal-form');
const goalStatus = document.getElementById('goal-status');
let currentGoal = 0;
let totalExpenses = 0;

// Handle Goal Submission
goalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  currentGoal = parseFloat(document.getElementById('goal-amount').value);
  goalStatus.textContent = `Goal set to $${currentGoal}. Track your spending below!`;
  goalForm.reset();
});

// Update Goal Status with Total Expenses
database.ref('expenses/').on('value', (snapshot) => {
  const data = snapshot.val();
  totalExpenses = 0;

  for (let id in data) {
    totalExpenses += data[id].amount;
  }

  if (currentGoal > 0) {
    if (totalExpenses > currentGoal) {
      goalStatus.textContent = `You have exceeded your goal by $${(totalExpenses - currentGoal).toFixed(2)}.`;
      goalStatus.style.color = '#ff4d4d'; // Red for exceeding goal
    } else {
      goalStatus.textContent = `You are $${(currentGoal - totalExpenses).toFixed(2)} under your goal. Keep going!`;
      goalStatus.style.color = '#2d8659'; // Green for under goal
    }
  }
});

// Export Expenses to CSV
const exportBtn = document.getElementById('export-btn');
exportBtn.addEventListener('click', () => {
  database.ref('expenses/').once('value', (snapshot) => {
    const data = snapshot.val();
    let csvContent = 'Name,Amount,Category\n';

    for (let id in data) {
      const { name, amount, category } = data[id];
      csvContent += `${name},${amount},${category}\n`;
    }

    // Create a Blob and Download the CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'expenses.csv');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
});
