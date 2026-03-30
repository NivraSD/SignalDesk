const fs = require('fs');

const content = fs.readFileSync('AISentimentMonitor.js', 'utf8');

// Fix the button onClick
const updatedContent = content.replace(
  'onClick={() => analyzeMention(mention.id)}',
  `onClick={() => {
    console.log('Analyze button clicked for:', mention.id);
    analyzeMention(mention.id);
  }}`
);

// If the above doesn't match, try this pattern
const updatedContent2 = updatedContent.includes('Analyze button clicked') ? updatedContent : 
  updatedContent.replace(
    '<button\n                          onClick={() => analyzeMention(mention.id)}',
    `<button
                          onClick={() => {
                            console.log('Analyze button clicked for:', mention.id);
                            analyzeMention(mention.id);
                          }}`
  );

fs.writeFileSync('AISentimentMonitor.js', updatedContent2);
console.log('Added button click logging');
