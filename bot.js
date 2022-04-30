// require('@tensorflow/tfjs-node-gpu');
require('dotenv').config({path:'C:\\Users\\Dan\\Downloads\\extreme-voracious-gold-2022-04-28_211823\\extreme-voracious-gold-2022-04-28_211823\\app\\.env'});
const tmi = require('tmi.js');
const say = require('say');
const deepai = require('deepai');
const toxicity = require('@tensorflow-models/toxicity');

deepai.setApiKey('6718db08-1050-4ab0-bb43-d02f6bd5a222');
let chatEnabled = true;

const threshold = 0.9;

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
const toxicClassifier = await initToxicAnalysis();

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();


async function initToxicAnalysis() {
  return await toxicity.load(threshold, ['severe_toxicity', 'identity_attack', 'threat', 'sexual_explicit', 'obscene']);
}

async function toxic_analysis(msg, context) {
  let toxic = false;
  let predictions = await toxicClassifier.classify([msg]);

  predictions.every(prediction => {
    return prediction.results.every(result => {
      if (result.match) {
        let text = `${context.username} your message was analyzed and tagged as ${prediction.label}. Shame on you.`;
        say.speak(text, 'Microsoft Zira Desktop');
        toxic = true;
        return false;
      }
      return true;
    })
  });

  return toxic;
}

async function censor_sentences(response) {
  let sentences = response.split(/\(?[^.?!]+[.!?]\)?/g);
  let predictions = await toxicClassifier.classify(sentences);

  for(let i = 0; i < sentences.length; i++) {
    predictions.every(prediction => {
      if (prediction.results[i].match) {
        sentences[i] = `[Sentence was censored due to possible detection of ${prediction.label} content].`;
        return false;
      }
      return true;
    });
  }

  return sentences.join(' ');
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
    toxic_analysis(msg, context).then(toxic => {
      if(!toxic) {
        (async function() {
          const resp = await deepai.callStandardApi("text-generator", {
            text: context.username + ' said ' + msg + '. I am AI Dannygerous while dannygerous is playing Crash Bandicoot during a work meeting, and I think ',
          });

          return await resp;
        })().then(resp => {
          console.log(resp);
          censor_sentences(resp.output).then(output => {
            say.speak(output, 'Microsoft Zira Desktop');
          });
        })
      }
    });


  }
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
