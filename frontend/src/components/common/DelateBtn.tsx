import { Trash2Icon } from "lucide-react";

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
import { FormattedMessage } from "react-intl";

type DeleteBtnProps = {
  handleDelete: () => void;
  title: string;
  content: string;
};

export function DeleteBtn({ handleDelete, title, content }: DeleteBtnProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">{title}</Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive mb-2">
            <Trash2Icon className="h-6 w-6" />
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{content}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <FormattedMessage id="note.cancel" />
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            <FormattedMessage id="note.confirmDelete" />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
