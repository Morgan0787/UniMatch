/**
 * @param {string} pageName
 * @returns {string}
 */
export function createPageUrl(pageName) {
    return '/' + pageName.replace(/ /g, '-');
}
