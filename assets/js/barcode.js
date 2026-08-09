import {BARCODE_TYPES, buildBarcodeUrl, normalizeBarcodeText, validateBarcodeText,} from "./barcode-utils.js";

const typeSelect = document.getElementById("barcode-type");
const valueInput = document.getElementById("barcode-input");
const scaleInput = document.getElementById("barcode-scale");
const heightInput = document.getElementById("barcode-height");
const scaleLabel = document.querySelector('label[for="barcode-scale"]');
const heightLabel = document.querySelector('label[for="barcode-height"]');
const alignmentSelect = document.getElementById("text-alignment");
const includeTextCheckbox = document.getElementById("include-text");
const barcodeImg = document.getElementById("barcode-image");
const statusEl = document.getElementById("status");
const downloadBtn = document.getElementById("download-btn");
const copyBtn = document.getElementById("copy-btn");
const clearBtn = document.getElementById("clear-btn");

let currentBarcode = null;

function setStatus(message, type = "") {
    statusEl.textContent = message;
    statusEl.className = "status";
    if (type) statusEl.classList.add(type);
}

function updateScaleLabel() {
    scaleLabel.textContent = `Scale: ${scaleInput.value}x`;
}

function updateHeightLabel() {
    heightLabel.textContent = `Height: ${heightInput.value}px`;
}

function updateTextAlignmentSelector() {
    alignmentSelect.disabled = !includeTextCheckbox.checked;
}

function getSelectedType() {
    return BARCODE_TYPES.find((type) => type.id === typeSelect.value);
}

function initializeDummyValue(type) {
    valueInput.value = type.example;
}

function updateBarcode() {
    const type = getSelectedType();
    const validation = validateBarcodeText(type, valueInput.value);
    const normalized = validation.normalized;

    if (!validation.valid) {
        barcodeImg.style.opacity = "0.3";
        barcodeImg.alt = "No data";

        setStatus(validation.message, normalized ? "error" : "");
        return;
    }

    if (normalized !== valueInput.value) {
        valueInput.value = normalized;
    }

    const url = buildBarcodeUrl({
        type,
        text: normalized,
        scale: Number(scaleInput.value),
        height: Number(heightInput.value),
        includeText: includeTextCheckbox.checked,
        textAlignment: alignmentSelect.value,
    });

    barcodeImg.src = url;
    barcodeImg.alt = `${type.label} barcode`;
    barcodeImg.style.opacity = "1";

    currentBarcode = {
        url,
        text: normalized,
        type: type.id,
        textAlignment: alignmentSelect.value,
    };

    setStatus(validation.message, "success");
}

async function downloadBarcode() {
    if (!currentBarcode) return;

    try {
        const response = await fetch(currentBarcode.url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `barcode_${currentBarcode.type}_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const original = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="ri-check-line"></i> Downloaded';
        setTimeout(() => {
            downloadBtn.innerHTML = original;
        }, 2000);
    } catch (error) {
        setStatus("Failed to download barcode!", "error");
    }
}

async function copyBarcode() {
    if (!currentBarcode) return;

    try {
        const response = await fetch(currentBarcode.url);
        const blob = await response.blob();
        await navigator.clipboard.write([new ClipboardItem({"image/png": blob})]);

        const original = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="ri-check-line"></i> Copied';
        setTimeout(() => {
            copyBtn.innerHTML = original;
        }, 2000);
    } catch (error) {
        try {
            await navigator.clipboard.writeText(currentBarcode.url);
            setStatus("Barcode URL copied!", "success");
        } catch (fallbackError) {
            setStatus("Unable to copy barcode!", "error");
        }
    }
}

function clearAll() {
    valueInput.value = "";
    barcodeImg.style.opacity = "0.3";
    barcodeImg.alt = "No data";
    setStatus("Enter a value to generate a barcode...");
}

BARCODE_TYPES.forEach((type) => {
    const option = document.createElement("option");
    option.value = type.id;
    option.textContent = type.label;
    typeSelect.appendChild(option);
});

typeSelect.value = BARCODE_TYPES[0].id;
initializeDummyValue(getSelectedType());
updateScaleLabel();
updateHeightLabel();
updateBarcode();

valueInput.addEventListener("input", updateBarcode);
typeSelect.addEventListener("change", () => {
    initializeDummyValue(getSelectedType());
    valueInput.value = normalizeBarcodeText(getSelectedType(), valueInput.value);
    updateBarcode();
});

[scaleInput, heightInput, includeTextCheckbox, alignmentSelect].forEach((input) => {
    input.addEventListener("input", () => {
        updateScaleLabel();
        updateHeightLabel();
        updateTextAlignmentSelector();
        updateBarcode();
    });
});

downloadBtn.addEventListener("click", downloadBarcode);
copyBtn.addEventListener("click", copyBarcode);
clearBtn.addEventListener("click", clearAll);
