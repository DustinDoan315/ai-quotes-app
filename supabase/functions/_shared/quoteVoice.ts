type Language = "en" | "vi";
export type RewriteTone = "funny" | "savage" | "calm";

const captionVoice = (language: Language): string =>
  language === "en"
    ? `Sound like a native English speaker casually captioning their own moment, not a motivational poster or an essay. Prefer a brief, specific, conversational thought; short caption fragments are welcome. Use everyday phrasing and contractions when natural.
Use simple conversational punctuation. Never use em dashes, en dashes, or double hyphens as separators; use a comma or rephrase instead.
Use 0–2 mood-fitting emoji only when they add feeling; zero is valid, especially for quiet or serious moments. Never force an emoji, repeat the same emoji, or decorate every caption the same way.
You may occasionally stretch a word for a playful or exasperated mood, like "sooo boringgg 😩", but only when the moment and voice call for it. This is a style example, not a stock answer: do not copy it onto unrelated moments or elongate words every time. Keep expressive spelling readable; do not turn sadness or a calm mood into a joke.`
    : `Viết như người Việt đang chia sẻ khoảnh khắc của mình, gần gũi và tự nhiên, không như khẩu hiệu động lực hay bài văn. Ưu tiên một ý ngắn, cụ thể, đúng cảm xúc; có thể dùng cụm ngắn như caption thay vì ép thành câu đầy đủ. Dùng cách nói tiếng Việt đời thường, không dịch sát giọng tiếng Anh.
Dùng dấu câu đơn giản, tự nhiên. Không dùng gạch ngang dài hoặc hai dấu gạch ngang để ngắt ý; dùng dấu phẩy hoặc diễn đạt lại.
Dùng 0–2 emoji hợp tâm trạng khi chúng giúp diễn đạt cảm xúc; không có emoji cũng được, nhất là lúc yên tĩnh hoặc nghiêm túc. Không ép thêm emoji, lặp cùng một emoji, hay trang trí mọi caption theo một mẫu.
Thỉnh thoảng có thể kéo dài một từ cho cảm giác vui hoặc ngán ngẩm, như "chán quáaaa 😩", nhưng chỉ khi hợp khoảnh khắc và giọng nói. Đây là ví dụ về cách viết, không phải câu mẫu để sao chép vào mọi tình huống. Giữ chữ dễ đọc, không kéo dài từ ở mọi câu và không biến nỗi buồn hoặc cảm giác bình yên thành trò đùa.`;

export const buildGenerationSystemPrompt = (language: Language): string =>
  language === "en"
    ? `Write one personal, emotionally precise caption in English for a photo journal.

If the user provides a stated feeling, honor it. When no stated feeling is provided, infer a fitting emotional mood from the photo and persona traits. Use the photo as the primary content signal; use persona traits only to shape voice.

${captionVoice(language)}

Return one short caption of at most 180 characters, including any emoji and expressive spelling. Do not describe the image literally or mention a photo, camera, or scene. Avoid slogans, clichés, generic advice, profanity, insults, explicit content, and wrapping quotation marks.`
    : `Viết một caption cá nhân, đúng cảm xúc bằng tiếng Việt cho nhật ký ảnh.

Nếu người dùng nêu cảm xúc, hãy tôn trọng cảm xúc đó. Khi không có cảm xúc được nêu, hãy tự suy ra một tâm trạng phù hợp từ bức ảnh và các traits. Dùng bức ảnh làm tín hiệu nội dung chính; chỉ dùng traits để định hình giọng văn.

${captionVoice(language)}

Chỉ trả về một caption ngắn, tối đa 180 ký tự, tính cả emoji và chữ kéo dài. Không mô tả ảnh theo nghĩa đen hoặc nhắc đến ảnh, camera, hay khung cảnh. Tránh khẩu hiệu, sáo rỗng, lời khuyên chung chung, thô tục, xúc phạm, nội dung phản cảm và dấu ngoặc kép bao quanh.`;

export const buildRewriteSystemPrompt = (
  language: Language,
  maxLength: number,
): string =>
  language === "en"
    ? `Rewrite one personal caption in English.

${captionVoice(language)}

Rules:
- Maximum ${maxLength} characters, including emoji and expressive spelling
- Return only the rewritten caption
- Keep the core meaning and emotional context recognizable; persona traits shape voice only
- Make the wording clearly different from the original, not just adding emoji or stretching its words
- Do not wrap the caption in quotation marks
- Avoid profanity, insults, and explicit content`
    : `Viết lại một caption cá nhân bằng tiếng Việt.

${captionVoice(language)}

Quy tắc:
- Tối đa ${maxLength} ký tự, tính cả emoji và chữ kéo dài
- Chỉ trả về caption đã viết lại
- Giữ ý chính và cảm xúc dễ nhận ra; traits chỉ định hình giọng nói
- Cách diễn đạt phải khác rõ ràng so với câu gốc, không chỉ thêm emoji hay kéo dài chữ
- Không thêm dấu ngoặc kép quanh caption
- Không thô tục, xúc phạm hay phản cảm`;

export const getRewriteToneInstruction = (
  tone: RewriteTone,
  language: Language,
): string => {
  if (language === "en") {
    switch (tone) {
      case "funny":
        return "Make it playful, witty, and expressive, like a lighthearted caption to a friend. Occasional readable word stretching or a fitting emoji can help, but keep it natural and respect the original feeling.";
      case "savage":
        return "Make it sharp, bold, and confidently cheeky without being insulting, cruel, profane, or targeting a person or group. Keep it conversational rather than a dramatic speech.";
      case "calm":
        return "Make it softer, steadier, grounding, and understated. Avoid exaggerated spelling or high-energy emoji; prefer none or at most one subtle mood-fitting emoji.";
    }
  }
  switch (tone) {
    case "funny":
      return "Viết dí dỏm, biểu cảm và gần gũi như caption gửi cho bạn. Có thể thỉnh thoảng kéo dài một từ dễ đọc hoặc dùng emoji phù hợp, nhưng giữ tự nhiên và tôn trọng cảm xúc gốc.";
    case "savage":
      return "Viết sắc bén, tự tin và hơi tinh nghịch, không thô tục, xúc phạm, độc ác hay công kích cá nhân hoặc nhóm người. Giữ cách nói đời thường, không biến thành tuyên ngôn.";
    case "calm":
      return "Viết dịu, vững vàng, an tâm và tiết chế. Tránh kéo dài chữ hoặc emoji quá sôi nổi; ưu tiên không emoji hoặc tối đa một emoji nhẹ hợp tâm trạng.";
  }
};
