const form = document.querySelector("#project-form");
const projectInputs = [...document.querySelectorAll("[data-project]")];
const allProjectInputs = [...document.querySelectorAll('#project-types input[type="checkbox"]')];
const panels = [...document.querySelectorAll("[data-panel]")];
const projectTypeError = document.querySelector("#project-type-error");
const formError = document.querySelector("#form-error");
const emailInput = document.querySelector("#email");
const replyToInput = document.querySelector("#replyto");
const fileInput = document.querySelector("#attachments");
const uploadZone = document.querySelector("#upload-zone");
const fileList = document.querySelector("#file-list");
const fileError = document.querySelector("#file-error");
const submitButton = form.querySelector(".submit-button");
const submitLabel = submitButton.querySelector("span");
const maximumUploadSize = 10 * 1024 * 1024;

let selectedFiles = [];

function togglePanels() {
  const activePanels = new Set(
    projectInputs.filter((input) => input.checked).map((input) => input.dataset.project)
  );

  panels.forEach((panel) => {
    const isActive = activePanels.has(panel.dataset.panel);
    panel.hidden = !isActive;
    panel.querySelectorAll("input, select, textarea").forEach((control) => {
      control.disabled = !isActive;
    });
  });

  if (allProjectInputs.some((input) => input.checked)) {
    projectTypeError.textContent = "";
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function syncFileInput() {
  try {
    const transfer = new DataTransfer();
    selectedFiles.forEach((file) => transfer.items.add(file));
    fileInput.files = transfer.files;
  } catch (error) {
    // Older browsers can still submit files chosen through the native picker.
  }
}

function validateFiles() {
  const totalSize = selectedFiles.reduce((total, file) => total + file.size, 0);
  const isValid = totalSize <= maximumUploadSize;
  const message = isValid
    ? ""
    : `Your attachments total ${formatBytes(totalSize)}. Remove files until the total is 10 MB or less.`;

  fileInput.setCustomValidity(message);
  fileError.textContent = message;
  return isValid;
}

function renderFiles() {
  fileList.replaceChildren();

  selectedFiles.forEach((file, index) => {
    const item = document.createElement("li");
    const details = document.createElement("span");
    const removeButton = document.createElement("button");

    details.textContent = `${file.name} (${formatBytes(file.size)})`;
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", `Remove ${file.name}`);
    removeButton.addEventListener("click", () => {
      selectedFiles.splice(index, 1);
      syncFileInput();
      renderFiles();
      validateFiles();
    });

    item.append(details, removeButton);
    fileList.append(item);
  });
}

function addFiles(files) {
  [...files].forEach((file) => {
    const isDuplicate = selectedFiles.some(
      (current) =>
        current.name === file.name &&
        current.size === file.size &&
        current.lastModified === file.lastModified
    );

    if (!isDuplicate) selectedFiles.push(file);
  });

  syncFileInput();
  renderFiles();
  validateFiles();
}

allProjectInputs.forEach((input) => input.addEventListener("change", togglePanels));

emailInput.addEventListener("input", () => {
  replyToInput.value = emailInput.value;
});

fileInput.addEventListener("change", () => addFiles(fileInput.files));

["dragenter", "dragover"].forEach((eventName) => {
  uploadZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadZone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  uploadZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadZone.classList.remove("is-dragging");
  });
});

uploadZone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));

form.addEventListener("submit", (event) => {
  projectTypeError.textContent = "";
  formError.textContent = "";

  if (!allProjectInputs.some((input) => input.checked)) {
    event.preventDefault();
    projectTypeError.textContent = "Choose at least one project type.";
    document.querySelector("#project-types").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  if (!validateFiles() || !form.checkValidity()) {
    event.preventDefault();
    formError.textContent = "Please review the highlighted required fields before sending.";
    form.reportValidity();
    return;
  }

  replyToInput.value = emailInput.value;
  submitButton.disabled = true;
  submitLabel.textContent = "Sending request...";
});

window.addEventListener("pageshow", () => {
  submitButton.disabled = false;
  submitLabel.textContent = "Send project request";
});

togglePanels();
