export const formatters = {
  lettersAndAccents: (value = "") =>
    value
      .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, "")
      .replace(/\s+/g, " ")
      .trimStart(),

  onlyNumbers: (value = "") => String(value).replace(/\D/g, ""),

  cedula: (value = "") => {
    const digits = String(value).replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 3) return digits;
    if (digits.length <= 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
  },

  phone: (value = "") => {
    const digits = String(value).replace(/\D/g, "").slice(0, 10);

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  },

  decimalNumber: (value = "") => {
    let clean = String(value).replace(/[^\d.]/g, "");

    const parts = clean.split(".");
    if (parts.length > 2) {
      clean = parts[0] + "." + parts.slice(1).join("");
    }

    let [int = "", dec] = clean.split(".");

    if (dec !== undefined) {
      dec = dec.slice(0, 2);
      return `${int}.${dec}`;
    }

    return int;
  },

  bloodPressure: (value = "") => {
    const digits = String(value).replace(/\D/g, "").slice(0, 6);

    if (digits.length <= 3) return digits;
    return `${digits.slice(0, 3)}/${digits.slice(3)}`;
  },

  email: (value = "") => String(value).trimStart(),
};

export const validators = {
  required: (value) => String(value ?? "").trim() !== "",

  exactLength: (length) => (value) =>
    String(value ?? "").replace(/\D/g, "").length === length,

  minLength: (length) => (value) =>
    String(value ?? "").replace(/\D/g, "").length >= length,

  maxLength: (length) => (value) =>
    String(value ?? "").replace(/\D/g, "").length <= length,

  email: (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim()),
};

export const applyFieldFormatting = (name, value, fieldRules) => {
  const formatterName = fieldRules?.[name]?.formatter;
  const formatter = formatterName ? formatters[formatterName] : null;
  return formatter ? formatter(value) : value;
};

export const finalizeDecimal = (value = "") => {
  if (value === "" || value == null) return "";

  const num = parseFloat(value);
  if (Number.isNaN(num)) return "";

  return num.toFixed(2);
};

export const validateFields = (formData, fieldRules) => {
  const errors = {};

  for (const fieldName in fieldRules) {
    const value = formData[fieldName] ?? "";
    const rules = fieldRules[fieldName];

    if (rules.required && !validators.required(value)) {
      errors[fieldName] = rules.requiredMessage || "This field is required.";
      continue;
    }

    if (rules.validate) {
      for (const rule of rules.validate) {
        const isValid = rule.test(value);
        if (!isValid) {
          errors[fieldName] = rule.message;
          break;
        }
      }
    }
  }

  return errors;
};