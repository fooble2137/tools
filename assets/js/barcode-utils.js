export const BARCODE_TYPES = [
    {
        id: "code128",
        label: "Code 128",
        bcid: "code128",
        example: "FOOBLE-123",
    },
    {
        id: "ean13",
        label: "EAN-13 (12 digits)",
        bcid: "ean13",
        example: "5901234123457",
        numeric: true,
        lengths: [12],
    },
    {
        id: "upca",
        label: "UPC-A (11-12 digits)",
        bcid: "upca",
        example: "036000291452",
        numeric: true,
        lengths: [11, 12],
    },
    {
        id: "code39",
        label: "Code 39 (A-Z, 0-9, - . $ / + % space)",
        bcid: "code39",
        example: "FOOBLE-39",
        pattern: /^[A-Z0-9 \-.$/+%]+$/,
    },
];

export function normalizeBarcodeText(type, rawText) {
    const text = rawText.trim();
    if (type.id === "code39") return text.toUpperCase();
    return text;
}

export function validateBarcodeText(type, rawText) {
    const normalized = normalizeBarcodeText(type, rawText);

    if (!normalized) {
        return {
            valid: false,
            normalized,
            message: "Enter a value to generate a barcode...",
        };
    }

    if (type.numeric && !/^[0-9]+$/.test(normalized)) {
        return {
            valid: false,
            normalized,
            message: "This barcode type only allows digits!",
        };
    }

    if (type.lengths && !type.lengths.includes(normalized.length)) {
        return {
            valid: false,
            normalized,
            message: `Use ${type.lengths.join(" or ")} digits for this type!`,
        };
    }

    if (type.pattern && !type.pattern.test(normalized)) {
        return {
            valid: false,
            normalized,
            message: "This barcode type has restricted characters!",
        };
    }

    return {valid: true, normalized, message: "Barcode updated!"};
}

export function buildBarcodeUrl({type, text, scale, height, includeText, textAlignment}) {
    const params = new URLSearchParams({
        bcid: type.bcid,
        text,
        scale: String(scale),
        height: String(height),
        textxalign: textAlignment,
    });

    if (includeText) {
        params.set("includetext", "true");
    }

    return `https://bwipjs-api.metafloor.com/?${params.toString()}`;
}
