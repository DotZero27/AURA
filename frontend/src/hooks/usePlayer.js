import { useQuery } from "@tanstack/react-query";
import { playersApi } from "@/lib/api";

// Get player details by ID
export function usePlayer(id) {
  return useQuery({
    queryKey: ["player", id],
    queryFn: async () => {
      const response = await playersApi.getById(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}






