import { TrashIcon } from "@phosphor-icons/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteJobButton({
  title,
  onConfirm,
  disabled,
  iconOnly,
}: {
  title: string;
  onConfirm: () => void;
  disabled?: boolean;
  iconOnly?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        disabled={disabled}
        render={
          <Button
            variant={iconOnly ? "ghost" : "destructive"}
            size={iconOnly ? "icon-sm" : "sm"}
            aria-label={iconOnly ? `删除「${title}」` : undefined}
            title={iconOnly ? "删除" : undefined}
          />
        }
      >
        <TrashIcon aria-hidden />
        {!iconOnly && "删除"}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除这个任务？</AlertDialogTitle>
          <AlertDialogDescription>
            「{title}」的源 PDF、MinerU 结果和编译产物都会被删除，无法恢复。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>删除</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
