

      const passwordInput = document.getElementById("password");
      const strengthFill = document.getElementById("strength-fill");
      const strengthText = document.getElementById("strength-text");
      const generateBtn = document.getElementById("generatePasswordBtn");

      passwordInput.addEventListener("input", () => {
        const val = passwordInput.value;
        if (!val) {
          strengthFill.style.width = "0%";
          strengthText.textContent = "";
          return;
        }

        const result = zxcvbn(val);
        const score = result.score;
        const pct = ((score + 1) / 5) * 100;

        const colors = ["#e53935", "#fb8c00", "#fdd835", "#9ccc65", "#43a047"];
        const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

        strengthFill.style.width = pct + "%";
        strengthFill.style.background = colors[score];
        strengthText.textContent = labels[score];
      });

     generateBtn.addEventListener("click", async () => {
  try {
    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";
    const res = await fetch("/generate-password", {
      credentials: "include",
    });
    const data = await res.json();
    passwordInput.value = data.password;

    // FIX: This will now trigger the strength bar correctly
    passwordInput.dispatchEvent(new Event("input"));
  } catch (err) {
    alert("Failed to generate password.");
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate Password";
  }
});



      // 🔒 Redirect if not logged in
      if (localStorage.getItem("isLoggedIn") !== "true") {
        window.location.href = "/login.html";
      }

      // 🔓 Logout
      document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("token");
        window.location.href = "/";
      });

      // ✅ Add Credential and send to server
      document
        .getElementById("addCredentialForm")
        .addEventListener("submit", async function (e) {
          e.preventDefault();

          const site = document.getElementById("site").value.trim();
          const username = document.getElementById("username").value.trim();
          const password = document.getElementById("password").value.trim();
          const token = localStorage.getItem("token");

          if (!token) {
            alert("You are not logged in.");
            return;
          }

          try {
            const res = await fetch("/credentials", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ site, username, password }),
            });

            const result = await res.json();

            if (res.ok) {
              alert("Credential added successfully!");
              this.reset();
              location.reload(); // reload to show updated credentials
            } else {
              alert(`Error: ${result.message}`);
            }
          } catch (err) {
            console.error(err);
            alert("Something went wrong while adding the credential.");
          }
        });

  document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("credentialsContainer");
    const token = localStorage.getItem("token");
    passwordInput.dispatchEvent(new Event("input"));

    if (!token) {
      window.location.href = "/login.html";
      return;
    }

    try {
      const res = await fetch("/vault", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        if (data.length === 0) {
          container.innerHTML = "<p>No credentials saved yet.</p>";
          return;
        }

        data.forEach((cred) => {
          const item = document.createElement("div");
          item.className = "credential-item";
          item.dataset.id = cred._id;

          item.innerHTML = `
            <div class="credential-details">
              <strong>${cred.site}</strong><br/>
              ${cred.username}<br/>
              ${cred.password}
            </div>
            <div class="credential-actions">
              <button class="edit-btn">Edit</button>
              <button class="delete-btn">Delete</button>
            </div>
          `;

          container.appendChild(item);
        });

        // Handle DELETE
        container.querySelectorAll(".delete-btn").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const card = e.target.closest(".credential-item");
            const id = card.dataset.id;

            if (confirm("Are you sure you want to delete this credential?")) {
              const res = await fetch(`/credentials/${id}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              const result = await res.json();

              if (res.ok) {
                card.remove();
              } else {
                alert(result.message || "Failed to delete.");
              }
            }
          });
        });

        // Handle EDIT
        container.querySelectorAll(".edit-btn").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const card = e.target.closest(".credential-item");
            const id = card.dataset.id;

            const currentSite = card.querySelector("strong").innerText;
            const currentUsername = card.querySelector(".credential-details").childNodes[2].textContent.trim();
            const currentPassword = card.querySelector(".credential-details").childNodes[4].textContent.trim();

            const site = prompt("Edit site:", currentSite);
            const username = prompt("Edit username:", currentUsername);
            const password = prompt("Edit password:", currentPassword);

            if (site && username && password) {
              const res = await fetch(`/credentials/${id}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ site, username, password }),
              });

              const result = await res.json();

              if (res.ok) {
                // Reload page or update card manually
                location.reload();
              } else {
                alert(result.message || "Failed to update.");
              }
            }
          });
        });

      } else {
        container.innerHTML = `<p>Error: ${data.message || "Failed to load credentials"}</p>`;
      }
    } catch (err) {
      console.error(err);
      container.innerHTML = "<p>Something went wrong while loading your credentials.</p>";
    }
  });
  const togglePasswordBtn = document.getElementById("togglePassword");

togglePasswordBtn.addEventListener("click", () => {
  const type = passwordInput.getAttribute("type");
  const isPassword = type === "password";

  passwordInput.setAttribute("type", isPassword ? "text" : "password");
  togglePasswordBtn.textContent = isPassword ? "Hide" : "Show";
});

