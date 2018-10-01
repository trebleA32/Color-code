const Alexa = require('ask-sdk');

const states = {START: 0,
  SETTINGS: 1,
  ROLL_CALL: 2,
  GAME_MODE: 3,
  NUM_SLOTS_SELECT: 4,
  NUM_COLORS_SELECT: 5,
  END: 6
};

const NUMCOLORS_PROMPT = "How many colors should we use?";
const NUMSLOTS_PROMPT = "How many slots should there be?";

const SOUNDS = Object.freeze({
    WAITING_FOR_ROLL_CALL: "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_waiting_loop_30s_01'/>",
    ROLL_CALL_COMPLETE: "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_bridge_01'/>",
    WAITING_FOR_ANSWER: "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_waiting_loop_30s_01'/>",
    BUTTON_1_PRESSED: "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_player1_01'/>",
    BUTTON_2_PRESSED: "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_player2_01'/>",
    BUTTON_3_PRESSED: "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_player3_01'/>",
    BUTTON_4_PRESSED: "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_player4_01'/>",
    BAD_ANSWER: "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_negative_response_01'/>",
    OKAY_ANSWER: "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_neutral_response_02'/>",
    CORRECT_ANSWER: "<audio src='soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_01'/>"
  });

const COLORS = {
    blue: "0000FF",
    green: "008000",
    red: "FF0000",
    yellow: "FFFF00",
    purple: "800080",
    orange: "FF7F00",
    white: "FFFFFF",
    magenta: "FC0031",
    aqua: "00FFFF"
};

const COLORS_KEYS = ["blue", "green", "red", "yellow", "purple", "orange", "white", "magenta", "aqua"];

// Flashes through all colors
function createButtonWinAnimation(targetGadgets)
{
  let sequence = [];
  for(let i = 0; i < COLORS_KEYS.length; i++)
  {
    let step = {
      durationMs: 250,
      color: COLORS[COLORS_KEYS[i]],
      blend: false
    };
    sequence.push(step);
  }
  return {
     "type": "GadgetController.SetLight",
     "version": 1,
     "targetGadgets": targetGadgets,
     "parameters": {
       "animations": [{
         "repeat": 3,
         "targetLights": ["1"],
         "sequence": sequence,
       }],
       "triggerEvent": "none",
       "triggerEventTimeMs": 0
     }
   };
}

function createDefaultUpAnimation(targetGadgets)
{
  return {
     "type": "GadgetController.SetLight",
     "version": 1,
     "targetGadgets": targetGadgets,
     "parameters": {
       "animations": [{
         "repeat": 100,
         "targetLights": ["1"],
         "sequence": [
         {
           "durationMs": 65535,
           "color": "000000",
           "blend": false
         }]
       }],
       "triggerEvent": "buttonUp",
       "triggerEventTimeMs": 0
     }
   };
}

function createDefaultDownAnimation(targetGadgets)
{
  return {
     "type": "GadgetController.SetLight",
     "version": 1,
     "targetGadgets": targetGadgets,
     "parameters": {
       "animations": [{
         "repeat": 100,
         "targetLights": ["1"],
         "sequence": [{
           "durationMs": 65535,
           "color": "000000",
           "blend": false
         }]
       }],
       "triggerEvent": "buttonDown",
       "triggerEventTimeMs": 0
     }
   };
}

function createDefaultIdleAnimation(targetGadgets)
{
  return {
     "type": "GadgetController.SetLight",
     "version": 1,
     "targetGadgets": targetGadgets,
     "parameters": {
       "animations": [{
         "repeat": 100,
         "targetLights": ["1"],
         "sequence": [
         {
           "durationMs": 65535,
           "color": "000000",
           "blend": false
         }]
       }],
       "triggerEvent": "none",
       "triggerEventTimeMs": 0
     }
   };
}

function createButtonUpAnimation(targetGadgets, color)
{
  return {
     "type": "GadgetController.SetLight",
     "version": 1,
     "targetGadgets": targetGadgets,
     "parameters": {
       "animations": [{
         "repeat": 100,
         "targetLights": ["1"],
         "sequence": [
         {
           "durationMs": 65535,
           "color": color,
           "blend": false
         }]
       }],
       "triggerEvent": "buttonUp",
       "triggerEventTimeMs": 0
     }
   };
}

function createButtonDownAnimation(targetGadgets, color)
{
  return {
     "type": "GadgetController.SetLight",
     "version": 1,
     "targetGadgets": targetGadgets,
     "parameters": {
       "animations": [{
         "repeat": 100,
         "targetLights": ["1"],
         "sequence": [{
           "durationMs": 65535,
           "color": color,
           "blend": false
         }]
       }],
       "triggerEvent": "buttonDown",
       "triggerEventTimeMs": 0
     }
   };
}

function createButtonIdleAnimation(targetGadgets, color)
{
  return {
     "type": "GadgetController.SetLight",
     "version": 1,
     "targetGadgets": targetGadgets,
     "parameters": {
       "animations": [{
         "repeat": 100,
         "targetLights": ["1"],
         "sequence": [
         {
           "durationMs": 65535,
           "color": color,
           "blend": false
         }]
       }],
       "triggerEvent": "none",
       "triggerEventTimeMs": 0
     }
   };
}

