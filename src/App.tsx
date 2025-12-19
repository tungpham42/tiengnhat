import React, { useState, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import {
  List,
  Card,
  Button,
  Typography,
  message,
  Tabs,
  Avatar,
  Row,
  Col,
  Breadcrumb,
  Empty,
  ConfigProvider,
  Tag,
  FloatButton,
} from "antd";
import {
  SoundOutlined,
  UserOutlined,
  ReadOutlined,
  HomeOutlined,
  ArrowLeftOutlined,
  BookOutlined,
  CommentOutlined,
  CoffeeOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "./App.css"; // Đảm bảo đã import file CSS
import { phrases, conversations } from "./data";
import { Phrase, Conversation, DialogueLine } from "./types";

const { Title, Text } = Typography;

// --- UTILS: Tạo Slug từ tiếng Việt ---
const createSlug = (str: string): string => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
};

// --- HOOK: Xử lý TTS (Text-to-Speech) ---
const useTTS = () => {
  const [loadingText, setLoadingText] = useState<string | null>(null);

  const playAudio = async (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (loadingText === text) return;

    try {
      setLoadingText(text);
      // Đảm bảo đường dẫn backend chính xác
      const response = await axios.get(`/.netlify/functions/tts?text=${text}`);

      if (response.data && response.data.audioContent) {
        const audio = new Audio(response.data.audioContent);
        await audio.play();
      }
    } catch (error) {
      console.error(error);
      message.error("Không thể phát âm thanh ở chế độ offline.");
    } finally {
      setLoadingText(null);
    }
  };

  return { playAudio, loadingText };
};

// --- COMPONENT: Hàng hội thoại (Thiết kế lại) ---
const DialogueRow = ({
  line,
  playAudio,
  loadingText,
}: {
  line: DialogueLine;
  playAudio: (t: string) => void;
  loadingText: string | null;
}) => {
  const isA = line.role === "A";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isA ? "flex-start" : "flex-end",
        marginBottom: "24px",
        alignItems: "flex-end", // Căn avatar xuống dưới cùng
        gap: "12px",
      }}
    >
      {isA && (
        <Avatar
          size={40}
          icon={<UserOutlined />}
          style={{ backgroundColor: "#d4a373", flexShrink: 0 }} // Màu gỗ ấm
        />
      )}

      <div style={{ maxWidth: "75%", position: "relative" }}>
        {/* Nhãn vai trò người nói */}
        <div
          style={{
            fontSize: "10px",
            color: "#aaa",
            marginBottom: "4px",
            textAlign: isA ? "left" : "right",
            padding: "0 4px",
          }}
        >
          {isA ? "Người A" : "Người B"}
        </div>

        <div className={`dialogue-bubble ${isA ? "bubble-a" : "bubble-b"}`}>
          <div className="japanese-text">{line.japanese}</div>
          <div className="romaji-text">{line.romaji}</div>
          <div className="vietnamese-text">{line.vietnamese}</div>

          <Button
            type="text"
            shape="circle"
            size="small"
            icon={<SoundOutlined />}
            loading={loadingText === line.japanese}
            onClick={() => playAudio(line.japanese)}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              color: "#aaa",
            }}
          />
        </div>
      </div>

      {!isA && (
        <Avatar
          size={40}
          icon={<CoffeeOutlined />} // Icon ấm cúng
          style={{ backgroundColor: "#557c55", flexShrink: 0 }} // Màu xanh Matcha
        />
      )}
    </div>
  );
};

