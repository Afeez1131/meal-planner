let currentMealData = null;
const EXPIRATION_DAYS = 7; // Optimal balance

let foodDatabase;
/*foodDatabase = {
  base: {
    "Rice Dishes": ["Jollof Rice", "White Rice", "Coconut Rice", "Fried Rice"],
    Swallows: ["Amala", "Eba", "Pounded Yam", "Semovita", "Fufu"],
    Other: ["Yam", "Beans", "Bread", "Pap", "Custard"],
  },
  extras: {
    Proteins: ["Chicken", "Fish", "Beef", "Eggs", "Ponmo"],
    Soups: ["Ewedu", "Egusi", "Okro", "Vegetable Soup", "Gbegiri"],
    Sides: ["Plantain", "Coleslaw", "Salad", "Moin-Moin"],
  },
};*/

$(document).ready(function () {
  $.ajax({
    url: "/ajax-load-foods",
    type: "GET",
    datatype: "json",
    success: function (response) {
      foodDatabase = response;
      setup();

      const sharedPlanId = $.urlParam("id");
      if (sharedPlanId) {
        loadSharedMealPlan(sharedPlanId);
       // history.replaceState(null, "", window.location.pathname);
      }
    },
    error: function (xhr, status, error) {
      console.error("Error loading food database:", error);
      showToast("error", "Failed to load food database");
    },
  });
});

function setup() {
  // Generate 30 days meal
  const mealGrid = $(".meal-grid");
  for (let i = 1; i <= 30; i++) {
    mealGrid.append(createDayCard(i));
  }

  // Initialize Select2 for all dropdowns
  $(".base-select").select2({
    placeholder: "Select base food",
    allowClear: true,
  });

  $(".extras-select").select2({
    placeholder: "Select extras",
    multiple: true,
    allowClear: true,
  });

  // Handle base food selection
  $(".base-select").on("change", function () {
    const container = $(this).closest(".meal-section").find(".selected-foods");
    const selectedBase = $(this).val();

    // Remove existing base
    container.find(".selected-item.base").remove();
    updateProgress();
    saveMealPlanToLocalStorage();
    if (selectedBase) {
      addSelectedFood(container, selectedBase, "base");
    }
  });

  // Handle extras selection
  $(".extras-select").on("change", function () {
    const container = $(this).closest(".meal-section").find(".selected-foods");
    const selectedExtras = $(this).val();

    // Remove all extras
    container.find(".selected-item.extra").remove();

    // Add new selections
    selectedExtras.forEach((extra) => {
      addSelectedFood(container, extra, "extra");
    });
    updateProgress();
    saveMealPlanToLocalStorage();
  });

  // Remove loading overlay
  $("#global-loading-overlay").fadeOut(300, function () {
    $(this).remove();
  });

  // remove hidden from export tip
  let exportDiv = $("#export-tip");
  if (exportDiv.hasClass("d-none")) {
    $("#export-tip").toggleClass("d-none", false);
  }
  loadMealPlanFromLocalStorage();
}

// Global variables for duplication
let currentMealSection = null;
let duplicateMealModal = null;

// Initialize modal
document.addEventListener("DOMContentLoaded", function () {
  const modalElement = document.getElementById("duplicateMealModal");

  if (modalElement) {
    duplicateMealModal = new bootstrap.Modal(modalElement, {
      backdrop: true, // Allow closing by clicking outside
      keyboard: true, // Allow closing with ESC key
    });
  }
});

// Enhanced duplicate meal function
function duplicateMeal(button) {
  currentMealSection = button.closest(".meal-section");
  const currentDay = parseInt(button.closest(".day-card").dataset.day);

  // Populate day checkboxes
  const checkboxesContainer = document.querySelector(".day-checkboxes");
  checkboxesContainer.innerHTML = "";

  for (let i = currentDay + 1; i <= 30; i++) {
    const checkbox = document.createElement("div");
    checkbox.className = "day-checkbox";
    checkbox.innerHTML = `
    <input type="checkbox" id="day${i}" value="${i}">
    <label for="day${i}">Day ${i}</label>
`;
    checkboxesContainer.appendChild(checkbox);
  }

  duplicateMealModal.show();
}

