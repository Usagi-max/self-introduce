const { GoogleGenAI } = require('@google/genai');

/**
 * Adapter that uses Gemini API for the prototype, but formats the response
 * to match the Claude Messages API structure for an easy swap later.
 */
const generateMockResponse = async (promptText, type, imageData = null) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      let systemPrompt = "あなたはユーザーの発言に対して面白くユーモアのある返答をするAIです。";
      if (type === 'compatibility') {
        systemPrompt = `あなたは人間関係のプロフェッショナルで、少し辛口だけど面白く的確なカリスマ相性診断士です。ユーザーたちのプロフィール（血液型、MBTI、星座、兄弟構成などの情報や、他人からの評価など）がJSON形式で送られてきます。
彼らを総合的に分析し、このグループがどんな集まりなのか、グループ全体の相性は何％か、そして誰と誰が最も相性が良い（または悪い）のかを辛口かつユーモアたっぷりに解説してください。
結果は必ず以下のJSON形式でのみ出力してください: {"theme": "〇〇な集団", "compatibility": 数値, "bestPair": "AさんとBさん", "details": "面白い解説"}。
Markdownのコードブロックは使わず、直接JSONのみを出力してください。`;
      } else if (type === 'compatibility_pair') {
        systemPrompt = `あなたは人間関係のカリスマ相性診断士です。ユーザー2人のプロフィール（血液型、MBTI、兄弟構成、他人からの評価など）がJSON形式で送られてきます。
この2人の相性だけにフォーカスして、どういうシナジーがあるか、あるいはどんなトラブルに注意が必要かを辛口かつユーモアたっぷりに解説してください。
結果は必ず以下のJSON形式でのみ出力してください: {"theme": "2人のテーマ（〇〇なコンビなど）", "compatibility": 数値, "details": "面白い解説"}。
Markdownのコードブロックは使わず、直接JSONのみを出力してください。`;
      } else if (type === 'compatibility_additional') {
        systemPrompt = `あなたは辛口でユーモアのある人間関係アナリストです。ユーザーから、メンバー全員の「プロフィールデータ」と「新しいお題（例：無人島に漂流したら？）」が送られてきます。
彼らの性格を分析した上で、このグループ全体がお題にどう立ち向かうか、どのような役割分担になるか、誰がどうなるかなどを面白おかしく（マークダウンの太字 **テキスト** などを活用して）解説してください。出力はJSONではなく通常の自由な文章（改行やMarkdownあり）で出力してください。`;
      } else if (type === 'face_analysis') {
        systemPrompt = `あなたは「人相学を極め、採用・育成・配置・マネジメントを長年行ってきたプロフェッショナルな人相診断士」です。少しおせっかいですが、本質を突きます。
以下の前提を必ず守るようにしてください：
・占い的断定や性格の決めつけはしない
・善悪や優劣ではなく「向き・不向き・事故予防」の視点で語る
・顔は「無意識に選び続けてきた行動・態度の履歴」として読む

また、ユーザーは「${promptText}」というお題の顔のつもりで写真を送ってきています。
あなたは、お題の事は一切無視してフラットにプロファイル診断を行い、その後で別途、お題についての痛烈なツッコミや「〇〇を履き違えてる」といった評価を行ってください。

結果は必ず以下のJSON形式でのみ出力してください。Markdownのコードブロックは使わず、直接JSONのみを出力してください。
{
  "diagnosis": "〇〇な顔",
  "professional_comment": "【無意識の選択傾向】... 【採用面接での見極めポイント】...",
  "roast_comment": "【お題「${promptText}」へのツッコミ】... 全然〇〇じゃないですよ！",
  "is_war_criminal": false // お題から激しく逸脱・履き違えて失敗している場合はtrueにする
}`;
      } else if (type === 'face_additional') {
        systemPrompt = `あなたは辛口でユーモアのある人間関係アナリストです。ユーザーから、メンバーの「これまでの顔診断結果」と「新しいお題（例：RPGのパーティを組むなら？）」が送られてきます。
診断結果を踏まえて、このメンバーがお題にどう立ち向かうか、どのような役割分担になるかを面白おかしく解説してください。出力はJSONではなく通常の自由な文章（改行あり）で出力してください。`;
      }

      let contents;
      if (type === 'face_analysis' && imageData) {
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        const mimeType = imageData.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
        contents = [
          promptText || "顔写真",
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          }
        ];
      } else {
        contents = promptText || "（入力がありません）";
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: { systemInstruction: systemPrompt }
      });

      const text = response.text || "";

      return {
        id: `msg_gemini_${Math.random().toString(36).substr(2, 9)}`,
        type: 'message',
        role: 'assistant',
        model: 'gemini-2.5-flash-mapped',
        content: [{ type: 'text', text: text }],
        usage: { input_tokens: 0, output_tokens: 0 }
      };
    } catch (e) {
      console.error("Gemini API Error details:", e);
      return {
        id: `msg_error_${Math.random().toString(36).substr(2, 9)}`,
        type: 'message',
        role: 'assistant',
        model: 'claude-3-haiku-20240307',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              diagnosis: '通信・APIエラーの顔',
              comment: `Geminiとの通信でエラーが発生しました。詳細: ${e.message}`,
              theme: '通信エラー',
              compatibility: 0,
              bestPair: '-',
              details: `Geminiとの通信でエラーが発生しました。詳細: ${e.message}`
            })
          }
        ],
        usage: { input_tokens: 0, output_tokens: 0 }
      };
    }
  }

  // Fallback Mock (If no API key or error)
  if (type === 'compatibility' || type === 'compatibility_pair') {
    return {
      id: `msg_mock_${Math.random().toString(36).substr(2, 9)}`,
      type: 'message',
      role: 'assistant',
      model: 'mock',
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            theme: "API未設定のコンビ",
            compatibility: 50,
            bestPair: "不明",
            details: "APIキーが設定されていません。モックの相性診断結果です！"
          })
        }
      ],
      usage: { input_tokens: 0, output_tokens: 0 }
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
