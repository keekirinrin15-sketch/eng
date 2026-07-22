// App State
let storiesData = [];
let currentStory = null;
let isSlashMode = false;
let isTranslationVisible = false;
let startTime = null;
let savedVocab = JSON.parse(localStorage.getItem('toeic_saved_vocab') || '[]');
let userStats = JSON.parse(localStorage.getItem('toeic_user_stats') || '{"streak": 1, "totalWords": 0, "lastReadDate": ""}');

// DOM Elements
const streakCountEl = document.getElementById('streakCount');
const totalWordsReadEl = document.getElementById('totalWordsRead');
const savedVocabCountEl = document.getElementById('savedVocabCount');
const vocabCountBadgeEl = document.getElementById('vocabCountBadge');

const storyDayEl = document.getElementById('storyDay');
const storyLevelEl = document.getElementById('storyLevel');
const storyGenreEl = document.getElementById('storyGenre');
const storyTitleEl = document.getElementById('storyTitle');

const storyTextContainer = document.getElementById('storyTextContainer');
const translationContainer = document.getElementById('translationContainer');
const japaneseTextEl = document.getElementById('japaneseText');

const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const toggleSlashBtn = document.getElementById('toggleSlashBtn');
const toggleTranslationBtn = document.getElementById('toggleTranslationBtn');

const finishReadBtn = document.getElementById('finishReadBtn');
const wpmTimerTextEl = document.getElementById('wpmTimerText');
const wpmResultTextEl = document.getElementById('wpmResultText');

const quizQuestionEl = document.getElementById('quizQuestion');
const quizOptionsEl = document.getElementById('quizOptions');
const quizFeedbackEl = document.getElementById('quizFeedback');

const archiveGridEl = document.getElementById('archiveGrid');
const vocabListEl = document.getElementById('vocabList');

// Modal Elements
const wordModalOverlay = document.getElementById('wordModalOverlay');
const closeWordModalBtn = document.getElementById('closeWordModal');
const modalWordEl = document.getElementById('modalWord');
const modalPhoneticEl = document.getElementById('modalPhonetic');
const modalPartOfSpeechEl = document.getElementById('modalPartOfSpeech');
const modalToeicLevelEl = document.getElementById('modalToeicLevel');
const modalMeaningEl = document.getElementById('modalMeaning');
const modalToeicNoteEl = document.getElementById('modalToeicNote');
const bookmarkBtn = document.getElementById('bookmarkBtn');
const bookmarkBtnText = document.getElementById('bookmarkBtnText');
const speechWordBtn = document.getElementById('speechWordBtn');

let activeWordObj = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  updateUserStatsUI();
  setupTabEvents();
  setupControlEvents();
  setupModalEvents();

  try {
    const res = await fetch('stories.json');
    storiesData = await res.json();
    if (storiesData.length > 0) {
      loadStory(storiesData[0]); // Load first day by default
      renderArchive();
    }
  } catch (err) {
    console.error('Failed to load stories dataset:', err);
    storyTitleEl.textContent = 'データの読み込みに失敗しました';
  }
});

// Update Header User Stats
function updateUserStatsUI() {
  // Check streak
  const todayStr = new Date().toDateString();
  if (userStats.lastReadDate) {
    const lastDate = new Date(userStats.lastReadDate);
    const diffDays = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) {
      userStats.streak = 1; // Reset streak if missed a day
    }
  }
  
  streakCountEl.textContent = userStats.streak;
  totalWordsReadEl.textContent = userStats.totalWords;
  savedVocabCountEl.textContent = savedVocab.length;
  vocabCountBadgeEl.textContent = `${savedVocab.length} 単語`;
  localStorage.setItem('toeic_user_stats', JSON.stringify(userStats));
}

// Setup Nav Tabs
function setupTabEvents() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

      e.target.classList.add('active');
      const tabId = `${e.target.dataset.tab}Section`;
      const targetSection = document.getElementById(tabId);
      if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('active');
      }

      if (e.target.dataset.tab === 'vocab') {
        renderVocabList();
      }
    });
  });
}

