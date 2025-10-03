import { z } from 'zod';
import { tool } from 'ai';
import { promises as fs } from 'fs';
import path from 'path';
import { globby } from 'globby';
import ignore from 'ignore';
import { isSafePath } from './security.js';

export function createFileSystemTools(projectPath: string) {
  const ig = ignore();

  const findGitignoreFiles = async (dir: string): Promise<string[]> => {
    const gitignoreFiles: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isFile() && entry.name === '.gitignore') {
          gitignoreFiles.push(fullPath);
        } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          // Recursively search subdirectories, but skip hidden dirs and node_modules
          const subGitignores = await findGitignoreFiles(fullPath);
          gitignoreFiles.push(...subGitignores);
        }
      }
    } catch (error) {
      // If we can't read a directory, skip it
    }
    
    return gitignoreFiles;
  };

  const initializeGitignore = async () => {
    try {
      const gitignoreFiles = await findGitignoreFiles(projectPath);
      
      for (const gitignoreFile of gitignoreFiles) {
        try {
          const gitignoreContent = await fs.readFile(gitignoreFile, 'utf-8');
          const relativePath = path.relative(projectPath, path.dirname(gitignoreFile));
          
          // Add the gitignore rules with the appropriate base path
          if (relativePath) {
            // For subdirectory .gitignore files, prefix each pattern with the relative path
            const lines = gitignoreContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
            const prefixedPatterns = lines.map(line => {
              // Handle negation patterns
              if (line.startsWith('!')) {
                return `!${path.join(relativePath, line.slice(1))}`;
              }
              return path.join(relativePath, line);
            });
            ig.add(prefixedPatterns.join('\n'));
          } else {
            // Root .gitignore
            ig.add(gitignoreContent);
          }
        } catch (error) {
          // Skip individual .gitignore files that can't be read
        }
      }
    } catch (error) {
      // No .gitignore files found, which is fine.
    }
  };

  // Initialize gitignore rules when tools are created
  initializeGitignore();

  return {
    ls: tool({
      description: 'List files and directories in a given path.',
      parameters: z.object({
        directory: z.string().describe('The directory to list.'),
      }),
      execute: async ({ directory }) => {
        const targetPath = path.join(projectPath, directory);
        if (!(await isSafePath(projectPath, targetPath))) {
          return { error: 'Access denied.' };
        }
        const entries = await fs.readdir(targetPath, { withFileTypes: true });
        const filteredEntries = entries
          .map(entry => entry.name)
          .filter(name => !ig.ignores(path.join(directory, name)));
        return { files: filteredEntries }
      },
    }),
    readFile: tool({
      description: 'Read the contents of a file.',
      parameters: z.object({
        filePath: z.string().describe('The path to the file to read.'),
      }),
      execute: async ({ filePath }) => {
        if (ig.ignores(filePath)) {
          return { error: 'File is ignored by .gitignore.' };
        }
        const targetPath = path.join(projectPath, filePath);
        if (!(await isSafePath(projectPath, targetPath))) {
          return { error: 'Access denied.' };
        }
        const content = await fs.readFile(targetPath, 'utf-8');
        return { content };
      },
    }),
    readFileLines: tool({
      description: 'Read specific lines from a file.',
      parameters: z.object({
        filePath: z.string().describe('The path to the file to read.'),
        startLine: z.number().describe('The starting line number (1-indexed).'),
        endLine: z.number().describe('The ending line number (1-indexed).'),
      }),
      execute: async ({ filePath, startLine, endLine }) => {
        if (ig.ignores(filePath)) {
          return { error: 'File is ignored by .gitignore.' };
        }
        const targetPath = path.join(projectPath, filePath);
        if (!(await isSafePath(projectPath, targetPath))) {
          return { error: 'Access denied.' };
        }
        const content = await fs.readFile(targetPath, 'utf-8');
        const lines = content.split('\n');
        const selectedLines = lines.slice(startLine - 1, endLine);
        return { content: selectedLines.join('\n') };
      },
    }),
    grep: tool({
      description: 'Search for a pattern in files using regex.',
      parameters: z.object({
        pattern: z.string().describe('The regex pattern to search for.'),
        directory: z.string().optional().describe('The directory to search in (defaults to project root).'),
        filePattern: z.string().optional().describe('File pattern to filter (e.g., "*.ts").'),
      }),
      execute: async ({ pattern, directory = '.', filePattern = '**/*' }) => {
        const searchPath = path.join(projectPath, directory);
        if (!(await isSafePath(projectPath, searchPath))) {
          return { error: 'Access denied.' };
        }

        const files = await globby(filePattern, {
          cwd: searchPath,
          gitignore: true,
          absolute: false,
        });

        const regex = new RegExp(pattern);
        const results: { file: string; line: number; content: string }[] = [];

        for (const file of files) {
          const filePath = path.join(searchPath, file);
          if (ig.ignores(path.relative(projectPath, filePath))) {
            continue;
          }

          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
              if (regex.test(line)) {
                results.push({
                  file: path.relative(projectPath, filePath),
                  line: index + 1,
                  content: line.trim(),
                });
              }
            });
          } catch (error) {
            // Skip files that can't be read
          }
        }

        return { matches: results };
      },
    }),
    glob: tool({
      description: 'Find files matching a glob pattern.',
      parameters: z.object({
        pattern: z.string().describe('The glob pattern to match (e.g., "**/*.ts").'),
        directory: z.string().optional().describe('The directory to search in (defaults to project root).'),
      }),
      execute: async ({ pattern, directory = '.' }) => {
        const searchPath = path.join(projectPath, directory);
        if (!(await isSafePath(projectPath, searchPath))) {
          return { error: 'Access denied.' };
        }

        const files = await globby(pattern, {
          cwd: searchPath,
          gitignore: true,
          absolute: false,
        });

        const filteredFiles = files.filter(file => {
          const relativePath = path.relative(projectPath, path.join(searchPath, file));
          return !ig.ignores(relativePath);
        });

        return { files: filteredFiles };
      },
    }),
  };
}