function getButtonSound(handlerInput)
{
  switch(handlerInput.attributesManager.getSessionAttributes().buttonIds.length)
  {
    case 1:
      return SOUNDS.BUTTON_1_PRESSED;
    case 2:
      return SOUNDS.BUTTON_2_PRESSED;
    case 3:
      return SOUNDS.BUTTON_3_PRESSED;
    case 4:
      return SOUNDS.BUTTON_4_PRESSED;
  }
}

const SETTINGS_SLOTS = ["nSlots", "nColors", "usesButtons"];
const SETTINGS_PROMPTS = ["How many slots should we have? (choose an integer between one and four) ",
    "How many colors should we have? (choose an integer between two and nine) ",
    "Will you be using Echo buttons or voice control? "];

const SettingsIntent = {
  canHandle(handlerInput)
  {
    const { request } = handlerInput.requestEnvelope;
    return request.type === 'IntentRequest' && 
      ((request.intent.name === 'SettingsIntent'));// && request.dialogState !== 'COMPLETED'));
  },
  async handle(handlerInput)
  {
    let currentIntent = handlerInput.requestEnvelope.request.intent;

    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    let isCompleted = true;
    
    // Check to see that we have not received an erroneous slot values
    let responseArray = [];
    
    for(let i = 0; i < SETTINGS_SLOTS.length; i++)
    {
      let slot = currentIntent.slots[SETTINGS_SLOTS[i]];
      let num = Number(slot.value);
      // If there are any erroneous slot values then reprompt for proper values
      if ((slot.resolutions !== undefined && slot.resolutions !== null && slot.resolutions.resolutionsPerAuthority[0].status.code === 'ER_SUCCESS_NO_MATCH') ||
      (slot.name === "nSlots" && (!isNaN(num)) && (num < 1 || num > 4 || num !== Math.round(num))) ||
      (slot.name === "nColors" && (!isNaN(num)) && (num < 2 || num > COLORS_KEYS.length || num !== Math.round(num))))
      {
        console.log("Inappropriate value found for ", slot.name);
        responseArray.push(handlerInput.responseBuilder
              .speak(SETTINGS_PROMPTS[i])
              .reprompt(SETTINGS_PROMPTS[i])
              .addElicitSlotDirective(slot.name)
              .getResponse());
      }
      else if (slot.resolutions !== undefined && slot.resolutions.resolutionsPerAuthority[0].status.code === 'ER_SUCCESS_MATCH')
      {
        switch (slot.name)
        {
          case "nSlots":
            sessionAttributes.nSlots = Number(currentIntent.slots.nSlots.value);
            break;
          case "nColors":
            sessionAttributes.nColors = Number(currentIntent.slots.nColors.value);
            break;
          case "usesButtons":
            sessionAttributes.usesButtons = currentIntent.slots.usesButtons.resolutions.resolutionsPerAuthority[0].values[0].value.name === "buttons";
            break;
        }
      }
      else if(slot.resolutions === undefined)
        isCompleted = false;
    }
    
    if(responseArray.length > 0)
      return responseArray[0];
    
    // If all of the slots have been filled correctly
    if(isCompleted)
    {
      if(sessionAttributes.usesButtons)
      {
    
        // Need to set up buttons if not set up already
        // So initiate roll call
        if(sessionAttributes.buttonIds === undefined || sessionAttributes.buttonIds.length !== sessionAttributes.nSlots)
        {
          sessionAttributes.state = states.ROLL_CALL;
          return startRollCall(handlerInput);
        
        }
      }
      else
        sessionAttributes.usesButtons = false;
      
      return await startGame(handlerInput);
    }
    
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  }
};

