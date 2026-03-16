document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML with delete icon
        let participantsHTML = "";
        if (details.participants.length > 0) {
          participantsHTML = details.participants.map((p) => `
            <div class="participant-row">
              <span class="participant-email">${p}</span>
              <button class="delete-participant-btn" title="Remove participant" data-activity="${name}" data-email="${p}">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="10" fill="#f44336"/>
                  <path d="M6 6l8 8M14 6l-8 8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          `).join("");
        } else {
          participantsHTML = `<div class="no-participants">No participants yet</div>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p><strong>Participants (${details.participants.length}):</strong></p>
            <div class="participants-list no-bullets">
              ${participantsHTML}
            </div>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners for delete buttons
      document.querySelectorAll(".delete-participant-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.preventDefault();
          const activity = btn.getAttribute("data-activity");
          const email = btn.getAttribute("data-email");
          if (!activity || !email) return;
          if (!confirm(`Remove ${email} from ${activity}?`)) return;
          try {
            const resp = await fetch(`/activities/${encodeURIComponent(activity)}/participant?email=${encodeURIComponent(email)}`, {
              method: "DELETE",
            });
            const result = await resp.json();
            if (resp.ok) {
              messageDiv.textContent = result.message;
              messageDiv.className = "success";
              fetchActivities();
            } else {
              messageDiv.textContent = result.detail || "Failed to remove participant.";
              messageDiv.className = "error";
            }
            messageDiv.classList.remove("hidden");
            setTimeout(() => messageDiv.classList.add("hidden"), 4000);
          } catch (error) {
            messageDiv.textContent = "Failed to remove participant.";
            messageDiv.className = "error";
            messageDiv.classList.remove("hidden");
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
