import {useAuth} from "@clerk/react";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import type { Note ,CreateNoteDTO , SaveNoteDTO  } from "@/types";
import { toast } from "sonner";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
 function useNotesAPI() {
  const { getToken } = useAuth();
  const { formatMessage } = useIntl();
  const getAllNotes = useCallback(async () => {
    const token = await getToken();

    if (!token) {
      console.error("No token found");
      return [];
    }

    const response = await fetch(API_BASE_URL + "/api/notes", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data: { notes: Note[] } = await response.json();
    return data.notes;
  }, [getToken]);
  const createNote = async (note:CreateNoteDTO )=>{
        const token = await getToken();
        if (!token){
          console.error("No Token Found");
          toast.error(formatMessage({ id: "header.NoToken" }));
          return null;
        }
        const response = await fetch( API_BASE_URL + "/api/notes",{
          method:"POST",
          headers:{
          "Authorization": `Bearer ${token}`,
          "Content-Type":"application/json"
          },
          body:JSON.stringify(note)
          
        })
        const data:{note: Note} =await response.json();
        return data.note
   }
   const getNote = useCallback(async (id:string)=>{
     const token = await getToken();
     if (!token){
       console.error("No Token Found");
       return null;
     }
     const response = await fetch( API_BASE_URL + `/api/notes/${id}`,{
       method:"GET",
       headers:{
       "Authorization": `Bearer ${token}`,
       "Content-Type":"application/json"
       },
       
     })
     const data:{note: Note} =await response.json();
     return data.note
   } ,[getToken]);
  const saveNote = async ( id:string, note:  SaveNoteDTO ) => {
    const token = await getToken();
    if (!token) {
      console.error("No token found");
      return;
    }

    const response = await fetch(API_BASE_URL + `/api/notes/${id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(note)
    });

    const data: { note: Note } = await response.json();
    return data.note;
  };
  const deleteNote = async (id:string)=>{
    const token = await getToken();
    if (!token) {
      console.error("No token found");
      return null;
    }
  const response = await fetch(API_BASE_URL + `/api/notes/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    return response.ok;
  };
 
  return { getAllNotes ,createNote, getNote , saveNote , deleteNote};

}
export { useNotesAPI };
