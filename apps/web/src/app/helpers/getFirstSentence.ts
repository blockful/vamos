// Helper function to get first sentence from error message
export const getFirstSentence = (message: string) => {
    // Split by period, exclamation, or question mark followed by space
    const match = message.match(/^[^.!?]+[.!?]/);
    return match ? match[0] : message.split(".")[0] + ".";
};