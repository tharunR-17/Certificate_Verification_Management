// Demo credentials (in real app, these would be in a secure database)
const DEMO_CREDENTIALS = {
    institute: {
        'faculty@institute.edu': 'password123'
    },
    student: {
        'STU001': 'student123'
    }
};

// Show login form based on type
function showLogin(type) {
    document.getElementById('loginSelection').style.display = 'none';
    document.querySelectorAll('.login-form').forEach(form => form.classList.remove('active'));
    document.getElementById(`${type}Login`).classList.add('active');
    document.querySelectorAll('.back-btn').forEach(btn => btn.style.display = 'block');
}

// Show login selection
function showLoginSelection() {
    document.getElementById('loginSelection').style.display = 'block';
    document.querySelectorAll('.login-form').forEach(form => form.classList.remove('active'));
    document.querySelectorAll('.back-btn').forEach(btn => btn.style.display = 'none');
}

// Handle form submissions
document.getElementById('instituteLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('instituteEmail').value;
    const password = document.getElementById('institutePassword').value;

    if (DEMO_CREDENTIALS.institute[email] === password) {
        // Store login type and redirect
        sessionStorage.setItem('userType', 'institute');
        sessionStorage.setItem('userEmail', email);
        window.location.href = '/index.html';
    } else {
        alert('Invalid credentials');
    }
});

document.getElementById('studentLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('studentId').value;
    const password = document.getElementById('studentPassword').value;

    if (DEMO_CREDENTIALS.student[studentId] === password) {
        // Store login type and redirect
        sessionStorage.setItem('userType', 'student');
        sessionStorage.setItem('studentId', studentId);
        window.location.href = '/index.html';
    } else {
        alert('Invalid credentials');
    }
});
