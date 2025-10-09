#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { CodebaseAnalyzerAgent } from './agents/codebase-analyzer';
import { CodebaseLocatorAgent } from './agents/codebase-locator';
import { CodebasePatternFinderAgent } from './agents/codebase-pattern-finder';
import { ThoughtsAnalyzerAgent } from './agents/thoughts-analyzer';
import { ThoughtsLocatorAgent } from './agents/thoughts-locator';

const server = new Server(
  {
    name: 'research-subagent-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define the available tools (agents)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'codebase_analyzer',
        description: 'Deep analysis of HOW code works. Traces data flow and implementation details. Provides precise file:line references. Identifies architectural patterns.',
        inputSchema: {
          type: 'object',
          properties: {
            project_path: {
              type: 'string',
              description: 'Absolute path to the project directory to analyze',
            },
            query: {
              type: 'string',
              description: 'Natural language query about how the code works',
            },
          },
          required: ['project_path', 'query'],
        },
      },
      {
        name: 'codebase_locator',
        description: 'Finds WHERE code lives in a project. Categorizes files by purpose (implementation, tests, config, etc.). Maps directory structure and naming conventions. Quick file discovery without deep analysis.',
        inputSchema: {
          type: 'object',
          properties: {
            project_path: {
              type: 'string',
              description: 'Absolute path to the project directory to search',
            },
            query: {
              type: 'string',
              description: 'Natural language query about what files or locations to find',
            },
          },
          required: ['project_path', 'query'],
        },
      },
      {
        name: 'codebase_pattern_finder',
        description: 'Finds similar implementations and usage examples. Extracts reusable code patterns. Shows multiple variations of approaches. Provides concrete code snippets with context.',
        inputSchema: {
          type: 'object',
          properties: {
            project_path: {
              type: 'string',
              description: 'Absolute path to the project directory to search',
            },
            query: {
              type: 'string',
              description: 'Natural language query about what patterns or examples to find',
            },
          },
          required: ['project_path', 'query'],
        },
      },
      {
        name: 'thoughts_analyzer',
        description: 'Deeply analyzes research documents and notes. Extracts high-value insights and decisions. Filters out noise and outdated information. Returns actionable insights from documentation.',
        inputSchema: {
          type: 'object',
          properties: {
            project_path: {
              type: 'string',
              description: 'Absolute path to the project directory containing thoughts/ directories',
            },
            query: {
              type: 'string',
              description: 'Natural language query about what insights to extract from documentation',
            },
          },
          required: ['project_path', 'query'],
        },
      },
      {
        name: 'thoughts_locator',
        description: 'Discovers relevant documents in thoughts/ directories. Categorizes by type (tickets, research, plans, PRs). Searches across shared, personal, and global thought directories. Quick document discovery without deep analysis.',
        inputSchema: {
          type: 'object',
          properties: {
            project_path: {
              type: 'string',
              description: 'Absolute path to the project directory containing thoughts/ directories',
            },
            query: {
              type: 'string',
              description: 'Natural language query about what documentation to find',
            },
          },
          required: ['project_path', 'query'],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args || typeof args !== 'object') {
    throw new Error('Invalid arguments');
  }

  const { project_path, query } = args as { project_path: string; query: string };

  if (!project_path || !query) {
    throw new Error('project_path and query are required');
  }

  try {
    let result: string;

    switch (name) {
      case 'codebase_analyzer': {
        const agent = new CodebaseAnalyzerAgent(project_path);
        result = await agent.run(query);
        break;
      }
      case 'codebase_locator': {
        const agent = new CodebaseLocatorAgent(project_path);
        result = await agent.run(query);
        break;
      }
      case 'codebase_pattern_finder': {
        const agent = new CodebasePatternFinderAgent(project_path);
        result = await agent.run(query);
        break;
      }
      case 'thoughts_analyzer': {
        const agent = new ThoughtsAnalyzerAgent(project_path);
        result = await agent.run(query);
        break;
      }
      case 'thoughts_locator': {
        const agent = new ThoughtsLocatorAgent(project_path);
        result = await agent.run(query);
        break;
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${(error as Error).message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Research Subagent MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
