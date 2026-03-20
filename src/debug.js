console.log('DEBUG SCRIPT LOADED');
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM CONTENT LOADED');
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<h1 style="color: blue">DEBUG SCRIPT IS RENDERING</h1>';
    console.log('ROOT UPDATED');
  } else {
    console.error('ROOT NOT FOUND');
  }
});
