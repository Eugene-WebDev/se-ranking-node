# SE Ranking n8n Connector

A custom n8n node for integrating with the SE Ranking API, specifically designed to create SERP tasks and fetch organic search results data.

## Features

- Secure API token authentication with dual API support (Data & Project APIs)
- Create SERP tasks for keyword research
- Retrieve organic search results data
- Comprehensive error handling with continue-on-fail support
- User-friendly interface with clear descriptions
- Built-in data transformation and formatting

## Installation

### Prerequisites

- n8n installed (version 0.200.0 or higher recommended)
- Node.js (version 14 or higher)
- Active SE Ranking account with API access

### Setup Steps

1. **Clone or download this repository**
2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Build the connector:**

   ```bash
   npm run build
   ```

4. **Install via package file:**

   ```bash
   # Use the generated .tgz file
   npm install n8n-nodes-se-ranking-1.0.9.tgz
   ```

5. **Restart n8n** to load the new connector

## Configuration

### API Credentials

1. Sign up for SE Ranking: <https://seranking.com/sign-up.html>
2. Access your API Dashboard: <https://online.seranking.com/admin.api.dashboard.html>
3. Generate a new API token for the Data module
4. In n8n, go to Settings → Credentials → Add new credential → "SE Ranking API"
5. Enter your API token and select API type (Data API for SERP tasks)

### Node Parameters

#### Create SERP Task Operation

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Search Engine ID | Number | Yes | Search engine ID (200 for Google US, 1540 for Google US Mobile) |
| Keywords | String | Yes | Comma-separated list of keywords to search for |

#### Get Task Status Operation

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Task ID | String | Yes | The task ID from a previously created SERP task |

## Usage Example

### Basic Workflow

1. **Manual Trigger** → Start the workflow manually
2. **SE Ranking Node (Create SERP Task)** → Create task for keywords
3. **Wait Node** → Wait for task processing (recommended 30-60 seconds)
4. **SE Ranking Node (Get Task Status)** → Retrieve results
5. **Google Sheets Node** → Export to spreadsheet

## Google Sheets Integration

The connector works seamlessly with Google Sheets. Here's the recommended column structure:

| Column | Data | Expression |
|--------|------|------------|
| A | Task ID | `={{$json.task_id}}` |
| B | Position | `={{$json.position}}` |
| C | URL | `={{$json.url}}` |
| D | Title | `={{$json.title}}` |
| E | Snippet | `={{$json.snippet}}` |
| F | Cache URL | `={{$json.cache_url}}` |
| G | Retrieved At | `={{$json.retrieved_at}}` |
| H | Result Index | `={{$json.result_index}}` |

## Error Handling

The connector includes comprehensive error handling:

- **Authentication errors**: Clear messages for invalid API tokens
- **Parameter validation**: Helpful hints for required fields
- **API rate limits**: Graceful handling of rate limit responses
- **Network issues**: 30-second timeout handling
- **Data validation**: Ensures data integrity before processing
- **Continue on fail**: Optional error resilience for batch processing

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid API token" | Wrong or expired token | Check your SE Ranking API dashboard |
| "At least one keyword is required" | Empty keywords field | Provide comma-separated keywords |
| "Task still processing" | Results not ready yet | Wait and retry with Get Task Status |

## Development

### Project Structure

se-ranking-node/
├── se-ranking-node/
│   ├── credentials/
│   │   └── SeRankingApi.credentials.ts
│   └── nodes/
│       └── SERanking/
│           └── SeRanking.node.ts
├── package.json
├── tsconfig.json
├── n8n-nodes-se-ranking-1.0.9.tgz
 README.md

### Building from Source

bash
git clone []
cd se-ranking-node
npm install
npm run build
