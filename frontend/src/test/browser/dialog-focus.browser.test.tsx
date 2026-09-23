import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "vitest/browser";
import { expect, it } from "vitest";

it("keeps Tab inside the dialog and restores the trigger on Escape", async () => {
  render(
    <>
      <Dialog>
        <DialogTrigger>打开测试弹窗</DialogTrigger>
        <DialogContent>
          <DialogTitle>项目设置</DialogTitle>
          <DialogDescription>修改当前项目</DialogDescription>
          <button type="button">保存</button>
        </DialogContent>
      </Dialog>
      <button type="button">外部按钮</button>
    </>,
  );

  const trigger = screen.getByRole("button", { name: "打开测试弹窗" });
  await userEvent.click(trigger);
  const dialog = await screen.findByRole("dialog", { name: "项目设置" });
  await waitFor(() => {
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  for (let step = 0; step < 6; step += 1) {
    await userEvent.tab();
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  }

  await userEvent.keyboard("{Escape}");
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  await waitFor(() => {
    expect(document.activeElement).toBe(trigger);
  });
});