async function startGame(handlerInput, speechOutput = "")
{
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  
  // Get number of slots
  let nSlots = sessionAttributes.nSlots;
  
  // Get number of colors
  let nColors = sessionAttributes.nColors;
  
  // Randomly generate answer
  let answer = [];
  for(let i = 0; i < nSlots; i++)
  {
    let colorIndex = Math.floor(Math.random() * nColors);
    answer.push(colorIndex);
  }
  sessionAttributes.answer = answer;
  
  // Prompt User for guess
  sessionAttributes.state = states.GAME_MODE;
  sessionAttributes.turns = [];
  let turn = [];
  for(let i = 0; i < nSlots; i++)
    turn.push(0);
  sessionAttributes.turns.push(turn);
  
  speechOutput += "Let's start your game. ";
  // If we haven't done this before then we provide basic instructions
  if(sessionAttributes.records === undefined)
  {
    speechOutput += "Here's how it works. Your objective is to find the correct code in as few guesses as possible. ";
    speechOutput += "After each guess you will be told how many colors are in the correct position and how many colors are in the incorrect position. ";
    sessionAttributes.records = [];
    for(let i = 0; i < COLORS_KEYS.length; i++)
      sessionAttributes.records.push([undefined, undefined, undefined, undefined]);
    speechOutput += 'Just say the desired sequence of colors to make your guess. ';
  }
  else
  {
    if(sessionAttributes.records[nColors] === undefined)
      sessionAttributes.records[nColors] = [undefined, undefined, undefined, undefined];
    let record = sessionAttributes.records[nColors][nSlots];
    
    // If we have done these settings then report how many turns it took the user to beat it before
    if(record !== undefined && record !== null)
    {
      speechOutput += "Your best score for these settings is " + record + " turn";
      if(record > 1)
        speechOutput += "s";
      speechOutput += ". ";
    }
  }
  
  if(sessionAttributes.usesButtons && (sessionAttributes.usedButtonsBefore === undefined || sessionAttributes.usedButtonsBefore === null))
  {
    speechOutput += 'To use your Echo buttons, just press each button to get your desired code, then say "Try this code". ';
    sessionAttributes.usedButtonsBefore = true;
    
    let persistentAttributes = {};
      
    persistentAttributes.records = sessionAttributes.records;
    persistentAttributes.usedButtonsBefore = true;
      
    handlerInput.attributesManager.setPersistentAttributes(persistentAttributes);
    await handlerInput.attributesManager.savePersistentAttributes();
    
  }
  
  // Tell user what colors they can use
  var speechOutput2 = "You can use the colors ";
  for (let i = 0 ; i < sessionAttributes.nColors - 1; i++)
  {
    speechOutput2 += COLORS_KEYS[i];
    if(i < sessionAttributes.nColors - 2)
      speechOutput2 += ", ";
  }
  speechOutput2 += " and " + COLORS_KEYS[sessionAttributes.nColors - 1] + ". ";
  
  sessionAttributes.state = states.GAME_MODE;
  sessionAttributes.speechOutput = speechOutput + speechOutput2;
  sessionAttributes.repromptText = "What's your first guess?"  + SOUNDS.WAITING_FOR_ANSWER + SOUNDS.WAITING_FOR_ANSWER;
  sessionAttributes.displayText = speechOutput2 + "\n What's your first guess?";
  sessionAttributes.repeatText = speechOutput2;
  
  var response = displayOutput(handlerInput, 60000);
  if(sessionAttributes.usesButtons)
  {
    for(let i = 0; i < nSlots; i++)
    {
      setButtonColor(handlerInput, i, COLORS.blue, response);
    }
  }
  else if(sessionAttributes.buttonIds !== undefined && sessionAttributes.buttonIds.length !== 0)
  {
    sessionAttributes.buttonIds = [];
    response.directives.push(buttonStopInputHandlerDirective(sessionAttributes.CurrentInputHandlerID));
    response.directives.push(createDefaultUpAnimation([]));
    response.directives.push(createDefaultDownAnimation([]));
    response.directives.push(createDefaultIdleAnimation([]));
  }
  return response;
}