// --- PAGE: Trang chủ (Thư viện) ---
const HomePage = () => {
  const categories = useMemo(() => {
    const allCats = new Set([
      ...phrases.map((p) => p.category),
      ...conversations.map((c) => c.category),
    ]);
    return Array.from(allCats)
      .sort()
      .map((cat) => ({
        name: cat,
        slug: createSlug(cat),
      }));
  }, []);

  return (
    <div className="home-container">
      <div className="section-header">
        <Title level={1} style={{ marginBottom: 8, color: "#557c55" }}>
          <span role="img" aria-label="japan">
            🇯🇵
          </span>{" "}
          Sổ Tay Tiếng Nhật
        </Title>
        <Text type="secondary">
          Góc nhỏ ấm cúng để học tiếng Nhật mỗi ngày.
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {categories.map((catObj) => (
          <Col xs={24} sm={12} md={8} key={catObj.slug}>
            <Link to={`/danh-muc/${catObj.slug}`}>
              <Card hoverable className="study-card category-card">
                <div className="category-icon-wrapper">
                  <ReadOutlined />
                </div>
                <Title level={4} style={{ marginBottom: 16 }}>
                  {catObj.name}
                </Title>
                <div
                  style={{ display: "flex", justifyContent: "center", gap: 12 }}
                >
                  <Tag color="geekblue" style={{ borderRadius: 12 }}>
                    <BookOutlined />{" "}
                    {phrases.filter((p) => p.category === catObj.name).length}{" "}
                    từ
                  </Tag>
                  <Tag color="orange" style={{ borderRadius: 12 }}>
                    <CommentOutlined />{" "}
                    {
                      conversations.filter((c) => c.category === catObj.name)
                        .length
                    }{" "}
                    bài
                  </Tag>
                </div>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
};

// --- PAGE: Chi tiết Danh mục (Sổ tay học tập) ---
const CategoryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { playAudio, loadingText } = useTTS();

  const categoryName = useMemo(() => {
    const allCats = new Set([
      ...phrases.map((p) => p.category),
      ...conversations.map((c) => c.category),
    ]);
    return Array.from(allCats).find((cat) => createSlug(cat) === slug);
  }, [slug]);

  const currentPhrases = useMemo(
    () => phrases.filter((p) => p.category === categoryName),
    [categoryName]
  );

  const currentConversations = useMemo(
    () => conversations.filter((c) => c.category === categoryName),
    [categoryName]
  );

  if (!categoryName) return <Empty description="Không tìm thấy chủ đề này" />;

  return (
    <div>
      <div style={{ marginBottom: 30 }}>
        <Breadcrumb
          items={[
            {
              title: (
                <Link to="/">
                  <HomeOutlined /> Trang chủ
                </Link>
              ),
            },
            { title: categoryName },
          ]}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          marginBottom: 30,
          gap: 10,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/")}
          style={{ color: "#888" }}
        />
        <Title level={2} style={{ margin: 0 }}>
          {categoryName}
        </Title>
      </div>

      <Tabs
        defaultActiveKey="1"
        centered
        size="large"
        items={[
          {
            label: (
              <span>
                <BookOutlined /> Thẻ Từ Vựng
              </span>
            ),
            key: "1",
            children: (
              <List
                grid={{ gutter: 24, column: 1, xs: 1, sm: 1, md: 2 }}
                dataSource={currentPhrases}
                renderItem={(item: Phrase) => (
                  <List.Item>
                    <Card
                      hoverable
                      className="study-card"
                      actions={[
                        <Button
                          type="text"
                          block
                          icon={<SoundOutlined />}
                          loading={loadingText === item.japanese}
                          onClick={() => playAudio(item.japanese)}
                          style={{ color: "#557c55", fontWeight: "bold" }}
                        >
                          Nghe phát âm
                        </Button>,
                      ]}
                    >
                      <div style={{ textAlign: "center", padding: "10px 0" }}>
                        <div
                          className="japanese-text"
                          style={{ fontSize: "1.5rem" }}
                        >
                          {item.japanese}
                        </div>
                        <div
                          className="romaji-text"
                          style={{ margin: "8px 0" }}
                        >
                          /{item.romaji}/
                        </div>
                        <div
                          style={{
                            fontSize: "1.1rem",
                            color: "#555",
                            fontWeight: 600,
                          }}
                        >
                          {item.vietnamese}
                        </div>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            ),
          },
          {
            label: (
              <span>
                <CommentOutlined /> Luyện Hội Thoại
              </span>
            ),
            key: "2",
            children:
              currentConversations.length > 0 ? (
                <List
                  dataSource={currentConversations}
                  itemLayout="vertical"
                  renderItem={(conv: Conversation) => (
                    <Card
                      className="study-card"
                      style={{ marginBottom: "30px", overflow: "hidden" }}
                      title={
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <span style={{ fontSize: "1.5rem" }}>📝</span>
                          <span>{conv.title}</span>
                        </div>
                      }
                    >
                      <div style={{ padding: "10px" }}>
                        {conv.lines.map((line, index) => (
                          <DialogueRow
                            key={index}
                            line={line}
                            playAudio={playAudio}
                            loadingText={loadingText}
                          />
                        ))}
                      </div>
                    </Card>
                  )}
                />
              ) : (
                <Empty
                  description="Chưa có bài hội thoại nào cho chủ đề này."
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
          },
        ]}
      />
    </div>
  );
};

// --- MAIN APP ---
// Cấu hình Theme với màu xanh Matcha và tông màu gỗ ấm áp
const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#557c55", // Xanh Matcha
          fontFamily: "'Nunito', sans-serif",
          borderRadius: 12,
          colorBgContainer: "#ffffff",
          colorBgLayout: "#fafaf5", // Nền màu kem/giấy gạo
        },
        components: {
          Card: {
            headerFontSize: 18,
          },
          Typography: {
            fontFamilyCode: "'Noto Serif JP', serif",
          },
        },
      }}
    >
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/danh-muc/:slug" element={<CategoryPage />} />
          </Routes>

          <FloatButton.BackTop
            type="primary"
            icon={<VerticalAlignTopOutlined />}
            style={{ right: 24, bottom: 24 }}
          />

          <div
            style={{
              textAlign: "center",
              marginTop: 60,
              color: "#a5a5a5",
              fontSize: "0.9rem",
            }}
          >
            <Text type="secondary" italic>
              Học tập là một hành trình, không phải là đích đến. ©{" "}
              {new Date().getFullYear()} Sổ Tay Tiếng Nhật
            </Text>
          </div>
        </div>
      </Router>
    </ConfigProvider>
  );
};

export default App;
