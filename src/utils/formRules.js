export const formatters = {
  lettersAndAccents: (value = "") =>
    value
      .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, "")
      .replace(/\s+/g, " ")
      .trimStart(),

  onlyNumbers: (value = "") => value.replace(/\D/g, ""),

  decimalNumber: (value = "") => {
    let clean = value.replace(/[^0-9.]/g, "");
    const parts = clean.split(".");

    if (parts.length > 2) {
      clean = parts[0] + "." + parts.slice(1).join("");
    }

    return clean;
  },

  bloodPressure: (value = "") => {
  const digits = value.replace(/\D/g, "").slice(0, 6);

  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)}/${digits.slice(3)}`;
},

  email: (value = "") => value.trimStart(),
};

export const validators = {
  required: (value) => value?.toString().trim() !== "",

  exactLength: (length) => (value) =>
    value?.toString().trim().length === length,

  minLength: (length) => (value) =>
    value?.toString().trim().length >= length,

  maxLength: (length) => (value) =>
    value?.toString().trim().length <= length,

  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
};

export const applyFieldFormatting = (name, value, fieldRules) => {
  const formatterName = fieldRules?.[name]?.formatter;
  const formatter = formatterName ? formatters[formatterName] : null;
  return formatter ? formatter(value) : value;
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