async function processAnswer(handlerInput)
{
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  let nSlots = sessionAttributes.nSlots;
  let nColors = sessionAttributes.nColors;
  let answer = sessionAttributes.answer;
  // See if guess matches answer
  
  // If guess does match answer 
  let guess = sessionAttributes.turns[sessionAttributes.turns.length - 1]; 
  let match = true;
  for(let i = 0; i < nSlots; i++)
  {
    if(guess[i] !== answer[i])
    {
      match = false;
      break;
    }
  }
  var speechOutput = "";
  var repromptText = "";
  
  // If we have the correct answer
  if(match)
  {
    sessionAttributes.state = states.END;
    speechOutput = "Correct! You've found the right code in ";
    // Then count the number of turns it took them
    let nTurns = sessionAttributes.turns.length;
    speechOutput += nTurns + " turn";
    if(nTurns > 1)
      speechOutput += "s";
    speechOutput += ". ";
    // See if the record needs to be updated
    if(sessionAttributes.records[nColors][nSlots] === null || sessionAttributes.records[nColors][nSlots] === undefined || nTurns < sessionAttributes.records[nColors][nSlots])
    {
      let persistentAttributes = {};
      
      sessionAttributes.records[nColors][nSlots] = nTurns;
      persistentAttributes.records = sessionAttributes.records;
      
      handlerInput.attributesManager.setPersistentAttributes(persistentAttributes);
      await handlerInput.attributesManager.savePersistentAttributes();
      speechOutput += "You got a new record. ";
    }
    repromptText = "Want to start over or start a game with different settings?";
      
    sessionAttributes.displayText = speechOutput + "\n" + repromptText;
    sessionAttributes.speechOutput = SOUNDS.CORRECT_ANSWER + speechOutput;
    sessionAttributes.repromptText = repromptText;
    sessionAttributes.repeatText = speechOutput;
  }
  else
  {
    // Otherwise game continues
    let nCorrectPos = 0;
    
    let answerColorCount = [];
    let guessColorCount = [];
    for(let i = 0; i < nColors; i++)
    {
      answerColorCount[i] = 0;
      guessColorCount[i] = 0;
    }
    for(let i = 0; i < guess.length; i++)
    {
      if(guess[i] == answer[i])
      {
        nCorrectPos++;
      }
      else
      {
        guessColorCount[guess[i]]++;
        answerColorCount[answer[i]]++;
      }
    }
    
    let nCorrectColor = 0;
    // Get number of correct color but incorrect position slots
    for(let i = 0; i < nColors; i++)
    {
      if(guessColorCount[i] !== undefined && answerColorCount[i] !== undefined)
      {
        nCorrectColor += Math.min(guessColorCount[i], answerColorCount[i]);
      }
    }
    
    sessionAttributes.turns.push(guess.slice(0));
    
    speechOutput = "You have " + nCorrectPos + " color";
    if(nCorrectPos !== 1)
      speechOutput += "s";
    speechOutput += " in the correct slot";
    if(nCorrectPos !== 1)
      speechOutput += "s";
    speechOutput += " and " + nCorrectColor + " color";
    if(nCorrectColor !== 1)
      speechOutput += "s";
    speechOutput += " in the incorrect slot";
    if(nCorrectColor !== 1)
      speechOutput += "s";
    speechOutput += ". ";
    
    let sound;
    if(nCorrectColor > 0 || nCorrectPos > 0)
      sound = SOUNDS.OKAY_ANSWER;
    else
      sound = SOUNDS.BAD_ANSWER;
    
    sessionAttributes.speechOutput = sound + speechOutput;
    sessionAttributes.repromptText = "What's your next guess?" + SOUNDS.WAITING_FOR_ANSWER;
    sessionAttributes.displayText = speechOutput + "\n What's your next guess?";
    sessionAttributes.repeatText = speechOutput;
    
    guess.push(nCorrectColor);
    guess.push(nCorrectPos);
  }
  
  var response = displayOutput(handlerInput);
  if(match && sessionAttributes.usesButtons)
  {
    response.directives.push(buttonStopInputHandlerDirective(sessionAttributes.CurrentInputHandlerID));
    response.directives.push(createButtonWinAnimation(sessionAttributes.buttonIds));
  }
  return response;
}

 function createButtonStartInputHandlerDirective(time)
 {
   return{
  "type": "GameEngine.StartInputHandler",
  "timeout": time, // In milliseconds.
  "proxies": [ "one", "two", "three", "four" ],
  "recognizers": {
    "button_down_recognizer": {
      "type": "match",
      "fuzzy": false,
      "anchor": "end",
      "pattern": [{
        "action": "down"
      }]
    },/*
    "button_up_recognizer": {
      "type": "match",
      "fuzzy": false,
      "anchor": "end",
      "pattern": [{
        "action": "up"
      }]
    }*/
  },
  "events": {  // These events will be sent to your Skill in a request.
    "button_down_event": {
      "meets": ["button_down_recognizer"],
      "reports": "matches",
      "shouldEndInputHandler": false
    },
    "button_up_event": {
      "meets": ["button_up_recognizer"],
      "reports": "matches",
      "shouldEndInputHandler": false
    },
    "timeout": {
      "meets": ["timed out"],
      "reports": "history",
      "shouldEndInputHandler": true
    }
  }
};
}

function buttonStopInputHandlerDirective(inputHandlerOriginatingRequestId) 
{
   return {
     "type": "GameEngine.StopInputHandler",
     "originatingRequestId": inputHandlerOriginatingRequestId
   };
 }

function startRollCall(handlerInput)
{
  var sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  
  let speechOutput = 'Let\'s start the roll call for your echo buttons. ';
  
  sessionAttributes.state = states.ROLL_CALL;
  sessionAttributes.buttonIds = []; 
  sessionAttributes.CurrentInputHandlerID = handlerInput.requestEnvelope.request.requestId;    
  sessionAttributes.speechOutput = speechOutput;
  sessionAttributes.repromptText = 'Push each echo button once. ' + SOUNDS.WAITING_FOR_ROLL_CALL;
  sessionAttributes.displayText = sessionAttributes.speechOutput + " \n " + 'Push each echo button once. ';
  sessionAttributes.repeatText = sessionAttributes.speechOutput;
  var response = displayOutput(handlerInput);
  
  if(response.directives === undefined)
    response.directives = [];
  response.directives.push(createDefaultDownAnimation([]));
  response.directives.push(createDefaultIdleAnimation([]));
  response.directives.push(createDefaultUpAnimation([]));
  
  delete response.shouldEndSession;
  
  return response;
}
  
