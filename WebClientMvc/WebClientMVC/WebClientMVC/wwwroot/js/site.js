const API_BASE = "http://127.0.0.1:8000";
const MVC_BASE = "";
let currentRole = localStorage.getItem("spotifake_role") || null;
let accessToken = localStorage.getItem("spotifake_access_token") || "";

const TEST_CREDENTIALS = {
	user: { username: "user_test", password: "User@123" },
	artist: { username: "artist_test", password: "Artist@123" },
	admin: { username: "admin_test", password: "Admin@123" }
};

function showSection(sectionId) {
	if (!currentRole) {
		document.getElementById("loginError").textContent = "Please login first.";
		document.getElementById("loginGate").style.display = "flex";
		return;
	}

	document.querySelectorAll(".section").forEach((section) => section.classList.remove("active"));
	const selected = document.getElementById(sectionId);
	if (selected) {
		selected.classList.add("active");
	}
}

function handleFileSelect() {
	const fileInput = document.getElementById("fileInput");
	const uploadArea = document.getElementById("uploadArea");
	const file = fileInput?.files?.[0];
	if (file && uploadArea) {
		uploadArea.innerHTML = `<p>Selected: ${file.name}</p>`;
	}
}

function fakeUpload() {
	const status = document.getElementById("uploadStatus");
	if (status) {
		status.innerHTML = '<div class="login-status">Frontend upload UI is ready in MVC mode.</div>';
	}
}

async function checkBackendHealth() {
	try {
		const response = await fetch(`${MVC_BASE}/auth/me`, {
			headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
		});
		alert(response.ok ? "JWT is valid in the MVC app." : "JWT validation failed.");
	} catch (error) {
		alert(`Cannot validate the JWT: ${error.message}`);
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const loginForm = document.getElementById("loginForm");
	const loginError = document.getElementById("loginError");
	const loginStatus = document.getElementById("loginStatus");
	const loginGate = document.getElementById("loginGate");

	if (!loginForm || !loginError || !loginStatus || !loginGate) {
		return;
	}

	loginForm.addEventListener("submit", (event) => {
		event.preventDefault();

		const accountType = document.getElementById("accountType")?.value;
		const username = document.getElementById("loginUsername")?.value?.trim();
		const password = document.getElementById("loginPassword")?.value;

		if (!accountType || !TEST_CREDENTIALS[accountType]) {
			loginError.textContent = "Invalid account type.";
			return;
		}

		const expected = TEST_CREDENTIALS[accountType];
		if (username === expected.username && password === expected.password) {
			loginError.textContent = "";
			loginStatus.textContent = "Signing in...";

			fetch(`${MVC_BASE}/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					username,
					password,
					role: accountType
				})
			})
				.then(async (response) => {
					const raw = await response.text();
					const payload = raw ? JSON.parse(raw) : null;

					if (!response.ok) {
						throw new Error(payload?.detail || payload?.message || "Login failed.");
					}

					return payload;
				})
				.then((data) => {
					accessToken = data?.accessToken || data?.access_token || "";
					currentRole = data?.role || accountType;
					localStorage.setItem("spotifake_access_token", accessToken);
					localStorage.setItem("spotifake_role", currentRole);
					loginStatus.textContent = `Logged in as ${currentRole}.`;

					setTimeout(() => {
						loginGate.style.display = "none";
						document.querySelectorAll(".section").forEach((section) => section.classList.remove("active"));
						const home = document.getElementById("home");
						if (home) {
							home.classList.add("active");
						}
					}, 200);
				})
				.catch((error) => {
					loginStatus.textContent = "";
					loginError.textContent = error.message;
				});
		} else {
			loginStatus.textContent = "";
			loginError.textContent = "Invalid credentials for the selected account type.";
		}
	});
});