function executeDuplication() {
  const selectedDays = Array.from(
    document.querySelectorAll(".day-checkboxes input:checked")
  ).map((cb) => parseInt(cb.value));

  if (selectedDays.length === 0) {
    showToast("error", "Please select at least one day");
    return;
  }

  const mealType = currentMealSection.dataset.meal;
  const baseValue = $(currentMealSection).find(".base-select").val();
  const extrasValues = $(currentMealSection).find(".extras-select").val();

  selectedDays.forEach((day) => {
    const targetCard = document.querySelector(`.day-card[data-day="${day}"]`);
    if (targetCard) {
      const targetSection = targetCard.querySelector(
        `.meal-section[data-meal="${mealType}"]`
      );
      $(targetSection).find(".base-select").val(baseValue).trigger("change");
      $(targetSection)
        .find(".extras-select")
        .val(extrasValues)
        .trigger("change");

      // Highlight the updated day briefly
      targetCard.classList.add("day-highlight");
      setTimeout(() => targetCard.classList.remove("day-highlight"), 1000);
    }
  });

  duplicateMealModal.hide();
  showToast("success", `Meal duplicated to ${selectedDays.length} day(s)`);
}

function createDayCard(day) {
  return `
<div class="day-card" data-day="${day}">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">Ramadan Day ${day}</h5>
        <!-- Copy Day Button with Font Awesome icon -->
        <button onclick="showCopyModal(this)" class="btn btn-sm btn-outline-primary copy-day-btn no-print" title="Copy entire day">
            <i class="fas fa-copy"></i> Duplicate Day
        </button>
    </div>

    <!-- Suhoor Section -->
    <div class="meal-section" data-meal="suhoor" draggable="true">
        <div class="meal-actions">
            <button onclick="duplicateMeal(this)" title="Duplicate to next day">
                <i class="fas fa-copy"></i>
            </button>
            <span class="drag-handle">⋮⋮</span>
        </div>
        <h6><i class="fas fa-sunrise"></i> Suhoor</h6>
        <select class="base-select" data-meal="suhoor">
            <option value="">Select base food...</option>
            ${generateFoodOptions(foodDatabase.base)}
        </select>
        <select class="extras-select" multiple data-meal="suhoor">
            ${generateFoodOptions(foodDatabase.extras)}
        </select>
        <div class="selected-foods"></div>
    </div>

    <!-- Iftar Section -->
    <div class="meal-section" data-meal="iftar" draggable="true">
        <div class="meal-actions">
            <button onclick="duplicateMeal(this)" title="Duplicate to next day">
                <i class="fas fa-copy"></i>
            </button>
            <span class="drag-handle">⋮⋮</span>
        </div>
        <h6><i class="fas fa-sunset"></i> Iftar</h6>
        <select class="base-select" data-meal="iftar">
            <option value="">Select base food...</option>
            ${generateFoodOptions(foodDatabase.base)}
        </select>
        <select class="extras-select" multiple data-meal="iftar">
            ${generateFoodOptions(foodDatabase.extras)}
        </select>
        <div class="selected-foods"></div>
    </div>
</div>
`;
}

function generateFoodOptions(categories) {
  let options = "";

  for (let category in categories) {
    if (categories.hasOwnProperty(category)) {
      options += `<optgroup label="${
        category.charAt(0).toUpperCase() + category.slice(1)
      }">`;
      categories[category].forEach((food) => {
        options += `<option value="${food}">${food}</option>`;
      });
      options += "</optgroup>";
    }
  }
  return options;
}

// Duplicate meal function
function duplicateMeal(button) {
  const currentMealSection = button.closest(".meal-section");
  const currentDay = parseInt(button.closest(".day-card").dataset.day);
  const nextDay = currentDay + 1;
  const mealType = currentMealSection.dataset.meal;

  // Find next day's corresponding meal section
  const nextDayCard = document.querySelector(
    `.day-card[data-day="${nextDay}"]`
  );
  if (!nextDayCard) {
    showToast("error", "No next day available");
    return;
  }

  const nextDayMealSection = nextDayCard.querySelector(
    `.meal-section[data-meal="${mealType}"]`
  );

  // Copy selected values
  const baseValue = $(currentMealSection).find(".base-select").val();
  const extrasValues = $(currentMealSection).find(".extras-select").val();

  // Set values in next day
  $(nextDayMealSection).find(".base-select").val(baseValue).trigger("change");
  $(nextDayMealSection)
    .find(".extras-select")
    .val(extrasValues)
    .trigger("change");

  showToast("success", "Meal duplicated to next day");
}

