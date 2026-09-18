import { useEffect  } from "react";
import type { Note } from "@/types";
import { useState } from "react";
import type { SaveStatus } from "@/types";
 type Props = {
  note: Note | null;
  isEditing: boolean;
   handleSave: () => void;
};
function useNoteSave( {note,isEditing,handleSave}:Props) {
      const [saveStatus, setSaveStatus] = useState<SaveStatus>("initial");
     useEffect(() => {
  if (!note || !isEditing) return;
  const timeoutId = setTimeout(async () => {
     
    handleSave();
  
  }, 1000);

  return () => clearTimeout(timeoutId);
   // eslint-disable-next-line react-hooks/exhaustive-deps
}, [note?.title, note?.content , isEditing , handleSave]);

 return { saveStatus , setSaveStatus };
}
export { useNoteSave }; 