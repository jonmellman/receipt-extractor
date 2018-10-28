'use strict';

const fs = require('fs');
const Promise = require('bluebird');
const AWS = require('aws-sdk');
const rekognition = new AWS.Rekognition({
	region: 'us-east-1'
});
const timerName = __filename.replace(`${__dirname}/`, '');

console.time(timerName);
(async function() {
	const fileNames = await fs.readdirSync(`${process.cwd()}/receipts`).filter(fileName => !fileName.startsWith('.'));

	const expenseDetails = await Promise.map(fileNames, async (fileName) => {
		const textLines = await detectTextFromImage(fileName);
		return extractExpenseDetails(textLines);
	});

	// TODO: Convert to CSV and write to a file.
	console.log(JSON.stringify(expenseDetails, null, 4));

	return expenseDetails;

	async function detectTextFromImage(fileName) {
		const fileBuffer = fs.readFileSync(`./receipts/${fileName}`);
		const detectedText = await rekognition.detectText({
			Image: {
				Bytes: fileBuffer
			}
		}).promise();

		return detectedText.TextDetections
			.filter(textDetection => textDetection.Type === 'LINE')
			.map(textDetection => textDetection.DetectedText);
	}

	function extractExpenseDetails(textLines) {
		const expenseDetails = textLines.reduce((accumulator, text) => {
			text = text.toLowerCase();
			return {
				date: accumulator.date || tryExtractingDate(text),
				sum: accumulator.sum || tryExtractingSum(text)
			};
		}, {})

		for (let key in expenseDetails) {
			if (!expenseDetails[key]) {
				console.log(`\nCould not extract ${key} from these lines:`);
				console.log(`${textLines}\n`);
				break;
			}
		}

		return expenseDetails;

		function tryExtractingDate(text) {
			for (let word of text.split(' ')) {
				if (word.startsWith('2018-')) {
					return word;
				}
			}

			return null;
		}

		function tryExtractingSum(text) {
			if (text.includes('suma') && text.includes('pln')) {
				return text.replace('suma', '').replace('pln', '').trim();
			}

			return null;
		}

	}
})()
	.then(() => {
		console.timeEnd(timerName)
		process.exit(0)
	})
	.catch(err => {
		console.error(err);
		console.timeEnd(timerName)
		process.exit(1);
	});
