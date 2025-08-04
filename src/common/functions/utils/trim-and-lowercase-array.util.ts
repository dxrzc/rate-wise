export const trimAndLowerCaseArray = (obj: { value: string[] }) =>
    obj.value.map((str) => str.trim().toLowerCase());