// Load Selected Story
function loadStory(story) {
  currentStory = story;
  startTime = new Date(); // Start WPM timer

  storyDayEl.textContent = `Day ${story.day}`;
  storyLevelEl.textContent = story.level;
  storyGenreEl.textContent = story.genre;
  storyTitleEl.textContent = story.title;
  japaneseTextEl.textContent = story.japaneseTranslation;

  // Reset WPM UI
  wpmTimerTextEl.classList.remove('hidden');
  wpmResultTextEl.classList.add('hidden');

  renderStoryText();
  renderQuiz();

  // Reset controls
  isTranslationVisible = false;
  translationContainer.classList.add('hidden');
  toggleTranslationBtn.classList.remove('active');
}

// Render Story Text (Slash & Target Word Highlights)
function renderStoryText() {
  storyTextContainer.innerHTML = '';
  const textToUse = isSlashMode ? currentStory.slashedText : currentStory.originalText;
  
  // Break into tokens / words
  const targetWordsMap = {};
  currentStory.words.forEach(w => {
    targetWordsMap[w.word.toLowerCase()] = w;
  });

  const tokens = textToUse.split(' ');
  tokens.forEach(token => {
    if (token === '/' || token === '//') {
      const slashSpan = document.createElement('span');
      slashSpan.className = 'slash-mark';
      slashSpan.textContent = token === '//' ? ' ❚❚ ' : ' ❚ ';
      storyTextContainer.appendChild(slashSpan);
      return;
    }

    const cleanWord = token.replace(/[^a-zA-Z]/g, '').toLowerCase();
    const wordSpan = document.createElement('span');
    wordSpan.className = 'story-word';
    wordSpan.textContent = token + ' ';

    if (targetWordsMap[cleanWord]) {
      wordSpan.classList.add('target-word');
      wordSpan.addEventListener('click', () => {
        openWordModal(targetWordsMap[cleanWord]);
      });
    }

    storyTextContainer.appendChild(wordSpan);
  });
}

// Setup Control Button Handlers
function setupControlEvents() {
  // Audio Speech (Text-to-Speech)
  toggleAudioBtn.addEventListener('click', () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop current audio
      const utterance = new SpeechSynthesisUtterance(currentStory.originalText);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Slightly friendly pace for learners
      window.speechSynthesis.speak(utterance);

      toggleAudioBtn.classList.add('active');
      utterance.onend = () => toggleAudioBtn.classList.remove('active');
    } else {
      alert('お使いのブラウザは音声再生に対応していません');
    }
  });

  // Slash Toggle
  toggleSlashBtn.addEventListener('click', () => {
    isSlashMode = !isSlashMode;
    toggleSlashBtn.classList.toggle('active', isSlashMode);
    toggleSlashBtn.querySelector('.btn-text').textContent = isSlashMode ? 'スラッシュ: ON' : 'スラッシュ: OFF';
    renderStoryText();
  });

  // Translation Toggle
  toggleTranslationBtn.addEventListener('click', () => {
    isTranslationVisible = !isTranslationVisible;
    toggleTranslationBtn.classList.toggle('active', isTranslationVisible);
    translationContainer.classList.toggle('hidden', !isTranslationVisible);
  });

  // WPM Finish Button
  finishReadBtn.addEventListener('click', () => {
    if (!startTime) return;
    const endTime = new Date();
    const durationInMinutes = (endTime - startTime) / 60000;
    const wordCount = currentStory.originalText.split(' ').length;
    const wpm = Math.round(wordCount / durationInMinutes);

    wpmTimerTextEl.classList.add('hidden');
    wpmResultTextEl.classList.remove('hidden');
    wpmResultTextEl.textContent = `⏱️ WPM: ${wpm} (1分間あたりの読破単語数)`;

    // Update stats
    userStats.totalWords += wordCount;
    const todayStr = new Date().toDateString();
    if (userStats.lastReadDate !== todayStr) {
      userStats.streak += 1;
      userStats.lastReadDate = todayStr;
    }
    updateUserStatsUI();
  });
}

