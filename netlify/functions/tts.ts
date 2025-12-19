import { Handler } from "@netlify/functions";
import axios from "axios";

export const handler: Handler = async (event) => {
  const { text } = event.queryStringParameters || {};

  if (!text) {
    return { statusCode: 400, body: "Missing text parameter" };
  }

  try {
    // Gọi đến Google TTS
    // client=tw-ob: Client public của Google
    // tl=ja: Target language là tiếng Nhật
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ja&q=${encodeURIComponent(
      text
    )}`;

    const response = await axios.get(url, {
      responseType: "arraybuffer", // Quan trọng: nhận về dữ liệu nhị phân
      headers: {
        "User-Agent": "Mozilla/5.0", // Giả lập trình duyệt để tránh bị chặn
      },
    });

    // Chuyển đổi buffer sang base64 để gửi về frontend
    const audioBase64 = Buffer.from(response.data, "binary").toString("base64");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audioContent: `data:audio/mpeg;base64,${audioBase64}`,
      }),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: "Error fetching audio" };
  }
};
