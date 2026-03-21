import { useSearchParams } from "react-router-dom";

import { Input } from "../ui/input";
import StoreDepartments from "./StoreDepartments";
import StoreInfo from "./StoreInfo";

const StoreSidebar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const onChangeQuery = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value.trim()) {
      next.set("q", value);
    } else {
      next.delete("q");
    }
    setSearchParams(next);
  };

  return (
    <aside className="border border-white/10 bg-white/5 p-4 rounded-2xl h-fit sticky top-28">
      <Input
        placeholder="Search in store..."
        value={query}
        onChange={(e) => onChangeQuery(e.target.value)}
        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-amber-300/40"
      />
      <StoreInfo />
      <StoreDepartments />
    </aside>
  );
};

export default StoreSidebar;
