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
});