// Roll call determines button order
const RollCallIntent = {
  canHandle(handlerInput)
  {
    const {request} = handlerInput.requestEnvelope;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return request.type === 'GameEngine.InputHandlerEvent' &&
        sessionAttributes.state === states.ROLL_CALL && sessionAttributes.usesButtons;
  },
  async handle(handlerInput)
  {
    console.log('Received roll call game event');
    var request = handlerInput.requestEnvelope.request;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if (request.originatingRequestId !== sessionAttributes.CurrentInputHandlerID) {
        console.log("Global.GameEngineInputHandler: stale input event received -> " 
                    +"received event from " + request.originatingRequestId 
                    +" (was expecting " + sessionAttributes.CurrentInputHandlerID + ")");          
        return handlerInput.responseBuilder.getResponse();
    }
    if(sessionAttributes.buttonIds === undefined || sessionAttributes.buttonIds === null)
    {
      sessionAttributes.buttonIds = [];
    }
    
    var gameEngineEvents = request.events;
    if(request.events === undefined)
    {
      gameEngineEvents = [];
    }
    
    for (var i = 0; i < gameEngineEvents.length; i++) 
    {        
      var buttonId;
      switch (gameEngineEvents[i].name) {
        case 'button_down_event': {
          
          var speechOutput = '';
          // ID of the button that triggered the event.
          buttonId = gameEngineEvents[i].inputEvents[0].gadgetId;
          // Recognize a new button.
          
          var isNewButton = true;
          for(let i = 0; i < sessionAttributes.buttonIds.length; i++)
          {
            if(buttonId === sessionAttributes.buttonIds[i])
            {
              isNewButton = false;
            }
          }
          var response;
          if(isNewButton)
          {
            sessionAttributes.buttonIds.push(buttonId);
            let buttonCount = sessionAttributes.buttonIds.length;
            let buttonSound = getButtonSound(handlerInput);
            speechOutput = buttonSound + "Button  " + buttonCount + " confirmed. ";
            
            // See if we have all buttons to end roll call
            if(buttonCount == sessionAttributes.nSlots)
            {
              //speechOutput += SOUNDS.ROLL_CALL_COMPLETE;
              speechOutput += " Roll call complete.  <break time='100ms'/>";
              response = await startGame(handlerInput, speechOutput);
            }
            else
            {
              //speechOutput += SOUNDS.WAITING_FOR_ROLL_CALL;
              sessionAttributes.speechOutput = speechOutput;
              sessionAttributes.repromptText = "Press another Echo button. " + SOUNDS.WAITING_FOR_ROLL_CALL;
              sessionAttributes.displayOutput = "Press another Echo button. ";
              sessionAttributes.repeatText = "";
              response = displayOutput(handlerInput);
            }
            
            setButtonColor(handlerInput, buttonCount - 1, COLORS.blue, response);
            response.shouldEndSession = false;
            return response;
          }
        }
        case 'timeout': 
        {         
          const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
          
          let buttonsNeeded = sessionAttributes.nSlots - sessionAttributes.buttonIds.length;
          // Timeout reached, try roll call again
          let speechOutput = "We need " + buttonsNeeded + " more button";
          if(buttonsNeeded !== 1)
          {
            speechOutput += "s";
          }
          speechOutput += ". ";
          sessionAttributes.speechOutput = speechOutput;
          sessionAttributes.repeatText = speechOutput;
          sessionAttributes.displayOutput = speechOutput + "Press another Echo button. ";
          return displayOutput(handlerInput);
        }           
      }
    }
  }
};

// Responding to button pressed when in button mode
const ButtonPressIntent = {
  canHandle(handlerInput)
  {
    const {request} = handlerInput.requestEnvelope;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return request.type === 'GameEngine.InputHandlerEvent' &&
        sessionAttributes.state === states.GAME_MODE && sessionAttributes.usesButtons;
  },
  handle(handlerInput)
  {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    
    console.log('Received game button event');
    var request = handlerInput.requestEnvelope.request;
    if (request.originatingRequestId !== sessionAttributes.CurrentInputHandlerID) {
        console.log("Global.GameEngineInputHandler: stale input event received -> " 
                    +"received event from " + request.originatingRequestId 
                    +" (was expecting " + sessionAttributes.CurrentInputHandlerID + ")");          
        return handlerInput.responseBuilder.getResponse();
    }
    
    var gameEngineEvents = request.events;
    if(gameEngineEvents === undefined)
      gameEngineEvents = [];
    for (var i = 0; i < gameEngineEvents.length; i++) 
    {        
      switch (gameEngineEvents[i].name) {
        case 'button_down_event': 
        {
          // ID of the button that triggered the event.
          var buttonId = gameEngineEvents[i].inputEvents[0].gadgetId;
          var buttonIndex = sessionAttributes.buttonIds.indexOf(buttonId); 
          if(buttonIndex === -1)
            return handlerInput.responseBuilder.speak("moo").getResponse();
          
          // Get new color for button (based on what we had listed as the old color)
          let currentTurn = sessionAttributes.turns[sessionAttributes.turns.length - 1];
          currentTurn[buttonIndex] = (currentTurn[buttonIndex] + 1) % sessionAttributes.nColors;
          
          let response = handlerInput.responseBuilder.getResponse();
         
          setButtonColor(handlerInput, buttonIndex, COLORS[COLORS_KEYS[currentTurn[buttonIndex]]], response);
          prepareButtons(handlerInput, response);
          response.shouldEndSession = false;
          return response;
        }
        case 'timeout': 
        {         
          const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
          sessionAttributes.speechOutput = "";
          sessionAttributes.repeatText = "";
          sessionAttributes.repromptText = "What's your guess?" + SOUNDS.WAITING_FOR_ANSWER;
          sessionAttributes.displayText = "What's your guess?";
          return displayOutput(handlerInput);
        }           
      }
    }
  }
};

