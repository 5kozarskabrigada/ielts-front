/**
 * Strip HTML tags from text and decode HTML entities
 * @param {string} html - HTML string to clean
 * @returns {string} - Plain text without HTML tags
 */
export const stripHtmlTags = (html) => {
  if (!html) return '';
  
  // Create a temporary div element to use browser's HTML parser
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Get text content (automatically decodes HTML entities)
  let text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Clean up extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};

/**
 * Strip HTML tags using regex (for backend or when DOM is not available)
 * @param {string} html - HTML string to clean
 * @returns {string} - Plain text without HTML tags
 */
export const stripHtmlTagsRegex = (html) => {
  if (!html) return '';
  
  let text = String(html);
  
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  
  // Clean up extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};
