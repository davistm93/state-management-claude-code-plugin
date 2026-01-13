export interface StateMetadata {
  last_sync: string;
  commit_sha: string;
  version: string;
  granularity?: string;
}

export interface ParsedState {
  metadata: StateMetadata;
  sections: Record<string, string>;
  rawContent: string;
}

const SECTION_NAMES = [
  'system_architecture',
  'active_modules',
  'dependency_map',
  'tech_debt',
  'infrastructure'
];

export function parseStateFile(content: string): ParsedState {
  const metadata = extractMetadata(content);
  const sections: Record<string, string> = {};

  for (const sectionName of SECTION_NAMES) {
    sections[sectionName] = extractSection(content, sectionName);
  }

  return {
    metadata,
    sections,
    rawContent: content
  };
}

function extractMetadata(content: string): StateMetadata {
  const metadataMatch = content.match(/<!-- STATE_METADATA: ({.*?}) -->/);

  if (!metadataMatch) {
    return {
      last_sync: '',
      commit_sha: '',
      version: '1.0'
    };
  }

  try {
    return JSON.parse(metadataMatch[1]);
  } catch {
    return {
      last_sync: '',
      commit_sha: '',
      version: '1.0'
    };
  }
}

export function extractSection(content: string, sectionName: string): string {
  const headerMap: Record<string, string> = {
    'system_architecture': 'System Architecture',
    'active_modules': 'Active Modules',
    'dependency_map': 'Dependency Map',
    'tech_debt': 'Tech Debt',
    'infrastructure': 'Infrastructure'
  };

  const header = headerMap[sectionName];
  if (!header) return '';

  const regex = new RegExp(`## ${header}\\n\\n([\\s\\S]*?)(?=\\n## |<!-- STATE_METADATA|$)`, 'm');
  const match = content.match(regex);

  return match ? match[1].trim() : '';
}

export function updateSection(content: string, sectionName: string, newSectionContent: string): string {
  const headerMap: Record<string, string> = {
    'system_architecture': 'System Architecture',
    'active_modules': 'Active Modules',
    'dependency_map': 'Dependency Map',
    'tech_debt': 'Tech Debt',
    'infrastructure': 'Infrastructure'
  };

  const header = headerMap[sectionName];
  if (!header) return content;

  // Match the section and replace it
  const regex = new RegExp(`## ${header}\\n\\n[\\s\\S]*?(?=\\n## |<!-- STATE_METADATA|$)`, 'm');

  // Ensure newSectionContent includes the header
  const formattedContent = newSectionContent.startsWith('##')
    ? newSectionContent
    : `## ${header}\n\n${newSectionContent}`;

  if (regex.test(content)) {
    return content.replace(regex, formattedContent + '\n');
  } else {
    // Section doesn't exist, add before metadata
    return content.replace(/<!-- STATE_METADATA/, `${formattedContent}\n\n<!-- STATE_METADATA`);
  }
}

export function updateMetadata(content: string, updates: Partial<StateMetadata>): string {
  const current = extractMetadata(content);
  const updated = { ...current, ...updates };

  const metadataString = `<!-- STATE_METADATA: ${JSON.stringify(updated)} -->`;

  const metadataRegex = /<!-- STATE_METADATA:.*?-->/;

  if (metadataRegex.test(content)) {
    return content.replace(metadataRegex, metadataString);
  } else {
    return content + '\n\n' + metadataString;
  }
}