// Keep track of which meal section is being copied
const copyModal = new bootstrap.Modal(document.getElementById("copyMealModal"));

// Updated showCopyModal function
function showCopyModal(button) {
  const dayCard = button.closest(".day-card");
  const currentDay = parseInt(dayCard.dataset.day);

  // Store reference to current day's data
  currentMealData = {
    day: currentDay,
    suhoor: {
      base: $(dayCard).find('[data-meal="suhoor"] .base-select').val(),
      extras: $(dayCard).find('[data-meal="suhoor"] .extras-select').val(),
    },
    iftar: {
      base: $(dayCard).find('[data-meal="iftar"] .base-select').val(),
      extras: $(dayCard).find('[data-meal="iftar"] .extras-select').val(),
    },
  };

  // Populate day grid
  const dayGrid = document.querySelector(".day-grid");
  dayGrid.innerHTML = "";

  for (let i = 1; i <= 30; i++) {
    if (i !== currentDay) {
      const checkbox = document.createElement("div");
      checkbox.className = "day-checkbox";
      checkbox.innerHTML = `
        <input type="checkbox" id="copyDay${i}" value="${i}">
        <label for="copyDay${i}">Day ${i}</label>
    `;
      dayGrid.appendChild(checkbox);
    }
  }

  // Show modal
  const copyModal = new bootstrap.Modal(
    document.getElementById("copyMealModal")
  );
  copyModal.show();
}

// Updated copyToSelectedDays function
function copyToSelectedDays() {
  if (!currentMealData) {
    showToast("error", "No meal data to copy");
    return;
  }

  const selectedDays = Array.from(
    document.querySelectorAll(".day-checkbox input:checked")
  ).map((cb) => parseInt(cb.value));

  if (selectedDays.length === 0) {
    showToast("error", "Please select at least one day");
    return;
  }

  selectedDays.forEach((day) => {
    const targetCard = document.querySelector(`.day-card[data-day="${day}"]`);
    if (targetCard) {
      // Copy Suhoor
      const suhoorSection = targetCard.querySelector('[data-meal="suhoor"]');
      $(suhoorSection)
        .find(".base-select")
        .val(currentMealData.suhoor.base)
        .trigger("change");
      $(suhoorSection)
        .find(".extras-select")
        .val(currentMealData.suhoor.extras)
        .trigger("change");

      // Copy Iftar
      const iftarSection = targetCard.querySelector('[data-meal="iftar"]');
      $(iftarSection)
        .find(".base-select")
        .val(currentMealData.iftar.base)
        .trigger("change");
      $(iftarSection)
        .find(".extras-select")
        .val(currentMealData.iftar.extras)
        .trigger("change");

      // Visual feedback
      targetCard.classList.add("highlight");
      setTimeout(() => targetCard.classList.remove("highlight"), 1000);
    }
  });

  // Close modal and show success message
  const copyModal = bootstrap.Modal.getInstance(
    document.getElementById("copyMealModal")
  );
  if (copyModal) {
    copyModal.hide();
  }

  showToast("success", `Day copied to ${selectedDays.length} day(s)`);

  // Reset current meal data
  currentMealData = null;
}

// Make sure the modal HTML is present
function initializeCopyFunctionality() {
  // Check if modal exists, if not, create it
  if (!document.getElementById("copyMealModal")) {
    const modalHTML = `
    <div class="modal fade" id="copyMealModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Duplicate Day to Other Days</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="copy-options mb-3">
                        <button class="btn btn-sm btn-outline-primary" onclick="selectAll()">Select All</button>
                    </div>
                    <div class="day-selection">
                        <div class="day-grid">
                            <!-- Days will be populated dynamically -->
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="copyToSelectedDays()">Copy</button>
                </div>
            </div>
        </div>
    </div>
`;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }
}

// Call this when the document is ready
$(document).ready(function () {
  initializeCopyFunctionality();
});

