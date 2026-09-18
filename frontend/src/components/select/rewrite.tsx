import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { useIntl } from "react-intl";

export type RewriteMode = "comedy" | "formal" | "casual";

interface RewriteModeItem {
  labelId: string;
  value: RewriteMode;
}

const rewriteModes: RewriteModeItem[] = [
  { labelId: "rewrite.comedy", value: "comedy" },
  { labelId: "rewrite.formal", value: "formal" },
  { labelId: "rewrite.casual", value: "casual" },
];

interface RewriteProps {
  value?: RewriteMode;
  onValueChange?: (value: RewriteMode) => void;
}

export function Rewrite({ value, onValueChange }: RewriteProps) {
  const { formatMessage } = useIntl();

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className=" max-w-50 flex items-center gap-2 ">
        <SelectValue placeholder={formatMessage({ id: "rewrite.placeholder" })} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{formatMessage({ id: "rewrite.label" })}</SelectLabel>
          {rewriteModes.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 " />
                <span>{formatMessage({ id: item.labelId })}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
