// В scripts.js
async function speakText() {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        document.getElementById('output').innerText
      );
      speechSynthesis.speak(utterance);
    }
  }
  
  function downloadAsFile() {
    const text = document.getElementById('output').innerText;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-content.txt';
    a.click();
  }