// Helper function to create day checkbox
function createDayCheckbox(day) {
  const checkbox = document.createElement("div");
  checkbox.className = "day-checkbox";
  checkbox.innerHTML = `
<input type="checkbox" id="copyDay${day}" value="${day}">
<label for="copyDay${day}">Day ${day}</label>
`;
  return checkbox;
}

// Quick selection functions
/*
function selectWeekdays() {
document.querySelectorAll('.day-checkbox input').forEach((cb, index) => {
// Consider day as weekday if it's not Saturday or Sunday
cb.checked = (index + 1) % 7 !== 0 && (index + 2) % 7 !== 0;
});
}

function selectWeekends() {
document.querySelectorAll('.day-checkbox input').forEach((cb, index) => {
// Consider day as weekend if it's Saturday or Sunday
cb.checked = (index + 1) % 7 === 0 || (index + 2) % 7 === 0;
});
}
*/

function selectAll() {
  document.querySelectorAll(".day-checkbox input").forEach((cb) => {
    cb.checked = true;
  });
}

// Drag and drop functionality
document.addEventListener("DOMContentLoaded", function () {
  let dragged = null;

  document.addEventListener("dragstart", function (event) {
    if (!event.target.classList.contains("meal-section")) return;

    dragged = event.target;
    event.target.classList.add("dragging");
  });

  document.addEventListener("dragend", function (event) {
    if (!event.target.classList.contains("meal-section")) return;

    event.target.classList.remove("dragging");
    document.querySelectorAll(".meal-section").forEach((section) => {
      section.classList.remove("drag-over");
    });
  });

  document.addEventListener("dragover", function (event) {
    event.preventDefault();
  });

  document.addEventListener("dragenter", function (event) {
    if (!event.target.classList.contains("meal-section")) return;

    event.target.classList.add("drag-over");
  });

  document.addEventListener("dragleave", function (event) {
    if (!event.target.classList.contains("meal-section")) return;

    event.target.classList.remove("drag-over");
  });

  document.addEventListener("drop", function (event) {
    event.preventDefault();
    const dropTarget = event.target.closest(".meal-section");
    if (!dropTarget || !dragged) return;

    // Get selected values from both sections
    const draggedBase = $(dragged).find(".base-select").val();
    const draggedExtras = $(dragged).find(".extras-select").val();
    const targetBase = $(dropTarget).find(".base-select").val();
    const targetExtras = $(dropTarget).find(".extras-select").val();

    // Swap values
    $(dragged).find(".base-select").val(targetBase).trigger("change");
    $(dragged).find(".extras-select").val(targetExtras).trigger("change");
    $(dropTarget).find(".base-select").val(draggedBase).trigger("change");
    $(dropTarget).find(".extras-select").val(draggedExtras).trigger("change");

    showToast("success", "Meals swapped successfully");
  });
});


$(document).ready(function () {
  $("body").append(`
  <div id="global-loading-overlay" class="position-fixed top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex justify-content-center align-items-center z-3">
    <div class="text-center">
      <div class="food-loader">
        <div class="food-icon">🍲</div>
        <div class="food-icon">🥘</div>
        <div class="food-icon">🍛</div>
        <div class="food-icon">🥗</div>
      </div>
    </div>
  </div>
`);


  // Handle base food selection
  $(".base-select").on("change", function () {
    const container = $(this).closest(".meal-section").find(".selected-foods");
    const selectedBase = $(this).val();

    // Remove existing base
    container.find(".selected-item.base").remove();
    updateProgress();
    saveMealPlanToLocalStorage();
    if (selectedBase) {
      addSelectedFood(container, selectedBase, "base");
    }
  });

  // Handle extras selection
  $(".extras-select").on("change", function () {
    const container = $(this).closest(".meal-section").find(".selected-foods");
    const selectedExtras = $(this).val();

    // Remove all extras
    container.find(".selected-item.extra").remove();

    // Add new selections
    selectedExtras.forEach((extra) => {
      addSelectedFood(container, extra, "extra");
    });
    updateProgress();
    saveMealPlanToLocalStorage();
  });
});

