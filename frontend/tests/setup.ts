import '@testing-library/jest-dom';

// Mock HTMLMediaElement methods in jsdom
window.HTMLMediaElement.prototype.load = () => {};
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
