import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import axios from 'axios';

export class SeRanking implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SE Ranking',
		name: 'seRanking',
		icon: 'file:seranking.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Get data from SE Ranking API',
		defaults: {
			name: 'SE Ranking',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'seRankingApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'createSerpTask',
				options: [
					{
						name: 'Create SERP Task',
						value: 'createSerpTask',
						description: 'Create a SERP task for keywords',
						action: 'Create SERP task',
					},
					{
						name: 'Get Task Status',
						value: 'getTaskStatus',
						description: 'Get status/results of a SERP task',
						action: 'Get task status',
					},
				],
			},
			{
				displayName: 'Search Engine ID',
				name: 'engineId',
				type: 'number',
				required: true,
				default: 200,
				description: 'Search engine ID (200 for Google US, 1540 for Google US Mobile)',
				displayOptions: {
					show: {
						operation: ['createSerpTask'],
					},
				},
			},
			{
				displayName: 'Keywords',
				name: 'keywords',
				type: 'string',
				required: true,
				default: '',
				description: 'Comma-separated list of keywords to search for',
				placeholder: 'keyword1, keyword2, keyword3',
				displayOptions: {
					show: {
						operation: ['createSerpTask'],
					},
				},
			},
			{
				displayName: 'Task ID',
				name: 'taskId',
				type: 'string',
				required: true,
				default: '',
				description: 'The task ID from a previously created SERP task',
				displayOptions: {
					show: {
						operation: ['getTaskStatus'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		try {
			const operation = this.getNodeParameter('operation', 0) as string;
			const credentials = await this.getCredentials('seRankingApi');
			const baseUrl = 'https://api.seranking.com';

			for (let i = 0; i < items.length; i++) {
				try {
					if (operation === 'createSerpTask') {
						const engineId = this.getNodeParameter('engineId', i) as number;
						const keywordsParam = this.getNodeParameter('keywords', i) as string;

						// Parse keywords
						const keywords = keywordsParam.split(',').map(k => k.trim()).filter(k => k.length > 0);

						if (keywords.length === 0) {
							throw new NodeOperationError(this.getNode(), 'At least one keyword is required', { itemIndex: i });
						}

						// Create SERP task
						const response = await axios.post(
							`${baseUrl}/v1/serp/tasks`,
							{
								engine_id: engineId,
								query: keywords,
							},
							{
								headers: {
									'Authorization': `Token ${(credentials as any).apiToken}`,
									'Content-Type': 'application/json',
								},
								timeout: 30000, // 30 second timeout
							}
						);

						const tasks = response.data;
						if (Array.isArray(tasks)) {
							tasks.forEach((task: any) => {
								returnData.push({
									json: {
										query: task.query,
										task_id: task.task_id,
										engine_id: engineId,
										status: 'created',
										created_at: new Date().toISOString(),
									},
								});
							});
						} else {
							returnData.push({
								json: {
									error: 'Unexpected response format',
									response: tasks,
								},
							});
						}

					} else if (operation === 'getTaskStatus') {
						const taskId = this.getNodeParameter('taskId', i) as string;

						const response = await axios.get(
							`${baseUrl}/v1/serp/tasks/status`,
							{
								params: { task_id: taskId },
								headers: {
									'Authorization': `Token ${(credentials as any).apiToken}`,
								},
								timeout: 30000, // 30 second timeout
							}
						);

						const data = response.data;

						if (data.status === 'processing') {
							returnData.push({
								json: {
									task_id: taskId,
									status: 'processing',
									checked_at: new Date().toISOString(),
								},
							});
						} else if (data.results && Array.isArray(data.results)) {
							data.results.forEach((result: any, index: number) => {
								returnData.push({
									json: {
										task_id: taskId,
										position: parseInt(result.position) || 0,
										url: result.url || '',
										title: result.title || '',
										snippet: result.snippet || '',
										cache_url: result.cache_url || '',
										result_index: index + 1,
										retrieved_at: new Date().toISOString(),
									},
								});
							});
						} else {
							returnData.push({
								json: {
									task_id: taskId,
									status: 'completed_no_results',
									data: data,
									checked_at: new Date().toISOString(),
								},
							});
						}
					}

				} catch (error: any) {
					let errorMessage = 'Unknown error occurred';
					let errorCode = 'UNKNOWN_ERROR';

					if (error.response?.data) {
						errorMessage = error.response.data.error_description ||
									   error.response.data.message ||
									   error.message;
						errorCode = error.response.status?.toString() || 'API_ERROR';
					} else if (error.message) {
						errorMessage = error.message;
						errorCode = error.code || 'REQUEST_ERROR';
					}

					if (this.continueOnFail()) {
						returnData.push({
							json: {
								error: true,
								errorMessage,
								errorCode,
								item: i,
							},
						});
						continue;
					}

					throw new NodeOperationError(
						this.getNode(),
						`SE Ranking API Error: ${errorMessage}`,
						{
							itemIndex: i,
							description: `Error Code: ${errorCode}`,
						},
					);
				}
			}

		} catch (error: any) {
			throw new NodeOperationError(
				this.getNode(),
				`SE Ranking Node Error: ${error.message}`,
			);
		}

		return [returnData];
	}
}
