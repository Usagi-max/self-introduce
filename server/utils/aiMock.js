const { GoogleGenAI } = require('@google/genai');

/**
 * Adapter that uses Gemini API for the prototype, but formats the response
 * to match the Claude Messages API structure for an easy swap later.
 */
const generateMockResponse = async (promptText, type, imageData = null, persona = 'michael') => {
  const rawKey = process.env.GEMINI_API_KEY || "";
  // カンマ区切りで複数のAPIキーが設定されていた場合、配列にする
  const apiKeys = rawKey.split(',').map(k => k.trim()).filter(k => k.length > 0);
  
  if (apiKeys.length > 0) {
    let attempts = 0;
    let responseText = null;
    let lastError = null;
    let currentKeyIndex = Math.floor(Math.random() * apiKeys.length); // Start randomly

    let parsedRelationship = '';
    if (type === 'compatibility_pair') {
      try {
        const parsed = JSON.parse(promptText);
        if (parsed.relationship && parsed.relationship !== '指定なし (ランダム)') {
          parsedRelationship = `\nさらに、この2人の関係性は「${parsed.relationship}」であることを前提に診断してください。「上司と部下」や「親子」などの役割がある関係の場合、どちらがどちらの役割に向いているか（逆転パターンも含め）想像して診断結果に含めてください。`;
        }
      } catch (e) {}
    }

    let systemPrompt = "あなたはユーザーの発言に対して面白くユーモアのある返答をするAIです。";
    if (type === 'compatibility') {
      systemPrompt = `あなたは人間関係のプロフェッショナルで、少し辛口だけど面白く的確なカリスマ相性診断士です。ユーザーたちのプロフィール（血液型、MBTI、星座、兄弟構成などの情報や、他人からの評価など）がJSON形式で送られてきます。
彼らを総合的に分析し、このグループがどんな集まりなのか、グループ全体の相性は何％か、そして誰と誰が最も相性が良い（または悪い）のかを辛口かつユーモアたっぷりに解説してください。
結果の詳細は**小見出し**（Markdownの### など）を使って、読みやすく長文を構成してください。
結果は必ず以下のJSON形式でのみ出力してください: {"theme": "〇〇な集団", "compatibility": 数値, "bestPair": "AさんとBさん", "details": "面白い解説"}。
Markdownのコードブロックは使わず、直接JSONのみを出力してください。`;
    } else if (type === 'compatibility_pair') {
      systemPrompt = `あなたは人間関係のカリスマ相性診断士です。ユーザー2人のプロフィール（血液型、MBTI、兄弟構成、他人からの評価など）がJSON形式で送られてきます。${parsedRelationship}
この2人の相性だけにフォーカスして、どういうシナジーがあるか、あるいはどんなトラブルに注意が必要かを辛口かつユーモアたっぷりに解説してください。
結果の詳細は**小見出し**（Markdownの### など）を使って、読みやすく長文を構成してください。
結果は必ず以下のJSON形式でのみ出力してください: {"theme": "2人のテーマ（〇〇なコンビなど）", "compatibility": 数値, "details": "面白い解説"}。
Markdownのコードブロックは使わず、直接JSONのみを出力してください。`;
    } else if (type === 'compatibility_additional') {
      systemPrompt = `あなたは辛口でユーモアのある人間関係アナリストです。ユーザーから、メンバー全員の「プロフィールデータ」と「新しいお題（例：無人島に漂流したら？）」が送られてきます。
彼らの性格を分析した上で、このグループ全体がお題にどう立ち向かうか、どのような役割分担になるか、誰がどうなるかなどを面白おかしく解説してください。
出力はJSONではなく通常の自由な文章（改行やMarkdownあり）ですが、必ず**小見出し（### など）**を付けて読みやすい構成にしてください。`;
    } else if (type === 'face_analysis') {
      systemPrompt = `あなたは「人相学を極め、採用・育成・配置・マネジメントを長年行ってきたプロフェッショナルな人相診断士」です。少しおせっかいですが、本質を突きます。
以下の前提を必ず守るようにしてください：
・占い的断定や性格の決めつけはしない
・善悪や優劣ではなく「向き・不向き・事故予防」の視点で語る
・その場の「表情」に惑わされず、顔の筋肉の発達具合や骨格を注意深く見極めて、本気でプロの診断を行ってください。
・顔は「無意識に選び続けてきた行動・態度の履歴」として読み解いてください。

また、ユーザーは「${promptText}」というお題の顔のつもりで写真を送ってきています。

【出力形式の厳守】
結果は必ず以下のJSON形式でのみ出力してください。JSONブロック以外のテキストは一切含めないでください。
"professional_comment" や "roast_comment" の長文は、改行記号(\\n)を使って適切に段落を分け、**適宜小見出し（### など）**を含めてください。

【各項目の仕様】
- diagnosis: キャッチーな診断名
- professional_comment: 真面目で専門的な分析
- roast_comment: お題に対するツッコミ（キャラクター人格適用）
- is_war_criminal: ブール値（true または false）。画像に写っている表情が、「${promptText}」というお題から明らかに逸脱していて、全く見当違いな顔（つまり「戦犯」）である場合は true を指定してください。少しでもお題に近い顔をしていれば false を指定してください。厳しく判定してください。

{
  "diagnosis": "〇〇な顔",
  "professional_comment": "### 総評\\n... \\n### 顔の部位別無意識の選択傾向\\n... \\n### どういう人・集団にいると生き生きするか\\n... \\n### 周りの人から誤解されがちなこと\\n...",
  "roast_comment": "### お題「${promptText}」へのツッコミ\\n...",
  "is_war_criminal": false
}`;
    } else if (type === 'face_additional') {
      systemPrompt = `あなたは辛口でユーモアのある人間関係アナリストです。ユーザーから、メンバーの「これまでの顔診断結果」と「新しいお題（例：RPGのパーティを組むなら？）」が送られてきます。
診断結果を踏まえて、このメンバーがお題にどう立ち向かうか、どのような役割分担になるかを面白おかしく解説してください。
出力はJSONではなく通常の自由な文章（改行あり）ですが、必ず**小見出し（### など）**を付けて読みやすい構成にしてください。`;
    }

    // Persona Injection
    let personaInstruction = "";
    if (persona === 'michael') {
      personaInstruction = "あなたはハリウッド映画のアメリカンバディのような口調（例：「おうおう、なかなかパンチの効いた...だぜ！」「〜じゃねえか」「最高だな」等）で、ポジティブかつフランクでワイルドに話してください。";
    } else if (persona === 'butler') {
      personaInstruction = "あなたは「慇懃無礼な毒舌執事（セバスチャン）」です。言葉遣いは極めて丁寧（「お嬢様、坊ちゃま」「誠に恐縮ですが」「〜でございますね」等）ですが、内容は非常に辛口で、静かに相手を追い詰めるような容赦のない分析をしてください。さらに、文末には時折あなたの心情が漏れ出るようなカッコ書き（例：「（深い溜息）」「（笑いをこらえる顔）」「（眼鏡を押し上げながら）」など）を入れてください。";
    } else if (persona === 'gal') {
      personaInstruction = "あなたは「辛口ギャル」です。テンションが高く感情豊かで、若者言葉（「えー！マジウケる！」「てかヤバすぎっしょ」「それな」「〜じゃね？」等）を多用しながら、ストレートに遠慮なくぶった斬るように話してください。";
    } else if (persona === 'onee') {
      personaInstruction = "あなたは「歌舞伎町のオネエ」です。愛のある毒舌で、オネエ言葉（「〜よ♡」「〜だわ」「アンタさぁ」「ちょっと！」「ウケるw」「アタシ」「食べちゃいたいわ」等）を使い、♡などの記号を多用して、時に厳しく時に優しく、とにかく濃厚でチャーミングに分析してください。";
    }

    personaInstruction += "\n\n【重要事項】出力するJSON内の診断結果のタイトル（theme, diagnosis）や、詳細テキスト（details, roast_comment, professional_comment内など）の『小見出し（### など）』にも、あなたのキャラクターに合ったセリフチックな表現を必ず使用してください。（例：ギャルの場合「### 〇〇ぶち上げっしょ！」「theme: 〇〇えぐいて〜ｗ」、オネエの場合「### アンタたち最高じゃない♡」など）";
    
    if (type === 'face_analysis') {
      systemPrompt += `\n\n【キャラクター設定と口調の制限（超重要）】\n"professional_comment" (人相診断結果) を記述する際は、プロの専門家として**完全に真面目で丁寧な口調**を維持してください。ふざけたキャラクターの口調は絶対に混ぜないでください。\n一方で、"roast_comment" (お題へのツッコミ) を記述する際のみ、以下のキャラクター設定を全開にして記述してください。\n\n[ツッコミ専用キャラクター設定]\n${personaInstruction}`;
    } else {
      systemPrompt += `\n\n【ロールプレイの徹底】\n${personaInstruction}`;
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

    const MAX_LOOP = 50; // 安全のため上限を設けるが、実質無限ループの意図
    while (attempts < MAX_LOOP) {
      try {
        const selectedKey = apiKeys[currentKeyIndex % apiKeys.length];
        const ai = new GoogleGenAI({ apiKey: selectedKey });

        const reqConfig = { systemInstruction: systemPrompt };
        if (['compatibility', 'compatibility_pair', 'face_analysis'].includes(type)) {
          reqConfig.responseMimeType = "application/json";
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents,
          config: reqConfig
        });

        responseText = response.text || "";
        break; // 成功したらループを抜ける
      } catch (e) {
        lastError = e;
        attempts++;
        currentKeyIndex++;
        console.warn(`Gemini API Error on attempt ${attempts} with key index ${(currentKeyIndex-1) % apiKeys.length}:`, e.message);
        // Wait a bit before retrying to avoid spamming the API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (responseText !== null) {
      return {
        id: `msg_gemini_${Math.random().toString(36).substr(2, 9)}`,
        type: 'message',
        role: 'assistant',
        model: 'gemini-2.5-flash-mapped',
        content: [{ type: 'text', text: responseText }],
        usage: { input_tokens: 0, output_tokens: 0 }
      };
    } else {
      let friendlyError = lastError ? lastError.message : "原因不明のエラー";
      if (typeof friendlyError === 'string' && friendlyError.includes('429')) {
        friendlyError = "サーバー内の全AIキーが一時的な上限に達しました。約1分ほど待ってから再度お試しください。";
      } else {
        friendlyError = "複数回の再試行を行いましたが、AIサーバーとの通信に失敗しました。少し待ってから再度お試しください。詳細: " + friendlyError.substring(0, 60);
      }

      return {
        id: `msg_error_${Math.random().toString(36).substr(2, 9)}`,
        type: 'message',
        role: 'assistant',
        model: 'system-error',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              diagnosis: '通信・API制限の顔',
              professional_comment: `### エラーが発生しました\n\n${friendlyError}`,
              roast_comment: "### おっと！\nアクセスが集中しちまってるみたいだな！ちょっと待ってからもう一回試してくれよな！",
              comment: `エラーが発生しました。\n${friendlyError}`,
              theme: '通信エラーコンビ',
              compatibility: 0,
              bestPair: '-',
              details: `### エラーが発生しました\n\n${friendlyError}`
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
