import { render, screen } from "@testing-library/react";
import { ContextBus } from "./ContextBus";

describe("ContextBus", () => {
  it("shows the exact total context size when segments have content", () => {
    render(
      <ContextBus
        error={null}
        segments={[
          { label: "故事圣经", value: 5, tone: "cyan" },
          { label: "角色记忆", value: 7, tone: "magenta" },
        ]}
      />,
    );

    expect(screen.getByText("12 字符信号")).toBeInTheDocument();
  });
});
