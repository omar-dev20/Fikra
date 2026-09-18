import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { CircleFadingPlus, Search, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useMemo } from "react";
import { useNotesAPI } from "@/hooks/useNotesApi";
import type { Note } from "@/types";
import { useNavigate } from "react-router-dom";
import { FormattedMessage, useIntl } from "react-intl";
import { useLang } from "@/hooks/useLang";

export function HomePage() {
  const { getAllNotes, createNote } = useNotesAPI();
  const [notes, setNotes] = useState<Note[]>([]);
  const [btnclicked, setBtnclicked] = useState(false);
  const { formatMessage } = useIntl();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();
  const { path } = useLang();

  useEffect(() => {
    const fetchNotes = async () => {
      const notes = await getAllNotes();
      setNotes(notes);
    };
    fetchNotes();
  }, [getAllNotes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setIsSearching(search !== debouncedSearch);
  }, [search, debouncedSearch]);

  const handleClick = async () => {
    const note = await createNote({
      title: formatMessage({ id: "home.newNoteTitle" }),
      content: "",
    });
    if (note && !btnclicked) {
      navigate(path(`/notes/${note.id}`));
    } else {
      setBtnclicked(true);
    }
  };
  const handleNoteClick = (id: string) => {
    navigate(path(`/notes/${id}`));
  };
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((note) =>
      note.title.toLowerCase().includes(debouncedSearch.toLowerCase()),
    );
  }, [notes, debouncedSearch]);

  return (
    <div className="space-y-12 ">
      <GlassCard className=" py-6 sm:px-10 flex flex-col gap-4">
        <div className="flex items-center heading  text-xs justify-between ">
          <h1 className="text-lg font-bold  sm:text-xl">
            <FormattedMessage id="home.myDrafts" />
          </h1>
          <Button variant={"default"} onClick={handleClick}>
            <CircleFadingPlus /> <FormattedMessage id="home.addDraft" />
          </Button>
        </div>
        <div className=" relative Input">
          {isSearching ? (
            <Loader className="absolute start-2 translate-y-[7px] h-5 w-5 animate-spin" />
          ) : (
            <Search className="absolute start-2 translate-y-[7px] h-5 w-5" />
          )}
          <Input
            placeholder={formatMessage({ id: "home.searchPlaceholder" })}
            className="ps-8"
            value={search}
            onChange={handleSearch}
          ></Input>
        </div>
        <div className="flex flex-col gap-2">
          {isSearching ? (
            <div className="flex justify-center py-4">
              <Loader className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            filteredNotes.map((note) => (
              <GlassCard
                className="m-2 p-4 cursor-pointer"
                key={note.id}
                onClick={() => handleNoteClick(note.id)}
              >
                <div>
                  <h1 className="text-lg font-bold sm:text-xl">
                    {note.title || formatMessage({ id: "home.newNoteTitle" })}
                  </h1>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}
