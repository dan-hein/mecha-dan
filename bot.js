// require('@tensorflow/tfjs-node-gpu');
require('dotenv').config({path:'C:\\Users\\Dan\\Downloads\\extreme-voracious-gold-2022-04-28_211823\\extreme-voracious-gold-2022-04-28_211823\\app\\.env'});
const tmi = require('tmi.js');
const say = require('say');
const deepai = require('deepai'); // OR include deepai.min.js as a script tag in your HTML
const toxicity = require('@tensorflow-models/toxicity');

deepai.setApiKey('6718db08-1050-4ab0-bb43-d02f6bd5a222');
let chatEnabled = true;

const threshold = 0.1;

// Define configuration options
const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [
    process.env.CHANNEL_NAME
  ]
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();
// say.getInstalledVoices(console.log);

function toxic_analysis(msg, context) {
  let toxic = false;
  toxicity.load(threshold, ['toxicity', 'severe_toxicity', 'identity_attack', 'insult', 'threat', 'sexual_explicit', 'obscene']).then(model => {
    // Now you can use the `model` object to label sentences.
    model.classify([msg]).then(predictions => {
        for (let result in predictions) {
          if (result.match) {
            let text = `${context.username} your message was analyzed and tagged as mean. Shame on you.`;
            say.speak(text, 'Microsoft Zira Desktop');
            toxic = true;
            return toxic;
          }
      }
    });
  });

  return toxic;
}

function censor_sentences(response) {
  let sentences = response.split(/\(?[^.?!]+[.!?]\)?/g);
  let toxic = false;
  toxicity.load(threshold, ['toxicity', 'severe_toxicity', 'identity_attack', 'insult', 'threat', 'sexual_explicit', 'obscene']).then(model => {
    // Now you can use the `model` object to label sentences.
    model.classify(sentences).then(predictions => {

      for (let prediction in predictions) {
        for (let result in prediction.results) {
          if (result.match) {
            let text = `Response was censored due to possible detection of offensive content`;
            say.speak(text, 'Microsoft Zira Desktop');
            toxic = true;
            return;
          }
        }
      }

      return false;
    });
  });

  return toxic;
}

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if(self)
    return;
  // If the command is known, let's execute it
  const commandName = msg.trim();

  if (commandName === '!toggle_auto_chat' && ['dannygerous1', 'vqrob07', 'thezietgeist', 'methekaptain', 'honey___bee'].includes(context.username)) {
    chatEnabled = !chatEnabled;
    client.say(target, `Auto Twitch Chat Toggled: ${chatEnabled}`);
    console.log(`* Executed ${commandName} command`);
    return;
  }

  if (chatEnabled) {
    // let b = toxic_analysis(msg, context);
    // if(b)
    //   return;

    (async function() {
      const resp = await deepai.callStandardApi("text-generator", {
        text: context.username + ' said ' + msg + '. I am AI Dannygerous while dannygerous is playing Crash Bandicoot during a work meeting, and I think ',
      });

      return await resp;
    })().then(resp => {
      console.log(resp);

      say.speak(resp.output, 'Microsoft Zira Desktop');
      // if(!censor_sentences(resp.output)) {
      // }
    })
  }
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
