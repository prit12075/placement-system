async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errBox = document.getElementById('authErr');

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            errBox.style.display = 'block';
            errBox.textContent = data.error || 'Authentication failed';
            return;
        }

        // Store the user
        localStorage.setItem('user', JSON.stringify(data));

        // Navigate based on role
        if (data.role === 'admin') {
            window.location.href = '/management.html';
        } else if (data.role === 'student') {
            window.location.href = '/student.html';
        }
    } catch (e) {
        errBox.style.display = 'block';
        errBox.textContent = 'Network err. Could not reach server.';
        console.error(e);
    }
}

// Redirect if already logged in!
document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('user');
    if (saved) {
        try {
            const user = JSON.parse(saved);
            if (user.role === 'admin') window.location.href = '/management.html';
            if (user.role === 'student') window.location.href = '/student.html';
        } catch (e) { }
    }
});
