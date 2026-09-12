import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { me, type Me } from "@/lib/session.functions";

export function useMe() {
  const fetchMe = useServerFn(me);
  return useQuery<Me>({
    queryKey: ["me"],
    queryFn: () => fetchMe(),
    staleTime: 5 * 60_000,
  });
}
