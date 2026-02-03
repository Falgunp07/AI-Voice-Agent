// Speech Recognition API wrapper
export const startListening = (onResult, onError) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError('Speech Recognition not supported in this browser');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    console.log('Listening...');
  };

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    onResult(transcript);
  };

  recognition.onerror = (event) => {
    onError(event.error);
  };

  recognition.start();

  return recognition;
};

// Text to Speech API wrapper
export const speakText = (text, onEnd = null) => {
  const synthesis = window.speechSynthesis;

  if (!synthesis) {
    console.error('Text to Speech not supported');
    return;
  }

  // Cancel any ongoing speech
  synthesis.cancel();

  // Clean up text for better speech pronunciation
  let cleanText = text
    // Replace currency symbols and formatting
    .replace(/Rs\./g, 'Rupees')
    .replace(/₹/g, 'Rupees')
    .replace(/\/month/g, 'per month')
    .replace(/\//g, 'per')
    // Remove emojis
    .replace(/📍/g, '')
    .replace(/💰/g, '')
    .replace(/🛏️/g, '')
    .replace(/🚿/g, '')
    .replace(/\n/g, '. ') // Convert newlines to periods
    // Clean up spacing
    .replace(/\s+/g, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Add event listener for when speech ends
  utterance.onend = () => {
    console.log('Speech finished');
    if (onEnd) onEnd();
  };

  utterance.onerror = (event) => {
    console.error('Speech error:', event.error);
    if (onEnd) onEnd();
  };

  synthesis.speak(utterance);
};

// Stop speech
export const stopSpeech = () => {
  window.speechSynthesis.cancel();
};
