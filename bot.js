/**
 * Daily Story TOEIC Delivery Bot Script (with AI Story Generator)
 * 
 * Gemini API (無料枠) を活用して、毎朝AIが新しい面白い英文ストーリー、
 * TOEIC頻出単語、クイズを自動生成してLINE/Discord/メール等に自動配信します。
 */

const fs = require('fs');
const path = require('path');

// CONFIGURATION (環境変数から取得)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:8080';

// Gemini AI で毎朝オリジナルのTOEICストーリーを自動生成する関数
async function generateStoryWithAI() {
  console.log('[AI] Generating a new daily TOEIC story using Gemini AI...');

  // 多様性を高めるためのトピックとフォーマットのランダムリスト
  const genres = [
    "Business & Office Drama / Comedy",
    "Travel & Airport Incidents",
    "Surprising Science & Nature Trivia",
    "Customer Support & Unusual Complaints",
    "Hotel, Restaurant & Food Culture",
    "Tech Inventions & Quirky Gadgets",
    "Environmental & Eco-friendly Initiatives",
    "Historical Anecdotes & Hidden Mysteries",
    "Remote Work & Freelance Life",
    "World Cultures & Fascinating Traditions",
    "Art, Music & Entertainment Industry",
    "Sports, Health & Unusual Hobbies",
    "Shopping, E-commerce & Logistics"
  ];

  const formats = [
    "Short Narrative Story",
    "Business Email or Internal Memo",
    "News Article / Newspaper Column",
    "Official Announcement or Public Notice",
    "Customer Review / Product Testimonial",
    "Blog Post or Travel Log"
  ];

  const randomGenre = genres[Math.floor(Math.random() * genres.length)];
  const randomFormat = formats[Math.floor(Math.random() * formats.length)];

  console.log(`[AI Target] Genre: ${randomGenre} | Format: ${randomFormat}`);
  
  const prompt = `You are a professional TOEIC test preparation expert and creative writer.
Generate a highly engaging, unique reading passage suitable for TOEIC 600-800 level learners.

CRITICAL INSTRUCTIONS FOR DIVERSITY:
- Genre/Topic: ${randomGenre}
- Format: ${randomFormat}
- Word count: 80-120 words
- Style: Ensure the vocabulary, sentence structure, and tone match the specified format (e.g., formal business tone for emails/announcements, engaging/lively tone for stories/blogs).
- Avoid repetitive tropes or cliché scenarios. Be creative, distinct, and fresh!

Respond strictly in valid JSON format with the following keys:
{
  "title": "Title with Emoji (reflecting the topic)",
  "genre": "${randomGenre} (${randomFormat})",
  "level": "TOEIC 600-800",
  "originalText": "The complete reading text...",
  "slashedText": "The text split with slash marks / (single / for short clause breaks, double // for sentence/paragraph breaks) for chunk reading...",
  "japaneseTranslation": "自然で読みやすい日本語訳...",
  "words": [
    {
      "word": "target_word_1",
      "phonetic": "/pronunciation/",
      "partOfSpeech": "名詞/動詞/形容詞/副詞",
      "meaning": "日本語の意味",
      "toeicLevel": "600点〜800点レベル",
      "toeicNote": "TOEICでの具体的な出題文脈や関連フレーズ・注意点の解説"
    }
  ],
  "quiz": {
    "question": "English comprehension question testing understanding of the passage?",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "answer": "A",
    "explanation": "日本語での詳細な正解理由の解説"
  }
}`;

  // 最新モデル gemini-flash-latest を使用
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const generatedJsonStr = data.candidates[0].content.parts[0].text;
  return JSON.parse(generatedJsonStr);
}

async function main() {
  try {
    let story;

    // GEMINI_API_KEY が設定されていれば AI で毎朝自動作成
    if (GEMINI_API_KEY) {
      story = await generateStoryWithAI();
      
      // 生成されたストーリーを stories.json に自動追記・更新
      const storiesPath = path.join(__dirname, 'stories.json');
      let stories = [];
      if (fs.existsSync(storiesPath)) {
        stories = JSON.parse(fs.readFileSync(storiesPath, 'utf-8'));
      }
      story.id = stories.length + 1;
      story.day = stories.length + 1;
      stories.push(story);
      fs.writeFileSync(storiesPath, JSON.stringify(stories, null, 2), 'utf-8');
      console.log(`[AI SUCCESS] Generated new story Day ${story.day}: "${story.title}"`);
    } else {
      // API Key がない場合は事前保存データから選出
      console.log('[INFO] GEMINI_API_KEY not found. Falling back to predefined stories.json dataset.');
      const storiesPath = path.join(__dirname, 'stories.json');
      const stories = JSON.parse(fs.readFileSync(storiesPath, 'utf-8'));
      const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
      story = stories[dayOfYear % stories.length];
    }

    // メッセージの構築
    const wordsList = story.words.map(w => `・**${w.word}** (${w.partOfSpeech}): ${w.meaning}\n  💡 *${w.toeicNote}*`).join('\n');
    
    const messageContent = `📖 **【今日の日刊TOEIC AIストーリー Day ${story.day || 1}】**
**テーマ:** ${story.title} (${story.genre})

${story.originalText}

--------------------------------
💡 **今日ピッキングされたTOEIC重要単語**
${wordsList}

❓ **本日の1分クイズ**
${story.quiz.question}

👇 **スラッシュ読み・音声再生・詳細解説はこちら (Webアプリ)**
${WEB_APP_URL}`;

    // Discord 送信
    if (DISCORD_WEBHOOK_URL) {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent })
      });
      console.log('[SUCCESS] Delivered to Discord!');
    }

    // Telegram 送信
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: messageContent, parse_mode: 'Markdown' })
      });
      console.log('[SUCCESS] Delivered to Telegram!');
    }

    if (!DISCORD_WEBHOOK_URL && (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID)) {
      console.log('\n================== [AI生成ストーリーのリアルタイムプレビュー] ==================');
      console.log(messageContent);
      console.log('=================================================================================\n');
    }

  } catch (err) {
    console.error('[ERROR] Task failed:', err);
  }
}

main();