function addSelectedFood(container, food, type) {
  const item = $("<div>")
    .addClass(`selected-item ${type}`)
    .text(food)
    .append(
      $("<span>")
        .addClass("remove-item")
        .html("×")
        .click(function () {
          $(this).parent().remove();
          updateSelects(container);
        })
    );
  container.append(item);
}

function updateSelects(container) {
  const section = container.closest(".meal-section");
  const baseSelect = section.find(".base-select");
  const extrasSelect = section.find(".extras-select");

  // Update base select
  const baseFood = container
    .find(".selected-item.base")
    .text()
    .replace("×", "");
  baseSelect.val(baseFood || "").trigger("change");

  // Update extras select
  const extras = container
    .find(".selected-item.extra")
    .map(function () {
      return $(this).text().replace("×", "");
    })
    .get();
  extrasSelect.val(extras).trigger("change");
}

// New functions for the added features
function showLoading() {
  $(".loading-overlay").css("display", "flex");
}

function hideLoading() {
  $(".loading-overlay").css("display", "none");
}

function resetMealPlan() {
  if (
    confirm(
      "Are you sure you want to reset all meal plans? This cannot be undone."
    )
  ) {
    showLoading();
    $(".base-select").val(null).trigger("change");
    $(".extras-select").val(null).trigger("change");
    $(".selected-foods").empty();
    updateProgress();
    saveMealPlanToLocalStorage();
    hideLoading();
    showToast("success", "Meal plan reset successfully");
  }
}

$("#searchMeals").on("input", function () {
  const searchTerm = $(this).val().toLowerCase();

  $(".day-card").each(function () {
    const card = $(this);
    const mealTexts = card
      .find(".selected-item")
      .map(function () {
        return $(this).text().toLowerCase();
      })
      .get();

    const matchFound = mealTexts.some((text) => text.includes(searchTerm));
    card.toggle(searchTerm === "" || matchFound);
  });
});

// update progress
function updateProgress() {
  const totalDays = 30;
  let plannedDays = 0;

  $(".day-card").each(function (index) {
    const dayNumber = $(this).data("day");

    const suhoorBase = $(this)
      .find('.meal-section[data-meal="suhoor"] .base-select')
      .val();
    const iftarBase = $(this)
      .find('.meal-section[data-meal="iftar"] .base-select')
      .val();

    // Check if both Suhoor and Iftar have atleast base foods selected
    if (suhoorBase && iftarBase) {
      plannedDays++;
    }
  });
  const percentage = Math.round((plannedDays / totalDays) * 100);
  const progressBar = $(".progress-bar");

  // Update width and aria attributes
  progressBar.css("width", percentage + "%").attr("aria-valuenow", percentage);

  // Update text elements
  $("#completionStatus").text(`${plannedDays}/${totalDays} days planned`);
  $("#progressPercentage").text(`${percentage}%`);
  progressBar.find(".progress-text").text(`${percentage}%`);

  // Color and style based on progress
  progressBar.removeClass("bg-danger bg-warning bg-success");
  if (percentage < 33) {
    progressBar.addClass("bg-danger");
  } else if (percentage < 66) {
    progressBar.addClass("bg-warning");
  } else {
    progressBar.addClass("bg-success");
  }
}

// Function to save meal plan to local storage
function saveMealPlanToLocalStorage() {
  const mealPlan = [];

  // Iterate through each day card
  $(".day-card").each(function () {
    const day = $(this).data("day");
    const suhoorBase = $(this)
      .find('.meal-section[data-meal="suhoor"] .base-select')
      .val();
    const suhoorExtras = $(this)
      .find('.meal-section[data-meal="suhoor"] .extras-select')
      .val();
    const iftarBase = $(this)
      .find('.meal-section[data-meal="iftar"] .base-select')
      .val();
    const iftarExtras = $(this)
      .find('.meal-section[data-meal="iftar"] .extras-select')
      .val();

    mealPlan.push({
      day,
      suhoor: {
        base: suhoorBase,
        extras: suhoorExtras,
      },
      iftar: {
        base: iftarBase,
        extras: iftarExtras,
      },
    });
  });

  // Set expiration (e.g., 30 days from now)
  const localStorageData = {
    mealPlan: mealPlan,
    timestamp: Date.now(),
    expiration: Date.now() + (EXPIRATION_DAYS * 24 * 60 * 60 * 1000) //  days in milliseconds
  };

  localStorage.setItem("ramadanMealPlan", JSON.stringify(localStorageData));
}