// If we're using echo buttons then just submit the colors as we've been keeping track of them
const SubmitIntent = {
  canHandle(handlerInput)
  {
    const { request } = handlerInput.requestEnvelope;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return request.type === 'IntentRequest' && request.intent.name === 'SubmitIntent' && 
      sessionAttributes.state === states.GAME_MODE;
  },
  handle(handlerInput)
  {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if(sessionAttributes.usesButtons)
    {
      return processAnswer(handlerInput);
    }
    else
    {
      sessionAttributes.speechOutput = 'Sorry.  I can only do that when we are using Echo buttons.  Try saying your color sequence instead. ';
      sessionAttributes.repeatText = 'Try saying your color sequence instead. ' + sessionAttributes.repromptText;
      sessionAttributes.displayText =  sessionAttributes.speechOutput + "What's your guess?";
      return displayOutput(handlerInput);
    }
  }
};

// Dealing with an answer provided by a player
// If using buttons, after the player has pushed the button then we use what we have as the current button state
const GuessIntent = {
  canHandle(handlerInput)
  {
    const { request } = handlerInput.requestEnvelope;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    console.log(sessionAttributes.nSlots);
    return request.type === 'IntentRequest' && request.intent.name === 'GuessIntent' && 
      sessionAttributes.state === states.GAME_MODE;
  },
  async handle(handlerInput)
  {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const { request } = handlerInput.requestEnvelope;
    let currentIntent = request.intent;
    console.log(currentIntent);
    let nSlots = sessionAttributes.nSlots;
    // If using buttons then use what we have as the stored button values for this turn
    // Make sure they said the correct number of values
    var guess = [currentIntent.slots.color_one.value, currentIntent.slots.color_two.value,
      currentIntent.slots.color_three.value, currentIntent.slots.color_four.value];
    // If not correct then reprompt them for the correct ones
    for(let i = 0; i < 4; i++)
    {
      if((guess[i] === undefined && nSlots >= i+1) || (nSlots < i+1 && guess[i] !== undefined))
      {
        sessionAttributes.speechOutput = "Your answer must have " + nSlots + " slot";
        if(nSlots !== 1)
          sessionAttributes.speechOutput += "s";
        sessionAttributes.speechOutput += ". ";
        sessionAttributes.repromptText = "What's your guess?" + SOUNDS.WAITING_FOR_ANSWER;
        sessionAttributes.displayText = sessionAttributes.speechOutput + "\n What's your guess?";//sessionAttributes.repromptText;
        sessionAttributes.repeatText = sessionAttributes.speechOutput;
        return displayOutput(handlerInput);
      }
    }
    guess.length = nSlots;
    
    // Translate colors to correct color index as in our array
    var guessEx = [];
    for(let i = 0; i < nSlots; i++)
    {
      let index = COLORS_KEYS.indexOf(guess[i]);
      // If the given value is not part of the included colors
      if(index === -1 || index >= sessionAttributes.nColors)
      {
        sessionAttributes.speechOutput = "You can only use the colors " + listColors(handlerInput);
        sessionAttributes.displayText = sessionAttributes.speechOutput + "What's your guess?";
        sessionAttributes.repeatText = sessionAttributes.speechOutput;
        return displayOutput(handlerInput);
      }
      guessEx.push(index);
    }
      
    // If using buttons then set buttons to the code
    sessionAttributes.turns[sessionAttributes.turns.length -1] = guessEx;
    
    // Determine if the player won
    let hasWon = true;
    let turn = sessionAttributes.turns[sessionAttributes.turns.length - 1];
    for(let i = 0; i < nSlots; i++)
    {
      if(turn[i] !== sessionAttributes.answer[i])
      {
        hasWon = false;
        break;
      }
    }
    
    
    var response = await processAnswer(handlerInput);
    if(sessionAttributes.usesButtons && !hasWon)
    {
      for(let i = 0; i < nSlots; i++)
      {
        let color = COLORS[guess[i]];
        setButtonColor(handlerInput, i, color, response);
      }
    }
    
    return response;
  }
};

function listColors(handlerInput)
{
  let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  let str = "";
  for (let i = 0 ; i < sessionAttributes.nColors- 1; i++)
  {
    str += COLORS_KEYS[i];
    if(i < sessionAttributes.nColors - 2)
      str += ", ";
    }
  str += " and " + COLORS_KEYS[sessionAttributes.nColors - 1] + ". ";
  return str;
}

function setButtonColor(handlerInput, buttonIndex, color, response)
{
  
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  if(response.directives === undefined)
    response.directives = [];
  let buttonId = [sessionAttributes.buttonIds[buttonIndex]];
  
  response.directives.push(createButtonDownAnimation(buttonId, color));
  response.directives.push(createButtonIdleAnimation(buttonId, color));
  response.directives.push(createButtonUpAnimation(buttonId, color));
  
}

