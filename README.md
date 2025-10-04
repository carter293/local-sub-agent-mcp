# Subagent MCP

**Specialized Research Agents for Codebase Analysis**

Subagent MCP is an MCP (Model Context Protocol) server that provides five specialized AI agents for deep codebase analysis and research. Each agent uses OpenAI's GPT models with file system tools to perform focused tasks like locating files, analyzing implementations, finding patterns, and extracting insights from documentation.

> **Inspired by HumanLayer's Advanced Context Engineering**  
> This project implements the specialized agent patterns and context engineering principles from [Dexter Horthy's YC Root Access talk on Advanced Context Engineering for Agents](https://www.youtube.com/watch?v=IS_y40zY-hc). The agent designs and prompts are based on the groundbreaking work by [HumanLayer](https://github.com/humanlayer/humanlayer) in creating specialized AI agents for complex codebase analysis. All credit these guys, all this project is trying to do is replicate the use case on Cursor until sub agents are released.

## 🎯 Project Overview

This MCP server provides specialized research agents that excel at different aspects of codebase analysis. Instead of using a single general-purpose AI for everything, you can route specific types of queries to expert agents optimized for that particular task. Each agent has been fine-tuned with specific prompts and tools to deliver focused, high-quality results for their domain of expertise.

### Five Specialized Agents

1. **Codebase Analyzer** (`/agents/codebase-analyzer`)
   - Deep analysis of HOW code works
   - Traces data flow and implementation details
   - Provides precise file:line references
   - Identifies architectural patterns

2. **Codebase Locator** (`/agents/codebase-locator`)
   - Finds WHERE code lives in a project
   - Categorizes files by purpose (implementation, tests, config, etc.)
   - Maps directory structure and naming conventions
   - Quick file discovery without deep analysis

3. **Codebase Pattern Finder** (`/agents/codebase-pattern-finder`)
   - Finds similar implementations and usage examples
   - Extracts reusable code patterns
   - Shows multiple variations of approaches
   - Provides concrete code snippets with context

4. **Thoughts Analyzer** (`/agents/thoughts-analyzer`)
   - Deeply analyzes research documents and notes
   - Extracts high-value insights and decisions
   - Filters out noise and outdated information
   - Returns actionable insights from documentation

5. **Thoughts Locator** (`/agents/thoughts-locator`)
   - Discovers relevant documents in `thoughts/` directories
   - Categorizes by type (tickets, research, plans, PRs)
   - Searches across shared, personal, and global thought directories
   - Quick document discovery without deep analysis

## 🔧 Installation

### Option 1: Install Globally (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd subagent

# Install the package globally
npm install -g .

# Set up your OpenAI API key
export OPENAI_API_KEY="your-api-key-here"
```

This installs the `research-subagent-mcp` command globally, making it available for use in Cursor's MCP configuration.

### Option 2: Local Development

```bash
# Clone or navigate to the project
cd subagent

# Install dependencies
npm install

# Build the TypeScript project
npm run build

# Set up your OpenAI API key
export OPENAI_API_KEY="your-api-key-here"
```

## 🚀 Usage

This is an MCP (Model Context Protocol) server designed to be used with MCP clients like Cursor. It communicates via stdio and is not meant to be used as a standalone HTTP server.

### Testing the Server

You can test the MCP server directly using the MCP inspector or by running it:

```bash
# Run in development mode (auto-reload on changes)
npm run dev

# Run the built version
npm start
```

The server will communicate via stdio (standard input/output) following the MCP protocol.

## 🎨 Using with Cursor

Cursor can integrate with this MCP server to enhance its codebase understanding capabilities. Cursor will automatically spawn and manage the server process.

### 1. Build the Server

First, ensure the server is built:

```bash
cd /path/to/subagent
npm install
npm run build
```

### 2. Configure Cursor MCP Settings

Add this configuration to your Cursor settings (`~/.cursor/mcp.json` or via Settings → Features → MCP):

#### Option 1: Using Global Installation (Recommended)

```json
{
  "mcpServers": {
    "research-subagent-mcp": {
      "command": "research-subagent-mcp",
      "env": {
        "OPENAI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

#### Option 2: Using Local Installation

```json
{
  "mcpServers": {
    "research-subagent-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/subagent/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Replace `/absolute/path/to/subagent` with the actual path to your subagent directory.

**Note:** Cursor will automatically spawn the MCP server when needed and manage its lifecycle. You don't need to manually start it.

### 3. Use Agents in Cursor

Once configured, the agents are available as tools in Cursor. You can use them naturally in your conversations:

**Example prompts:**
- "Use codebase_analyzer to explain how authentication works in /path/to/project"
- "Use codebase_locator to find all files related to database queries in /path/to/project"
- "Use codebase_pattern_finder to show me pagination examples in /path/to/project"
- "Use thoughts_analyzer to extract API design decisions from /path/to/project"
- "Use thoughts_locator to find research documents about security in /path/to/project"

### 4. Available Tools

The MCP server exposes five specialized tools:

- **`codebase_analyzer`** - Deep analysis of HOW code works
  - Traces data flow and implementation details
  - Provides precise file:line references
  - Identifies architectural patterns

- **`codebase_locator`** - Find WHERE code lives
  - Categorizes files by purpose
  - Maps directory structure
  - Quick file discovery

- **`codebase_pattern_finder`** - Find similar implementations
  - Extracts reusable code patterns
  - Shows multiple variations
  - Provides concrete code snippets

- **`thoughts_analyzer`** - Analyze research documents
  - Extracts high-value insights
  - Filters out noise and outdated info
  - Returns actionable insights

- **`thoughts_locator`** - Discover documentation
  - Finds relevant documents in `thoughts/` directories
  - Categorizes by type (tickets, research, plans, PRs)
  - Quick document discovery

Each tool requires two parameters:
- `project_path`: Absolute path to the project directory
- `query`: Natural language query about what to find/analyze

## 🛠️ Agent Tools

Each agent has access to the following file system tools:

- **`ls`** - List files and directories
- **`readFile`** - Read complete file contents
- **`readFileLines`** - Read specific line ranges from files
- **`grep`** - Search for regex patterns in files
- **`glob`** - Find files matching glob patterns (e.g., `**/*.ts`)

All tools respect `.gitignore` rules and implement path traversal protection for security.

## 📁 Project Structure

```
subagent/
├── src/
│   ├── agents/               # Five specialized agent classes
│   │   ├── AbstractAgent.ts  # Base class for all agents
│   │   ├── codebase-analyzer.ts
│   │   ├── codebase-locator.ts
│   │   ├── codebase-pattern-finder.ts
│   │   ├── thoughts-analyzer.ts
│   │   └── thoughts-locator.ts
│   ├── tools/
│   │   ├── fileSystemTools.ts  # File system tool implementations
│   │   └── security.ts         # Path security utilities
│   └── index.ts              # MCP server entry point
├── agent-prompts/            # System prompts for each agent
│   ├── codebase-analyzer.md
│   ├── codebase-locator.md
│   ├── codebase-pattern-finder.md
│   ├── thoughts-analyzer.md
│   └── thoughts-locator.md
├── package.json
├── tsconfig.json
└── README.md
```

## 🔒 Security Features

- **Path Traversal Protection**: `isSafePath()` validates all file access
- **`.gitignore` Respect**: Automatically excludes ignored files
- **Project Sandboxing**: All file operations scoped to specified project path
- **No Write Operations**: Read-only file system access

## 🧪 Example Use Cases

Once configured with Cursor, you can use the tools naturally in conversation:

### Find Code Locations
```
Use codebase_locator to find all authentication and login related files in /Users/you/myproject
```

### Analyze Implementation
```
Use codebase_analyzer to explain how rate limiting is implemented in /Users/you/myproject
```

### Find Code Patterns
```
Use codebase_pattern_finder to show pagination patterns with examples in /Users/you/myproject
```

### Research Document Analysis
```
Use thoughts_analyzer to extract API design decisions from /Users/you/myproject
```

### Discover Documentation
```
Use thoughts_locator to find research documents about security in /Users/you/myproject
```

## 🔑 Environment Variables

- `OPENAI_API_KEY` - **Required** - Your OpenAI API key for GPT models

## 🤖 AI Model

Uses OpenAI's **GPT-4o** model for fast, cost-effective analysis with tool calling support.

## 📝 License

ISC

## 🤝 Contributing

This is a research/utility project. Feel free to fork and customize the agents and prompts for your specific use case!

---

**Built with:**
- [Vercel AI SDK](https://ai-sdk.dev/) - AI framework with tool calling
- [OpenAI](https://openai.com/) - Language model
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP server framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development