// Function to load meal plan from local storage
function loadMealPlanFromLocalStorage() {
  const savedData = localStorage.getItem("ramadanMealPlan");

  if (savedData) {
    const localStorageData = JSON.parse(savedData);
    // Check if the saved data has expired
    if (Date.now() > localStorageData.expiration) {
        localStorage.removeItem('ramadanMealPlan');
        return;
      }
    const mealPlan = localStorageData.mealPlan;

    mealPlan.forEach((dayPlan) => {
      const dayCard = $(`.day-card[data-day="${dayPlan.day}"]`);
      // Set Suhoor base and extras
      dayCard
        .find('.meal-section[data-meal="suhoor"] .base-select')
        .val(dayPlan.suhoor.base)
        .trigger("change");
      if (dayPlan.suhoor.extras) {
        dayCard
          .find('.meal-section[data-meal="suhoor"] .extras-select')
          .val(dayPlan.suhoor.extras)
          .trigger("change");
      }

      // Set Iftar base and extras
      dayCard
        .find('.meal-section[data-meal="iftar"] .base-select')
        .val(dayPlan.iftar.base)
        .trigger("change");
      if (dayPlan.iftar.extras) {
        dayCard
          .find('.meal-section[data-meal="iftar"] .extras-select')
          .val(dayPlan.iftar.extras)
          .trigger("change");
      }
    });

    // Trigger any necessary updates (like progress tracking)
    updateProgress();
  }
}

// Modify your existing document ready function
const originalDocReady = $(document).ready;
$(document).ready(function () {
  originalDocReady();
  updateProgress();

  // Add event listener for remove items
  $(document).on("click", ".remove-item", function () {
    setTimeout(updateProgress, 100);
    saveMealPlanToLocalStorage();
  });
});

// Export Functions
function exportToCSV() {
  const btn = $(event.target);
  btn.prop("disabled", true);

  try {
    const data = collectMealPlanData();
    const csv = convertToCSV(data);
    downloadFile(csv, "ramadan_meal_plan.csv", "text/csv");
    showToast("success", "Meal plan exported to CSV successfully!");
  } catch (error) {
    showToast("error", "Failed to export CSV");
  } finally {
    btn.prop("disabled", false);
  }
}

function exportToPDF() {
  const btn = $(event.target);
  btn.prop("disabled", true).text("Exporting...");

  try {
    // Mock API call to server for PDF generation
    const data = collectMealPlanData();

    // Simulate server processing
    setTimeout(() => {
      console.log("PDF Data:", data);
      showToast("success", "PDF exported successfully! (Mock)");
      btn.prop("disabled", false).text("Export to PDF");
    }, 1500);
  } catch (error) {
    showToast("error", "Failed to export PDF");
    btn.prop("disabled", false).text("Export to PDF");
  }
}

function printMealPlan() {
  window.print();
}

function collectMealPlanData() {
  const mealPlanData = [];

  $(".day-card").each(function () {
    const day = $(this).data("day");

    // Collect Suhoor data
    const suhoorBase = $(this)
      .find('[data-meal="suhoor"] .selected-item.base')
      .text()
      .replace("×", "")
      .trim();
    const suhoorExtras = $(this)
      .find('[data-meal="suhoor"] .selected-item.extra')
      .map(function () {
        return $(this).text().replace("×", "").trim();
      })
      .get();

    // Collect Iftar data
    const iftarBase = $(this)
      .find('[data-meal="iftar"] .selected-item.base')
      .text()
      .replace("×", "")
      .trim();
    const iftarExtras = $(this)
      .find('[data-meal="iftar"] .selected-item.extra')
      .map(function () {
        return $(this).text().replace("×", "").trim();
      })
      .get();

    mealPlanData.push({
      day: day,
      suhoor: {
        base: suhoorBase,
        extras: suhoorExtras,
      },
      iftar: {
        base: iftarBase,
        extras: iftarExtras,
      },
    });
  });

  return mealPlanData;
}

