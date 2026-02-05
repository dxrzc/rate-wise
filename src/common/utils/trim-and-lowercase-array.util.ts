export const trimAndLowerCaseArray = (obj: { value: string[] }) =>
    Array.isArray(obj.value)
        ? obj.value.map((str) => (typeof str === 'string' ? str.trim().toLowerCase() : str))
        : obj.value;