const HelpIntent = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    var speechOutput;
    
    switch(sessionAttributes.state)
    {
      case states.START:
        speechOutput = 'The rules for this game are very simple.  Your objective is to guess the correct colors for each slot in as few turns as possible. ';
        speechOutput += ' After each guess I\'ll tell you how many colors are in the correct slot and how many are in the incorrect slot. ';
        break;
      case states.SETTINGS:
        speechOutput = 'We want to know how many slots and colors you want to play with, and if you want to use Echo buttons or just your voice to make your guesses. ';
        break;
      case states.ROLL_CALL:
        speechOutput = 'This is the roll call to set your echo buttons. ';
        break;
      case states.GAME_MODE:
        
        speechOutput = "You are playing with " + sessionAttributes.nColors + " colors. You can use the colors ";
        for (let i = 0 ; i < sessionAttributes.nColors- 1; i++)
        {
          speechOutput += COLORS_KEYS[i];
          if(i < sessionAttributes.nColors - 2)
            speechOutput += ", ";
        }
        speechOutput += " and " + COLORS_KEYS[sessionAttributes.nColors - 1] + ". ";
        if(sessionAttributes.usesButtons)
        {
          speechOutput += "Press each echo button until you have your desired color code.  Then say 'Check this code' to submit your guess. ";
        }
        else
        {
          speechOutput += "Just say your colors one after another to make your guess. ";
        }
        speechOutput += "After each guess you will be told how many colors are in the correct position and how many are in the incorrect position. ";
        if(sessionAttributes.turns.length >= 2)
          speechOutput += "For a recap of what you guessed previously you can say 'tell me what I guessed before'. ";
        
    }
    sessionAttributes.speechOutput = speechOutput;
    return displayOutput(handlerInput);
  },
};

// Okay, need to check how buttons are affected
const UnhandledIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    var speechOutput = 'I\'m sorry I didn\'t get that. ';
    sessionAttributes.speechOutput = speechOutput;
    
    return displayOutput(handlerInput);
  },
};

// Good
const SessionEndedRequest = {
  canHandle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest' ||
      (handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent' ||
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent' ||
        (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent' && 
        (sessionAttributes.state === states.START || sessionAttributes.state === states.END))));
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.speechOutput = "";
    sessionAttributes.repromptText = "Goodbye!";
    sessionAttributes.displayText = "Goodbye!";
    let response = displayOutput(handlerInput);
    response.shouldEndSession = true;
    return response;
  },
};

const PreviousIntent = {
  canHandle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PreviousIntent' && 
        sessionAttributes.state === states.GAME_MODE && sessionAttributes.turns.length > 1;
  },
  handle(handlerInput) {
    // Get the last round played
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.speechOutput = getPreviousTurn(handlerInput, sessionAttributes.turns.length - 2);
    let response = displayOutput(handlerInput);
    for(let i = 0; i < sessionAttributes.nSlots; i++)
    {
      if(sessionAttributes.usesButtons)
        setButtonColor(handlerInput, i, COLORS[COLORS_KEYS[sessionAttributes.turns[sessionAttributes.turns.length - 2][i]]], response);
      
        sessionAttributes.turns[sessionAttributes.turns.length - 1][i] = sessionAttributes.turns[sessionAttributes.turns.length - 2][i];
    }
    return response;
  }
};

const PastTurnIntent = {
  canHandle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'PastTurnIntent' && 
        sessionAttributes.state === states.GAME_MODE && sessionAttributes.turns.length > 1;
  },
  handle(handlerInput)
  {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    var turnNum = Number(handlerInput.requestEnvelope.request.intent.slots.turnNum.value);
    let turnNumIsNotValid = isNaN(turnNum) || turnNum < 1 || turnNum > sessionAttributes.turns.length - 1 || turnNum !== Math.round(turnNum);
    if(turnNumIsNotValid)
    {
      if(sessionAttributes.turns.length === 2)
        sessionAttributes.speechOutput = "If you want to know what you tried on a previous turn, the number must be 1. ";
      else
        sessionAttributes.speechOutput = "If you want to know what you tried on a previous turn, the number must be between 1 and " + (sessionAttributes.turns.length - 1)  + ". ";
      sessionAttributes.repromptText = "What's your guess? ";
      //sessionAttributes.displayOutput = sessionAttributes.speechOutput + "\n" + sessionAttributes.repromptText;
    }
    else
    {
      sessionAttributes.speechOutput = getPreviousTurn(handlerInput, turnNum - 1);
    }
    
    let response = displayOutput(handlerInput);
    if(!turnNumIsNotValid)
    {
      for(let i = 0; i < sessionAttributes.nSlots; i++)
      {
        if(sessionAttributes.usesButtons)
          setButtonColor(handlerInput, i, COLORS[COLORS_KEYS[sessionAttributes.turns[turnNum - 1][i]]], response);
        sessionAttributes.turns[sessionAttributes.turns.length - 1][i] = sessionAttributes.turns[turnNum - 1][i];
      }
    }
    return response;
  }
};

const PreviousAllIntent =
{
  canHandle(handlerInput)
  {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'PreviousAllIntent' && 
        sessionAttributes.state === states.GAME_MODE && sessionAttributes.turns.length > 1;
  },
  handle(handlerInput)
  {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    var speechOutput = "";
    // Get all text for previous turns
    for(let i = 0; i < sessionAttributes.turns.length - 1; i++)
    {
      speechOutput += getPreviousTurn(handlerInput, i);
    }
    
    sessionAttributes.speechOutput = speechOutput;
    sessionAttributes.repeatText = speechOutput;
    sessionAttributes.displayText = "What's your guess?";
    return displayOutput(handlerInput);
  }
};