function convertToCSV(data) {
  const headers = ["Day", "Meal", "Base Food", "Extras"];
  const rows = [];

  // Add header
  rows.push(headers.join(","));

  // Add data rows
  data.forEach((day) => {
    // Add Suhoor row
    rows.push(
      [
        day.day,
        "Suhoor",
        day.suhoor.base,
        `"${day.suhoor.extras.join(", ")}"`,
      ].join(",")
    );

    // Add Iftar row
    rows.push(
      [
        day.day,
        "Iftar",
        day.iftar.base,
        `"${day.iftar.extras.join(", ")}"`,
      ].join(",")
    );
  });

  return rows.join("\n");
}

function downloadFile(content, fileName, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

function showToast(type, message) {
  const toast = $(`
        <div class="toast" role="alert" aria-live="polite" aria-atomic="true">
            <div class="toast-header bg-${
              type === "success" ? "success" : "danger"
            } text-white">
                <strong class="me-auto">${
                  type === "success" ? "Success" : "Error"
                }</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">${message}</div>
        </div>
    `);

  $("#toastContainer").append(toast);
  const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
  bsToast.show();

  toast.on("hidden.bs.toast", function () {
    toast.remove();
  });
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function saveMealPlanToBackend() {
  const mealPlan = collectMealPlanData();
  let token = getCookie("csrftoken");

  $.ajax({
    url: "/ajax-save-plan",
    type: "POST",
    headers: {
      "X-CSRFToken": token, // Send CSRF token in the header
    },
    data: JSON.stringify(mealPlan), // JSON.stringify(mealPlan)},
    success: function (response) {
      if (response.success) {
        // Copy shareable URL to clipboard
        navigator.clipboard.writeText(response.share_url);
        showToast("success", "Shareable link copied!");
      }
    },
    error: function (xhr) {
      showToast("error", "Failed to save meal plan");
    },
  });
}

function populateMealPlan(mealPlanData) {
  // Ensure mealPlanData is an array or has the correct structure
  if (!Array.isArray(mealPlanData)) {
    showToast("error", "Invalid meal plan data");
    return;
  }

  // Iterate through each day's plan
  mealPlanData.forEach((dayPlan) => {
    // Find the corresponding day card
    const dayCard = $(`.day-card[data-day="${dayPlan.day}"]`);

    if (dayCard.length === 0) {
      showToast("error", `No day card found for day ${dayPlan.day}`);
      return;
    }

    // Populate Suhoor
    if (dayPlan.suhoor) {
      // Set base food
      if (dayPlan.suhoor.base) {
        dayCard
          .find('.meal-section[data-meal="suhoor"] .base-select')
          .val(dayPlan.suhoor.base)
          .trigger("change");
      }

      // Set extras
      if (dayPlan.suhoor.extras && dayPlan.suhoor.extras.length) {
        dayCard
          .find('.meal-section[data-meal="suhoor"] .extras-select')
          .val(dayPlan.suhoor.extras)
          .trigger("change");
      }
    }

    // Populate Iftar
    if (dayPlan.iftar) {
      // Set base food
      if (dayPlan.iftar.base) {
        dayCard
          .find('.meal-section[data-meal="iftar"] .base-select')
          .val(dayPlan.iftar.base)
          .trigger("change");
      }

      // Set extras
      if (dayPlan.iftar.extras && dayPlan.iftar.extras.length) {
        dayCard
          .find('.meal-section[data-meal="iftar"] .extras-select')
          .val(dayPlan.iftar.extras)
          .trigger("change");
      }
    }
  });

  // Update progress and other UI elements
  updateProgress();

  // Optional: Provide feedback
  showToast("success", "Meal plan loaded successfully");
}

function loadSharedMealPlan(uniqueId) {
  $.ajax({
    url: `/ajax-retrieve-plan/${uniqueId}`,
    type: "GET",
    success: function (mealPlanData) {
      populateMealPlan(mealPlanData);
      updateProgress();
    },
    error: function (xhr) {
      showToast("error", "Failed to load shared meal plan");
    },
  });
}

// Helper function to get URL parameters using jQuery
$.urlParam = function (name) {
  var results = new RegExp("[?&]" + name + "=([^&#]*)").exec(
    window.location.href
  );
  if (results == null) {
    return null;
  }
  return decodeURIComponent(results[1]) || 0;
};
