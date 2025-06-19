/**
 * Extrait les dépendances non utilisées à partir de la sortie JSON de depcheck.
 * @param {object} depcheckResult - L'objet JSON retourné par depcheck.
 * @returns {string[]} - Un tableau des paquets non utilisés.
 */
export const extractUnusedPackages = (depcheckResult) => {
  if (!depcheckResult || !Array.isArray(depcheckResult.dependencies)) {
    return []
  }
  return depcheckResult.dependencies
}

/**
 * Compte les dépendances installées à partir de la sortie de `npm ls`.
 * @param {string} npmLsOutput - La sortie texte de `npm ls`.
 * @returns {number} - Le nombre de dépendances.
 */
export const countDependencies = (npmLsOutput) => {
  if (!npmLsOutput) return 0
  const lines = npmLsOutput.split('\n')
  return lines.filter((line) => line.includes('├──') || line.includes('└──'))
    .length
}

/**
 * Compte les vulnérabilités à partir de la sortie JSON de `npm audit`.
 * @param {object} auditResult - L'objet JSON retourné par `npm audit`.
 * @returns {{low: number, moderate: number, high: number, critical: number}}
 */
export const countVulnerabilities = (auditResult) => {
  const defaultVulnerabilities = { low: 0, moderate: 0, high: 0, critical: 0 }
  if (
    !auditResult ||
    !auditResult.metadata ||
    !auditResult.metadata.vulnerabilities
  ) {
    return defaultVulnerabilities
  }
  return { ...defaultVulnerabilities, ...auditResult.metadata.vulnerabilities }
}
