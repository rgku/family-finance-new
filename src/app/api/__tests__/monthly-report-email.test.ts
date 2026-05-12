import { describe, it, expect } from "@jest/globals";

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

describe("escapeHtml", () => {
  it("should escape angle brackets", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe("&lt;script&gt;alert('xss')&lt;/script&gt;");
  });

  it("should escape double quotes", () => {
    expect(escapeHtml('"onerror="alert(1)')).toBe("&quot;onerror=&quot;alert(1)");
  });

  it("should escape ampersands", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B");
  });

  it("should handle clean strings unchanged", () => {
    expect(escapeHtml("Alimentação")).toBe("Alimentação");
  });

  it("should escape all special characters in one string", () => {
    expect(escapeHtml('<div class="test">&</div>'))
      .toBe("&lt;div class=&quot;test&quot;&gt;&amp;&lt;/div&gt;");
  });

  it("should handle empty strings", () => {
    expect(escapeHtml("")).toBe("");
  });
});