function getPreviousTurn(handlerInput, turnIndex)
{
  let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  sessionAttributes.CurrentInputHandlerID = handlerInput.requestEnvelope.request.requestId; 
    
  let lastTurn = sessionAttributes.turns[turnIndex];
  let nSlots = sessionAttributes.nSlots;
  var speechOutput = "On turn " + (turnIndex + 1) + " you guessed ";
  //
  for(let i = 0; i < nSlots; i++)
  {
    speechOutput += COLORS_KEYS[lastTurn[i]];
    if(i < nSlots - 2)
      speechOutput += ", ";
    else if(i == nSlots - 2)
      speechOutput += " and ";
  }
  speechOutput += ". ";
    
  let nCorrectPos = lastTurn[nSlots];
  let nCorrectColor = lastTurn[nSlots + 1];
    
  speechOutput += nCorrectPos + " color";
  if(nCorrectPos !== 1)
    speechOutput += "s were ";
  else 
    speechOutput += " was ";
  speechOutput += "in the correct slot";
  if(nCorrectPos !== 1)
    speechOutput += "s";
  speechOutput += " and ";
    
  speechOutput += nCorrectColor + " color";
  if(nCorrectColor !== 1)
    speechOutput += "s were ";
  else 
    speechOutput += " was ";
  speechOutput += "in the incorrect slot";
  if(nCorrectColor !== 1)
    speechOutput += "s";
  speechOutput += ". ";
    
  return speechOutput;
}

const StartOverIntent = {
  canHandle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StartOverIntent' && 
        (sessionAttributes.state === states.GAME_MODE || sessionAttributes.state === states.END));
  },
  async handle(handlerInput) {
    return await startGame(handlerInput);
  },
};

// Need to check how this affects buttons
const RepeatIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.RepeatIntent');
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.speechOutput = sessionAttributes.repeatText;
    return displayOutput(handlerInput);
  },
};

// When skill is launched without an intent
const LaunchRequest = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const sessionAttributes = await handlerInput.attributesManager.getPersistentAttributes();
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    
    // Welcome message
    var speechOutput = "Welcome ";
    if(sessionAttributes.records !== undefined)
      speechOutput += "back ";
    speechOutput += 'to Color Code. ';
    sessionAttributes.state = states.START;
    var repromptText = 'Do you want to start a new game or exit?';
    sessionAttributes.speechOutput = speechOutput;
    sessionAttributes.repromptText = repromptText;
    sessionAttributes.repeatText = speechOutput;
    sessionAttributes.displayText = speechOutput + "\n" + repromptText;
    return displayOutput(handlerInput);
  },
};

function displayOutput(handlerInput, time = 30000)
{
  var sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  let speechOutput = sessionAttributes.speechOutput;
  let response = handlerInput.responseBuilder
    .speak(speechOutput + '<break time="100ms"/>' + sessionAttributes.repromptText)
    .reprompt(sessionAttributes.repromptText)
    .getResponse();
  if(supportsDisplay(handlerInput))
  {
    response.directives = handlerInput.responseBuilder.directives || [];
    response.directives.push(createDisplay(handlerInput));
  }
  if(sessionAttributes.usesButtons && (sessionAttributes.state === states.GAME_MODE || sessionAttributes.state === states.ROLL_CALL))
  {
    sessionAttributes.CurrentInputHandlerID = handlerInput.requestEnvelope.request.requestId; 
    if(response.directives === undefined)
      response.directives = [];
    response.directives.push(createButtonStartInputHandlerDirective(time));   
  }
  return response;
}

function prepareButtons(handlerInput, response)
{
  var sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  
  if(sessionAttributes.usesButtons && (sessionAttributes.state === states.GAME_MODE || sessionAttributes.state === states.ROLL_CALL))
  {
    sessionAttributes.CurrentInputHandlerID = handlerInput.requestEnvelope.request.requestId; 
    if(response.directives === undefined)
      response.directives = [];
    response.directives.push(createButtonStartInputHandlerDirective(30000));   
  }
}

function supportsDisplay(handlerInput) {
    return handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display;
}

function createDisplay(handlerInput)
{
  return {
    type: "Display.RenderTemplate",
		template: 
		{
		  type: "BodyTemplate6",
			textContent: 
			{
			  primaryText: 
			  {
				  type: "RichText",
				  text: handlerInput.attributesManager.getSessionAttributes().displayText
				}
			}
		}
	};
}

const skillBuilder = Alexa.SkillBuilders.standard();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequest,
    StartOverIntent,
    SettingsIntent,
    RollCallIntent,
    ButtonPressIntent,
    HelpIntent,
    GuessIntent,
    PreviousAllIntent,
    SubmitIntent,
    RepeatIntent,
    PastTurnIntent,
    PreviousIntent,
    SessionEndedRequest,
    UnhandledIntent
  )
  .withTableName('ColorCode')
  .withAutoCreateTable(true)
  .lambda();