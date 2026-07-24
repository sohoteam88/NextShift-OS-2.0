import { describe, expect, it } from "vitest";
import type { GeneratedPost } from "./types";
import { parseGeneratedPostJson } from "./contentPostGeneration";

const fallback: GeneratedPost = {
  id: "fallback-id",
  pillar: "教育",
  pillarEmoji: "💡",
  title: "基础标题",
  hook: "基础开场",
  body: "基础正文",
  cta: "基础行动",
  hashtags: ["#基础"],
  platform: "facebook",
  format: "text_post",
  funnelStage: "awareness",
  status: "generated",
  qualityScore: 72,
  generatedByAi: false,
  degradedLabel: "AI 暂时不可用，这是基础版本",
  createdAt: "2026-07-25T00:00:00.000Z",
  updatedAt: "2026-07-25T00:00:00.000Z",
};

const body =
  "这是一段足够长的正文，用来确认解析器会继续检查其他字段，同时保留具体观点、可执行建议和自然的阅读节奏。".repeat(
    3,
  );

function json(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    title: "AI 标题",
    hook: "AI 开场",
    body,
    cta: "AI 行动",
    hashtags: ["#内容", "#成长"],
    ...overrides,
  });
}

describe("parseGeneratedPostJson", () => {
  it.each(["纯文本，没有结构化输出", ""])(
    "rejects input without a JSON object: %j",
    (input) => {
      expect(() => parseGeneratedPostJson(input, fallback)).toThrow(
        "AI content response did not contain a JSON object",
      );
    },
  );

  it("rejects braces that do not contain valid JSON syntax", () => {
    expect(() =>
      parseGeneratedPostJson("{title: not valid JSON}", fallback),
    ).toThrow("AI content response contained invalid JSON");
  });

  it.each(["title", "hook", "body", "cta"] as const)(
    "rejects a missing required field: %s",
    (field) => {
      const value = JSON.parse(json()) as Record<string, unknown>;
      delete value[field];

      expect(() =>
        parseGeneratedPostJson(JSON.stringify(value), fallback),
      ).toThrow(`AI content response ${field} must be a non-empty string`);
    },
  );

  it("rejects a body shorter than 80 characters", () => {
    expect(() =>
      parseGeneratedPostJson(json({ body: "太短的正文" }), fallback),
    ).toThrow("AI content response body was too short");
  });

  it.each([
    ["missing", undefined],
    ["non-array", "#内容"],
    ["non-string element", ["#内容", 42]],
  ])(
    "rejects hashtags that are not a string array: %s",
    (_caseName, hashtags) => {
      const value = JSON.parse(json()) as Record<string, unknown>;
      if (hashtags === undefined) delete value.hashtags;
      else value.hashtags = hashtags;

      expect(() =>
        parseGeneratedPostJson(JSON.stringify(value), fallback),
      ).toThrow("AI content response hashtags must be a string array");
    },
  );

  it("returns the parsed fields while preserving fallback fields and normalizing hashtags", () => {
    const result = parseGeneratedPostJson(
      json({ hashtags: ["  #内容 ", "", "   ", "#成长"] }),
      fallback,
    );

    expect(result).toMatchObject({
      ...fallback,
      title: "AI 标题",
      hook: "AI 开场",
      body,
      cta: "AI 行动",
      hashtags: ["#内容", "#成长"],
    });
  });
});