// Render Quiz
function renderQuiz() {
  const quiz = currentStory.quiz;
  quizQuestionEl.textContent = quiz.question;
  quizOptionsEl.innerHTML = '';
  quizFeedbackEl.classList.add('hidden');

  quiz.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.quiz-opt-btn').forEach(b => b.disabled = true);
      const selectedOptionLetter = opt.charAt(0);
      if (selectedOptionLetter === quiz.answer) {
        btn.classList.add('correct');
        quizFeedbackEl.textContent = `🎉 正解！ ${quiz.explanation}`;
      } else {
        btn.classList.add('wrong');
        quizFeedbackEl.textContent = `❌ 残念！正解は (${quiz.answer}) です。 ${quiz.explanation}`;
      }
      quizFeedbackEl.classList.remove('hidden');
    });
    quizOptionsEl.appendChild(btn);
  });
}

// Word Popover Modal
function openWordModal(wordObj) {
  activeWordObj = wordObj;
  modalWordEl.textContent = wordObj.word;
  modalPhoneticEl.textContent = wordObj.phonetic;
  modalPartOfSpeechEl.textContent = wordObj.partOfSpeech;
  modalToeicLevelEl.textContent = wordObj.toeicLevel;
  modalMeaningEl.textContent = wordObj.meaning;
  modalToeicNoteEl.textContent = wordObj.toeicNote;

  // Check if saved
  const isSaved = savedVocab.some(item => item.word === wordObj.word);
  updateBookmarkBtnUI(isSaved);

  wordModalOverlay.classList.remove('hidden');
}

function setupModalEvents() {
  closeWordModalBtn.addEventListener('click', () => {
    wordModalOverlay.classList.add('hidden');
  });

  wordModalOverlay.addEventListener('click', (e) => {
    if (e.target === wordModalOverlay) {
      wordModalOverlay.classList.add('hidden');
    }
  });

  // Single word audio TTS
  speechWordBtn.addEventListener('click', () => {
    if (activeWordObj && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(activeWordObj.word);
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    }
  });

  // Bookmark toggle
  bookmarkBtn.addEventListener('click', () => {
    if (!activeWordObj) return;
    const existingIndex = savedVocab.findIndex(item => item.word === activeWordObj.word);
    
    if (existingIndex >= 0) {
      savedVocab.splice(existingIndex, 1);
      updateBookmarkBtnUI(false);
    } else {
      savedVocab.push(activeWordObj);
      updateBookmarkBtnUI(true);
    }

    localStorage.setItem('toeic_saved_vocab', JSON.stringify(savedVocab));
    updateUserStatsUI();
  });
}

function updateBookmarkBtnUI(isSaved) {
  bookmarkBtn.classList.toggle('saved', isSaved);
  bookmarkBtnText.textContent = isSaved ? 'マイ単語帳から削除' : 'マイ単語帳に保存';
}

// Render Back Number (Archive)
function renderArchive() {
  archiveGridEl.innerHTML = '';
  storiesData.forEach(story => {
    const card = document.createElement('div');
    card.className = 'archive-card';
    card.innerHTML = `
      <div class="archive-info">
        <h4>Day ${story.day}: ${story.title}</h4>
        <p>${story.genre} • ${story.level}</p>
      </div>
      <span style="color: var(--primary); font-size: 1.2rem;">➔</span>
    `;
    card.addEventListener('click', () => {
      loadStory(story);
      document.querySelector('[data-tab="today"]').click(); // Switch to today tab
    });
    archiveGridEl.appendChild(card);
  });
}

// Render Saved Vocabulary Notebook
function renderVocabList() {
  vocabListEl.innerHTML = '';
  if (savedVocab.length === 0) {
    vocabListEl.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">まだ保存された単語はありません。ストーリー内のハイライト単語をタップして保存してみましょう！</p>';
    return;
  }

  savedVocab.forEach(item => {
    const card = document.createElement('div');
    card.className = 'vocab-card';
    card.innerHTML = `
      <div class="vocab-card-header">
        <span class="vocab-word">${item.word} <small style="font-size:0.75rem; color:var(--text-muted);">${item.phonetic}</small></span>
        <span class="pos-badge">${item.partOfSpeech}</span>
      </div>
      <div class="vocab-meaning">${item.meaning}</div>
      <div class="vocab-note">💡 ${item.toeicNote}</div>
    `;
    vocabListEl.appendChild(card);
  });
}
