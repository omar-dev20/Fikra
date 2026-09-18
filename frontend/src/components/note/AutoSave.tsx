import type { SaveStatus } from "@/types";
import { OctagonAlert, Save, LoaderCircle } from "lucide-react";
import { FormattedMessage } from "react-intl";
type Props = {
  saveStatus: SaveStatus;
};
function AutoSave({ saveStatus }: Props) {
  switch (saveStatus) {
    case "saving":
      return (
        <div className=" text-sm flex gap-2 item-center text-blue-500 dark:text-blue-600">
          <LoaderCircle className="animate-spin h-5 w-5 duration-300 transition" />{" "}
          <FormattedMessage id="autoSave.saving" />
        </div>
      );
    case "saved":
      return (
        <div className=" text-sm flex gap-2 item-center text-green-500 dark:text-green-600">
          <Save /> <FormattedMessage id="autoSave.saved" />
        </div>
      );
    case "unsaved":
      return (
        <div className=" text-sm flex gap-2 item-center text-red-500 dark:text-red-600">
          <OctagonAlert /> <FormattedMessage id="autoSave.unsaved" />
        </div>
      );
    case "initial":
    default:
      return null;
  }
}
export default AutoSave;
