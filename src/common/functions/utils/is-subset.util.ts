export const isSubset = (parentArray: string[], subsetArray: string[]) => {
    return subsetArray.every((element) => parentArray.includes(element));
};
