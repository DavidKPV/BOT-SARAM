var restify = require('restify');

var builder = require('botbuilder');

var botbuilder_azure = require("botbuilder-azure");

var builder_cognitiveservices = require("botbuilder-cognitiveservices");

// Setup Restify Server

var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {

console.log('%s listening to %s', server.name, server.url);

});

// Create chat connector for communicating with the Bot Framework Service

var connector = new builder.ChatConnector({

appId: process.env.MicrosoftAppId,

appPassword: process.env.MicrosoftAppPassword,
openIdMetadata: process.env.BotOpenIdMetadata

});

// Listen for messages from users

server.post('/api/messages', connector.listen());

var tableName = 'botdata';

var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);

var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user

var bot = new builder.UniversalBot(connector);

bot.set('storage', tableStorage);

// Recognizer and and Dialog for preview QnAMaker service

var previewRecognizer = new builder_cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: process.env.QnAKnowledgebaseId,

authKey: process.env.QnAAuthKey || process.env.QnASubscriptionKey

});

var basicQnAMakerPreviewDialog = new builder_cognitiveservices.QnAMakerDialog({

recognizers: [previewRecognizer],

defaultMessage: 'No match! Try changing the query terms!',

qnaThreshold: 0.3

}

);

bot.dialog('basicQnAMakerPreviewDialog', basicQnAMakerPreviewDialog);

// Recognizer and and Dialog for GA QnAMaker service

var recognizer = new builder_cognitiveservices.QnAMakerRecognizer({

knowledgeBaseId: process.env.QnAKnowledgebaseId,
authKey: process.env.QnAAuthKey || process.env.QnASubscriptionKey, // Backward compatibility with QnAMaker (Preview)

endpointHostName: process.env.QnAEndpointHostName

});

var basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({

recognizers: [recognizer],

defaultMessage: "I'm not quite sure what you're asking. Please ask your question again.",

qnaThreshold: 0.3

});

bot.dialog('basicQnAMakerDialog', basicQnAMakerDialog);

bot.dialog('/', //basicQnAMakerDialog);

[

function (session) {

var qnaKnowledgebaseId = process.env.QnAKnowledgebaseId;
var qnaAuthKey = process.env.QnAAuthKey || process.env.QnASubscriptionKey;

var endpointHostName = process.env.QnAEndpointHostName;

// QnA Subscription Key and KnowledgeBase Id null verification

if ((qnaAuthKey == null || qnaAuthKey == '') || (qnaKnowledgebaseId == null || qnaKnowledgebaseId == ''))

session.send('Please set QnAKnowledgebaseId, QnAAuthKey and QnAEndpointHostName (if applicable) in App Settings. Learn how to get them at https://aka.ms/qnaabssetup.');

else {

if (endpointHostName == null || endpointHostName == '')

// Replace with Preview QnAMakerDialog service

session.replaceDialog('basicQnAMakerPreviewDialog');

else

// Replace with GA QnAMakerDialog service

session.replaceDialog('basicQnAMakerDialog');

}

}

]);