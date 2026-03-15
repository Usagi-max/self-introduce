const { GoogleGenAI } = require('@google/genai');

/**
 * Adapter that uses Gemini API for the prototype, but formats the response
 * to match the Claude Messages API structure for an easy swap later.
 */
const generateMockResponse = async (promptText, type) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      let systemPrompt = "あなたはユーザーの発言に対して面白くユーモアのある返答をするAIです。";
      if (type === 'age_guess') {
        systemPrompt = "あなたはユーザーの送信したエピソードから、その人の精神年齢を推定して出力するAIです。結果は必ず以下のJSON形式でのみ出力してください: {\"age\": 数値, \"comment\": \"面白いコメント\"}。Markdownのコードブロックは使わず、直接JSONのみを出力してください。";
      } else if (type === 'face_analysis') {
        systemPrompt = `あなたは辛口でユーモアのある人相鑑定AIです。ユーザーは「${promptText}」というお題に沿った顔写真（今回はシミュレーションのためテキストのみ）を送ってきました。ユーザーの意図を面白く裏切るような、あるいは絶妙にズレた人相診断結果を生成してください。結果は必ず以下のJSON形式でのみ出力してください: {"diagnosis": "〇〇な顔", "comment": "面白いコメント"}。Markdownのコードブロックは使わず、直接JSONのみを出力してください。`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: promptText || "（エピソードの入力がありません）",
        config: { systemInstruction: systemPrompt }
      });

      const text = response.text || "";

      // Format as Claude API Messages response
      return {
        id: `msg_gemini_${Math.random().toString(36).substr(2, 9)}`,
        type: 'message',
        role: 'assistant',
        model: 'gemini-1.5-flash-mapped-to-claude',
        content: [{ type: 'text', text: text }],
        usage: { input_tokens: 0, output_tokens: 0 } // Gemini metrics mapped
      };
    } catch (e) {
      console.error("Gemini API Error:", e);
      // Fallback to mock on error
    }
  }

  // Fallback Mock (If no API key or error)
  if (type === 'age_guess') {
    const ages = [12, 18, 24, 35, 42, 55, 80];
    const randomAge = ages[Math.floor(Math.random() * ages.length)];
    
    return {
      id: `msg_mock_${Math.random().toString(36).substr(2, 9)}`,
      type: 'message',
      role: 'assistant',
      model: 'claude-3-haiku-20240307',
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            age: randomAge,
            comment: `そのエピソードは完全に${randomAge}歳の方のものですね！若気の至りというより、もうベテランの域です。`
          })
        }
      ],
      usage: { input_tokens: 45, output_tokens: 32 }
    };
  }

  if (type === 'face_analysis') {
    return {
      id: `msg_mock_${Math.random().toString(36).substr(2, 9)}`,
      type: 'message',
      role: 'assistant',
      model: 'claude-3-haiku-20240307',
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            diagnosis: 'API未設定の顔',
            comment: `Gemini APIキーが設定されていません。「${promptText}」の顔を激写したつもりかもしれませんが、ただのモック回答です！`
          })
        }
      ],
      usage: { input_tokens: 20, output_tokens: 20 }
    };
  }

  return {
    id: `msg_mock_${Math.random().toString(36).substr(2, 9)}`,
    type: 'message',
    role: 'assistant',
    model: 'claude-3-haiku-20240307',
    content: [{ type: 'text', text: "AIからのモック回答です（APIキー未設定）。" }],
    usage: { input_tokens: 10, output_tokens: 15 }
  };
};

module.exports = {
  generateMockResponse
};
