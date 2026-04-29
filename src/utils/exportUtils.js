import db from '../db/database.js';

/**
 * Export utilities — JSON and Markdown export of workspace data.
 */

/**
 * Export the entire project as a JSON file for backup/restore.
 * @param {number} projectId
 */
export async function exportProjectAsJSON(projectId) {
  const [project, documents, annotations, excerpts, connections, groups] = await Promise.all([
    db.projects.get(projectId),
    db.documents.where('projectId').equals(projectId).toArray(),
    db.annotations.where('projectId').equals(projectId).toArray(),
    db.excerpts.where('projectId').equals(projectId).toArray(),
    db.connections.where('projectId').equals(projectId).toArray(),
    db.groups.where('projectId').equals(projectId).toArray(),
  ]);

  // Strip binary file data from documents (too large for JSON)
  const docsWithoutBlobs = documents.map(({ fileData, ...rest }) => rest);

  const data = {
    exportedAt: new Date().toISOString(),
    version: 1,
    project,
    documents: docsWithoutBlobs,
    annotations,
    excerpts,
    connections,
    groups,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${project?.name || 'project'}-export.json`);
}

/**
 * Export all excerpts and connections as a structured Markdown document.
 * @param {number} projectId
 */
export async function exportWorkspaceAsMarkdown(projectId) {
  const [project, excerpts, connections] = await Promise.all([
    db.projects.get(projectId),
    db.excerpts.where('projectId').equals(projectId).toArray(),
    db.connections.where('projectId').equals(projectId).toArray(),
  ]);

  let md = `# ${project?.name || 'Workspace Export'}\n\n`;
  md += `> Exported on ${new Date().toLocaleString()}\n\n`;

  // Excerpts
  md += `## Excerpts (${excerpts.length})\n\n`;
  excerpts.forEach((e, i) => {
    md += `### ${i + 1}. Excerpt\n`;
    md += `- **Source**: ${e.fileName || 'Document'}, Page ${e.sourcePageNumber || '?'}\n`;
    md += `- **Color**: ${e.color || 'yellow'}\n`;
    if (e.tags?.length) md += `- **Tags**: ${e.tags.join(', ')}\n`;
    md += `\n> ${e.text}\n\n`;
    md += `---\n\n`;
  });

  // Connections
  if (connections.length > 0) {
    md += `## Connections (${connections.length})\n\n`;
    connections.forEach((c) => {
      const source = excerpts.find((e) => e.id === c.sourceExcerptId);
      const target = excerpts.find((e) => e.id === c.targetExcerptId);
      const srcText = source?.text?.substring(0, 50) || '?';
      const tgtText = target?.text?.substring(0, 50) || '?';
      md += `- "${srcText}..." → "${tgtText}..."`;
      if (c.label) md += ` (${c.label})`;
      md += `\n`;
    });
  }

  const blob = new Blob([md], { type: 'text/markdown' });
  downloadBlob(blob, `${project?.name || 'workspace'}-export.md`);
}

/**
 * Helper — trigger a file download in the browser.
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
