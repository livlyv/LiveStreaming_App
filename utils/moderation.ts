// Profanity and moderation utilities
const englishProfanity = [
  "fuck", "shit", "ass", "bitch", "damn", "hell", "crap", "bastard",
  "dick", "pussy", "cock", "cunt", "whore", "slut", "fag", "nigger",
  "retard", "idiot", "stupid", "dumb", "moron", "asshole", "jerk",
];

const hindiProfanity = [
  "bhosdike", "madarchod", "behenchod", "chutiya", "gandu", "randi",
  "bhosdi", "lauda", "lund", "chut", "gaand", "harami", "kamina",
  "kutta", "kutti", "saala", "saali", "bhadwa", "bhadwi", "hijra",
];

const phonePattern = /\b\d{10}\b|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

export const checkForProfanity = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  
  // Check for English profanity
  for (const word of englishProfanity) {
    if (lowerText.includes(word)) {
      return true;
    }
  }
  
  // Check for Hindi profanity
  for (const word of hindiProfanity) {
    if (lowerText.includes(word)) {
      return true;
    }
  }
  
  // Check for personal information
  if (phonePattern.test(text) || emailPattern.test(text)) {
    return true;
  }
  
  return false;
};

export const filterMessage = (text: string): string => {
  let filtered = text;
  
  // Replace profanity with asterisks
  for (const word of [...englishProfanity, ...hindiProfanity]) {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  }
  
  // Remove phone numbers and emails
  filtered = filtered.replace(phonePattern, '[REMOVED]');
  filtered = filtered.replace(emailPattern, '[REMOVED]');
  
  return filtered;
};