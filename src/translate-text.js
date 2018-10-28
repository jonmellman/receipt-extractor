'use strict';

/*
	I gave up on this because AWS does not yet support pl -> en translation :(
 */

const fs = require('fs');
const Promise = require('bluebird');
const AWS = require('aws-sdk');
const translate = new AWS.Translate({
	region: 'us-east-1'
});
const timerName = __filename.replace(`${__dirname}/`, '');

console.time(timerName);
(async function() {
	const fileNames = await fs.readdirSync('./detected-text');
	const files = fileNames.map(fileName => ({
		fileName,
		fileBuffer: fs.readFileSync(`./detected-text/${fileName}`)
	}));

	const result = await translate.translateText({
		SourceLanguageCode: 'auto',
		TargetLanguageCode: 'EN',
		Text: files[0].fileBuffer.toString()
	}).promise();

	console.log(result);
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
